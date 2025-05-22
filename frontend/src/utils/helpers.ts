 /**
  * CreataChain 미션 게임 유틸리티 헬퍼 함수들
  * @description 공통으로 사용되는 헬퍼 함수들을 정의
  */
 
 /**
  * 지갑 주소를 축약하여 표시하는 함수
  * @param address - 지갑 주소
  * @param startLength - 앞에서 보여줄 문자 길이 (기본값: 6)
  * @param endLength - 뒤에서 보여줄 문자 길이 (기본값: 4)
  * @returns 축약된 지갑 주소
  */
 export const truncateAddress = (
   address: string,
   startLength: number = 6,
   endLength: number = 4
 ): string => {
   if (!address || address.length <= startLength + endLength) {
     return address;
   }
   return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
 };
 
 /**
  * 숫자를 천 단위 콤마로 포맷하는 함수
  * @param number - 포맷할 숫자
  * @returns 콤마가 포함된 문자열
  */
 export const formatNumber = (number: number | string): string => {
   const num = typeof number === 'string' ? parseFloat(number) : number;
   return new Intl.NumberFormat('ko-KR').format(num);
 };
 
 /**
  * CTA 토큰 양을 포맷하는 함수
  * @param amount - CTA 토큰 양
  * @param decimals - 소수점 자릿수 (기본값: 4)
  * @returns 포맷된 CTA 토큰 양
  */
 export const formatCTA = (amount: number | string, decimals: number = 4): string => {
   const num = typeof amount === 'string' ? parseFloat(amount) : amount;
   return `${num.toFixed(decimals)} CTA`;
 };
 
 /**
  * 점수를 포맷하는 함수
  * @param score - 점수
  * @returns 포맷된 점수 문자열
  */
 export const formatScore = (score: number): string => {
   if (score >= 1000000) {
     return `${(score / 1000000).toFixed(1)}M`;
   } else if (score >= 1000) {
     return `${(score / 1000).toFixed(1)}K`;
   }
   return score.toString();
 };
 
 /**
  * 날짜를 상대적 시간으로 포맷하는 함수
  * @param date - 날짜 객체 또는 날짜 문자열
  * @returns 상대적 시간 문자열
  */
 export const formatRelativeTime = (date: Date | string): string => {
   const now = new Date();
   const targetDate = typeof date === 'string' ? new Date(date) : date;
   const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
 
   if (diffInSeconds < 60) {
     return '방금 전';
   } else if (diffInSeconds < 3600) {
     const minutes = Math.floor(diffInSeconds / 60);
     return `${minutes}분 전`;
   } else if (diffInSeconds < 86400) {
     const hours = Math.floor(diffInSeconds / 3600);
     return `${hours}시간 전`;
   } else {
     const days = Math.floor(diffInSeconds / 86400);
     return `${days}일 전`;
   }
 };
 
 /**
  * 랜덤 정수를 생성하는 함수
  * @param min - 최솟값
  * @param max - 최댓값
  * @returns 랜덤 정수
  */
 export const getRandomInt = (min: number, max: number): number => {
   return Math.floor(Math.random() * (max - min + 1)) + min;
 };
 
 /**
  * 배열을 섞는 함수 (Fisher-Yates 알고리즘)
  * @param array - 섞을 배열
  * @returns 섞인 새 배열
  */
 export const shuffleArray = <T>(array: T[]): T[] => {
   const newArray = [...array];
   for (let i = newArray.length - 1; i > 0; i--) {
     const j = Math.floor(Math.random() * (i + 1));
     [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
   }
   return newArray;
 };
 
 /**
  * 딜레이 함수 (Promise 기반)
  * @param ms - 대기할 밀리초
  * @returns Promise
  */
 export const delay = (ms: number): Promise<void> => {
   return new Promise(resolve => setTimeout(resolve, ms));
 };
 
 /**
  * localStorage에 안전하게 저장하는 함수
  * @param key - 저장할 키
  * @param value - 저장할 값
  */
 export const setLocalStorage = (key: string, value: any): void => {
   try {
     const serializedValue = JSON.stringify(value);
     localStorage.setItem(key, serializedValue);
   } catch (error) {
     console.error('LocalStorage 저장 실패:', error);
   }
 };
 
 /**
  * localStorage에서 안전하게 가져오는 함수
  * @param key - 가져올 키
  * @param defaultValue - 기본값
  * @returns 저장된 값 또는 기본값
  */
 export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
   try {
     const item = localStorage.getItem(key);
     if (item === null) {
       return defaultValue;
     }
     return JSON.parse(item);
   } catch (error) {
     console.error('LocalStorage 읽기 실패:', error);
     return defaultValue;
   }
 };
 
 /**
  * localStorage에서 항목을 제거하는 함수
  * @param key - 제거할 키
  */
 export const removeLocalStorage = (key: string): void => {
   try {
     localStorage.removeItem(key);
   } catch (error) {
     console.error('LocalStorage 제거 실패:', error);
   }
 };
 
 /**
  * URL 파라미터를 파싱하는 함수
  * @param url - 파싱할 URL (기본값: 현재 위치)
  * @returns 파라미터 객체
  */
 export const parseUrlParams = (url: string = window.location.search): Record<string, string> => {
   const params = new URLSearchParams(url);
   const result: Record<string, string> = {};
   
   for (const [key, value] of params.entries()) {
     result[key] = value;
   }
   
   return result;
 };
 
 /**
  * 문자열이 유효한 이더리움 주소인지 확인하는 함수
  * @param address - 확인할 주소
  * @returns 유효성 여부
  */
 export const isValidAddress = (address: string): boolean => {
   return /^0x[a-fA-F0-9]{40}$/.test(address);
 };
 
 /**
  * 게임 타입을 한국어로 변환하는 함수
  * @param gameType - 게임 타입
  * @returns 한국어 게임 이름
  */
 export const getGameDisplayName = (gameType: string): string => {
   // 하드코딩된 게임 타입 매핑
   const gameNames: Record<string, string> = {
     'binary': '바이너리 옵션',
     'derby': '레이지 더비',
     'darts': '리버스 다트'
   };
   
   return gameNames[gameType] || gameType;
 };
 
 /**
  * 게임 결과를 이모지로 표시하는 함수
  * @param correct - 정답 여부
  * @returns 결과 이모지
  */
 export const getResultEmoji = (correct: boolean): string => {
   return correct ? '🎉' : '😢';
 };
 
 /**
  * 랭킹에 따른 메달 이모지를 반환하는 함수
  * @param rank - 순위
  * @returns 메달 이모지
  */
 export const getRankEmoji = (rank: number): string => {
   switch (rank) {
     case 1:
       return '🥇';
     case 2:
       return '🥈';
     case 3:
       return '🥉';
     default:
       return '🏅';
   }
 };
 
 /**
  * 에러 메시지를 사용자 친화적으로 변환하는 함수
  * @param error - 에러 객체 또는 메시지
  * @returns 사용자 친화적 에러 메시지
  */
 export const getUserFriendlyError = (error: any): string => {
   if (typeof error === 'string') {
     return error;
   }
   
   if (error?.message) {
     // 하드코딩된 에러 메시지 매핑
     const errorMappings: Record<string, string> = {
       'User denied transaction signature': '사용자가 트랜잭션을 거부했습니다',
       'insufficient funds': '잔액이 부족합니다',
       'Network Error': '네트워크 연결을 확인해주세요',
       'Wallet not found': '지갑을 찾을 수 없습니다. Creata Wallet을 설치해주세요'
     };
     
     for (const [key, value] of Object.entries(errorMappings)) {
       if (error.message.includes(key)) {
         return value;
       }
     }
     
     return error.message;
   }
   
   return '알 수 없는 오류가 발생했습니다';
 };
 
 /**
  * 디바운스 함수
  * @param func - 실행할 함수
  * @param wait - 대기 시간 (밀리초)
  * @returns 디바운스된 함수
  */
 export const debounce = <T extends (...args: any[]) => any>(
   func: T,
   wait: number
 ): (...args: Parameters<T>) => void => {
   let timeout: NodeJS.Timeout;
   
   return (...args: Parameters<T>) => {
     clearTimeout(timeout);
     timeout = setTimeout(() => func(...args), wait);
   };
 };
 
 /**
  * 스로틀 함수
  * @param func - 실행할 함수
  * @param limit - 제한 시간 (밀리초)
  * @returns 스로틀된 함수
  */
 export const throttle = <T extends (...args: any[]) => any>(
   func: T,
   limit: number
 ): (...args: Parameters<T>) => void => {
   let inThrottle: boolean;
   
   return (...args: Parameters<T>) => {
     if (!inThrottle) {
       func(...args);
       inThrottle = true;
       setTimeout(() => inThrottle = false, limit);
     }
   };
 };
 
 /**
  * 객체의 깊은 복사를 수행하는 함수
  * @param obj - 복사할 객체
  * @returns 복사된 객체
  */
 export const deepClone = <T>(obj: T): T => {
   if (obj === null || typeof obj !== 'object') {
     return obj;
   }
   
   if (obj instanceof Date) {
     return new Date(obj.getTime()) as unknown as T;
   }
   
   if (obj instanceof Array) {
     return obj.map(item => deepClone(item)) as unknown as T;
   }
   
   if (typeof obj === 'object') {
     const clonedObj = {} as { [key: string]: any };
     for (const key in obj) {
       if (obj.hasOwnProperty(key)) {
         clonedObj[key] = deepClone(obj[key]);
       }
     }
     return clonedObj as T;
   }
   
   return obj;
 };
 
 /**
  * CreataChain 네트워크 정보를 반환하는 함수
  * @returns CreataChain 네트워크 설정
  */
 export const getCreataChainConfig = () => {
   // 하드코딩된 CreataChain 네트워크 정보
   return {
     networkName: 'Catena (CIP-20) Chain Mainnet',
     rpcUrl: 'https://cvm.node.creatachain.com',
     chainId: 1000,
     chainIdHex: '0x3E8',
     currencySymbol: 'CTA',
     blockExplorerUrl: 'https://catena.explorer.creatachain.com'
   };
 };
 
 export default {
   truncateAddress,
   formatNumber,
   formatCTA,
   formatScore,
   formatRelativeTime,
   getRandomInt,
   shuffleArray,
   delay,
   setLocalStorage,
   getLocalStorage,
   removeLocalStorage,
   parseUrlParams,
   isValidAddress,
   getGameDisplayName,
   getResultEmoji,
   getRankEmoji,
   getUserFriendlyError,
   debounce,
   throttle,
   deepClone,
   getCreataChainConfig
 };
