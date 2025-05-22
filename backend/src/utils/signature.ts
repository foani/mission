 /**
  * CreataChain 미션 게임 서명 검증 유틸리티
  * @description 지갑 서명 검증 및 관련 유틸리티 함수들
  */
 
 import { verifyMessage, isAddress } from 'ethers';
 
 /**
  * 지갑 서명을 검증하는 함수
  * @param message - 서명된 메시지
  * @param signature - 서명
  * @param expectedAddress - 예상 주소
  * @returns 검증 결과
  */
 export const verifyWalletSignature = (
   message: string,
   signature: string,
   expectedAddress: string
 ): { isValid: boolean; recoveredAddress?: string; error?: string } => {
   try {
     // 1. 주소 형식 검증
     if (!isAddress(expectedAddress)) {
       return {
         isValid: false,
         error: '유효하지 않은 지갑 주소 형식입니다'
       };
     }
 
     // 2. 서명에서 주소 복원
     const recoveredAddress = verifyMessage(message, signature);
 
     // 3. 주소 비교 (대소문자 무시)
     const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
 
     return {
       isValid,
       recoveredAddress,
       error: isValid ? undefined : '서명에서 복원된 주소가 예상 주소와 일치하지 않습니다'
     };
   } catch (error) {
     return {
       isValid: false,
       error: `서명 검증 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
     };
   }
 };
 
 /**
  * Creata 인증 메시지 형식을 검증하는 함수
  * @param message - 검증할 메시지
  * @returns 검증 결과
  */
 export const validateAuthMessage = (message: string): { isValid: boolean; error?: string } => {
   try {
     // 하드코딩된 Creata 인증 메시지 패턴
     // 예시: "Creata 인증 요청 @ 1640123456789 by 0x742D35Cc6C2B8d3eE7D5b9aa09B2Ad1234567890"
     const authMessagePattern = /^Creata \uc778\uc99d \uc694\uccad @ \d+ by 0x[a-fA-F0-9]{40}$/;
     
     if (!authMessagePattern.test(message)) {
       return {
         isValid: false,
         error: '올바르지 않은 Creata 인증 메시지 형식입니다'
       };
     }
 
     // 타임스탬프 추출 및 검증
     const timestampMatch = message.match(/@ (\d+) by/);
     if (timestampMatch) {
       const timestamp = parseInt(timestampMatch[1]);
       const now = Date.now();
       const timeDiff = Math.abs(now - timestamp);
       
       // 하드코딩된 메시지 유효 기간 (10분)
       const maxValidTime = 10 * 60 * 1000; // 10분
       
       if (timeDiff > maxValidTime) {
         return {
           isValid: false,
           error: '인증 메시지가 만료되었습니다. 다시 시도해주세요'
         };
       }
     }
 
     return { isValid: true };
   } catch (error) {
     return {
       isValid: false,
       error: `메시지 검증 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
     };
   }
 };
 
 /**
  * 지갑 주소 형식을 검증하는 함수
  * @param address - 검증할 주소
  * @returns 검증 결과
  */
 export const validateWalletAddress = (address: string): { isValid: boolean; error?: string } => {
   try {
     if (!address || typeof address !== 'string') {
       return {
         isValid: false,
         error: '주소가 제공되지 않았거나 올바르지 않은 형식입니다'
       };
     }
 
     // 기본 형식 검사 (0x + 40자리 영숭자)
     if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
       return {
         isValid: false,
         error: '주소는 0x로 시작하고 40자리 영숭자로 구성되어야 합니다'
       };
     }
 
     // ethers.js로 주소 유효성 재검증
     if (!isAddress(address)) {
       return {
         isValid: false,
         error: '유효하지 않은 이더리움 주소입니다'
       };
     }
 
     return { isValid: true };
   } catch (error) {
     return {
       isValid: false,
       error: `주소 검증 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
     };
   }
 };
 
 /**
  * 인증 메시지를 생성하는 함수 (클라이언트에서 사용되는 형식과 동일)
  * @param walletAddress - 지갑 주소
  * @param timestamp - 타임스탬프 (옵션, 기본값: 현재 시간)
  * @returns 인증 메시지
  */
 export const generateAuthMessage = (
   walletAddress: string, 
   timestamp: number = Date.now()
 ): string => {
   return `Creata 인증 요청 @ ${timestamp} by ${walletAddress}`;
 };
 
 /**
  * 서명 해시를 검증하는 함수
  * @param signature - 검증할 서명
  * @returns 검증 결과
  */
 export const validateSignature = (signature: string): { isValid: boolean; error?: string } => {
   try {
     if (!signature || typeof signature !== 'string') {
       return {
         isValid: false,
         error: '서명이 제공되지 않았거나 올바르지 않은 형식입니다'
       };
     }
 
     // 기본 형식 검사 (0x + 130자리 영숭자)
     if (!/^0x[a-fA-F0-9]{130}$/.test(signature)) {
       return {
         isValid: false,
         error: '서명은 0x로 시작하고 130자리 영숭자로 구성되어야 합니다'
       };
     }
 
     return { isValid: true };
   } catch (error) {
     return {
       isValid: false,
       error: `서명 검증 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
     };
   }
 };
 
 /**
  * 전체 인증 데이터를 검증하는 하이레벨 함수
  * @param authData - 인증 데이터
  * @returns 검증 결과
  */
 export const validateAuthData = (authData: {
   walletAddress: string;
   message: string;
   signature: string;
 }): { isValid: boolean; errors: string[] } => {
   const errors: string[] = [];
 
   // 1. 주소 검증
   const addressValidation = validateWalletAddress(authData.walletAddress);
   if (!addressValidation.isValid && addressValidation.error) {
     errors.push(`주소 오류: ${addressValidation.error}`);
   }
 
   // 2. 메시지 검증
   const messageValidation = validateAuthMessage(authData.message);
   if (!messageValidation.isValid && messageValidation.error) {
     errors.push(`메시지 오류: ${messageValidation.error}`);
   }
 
   // 3. 서명 검증
   const signatureValidation = validateSignature(authData.signature);
   if (!signatureValidation.isValid && signatureValidation.error) {
     errors.push(`서명 오류: ${signatureValidation.error}`);
   }
 
   // 4. 서명 검증 (주소 일치 확인)
   if (errors.length === 0) {
     const walletVerification = verifyWalletSignature(
       authData.message,
       authData.signature,
       authData.walletAddress
     );
     
     if (!walletVerification.isValid && walletVerification.error) {
       errors.push(`인증 오류: ${walletVerification.error}`);
     }
   }
 
   return {
     isValid: errors.length === 0,
     errors
   };
 };
 
 /**
  * 주소를 축약하여 표시하는 함수
  * @param address - 지갑 주소
  * @param startLength - 앞에서 보여줄 문자 길이
  * @param endLength - 뒤에서 보여줄 문자 길이
  * @returns 축약된 주소
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
  * CreataChain 네트워크 정보를 반환하는 함수
  * @returns CreataChain 네트워크 설정
  */
 export const getCreataChainConfig = () => {
   // 하드코딩된 CreataChain Catena 메인넷 정보
   return {
     networkName: 'Catena (CIP-20) Chain Mainnet',
     rpcUrl: 'https://cvm.node.creatachain.com',
     chainId: 1000,
     chainIdHex: '0x3E8',
     currencySymbol: 'CTA',
     blockExplorerUrl: 'https://catena.explorer.creatachain.com',
     // 하드코딩된 CTA 토큰 컨트렉트 주소 (예시)
     ctaTokenAddress: '0x742D35Cc6C2B8d3eE7D5b9aa09B2Ad1234567890'
   };
 };
 
 export default {
   verifyWalletSignature,
   validateAuthMessage,
   validateWalletAddress,
   generateAuthMessage,
   validateSignature,
   validateAuthData,
   truncateAddress,
   getCreataChainConfig
 };
