 /**
  * CreataChain Mission Game - Lazy Derby 게임
  * 느린 말 1등 맞추기 게임 - 애니메이션 포함 완전한 경주 게임
  * 5마리 말이 경주하며, 가장 느린 말이 1등을 하는 역설적인 게임
  * 관리자 대시보드에서 설정 조정 가능
  */
 
 import React, { useState, useEffect, useRef, useCallback } from 'react';
 import { useTranslation } from 'react-i18next';
 import './DerbyGame.css';
 
 interface DerbyGameProps {
   walletAddress: string;
   onComplete: (score: number) => void;
 }
 
 interface Horse {
   id: number;
   name: string;
   color: string;
   emoji: string;
   position: number; // 0-100 (경주 진행률)
   baseSpeed: number; // 기본 속도 (낮을수록 느림)
   currentSpeed: number; // 현재 속도 (변동)
   lane: number; // 레인 번호 (1-5)
   isFinished: boolean;
   finishTime?: number;
   rank?: number;
 }
 
 interface GameState {
   phase: 'betting' | 'countdown' | 'racing' | 'finished';
   countdown: number;
   selectedHorse: number | null;
   horses: Horse[];
   winner: Horse | null;
   raceStartTime: number;
   currentTime: number;
   gameScore: number;
 }
 
 // 관리자 설정 인터페이스
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
 
 // 하드코딩된 기본 말 데이터 (백업용)
 const DEFAULT_HORSES = [
   { id: 1, name: 'Thunder', color: '#FF6B6B', emoji: '🐎', baseSpeed: 0.8, lane: 1 },
   { id: 2, name: 'Lightning', color: '#4ECDC4', emoji: '🦄', baseSpeed: 0.6, lane: 2 },
   { id: 3, name: 'Storm', color: '#45B7D1', emoji: '🐴', baseSpeed: 0.4, lane: 3 },
   { id: 4, name: 'Blaze', color: '#96CEB4', emoji: '🎠', baseSpeed: 0.7, lane: 4 },
   { id: 5, name: 'Flash', color: '#FECA57', emoji: '🦓', baseSpeed: 0.5, lane: 5 }
 ];
 
 // 하드코딩된 기본 설정
 const DEFAULT_SETTINGS: DerbyGameSettings = {
   id: 'derby_default',
   raceDuration: 15000, // 15초
   countdownTime: 3, // 3초
   winScore: 100,
   loseScore: 0,
   horses: DEFAULT_HORSES,
   isActive: true
 };
 
 export default function DerbyGame({ walletAddress, onComplete }: DerbyGameProps) {
   const { t } = useTranslation();
   const animationFrameRef = useRef<number>();
   const raceIntervalRef = useRef<NodeJS.Timeout>();
   
   // 게임 설정 상태
   const [gameSettings, setGameSettings] = useState<DerbyGameSettings>(DEFAULT_SETTINGS);
   const [isLoadingSettings, setIsLoadingSettings] = useState(true);
   
   const [gameState, setGameState] = useState<GameState>({
     phase: 'betting',
     countdown: DEFAULT_SETTINGS.countdownTime,
     selectedHorse: null,
     horses: DEFAULT_SETTINGS.horses.map(horse => ({
       ...horse,
       position: 0,
       currentSpeed: horse.baseSpeed,
       isFinished: false
     })),
     winner: null,
     raceStartTime: 0,
     currentTime: 0,
     gameScore: 0
   });
 
   // 게임 설정 로드
   const loadGameSettings = useCallback(async () => {
     try {
       setIsLoadingSettings(true);
       const response = await fetch('/api/game/settings/derby');
       if (response.ok) {
         const settings: DerbyGameSettings = await response.json();
         setGameSettings(settings);
         
         // 설정에 따라 게임 상태 초기화
         setGameState(prev => ({
           ...prev,
           countdown: settings.countdownTime,
           horses: settings.horses.map(horse => ({
             ...horse,
             position: 0,
             currentSpeed: horse.baseSpeed,
             isFinished: false
           }))
         }));
       } else {
         console.warn('게임 설정 로드 실패, 기본 설정 사용');
       }
     } catch (error) {
       console.error('게임 설정 로드 오류:', error);
     } finally {
       setIsLoadingSettings(false);
     }
   }, []);
 
   // 컴포넌트 마운트 시 설정 로드
   useEffect(() => {
     loadGameSettings();
   }, [loadGameSettings]);
 
   // 말 선택 핸들러
   const selectHorse = useCallback((horseId: number) => {
     if (gameState.phase === 'betting') {
       setGameState(prev => ({
         ...prev,
         selectedHorse: horseId
       }));
     }
   }, [gameState.phase]);
 
   // 게임 시작 핸들러
   const startGame = useCallback(() => {
     if (!gameState.selectedHorse) {
       alert(t('selectHorseFirst', '먼저 말을 선택해주세요!'));
       return;
     }
 
     setGameState(prev => ({
       ...prev,
       phase: 'countdown'
     }));
 
     // 관리자 설정에 따른 카운트다운 시작
     let countdown = gameSettings.countdownTime;
     const countdownInterval = setInterval(() => {
       countdown--;
       setGameState(prev => ({ ...prev, countdown }));
       
       if (countdown <= 0) {
         clearInterval(countdownInterval);
         startRace();
       }
     }, 1000);
   }, [gameState.selectedHorse, gameSettings.countdownTime, t]);
 
   // 경주 시작
   const startRace = useCallback(() => {
     const startTime = Date.now();
     
     setGameState(prev => ({
       ...prev,
       phase: 'racing',
       raceStartTime: startTime,
       currentTime: startTime
     }));
 
     // 경주 애니메이션 루프 (관리자 설정 시간 사용)
     const updateRace = () => {
       const currentTime = Date.now();
       const elapsed = currentTime - startTime;
       const progress = Math.min(elapsed / gameSettings.raceDuration, 1);
 
       setGameState(prev => {
         const updatedHorses = prev.horses.map(horse => {
           if (horse.isFinished) return horse;
 
           // 랜덤 속도 변동 (±20%)
           const speedVariation = 0.8 + Math.random() * 0.4;
           const newSpeed = horse.baseSpeed * speedVariation;
           
           // 위치 업데이트 (역설적으로 느린 말이 더 앞서감)
           const speedMultiplier = 2 - horse.baseSpeed; // 느린 말일수록 높은 배수
           const newPosition = Math.min(
             horse.position + (newSpeed * speedMultiplier * 0.8),
             100
           );
 
           const isFinished = newPosition >= 100;
           
           return {
             ...horse,
             position: newPosition,
             currentSpeed: newSpeed,
             isFinished,
             finishTime: isFinished && !horse.finishTime ? currentTime : horse.finishTime
           };
         });
 
         // 완주한 말들의 순위 계산
         const finishedHorses = updatedHorses
           .filter(horse => horse.isFinished && horse.finishTime)
           .sort((a, b) => (a.finishTime! - b.finishTime!));
 
         const horsesWithRank = updatedHorses.map(horse => {
           if (horse.isFinished && horse.finishTime) {
             const rank = finishedHorses.findIndex(h => h.id === horse.id) + 1;
             return { ...horse, rank };
           }
           return horse;
         });
 
         return {
           ...prev,
           horses: horsesWithRank,
           currentTime
         };
       });
 
       if (progress < 1) {
         animationFrameRef.current = requestAnimationFrame(updateRace);
       } else {
         finishRace();
       }
     };
 
     animationFrameRef.current = requestAnimationFrame(updateRace);
   }, [gameSettings.raceDuration]);
 
   // 경주 종료
   const finishRace = useCallback(() => {
     if (animationFrameRef.current) {
       cancelAnimationFrame(animationFrameRef.current);
     }
 
     setGameState(prev => {
       const finishedHorses = prev.horses
         .filter(horse => horse.isFinished)
         .sort((a, b) => (a.finishTime! - b.finishTime!));
 
       const winner = finishedHorses[0];
       const isWin = winner && winner.id === prev.selectedHorse;
       // 관리자 설정에 따른 점수 계산
       const score = isWin ? gameSettings.winScore : gameSettings.loseScore;
 
       // 게임 완료 콜백 호출
       setTimeout(() => {
         onComplete(score);
       }, 2000);
 
       return {
         ...prev,
         phase: 'finished',
         winner,
         gameScore: score
       };
     });
   }, [onComplete, gameSettings.winScore, gameSettings.loseScore]);
 
   // 게임 재시작
   const resetGame = useCallback(() => {
     if (animationFrameRef.current) {
       cancelAnimationFrame(animationFrameRef.current);
     }
     if (raceIntervalRef.current) {
       clearInterval(raceIntervalRef.current);
     }
 
     setGameState({
       phase: 'betting',
       countdown: gameSettings.countdownTime,
       selectedHorse: null,
       horses: gameSettings.horses.map(horse => ({
         ...horse,
         position: 0,
         currentSpeed: horse.baseSpeed,
         isFinished: false
       })),
       winner: null,
       raceStartTime: 0,
       currentTime: 0,
       gameScore: 0
     });
   }, [gameSettings]);
 
   // 컴포넌트 언마운트 시 정리
   useEffect(() => {
     return () => {
       if (animationFrameRef.current) {
         cancelAnimationFrame(animationFrameRef.current);
       }
       if (raceIntervalRef.current) {
         clearInterval(raceIntervalRef.current);
       }
     };
   }, []);
 
   // 게임이 비활성화된 경우
   if (!gameSettings.isActive) {
     return (
       <div className="derby-game">
         <div className="derby-header">
           <h2 className="derby-title">
             {t('gameTemporarilyDisabled', '게임이 일시적으로 비활성화되었습니다')}
           </h2>
           <p className="derby-subtitle">
             {t('checkBackLater', '나중에 다시 확인해주세요')}
           </p>
         </div>
       </div>
     );
   }
 
   // 로딩 중
   if (isLoadingSettings) {
     return (
       <div className="derby-game">
         <div className="derby-header">
           <h2 className="derby-title">
             {t('loadingGame', '게임 로딩 중...')}
           </h2>
         </div>
       </div>
     );
   }
 const COUNTDOWN_TIME = 3; // 3초 카운트다운
 
 export default function DerbyGame({ walletAddress, onComplete }: DerbyGameProps) {
   const { t } = useTranslation();
   const animationFrameRef = useRef<number>();
   const raceIntervalRef = useRef<NodeJS.Timeout>();
   
   const [gameState, setGameState] = useState<GameState>({
     phase: 'betting',
     countdown: COUNTDOWN_TIME,
     selectedHorse: null,
     horses: INITIAL_HORSES.map(horse => ({
       ...horse,
       position: 0,
       currentSpeed: horse.baseSpeed,
       isFinished: false
     })),
     winner: null,
     raceStartTime: 0,
     currentTime: 0,
     gameScore: 0
   });
 
   // 말 선택 핸들러
   const selectHorse = useCallback((horseId: number) => {
     if (gameState.phase === 'betting') {
       setGameState(prev => ({
         ...prev,
         selectedHorse: horseId
       }));
     }
   }, [gameState.phase]);
 
   // 게임 시작 핸들러
   const startGame = useCallback(() => {
     if (!gameState.selectedHorse) {
       alert(t('selectHorseFirst', '먼저 말을 선택해주세요!'));
       return;
     }
 
     setGameState(prev => ({
       ...prev,
       phase: 'countdown'
     }));
 
     // 카운트다운 시작
     let countdown = COUNTDOWN_TIME;
     const countdownInterval = setInterval(() => {
       countdown--;
       setGameState(prev => ({ ...prev, countdown }));
       
       if (countdown <= 0) {
         clearInterval(countdownInterval);
         startRace();
       }
     }, 1000);
   }, [gameState.selectedHorse, t]);
 
   // 경주 시작
   const startRace = useCallback(() => {
     const startTime = Date.now();
     
     setGameState(prev => ({
       ...prev,
       phase: 'racing',
       raceStartTime: startTime,
       currentTime: startTime
     }));
 
     // 경주 애니메이션 루프
     const updateRace = () => {
       const currentTime = Date.now();
       const elapsed = currentTime - startTime;
       const progress = Math.min(elapsed / RACE_DURATION, 1);
 
       setGameState(prev => {
         const updatedHorses = prev.horses.map(horse => {
           if (horse.isFinished) return horse;
 
           // 랜덤 속도 변동 (±20%)
           const speedVariation = 0.8 + Math.random() * 0.4;
           const newSpeed = horse.baseSpeed * speedVariation;
           
           // 위치 업데이트 (역설적으로 느린 말이 더 앞서감)
           const speedMultiplier = 2 - horse.baseSpeed; // 느린 말일수록 높은 배수
           const newPosition = Math.min(
             horse.position + (newSpeed * speedMultiplier * 0.8),
             100
           );
 
           const isFinished = newPosition >= 100;
           
           return {
             ...horse,
             position: newPosition,
             currentSpeed: newSpeed,
             isFinished,
             finishTime: isFinished && !horse.finishTime ? currentTime : horse.finishTime
           };
         });
 
         // 완주한 말들의 순위 계산
         const finishedHorses = updatedHorses
           .filter(horse => horse.isFinished && horse.finishTime)
           .sort((a, b) => (a.finishTime! - b.finishTime!));
 
         const horsesWithRank = updatedHorses.map(horse => {
           if (horse.isFinished && horse.finishTime) {
             const rank = finishedHorses.findIndex(h => h.id === horse.id) + 1;
             return { ...horse, rank };
           }
           return horse;
         });
 
         return {
           ...prev,
           horses: horsesWithRank,
           currentTime
         };
       });
 
       if (progress < 1) {
         animationFrameRef.current = requestAnimationFrame(updateRace);
       } else {
         finishRace();
       }
     };
 
     animationFrameRef.current = requestAnimationFrame(updateRace);
   }, []);
 
   // 경주 종료
   const finishRace = useCallback(() => {
     if (animationFrameRef.current) {
       cancelAnimationFrame(animationFrameRef.current);
     }
 
     setGameState(prev => {
       const finishedHorses = prev.horses
         .filter(horse => horse.isFinished)
         .sort((a, b) => (a.finishTime! - b.finishTime!));
 
       const winner = finishedHorses[0];
       const isWin = winner && winner.id === prev.selectedHorse;
       const score = isWin ? 100 : 0;
 
       // 게임 완료 콜백 호출
       setTimeout(() => {
         onComplete(score);
       }, 2000);
 
       return {
         ...prev,
         phase: 'finished',
         winner,
         gameScore: score
       };
     });
   }, [onComplete]);
 
   // 게임 재시작
   const resetGame = useCallback(() => {
     if (animationFrameRef.current) {
       cancelAnimationFrame(animationFrameRef.current);
     }
     if (raceIntervalRef.current) {
       clearInterval(raceIntervalRef.current);
     }
 
     setGameState({
       phase: 'betting',
       countdown: COUNTDOWN_TIME,
       selectedHorse: null,
       horses: INITIAL_HORSES.map(horse => ({
         ...horse,
         position: 0,
         currentSpeed: horse.baseSpeed,
         isFinished: false
       })),
       winner: null,
       raceStartTime: 0,
       currentTime: 0,
       gameScore: 0
     });
   }, []);
 
   // 컴포넌트 언마운트 시 정리
   useEffect(() => {
     return () => {
       if (animationFrameRef.current) {
         cancelAnimationFrame(animationFrameRef.current);
       }
       if (raceIntervalRef.current) {
         clearInterval(raceIntervalRef.current);
       }
     };
   }, []);
 
   return (
     <div className="derby-game">
       <div className="derby-header">
         <h2 className="derby-title">
           {t('lazyDerbyTitle', '🐎 Lazy Derby Race')}
         </h2>
         <p className="derby-subtitle">
           {t('lazyDerbyDesc', '가장 느린 말이 1등을 하는 역설의 경주!')}
         </p>
       </div>
 
       {/* 베팅 단계 */}
       {gameState.phase === 'betting' && (
         <div className="betting-phase">
           <h3 className="phase-title">
             {t('selectWinnerHorse', '우승할 말을 선택하세요')}
           </h3>
           <div className="horse-selection">
             {gameState.horses.map(horse => (
               <button
                 key={horse.id}
                 className={`horse-button ${
                   gameState.selectedHorse === horse.id ? 'selected' : ''
                 }`}
                 onClick={() => selectHorse(horse.id)}
               >
                 <div className="horse-info">
                   <span className="horse-emoji">{horse.emoji}</span>
                   <span className="horse-name">{horse.name}</span>
                   <span className="horse-lane">Lane {horse.lane}</span>
                 </div>
               </button>
             ))}
           </div>
           <button 
             className="start-button"
             onClick={startGame}
             disabled={!gameState.selectedHorse}
           >
             {t('startRace', '경주 시작!')}
           </button>
         </div>
       )}
 
       {/* 카운트다운 단계 */}
       {gameState.phase === 'countdown' && (
         <div className="countdown-phase">
           <div className="countdown-display">
             <h2 className="countdown-number">{gameState.countdown}</h2>
             <p className="countdown-text">
               {t('raceStartingSoon', '경주가 곧 시작됩니다!')}
             </p>
           </div>
         </div>
       )}
 
       {/* 경주 트랙 */}
       {(gameState.phase === 'racing' || gameState.phase === 'finished') && (
         <div className="race-track">
           <div className="track-header">
             <h3 className="track-title">
               {gameState.phase === 'racing' ? 
                 t('raceInProgress', '경주 진행 중...') : 
                 t('raceFinished', '경주 완료!')}
             </h3>
             {gameState.selectedHorse && (
               <p className="selected-horse-info">
                 {t('yourChoice', '선택한 말')}: {' '}
                 <span className="selected-horse">
                   {gameState.horses.find(h => h.id === gameState.selectedHorse)?.emoji} {' '}
                   {gameState.horses.find(h => h.id === gameState.selectedHorse)?.name}
                 </span>
               </p>
             )}
           </div>
 
           <div className="racing-lanes">
             {gameState.horses.map(horse => (
               <div key={horse.id} className="race-lane">
                 <div className="lane-info">
                   <span className="lane-number">{horse.lane}</span>
                   <span className="horse-name">{horse.name}</span>
                   {horse.rank && (
                     <span className="horse-rank">#{horse.rank}</span>
                   )}
                 </div>
                 <div className="track">
                   <div className="track-line"></div>
                   <div 
                     className={`horse-runner ${
                       horse.id === gameState.selectedHorse ? 'selected' : ''
                     } ${
                       horse.isFinished ? 'finished' : ''
                     }`}
                     style={{
                       left: `${horse.position}%`,
                       color: horse.color
                     }}
                   >
                     {horse.emoji}
                   </div>
                   <div className="finish-line"></div>
                 </div>
                 <div className="progress-bar">
                   <div 
                     className="progress-fill"
                     style={{ 
                       width: `${horse.position}%`,
                       backgroundColor: horse.color
                     }}
                   ></div>
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}
 
       {/* 결과 단계 */}
       {gameState.phase === 'finished' && (
         <div className="result-phase">
           <div className="result-content">
             <h3 className="result-title">
               {gameState.gameScore > 0 ? 
                 t('congratulations', '🎉 축하합니다!') : 
                 t('betterLuckNext', '😅 다음 기회에!')}
             </h3>
             
             {gameState.winner && (
               <div className="winner-info">
                 <p className="winner-announcement">
                   {t('winnerIs', '우승자는')}: {' '}
                   <span className="winner-name">
                     {gameState.winner.emoji} {gameState.winner.name}
                   </span>
                 </p>
                 <p className="score-info">
                   {t('yourScore', '획득 점수')}: <span className="score">{gameState.gameScore}</span>
                 </p>
               </div>
             )}
 
             <div className="final-rankings">
               <h4>{t('finalRankings', '최종 순위')}</h4>
               <ol className="ranking-list">
                 {gameState.horses
                   .filter(horse => horse.rank)
                   .sort((a, b) => a.rank! - b.rank!)
                   .map(horse => (
                     <li key={horse.id} className="ranking-item">
                       <span className="rank-number">#{horse.rank}</span>
                       <span className="rank-horse">
                         {horse.emoji} {horse.name}
                       </span>
                       {horse.id === gameState.selectedHorse && (
                         <span className="your-choice-badge">
                           {t('yourChoice', '선택')}
                         </span>
                       )}
                     </li>
                   ))
                 }
               </ol>
             </div>
 
             <button 
               className="play-again-button"
               onClick={resetGame}
             >
               {t('playAgain', '다시 플레이')}
             </button>
           </div>
         </div>
       )}
     </div>
   );
 }