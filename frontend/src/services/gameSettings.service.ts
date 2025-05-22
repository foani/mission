 /**
  * CreataChain Mission Game Frontend
  * 게임 설정 API 서비스
  * 백엔드에서 게임 설정을 가져오고 업데이트하는 함수들
  */
 
 // 게임 설정 인터페이스
 export interface GameSettings {
   id: number;
   gameType: string;
   totalRounds: number;
   choiceTimeSeconds: number;
   resultDisplaySeconds: number;
   pointsPerWin: number;
   pointsPerLoss: number;
   isActive: boolean;
   createdAt: string;
   updatedAt: string;
 }
 
 // API 응답 인터페이스
 export interface GameSettingsResponse {
   success: boolean;
   data: GameSettings | GameSettings[];
   message?: string;
 }
 
 const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
 
 /**
  * 모든 게임 설정을 가져오는 함수
  */
 export const getAllGameSettings = async (): Promise<GameSettings[]> => {
   try {
     const response = await fetch(`${API_BASE_URL}/api/game/settings`, {
       method: 'GET',
       headers: {
         'Content-Type': 'application/json',
       },
     });
 
     if (!response.ok) {
       throw new Error(`HTTP error! status: ${response.status}`);
     }
 
     const result: GameSettingsResponse = await response.json();
     
     if (!result.success) {
       throw new Error(result.message || 'Failed to fetch game settings');
     }
 
     return result.data as GameSettings[];
   } catch (error) {
     console.error('Error fetching all game settings:', error);
     throw error;
   }
 };
 
 /**
  * 특정 게임의 설정을 가져오는 함수
  */
 export const getGameSettings = async (gameType: string): Promise<GameSettings | null> => {
   try {
     const response = await fetch(`${API_BASE_URL}/api/game/settings/${gameType}`, {
       method: 'GET',
       headers: {
         'Content-Type': 'application/json',
       },
     });
 
     if (!response.ok) {
       if (response.status === 404) {
         return null; // 설정이 없으면 null 반환
       }
       throw new Error(`HTTP error! status: ${response.status}`);
     }
 
     const result: GameSettingsResponse = await response.json();
     
     if (!result.success) {
       throw new Error(result.message || 'Failed to fetch game settings');
     }
 
     return result.data as GameSettings;
   } catch (error) {
     console.error(`Error fetching game settings for ${gameType}:`, error);
     throw error;
   }
 };
 
 /**
  * 게임 설정을 업데이트하는 함수 (관리자 전용)
  */
 export const updateGameSettings = async (
   gameType: string,
   settings: Partial<Omit<GameSettings, 'id' | 'gameType' | 'createdAt' | 'updatedAt'>>,
   authToken: string
 ): Promise<GameSettings> => {
   try {
     const response = await fetch(`${API_BASE_URL}/api/game/settings/${gameType}`, {
       method: 'PUT',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${authToken}`,
       },
       body: JSON.stringify(settings),
     });
 
     if (!response.ok) {
       throw new Error(`HTTP error! status: ${response.status}`);
     }
 
     const result: GameSettingsResponse = await response.json();
     
     if (!result.success) {
       throw new Error(result.message || 'Failed to update game settings');
     }
 
     return result.data as GameSettings;
   } catch (error) {
     console.error(`Error updating game settings for ${gameType}:`, error);
     throw error;
   }
 };
 
 /**
  * 게임 설정을 초기화하는 함수 (관리자 전용)
  */
 export const initializeGameSettings = async (authToken: string): Promise<GameSettings[]> => {
   try {
     const response = await fetch(`${API_BASE_URL}/api/game/settings/init`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${authToken}`,
       },
     });
 
     if (!response.ok) {
       throw new Error(`HTTP error! status: ${response.status}`);
     }
 
     const result: GameSettingsResponse = await response.json();
     
     if (!result.success) {
       throw new Error(result.message || 'Failed to initialize game settings');
     }
 
     return result.data as GameSettings[];
   } catch (error) {
     console.error('Error initializing game settings:', error);
     throw error;
   }
 };
 
 /**
  * 기본 게임 설정을 반환하는 함수 (API 호출 실패 시 사용)
  */
 export const getDefaultGameSettings = (gameType: string): GameSettings => {
   // 하드코딩된 기본 설정값
   const defaultSettings: Record<string, Partial<GameSettings>> = {
     binary: {
       totalRounds: 3,
       choiceTimeSeconds: 10,
       resultDisplaySeconds: 3,
       pointsPerWin: 100,
       pointsPerLoss: 0,
     },
     derby: {
       totalRounds: 1,
       choiceTimeSeconds: 30,
       resultDisplaySeconds: 5,
       pointsPerWin: 150,
       pointsPerLoss: 0,
     },
     darts: {
       totalRounds: 5,
       choiceTimeSeconds: 15,
       resultDisplaySeconds: 3,
       pointsPerWin: 50,
       pointsPerLoss: 0,
     },
   };
 
   const base = defaultSettings[gameType] || defaultSettings.binary;
   
   return {
     id: 0,
     gameType,
     totalRounds: base.totalRounds!,
     choiceTimeSeconds: base.choiceTimeSeconds!,
     resultDisplaySeconds: base.resultDisplaySeconds!,
     pointsPerWin: base.pointsPerWin!,
     pointsPerLoss: base.pointsPerLoss!,
     isActive: true,
     createdAt: new Date().toISOString(),
     updatedAt: new Date().toISOString(),
   };
 };
