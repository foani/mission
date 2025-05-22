/**
 * 게임 관련 API 라우트
 * CreataChain 기반 텔레그램 미션 게임용 게임 로직 및 점수 관리
 * 게임 종류: Binary Options, Lazy Derby, Reverse Darts
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client';
import { env } from '../env';

/**
 * 게임 종류 열거형
 */
enum GameType {
  BINARY_OPTIONS = 'binary',
  LAZY_DERBY = 'derby', 
  REVERSE_DARTS = 'darts',
}

/**
 * 게임 결과 제출 요청 스키마
 */
const submitGameSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '잘못된 지갑 주소 형식입니다'),
  gameType: z.nativeEnum(GameType, {
    errorMap: () => ({ message: '지원되지 않는 게임 종류입니다 (binary, derby, darts 중 선택)' }),
  }),
  round: z.number().int().positive('라운드 번호는 1 이상이어야 합니다'),
  score: z.number().int().min(0, '점수는 0 이상이어야 합니다'),
  result: z.record(z.any(), '게임 결과 데이터가 필요합니다'),
  timestamp: z.number().optional(),
});

/**
 * 게임 히스토리 조회 요청 스키마
 */
const gameHistorySchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '잘못된 지갑 주소 형식입니다'),
  gameType: z.nativeEnum(GameType).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

/**
 * 게임 라운드 정보 조회 스키마
 */
const gameRoundSchema = z.object({
  gameType: z.nativeEnum(GameType),
  round: z.number().int().positive(),
});

/**
 * 게임 통계 조회 스키마
 */
const gameStatsSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '잘못된 지갑 주소 형식입니다'),
  gameType: z.nativeEnum(GameType).optional(),
});
/**
 * 게임 관련 헬퍼 함수들
 */

/**
 * 사용자 인증 상태 확인 함수
 * 게임 참여 전 지갑 인증 및 설치 여부 검사
 */
async function validateUserEligibility(walletAddress: string): Promise<{
  isEligible: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: {
        id: true,
        walletAddress: true,
        isWalletVerified: true,
        isWalletInstalled: true,
        score: true,
      },
    });
    
    if (!user) {
      return {
        isEligible: false,
        error: '사용자를 찾을 수 없습니다. 먼저 지갑 인증을 진행해주세요.',
      };
    }
    
    if (!user.isWalletVerified) {
      return {
        isEligible: false,
        user,
        error: '지갑 인증이 필요합니다.',
      };
    }
    
    if (!user.isWalletInstalled) {
      return {
        isEligible: false,
        user,
        error: 'Creata Wallet 설치 확인이 필요합니다.',
      };
    }
    
    return {
      isEligible: true,
      user,
    };
  } catch (error) {
    return {
      isEligible: false,
      error: '사용자 인증 상태 확인 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 게임 결과 검증 함수
 * 게임 종류에 따른 결과 데이터 검증
 */
function validateGameResult(gameType: GameType, result: any): { isValid: boolean; error?: string } {
  switch (gameType) {
    case GameType.BINARY_OPTIONS:
      // Binary Options: { choice: 'up'|'down', correct: boolean }
      if (!result.choice || !['up', 'down'].includes(result.choice)) {
        return { isValid: false, error: 'Binary Options에서 choice는 "up" 또는 "down"이어야 합니다.' };
      }
      if (typeof result.correct !== 'boolean') {
        return { isValid: false, error: 'Binary Options에서 correct는 boolean 값이어야 합니다.' };
      }
      break;
      
    case GameType.LAZY_DERBY:
      // Lazy Derby: { picked: string, winner: string, correct: boolean }
      if (!result.picked || typeof result.picked !== 'string') {
        return { isValid: false, error: 'Lazy Derby에서 picked는 문자열이어야 합니다.' };
      }
      if (!result.winner || typeof result.winner !== 'string') {
        return { isValid: false, error: 'Lazy Derby에서 winner는 문자열이어야 합니다.' };
      }
      if (typeof result.correct !== 'boolean') {
        return { isValid: false, error: 'Lazy Derby에서 correct는 boolean 값이어야 합니다.' };
      }
      break;
      
    case GameType.REVERSE_DARTS:
      // Reverse Darts: { survived: boolean, rounds: number }
      if (typeof result.survived !== 'boolean') {
        return { isValid: false, error: 'Reverse Darts에서 survived는 boolean 값이어야 합니다.' };
      }
      if (!result.rounds || typeof result.rounds !== 'number' || result.rounds < 0) {
        return { isValid: false, error: 'Reverse Darts에서 rounds는 0 이상의 숫자여야 합니다.' };
      }
      break;
      
    default:
      return { isValid: false, error: '지원되지 않는 게임 종류입니다.' };
  }
  
  return { isValid: true };
}

/**
 * 게임 점수 계산 함수
 * 게임 종류와 결과에 따른 점수 계산
 */
function calculateGameScore(gameType: GameType, result: any): number {
  switch (gameType) {
    case GameType.BINARY_OPTIONS:
      return result.correct ? 100 : 0;
      
    case GameType.LAZY_DERBY:
      return result.correct ? 150 : 10; // 오답이라도 참여점수 지급
      
    case GameType.REVERSE_DARTS:
      const baseScore = result.survived ? 200 : 50;
      const bonusScore = result.rounds * 10; // 라운드당 보너스
      return baseScore + bonusScore;
      
    default:
      return 0;
  }
}

/**
 * 중복 게임 참여 방지 검사
 * 동일 라운드에 중복 참여 방지
 */
async function checkDuplicateParticipation(
  walletAddress: string, 
  gameType: GameType, 
  round: number
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { walletAddress } });
  if (!user) return false;
  
  const existingGame = await prisma.gameLog.findFirst({
    where: {
      userId: user.id,
      gameType,
      round,
    },
  });
  
  return !!existingGame;
}

/**
 * 게임 라우트 등록 함수
 * Fastify 인스턴스에 게임 관련 API 등록
 */
export default async function gameRoutes(fastify: FastifyInstance) {
  
  /**
   * POST /game/submit
   * 게임 결과 제출 및 점수 저장
   */
  fastify.post('/submit', {
    schema: {
      description: '게임 결과를 제출하고 점수를 저장합니다',
      tags: ['Game'],
      body: {
        type: 'object',
        required: ['walletAddress', 'gameType', 'round', 'score', 'result'],
        properties: {
          walletAddress: {
            type: 'string',
            pattern: '^0x[a-fA-F0-9]{40}$',
            description: '지갑 주소 (40자 헥스)',
          },
          gameType: {
            type: 'string',
            enum: ['binary', 'derby', 'darts'],
            description: '게임 종류',
          },
          round: {
            type: 'number',
            minimum: 1,
            description: '게임 라운드 번호',
          },
          score: {
            type: 'number',
            minimum: 0,
            description: '사용자가 제출한 점수',
          },
          result: {
            type: 'object',
            description: '게임 결과 데이터 (JSON)',
          },
          timestamp: {
            type: 'number',
            description: '게임 완료 시간 (선택적)',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            gameId: { type: 'string' },
            calculatedScore: { type: 'number' },
            totalScore: { type: 'number' },
            user: {
              type: 'object',
              properties: {
                walletAddress: { type: 'string' },
                score: { type: 'number' },
              },
            },
          },
        },
        400: {
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
      // 요청 데이터 검증
      const validatedData = submitGameSchema.parse(request.body);
      const { walletAddress, gameType, round, score, result, timestamp } = validatedData;
      
      // 사용자 인증 상태 확인
      const eligibilityCheck = await validateUserEligibility(walletAddress);
      if (!eligibilityCheck.isEligible) {
        return reply.status(400).send({
          success: false,
          error: eligibilityCheck.error,
          code: 'USER_NOT_ELIGIBLE',
        });
      }
      
      // 중복 참여 방지 검사
      const isDuplicate = await checkDuplicateParticipation(walletAddress, gameType, round);
      if (isDuplicate) {
        return reply.status(400).send({
          success: false,
          error: '이미 이 라운드에 참여하셨습니다.',
          code: 'DUPLICATE_PARTICIPATION',
        });
      }
      
      // 게임 결과 데이터 검증
      const resultValidation = validateGameResult(gameType, result);
      if (!resultValidation.isValid) {
        return reply.status(400).send({
          success: false,
          error: resultValidation.error,
          code: 'INVALID_GAME_RESULT',
        });
      }
      
      // 서버에서 점수 재계산 (사용자 제출 점수 무시)
      const calculatedScore = calculateGameScore(gameType, result);
      
      // 게임 로그 저장 및 사용자 점수 업데이트
      const gameLog = await prisma.gameLog.create({
        data: {
          userId: eligibilityCheck.user.id,
          gameType,
          round,
          score: calculatedScore,
          result,
        },
      });
      
      // 사용자 점수 업데이트
      const updatedUser = await prisma.user.update({
        where: { id: eligibilityCheck.user.id },
        data: {
          score: { increment: calculatedScore },
          lastPlayedAt: new Date(),
        },
        select: {
          walletAddress: true,
          score: true,
        },
      });
      
      return reply.status(200).send({
        success: true,
        gameId: gameLog.id.toString(),
        calculatedScore,
        totalScore: updatedUser.score,
        user: updatedUser,
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: error.errors[0]?.message || '잘못된 요청 데이터',
          code: 'VALIDATION_ERROR',
        });
      }
      
      fastify.log.error('Game submission error:', error);
      
      return reply.status(500).send({
        success: false,
        error: '내부 서버 오류가 발생했습니다',
        code: 'INTERNAL_ERROR',
      });
    }
  });

  /**
   * GET /game/history
   * 사용자 게임 히스토리 조회
   */
  fastify.get('/history', {
    schema: {
      description: '사용자의 게임 히스토리를 조회합니다',
      tags: ['Game'],
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
            description: '게임 종류 필터 (선택적)',
          },
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 20,
            description: '가져올 개수',
          },
          offset: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: '건너뛸 개수',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            games: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  gameType: { type: 'string' },
                  round: { type: 'number' },
                  score: { type: 'number' },
                  result: { type: 'object' },
                  createdAt: { type: 'string' },
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
      const validatedQuery = gameHistorySchema.parse(request.query);
      const { walletAddress, gameType, limit, offset } = validatedQuery;
      
      // 사용자 조회
      const user = await prisma.user.findUnique({ where: { walletAddress } });
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: '사용자를 찾을 수 없습니다',
          code: 'USER_NOT_FOUND',
        });
      }
      
      // 게임 히스토리 조회 조건 설정
      const whereCondition: any = { userId: user.id };
      if (gameType) {
        whereCondition.gameType = gameType;
      }
      
      // 게임 히스토리 조회
      const [games, totalCount] = await Promise.all([
        prisma.gameLog.findMany({
          where: whereCondition,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            gameType: true,
            round: true,
            score: true,
            result: true,
            createdAt: true,
          },
        }),
        prisma.gameLog.count({ where: whereCondition }),
      ]);
      
      return reply.status(200).send({
        success: true,
        games,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
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
      
      fastify.log.error('Game history error:', error);
      
      return reply.status(500).send({
        success: false,
        error: '내부 서버 오류가 발생했습니다',
        code: 'INTERNAL_ERROR',
      });
    }
  });
  
  /**
   * GET /game/stats
   * 사용자 게임 통계 조회
   */
  fastify.get('/stats', {
    schema: {
      description: '사용자의 게임 통계를 조회합니다',
      tags: ['Game'],
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
            description: '게임 종류 필터 (선택적)',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            stats: {
              type: 'object',
              properties: {
                totalGames: { type: 'number' },
                totalScore: { type: 'number' },
                averageScore: { type: 'number' },
                gameTypeStats: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      gameType: { type: 'string' },
                      count: { type: 'number' },
                      totalScore: { type: 'number' },
                      averageScore: { type: 'number' },
                      bestScore: { type: 'number' },
                    },
                  },
                },
                recentActivity: {
                  type: 'object',
                  properties: {
                    lastPlayedAt: { type: 'string' },
                    gamesThisWeek: { type: 'number' },
                    scoreThisWeek: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validatedQuery = gameStatsSchema.parse(request.query);
      const { walletAddress, gameType } = validatedQuery;
      
      // 사용자 조회
      const user = await prisma.user.findUnique({
        where: { walletAddress },
        select: {
          id: true,
          score: true,
          lastPlayedAt: true,
        },
      });
      
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: '사용자를 찾을 수 없습니다',
          code: 'USER_NOT_FOUND',
        });
      }
      
      // 기본 조회 조건
      const baseWhere = { userId: user.id };
      const gameTypeWhere = gameType ? { ...baseWhere, gameType } : baseWhere;
      
      // 전체 통계
      const [totalGames, gameStats] = await Promise.all([
        prisma.gameLog.count({ where: gameTypeWhere }),
        prisma.gameLog.aggregate({
          where: gameTypeWhere,
          _sum: { score: true },
          _avg: { score: true },
        }),
      ]);
      
      // 게임 종류별 통계
      const gameTypeStats = await prisma.gameLog.groupBy({
        by: ['gameType'],
        where: baseWhere,
        _count: { gameType: true },
        _sum: { score: true },
        _avg: { score: true },
        _max: { score: true },
      });
      
      // 이번 주 통계 (지난 7일)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const [gamesThisWeek, scoreThisWeek] = await Promise.all([
        prisma.gameLog.count({
          where: {
            ...baseWhere,
            createdAt: { gte: weekAgo },
          },
        }),
        prisma.gameLog.aggregate({
          where: {
            ...baseWhere,
            createdAt: { gte: weekAgo },
          },
          _sum: { score: true },
        }),
      ]);
      
      // 결과 정리
      const stats = {
        totalGames,
        totalScore: gameStats._sum.score || 0,
        averageScore: Math.round((gameStats._avg.score || 0) * 100) / 100,
        gameTypeStats: gameTypeStats.map(stat => ({
          gameType: stat.gameType,
          count: stat._count.gameType,
          totalScore: stat._sum.score || 0,
          averageScore: Math.round((stat._avg.score || 0) * 100) / 100,
          bestScore: stat._max.score || 0,
        })),
        recentActivity: {
          lastPlayedAt: user.lastPlayedAt?.toISOString() || null,
          gamesThisWeek,
          scoreThisWeek: scoreThisWeek._sum.score || 0,
        },
      };
      
      return reply.status(200).send({
        success: true,
        stats,
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: error.errors[0]?.message || '잘못된 요청 데이터',
          code: 'VALIDATION_ERROR',
        });
      }
      
      fastify.log.error('Game stats error:', error);
      
      return reply.status(500).send({
        success: false,
        error: '내부 서버 오류가 발생했습니다',
        code: 'INTERNAL_ERROR',
      });
    }
  });
  
  }