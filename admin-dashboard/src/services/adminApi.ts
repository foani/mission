/**
 * 어드민 API 서비스
 * CreataChain 텔레그램 미션 게임 - 어드민 대시보드용 API 클라이언트
 * 
 * @description 관리자 인증, 사용자 관리, 게임 로그, 랭킹, 에어드랍 등 모든 어드민 기능을 위한 API 호출 관리
 * @author CreataChain Team
 * @version 1.0.0
 */

// 하드코딩된 API 베이스 URL - 환경변수로 관리 필요
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// 하드코딩된 API 엔드포인트 상수
const ENDPOINTS = {
  ADMIN_LOGIN: '/admin/login',
  ADMIN_ME: '/admin/me',
  USERS: '/admin/users',
  USER_DETAIL: (id: string) => `/admin/users/${id}`,
  GAME_LOGS: '/admin/game-logs',
  RANKING: '/ranking',
  AIRDROP_QUEUE: '/airdrop/queue',
  AIRDROP_EXECUTE: '/airdrop/execute',
  GAME_SETTINGS: '/api/game/settings',
  REWARD_SETTINGS: '/api/reward/settings'
} as const;

// API 응답 기본 구조
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 어드민 사용자 타입
interface AdminUser {
  id: number;
  email: string;
  role: string;
  lastLogin?: string;
}

// 게임 사용자 타입
interface GameUser {
  id: string;
  walletAddress: string;
  telegramId?: string;
  language: string;
  isWalletVerified: boolean;
  isWalletInstalled: boolean;
  score: number;
  lastPlayedAt?: string;
  createdAt: string;
}

// localStorage에서 JWT 토큰 조회
function getAuthToken(): string | null {
  try {
    return localStorage.getItem('admin_token');
  } catch (error) {
    console.error('토큰 조회 오류:', error);
    return null;
  }
}

// localStorage에 JWT 토큰 저장
function setAuthToken(token: string): void {
  try {
    localStorage.setItem('admin_token', token);
  } catch (error) {
    console.error('토큰 저장 오류:', error);
  }
}

// HTTP 헤더 생성
function createHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

// API 요청 실행
async function makeRequest<T = any>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...createHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API 요청 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

// 어드민 API 클래스
class AdminAPI {
  // 관리자 로그인
  async login(email: string, password: string): Promise<ApiResponse<{token: string, admin: AdminUser}>> {
    const response = await makeRequest<{token: string, admin: AdminUser}>(ENDPOINTS.ADMIN_LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  }

  // 관리자 정보 조회
  async getProfile(): Promise<ApiResponse<AdminUser>> {
    return await makeRequest<AdminUser>(ENDPOINTS.ADMIN_ME);
  }

  // 로그아웃
  logout(): void {
    localStorage.removeItem('admin_token');
  }

  // 인증 상태 확인
  isAuthenticated(): boolean {
    return getAuthToken() !== null;
  }

  // 사용자 목록 조회
  async getUsers(filters: any = {}): Promise<ApiResponse<GameUser[]>> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = queryParams.toString() 
      ? `${ENDPOINTS.USERS}?${queryParams.toString()}`
      : ENDPOINTS.USERS;

    return await makeRequest<GameUser[]>(url);
  }

  // 게임 로그 조회
  async getGameLogs(filters: any = {}): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = queryParams.toString() 
      ? `${ENDPOINTS.GAME_LOGS}?${queryParams.toString()}`
      : ENDPOINTS.GAME_LOGS;

    return await makeRequest<any[]>(url);
  }

  // 랭킹 조회
  async getRanking(options: any = {}): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = queryParams.toString() 
      ? `${ENDPOINTS.RANKING}?${queryParams.toString()}`
      : ENDPOINTS.RANKING;

    return await makeRequest<any[]>(url);
  }

  // 에어드랍 큐에 추가
  async addToAirdropQueue(walletAddress: string, rewardType: string, ctaAmount: string): Promise<ApiResponse<any>> {
    return await makeRequest(ENDPOINTS.AIRDROP_QUEUE, {
      method: 'POST',
      body: JSON.stringify({ walletAddress, rewardType, ctaAmount }),
    });
  }

  // 에어드랍 실행
  async executeAirdrop(): Promise<ApiResponse<{processed: number}>> {
    return await makeRequest<{processed: number}>(ENDPOINTS.AIRDROP_EXECUTE, {
      method: 'POST',
    });
  }
}

// AdminAPI 인스턴스 생성 및 내보내기
const adminApi = new AdminAPI();

export default adminApi;
export type { ApiResponse, AdminUser, GameUser };
