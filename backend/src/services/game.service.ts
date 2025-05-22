 /**
  * CreataChain 미션 게임 서비스
  * @description 게임 로직 및 점수 관리 비즈니스 로직
  */
 
 import { PrismaClient } from '@prisma/client';
 
 interface GameSubmitRequest {
   walletAddress: string;
   gameType: string;
   round: number;
   score: number;
   result: any;
 }
 
 interface GameResult {
   correct: boolean;
   choice?: string;
   actualResult?: any;
   details?: any;
 }
 
 export class GameService {
   constructor(private prisma: PrismaClient) {}
 
   /**
    * 게임 결과를 제출하고 점수를 업데이트하는 메서드
    * @param data - 게임 결과 데이터
    * @returns 제출 결과
    */
   async submitGameResult(data: GameSubmitRequest) {
     const { walletAddress, gameType, round, score, result } = data;
 
     try {
       // 1. 사용자 존재 확인
       const user = await this.prisma.user.findUnique({
         where: { walletAddress }
       });
 
       if (!user) {
         throw new Error('인증되지 않은 사용자입니다. 먼저 지갑 인증을 완료해주세요');
       }
 
       if (!user.isWalletVerified) {
         throw new Error('지갑 인증이 필요합니다');
       }
 
       // 2. 게임 타입 검증
       // 하드코딩된 지원 게임 타입
       const supportedGames = ['binary', 'derby', 'darts'];
       if (!supportedGames.includes(gameType)) {
         throw new Error(`지원하지 않는 게임 타입입니다. 지원 게임: ${supportedGames.join(', ')}`);
       }
 
       // 3. 점수 검증 및 제한
       const validatedScore = this.validateGameScore(gameType, score, result);
 
       // 4. 데이터베이스 트랜잭션으로 게임 로그와 사용자 점수 동시 업데이트
       const [gameLog, updatedUser] = await this.prisma.$transaction([
         this.prisma.gameLog.create({
           data: {
             userId: user.id,
             gameType,
             round,
             score: validatedScore,
             result
           }
         }),
         this.prisma.user.update({
           where: { walletAddress },
           data: {
             score: { increment: validatedScore },
             lastPlayedAt: new Date()
           }
         })
       ]);
 
       return {
         success: true,
         gameLog: {
           id: gameLog.id,
           gameType: gameLog.gameType,
           round: gameLog.round,
           score: gameLog.score,
           result: gameLog.result,
           createdAt: gameLog.createdAt
         },
         user: {
           totalScore: updatedUser.score,
           lastPlayedAt: updatedUser.lastPlayedAt
         }
       };
     } catch (error) {
       console.error('게임 결과 제출 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '게임 결과 제출 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 게임 타입별 점수 검증 메서드
    * @param gameType - 게임 타입
    * @param score - 제출된 점수
    * @param result - 게임 결과
    * @returns 검증된 점수
    */
   private validateGameScore(gameType: string, score: number, result: GameResult): number {
     // 하드코딩된 게임별 점수 및 규칙 검증
     switch (gameType) {
       case 'binary':
         // 바이너리 옵션: 성공 시 100점, 실패 시 0점
         if (result.correct && score === 100) return 100;
         if (!result.correct && score === 0) return 0;
         throw new Error('바이너리 게임 점수가 올바르지 않습니다');
         
       case 'derby':
         // 더비 게임: 성공 시 50-150점, 실패 시 0점
         if (!result.correct && score === 0) return 0;
         if (result.correct && score >= 50 && score <= 150) return score;
         throw new Error('더비 게임 점수가 올바르지 않습니다');
         
       case 'darts':
         // 다트 게임: 성공 시 20-80점, 실패 시 0점
         if (!result.correct && score === 0) return 0;
         if (result.correct && score >= 20 && score <= 80) return score;
         throw new Error('다트 게임 점수가 올바르지 않습니다');
         
       default:
         throw new Error('알 수 없는 게임 타입입니다');
     }
   }
 
   /**
    * 사용자의 게임 히스토리를 조회하는 메서드
    * @param walletAddress - 지갑 주소
    * @param gameType - 게임 타입 (옵션)
    * @param limit - 조회 개수 제한
    * @param offset - 오프셋
    * @returns 게임 히스토리
    */
   async getUserGameHistory(
     walletAddress: string, 
     gameType?: string, 
     limit: number = 20, 
     offset: number = 0
   ) {
     try {
       const user = await this.prisma.user.findUnique({
         where: { walletAddress }
       });
 
       if (!user) {
         throw new Error('사용자를 찾을 수 없습니다');
       }
 
       const whereClause: any = { userId: user.id };
       if (gameType) {
         whereClause.gameType = gameType;
       }
 
       const [gameLogs, totalCount] = await Promise.all([
         this.prisma.gameLog.findMany({
           where: whereClause,
           orderBy: { createdAt: 'desc' },
           take: limit,
           skip: offset
         }),
         this.prisma.gameLog.count({ where: whereClause })
       ]);
 
       return {
         success: true,
         data: {
           games: gameLogs,
           totalCount,
           hasMore: offset + limit < totalCount,
           pagination: {
             limit,
             offset,
             total: totalCount
           }
         }
       };
     } catch (error) {
       console.error('게임 히스토리 조회 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '게임 히스토리 조회 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 게임별 통계 정보를 조회하는 메서드
    * @param walletAddress - 지갑 주소
    * @returns 게임 통계
    */
   async getUserGameStats(walletAddress: string) {
     try {
       const user = await this.prisma.user.findUnique({
         where: { walletAddress },
         include: {
           gameLogs: true
         }
       });
 
       if (!user) {
         throw new Error('사용자를 찾을 수 없습니다');
       }
 
       // 게임별 통계 계산
       const gameStats = user.gameLogs.reduce((acc, log) => {
         const gameType = log.gameType;
         if (!acc[gameType]) {
           acc[gameType] = {
             totalPlayed: 0,
             totalScore: 0,
             wins: 0,
             losses: 0,
             bestScore: 0,
             averageScore: 0,
             lastPlayed: null
           };
         }
         
         acc[gameType].totalPlayed += 1;
         acc[gameType].totalScore += log.score;
         acc[gameType].bestScore = Math.max(acc[gameType].bestScore, log.score);
         
         // 결과에 따른 승/패 계산
         const result = log.result as GameResult;
         if (result?.correct === true) {
           acc[gameType].wins += 1;
         } else {
           acc[gameType].losses += 1;
         }
         
         // 마지막 플레이 시간 업데이트
         if (!acc[gameType].lastPlayed || log.createdAt > acc[gameType].lastPlayed) {
           acc[gameType].lastPlayed = log.createdAt;
         }
         
         return acc;
       }, {} as Record<string, any>);
 
       // 평균 점수 계산
       Object.keys(gameStats).forEach(gameType => {
         const stats = gameStats[gameType];
         stats.averageScore = stats.totalPlayed > 0 
           ? Math.round(stats.totalScore / stats.totalPlayed) 
           : 0;
       });
 
       return {
         success: true,
         data: {
           totalScore: user.score,
           totalGamesPlayed: user.gameLogs.length,
           overallAverageScore: user.gameLogs.length > 0 
             ? Math.round(user.score / user.gameLogs.length) 
             : 0,
           gameStats,
           joinedAt: user.createdAt,
           lastPlayedAt: user.lastPlayedAt
         }
       };
     } catch (error) {
       console.error('게임 통계 조회 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '게임 통계 조회 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 게임 라운드 정보를 생성하는 메서드
    * @param gameType - 게임 타입
    * @returns 게임 라운드 정보
    */
   async generateGameRound(gameType: string) {
     try {
       const currentRound = Math.floor(Date.now() / 1000); // Unix timestamp as round
       
       // 하드코딩된 게임별 라운드 설정
       switch (gameType) {
         case 'binary':
           return {
             success: true,
             round: currentRound,
             gameType,
             // 바이너리 옵션은 업/다운 예측 게임
             expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5분 후 만료
             instruction: '가격이 올라갈지 내려갈지 예측하세요'
           };
           
         case 'derby':
           // 하드코딩된 말 이름 목록
           const horses = ['빈망이', '느림이', '게으름이', '늦이', '눈건이'];
           return {
             success: true,
             round: currentRound,
             gameType,
             horses,
             instruction: '가장 느린 말이 1등을 하는 말을 맞춰보세요'
           };
           
         case 'darts':
           return {
             success: true,
             round: currentRound,
             gameType,
             instruction: '다트를 피해서 살아남으세요'
           };
           
         default:
           throw new Error('지원하지 않는 게임 타입입니다');
       }
     } catch (error) {
       console.error('게임 라운드 생성 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '게임 라운드 생성 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 주간 게임 리더보드를 조회하는 메서드
    * @param gameType - 게임 타입 (옵션)
    * @param limit - 조회 개수
    * @returns 주간 리더보드
    */
   async getWeeklyGameLeaderboard(gameType?: string, limit: number = 10) {
     try {
       const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
       
       const whereClause: any = {
         createdAt: {
           gte: oneWeekAgo
         }
       };
       
       if (gameType) {
         whereClause.gameType = gameType;
       }
 
       const weeklyStats = await this.prisma.gameLog.groupBy({
         by: ['userId'],
         where: whereClause,
         _sum: {
           score: true
         },
         _count: {
           id: true
         },
         orderBy: {
           _sum: {
             score: 'desc'
           }
         },
         take: limit
       });
 
       // 사용자 정보 가져오기
       const userIds = weeklyStats.map(stat => stat.userId);
       const users = await this.prisma.user.findMany({
         where: {
           id: {
             in: userIds
           }
         },
         select: {
           id: true,
           walletAddress: true,
           language: true
         }
       });
 
       // 결과 조합
       const leaderboard = weeklyStats.map((stat, index) => {
         const user = users.find(u => u.id === stat.userId);
         return {
           rank: index + 1,
           walletAddress: user?.walletAddress || 'Unknown',
           language: user?.language || 'en',
           weeklyScore: stat._sum.score || 0,
           gamesPlayed: stat._count.id
         };
       });
 
       return {
         success: true,
         data: {
           period: 'weekly',
           gameType: gameType || 'all',
           leaderboard,
           generatedAt: new Date()
         }
       };
     } catch (error) {
       console.error('주간 리더보드 조회 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '주간 리더보드 조회 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 }
 
 export default GameService;
