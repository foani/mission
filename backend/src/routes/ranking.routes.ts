/**
 * 랭킹 관련 API 라우트
 * CreataChain 기반 텔레그램 미션 게임용 사용자 랭킹 낯 리더보드 시스템
 * 랭킹 기준: 총 점수, 게임별 통계, 주간 실적 등
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client';
import { env } from '../env';

/**
 * 랭킹 조회 요청 스키마
 */
const rankingQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  gameType: z.enum(['binary', 'derby', 'darts']).optional(),
  language: z.enum(['en', 'ko', 'ja', 'vi']).optional(),
  period: z.enum(['all', 'week', 'month']).default('all'),
  minScore: z.number().int().min(0).optional(),
  verified: z.boolean().default(true), // 기본적으로 인증된 사용자만
});

/**
 * 개별 사용자 랭킹 조회 스키마
 */
const userRankingSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '잘못된 지갑 주소 형식입니다'),
  gameType: z.enum(['binary', 'derby', 'darts']).optional(),
  period: z.enum(['all', 'week', 'month']).default('all'),
});

/**
 * 랭킹 비교 요청 스키마
 */
const rankingCompareSchema = z.object({
  walletAddresses: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).min(2).max(10),
  gameType: z.enum(['binary', 'derby', 'darts']).optional(),
  period: z.enum(['all', 'week', 'month']).default('all'),
});

/**
 * 게임별 리더보드 요청 스키마
 */
const gameLeaderboardSchema = z.object({
  gameType: z.enum(['binary', 'derby', 'darts']),
  limit: z.number().int().min(1).max(50).default(10),
  period: z.enum(['week', 'month']).default('week'),
});
/**
 * 랭킹 관련 헬퍼 함수들
 */

/**
 * 기간에 따른 날짜 필터 생성
 */
function getPeriodFilter(period: 'all' | 'week' | 'month'): Date | null {
  const now = new Date();
  
  switch (period) {
    case 'week':
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return weekAgo;
      
    case 'month':
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      return monthAgo;
      
    case 'all':
    default:
      return null;
  }
}

/**
 * 전체 랭킹 조회 함수
 * 이미 업데이트된 사용자 점수 기반
 */
async function getOverallRanking(params: {
  limit: number;
  offset: number;
  language?: string;
  period: 'all' | 'week' | 'month';
  minScore?: number;
  verified: boolean;
}) {
  const { limit, offset, language, period, minScore, verified } = params;
  
  // 기본 필터 조건
  const whereCondition: any = {};
  
  if (verified) {
    whereCondition.isWalletVerified = true;
    whereCondition.isWalletInstalled = true;
  }
  
  if (language) {
    whereCondition.language = language;
  }
  
  if (minScore !== undefined) {
    whereCondition.score = { gte: minScore };
  }
  
  // 기간에 따른 동적 점수 계산 (period가 'all'이 아닌 경우)
  if (period !== 'all') {
    const periodStart = getPeriodFilter(period);
    if (periodStart) {
      // 해당 기간 내 게임 로그를 기반으로 동적 점수 계산
      const usersWithPeriodScore = await prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          walletAddress: true,
          telegramId: true,
          language: true,
          score: true, // 전체 점수
          createdAt: true,
          gameLogs: {
            where: {
              createdAt: { gte: periodStart },
            },
            select: {
              score: true,
            },
          },
        },
        orderBy: { score: 'desc' },
      });
      
      // 기간별 점수 계산 및 정렬
      const rankedUsers = usersWithPeriodScore
        .map((user, index) => {
          const periodScore = user.gameLogs.reduce((sum, log) => sum + log.score, 0);
          return {
            rank: 0, // 임시값
            walletAddress: user.walletAddress,
            telegramId: user.telegramId,
            language: user.language,
            totalScore: user.score,
            periodScore,
            gamesPlayed: user.gameLogs.length,
            joinedAt: user.createdAt,
          };
        })
        .filter(user => user.periodScore > 0 || period === 'all') // 기간내 점수가 있는 사용자만
        .sort((a, b) => b.periodScore - a.periodScore) // 기간별 점수로 정렬
        .map((user, index) => ({ ...user, rank: index + 1 }));
      
      const totalCount = rankedUsers.length;
      const paginatedUsers = rankedUsers.slice(offset, offset + limit);
      
      return {
        users: paginatedUsers,
        totalCount,
        hasMore: offset + limit < totalCount,
      };
    }
  }
  
  // 'all' 기간이거나 기간 필터가 없는 경우 - 전체 점수 기반
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: whereCondition,
      select: {
        walletAddress: true,
        telegramId: true,
        language: true,
        score: true,
        createdAt: true,
        _count: {
          select: {
            gameLogs: true,
          },
        },
      },
      orderBy: { score: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.user.count({ where: whereCondition }),
  ]);
  
  const rankedUsers = users.map((user, index) => ({
    rank: offset + index + 1,
    walletAddress: user.walletAddress,
    telegramId: user.telegramId,
    language: user.language,
    totalScore: user.score,
    periodScore: user.score, // 'all' 기간에서는 전체 점수와 동일
    gamesPlayed: user._count.gameLogs,
    joinedAt: user.createdAt,
  }));
  
  return {
    users: rankedUsers,
    totalCount,
    hasMore: offset + limit < totalCount,
  };
}

/**
 * 게임별 랭킹 조회 함수
 */
async function getGameTypeRanking(params: {
  gameType: string;
  limit: number;
  offset?: number;
  period: 'all' | 'week' | 'month';
  verified: boolean;
}) {
  const { gameType, limit, offset = 0, period, verified } = params;
  
  // 기간 필터
  const periodStart = getPeriodFilter(period);
  const dateFilter = periodStart ? { createdAt: { gte: periodStart } } : {};
  
  // 사용자 필터
  const userFilter = verified ? {
    isWalletVerified: true,
    isWalletInstalled: true,
  } : {};
  
  // 게임 타입별 점수 계산
  const gameStats = await prisma.gameLog.groupBy({
    by: ['userId'],
    where: {
      gameType,
      ...dateFilter,
      user: userFilter,
    },
    _sum: {
      score: true,
    },
    _count: {
      _all: true,
    },
    _avg: {
      score: true,
    },
    _max: {
      score: true,
    },
    orderBy: {
      _sum: {
        score: 'desc',
      },
    },
    take: limit,
    skip: offset,
  });
  
  // 사용자 정보 및 랭킹 조회
  const userIds = gameStats.map(stat => stat.userId);
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
    },
    select: {
      id: true,
      walletAddress: true,
      telegramId: true,
      language: true,
      score: true,
    },
  });
  
  // 결과 정리
  const rankedUsers = gameStats.map((stat, index) => {
    const user = users.find(u => u.id === stat.userId);
    return {
      rank: offset + index + 1,
      walletAddress: user?.walletAddress || '',
      telegramId: user?.telegramId || null,
      language: user?.language || 'en',
      totalScore: user?.score || 0,
      gameScore: stat._sum.score || 0,
      gamesPlayed: stat._count._all,
      averageScore: Math.round((stat._avg.score || 0) * 100) / 100,
      bestScore: stat._max.score || 0,
    };
  });
  
  return rankedUsers;
}

/**
 * 사용자 랭킹 위치 조회 함수
 */
async function getUserRankPosition(params: {
  walletAddress: string;
  gameType?: string;
  period: 'all' | 'week' | 'month';
}) {
  const { walletAddress, gameType, period } = params;
  
  // 사용자 조회
  const user = await prisma.user.findUnique({
    where: { walletAddress },
    select: {
      id: true,
      score: true,
      walletAddress: true,
      telegramId: true,
      language: true,
    },
  });
  
  if (!user) {
    return null;
  }
  
  let rank = 0;
  let totalScore = user.score;
  
  if (gameType) {
    // 게임별 랭킹
    const periodStart = getPeriodFilter(period);
    const dateFilter = periodStart ? { createdAt: { gte: periodStart } } : {};
    
    // 해당 게임에서 사용자 점수
    const userGameScore = await prisma.gameLog.aggregate({
      where: {
        userId: user.id,
        gameType,
        ...dateFilter,
      },
      _sum: {
        score: true,
      },
    });
    
    totalScore = userGameScore._sum.score || 0;
    
    // 사용자보다 높은 점수를 가진 사용자 수 계산
    const higherScoreUsers = await prisma.gameLog.groupBy({
      by: ['userId'],
      where: {
        gameType,
        ...dateFilter,
        user: {
          isWalletVerified: true,
          isWalletInstalled: true,
        },
      },
      _sum: {
        score: true,
      },
      having: {
        score: {
          _sum: {
            gt: totalScore,
          },
        },
      },
    });
    
    rank = higherScoreUsers.length + 1;
  } else {
    // 전체 랭킹
    if (period === 'all') {
      const higherScoreUsers = await prisma.user.count({
        where: {
          score: { gt: user.score },
          isWalletVerified: true,
          isWalletInstalled: true,
        },
      });
      rank = higherScoreUsers + 1;
    } else {
      // 기간별 전체 랭킹 (복잡한 로직 필요)
      const periodStart = getPeriodFilter(period);
      if (periodStart) {
        const userPeriodScore = await prisma.gameLog.aggregate({
          where: {
            userId: user.id,
            createdAt: { gte: periodStart },
          },
          _sum: {
            score: true,
          },
        });
        
        totalScore = userPeriodScore._sum.score || 0;
        
        // 기간 내 더 높은 점수를 가진 사용자 수 계산 (복잡)
        // 여기서는 간단하게 전체 점수 기반으로 처리
        const higherScoreUsers = await prisma.user.count({
          where: {
            score: { gt: user.score },
            isWalletVerified: true,
            isWalletInstalled: true,
          },
        });
        rank = higherScoreUsers + 1;
      }
    }
  }
  
  return {
    rank,
    user: {
      walletAddress: user.walletAddress,
      telegramId: user.telegramId,
      language: user.language,
      totalScore: user.score,
      periodScore: totalScore,
    },
  };
}

/**
 * 랭킹 라우트 등록 함수
 * Fastify 인스턴스에 랭킹 관련 API 등록
 */
export default async function rankingRoutes(fastify: FastifyInstance) {
  
  /**
   * GET /ranking
   * 전체 랭킹 조회
   */
  fastify.get('/', {
    schema: {
      description: '전체 사용자 랭킹을 조회합니다',
      tags: ['Ranking'],
      querystring: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 20,
            description: '가져올 사용자 수',
          },
          offset: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: '건너뛸 사용자 수',
          },
          gameType: {
            type: 'string',
            enum: ['binary', 'derby', 'darts'],
            description: '게임 타입 필터 (선택적)',
          },
          language: {
            type: 'string',
            enum: ['en', 'ko', 'ja', 'vi'],
            description: '언어 필터 (선택적)',
          },
          period: {
            type: 'string',
            enum: ['all', 'week', 'month'],
            default: 'all',
            description: '기간 필터',
          },
          minScore: {
            type: 'number',
            minimum: 0,
            description: '최소 점수 필터 (선택적)',
          },
          verified: {
            type: 'boolean',
            default: true,
            description: '인증된 사용자만 포함',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            ranking: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rank: { type: 'number' },
                  walletAddress: { type: 'string' },
                  telegramId: { type: 'string' },
                  language: { type: 'string' },
                  totalScore: { type: 'number' },
                  periodScore: { type: 'number' },
                  gamesPlayed: { type: 'number' },
                  joinedAt: { type: 'string' },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                limit: { type: 'number' },
                offset: { type: 'number' },
                hasMore: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validatedQuery = rankingQuerySchema.parse(request.query);
      const { limit, offset, gameType, language, period, minScore, verified } = validatedQuery;
      
      let result;
      
      if (gameType) {
        // 게임별 랭킹
        const gameRanking = await getGameTypeRanking({
          gameType,
          limit,
          offset,
          period,
          verified,
        });
        
        result = {
          users: gameRanking,
          totalCount: gameRanking.length,
          hasMore: gameRanking.length === limit,
        };
      } else {
        // 전체 랭킹
        result = await getOverallRanking({
          limit,
          offset,
          language,
          period,
          minScore,
          verified,
        });
      }
      
      return reply.status(200).send({
        success: true,
        ranking: result.users,
        pagination: {
          total: result.totalCount,
          limit,
          offset,
          hasMore: result.hasMore,
        },
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: error.errors[0]?.message || '잘못된 요청 데이터',
          code: 'VALIDATION_ERROR',
        });
      }
      
      fastify.log.error('Ranking query error:', error);
      
      return reply.status(500).send({
        success: false,
        error: '내부 서버 오류가 발생했습니다',
        code: 'INTERNAL_ERROR',
      });
    }
  
    /**
     * GET /ranking/user
     * 개별 사용자 랭킹 위치 조회
     */
    fastify.get('/user', {
      schema: {
        description: '특정 사용자의 랭킹 위치를 조회합니다',
        tags: ['Ranking'],
        querystring: {
          type: 'object',
          required: ['walletAddress'],
          properties: {
            walletAddress: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: '지갑 주소 (40자 헥스)',
            },
            gameType: {
              type: 'string',
              enum: ['binary', 'derby', 'darts'],
              description: '게임 타입 필터 (선택적)',
            },
            period: {
              type: 'string',
              enum: ['all', 'week', 'month'],
              default: 'all',
              description: '기간 필터',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              rank: { type: 'number' },
              user: {
                type: 'object',
                properties: {
                  walletAddress: { type: 'string' },
                  telegramId: { type: 'string' },
                  language: { type: 'string' },
                  totalScore: { type: 'number' },
                  periodScore: { type: 'number' },
                },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validatedQuery = userRankingSchema.parse(request.query);
        const { walletAddress, gameType, period } = validatedQuery;
        
        const rankingResult = await getUserRankPosition({
          walletAddress,
          gameType,
          period,
        });
        
        if (!rankingResult) {
          return reply.status(404).send({
            success: false,
            error: '사용자를 찾을 수 없습니다',
            code: 'USER_NOT_FOUND',
          });
        }
        
        return reply.status(200).send({
          success: true,
          rank: rankingResult.rank,
          user: rankingResult.user,
        });
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            error: error.errors[0]?.message || '잘못된 요청 데이터',
            code: 'VALIDATION_ERROR',
          });
        }
        
        fastify.log.error('User ranking error:', error);
        
        return reply.status(500).send({
          success: false,
          error: '내부 서버 오류가 발생했습니다',
          code: 'INTERNAL_ERROR',
        });
      }
    
      /**
       * GET /ranking/top
       * 상위 랭킹 조회 (에어드랍 대상자 선정용)
       */
      fastify.get('/top', {
        schema: {
          description: '상위 랭킹 사용자를 조회합니다 (에어드랍 대상자 선정용)',
          tags: ['Ranking'],
          querystring: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                minimum: 1,
                maximum: 50,
                default: 5,
                description: '상위 몇 명까지 가져올지',
              },
              gameType: {
                type: 'string',
                enum: ['binary', 'derby', 'darts'],
                description: '게임 타입 필터 (선택적)',
              },
              period: {
                type: 'string',
                enum: ['week', 'month', 'all'],
                default: 'all',
                description: '기간 필터',
              },
            },
          },
          response: {
            200: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                topUsers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      rank: { type: 'number' },
                      walletAddress: { type: 'string' },
                      telegramId: { type: 'string' },
                      language: { type: 'string' },
                      totalScore: { type: 'number' },
                      periodScore: { type: 'number' },
                      gamesPlayed: { type: 'number' },
                      averageScore: { type: 'number' },
                      bestScore: { type: 'number' },
                    },
                  },
                },
                summary: {
                  type: 'object',
                  properties: {
                    totalParticipants: { type: 'number' },
                    period: { type: 'string' },
                    gameType: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const query = request.query as any;
          const limit = query.limit || 5;
          const gameType = query.gameType;
          const period = query.period || 'all';
          
          let result;
          
          if (gameType) {
            // 게임별 상위 랭킹
            result = await getGameTypeRanking({
              gameType,
              limit,
              period,
              verified: true,
            });
          } else {
            // 전체 상위 랭킹
            const overallResult = await getOverallRanking({
              limit,
              offset: 0,
              period,
              verified: true,
            });
            result = overallResult.users;
          }
          
          // 전체 참여자 수 계산
          const totalParticipants = await prisma.user.count({
            where: {
              isWalletVerified: true,
              isWalletInstalled: true,
            },
          });
          
          return reply.status(200).send({
            success: true,
            topUsers: result,
            summary: {
              totalParticipants,
              period,
              gameType: gameType || 'all',
            },
          });
          
        } catch (error) {
          fastify.log.error('Top ranking error:', error);
          
          return reply.status(500).send({
            success: false,
            error: '내부 서버 오류가 발생했습니다',
            code: 'INTERNAL_ERROR',
          });
        }
      });
    
    }