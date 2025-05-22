 /**
  * CreataChain Mission Game - 게임 허브 컴포넌트
  * 전체 게임 메뉴와 네비게이션
  */
 
 import React, { useState, useEffect } from 'react';
 import { useTranslation } from 'react-i18next';
 import { GameType } from '../types';
 import BinaryGame from './games/BinaryGame';
 import DerbyGame from './games/DerbyGame';
 import DartsGame from './games/DartsGame';
 import UserProfile from './UserProfile';
 import Ranking from './Ranking';
 import './GameHub.css';
 
 interface GameHubProps {
   walletAddress: string;
   isVerified: boolean;
 }
 
 export default function GameHub({ walletAddress, isVerified }: GameHubProps) {
   const { t } = useTranslation();
   const [currentView, setCurrentView] = useState<'games' | 'profile' | 'ranking'>('games');
   const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
   const [userScore, setUserScore] = useState(0);
   const [userRank, setUserRank] = useState<number | null>(null);
 
   // 사용자 정보 로드
   useEffect(() => {
     if (walletAddress && isVerified) {
       loadUserData();
     }
   }, [walletAddress, isVerified]);
 
   const loadUserData = async () => {
     try {
       // 사용자 점수 조회
       const response = await fetch(`/api/auth/status/${walletAddress}`);
       if (response.ok) {
         const data = await response.json();
         setUserScore(data.data.score);
       }
 
       // 사용자 랭킹 조회
       const rankResponse = await fetch(`/api/ranking/position/${walletAddress}`);
       if (rankResponse.ok) {
         const rankData = await rankResponse.json();
         setUserRank(rankData.data.globalRank);
       }
     } catch (error) {
       console.error('사용자 데이터 로드 실패:', error);
     }
   };
 
   const handleGameComplete = async (score: number) => {
     // 게임 완료 후 사용자 데이터 업데이트
     await loadUserData();
     setSelectedGame(null); // 게임 종료 후 메인 화면으로 복귀
   };
 
   const handleBackToMenu = () => {
     setSelectedGame(null);
     setCurrentView('games');
   };
 
   // 인증되지 않은 사용자
   if (!isVerified) {
     return (
       <div className="game-hub">
         <div className="verification-required">
           <div className="verification-icon">🔒</div>
           <h2>{t('gameHub.verificationRequired')}</h2>
           <p>{t('gameHub.pleaseVerifyWallet')}</p>
           <div className="verification-steps">
             <div className="step">
               <span className="step-number">1</span>
               <span>{t('gameHub.step1')}</span>
             </div>
             <div className="step">
               <span className="step-number">2</span>
               <span>{t('gameHub.step2')}</span>
             </div>
             <div className="step">
               <span className="step-number">3</span>
               <span>{t('gameHub.step3')}</span>
             </div>
           </div>
         </div>
       </div>
     );
   }
 
   // 특정 게임이 선택된 경우
   if (selectedGame) {
     return (
       <div className="game-hub">
         <div className="game-header">
           <button 
             className="back-button"
             onClick={handleBackToMenu}
           >
             ← {t('common.back')}
           </button>
           <h2>{t(`games.${selectedGame}.title`)}</h2>
           <div className="user-info">
             <span className="score">{t('common.score')}: {userScore}</span>
             {userRank && <span className="rank">{t('common.rank')}: #{userRank}</span>}
           </div>
         </div>
         
         <div className="game-container">
           {selectedGame === 'binary' && (
             <BinaryGame 
               walletAddress={walletAddress}
               onComplete={handleGameComplete}
             />
           )}
           {selectedGame === 'derby' && (
             <DerbyGame 
               walletAddress={walletAddress}
               onComplete={handleGameComplete}
             />
           )}
           {selectedGame === 'darts' && (
             <DartsGame 
               walletAddress={walletAddress}
               onComplete={handleGameComplete}
             />
           )}
         </div>
       </div>
     );
   }
 
   // 메인 화면
   return (
     <div className="game-hub">
       {/* 헤더 */}
       <header className="hub-header">
         <div className="user-summary">
           <div className="wallet-info">
             <span className="wallet-address">
               {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
             </span>
             <span className="verified-badge">✓ {t('common.verified')}</span>
           </div>
           <div className="user-stats">
             <div className="stat">
               <span className="value">{userScore}</span>
               <span className="label">{t('common.totalScore')}</span>
             </div>
             {userRank && (
               <div className="stat">
                 <span className="value">#{userRank}</span>
                 <span className="label">{t('common.globalRank')}</span>
               </div>
             )}
           </div>
         </div>
         
         {/* 네비게이션 */}
         <nav className="hub-navigation">
           <button 
             className={`nav-button ${currentView === 'games' ? 'active' : ''}`}
             onClick={() => setCurrentView('games')}
           >
             🎮 {t('navigation.games')}
           </button>
           <button 
             className={`nav-button ${currentView === 'profile' ? 'active' : ''}`}
             onClick={() => setCurrentView('profile')}
           >
             📊 {t('navigation.profile')}
           </button>
           <button 
             className={`nav-button ${currentView === 'ranking' ? 'active' : ''}`}
             onClick={() => setCurrentView('ranking')}
           >
             🏆 {t('navigation.ranking')}
           </button>
         </nav>
       </header>
 
       {/* 콘텐츠 영역 */}
       <main className="hub-content">
         {currentView === 'games' && (
           <div className="games-grid">
             <div className="section-title">
               <h2>🎮 {t('gameHub.availableGames')}</h2>
               <p>{t('gameHub.selectGameToPlay')}</p>
             </div>
             
             <div className="game-cards">
               {/* Binary Options 게임 */}
               <div 
                 className="game-card binary-game"
                 onClick={() => setSelectedGame('binary')}
               >
                 <div className="game-icon">📈</div>
                 <h3>{t('games.binary.title')}</h3>
                 <p>{t('games.binary.description')}</p>
                 <div className="game-stats">
                   <span className="difficulty">{t('games.binary.difficulty')}</span>
                   <span className="reward">+50-100 {t('common.points')}</span>
                 </div>
                 <button className="play-button">
                   {t('common.playNow')}
                 </button>
               </div>
 
               {/* Lazy Derby 게임 */}
               <div 
                 className="game-card derby-game"
                 onClick={() => setSelectedGame('derby')}
               >
                 <div className="game-icon">🏇</div>
                 <h3>{t('games.derby.title')}</h3>
                 <p>{t('games.derby.description')}</p>
                 <div className="game-stats">
                   <span className="difficulty">{t('games.derby.difficulty')}</span>
                   <span className="reward">+30-150 {t('common.points')}</span>
                 </div>
                 <button className="play-button">
                   {t('common.playNow')}
                 </button>
               </div>
 
               {/* Reverse Darts 게임 */}
               <div 
                 className="game-card darts-game"
                 onClick={() => setSelectedGame('darts')}
               >
                 <div className="game-icon">🎯</div>
                 <h3>{t('games.darts.title')}</h3>
                 <p>{t('games.darts.description')}</p>
                 <div className="game-stats">
                   <span className="difficulty">{t('games.darts.difficulty')}</span>
                   <span className="reward">+20-200 {t('common.points')}</span>
                 </div>
                 <button className="play-button">
                   {t('common.playNow')}
                 </button>
               </div>
             </div>
 
             {/* 추가 정보 */}
             <div className="game-info">
               <div className="info-card">
                 <h4>🏆 {t('gameHub.rankingRewards')}</h4>
                 <ul>
                   <li>{t('gameHub.rank1Reward')}: 100 CTA</li>
                   <li>{t('gameHub.rank2Reward')}: 50 CTA</li>
                   <li>{t('gameHub.rank3Reward')}: 25 CTA</li>
                   <li>{t('gameHub.rank4Reward')}: 15 CTA</li>
                   <li>{t('gameHub.rank5Reward')}: 10 CTA</li>
                 </ul>
               </div>
               
               <div className="info-card">
                 <h4>📅 {t('gameHub.dailyMissions')}</h4>
                 <ul>
                   <li>{t('gameHub.mission1')}: +10 {t('common.points')}</li>
                   <li>{t('gameHub.mission2')}: +20 {t('common.points')}</li>
                   <li>{t('gameHub.mission3')}: +50 {t('common.points')}</li>
                 </ul>
               </div>
             </div>
           </div>
         )}
 
         {currentView === 'profile' && (
           <UserProfile 
             walletAddress={walletAddress}
             onScoreUpdate={setUserScore}
           />
         )}
 
         {currentView === 'ranking' && (
           <Ranking 
             currentUserAddress={walletAddress}
           />
         )}
       </main>
     </div>
   );
 }
