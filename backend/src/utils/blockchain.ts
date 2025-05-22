 /**
  * CreataChain 블록체인 유틸리티
  * @description Catena 메인넷과의 상호작용을 위한 유틸리티 함수들
  */
 
 import { ethers } from 'ethers';
 
 /**
  * CreataChain Catena 메인넷 설정
  */
 export const CATENA_CONFIG = {
   // 하드코딩된 체인 설정 정보
   NETWORK_NAME: 'Catena (CIP-20) Chain Mainnet',
   RPC_URL: 'https://cvm.node.creatachain.com',
   CHAIN_ID: 1000, // 0x3E8
   CURRENCY_SYMBOL: 'CTA',
   BLOCK_EXPLORER_URL: 'https://catena.explorer.creatachain.com',
 } as const;
 
 /**
  * CTA 토큰 전송을 위한 Provider 인스턴스 생성
  * @returns ethers.JsonRpcProvider 인스턴스
  */
 export function getCatenaProvider(): ethers.JsonRpcProvider {
   return new ethers.JsonRpcProvider(CATENA_CONFIG.RPC_URL);
 }
 
 /**
  * 지갑 인스턴스 생성 (프라이빗 키 기반)
  * @param privateKey - 지갑 프라이빗 키
  * @returns ethers.Wallet 인스턴스
  */
 export function createWallet(privateKey: string): ethers.Wallet {
   const provider = getCatenaProvider();
   return new ethers.Wallet(privateKey, provider);
 }
 
 /**
  * CTA 토큰 잔액 조회
  * @param address - 조회할 지갑 주소
  * @returns Promise<string> - CTA 잔액 (문자열 형태)
  */
 export async function getCtaBalance(address: string): Promise<string> {
   try {
     const provider = getCatenaProvider();
     const balance = await provider.getBalance(address);
     return ethers.formatEther(balance);
   } catch (error) {
     console.error('CTA 잔액 조회 오류:', error);
     throw new Error('CTA 잔액 조회에 실패했습니다.');
   }
 }
 
 /**
  * CTA 토큰 전송
  * @param senderPrivateKey - 송신자 프라이빗 키
  * @param toAddress - 수신자 주소
  * @param amount - 전송할 CTA 수량 (문자열, 예: "10.5")
  * @returns Promise<string> - 트랜잭션 해시
  */
 export async function sendCta(
   senderPrivateKey: string,
   toAddress: string,
   amount: string
 ): Promise<string> {
   try {
     const wallet = createWallet(senderPrivateKey);
     
     // 수신자 주소 유효성 검증
     if (!ethers.isAddress(toAddress)) {
       throw new Error('유효하지 않은 수신자 주소입니다.');
     }
     
     // CTA 전송 트랜잭션 생성
     const tx = await wallet.sendTransaction({
       to: toAddress,
       value: ethers.parseEther(amount),
       gasLimit: 21000, // 기본 가스 한도
     });
     
     console.log(`CTA 전송 트랜잭션 전송됨: ${tx.hash}`);
     
     // 트랜잭션 확인 대기
     const receipt = await tx.wait();
     console.log(`트랜잭션 확인됨 (블록: ${receipt?.blockNumber})`);
     
     return tx.hash;
   } catch (error) {
     console.error('CTA 전송 오류:', error);
     throw new Error(`CTA 전송에 실패했습니다: ${error}`);
   }
 }
 
 /**
  * 트랜잭션 상태 확인
  * @param txHash - 트랜잭션 해시
  * @returns Promise<{success: boolean, blockNumber?: number, gasUsed?: bigint}>
  */
 export async function getTransactionStatus(txHash: string): Promise<{
   success: boolean;
   blockNumber?: number;
   gasUsed?: bigint;
 }> {
   try {
     const provider = getCatenaProvider();
     const receipt = await provider.getTransactionReceipt(txHash);
     
     if (!receipt) {
       return { success: false };
     }
     
     return {
       success: receipt.status === 1,
       blockNumber: receipt.blockNumber,
       gasUsed: receipt.gasUsed,
     };
   } catch (error) {
     console.error('트랜잭션 상태 조회 오류:', error);
     return { success: false };
   }
 }
 
 /**
  * 가스비 추정
  * @param fromAddress - 송신자 주소
  * @param toAddress - 수신자 주소
  * @param amount - 전송할 CTA 수량
  * @returns Promise<string> - 추정 가스비 (CTA 단위)
  */
 export async function estimateGasCost(
   fromAddress: string,
   toAddress: string,
   amount: string
 ): Promise<string> {
   try {
     const provider = getCatenaProvider();
     
     // 트랜잭션 가스 추정
     const estimatedGas = await provider.estimateGas({
       from: fromAddress,
       to: toAddress,
       value: ethers.parseEther(amount),
     });
     
     // 가스 가격 조회
     const gasPrice = await provider.getFeeData();
     const totalCost = estimatedGas * (gasPrice.gasPrice || BigInt(0));
     
     return ethers.formatEther(totalCost);
   } catch (error) {
     console.error('가스비 추정 오류:', error);
     throw new Error('가스비 추정에 실패했습니다.');
   }
 }
 
 /**
  * 지갑 주소 유효성 검증
  * @param address - 검증할 주소
  * @returns boolean - 유효한 주소인지 여부
  */
 export function isValidAddress(address: string): boolean {
   return ethers.isAddress(address);
 }
 
 /**
  * wei를 CTA로 변환
  * @param weiValue - wei 값
  * @returns string - CTA 값
  */
 export function weiToCta(weiValue: bigint | string): string {
   return ethers.formatEther(weiValue);
 }
 
 /**
  * CTA를 wei로 변환
  * @param ctaValue - CTA 값
  * @returns bigint - wei 값
  */
 export function ctaToWei(ctaValue: string): bigint {
   return ethers.parseEther(ctaValue);
 }
 
 /**
  * 현재 블록 번호 조회
  * @returns Promise<number> - 현재 블록 번호
  */
 export async function getCurrentBlockNumber(): Promise<number> {
   try {
     const provider = getCatenaProvider();
     return await provider.getBlockNumber();
   } catch (error) {
     console.error('현재 블록 번호 조회 오류:', error);
     throw new Error('블록 번호 조회에 실패했습니다.');
   }
 }
 
 /**
  * 네트워크 연결 상태 확인
  * @returns Promise<boolean> - 네트워크 연결 상태
  */
 export async function isNetworkConnected(): Promise<boolean> {
   try {
     const provider = getCatenaProvider();
     await provider.getBlockNumber();
     return true;
   } catch (error) {
     console.error('네트워크 연결 확인 오류:', error);
     return false;
   }
 }