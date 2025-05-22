 /**
  * CreataChain 미션 게임 에어드랍 서비스
  * @description CTA 토큰 에어드랍 및 보상 관리 비즈니스 로직
  */
 
 import { PrismaClient, Prisma } from '@prisma/client';
 import { sendCta, getTransactionStatus, isValidAddress } from '../utils/blockchain';
 
 interface AirdropQueueRequest {
   walletAddress: string;
   rewardType: string;
   ctaAmount: number;
   reason?: string;
 }
 
 interface AirdropExecuteOptions {
   batchSize?: number;
   dryRun?: boolean;
 }
 
 export class AirdropService {
   constructor(private prisma: PrismaClient) {}
 
   /**
    * 에어드랍 대기열에 보상을 추가하는 메서드
    * @param data - 에어드랍 요청 데이터
    * @returns 대기열 추가 결과
    */
   async addToQueue(data: AirdropQueueRequest) {
     const { walletAddress, rewardType, ctaAmount, reason } = data;
 
     try {
       // 1. 사용자 존재 및 인증 확인
       const user = await this.prisma.user.findUnique({
         where: { walletAddress }
       });
 
       if (!user) {
         throw new Error('사용자를 찾을 수 없습니다');
       }
 
       if (!user.isWalletVerified) {
         throw new Error('지갑 인증이 필요합니다');
       }
 
       if (!user.isWalletInstalled) {
         throw new Error('Creata Wallet 설치 확인이 필요합니다');
       }
 
       // 2. 보상 타입 검증
       // 하드코딩된 지원 보상 타입
       const supportedRewardTypes = ['ranking', 'event', 'referral', 'bonus', 'manual'];
       if (!supportedRewardTypes.includes(rewardType)) {
         throw new Error(`지원하지 않는 보상 타입입니다. 지원 타입: ${supportedRewardTypes.join(', ')}`);
       }
 
       // 3. CTA 양 검증
       if (ctaAmount <= 0) {
         throw new Error('CTA 양은 0보다 커야 합니다');
       }
 
       // 하드코딩된 최대 보상 제한
       const maxRewardLimit = 1000; // 1000 CTA
       if (ctaAmount > maxRewardLimit) {
         throw new Error(`CTA 양이 최대 제한(${maxRewardLimit} CTA)을 초과했습니다`);
       }
 
       // 4. 중복 대기열 확인
       const existingQueue = await this.prisma.airdropQueue.findFirst({
         where: {
           userId: user.id,
           status: 'pending'
         }
       });
 
       if (existingQueue) {
         throw new Error('이미 대기 중인 에어드랍이 있습니다');
       }
 
       // 5. 대기열에 추가
       const airdropQueue = await this.prisma.airdropQueue.create({
         data: {
           userId: user.id,
           rewardType,
           ctaAmount: new Prisma.Decimal(ctaAmount),
           status: 'pending'
         }
       });
 
       return {
         success: true,
         data: {
           id: airdropQueue.id,
           walletAddress: user.walletAddress,
           rewardType,
           ctaAmount,
           status: airdropQueue.status,
           createdAt: airdropQueue.createdAt
         }
       };
     } catch (error) {
       console.error('에어드랍 대기열 추가 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '에어드랍 대기열 추가 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 대기 중인 에어드랍을 실행하는 메서드
    * @param options - 실행 옵션
    * @returns 실행 결과
    */
   async executeAirdrops(options: AirdropExecuteOptions = {}) {
     const { batchSize = 10, dryRun = false } = options;
 
     try {
       // 1. 대기 중인 에어드랍 조회
       const pendingAirdrops = await this.prisma.airdropQueue.findMany({
         where: {
           status: 'pending'
         },
         take: batchSize,
         include: {
           user: {
             select: {
               walletAddress: true,
               isWalletVerified: true,
               isWalletInstalled: true
             }
           }
         },
         orderBy: {
           createdAt: 'asc' // 먼저 요청된 순서대로
         }
       });
 
       if (pendingAirdrops.length === 0) {
         return {
           success: true,
           message: '실행할 에어드랍이 없습니다',
           data: {
             processed: 0,
             successful: 0,
             failed: 0,
             results: []
           }
         };
       }
 
       // 2. dryRun 모드인 경우 시뮬레이션만 수행
       if (dryRun) {
         const simulation = pendingAirdrops.map(airdrop => ({
           id: airdrop.id,
           walletAddress: airdrop.user.walletAddress,
           ctaAmount: airdrop.ctaAmount.toString(),
           rewardType: airdrop.rewardType,
           wouldExecute: airdrop.user.isWalletVerified && airdrop.user.isWalletInstalled
         }));
 
         return {
           success: true,
           message: 'DryRun 모드: 실제 에어드랍이 실행되지 않았습니다',
           data: {
             processed: simulation.length,
             successful: simulation.filter(s => s.wouldExecute).length,
             failed: simulation.filter(s => !s.wouldExecute).length,
             simulation
           }
         };
       }
 
       // 3. 실제 에어드랍 실행
       const results = [];
       let successful = 0;
       let failed = 0;
 
       for (const airdrop of pendingAirdrops) {
         try {
           // 지갑 상태 재검증
           if (!airdrop.user.isWalletVerified || !airdrop.user.isWalletInstalled) {
             await this.prisma.airdropQueue.update({
               where: { id: airdrop.id },
               data: {
                 status: 'failed',
                 processedAt: new Date()
               }
             });
 
             results.push({
               id: airdrop.id,
               walletAddress: airdrop.user.walletAddress,
               ctaAmount: airdrop.ctaAmount.toString(),
               status: 'failed',
               error: '지갑 인증 또는 설치 확인이 필요합니다'
             });
             failed++;
             continue;
           }
 
           // 실제 CTA 전송 로직
           const txHash = await this.sendCtaToUser(
             airdrop.user.walletAddress, 
             parseFloat(airdrop.ctaAmount.toString())
           );
 
           // 성공 처리
           await this.prisma.airdropQueue.update({
             where: { id: airdrop.id },
             data: {
               status: 'success',
               txHash,
               processedAt: new Date()
             }
           });
 
           results.push({
             id: airdrop.id,
             walletAddress: airdrop.user.walletAddress,
             ctaAmount: airdrop.ctaAmount.toString(),
             status: 'success',
             txHash
           });
           successful++;
 
         } catch (error) {
           // 실패 처리
           await this.prisma.airdropQueue.update({
             where: { id: airdrop.id },
             data: {
               status: 'failed',
               processedAt: new Date()
             }
           });
 
           results.push({
             id: airdrop.id,
             walletAddress: airdrop.user.walletAddress,
             ctaAmount: airdrop.ctaAmount.toString(),
             status: 'failed',
             error: error instanceof Error ? error.message : '알 수 없는 오류'
           });
           failed++;
         }
       }
 
       return {
         success: true,
         message: `에어드랍 실행 완료: 성공 ${successful}건, 실패 ${failed}건`,
         data: {
           processed: pendingAirdrops.length,
           successful,
           failed,
           results
         }
       };
     } catch (error) {
       console.error('에어드랍 실행 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '에어드랍 실행 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 에어드랍 대기열 상태를 조회하는 메서드
    * @param limit - 조회 개수
    * @param status - 상태 필터
    * @returns 대기열 목록
    */
   async getQueueStatus(limit: number = 20, status?: string) {
     try {
       let whereClause: any = {};
       if (status) {
         whereClause.status = status;
       }
 
       const [queueItems, totalCount, statusStats] = await Promise.all([
         this.prisma.airdropQueue.findMany({
           where: whereClause,
           take: limit,
           orderBy: { createdAt: 'desc' },
           include: {
             user: {
               select: {
                 walletAddress: true,
                 language: true
               }
             }
           }
         }),
         this.prisma.airdropQueue.count({ where: whereClause }),
         this.prisma.airdropQueue.groupBy({
           by: ['status'],
           _count: {
             id: true
           },
           _sum: {
             ctaAmount: true
           }
         })
       ]);
 
       return {
         success: true,
         data: {
           queue: queueItems.map(item => ({
             id: item.id,
             walletAddress: item.user.walletAddress,
             language: item.user.language,
             rewardType: item.rewardType,
             ctaAmount: item.ctaAmount.toString(),
             status: item.status,
             txHash: item.txHash,
             createdAt: item.createdAt,
             processedAt: item.processedAt
           })),
           totalCount,
           statusStats: statusStats.map(stat => ({
             status: stat.status,
             count: stat._count.id,
             totalAmount: stat._sum.ctaAmount?.toString() || '0'
           })),
           generatedAt: new Date()
         }
       };
     } catch (error) {
       console.error('에어드랍 대기열 조회 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '에어드랍 대기열 조회 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 랜킹 기반 자동 에어드랍을 생성하는 메서드
    * @param topN - 상위 N명
    * @param period - 기간
    * @returns 자동 에어드랍 생성 결과
    */
   async generateRankingAirdrop(topN: number = 5, period: string = 'weekly') {
     try {
       // 기간에 따른 날짜 필터
       const dateFilter = this.getDateFilter(period);
       
       // 상위 랭커 조회
       const topUsers = await this.prisma.user.findMany({
         where: {
           isWalletVerified: true,
           isWalletInstalled: true,
           score: { gt: 0 },
           lastPlayedAt: {
             gte: dateFilter
           }
         },
         orderBy: { score: 'desc' },
         take: topN
       });
 
       if (topUsers.length === 0) {
         return {
           success: true,
           message: '자격을 갖춨 사용자가 없습니다',
           data: {
             generated: 0,
             users: []
           }
         };
       }
 
       const results = [];
       let generated = 0;
 
       for (let i = 0; i < topUsers.length; i++) {
         const user = topUsers[i];
         const rank = i + 1;
         
         // 하드코딩된 랭킹별 보상 계산
         let rewardAmount = 0;
         switch (rank) {
           case 1:
             rewardAmount = 100; // 1등 100 CTA
             break;
           case 2:
             rewardAmount = 50;  // 2등 50 CTA
             break;
           case 3:
             rewardAmount = 30;  // 3등 30 CTA
             break;
           case 4:
           case 5:
             rewardAmount = 10;  // 4-5등 10 CTA
             break;
           default:
             rewardAmount = 5;   // 그 외 5 CTA
         }
 
         try {
           // 기존 대기열 확인
           const existingQueue = await this.prisma.airdropQueue.findFirst({
             where: {
               userId: user.id,
               status: 'pending'
             }
           });
 
           if (!existingQueue) {
             // 대기열에 추가
             await this.prisma.airdropQueue.create({
               data: {
                 userId: user.id,
                 rewardType: 'ranking',
                 ctaAmount: new Prisma.Decimal(rewardAmount),
                 status: 'pending'
               }
             });
 
             generated++;
           }
 
           results.push({
             rank,
             walletAddress: user.walletAddress,
             score: user.score,
             rewardAmount,
             alreadyQueued: !!existingQueue
           });
         } catch (error) {
           console.error(`사용자 ${user.walletAddress} 에어드랍 생성 실패:`, error);
           results.push({
             rank,
             walletAddress: user.walletAddress,
             score: user.score,
             rewardAmount,
             error: error instanceof Error ? error.message : '알 수 없는 오류'
           });
         }
       }
 
       return {
         success: true,
         message: `랜킹 에어드랍 생성 완료: ${generated}건 생성`,
         data: {
           period,
           topN,
           generated,
           users: results
         }
       };
     } catch (error) {
       console.error('랜킹 에어드랍 생성 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '랜킹 에어드랍 생성 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 에어드랍 통계를 조회하는 메서드
    * @returns 에어드랍 통계
    */
   async getAirdropStats() {
     try {
       const [totalAirdrops, totalAmount, rewardTypeStats, monthlyStats] = await Promise.all([
         // 전체 에어드랍 수
         this.prisma.airdropQueue.count(),
         // 전체 에어드랍 양
         this.prisma.airdropQueue.aggregate({
           _sum: {
             ctaAmount: true
           }
         }),
         // 보상 타입별 통계
         this.prisma.airdropQueue.groupBy({
           by: ['rewardType', 'status'],
           _count: {
             id: true
           },
           _sum: {
             ctaAmount: true
           }
         }),
         // 월별 통계 (최근 6개월)
         this.prisma.airdropQueue.groupBy({
           by: ['status'],
           where: {
             createdAt: {
               gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
             }
           },
           _count: {
             id: true
           },
           _sum: {
             ctaAmount: true
           }
         })
       ]);
 
       return {
         success: true,
         data: {
           overview: {
             totalAirdrops,
             totalAmount: totalAmount._sum.ctaAmount?.toString() || '0'
           },
           rewardTypeStats: rewardTypeStats.map(stat => ({
             rewardType: stat.rewardType,
             status: stat.status,
             count: stat._count.id,
             totalAmount: stat._sum.ctaAmount?.toString() || '0'
           })),
           recentStats: monthlyStats.map(stat => ({
             status: stat.status,
             count: stat._count.id,
             totalAmount: stat._sum.ctaAmount?.toString() || '0'
           })),
           generatedAt: new Date()
         }
       };
     } catch (error) {
       console.error('에어드랍 통계 조회 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '에어드랍 통계 조회 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    /**
     * 실제 CTA 토큰 전송
     * @param toAddress - 수신 주소
     * @param amount - CTA 양
     * @returns 트랜잭션 해시
     */
    private async sendCtaToUser(toAddress: string, amount: number): Promise<string> {
      try {
        // 환경변수에서 관리자 지갑의 프라이빗 키 가져오기
        const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
        if (!adminPrivateKey) {
          throw new Error('관리자 지갑 프라이빗 키가 설정되지 않았습니다.');
        }
        
        // 주소 유효성 검증
        if (!isValidAddress(toAddress)) {
          throw new Error(`유효하지 않은 수신자 주소입니다: ${toAddress}`);
        }
        
        // 실제 CTA 전송
        console.log(`CTA 전송 시작: ${amount} CTA -> ${toAddress}`);
        const txHash = await sendCta(adminPrivateKey, toAddress, amount.toString());
        
        console.log(`CTA 전송 성공: ${amount} CTA -> ${toAddress} (tx: ${txHash})`);
        return txHash;
        
      } catch (error) {
        console.error('CTA 전송 실패:', error);
        throw new Error(`CTA 전송에 실패했습니다: ${error}`);
      }
    }
   /**
    * 기간에 따른 날짜 필터 생성
    * @param period - 기간
    * @returns 날짜 필터
    */
   private getDateFilter(period: string): Date {
     const now = new Date();
     
     switch (period) {
       case 'daily':
         return new Date(now.getTime() - 24 * 60 * 60 * 1000);
       case 'weekly':
         return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
       case 'monthly':
         return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
       default:
         return new Date(0); // 전체 기간
     }
   }
 }
 
 export default AirdropService;
