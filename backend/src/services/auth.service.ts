 /**
  * CreataChain 미션 게임 인증 서비스
  * @description 지갑 인증 및 사용자 관리 비즈니스 로직
  */
 
 import { verifyMessage } from 'ethers';
 import { PrismaClient } from '@prisma/client';
 
 interface AuthVerifyRequest {
   walletAddress: string;
   message: string;
   signature: string;
 }
 
 interface AuthInstallRequest {
   walletAddress: string;
   telegramId?: string;
 }
 
 export class AuthService {
   constructor(private prisma: PrismaClient) {}
 
   /**
    * 지갑 서명을 검증하고 사용자를 인증하는 메서드
    * @param data - 인증 요청 데이터
    * @returns 인증 결과
    */
   async verifyWallet(data: AuthVerifyRequest) {
     const { walletAddress, message, signature } = data;
 
     try {
       // 1. 서명 검증
       const recoveredAddress = verifyMessage(message, signature);
       
       if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
         throw new Error('지갑 서명이 유효하지 않습니다');
       }
 
       // 2. 사용자 생성 또는 업데이트
       const user = await this.prisma.user.upsert({
         where: { walletAddress },
         update: { 
           isWalletVerified: true
         },
         create: { 
           walletAddress,
           isWalletVerified: true 
         }
       });
 
       return {
         success: true,
         verified: true,
         user: {
           id: user.id,
           walletAddress: user.walletAddress,
           isWalletVerified: user.isWalletVerified,
           isWalletInstalled: user.isWalletInstalled,
           score: user.score,
           language: user.language
         }
       };
     } catch (error) {
       console.error('지갑 인증 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '지갑 인증 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * Creata Wallet 설치 확인을 처리하는 메서드
    * @param data - 설치 확인 요청 데이터
    * @returns 설치 확인 결과
    */
   async confirmInstall(data: AuthInstallRequest) {
     const { walletAddress, telegramId } = data;
 
     try {
       // 1. 사용자 존재 확인
       const existingUser = await this.prisma.user.findUnique({
         where: { walletAddress }
       });
 
       if (!existingUser) {
         throw new Error('인증되지 않은 지갑 주소입니다. 먼저 지갑 인증을 완료해주세요');
       }
 
       // 2. 설치 상태 및 텔레그램 ID 업데이트
       const user = await this.prisma.user.update({
         where: { walletAddress },
         data: {
           isWalletInstalled: true,
           ...(telegramId && { telegramId })
         }
       });
 
       return {
         success: true,
         installed: true,
         user: {
           id: user.id,
           walletAddress: user.walletAddress,
           telegramId: user.telegramId,
           isWalletVerified: user.isWalletVerified,
           isWalletInstalled: user.isWalletInstalled,
           score: user.score,
           language: user.language
         }
       };
     } catch (error) {
       console.error('설치 확인 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '설치 확인 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 사용자 정보를 조회하는 메서드
    * @param walletAddress - 지갑 주소
    * @returns 사용자 정보
    */
   async getUserByWallet(walletAddress: string) {
     try {
       const user = await this.prisma.user.findUnique({
         where: { walletAddress },
         include: {
           gameLogs: {
             take: 10,
             orderBy: { createdAt: 'desc' }
           }
         }
       });
 
       if (!user) {
         throw new Error('사용자를 찾을 수 없습니다');
       }
 
       return {
         success: true,
         user: {
           id: user.id,
           walletAddress: user.walletAddress,
           telegramId: user.telegramId,
           isWalletVerified: user.isWalletVerified,
           isWalletInstalled: user.isWalletInstalled,
           score: user.score,
           language: user.language,
           lastPlayedAt: user.lastPlayedAt,
           createdAt: user.createdAt,
           recentGames: user.gameLogs
         }
       };
     } catch (error) {
       console.error('사용자 조회 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '사용자 조회 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 사용자 언어 설정을 업데이트하는 메서드
    * @param walletAddress - 지갑 주소
    * @param language - 언어 코드 (en, ko, ja, vi)
    * @returns 업데이트 결과
    */
   async updateUserLanguage(walletAddress: string, language: string) {
     try {
       // 하드코딩된 지원 언어 목록
       const supportedLanguages = ['en', 'ko', 'ja', 'vi'];
       
       if (!supportedLanguages.includes(language)) {
         throw new Error(`지원하지 않는 언어입니다. 지원 언어: ${supportedLanguages.join(', ')}`);
       }
 
       const user = await this.prisma.user.update({
         where: { walletAddress },
         data: { language }
       });
 
       return {
         success: true,
         user: {
           id: user.id,
           walletAddress: user.walletAddress,
           language: user.language
         }
       };
     } catch (error) {
       console.error('언어 설정 업데이트 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '언어 설정 업데이트 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 
   /**
    * 메시지가 유효한 인증 메시지인지 검증하는 메서드
    * @param message - 검증할 메시지
    * @returns 유효성 여부
    */
   validateAuthMessage(message: string): boolean {
     // 하드코딩된 메시지 패턴 검증
     const messagePattern = /^Creata 인증 요청 @ \d+ by 0x[a-fA-F0-9]{40}$/;
     return messagePattern.test(message);
   }
 
   /**
    * 지갑 주소 형식이 유효한지 검증하는 메서드
    * @param address - 검증할 지갑 주소
    * @returns 유효성 여부
    */
   validateWalletAddress(address: string): boolean {
     return /^0x[a-fA-F0-9]{40}$/.test(address);
   }
 
   /**
    * 사용자 통계를 조회하는 메서드
    * @param walletAddress - 지갑 주소
    * @returns 사용자 통계
    */
   async getUserStats(walletAddress: string) {
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
             losses: 0
           };
         }
         
         acc[gameType].totalPlayed += 1;
         acc[gameType].totalScore += log.score;
         
         // 결과에 따른 승/패 계산 (게임별로 다를 수 있음)
         const result = log.result as any;
         if (result?.correct === true) {
           acc[gameType].wins += 1;
         } else {
           acc[gameType].losses += 1;
         }
         
         return acc;
       }, {} as Record<string, any>);
 
       return {
         success: true,
         stats: {
           totalScore: user.score,
           totalGamesPlayed: user.gameLogs.length,
           averageScore: user.gameLogs.length > 0 
             ? Math.round(user.score / user.gameLogs.length) 
             : 0,
           gameStats,
           joinedAt: user.createdAt,
           lastPlayedAt: user.lastPlayedAt
         }
       };
     } catch (error) {
       console.error('사용자 통계 조회 실패:', error);
       throw new Error(
         error instanceof Error 
           ? error.message 
           : '사용자 통계 조회 중 알 수 없는 오류가 발생했습니다'
       );
     }
   }
 }
 
 export default AuthService;
