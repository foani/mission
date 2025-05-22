/**
 * 인증 관련 API 라우트
 * CreataChain 기반 텔레그램 미션 게임용 지갑 인증 시스퐼
 * EIP-191 표준 메시지 서명 및 검증 기반
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { verifyMessage } from 'ethers';
import { prisma } from '../db/client';
import { env } from '../env';

/**
 * 지갑 서명 검증 요청 스키마
 */
const verifyWalletSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '잘못된 지갑 주소 형식입니다'),
  message: z.string().min(10, '메시지가 너무 짧습니다'),
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/, '잘못된 서명 형식입니다'),
  telegramId: z.string().optional(),
  language: z.enum(['en', 'ko', 'ja', 'vi']).default('en'),
});

/**
 * Creata Wallet 설치 확인 요청 스키마
 */
const installConfirmSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '잘못된 지갑 주소 형식입니다'),
  telegramId: z.string().min(1, '텔레그램 ID가 필요합니다'),
  deviceInfo: z.object({
    platform: z.string().optional(),
    userAgent: z.string().optional(),
    timestamp: z.number().optional(),
  }).optional(),
});

/**
 * 인증 상태 조회 요청 스키마
 */
const authStatusSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '잘못된 지갑 주소 형식입니다'),
});
/**
 * 인증 관련 헬퍼 함수들
 */

/**
 * 메시지 서명 검증 함수
 * EIP-191 표준에 따른 서명 검증
 */
async function verifyWalletSignature(
  message: string,
  signature: string,
  expectedAddress: string
): Promise<{ isValid: boolean; recoveredAddress?: string; error?: string }> {
  try {
    const recoveredAddress = verifyMessage(message, signature);
    
    const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    
    return {
      isValid,
      recoveredAddress,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown signature verification error',
    };
  }
}

/**
 * 사용자 생성 또는 업데이트 함수
 * 지갑 인증 완료 후 데이터베이스에 사용자 정보 저장
 */
async function createOrUpdateUser(data: {
  walletAddress: string;
  telegramId?: string;
  language?: string;
  isWalletVerified?: boolean;
  isWalletInstalled?: boolean;
}) {
  const { walletAddress, telegramId, language = 'en', isWalletVerified = false, isWalletInstalled = false } = data;
  
  return await prisma.user.upsert({
    where: { walletAddress },
    update: {
      telegramId,
      language,
      isWalletVerified,
      isWalletInstalled,
    },
    create: {
      walletAddress,
      telegramId,
      language,
      isWalletVerified,
      isWalletInstalled,
    },
    select: {
      id: true,
      walletAddress: true,
      telegramId: true,
      language: true,
      isWalletVerified: true,
      isWalletInstalled: true,
      score: true,
      createdAt: true,
    },
  });
}

/**
 * 메시지 타임스탬프 검증 함수
 * 리플레이 공격 방지를 위한 시간 유효성 검사
 */
function validateMessageTimestamp(message: string, maxAgeMinutes: number = 5): boolean {
  try {
    // 메시지에서 타임스탬프 추출 ("Creata 인증 요청 @ 1234567890 by 0x..." 형식)
    const timestampMatch = message.match(/@\s*(\d+)/);
    if (!timestampMatch) {
      return false;
    }
    
    const messageTimestamp = parseInt(timestampMatch[1]);
    const currentTimestamp = Date.now();
    const ageMinutes = (currentTimestamp - messageTimestamp) / (1000 * 60);
    
    return ageMinutes <= maxAgeMinutes;
  } catch (error) {
    return false;
  }
}

/**
 * 인증 라우트 등록 함수
 * Fastify 인스턴스에 인증 관련 API 등록
 */
export default async function authRoutes(fastify: FastifyInstance) {
  
  /**
   * POST /auth/verify-wallet
   * 지갑 서명 검증 및 사용자 인증
   */
  fastify.post('/verify-wallet', {
    schema: {
      description: '지갑 서명을 검증하고 사용자를 인증합니다',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['walletAddress', 'message', 'signature'],
        properties: {
          walletAddress: { 
            type: 'string', 
            pattern: '^0x[a-fA-F0-9]{40}$',
            description: '지갑 주소 (40자 헥스)',
          },
          message: { 
            type: 'string',
            minLength: 10,
            description: '서명된 메시지',
          },
          signature: { 
            type: 'string',
            pattern: '^0x[a-fA-F0-9]{130}$',
            description: '서명 데이터 (130자 헥스)',
          },
          telegramId: { 
            type: 'string',
            description: '텔레그램 사용자 ID (선택적)',
          },
          language: { 
            type: 'string',
            enum: ['en', 'ko', 'ja', 'vi'],
            description: '사용자 언어 설정',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            verified: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                walletAddress: { type: 'string' },
                telegramId: { type: 'string' },
                language: { type: 'string' },
                score: { type: 'number' },
                isWalletVerified: { type: 'boolean' },
                isWalletInstalled: { type: 'boolean' },
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
      const validatedData = verifyWalletSchema.parse(request.body);
      const { walletAddress, message, signature, telegramId, language } = validatedData;
      
      // 메시지 타임스탬프 검증
      if (!validateMessageTimestamp(message)) {
        return reply.status(400).send({
          success: false,
          error: '만료된 메시지입니다. 새로운 메시지로 다시 시도해주세요.',
          code: 'MESSAGE_EXPIRED',
        });
      }
      
      // 서명 검증
      const verificationResult = await verifyWalletSignature(message, signature, walletAddress);
      
      if (!verificationResult.isValid) {
        return reply.status(400).send({
          success: false,
          error: verificationResult.error || '잘못된 서명입니다',
          code: 'INVALID_SIGNATURE',
        });
      }
      
      // 사용자 생성 또는 업데이트
      const user = await createOrUpdateUser({
        walletAddress,
        telegramId,
        language,
        isWalletVerified: true,
      });
      
      return reply.status(200).send({
        success: true,
        verified: true,
        user,
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: error.errors[0]?.message || '잘못된 요청 데이터',
          code: 'VALIDATION_ERROR',
        });
      }
      
      // 로그 기록
      fastify.log.error('Wallet verification error:', error);
      
      return reply.status(500).send({
        success: false,
        error: '내부 서버 오류가 발생했습니다',
        code: 'INTERNAL_ERROR',
      });
    }
  });

    /**
     * POST /auth/install-confirm
     * Creata Wallet 설치 확인 및 인증 완료
     */
    fastify.post('/install-confirm', {
      schema: {
        description: 'Creata Wallet 설치를 확인하고 인증을 완료합니다',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['walletAddress', 'telegramId'],
          properties: {
            walletAddress: { 
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: '지갑 주소 (40자 헥스)',
            },
            telegramId: { 
              type: 'string',
              description: '텔레그램 사용자 ID',
            },
            deviceInfo: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                userAgent: { type: 'string' },
                timestamp: { type: 'number' },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              installed: { type: 'boolean' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  walletAddress: { type: 'string' },
                  telegramId: { type: 'string' },
                  isWalletInstalled: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validatedData = installConfirmSchema.parse(request.body);
        const { walletAddress, telegramId, deviceInfo } = validatedData;
        
        // 기존 사용자 확인
        const existingUser = await prisma.user.findUnique({
          where: { walletAddress },
        });
        
        if (!existingUser) {
          return reply.status(404).send({
            success: false,
            error: '사용자를 찾을 수 없습니다. 먼저 지갑 인증을 진행해주세요.',
            code: 'USER_NOT_FOUND',
          });
        }
        
        // 사용자 정보 업데이트 (지갑 설치 확인)
        const user = await createOrUpdateUser({
          walletAddress,
          telegramId,
          isWalletInstalled: true,
          isWalletVerified: existingUser.isWalletVerified,
          language: existingUser.language,
        });
        
        return reply.status(200).send({
          success: true,
          installed: true,
          user,
        });
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            error: error.errors[0]?.message || '잘못된 요청 데이터',
            code: 'VALIDATION_ERROR',
          });
        }
        
        fastify.log.error('Install confirmation error:', error);
        
        return reply.status(500).send({
          success: false,
          error: '내부 서버 오류가 발생했습니다',
          code: 'INTERNAL_ERROR',
        });
      }
    });

  /**
   * GET /auth/status
   * 사용자 인증 상태 조회
   */
  fastify.get('/status', {
    schema: {
      description: '지갑 주소기준 사용자 인증 상태를 조회합니다',
      tags: ['Authentication'],
      querystring: {
        type: 'object',
        required: ['walletAddress'],
        properties: {
          walletAddress: {
            type: 'string',
            pattern: '^0x[a-fA-F0-9]{40}$',
            description: '지갑 주소 (40자 헥스)',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                walletAddress: { type: 'string' },
                telegramId: { type: 'string' },
                language: { type: 'string' },
                isWalletVerified: { type: 'boolean' },
                isWalletInstalled: { type: 'boolean' },
                score: { type: 'number' },
                createdAt: { type: 'string' },
              },
            },
            status: {
              type: 'object',
              properties: {
                verified: { type: 'boolean' },
                installed: { type: 'boolean' },
                eligible: { type: 'boolean' },
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
      const validatedQuery = authStatusSchema.parse(request.query);
      const { walletAddress } = validatedQuery;
      
      // 사용자 조회
      const user = await prisma.user.findUnique({ 
        where: { walletAddress },
        select: {
          id: true,
          walletAddress: true,
          telegramId: true,
          language: true,
          isWalletVerified: true,
          isWalletInstalled: true,
          score: true,
          createdAt: true,
        },
      });
      
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: '사용자를 찾을 수 없습니다',
          code: 'USER_NOT_FOUND',
        });
      }
      
      // 인증 상태 계산
      const status = {
        verified: user.isWalletVerified,
        installed: user.isWalletInstalled,
        eligible: user.isWalletVerified && user.isWalletInstalled, // 게임 참여 가능 여부
      };
      
      return reply.status(200).send({
        success: true,
        user,
        status,
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: error.errors[0]?.message || '잘못된 요청 데이터',
          code: 'VALIDATION_ERROR',
        });
      }
      
      fastify.log.error('Auth status error:', error);
      
      return reply.status(500).send({
        success: false,
        error: '내부 서버 오류가 발생했습니다',
        code: 'INTERNAL_ERROR',
      });
    }
  });

}