 /**
  * API 클라이언트 서비스
  * 
  * 백엔드 API와의 통신을 처리하는 중앙화된 서비스
  * - HTTP 요청 처리
  * - 에러 핸들링
  * - 요청/응답 인터셉터
  * - 인증 토큰 관리
  */
 
 import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
 import type { 
   ApiResponse, 
   User, 
   GameSubmitRequest, 
   WalletVerifyRequest, 
   RankingResponse 
 } from '../types';
 
 // API 기본 URL (하드코딩된 값)
 const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
 
 // Axios 인스턴스 생성
 const axiosInstance: AxiosInstance = axios.create({
   baseURL: API_BASE_URL,
   timeout: 10000,
   headers: {
     'Content-Type': 'application/json',
   },
 });
 
 // 요청 인터셉터
 axiosInstance.interceptors.request.use(
   (config) => {
     // 인증 토큰 추가 (필요시)
     const token = localStorage.getItem('creata-auth-token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
 
     // 요청 로깅
     console.log(`📝 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
       params: config.params,
       data: config.data,
     });
 
     return config;
   },
   (error) => {
     console.error('🚨 API Request Error:', error);
     return Promise.reject(error);
   }
 );
 
 // 응답 인터셉터
 axiosInstance.interceptors.response.use(
   (response: AxiosResponse) => {
     // 응답 로깅
     console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
       status: response.status,
       data: response.data,
     });
 
     return response;
   },
   (error: AxiosError) => {
     // 에러 로깅
     console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
       status: error.response?.status,
       message: error.message,
       data: error.response?.data,
     });
 
     // 401 에러 시 인증 토큰 제거
     if (error.response?.status === 401) {
       localStorage.removeItem('creata-auth-token');
       // 필요시 로그인 페이지로 리다이렉트
     }
 
     return Promise.reject(error);
   }
 );
 
 // API 서비스 클래스
 class ApiService {
   // 기본 HTTP 메서드
   async get<T = any>(url: string, params?: any): Promise<T> {
     const response = await axiosInstance.get(url, { params });
     return response.data;
   }
 
   async post<T = any>(url: string, data?: any): Promise<T> {
     const response = await axiosInstance.post(url, data);
     return response.data;
   }
 
   async put<T = any>(url: string, data?: any): Promise<T> {
     const response = await axiosInstance.put(url, data);
     return response.data;
   }
 
   async delete<T = any>(url: string): Promise<T> {
     const response = await axiosInstance.delete(url);
     return response.data;
   }
 
   // 인증 관련 API
   async verifyWallet(request: WalletVerifyRequest): Promise<ApiResponse<User>> {
     return this.post('/auth/verify-wallet', request);
   }
 
   async confirmWalletInstall(walletAddress: string, telegramId?: string): Promise<ApiResponse> {
     return this.post('/auth/install-confirm', { walletAddress, telegramId });
   }
 
   async getUser(walletAddress: string): Promise<ApiResponse<User>> {
     return this.get(`/auth/user/${walletAddress}`);
   }
 
   // 게임 관련 API
   async submitGame(request: GameSubmitRequest): Promise<ApiResponse> {
     return this.post('/game/submit', request);
   }
 
   async getGameHistory(walletAddress: string, gameType?: string): Promise<ApiResponse> {
     const params = gameType ? { gameType } : undefined;
     return this.get(`/game/history/${walletAddress}`, params);
   }
 
   // 랭킹 관련 API
   async getRanking(params?: {
     limit?: number;
     language?: string;
     page?: number;
   }): Promise<RankingResponse> {
     return this.get('/ranking', params);
   }
 
   async getUserRanking(walletAddress: string): Promise<ApiResponse> {
     return this.get(`/ranking/user/${walletAddress}`);
   }
 
   // 에어드랍 관련 API (어드민 전용)
   async getAirdropHistory(params?: {
     status?: string;
     page?: number;
     limit?: number;
   }): Promise<ApiResponse> {
     return this.get('/airdrop/history', params);
   }
 
   // 상태 체크 API
   async healthCheck(): Promise<ApiResponse> {
     return this.get('/health');
   }
 
   // 파일 업로드 (필요시)
   async uploadFile(file: File, endpoint: string): Promise<ApiResponse> {
     const formData = new FormData();
     formData.append('file', file);
 
     const response = await axiosInstance.post(endpoint, formData, {
       headers: {
         'Content-Type': 'multipart/form-data',
       },
     });
 
     return response.data;
   }
 
   // 인증 토큰 관리
   setAuthToken(token: string): void {
     localStorage.setItem('creata-auth-token', token);
     axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
   }
 
   removeAuthToken(): void {
     localStorage.removeItem('creata-auth-token');
     delete axiosInstance.defaults.headers.common['Authorization'];
   }
 
   getAuthToken(): string | null {
     return localStorage.getItem('creata-auth-token');
   }
 }
 
 // 싱글턴 인스턴스 생성 및 내보내기
 export const api = new ApiService();
 
 // 개별 API 함수들 (편의성을 위해)
 export const authApi = {
   verifyWallet: (request: WalletVerifyRequest) => api.verifyWallet(request),
   confirmInstall: (walletAddress: string, telegramId?: string) => 
     api.confirmWalletInstall(walletAddress, telegramId),
   getUser: (walletAddress: string) => api.getUser(walletAddress),
 };
 
 export const gameApi = {
   submit: (request: GameSubmitRequest) => api.submitGame(request),
   getHistory: (walletAddress: string, gameType?: string) => 
     api.getGameHistory(walletAddress, gameType),
 };
 
 export const rankingApi = {
   getRanking: (params?: { limit?: number; language?: string; page?: number }) => 
     api.getRanking(params),
   getUserRanking: (walletAddress: string) => api.getUserRanking(walletAddress),
 };
 
 // 에러 핸들링 유틸리티
 export const handleApiError = (error: any): string => {
   if (axios.isAxiosError(error)) {
     if (error.response?.data?.message) {
       return error.response.data.message;
     }
     if (error.response?.data?.error) {
       return error.response.data.error;
     }
     if (error.message) {
       return error.message;
     }
   }
   
   return 'An unexpected error occurred';
 };
 
 // API 상태 확인 유틸리티
 export const checkApiHealth = async (): Promise<boolean> => {
   try {
     await api.healthCheck();
     return true;
   } catch (error) {
     console.error('API health check failed:', error);
     return false;
   }
 };
 
 export default api;
