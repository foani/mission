 /**
  * CreataChain 미션 게임 랭킹 서비스
  * @description 랭킹 시스템 및 리더보드 관리 비즈니스 로직
  */
 
 import { PrismaClient } from '@prisma/client';
 
 interface RankingQuery {
   gameType?: string;
   language?: string;
   limit?: number;
   offset?: number;
   period?: 'all' | 'weekly' | 'monthly' | 'daily';
 }
 
 interface LeaderboardEntry {
   rank: number;
   walletAddress: string;
   score: number;
   gamesPlayed: number;
   language: string;
   lastPlayedAt: Date | null;
 }
 
 export class RankingService {
   constructor(private prisma: PrismaClient) {}
 
   /**
    * 전체 랭킹을 조회하는 메서드
    * @param query - 랭킹 조회 옵션
    * @returns 랭킹 목록
    */
   async getGlobalRanking(query: RankingQuery = {}) {
     const { 
       gameType, 
       language, 
       limit = 50, 
       offset = 0, 
       period = 'all' 
     } = query;
 
     try {
       let whereClause: any = {
         isWalletVerified: true,
         score: {
           gt: 0 // 0점보다 높은 사용자만 포함
         }
       };
 
       if (language) {
         whereClause.language = language;
       }
 
       // 기간별 필터링
       if (period !== 'all') {
         const dateFilter = this.getDateFilter(period);
         whereClause.lastPlayedAt = {
           gte: dateFilter
         };
       }
 
       const [users, totalCount] = await Promise.all([
         this.prisma.user.findMany({
           where: whereClause,
           orderBy: { score: 'desc' },
           take: limit,
           skip: offset,
           include: {
             _count: {
               select: { gameLogs: true }
             }
           }
         }),
         this.prisma.user.count({ where: whereClause })
       ]);
 
       // 게임 타입별 필터링이 있는 경우 별도 처리
       let filteredUsers = users;
       if (gameType) {
         filteredUsers = await this.filterByGameType(users, gameType, period);
       }
 
       const leaderboard: LeaderboardEntry[] = filteredUsers.map((user, index) => ({
         rank: offset + index + 1,
         walletAddress: user.walletAddress,
         score: user.score,
         gamesPlayed: user._count.gameLogs,
         language: user.language,
         lastPlayedAt: user.lastPlayedAt
       }));
 
       return {
         success: true,
         data: {
           leaderboard,
           totalCount,
           hasMore: offset + limit < totalCount,
           pagination: {
             limit,
             offset,
             total: totalCount
           },
           filters: {
             gameType: gameType || 'all',
             language: language || 'all',
             period
           },
           generatedAt: new Date()
         }
       };
     } catch (error) {
       console.error('랭킹 조회 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '랭킹 조회 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 사용자의 랭킹 위치를 조회하는 메서드
    * @param walletAddress - 지갑 주소
    * @param gameType - 게임 타입 (옵션)
    * @returns 사용자 랭킹 정보
    */
   async getUserRank(walletAddress: string, gameType?: string) {
     try {
       const user = await this.prisma.user.findUnique({
         where: { walletAddress },
         include: {
           gameLogs: gameType ? {
             where: { gameType }
           } : true
         }
       });
 
       if (!user) {
         throw new Error('사용자를 찾을 수 없습니다');
       }
 
       let userScore = user.score;
       let totalPlayers = await this.prisma.user.count({
         where: {
           isWalletVerified: true,
           score: { gt: 0 }
         }
       });
 
       // 게임 타입별 랭킹인 경우
       if (gameType) {
         userScore = user.gameLogs
           .filter(log => log.gameType === gameType)
           .reduce((sum, log) => sum + log.score, 0);
         
         // 해당 게임을 플레이한 사용자 수
         totalPlayers = await this.prisma.user.count({
           where: {
             isWalletVerified: true,
             gameLogs: {
               some: {
                 gameType
               }
             }
           }
         });
       }
 
       // 나보다 점수가 높은 사용자 수 계산
       const higherScoreCount = await this.prisma.user.count({
         where: {
           isWalletVerified: true,
           score: { gt: userScore }
         }
       });
 
       const rank = higherScoreCount + 1;
       const percentile = totalPlayers > 0 
         ? Math.round(((totalPlayers - rank + 1) / totalPlayers) * 100)
         : 0;
 
       return {
         success: true,
         data: {
           walletAddress: user.walletAddress,
           score: userScore,
           rank,
           totalPlayers,
           percentile,
           gameType: gameType || 'all',
           gamesPlayed: gameType 
             ? user.gameLogs.filter(log => log.gameType === gameType).length
             : user.gameLogs.length
         }
       };
     } catch (error) {
       console.error('사용자 랭킹 조회 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '사용자 랭킹 조회 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 게임별 랭킹을 조회하는 메서드
    * @param gameType - 게임 타입
    * @param limit - 조회 개수
    * @param period - 기간
    * @returns 게임별 랭킹
    */
   async getGameTypeRanking(gameType: string, limit: number = 20, period: string = 'all') {
     try {
       // 하드코딩된 지원 게임 타입 검증
       const supportedGames = ['binary', 'derby', 'darts'];
       if (!supportedGames.includes(gameType)) {
         throw new Error(`지원하지 않는 게임 타입입니다. 지원 게임: ${supportedGames.join(', ')}`);
       }
 
       let whereClause: any = { gameType };
       
       if (period !== 'all') {
         const dateFilter = this.getDateFilter(period);
         whereClause.createdAt = {
           gte: dateFilter
         };
       }
 
       const gameStats = await this.prisma.gameLog.groupBy({
         by: ['userId'],
         where: whereClause,
         _sum: {
           score: true
         },
         _count: {
           id: true
         },
         _max: {
           score: true
         },
         orderBy: {
           _sum: {
             score: 'desc'
           }
         },
         take: limit
       });
 
       // 사용자 정보 가져오기
       const userIds = gameStats.map(stat => stat.userId);
       const users = await this.prisma.user.findMany({
         where: {
           id: {
             in: userIds
           }
         },
         select: {
           id: true,
           walletAddress: true,
           language: true,
           lastPlayedAt: true
         }
       });
 
       // 결과 조합
       const leaderboard = gameStats.map((stat, index) => {
         const user = users.find(u => u.id === stat.userId);
         return {
           rank: index + 1,
           walletAddress: user?.walletAddress || 'Unknown',
           language: user?.language || 'en',
           totalScore: stat._sum.score || 0,
           bestScore: stat._max.score || 0,
           gamesPlayed: stat._count.id,
           averageScore: stat._count.id > 0 
             ? Math.round((stat._sum.score || 0) / stat._count.id)
             : 0,
           lastPlayedAt: user?.lastPlayedAt
         };
       });
 
       return {
         success: true,
         data: {
           gameType,
           period,
           leaderboard,
           generatedAt: new Date()
         }
       };
     } catch (error) {
       console.error('게임별 랭킹 조회 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '게임별 랭킹 조회 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 에어드랍 대상자를 선별하는 메서드
    * @param topN - 상위 N명
    * @param minScore - 최소 점수
    * @param period - 기간
    * @returns 에어드랍 대상자 목록
    */
   async getAirdropEligibleUsers(
     topN: number = 5, 
     minScore: number = 100, 
     period: string = 'weekly'
   ) {
     try {
       let whereClause: any = {
         isWalletVerified: true,
         isWalletInstalled: true, // 지갑 설치 확인된 사용자만
         score: {
           gte: minScore
         }
       };
 
       if (period !== 'all') {
         const dateFilter = this.getDateFilter(period);
         whereClause.lastPlayedAt = {
           gte: dateFilter
         };
       }
 
       const eligibleUsers = await this.prisma.user.findMany({
         where: whereClause,
         orderBy: { score: 'desc' },
         take: topN,
         include: {
           _count: {
             select: { gameLogs: true }
           },
           airdropQueue: {
             where: {
               status: 'pending'
             }
           }
         }
       });
 
       // 이미 에어드랍 대기열에 있는 사용자 제외
       const filteredUsers = eligibleUsers.filter(user => 
         user.airdropQueue.length === 0
       );
 
       const airdropList = filteredUsers.map((user, index) => {
         // 하드코딩된 랭킹별 보상 계산
         let rewardAmount = 0;
         switch (index + 1) {
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
 
         return {
           rank: index + 1,
           walletAddress: user.walletAddress,
           score: user.score,
           gamesPlayed: user._count.gameLogs,
           language: user.language,
           rewardAmount,
           lastPlayedAt: user.lastPlayedAt
         };
       });
 
       return {
         success: true,
         data: {
           period,
           criteria: {
             topN,
             minScore
           },
           airdropList,
           totalEligible: filteredUsers.length,
           totalRewards: airdropList.reduce((sum, user) => sum + user.rewardAmount, 0),
           generatedAt: new Date()
         }
       };
     } catch (error) {
       console.error('에어드랍 대상자 선별 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '에어드랍 대상자 선별 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 랭킹 통계 정보를 조회하는 메서드
    * @returns 랭킹 통계
    */
   async getRankingStats() {
     try {
       const [totalUsers, activeUsers, totalGames, gameTypeStats] = await Promise.all([
         // 전체 인증된 사용자 수
         this.prisma.user.count({
           where: { isWalletVerified: true }
         }),
         // 활성 사용자 수 (1점 이상)
         this.prisma.user.count({
           where: {
             isWalletVerified: true,
             score: { gt: 0 }
           }
         }),
         // 전체 게임 수
         this.prisma.gameLog.count(),
         // 게임 타입별 통계
         this.prisma.gameLog.groupBy({
           by: ['gameType'],
           _count: {
             id: true
           },
           _sum: {
             score: true
           },
           _avg: {
             score: true
           }
         })
       ]);
 
       // 언어별 사용자 통계
       const languageStats = await this.prisma.user.groupBy({
         by: ['language'],
         where: {
           isWalletVerified: true,
           score: { gt: 0 }
         },
         _count: {
           id: true
         }
       });
 
       return {
         success: true,
         data: {
           overview: {
             totalUsers,
             activeUsers,
             totalGames,
             participationRate: totalUsers > 0 
               ? Math.round((activeUsers / totalUsers) * 100)
               : 0
           },
           gameTypeStats: gameTypeStats.map(stat => ({
             gameType: stat.gameType,
             totalGames: stat._count.id,
             totalScore: stat._sum.score || 0,
             averageScore: Math.round(stat._avg.score || 0)
           })),
           languageStats: languageStats.map(stat => ({
             language: stat.language,
             userCount: stat._count.id
           })),
           generatedAt: new Date()
         }
       };
     } catch (error) {
       console.error('랭킹 통계 조회 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '랭킹 통계 조회 중 알 수 없는 오류가 발생했습니다'
       );
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
 
   /**
    * 게임 타입별 사용자 필터링
    * @param users - 사용자 목록
    * @param gameType - 게임 타입
    * @param period - 기간
    * @returns 필터링된 사용자 목록
    */
   private async filterByGameType(users: any[], gameType: string, period: string) {
     const userIds = users.map(u => u.id);
     
     let whereClause: any = {
       userId: { in: userIds },
       gameType
     };
     
     if (period !== 'all') {
       const dateFilter = this.getDateFilter(period);
       whereClause.createdAt = { gte: dateFilter };
     }
 
     const gameStats = await this.prisma.gameLog.groupBy({
       by: ['userId'],
       where: whereClause,
       _sum: {
         score: true
       },
       orderBy: {
         _sum: {
           score: 'desc'
         }
       }
     });
 
     // 해당 게임을 플레이한 사용자만 필터링
     return gameStats.map(stat => {
       const user = users.find(u => u.id === stat.userId);
       return {
         ...user,
         score: stat._sum.score || 0
       };
     });
   }
 }
 
 export default RankingService;
