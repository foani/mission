 /**
  * CreataChain Mission Game - 보상 설정 관리 컴포넌트
  * 관리자가 보상 방식을 실시간으로 조정할 수 있는 UI
  */
 
 import React, { useState, useEffect } from 'react';
 import './RewardSettings.css';
 
 interface RewardSetting {
   id: number;
   rewardType: 'immediate' | 'ranking' | 'daily' | 'weekly' | 'monthly';
   rankingTier?: 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze';
   rankStart?: number;
   rankEnd?: number;
   ctaAmount: number;
   bonusPercentage?: number;
   requirementScore?: number;
   requirementGames?: number;
   gameType?: 'binary' | 'derby' | 'darts' | 'all';
   description?: string;
   validUntil?: string;
   maxRecipients?: number;
   isActive: boolean;
   createdAt: string;
   updatedAt: string;
 }
 
 interface RewardSettingsInput {
   rewardType: 'immediate' | 'ranking' | 'daily' | 'weekly' | 'monthly';
   rankingTier?: 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze';
   rankStart?: number;
   rankEnd?: number;
   ctaAmount: number;
   bonusPercentage?: number;
   requirementScore?: number;
   requirementGames?: number;
   gameType?: 'binary' | 'derby' | 'darts' | 'all';
   description?: string;
   validUntil?: string;
   maxRecipients?: number;
 }
 
 export default function RewardSettings() {
   const [settings, setSettings] = useState<RewardSetting[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [showForm, setShowForm] = useState(false);
   const [editingId, setEditingId] = useState<number | null>(null);
   const [formData, setFormData] = useState<RewardSettingsInput>({
     rewardType: 'immediate',
     ctaAmount: 5,
     gameType: 'all'
   });
 
   // 보상 설정 로드
   const loadSettings = async () => {
     try {
       setIsLoading(true);
       const response = await fetch('/api/rewards/settings');
       if (response.ok) {
         const data = await response.json();
         setSettings(data.data || []);
       } else {
         console.error('보상 설정 로드 실패');
       }
     } catch (error) {
       console.error('보상 설정 로드 오류:', error);
     } finally {
       setIsLoading(false);
     }
   };
 
   // 보상 설정 저장
   const saveSettings = async () => {
     try {
       setIsSubmitting(true);
       
       const url = editingId 
         ? `/api/rewards/settings/${editingId}`
         : '/api/rewards/settings';
       
       const method = editingId ? 'PUT' : 'POST';
       
       const response = await fetch(url, {
         method,
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify(formData)
       });
 
       if (response.ok) {
         const data = await response.json();
         console.log('보상 설정 저장 성공:', data.message);
         await loadSettings();
         resetForm();
       } else {
         const error = await response.json();
         console.error('보상 설정 저장 실패:', error.message);
       }
     } catch (error) {
       console.error('보상 설정 저장 오류:', error);
     } finally {
       setIsSubmitting(false);
     }
   };
 
   // 기본 설정 초기화
   const initializeSettings = async () => {
     try {
       setIsSubmitting(true);
       const response = await fetch('/api/rewards/settings/init', {
         method: 'POST'
       });
 
       if (response.ok) {
         const data = await response.json();
         console.log('기본 설정 초기화 성공:', data.message);
         await loadSettings();
       } else {
         console.error('기본 설정 초기화 실패');
       }
     } catch (error) {
       console.error('기본 설정 초기화 오류:', error);
     } finally {
       setIsSubmitting(false);
     }
   };
 
   // 폼 리셋
   const resetForm = () => {
     setFormData({
       rewardType: 'immediate',
       ctaAmount: 5,
       gameType: 'all'
     });
     setEditingId(null);
     setShowForm(false);
   };
 
   // 수정 모드
   const startEdit = (setting: RewardSetting) => {
     setFormData({
       rewardType: setting.rewardType,
       rankingTier: setting.rankingTier,
       rankStart: setting.rankStart,
       rankEnd: setting.rankEnd,
       ctaAmount: setting.ctaAmount,
       bonusPercentage: setting.bonusPercentage,
       requirementScore: setting.requirementScore,
       requirementGames: setting.requirementGames,
       gameType: setting.gameType,
       description: setting.description,
       validUntil: setting.validUntil,
       maxRecipients: setting.maxRecipients
     });
     setEditingId(setting.id);
     setShowForm(true);
   };
 
   // 컴포넌트 마운트 시 설정 로드
   useEffect(() => {
     loadSettings();
   }, []);
 
   // 보상 타입별 아이콘
   const getRewardTypeIcon = (type: string) => {
     switch (type) {
       case 'immediate': return '⚡';
       case 'ranking': return '🏆';
       case 'daily': return '📅';
       case 'weekly': return '📈';
       case 'monthly': return '🗓️';
       default: return '🎁';
     }
   };
 
   // 랭킹 티어별 색상
   const getTierColor = (tier?: string) => {
     switch (tier) {
       case 'diamond': return '#b9f2ff';
       case 'platinum': return '#e5e4e2';
       case 'gold': return '#ffd700';
       case 'silver': return '#c0c0c0';
       case 'bronze': return '#cd7f32';
       default: return '#ffffff';
     }
   };
 
   if (isLoading) {
     return (
       <div className="reward-settings loading">
         <div className="loading-spinner">⚙️</div>
         <p>보상 설정을 불러오는 중...</p>
       </div>
     );
   
     return (
       <div className="reward-settings">
         <div className="settings-header">
           <h1>🎁 보상 설정 관리</h1>
           <p>게임 보상 방식을 실시간으로 조정할 수 있습니다.</p>
           
           <div className="header-actions">
             <button 
               className="btn-primary"
               onClick={() => setShowForm(true)}
               disabled={isSubmitting}
             >
               ➕ 새 보상 설정
             </button>
             <button 
               className="btn-secondary"
               onClick={initializeSettings}
               disabled={isSubmitting}
             >
               🔄 기본 설정 초기화
             </button>
           </div>
         </div>
   
         {/* 보상 설정 목록 */}
         <div className="settings-grid">
           {settings.map((setting) => (
             <div key={setting.id} className="setting-card">
               <div className="card-header">
                 <span className="reward-icon">
                   {getRewardTypeIcon(setting.rewardType)}
                 </span>
                 <div className="reward-info">
                   <h3>{setting.rewardType.toUpperCase()}</h3>
                   {setting.rankingTier && (
                     <span 
                       className="tier-badge"
                       style={{ backgroundColor: getTierColor(setting.rankingTier) }}
                     >
                       {setting.rankingTier}
                     </span>
                   )}
                 </div>
                 <button 
                   className="edit-btn"
                   onClick={() => startEdit(setting)}
                   disabled={isSubmitting}
                 >
                   ✏️
                 </button>
               </div>
   
               <div className="card-content">
                 <div className="reward-details">
                   <div className="detail-item">
                     <span className="label">💰 CTA 보상:</span>
                     <span className="value">{setting.ctaAmount} CTA</span>
                   </div>
                   
                   {setting.rankStart && setting.rankEnd && (
                     <div className="detail-item">
                       <span className="label">🏅 순위 범위:</span>
                       <span className="value">{setting.rankStart}-{setting.rankEnd}위</span>
                     </div>
                   )}
                   
                   {setting.requirementGames && (
                     <div className="detail-item">
                       <span className="label">🎮 필요 게임:</span>
                       <span className="value">{setting.requirementGames}게임</span>
                     </div>
                   )}
                   
                   {setting.description && (
                     <div className="description">
                       {setting.description}
                     </div>
                   )}
                 </div>
               </div>
             </div>
           ))}
         </div>
   
         {/* 보상 설정 폼 */}
         {showForm && (
           <div className="form-overlay">
             <div className="form-modal">
               <div className="form-header">
                 <h2>
                   {editingId ? '✏️ 보상 설정 수정' : '➕ 새 보상 설정'}
                 </h2>
                 <button 
                   className="close-btn"
                   onClick={resetForm}
                 >
                   ❌
                 </button>
               </div>
   
               <form onSubmit={(e) => { e.preventDefault(); saveSettings(); }}>
                 <div className="form-grid">
                   {/* 보상 타입 */}
                   <div className="form-group">
                     <label>보상 타입</label>
                     <select
                       value={formData.rewardType}
                       onChange={(e) => setFormData({
                         ...formData,
                         rewardType: e.target.value as any
                       })}
                       required
                     >
                       <option value="immediate">즉시 보상</option>
                       <option value="ranking">랭킹 보상</option>
                       <option value="daily">일일 미션</option>
                       <option value="weekly">주간 미션</option>
                       <option value="monthly">월간 미션</option>
                     </select>
                   </div>
   
                   {/* CTA 보상량 */}
                   <div className="form-group">
                     <label>CTA 보상량</label>
                     <input
                       type="number"
                       min="0"
                       step="0.1"
                       value={formData.ctaAmount}
                       onChange={(e) => setFormData({
                         ...formData,
                         ctaAmount: parseFloat(e.target.value)
                       })}
                       required
                     />
                   </div>
   
                   {/* 랭킹 보상인 경우 */}
                   {formData.rewardType === 'ranking' && (
                     <>
                       <div className="form-group">
                         <label>시작 순위</label>
                         <input
                           type="number"
                           min="1"
                           value={formData.rankStart || ''}
                           onChange={(e) => setFormData({
                             ...formData,
                             rankStart: parseInt(e.target.value)
                           })}
                         />
                       </div>
                       
                       <div className="form-group">
                         <label>끝 순위</label>
                         <input
                           type="number"
                           min="1"
                           value={formData.rankEnd || ''}
                           onChange={(e) => setFormData({
                             ...formData,
                             rankEnd: parseInt(e.target.value)
                           })}
                         />
                       </div>
                     </>
                   )}
   
                   <div className="form-group full-width">
                     <label>설명</label>
                     <textarea
                       value={formData.description || ''}
                       onChange={(e) => setFormData({
                         ...formData,
                         description: e.target.value
                       })}
                       placeholder="보상에 대한 설명을 입력하세요..."
                       rows={3}
                     />
                   </div>
                 </div>
   
                 <div className="form-actions">
                   <button 
                     type="button"
                     className="btn-secondary"
                     onClick={resetForm}
                     disabled={isSubmitting}
                   >
                     취소
                   </button>
                   <button 
                     type="submit"
                     className="btn-primary"
                     disabled={isSubmitting}
                   >
                     {isSubmitting ? '저장 중...' : '저장'}
                   </button>
                 </div>
               </form>
             </div>
           </div>
         )}
       </div>
     );
   }
