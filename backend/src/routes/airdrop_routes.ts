/**
 * CreataChain 에어드랍 관리 API 라우트
 * 
 * 주요 기능:
 * - 에어드랍 대상 큐 등록
 * - 보상 실행 (트랜잭션 처리)
 * - 보상 히스토리 조회
 * - 어드민 및 랜킹 기반 자동 보상
 * 
 * 인증: 어드민 또는 자동 시스템만 접근 가능
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

// Prisma 클라이언트
const prisma = new PrismaClient();

// JWT 시크릿 키
const JWT_SECRET = process.env.JWT_SECRET || 'creata-mission-secret-key';

// CreataChain Catena 네트워크 RPC 설정
const CATENA_RPC_URL = process.env.CATENA_RPC_URL || 'https://cvm.node.creatachain.com';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY; // 하드코딩된 어드민 프라이베이트 키

// 이더리움 프로버이더 설정
const provider = new ethers.JsonRpcProvider(CATENA_RPC_URL);
const adminWallet = ADMIN_PRIVATE_KEY ? new ethers.Wallet(ADMIN_PRIVATE_KEY, provider) : null;

// CTA 토큰 계약 주소 (하드코딩된 값 - 실제 배포시 환경변수로 설정)
const CTA_TOKEN_ADDRESS = process.env.CTA_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';

// CTA 토큰 ABI (ERC-20 표준)
const CTA_TOKEN_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

// 어드민 인증 미들웨어
const authenticateAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing or invalid authorization header' });
    }

    const token = authHeader.slice(7); // "Bearer " 제거
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // 어드민 유저 확인
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!adminUser || !adminUser.isActive) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Admin access denied' });
    }

    // 요청에 어드민 정보 추가
    (request as any).admin = adminUser;
    
  } catch (error) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid token' });
  }
};

// CTA 토큰 전송 함수
const sendCTAToken = async (toAddress: string, amount: string): Promise<{ success: boolean; txHash?: string; error?: string }> => {
  try {
    if (!adminWallet) {
      return { success: false, error: 'Admin wallet not configured' };
    }

    // CTA 토큰 계약 인스턴스 생성
    const ctaContract = new ethers.Contract(CTA_TOKEN_ADDRESS, CTA_TOKEN_ABI, adminWallet);
    
    // 소수점 처리 (CTA는 18 decimals 가정)
    const amountInWei = ethers.parseEther(amount);
    
    // 트랜잭션 전송
    const tx = await ctaContract.transfer(toAddress, amountInWei);
    const receipt = await tx.wait();
    
    return { success: true, txHash: receipt.transactionHash };
    
  } catch (error: any) {
    console.error('CTA token transfer failed:', error);
    return { success: false, error: error.message };
  }
};

// 에어드랍 라우트 등록 함수
export default async function airdropRoutes(fastify: FastifyInstance) {
  
  /**
   * 에어드랍 대상 등록 (Admin 전용)
   * POST /api/airdrop/queue
   */
  fastify.post('/queue', {
    preHandler: authenticateAdmin,
    schema: {
      description: '에어드랍 대상자를 큐에 등록',
      tags: ['Airdrop'],
      body: {
        type: 'object',
        required: ['walletAddress', 'rewardType', 'ctaAmount'],
        properties: {
          walletAddress: { type: 'string', description: '수신자 지갑 주소' },
          rewardType: { type: 'string', enum: ['ranking', 'event', 'referral', 'daily'], description: '보상 유형' },
          ctaAmount: { type: 'string', description: 'CTA 토큰 수량 (ETH 단위)' },
          description: { type: 'string', description: '보상 설명 (선택사항)' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { walletAddress, rewardType, ctaAmount, description } = request.body as {
        walletAddress: string;
        rewardType: string;
        ctaAmount: string;
        description?: string;
      };

      // 지갑 주소 유효성 검증
      if (!ethers.isAddress(walletAddress)) {
        return reply.status(400).send({ error: 'Invalid wallet address' });
      }

      // 사용자 존재 확인
      const user = await prisma.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
        select: { id: true, walletAddress: true, isWalletVerified: true }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      if (!user.isWalletVerified) {
        return reply.status(400).send({ error: 'User wallet not verified' });
      }

      // 에어드랍 큐 등록
      const airdropQueue = await prisma.airdropQueue.create({
        data: {
          userId: user.id,
          rewardType,
          ctaAmount: ctaAmount,
          description: description || `${rewardType} reward`,
          status: 'pending'
        }
      });

      return reply.send({
        success: true,
        queueId: airdropQueue.id,
        message: `Airdrop queued for ${walletAddress} with ${ctaAmount} CTA`
      });
      
    } catch (error: any) {
      fastify.log.error('Airdrop queue error:', error);
      return reply.status(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  /**
   * 에어드랍 실행 (Admin 전용)
   * POST /api/airdrop/execute
   */
  fastify.post('/execute', {
    preHandler: authenticateAdmin,
    schema: {
      description: '펜딩 상태의 에어드랍을 실행',
      tags: ['Airdrop'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 5, description: '한 번에 처리할 최대 개수' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { limit = 5 } = request.query as { limit?: number };
      
      // 펜딩 상태의 에어드랍 조회
      const pendingAirdrops = await prisma.airdropQueue.findMany({
        where: { status: 'pending' },
        include: {
          user: {
            select: { walletAddress: true }
          }
        },
        take: limit,
        orderBy: { createdAt: 'asc' }
      });

      if (pendingAirdrops.length === 0) {
        return reply.send({
          success: true,
          processed: 0,
          failed: 0,
          results: [],
          message: 'No pending airdrops found'
        });
      }

      const results = [];
      let processedCount = 0;
      let failedCount = 0;

      // 각 에어드랍 순차 처리
      for (const airdrop of pendingAirdrops) {
        try {
          // CTA 토큰 전송
          const transferResult = await sendCTAToken(
            airdrop.user.walletAddress,
            airdrop.ctaAmount.toString()
          );

          if (transferResult.success) {
            // 성공시 데이터베이스 업데이트
            await prisma.airdropQueue.update({
              where: { id: airdrop.id },
              data: {
                status: 'success',
                txHash: transferResult.txHash,
                processedAt: new Date()
              }
            });

            results.push({
              queueId: airdrop.id,
              walletAddress: airdrop.user.walletAddress,
              ctaAmount: airdrop.ctaAmount.toString(),
              status: 'success',
              txHash: transferResult.txHash
            });
            processedCount++;

          } else {
            // 실패시 오류 기록
            await prisma.airdropQueue.update({
              where: { id: airdrop.id },
              data: {
                status: 'failed',
                processedAt: new Date()
              }
            });

            results.push({
              queueId: airdrop.id,
              walletAddress: airdrop.user.walletAddress,
              ctaAmount: airdrop.ctaAmount.toString(),
              status: 'failed',
              error: transferResult.error
            });
            failedCount++;
          }

        } catch (error: any) {
          // 예외 발생시 오류 기록
          await prisma.airdropQueue.update({
            where: { id: airdrop.id },
            data: {
              status: 'failed',
              processedAt: new Date()
            }
          });

          results.push({
            queueId: airdrop.id,
            walletAddress: airdrop.user.walletAddress,
            ctaAmount: airdrop.ctaAmount.toString(),
            status: 'failed',
            error: error.message
          });
          failedCount++;
        }
      }

      return reply.send({
        success: true,
        processed: processedCount,
        failed: failedCount,
        results,
        message: `Processed ${processedCount}, Failed ${failedCount} airdrops`
      });
      
    } catch (error: any) {
      fastify.log.error('Airdrop execution error:', error);
      return reply.status(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  /**
   * 에어드랍 히스토리 조회
   * GET /api/airdrop/history
   */
  fastify.get('/history', {
    preHandler: authenticateAdmin,
    schema: {
      description: '에어드랍 히스토리 조회',
      tags: ['Airdrop'],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'success', 'failed'], description: '상태 필터' },
          page: { type: 'number', default: 1, minimum: 1, description: '페이지 번호' },
          limit: { type: 'number', default: 20, minimum: 1, maximum: 100, description: '페이지당 항목 수' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { status, page = 1, limit = 20 } = request.query as {
        status?: string;
        page?: number;
        limit?: number;
      };

      // 필터 조건 구성
      const where: any = {};
      if (status) where.status = status;

      // 페이지네이션 계산
      const skip = (page - 1) * limit;

      // 총 개수 조회
      const total = await prisma.airdropQueue.count({ where });

      // 데이터 조회
      const airdrops = await prisma.airdropQueue.findMany({
        where,
        include: {
          user: {
            select: { walletAddress: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      // 응답 데이터 포맷팅
      const formattedData = airdrops.map(airdrop => ({
        id: airdrop.id,
        walletAddress: airdrop.user.walletAddress,
        rewardType: airdrop.rewardType,
        ctaAmount: airdrop.ctaAmount.toString(),
        status: airdrop.status,
        txHash: airdrop.txHash,
        description: airdrop.description,
        createdAt: airdrop.createdAt.toISOString(),
        processedAt: airdrop.processedAt?.toISOString()
      }));

      return reply.send({
        success: true,
        data: formattedData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
      
    } catch (error: any) {
      fastify.log.error('Airdrop history error:', error);
      return reply.status(500).send({ error: 'Internal server error', message: error.message });
    }
  });

  /**
   * 랭킹 기반 자동 에어드랍 생성
   * POST /api/airdrop/auto-ranking
   */
  fastify.post('/auto-ranking', {
    preHandler: authenticateAdmin,
    schema: {
      description: '상위 랭킹 사용자들에게 자동으로 에어드랍 큐 생성',
      tags: ['Airdrop'],
      body: {
        type: 'object',
        required: ['topCount', 'ctaAmounts'],
        properties: {
          topCount: { type: 'number', minimum: 1, maximum: 100, description: '상위 몇 명까지 보상할지' },
          ctaAmounts: {
            type: 'array',
            items: { type: 'string' },
            description: '순위별 CTA 보상 금액 배열 (1등, 2등, 3등 순서)'
          },
          description: { type: 'string', description: '보상 설명' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { topCount, ctaAmounts, description } = request.body as {
        topCount: number;
        ctaAmounts: string[];
        description?: string;
      };

      // 상위 랭킹 사용자 조회
      const topUsers = await prisma.user.findMany({
        where: {
          isWalletVerified: true,
          score: { gt: 0 }
        },
        orderBy: { score: 'desc' },
        take: topCount,
        select: {
          id: true,
          walletAddress: true,
          score: true
        }
      });

      if (topUsers.length === 0) {
        return reply.status(400).send({ error: 'No eligible users found for ranking rewards' });
      }

      // 각 사용자별 에어드랍 큐 생성
      const createdAirdrops = [];
      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const rank = i + 1;
        const ctaAmount = ctaAmounts[i] || ctaAmounts[ctaAmounts.length - 1]; // 마지막 값으로 대체

        const airdrop = await prisma.airdropQueue.create({
          data: {
            userId: user.id,
            rewardType: 'ranking',
            ctaAmount: ctaAmount,
            description: description || `Ranking #${rank} reward (Score: ${user.score})`,
            status: 'pending'
          }
        });

        createdAirdrops.push(airdrop);
      }

      return reply.send({
        success: true,
        created: createdAirdrops.length,
        message: `Created ${createdAirdrops.length} ranking-based airdrop queues`
      });
      
    } catch (error: any) {
      fastify.log.error('Auto ranking airdrop error:', error);
      return reply.status(500).send({ error: 'Internal server error', message: error.message });
    }
  });

}