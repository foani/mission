 /**
  * DerbyGameAdmin.tsx - Lazy Derby 게임 관리자 설정 컴포넌트
  * 관리자가 게임 설정을 동적으로 조정할 수 있는 UI
  */
 
 import React, { useState, useEffect } from 'react';
 import './DerbyGameAdmin.css';
 
 interface DerbyGameSettings {
   id: string;
   raceDuration: number; // 경주 시간 (밀리초)
   countdownTime: number; // 카운트다운 시간 (초)
   winScore: number; // 승리 시 점수
   loseScore: number; // 패배 시 점수
   horses: {
     id: number;
     name: string;
     color: string;
     emoji: string;
     baseSpeed: number;
     lane: number;
   }[];
   isActive: boolean;
 }
 
 // 하드코딩된 기본 설정
 const DEFAULT_SETTINGS: DerbyGameSettings = {
   id: 'derby_default',
   raceDuration: 15000,
   countdownTime: 3,
   winScore: 100,
   loseScore: 0,
   horses: [
     { id: 1, name: 'Thunder', color: '#FF6B6B', emoji: '🐎', baseSpeed: 0.8, lane: 1 },
     { id: 2, name: 'Lightning', color: '#4ECDC4', emoji: '🦄', baseSpeed: 0.6, lane: 2 },
     { id: 3, name: 'Storm', color: '#45B7D1', emoji: '🐴', baseSpeed: 0.4, lane: 3 },
     { id: 4, name: 'Blaze', color: '#96CEB4', emoji: '🎠', baseSpeed: 0.7, lane: 4 },
     { id: 5, name: 'Flash', color: '#FECA57', emoji: '🦓', baseSpeed: 0.5, lane: 5 }
   ],
   isActive: true
 };
 
 const EMOJI_OPTIONS = ['🐎', '🦄', '🐴', '🎠', '🦓', '🐎', '🐑', '🐮', '🐷', '🐸'];
 
 export default function DerbyGameAdmin() {
   const [settings, setSettings] = useState<DerbyGameSettings>(DEFAULT_SETTINGS);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
 
   // 설정 로드
   const loadSettings = async () => {
     try {
       setIsLoading(true);
       const response = await fetch('/api/game/settings/derby');
       if (response.ok) {
         const data = await response.json();
         setSettings(data);
       } else {
         console.warn('설정 로드 실패, 기본 설정 사용');
       }
     } catch (error) {
       console.error('설정 로드 오류:', error);
       setMessage({ type: 'error', text: '설정 로드에 실패했습니다.' });
     } finally {
       setIsLoading(false);
     }
   };
 
   // 설정 저장
   const saveSettings = async () => {
     try {
       setIsSaving(true);
       setMessage(null);
       
       const response = await fetch('/api/game/settings/derby', {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(settings),
       });
 
       if (response.ok) {
         setMessage({ type: 'success', text: '설정이 성공적으로 저장되었습니다.' });
       } else {
         throw new Error('저장 실패');
       }
     } catch (error) {
       console.error('설정 저장 오류:', error);
       setMessage({ type: 'error', text: '설정 저장에 실패했습니다.' });
     } finally {
       setIsSaving(false);
     }
   };
 
   // 기본 설정으로 리셋
   const resetToDefault = () => {
     setSettings(DEFAULT_SETTINGS);
     setMessage({ type: 'success', text: '기본 설정으로 리셋되었습니다.' });
   };
 
   // 말 설정 업데이트
   const updateHorse = (index: number, field: string, value: any) => {
     const newHorses = [...settings.horses];
     newHorses[index] = { ...newHorses[index], [field]: value };
     setSettings({ ...settings, horses: newHorses });
   };
 
   // 컴포넌트 마운트 시 설정 로드
   useEffect(() => {
     loadSettings();
   }, []);
 
   // 메시지 자동 삭제
   useEffect(() => {
     if (message) {
       const timer = setTimeout(() => setMessage(null), 3000);
       return () => clearTimeout(timer);
     }
   }, [message]);
 
   if (isLoading) {
     return (
       <div className="derby-admin">
         <div className="admin-header">
           <h2>🐎 Lazy Derby 게임 설정</h2>
           <p>로딩 중...</p>
         </div>
       </div>
     );
   }
 
   return (
     <div className="derby-admin">
       <div className="admin-header">
         <h2>🐎 Lazy Derby 게임 설정</h2>
         <p>게임 규칙과 설정을 조정할 수 있습니다.</p>
         
         {message && (
           <div className={`message ${message.type}`}>
             {message.text}
           </div>
         )}
       </div>
 
       <div className="admin-content">
         {/* 게임 활성화 상태 */}
         <div className="setting-group">
           <h3>게임 상태</h3>
           <div className="setting-item">
             <label className="toggle-switch">
               <input
                 type="checkbox"
                 checked={settings.isActive}
                 onChange={(e) => setSettings({...settings, isActive: e.target.checked})}
               />
               <span className="toggle-slider"></span>
               <span className="toggle-label">
                 {settings.isActive ? '게임 활성화' : '게임 비활성화'}
               </span>
             </label>
           </div>
         </div>
 
         {/* 기본 설정 */}
         <div className="setting-group">
           <h3>기본 설정</h3>
           <div className="setting-grid">
             <div className="setting-item">
               <label>경주 시간 (초)</label>
               <input
                 type="number"
                 min="5"
                 max="60"
                 value={settings.raceDuration / 1000}
                 onChange={(e) => setSettings({...settings, raceDuration: Number(e.target.value) * 1000})}
               />
             </div>
             <div className="setting-item">
               <label>카운트다운 시간 (초)</label>
               <input
                 type="number"
                 min="1"
                 max="10"
                 value={settings.countdownTime}
                 onChange={(e) => setSettings({...settings, countdownTime: Number(e.target.value)})}
               />
             </div>
             <div className="setting-item">
               <label>승리 시 점수</label>
               <input
                 type="number"
                 min="0"
                 max="1000"
                 value={settings.winScore}
                 onChange={(e) => setSettings({...settings, winScore: Number(e.target.value)})}
               />
             </div>
             <div className="setting-item">
               <label>패배 시 점수</label>
               <input
                 type="number"
                 min="0"
                 max="100"
                 value={settings.loseScore}
                 onChange={(e) => setSettings({...settings, loseScore: Number(e.target.value)})}
               />
             </div>
           </div>
         </div>
 
         {/* 말 설정 */}
         <div className="setting-group">
           <h3>말 설정</h3>
           <div className="horses-grid">
             {settings.horses.map((horse, index) => (
               <div key={horse.id} className="horse-setting">
                 <h4>Lane {horse.lane}</h4>
                 <div className="horse-fields">
                   <div className="field-group">
                     <label>이름</label>
                     <input
                       type="text"
                       value={horse.name}
                       onChange={(e) => updateHorse(index, 'name', e.target.value)}
                       maxLength="10"
                     />
                   </div>
                   <div className="field-group">
                     <label>이모지</label>
                     <select
                       value={horse.emoji}
                       onChange={(e) => updateHorse(index, 'emoji', e.target.value)}
                     >
                       {EMOJI_OPTIONS.map(emoji => (
                         <option key={emoji} value={emoji}>{emoji}</option>
                       ))}
                     </select>
                   </div>
                   <div className="field-group">
                     <label>색상</label>
                     <input
                       type="color"
                       value={horse.color}
                       onChange={(e) => updateHorse(index, 'color', e.target.value)}
                     />
                   </div>
                   <div className="field-group">
                     <label>기본 속도 (0.1-1.0)</label>
                     <input
                       type="number"
                       min="0.1"
                       max="1.0"
                       step="0.1"
                       value={horse.baseSpeed}
                       onChange={(e) => updateHorse(index, 'baseSpeed', Number(e.target.value))}
                     />
                     <small className="speed-hint">
                       낮을수록 느림, 역설적 규칙으로 느린 말이 우승
                     </small>
                   </div>
                 </div>
                 <div className="horse-preview">
                   <span className="preview-emoji" style={{color: horse.color}}>
                     {horse.emoji}
                   </span>
                   <span className="preview-name">{horse.name}</span>
                 </div>
               </div>
             ))}
           </div>
         </div>
 
         {/* 액션 버튼 */}
         <div className="admin-actions">
           <button 
             className="btn-reset"
             onClick={resetToDefault}
             disabled={isSaving}
           >
             기본 설정으로 리셋
           </button>
           <button 
             className="btn-save"
             onClick={saveSettings}
             disabled={isSaving}
           >
             {isSaving ? '저장 중...' : '설정 저장'}
           </button>
         </div>
 
         {/* 미리보기 */}
         <div className="setting-group">
           <h3>미리보기</h3>
           <div className="game-preview">
             <div className="preview-track">
               {settings.horses.map(horse => (
                 <div key={horse.id} className="preview-lane">
                   <span className="lane-number">{horse.lane}</span>
                   <span className="horse-emoji" style={{color: horse.color}}>
                     {horse.emoji}
                   </span>
                   <span className="horse-name">{horse.name}</span>
                   <span className="horse-speed-display">
                     Speed: {horse.baseSpeed}
                   </span>
                 </div>
               ))}
             </div>
             <div className="preview-info">
               <p>경주 시간: {settings.raceDuration/1000}초</p>
               <p>카운트다운: {settings.countdownTime}초</p>
               <p>점수: 승리 {settings.winScore}점, 패배 {settings.loseScore}점</p>
               <p>상태: {settings.isActive ? '활성화' : '비활성화'}</p>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }
