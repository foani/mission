 /**
  * CreataChain Mission Game 공통 타입 정의
  */
 
 // 사용자 타입
 export interface User {
   id: string;
   walletAddress: string;
   telegramId?: string;
   language: string;
   isWalletVerified: boolean;
   isWalletInstalled: boolean;
   score: number;
   rank?: number;
   lastPlayedAt?: string;
   createdAt: string;
 }
 
 // 게임 로그 타입
 export interface GameLog {
   id: number;
   userId: string;
   gameType: string;
   round: number;
   score: number;
   result: Record<string, any>;
   createdAt: string;
 }
 
 // 에어드랍 타입
 export interface AirdropQueue {
   id: number;
   userId: string;
   rewardType: string;
   ctaAmount: string;
   txHash?: string;
   status: 'pending' | 'success' | 'failed';
   description?: string;
   createdAt: string;
   processedAt?: string;
 }
 
 // 랭킹 타입
 export interface RankingEntry {
   rank: number;
   walletAddress: string;
   telegramId?: string;
   score: number;
   language: string;
 }
 
 // 게임 타입
 export type GameType = 'binary' | 'derby' | 'darts';
 
 // 게임 결과 타입
 export interface GameResult {
   gameType: GameType;
   round: number;
   score: number;
   result: Record<string, any>;
 }
 
 // API 응답 타입
 export interface ApiResponse<T = any> {
   success: boolean;
   data?: T;
   message?: string;
   error?: string;
 }
 
 // 페이지네이션 타입
 export interface Pagination {
   page: number;
   limit: number;
   total: number;
   totalPages: number;
 }
 
 // 랑킹 API 응답 타입
 export interface RankingResponse {
   success: boolean;
   data: RankingEntry[];
   pagination?: Pagination;
 }
 
 // 게임 제출 API 요청 타입
 export interface GameSubmitRequest {
   walletAddress: string;
   gameType: GameType;
   round: number;
   score: number;
   result: Record<string, any>;
 }
 
 // 지갑 인증 요청 타입
 export interface WalletVerifyRequest {
   walletAddress: string;
   message: string;
   signature: string;
 }
 
 // Telegram WebApp 타입 확장
 declare global {
   interface Window {
     Telegram?: {
       WebApp: {
         ready: () => void;
         expand: () => void;
         close: () => void;
         setHeaderColor: (color: string) => void;
         setBackgroundColor: (color: string) => void;
         showAlert: (message: string) => void;
         showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
         showPopup: (params: any, callback?: (buttonId: string) => void) => void;
         MainButton: {
           text: string;
           color: string;
           textColor: string;
           isVisible: boolean;
           isActive: boolean;
           show: () => void;
           hide: () => void;
           enable: () => void;
           disable: () => void;
           onClick: (callback: () => void) => void;
           offClick: (callback: () => void) => void;
         };
         BackButton: {
           isVisible: boolean;
           show: () => void;
           hide: () => void;
           onClick: (callback: () => void) => void;
           offClick: (callback: () => void) => void;
         };
         version: string;
         platform: string;
         colorScheme: 'light' | 'dark';
         themeParams: Record<string, string>;
         isExpanded: boolean;
         viewportHeight: number;
         viewportStableHeight: number;
         initData: string;
         initDataUnsafe: {
           user?: {
             id: number;
             is_bot: boolean;
             first_name: string;
             last_name?: string;
             username?: string;
             language_code?: string;
             is_premium?: boolean;
             photo_url?: string;
           };
           chat?: {
             id: number;
             type: string;
             title: string;
             username?: string;
             photo_url?: string;
           };
           auth_date: number;
           hash: string;
         };
       };
     };
     // Creata Wallet 타입 정의
     creata?: {
       isCreataWallet: boolean;
       getAddress: () => Promise<string>;
       signMessage: (message: string) => Promise<string>;
       sendTransaction: (params: any) => Promise<string>;
     };
     // 메타마스크 타입 정의
     ethereum?: {
       isMetaMask: boolean;
       request: (params: { method: string; params?: any[] }) => Promise<any>;
       on: (event: string, callback: (data: any) => void) => void;
       removeListener: (event: string, callback: (data: any) => void) => void;
     };
   }
 }
 
 // 빈 export
 export {};
