 /**
  * CreataChain Mission Game Admin Dashboard
  * 게임 설정 관리 컴포넌트
  * 관리자가 각 게임의 시간, 라운드 수, 점수 등을 조정할 수 있는 UI
  */
 
 import React, { useState, useEffect } from 'react';
 import { useTranslation } from 'react-i18next';
 import {
   getAllGameSettings,
   updateGameSettings,
   initializeGameSettings,
   GameSettings
 } from '../../services/gameSettings.service';
 import './GameSettingsManager.css';
 
 interface GameSettingsManagerProps {
   authToken: string;
 }
 
 export default function GameSettingsManager({ authToken }: GameSettingsManagerProps) {
   const { t } = useTranslation();
   const [gameSettings, setGameSettings] = useState<GameSettings[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   const [editingSettings, setEditingSettings] = useState<Record<string, Partial<GameSettings>>>({});
   const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
 
   // 게임 설정 로드
   useEffect(() => {
     loadGameSettings();
   }, []);
 
   const loadGameSettings = async () => {
     try {
       setIsLoading(true);
       const settings = await getAllGameSettings();
       setGameSettings(settings);
       
       // 편집 상태 초기화
       const editingState: Record<string, Partial<GameSettings>> = {};
       settings.forEach(setting => {
         editingState[setting.gameType] = { ...setting };
       });
       setEditingSettings(editingState);
     } catch (error) {
       console.error('Error loading game settings:', error);
       showMessage('error', '게임 설정을 불러오는데 실패했습니다.');
     } finally {
       setIsLoading(false);
     }
   };
 
   const showMessage = (type: 'success' | 'error', text: string) => {
     setMessage({ type, text });
     setTimeout(() => setMessage(null), 3000);
   };
 
   const handleInputChange = (gameType: string, field: keyof GameSettings, value: any) => {
     setEditingSettings(prev => ({
       ...prev,
       [gameType]: {
         ...prev[gameType],
         [field]: value
       }
     }));
   };
 
   const saveSettings = async (gameType: string) => {
     try {
       setIsSaving(true);
       const settingsToUpdate = editingSettings[gameType];
       
       if (!settingsToUpdate) {
         throw new Error('업데이트할 설정이 없습니다.');
       }
 
       const updatedSettings = await updateGameSettings(
         gameType,
         {
           totalRounds: settingsToUpdate.totalRounds,
           choiceTimeSeconds: settingsToUpdate.choiceTimeSeconds,
           resultDisplaySeconds: settingsToUpdate.resultDisplaySeconds,
           pointsPerWin: settingsToUpdate.pointsPerWin,
           pointsPerLoss: settingsToUpdate.pointsPerLoss,
           isActive: settingsToUpdate.isActive
         },
         authToken
       );
 
       // 업데이트된 설정으로 상태 갱신
       setGameSettings(prev => 
         prev.map(setting => 
           setting.gameType === gameType ? updatedSettings : setting
         )
       );
 
       showMessage('success', `${gameType} 게임 설정이 성공적으로 업데이트되었습니다.`);
     } catch (error: any) {
       console.error('Error saving game settings:', error);
       showMessage('error', `설정 저장 실패: ${error.message || '알 수 없는 오류'}`);
     } finally {
       setIsSaving(false);
     }
   };
 
   const initializeAllSettings = async () => {
     try {
       setIsSaving(true);
       const initializedSettings = await initializeGameSettings(authToken);
       setGameSettings(initializedSettings);
       
       // 편집 상태 다시 초기화
       const editingState: Record<string, Partial<GameSettings>> = {};
       initializedSettings.forEach(setting => {
         editingState[setting.gameType] = { ...setting };
       });
       setEditingSettings(editingState);
       
       showMessage('success', '모든 게임 설정이 초기화되었습니다.');
     } catch (error: any) {
       console.error('Error initializing game settings:', error);
       showMessage('error', `초기화 실패: ${error.message || '알 수 없는 오류'}`);
     } finally {
       setIsSaving(false);
     }
   };
 
   const resetSettings = (gameType: string) => {
     const originalSetting = gameSettings.find(s => s.gameType === gameType);
     if (originalSetting) {
       setEditingSettings(prev => ({
         ...prev,
         [gameType]: { ...originalSetting }
       }));
     }
   };
 
   const getGameTypeDisplayName = (gameType: string): string => {
     const displayNames: Record<string, string> = {
       binary: 'Binary Options',
       derby: 'Lazy Derby',
       darts: 'Reverse Darts'
     };
     return displayNames[gameType] || gameType;
   };
 
   const hasChanges = (gameType: string): boolean => {
     const original = gameSettings.find(s => s.gameType === gameType);
     const edited = editingSettings[gameType];
     
     if (!original || !edited) return false;
     
     return (
       original.totalRounds !== edited.totalRounds ||
       original.choiceTimeSeconds !== edited.choiceTimeSeconds ||
       original.resultDisplaySeconds !== edited.resultDisplaySeconds ||
       original.pointsPerWin !== edited.pointsPerWin ||
       original.pointsPerLoss !== edited.pointsPerLoss ||
       original.isActive !== edited.isActive
     );
   
     if (isLoading) {
       return (
         <div className="game-settings-manager loading">
           <div className="loading-spinner">🔄</div>
           <p>게임 설정을 불러오는 중...</p>
         </div>
       );
     }
   
     return (
       <div className="game-settings-manager">
         {/* 헤더 */}
         <div className="manager-header">
           <h2>🎮 게임 설정 관리</h2>
           <p>각 게임의 시간, 라운드 수, 점수 등을 조정할 수 있습니다</p>
           
           {/* 전역 액션 버튼 */}
           <div className="global-actions">
             <button 
               onClick={initializeAllSettings}
               disabled={isSaving}
               className="btn-initialize"
             >
               {isSaving ? '초기화 중...' : '🔄 모든 설정 초기화'}
             </button>
             <button 
               onClick={loadGameSettings}
               disabled={isSaving}
               className="btn-refresh"
             >
               📊 새로고침
             </button>
           </div>
         </div>
   
         {/* 메시지 표시 */}
         {message && (
           <div className={`message ${message.type}`}>
             {message.type === 'success' ? '✅' : '❌'} {message.text}
           </div>
         )}
   
         {/* 게임 설정 카드들 */}
         <div className="settings-grid">
           {gameSettings.map(setting => {
             const editedSetting = editingSettings[setting.gameType];
             const gameDisplayName = getGameTypeDisplayName(setting.gameType);
             const settingHasChanges = hasChanges(setting.gameType);
             
             if (!editedSetting) return null;
   
             return (
               <div key={setting.gameType} className={`setting-card ${setting.gameType}`}>
                 {/* 카드 헤더 */}
                 <div className="card-header">
                   <h3>{gameDisplayName}</h3>
                   <div className="status-indicators">
                     <span className={`status ${editedSetting.isActive ? 'active' : 'inactive'}`}>
                       {editedSetting.isActive ? '🟢 활성' : '🔴 비활성'}
                     </span>
                     {settingHasChanges && (
                       <span className="changes-indicator">📝 변경됨</span>
                     )}
                   </div>
                 </div>
   
                 {/* 설정 폼 */}
                 <div className="setting-form">
                   {/* 총 라운드 수 */}
                   <div className="form-group">
                     <label htmlFor={`totalRounds-${setting.gameType}`}>
                       🎯 총 라운드 수
                     </label>
                     <input
                       id={`totalRounds-${setting.gameType}`}
                       type="number"
                       min="1"
                       max="10"
                       value={editedSetting.totalRounds || 3}
                       onChange={(e) => handleInputChange(
                         setting.gameType, 
                         'totalRounds', 
                         parseInt(e.target.value)
                       )}
                       className="number-input"
                     />
                     <small>1-10 라운드</small>
                   </div>
   
                   {/* 선택 시간 (초) */}
                   <div className="form-group">
                     <label htmlFor={`choiceTime-${setting.gameType}`}>
                       ⏱️ 선택 시간 (초)
                     </label>
                     <input
                       id={`choiceTime-${setting.gameType}`}
                       type="number"
                       min="5"
                       max="60"
                       value={editedSetting.choiceTimeSeconds || 10}
                       onChange={(e) => handleInputChange(
                         setting.gameType, 
                         'choiceTimeSeconds', 
                         parseInt(e.target.value)
                       )}
                       className="number-input"
                     />
                     <small>5-60초</small>
                   </div>
   
                   {/* 결과 표시 시간 (초) */}
                   <div className="form-group">
                     <label htmlFor={`resultTime-${setting.gameType}`}>
                       📊 결과 표시 시간 (초)
                     </label>
                     <input
                       id={`resultTime-${setting.gameType}`}
                       type="number"
                       min="1"
                       max="10"
                       value={editedSetting.resultDisplaySeconds || 3}
                       onChange={(e) => handleInputChange(
                         setting.gameType, 
                         'resultDisplaySeconds', 
                         parseInt(e.target.value)
                       )}
                       className="number-input"
                     />
                     <small>1-10초</small>
                   </div>
   
                   {/* 승리 시 점수 */}
                   <div className="form-group">
                     <label htmlFor={`winPoints-${setting.gameType}`}>
                       🏆 승리 시 점수
                     </label>
                     <input
                       id={`winPoints-${setting.gameType}`}
                       type="number"
                       min="0"
                       max="1000"
                       value={editedSetting.pointsPerWin || 100}
                       onChange={(e) => handleInputChange(
                         setting.gameType, 
                         'pointsPerWin', 
                         parseInt(e.target.value)
                       )}
                       className="number-input"
                     />
                     <small>0-1000점</small>
                   </div>
   
                   {/* 패배 시 점수 */}
                   <div className="form-group">
                     <label htmlFor={`losePoints-${setting.gameType}`}>
                       💔 패배 시 점수
                     </label>
                     <input
                       id={`losePoints-${setting.gameType}`}
                       type="number"
                       min="0"
                       max="1000"
                       value={editedSetting.pointsPerLoss || 0}
                       onChange={(e) => handleInputChange(
                         setting.gameType, 
                         'pointsPerLoss', 
                         parseInt(e.target.value)
                       )}
                       className="number-input"
                     />
                     <small>0-1000점</small>
                   </div>
   
                   {/* 활성 상태 */}
                   <div className="form-group checkbox-group">
                     <label className="checkbox-label">
                       <input
                         type="checkbox"
                         checked={editedSetting.isActive || false}
                         onChange={(e) => handleInputChange(
                           setting.gameType, 
                           'isActive', 
                           e.target.checked
                         )}
                       />
                       <span className="checkmark"></span>
                       게임 활성화
                     </label>
                   </div>
                 </div>
   
                 {/* 카드 액션 버튼 */}
                 <div className="card-actions">
                   <button
                     onClick={() => resetSettings(setting.gameType)}
                     disabled={!settingHasChanges || isSaving}
                     className="btn-reset"
                   >
                     🔄 되돌리기
                   </button>
                   <button
                     onClick={() => saveSettings(setting.gameType)}
                     disabled={!settingHasChanges || isSaving}
                     className="btn-save"
                   >
                     {isSaving ? '저장 중...' : '💾 저장'}
                   </button>
                 </div>
   
                 {/* 게임 플레이 시간 미리보기 */}
                 <div className="time-preview">
                   <h4>⏰ 예상 플레이 시간</h4>
                   <div className="time-calculation">
                     <span>총 시간: </span>
                     <strong>
                       {((editedSetting.choiceTimeSeconds || 10) + (editedSetting.resultDisplaySeconds || 3)) * (editedSetting.totalRounds || 3)}
                       초 ({Math.round(((editedSetting.choiceTimeSeconds || 10) + (editedSetting.resultDisplaySeconds || 3)) * (editedSetting.totalRounds || 3) / 60 * 10) / 10}분)
                     </strong>
                   </div>
                   <small>
                     (선택시간 {editedSetting.choiceTimeSeconds || 10}초 + 결과시간 {editedSetting.resultDisplaySeconds || 3}초) × {editedSetting.totalRounds || 3}라운드
                   </small>
                 </div>
               </div>
             );
           })}
         </div>
   
         {/* 게임 설정이 없는 경우 */}
         {gameSettings.length === 0 && (
           <div className="no-settings">
             <p>⚠️ 게임 설정이 없습니다.</p>
             <button 
               onClick={initializeAllSettings}
               disabled={isSaving}
               className="btn-initialize"
             >
               🔄 초기 설정 생성
             </button>
           </div>
         )}
       </div>
     );
   }
