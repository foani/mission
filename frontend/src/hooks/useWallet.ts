 /**
  * Creata Wallet 연동 Hook
  * 
  * CreataChain 지갑 연결, 인증, 트랜잭션 처리를 담당
  * - Creata Wallet Extension & Mobile App 지원
  * - 메타마스크 호환성 모드
  * - 자동 연결 및 상태 관리
  */
 
 import { useState, useEffect, useCallback } from 'react';
 import { ethers } from 'ethers';
 import type { User, WalletVerifyRequest, ApiResponse } from '../types';
 import { api } from '../services/api';
 
 interface WalletState {
   isConnected: boolean;
   walletAddress: string | null;
   walletType: 'creata' | 'metamask' | null;
   user: User | null;
   balance: string | null;
   isLoading: boolean;
   error: string | null;
 }
 
 export function useWallet() {
   const [walletState, setWalletState] = useState<WalletState>({
     isConnected: false,
     walletAddress: null,
     walletType: null,
     user: null,
     balance: null,
     isLoading: false,
     error: null,
   });
 
   // 지갑 연결 상태 확인
   const checkWalletConnection = useCallback(async () => {
     try {
       setWalletState(prev => ({ ...prev, isLoading: true, error: null }));
 
       // Creata Wallet 확인 우선
       if (window.creata?.isCreataWallet) {
         try {
           const address = await window.creata.getAddress();
           if (address) {
             await handleWalletConnection(address, 'creata');
             return;
           }
         } catch (error) {
           console.log('Creata Wallet not connected');
         }
       }
 
       // 메타마스크 확인 (폴백)
       if (window.ethereum?.isMetaMask) {
         try {
           const accounts = await window.ethereum.request({ method: 'eth_accounts' });
           if (accounts && accounts.length > 0) {
             await handleWalletConnection(accounts[0], 'metamask');
             return;
           }
         } catch (error) {
           console.log('MetaMask not connected');
         }
       }
 
     } catch (error: any) {
       setWalletState(prev => ({ 
         ...prev, 
         error: error.message || 'Failed to check wallet connection',
         isLoading: false 
       }));
     } finally {
       setWalletState(prev => ({ ...prev, isLoading: false }));
     }
   }, []);
 
   // 지갑 연결 처리
   const handleWalletConnection = async (address: string, walletType: 'creata' | 'metamask') => {
     try {
       // 사용자 정보 가져오기
       const userResponse = await api.get(`/auth/user/${address}`);
       
       setWalletState(prev => ({
         ...prev,
         isConnected: true,
         walletAddress: address,
         walletType,
         user: userResponse.data || null,
         error: null
       }));
 
       // 로컬 스토리지에 저장
       localStorage.setItem('creata-wallet-connected', 'true');
       localStorage.setItem('creata-wallet-address', address);
       localStorage.setItem('creata-wallet-type', walletType);
 
     } catch (error: any) {
       console.error('Failed to fetch user info:', error);
       // 지갑은 연결되었지만 사용자 정보가 없는 경우
       setWalletState(prev => ({
         ...prev,
         isConnected: true,
         walletAddress: address,
         walletType,
         user: null,
         error: null
       }));
     }
   };
 
   // Creata Wallet 연결
   const connectCreataWallet = async (): Promise<boolean> => {
     try {
       if (!window.creata?.isCreataWallet) {
         throw new Error('Creata Wallet not installed');
       }
 
       setWalletState(prev => ({ ...prev, isLoading: true, error: null }));
 
       const address = await window.creata.getAddress();
       if (!address) {
         throw new Error('Failed to get wallet address');
       }
 
       await handleWalletConnection(address, 'creata');
       return true;
 
     } catch (error: any) {
       setWalletState(prev => ({ 
         ...prev, 
         error: error.message || 'Failed to connect Creata Wallet',
         isLoading: false 
       }));
       return false;
     }
   };
 
   // 메타마스크 연결
   const connectMetaMask = async (): Promise<boolean> => {
     try {
       if (!window.ethereum?.isMetaMask) {
         throw new Error('MetaMask not installed');
       }
 
       setWalletState(prev => ({ ...prev, isLoading: true, error: null }));
 
       const accounts = await window.ethereum.request({ 
         method: 'eth_requestAccounts' 
       });
       
       if (!accounts || accounts.length === 0) {
         throw new Error('No accounts found');
       }
 
       await handleWalletConnection(accounts[0], 'metamask');
       return true;
 
     } catch (error: any) {
       setWalletState(prev => ({ 
         ...prev, 
         error: error.message || 'Failed to connect MetaMask',
         isLoading: false 
       }));
       return false;
     }
   };
 
   // 지갑 연결 (자동 감지)
   const connectWallet = async (): Promise<boolean> => {
     // Creata Wallet 우선 시도
     if (window.creata?.isCreataWallet) {
       return await connectCreataWallet();
     }
     
     // 메타마스크 폴백
     if (window.ethereum?.isMetaMask) {
       return await connectMetaMask();
     }
 
     setWalletState(prev => ({ 
       ...prev, 
       error: 'No supported wallet found. Please install Creata Wallet or MetaMask.'
     }));
     return false;
   };
 
   // 지갑 인증 (서명)
   const verifyWallet = async (): Promise<boolean> => {
     try {
       if (!walletState.walletAddress || !walletState.walletType) {
         throw new Error('Wallet not connected');
       }
 
       setWalletState(prev => ({ ...prev, isLoading: true, error: null }));
 
       // 서명할 메시지 생성
       const message = `Creata Mission Game verification\nAddress: ${walletState.walletAddress}\nTimestamp: ${Date.now()}`;
       
       let signature: string;
       
       if (walletState.walletType === 'creata' && window.creata) {
         signature = await window.creata.signMessage(message);
       } else if (walletState.walletType === 'metamask' && window.ethereum) {
         signature = await window.ethereum.request({
           method: 'personal_sign',
           params: [message, walletState.walletAddress]
         });
       } else {
         throw new Error('Wallet not available for signing');
       }
 
       // 서버에 인증 요청
       const verifyRequest: WalletVerifyRequest = {
         walletAddress: walletState.walletAddress,
         message,
         signature
       };
 
       const response: ApiResponse = await api.post('/auth/verify-wallet', verifyRequest);
       
       if (response.success) {
         // 사용자 정보 업데이트
         const userResponse = await api.get(`/auth/user/${walletState.walletAddress}`);
         setWalletState(prev => ({
           ...prev,
           user: userResponse.data,
           isLoading: false
         }));
         return true;
       }
       
       throw new Error(response.message || 'Wallet verification failed');
 
     } catch (error: any) {
       setWalletState(prev => ({ 
         ...prev, 
         error: error.message || 'Wallet verification failed',
         isLoading: false 
       }));
       return false;
     }
   };
 
   // 지갑 연결 해제
   const disconnectWallet = useCallback(() => {
     setWalletState({
       isConnected: false,
       walletAddress: null,
       walletType: null,
       user: null,
       balance: null,
       isLoading: false,
       error: null,
     });
 
     // 로컬 스토리지 정리
     localStorage.removeItem('creata-wallet-connected');
     localStorage.removeItem('creata-wallet-address');
     localStorage.removeItem('creata-wallet-type');
   }, []);
 
   // CTA 잔고 조회
   const getBalance = useCallback(async (): Promise<string | null> => {
     try {
       if (!walletState.walletAddress) return null;
 
       // 하드코딩된 CreataChain RPC 설정
       const provider = new ethers.JsonRpcProvider('https://cvm.node.creatachain.com');
       const balance = await provider.getBalance(walletState.walletAddress);
       const formattedBalance = ethers.formatEther(balance);
       
       setWalletState(prev => ({ ...prev, balance: formattedBalance }));
       return formattedBalance;
 
     } catch (error: any) {
       console.error('Failed to get balance:', error);
       return null;
     }
   }, [walletState.walletAddress]);
 
   // 이효 처리
   useEffect(() => {
     // 자동 연결 시도
     const savedConnection = localStorage.getItem('creata-wallet-connected');
     if (savedConnection === 'true') {
       checkWalletConnection();
     }
   }, [checkWalletConnection]);
 
   // 지갑 변경 감지 (메타마스크)
   useEffect(() => {
     if (window.ethereum?.isMetaMask) {
       const handleAccountsChanged = (accounts: string[]) => {
         if (accounts.length === 0) {
           disconnectWallet();
         } else if (accounts[0] !== walletState.walletAddress) {
           handleWalletConnection(accounts[0], 'metamask');
         }
       };
 
       window.ethereum.on('accountsChanged', handleAccountsChanged);
       
       return () => {
         window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
       };
     }
   }, [walletState.walletAddress, disconnectWallet]);
 
   return {
     // 상태
     isConnected: walletState.isConnected,
     walletAddress: walletState.walletAddress,
     walletType: walletState.walletType,
     user: walletState.user,
     balance: walletState.balance,
     isLoading: walletState.isLoading,
     error: walletState.error,
     
     // 메서드
     connectWallet,
     connectCreataWallet,
     connectMetaMask,
     verifyWallet,
     disconnectWallet,
     getBalance,
     
     // 유틸리티
     isCreataWalletAvailable: !!window.creata?.isCreataWallet,
     isMetaMaskAvailable: !!window.ethereum?.isMetaMask,
     hasAnyWallet: !!(window.creata?.isCreataWallet || window.ethereum?.isMetaMask),
   };
 }
