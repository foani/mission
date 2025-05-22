 /**
  * CreataChain Mission Game - Reverse Darts 게임
  * 화살 피해가기 게임
  */
 
 import React, { useState, useEffect, useRef } from 'react';
 import { useTranslation } from 'react-i18next';
 import './DartsGame.css';
 
 interface DartsGameProps {
   walletAddress: string;
   onComplete: (score: number) => void;
 }
 
 interface Position {
   x: number;
   y: number;
 }
 
 interface Dart {
   id: number;
   position: Position;
   speed: number;
   angle: number;
   active: boolean;
 }
 
 interface Target {
   position: Position;
   radius: number;
   points: number;
   color: string;
 }
 
 interface GameRound {
   id: number;
   level: number;
   targets: Target[];
   darts: Dart[];
   score: number;
   timeLeft: number;
   completed: boolean;
 }
 
 export default function DartsGame({ walletAddress, onComplete }: DartsGameProps) {
   const { t } = useTranslation();
   const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
   const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
   const [playerPosition, setPlayerPosition] = useState<Position>({ x: 300, y: 550 });
   const [totalScore, setTotalScore] = useState(0);
   const [roundNumber, setRoundNumber] = useState(1);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const gameAreaRef = useRef<HTMLDivElement>(null);
   const animationFrameRef = useRef<number>(null);
 
   // 게임 설정 상태
   const [gameSettings, setGameSettings] = useState(null);
   const [isLoadingSettings, setIsLoadingSettings] = useState(true);
   
   // 하드코딩된 게임 설정 (fallback)
   const FALLBACK_CONFIG = {
     GAME_WIDTH: 600,
     GAME_HEIGHT: 600,
     PLAYER_SIZE: 20,
     DART_SPEED: 3,
     ROUND_TIME: 30, // 30초
     ROUNDS_PER_GAME: 3
   };
   
   // 실제 사용할 게임 설정
   const GAME_CONFIG = gameSettings ? {
     GAME_WIDTH: 600,
     GAME_HEIGHT: 600,
     PLAYER_SIZE: 20,
     DART_SPEED: 3,
     ROUND_TIME: gameSettings.levelTime,
     ROUNDS_PER_GAME: gameSettings.totalRounds
   } : FALLBACK_CONFIG;
   
   // 게임 설정 로드
   useEffect(() => {
     const loadGameSettings = async () => {
       try {
         const response = await fetch('/api/game/settings/darts');
         if (response.ok) {
           const settings = await response.json();
           setGameSettings(settings);
         } else {
           console.warn('Failed to load game settings, using fallback');
         }
       } catch (error) {
         console.error('Error loading game settings:', error);
       } finally {
         setIsLoadingSettings(false);
       }
     };
   
     loadGameSettings();
   }, []);
 
   useEffect(() => {
     initializeRound();
     return () => {
       if (animationFrameRef.current) {
         cancelAnimationFrame(animationFrameRef.current);
       }
     };
   }, []);
 
   useEffect(() => {
     if (gameState === 'playing' && currentRound) {
       const gameLoop = () => {
         updateGame();
         animationFrameRef.current = requestAnimationFrame(gameLoop);
       };
       animationFrameRef.current = requestAnimationFrame(gameLoop);
       
       return () => {
         if (animationFrameRef.current) {
           cancelAnimationFrame(animationFrameRef.current);
         }
       };
     }
   }, [gameState, currentRound]);
 
   const initializeRound = () => {
     // 하드코딩된 타겟 생성
     const targets: Target[] = [];
     const numTargets = Math.min(3 + roundNumber, 7); // 라운드마다 타겟 수 증가
     
     for (let i = 0; i < numTargets; i++) {
       targets.push({
         position: {
           x: Math.random() * (GAME_CONFIG.GAME_WIDTH - 100) + 50,
           y: Math.random() * (GAME_CONFIG.GAME_HEIGHT - 200) + 50
         },
         radius: 15 + Math.random() * 10,
         points: Math.floor(Math.random() * 50) + 10,
         color: `hsl(${Math.random() * 360}, 70%, 60%)`
       });
     }
 
     // 하드코딩된 다트 생성 패턴
     const darts: Dart[] = [];
     const numDarts = Math.min(5 + Math.floor(roundNumber / 2), 12); // 라운드마다 다트 수 증가
     
     for (let i = 0; i < numDarts; i++) {
       const startSide = Math.floor(Math.random() * 4); // 0: 상, 1: 우, 2: 하, 3: 좌
       let startX, startY, angle;
       
       switch (startSide) {
         case 0: // 상단에서 시작
           startX = Math.random() * GAME_CONFIG.GAME_WIDTH;
           startY = -20;
           angle = Math.random() * Math.PI + Math.PI / 2; // 아래쪽 방향
           break;
         case 1: // 우측에서 시작
           startX = GAME_CONFIG.GAME_WIDTH + 20;
           startY = Math.random() * GAME_CONFIG.GAME_HEIGHT;
           angle = Math.random() * Math.PI + Math.PI; // 왼쪽 방향
           break;
         case 2: // 하단에서 시작
           startX = Math.random() * GAME_CONFIG.GAME_WIDTH;
           startY = GAME_CONFIG.GAME_HEIGHT + 20;
           angle = Math.random() * Math.PI - Math.PI / 2; // 위쪽 방향
           break;
         default: // 좌측에서 시작
           startX = -20;
           startY = Math.random() * GAME_CONFIG.GAME_HEIGHT;
           angle = Math.random() * Math.PI; // 오른쪽 방향
           break;
       }
       
       darts.push({
         id: i,
         position: { x: startX, y: startY },
         speed: 2 + Math.random() * 2, // 2-4 속도
         angle,
         active: true
       });
     }
 
     const newRound: GameRound = {
       id: Date.now(),
       level: roundNumber,
       targets,
       darts,
       score: 0,
       timeLeft: GAME_CONFIG.ROUND_TIME,
       completed: false
     };
 
     setCurrentRound(newRound);
     setPlayerPosition({ x: GAME_CONFIG.GAME_WIDTH / 2, y: GAME_CONFIG.GAME_HEIGHT - 50 });
     setGameState('ready');
   };
 
   const startRound = () => {
     setGameState('playing');
     
     // 타이머 시작
     const timer = setInterval(() => {
       setCurrentRound(prev => {
         if (!prev || prev.timeLeft <= 0) {
           clearInterval(timer);
           endRound();
           return prev;
         }
         return { ...prev, timeLeft: prev.timeLeft - 1 };
       });
     }, 1000);
   };
 
   const updateGame = () => {
     if (!currentRound || gameState !== 'playing') return;
 
     setCurrentRound(prev => {
       if (!prev) return null;
 
       // 다트 위치 업데이트
       const updatedDarts = prev.darts.map(dart => {
         if (!dart.active) return dart;
         
         const newX = dart.position.x + Math.cos(dart.angle) * dart.speed;
         const newY = dart.position.y + Math.sin(dart.angle) * dart.speed;
         
         // 화면 밖으로 나가면 비활성화
         if (newX < -50 || newX > GAME_CONFIG.GAME_WIDTH + 50 || 
             newY < -50 || newY > GAME_CONFIG.GAME_HEIGHT + 50) {
           return { ...dart, active: false };
         }
         
         return {
           ...dart,
           position: { x: newX, y: newY }
         };
       });
 
       // 충돌 검사 (플레이어와 다트)
       const playerHit = updatedDarts.some(dart => 
         dart.active && 
         Math.abs(dart.position.x - playerPosition.x) < GAME_CONFIG.PLAYER_SIZE &&
         Math.abs(dart.position.y - playerPosition.y) < GAME_CONFIG.PLAYER_SIZE
       );
 
       if (playerHit) {
         // 충돌 시 게임 오버
         endRound();
         return prev;
       }
 
       return {
         ...prev,
         darts: updatedDarts
       };
     });
   };
 
   const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
     if (gameState !== 'playing' || !gameAreaRef.current) return;
     
     const rect = gameAreaRef.current.getBoundingClientRect();
     const x = e.clientX - rect.left;
     const y = e.clientY - rect.top;
     
     // 플레이어 위치 제한
     const constrainedX = Math.max(GAME_CONFIG.PLAYER_SIZE, Math.min(x, GAME_CONFIG.GAME_WIDTH - GAME_CONFIG.PLAYER_SIZE));
     const constrainedY = Math.max(GAME_CONFIG.PLAYER_SIZE, Math.min(y, GAME_CONFIG.GAME_HEIGHT - GAME_CONFIG.PLAYER_SIZE));
     
     setPlayerPosition({ x: constrainedX, y: constrainedY });
   };
 
   const handleTargetClick = (targetIndex: number) => {
     if (gameState !== 'playing' || !currentRound) return;
     
     const target = currentRound.targets[targetIndex];
     if (!target) return;
     
     // 타겟 충돌 검사 (대략적인 범위)
     const distance = Math.sqrt(
       Math.pow(playerPosition.x - target.position.x, 2) + 
       Math.pow(playerPosition.y - target.position.y, 2)
     );
     
     if (distance <= target.radius + 30) { // 30px 오차 허용
       // 타겟 히트!
       setCurrentRound(prev => {
         if (!prev) return null;
         
         const updatedTargets = prev.targets.filter((_, index) => index !== targetIndex);
         const newScore = prev.score + target.points;
         
         // 모든 타겟을 수집했으면 라운드 완료
         if (updatedTargets.length === 0) {
           setTimeout(() => endRound(), 500);
         }
         
         return {
           ...prev,
           targets: updatedTargets,
           score: newScore
         };
       });
     }
   };
 
   const endRound = () => {
     if (animationFrameRef.current) {
       cancelAnimationFrame(animationFrameRef.current);
     }
     
     const roundScore = currentRound?.score || 0;
     setTotalScore(prev => prev + roundScore);
     
     setTimeout(() => {
       if (roundNumber >= GAME_CONFIG.ROUNDS_PER_GAME) {
         finishGame(totalScore + roundScore);
       } else {
         setRoundNumber(prev => prev + 1);
         initializeRound();
       }
     }, 2000);
   };
 
   const finishGame = async (finalScore: number) => {
     setGameState('finished');
     setIsSubmitting(true);
   
     // 게임 설정에 따른 최종 점수 계산
     const baseScore = finalScore;
     const timeBonus = currentRound?.timeLeft ? Math.floor(currentRound.timeLeft * 2) : 0;
     const completionBonus = roundNumber >= GAME_CONFIG.ROUNDS_PER_GAME ? 
       (gameSettings?.winScore || 100) : (gameSettings?.loseScore || 0);
     
     const calculatedScore = baseScore + timeBonus + completionBonus;
   
     try {
       // 게임 결과를 서버에 제출
       const response = await fetch('/api/game/submit', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           walletAddress,
           gameType: 'darts',
           round: roundNumber,
           score: calculatedScore,
           result: {
             dartPosition: playerPosition,
             hitTarget: (currentRound?.targets.length || 0) === 0,
             baseScore: baseScore,
             timeBonus: timeBonus,
             completionBonus: completionBonus,
             finalScore: calculatedScore,
             level: roundNumber,
             survived: roundNumber >= GAME_CONFIG.ROUNDS_PER_GAME
           }
         })
       });
   
       if (response.ok) {
         const data = await response.json();
         console.log('게임 결과 제출 성공:', data);
       } else {
         console.error('게임 결과 제출 실패');
       }
     } catch (error) {
       console.error('게임 결과 제출 오류:', error);
     } finally {
       setIsSubmitting(false);
       onComplete(calculatedScore);
     }
   };
 
   const restartGame = () => {
     setRoundNumber(1);
     setTotalScore(0);
     initializeRound();
   };
 
   if (isLoadingSettings) {
     return (
       <div className="darts-game loading">
         <div className="loading-spinner">🎯</div>
         <p>{t('common.loadingSettings')}</p>
       </div>
     );
   }
   
   if (!currentRound) {
     return (
       <div className="darts-game loading">
         <div className="loading-spinner">🎯</div>
         <p>{t('common.loading')}</p>
       </div>
     );
   }
 
   return (
     <div className="darts-game">
       {/* 게임 헤더 */}
       <div className="game-header">
         <div className="round-info">
           <span className="round-number">{t('games.darts.round')} {roundNumber}/{GAME_CONFIG.ROUNDS_PER_GAME}</span>
           <span className="total-score">{t('common.score')}: {totalScore}</span>
           <span className="round-score">{t('games.darts.thisRound')}: {currentRound.score}</span>
         </div>
         
         {gameState === 'playing' && (
           <div className="game-status">
             <div className="timer">
               ⏱️ {currentRound.timeLeft}s
             </div>
             <div className="targets-left">
               🎯 {currentRound.targets.length} {t('games.darts.targetsLeft')}
             </div>
           </div>
         )}
       </div>
 
       {/* 게임 영역 */}
       <div className="game-area">
         {gameState === 'ready' && (
           <div className="ready-screen">
             <div className="ready-content">
               <h2>🎯 {t('games.darts.ready')}</h2>
               <div className="round-preview">
                 <h3>{t('games.darts.level')} {currentRound.level}</h3>
                 <div className="level-info">
                   <div className="info-item">
                     <span className="icon">🎯</span>
                     <span>{currentRound.targets.length} {t('games.darts.targets')}</span>
                   </div>
                   <div className="info-item">
                     <span className="icon">➡️</span>
                     <span>{currentRound.darts.length} {t('games.darts.darts')}</span>
                   </div>
                   <div className="info-item">
                     <span className="icon">⏱️</span>
                     <span>{GAME_CONFIG.ROUND_TIME} {t('games.darts.seconds')}</span>
                   </div>
                 </div>
               </div>
               
               <div className="instructions">
                 <p>{t('games.darts.instruction')}</p>
                 <ul>
                   <li>{t('games.darts.moveWithMouse')}</li>
                   <li>{t('games.darts.clickTargets')}</li>
                   <li>{t('games.darts.avoidDarts')}</li>
                 </ul>
               </div>
               
               <button 
                 className="start-button"
                 onClick={startRound}
               >
                 {t('games.darts.startRound')}
               </button>
             </div>
           </div>
         )}
 
         {gameState === 'playing' && (
           <div 
             className="play-area"
             ref={gameAreaRef}
             onMouseMove={handleMouseMove}
             style={{
               width: GAME_CONFIG.GAME_WIDTH,
               height: GAME_CONFIG.GAME_HEIGHT,
               position: 'relative',
               border: '2px solid #333',
               borderRadius: '10px',
               background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
               cursor: 'none',
               overflow: 'hidden'
             }}
           >
             {/* 타겟들 */}
             {currentRound.targets.map((target, index) => (
               <div
                 key={index}
                 className="target"
                 onClick={() => handleTargetClick(index)}
                 style={{
                   position: 'absolute',
                   left: target.position.x - target.radius,
                   top: target.position.y - target.radius,
                   width: target.radius * 2,
                   height: target.radius * 2,
                   borderRadius: '50%',
                   backgroundColor: target.color,
                   border: '3px solid white',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   fontSize: '12px',
                   fontWeight: 'bold',
                   color: 'white',
                   textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                   boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                   transition: 'transform 0.1s'
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.transform = 'scale(1.1)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.transform = 'scale(1)';
                 }}
               >
                 {target.points}
               </div>
             ))}
 
             {/* 다트들 */}
             {currentRound.darts
               .filter(dart => dart.active)
               .map(dart => (
                 <div
                   key={dart.id}
                   className="dart"
                   style={{
                     position: 'absolute',
                     left: dart.position.x - 5,
                     top: dart.position.y - 5,
                     width: 10,
                     height: 10,
                     backgroundColor: '#ff4444',
                     borderRadius: '50%',
                     border: '2px solid #cc0000',
                     boxShadow: '0 0 6px #ff4444'
                   }}
                 >
                 </div>
               ))
             }
 
             {/* 플레이어 */}
             <div
               className="player"
               style={{
                 position: 'absolute',
                 left: playerPosition.x - GAME_CONFIG.PLAYER_SIZE / 2,
                 top: playerPosition.y - GAME_CONFIG.PLAYER_SIZE / 2,
                 width: GAME_CONFIG.PLAYER_SIZE,
                 height: GAME_CONFIG.PLAYER_SIZE,
                 backgroundColor: '#4CAF50',
                 borderRadius: '50%',
                 border: '3px solid #2E7D32',
                 boxShadow: '0 0 10px rgba(76, 175, 80, 0.6)',
                 zIndex: 10
               }}
             >
             </div>
 
             {/* 세이프 존 표시 */}
             <div className="safe-zone-indicator"
               style={{
                 position: 'absolute',
                 bottom: 10,
                 left: 10,
                 right: 10,
                 height: 30,
                 backgroundColor: 'rgba(76, 175, 80, 0.2)',
                 borderRadius: '5px',
                 border: '1px dashed #4CAF50',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 fontSize: '12px',
                 color: 'white',
                 fontWeight: 'bold'
               }}
             >
               {t('games.darts.safeZone')}
             </div>
           </div>
         )}
 
         {gameState === 'finished' && (
           <div className="game-finished">
             <div className="final-results">
               <div className="trophy">🏆</div>
               <h2>{t('games.darts.gameComplete')}</h2>
               
               <div className="score-breakdown">
                 <div className="score-item">
                   <span className="label">{t('games.darts.totalScore')}:</span>
                   <span className="value">{totalScore}</span>
                 </div>
                 <div className="score-item">
                   <span className="label">{t('games.darts.levelsCompleted')}:</span>
                   <span className="value">{roundNumber - 1}/{GAME_CONFIG.ROUNDS_PER_GAME}</span>
                 </div>
               </div>
               
               <div className="performance">
                 {totalScore >= 300 && <div className="achievement">🎆 {t('games.darts.excellent')}</div>}
                 {totalScore >= 150 && totalScore < 300 && <div className="achievement">⭐ {t('games.darts.good')}</div>}
                 {totalScore < 150 && <div className="achievement">💪 {t('games.darts.keepTrying')}</div>}
               </div>
             </div>
 
             <div className="action-buttons">
               {isSubmitting ? (
                 <div className="submitting">
                   <div className="spinner"></div>
                   {t('games.darts.submitting')}
                 </div>
               ) : (
                 <>
                   <button 
                     className="restart-btn"
                     onClick={restartGame}
                   >
                     {t('games.darts.playAgain')}
                   </button>
                   <button 
                     className="exit-btn"
                     onClick={() => onComplete(totalScore)}
                   >
                     {t('common.backToMenu')}
                   </button>
                 </>
               )}
             </div>
           </div>
         )}
       </div>
 
       {/* 게임 설명 */}
       <div className="game-instructions">
         <details>
           <summary>{t('games.darts.howToPlay')}</summary>
           <div className="instructions-content">
             <ol>
               <li>{t('games.darts.instructionDetail1')}</li>
               <li>{t('games.darts.instructionDetail2')}</li>
               <li>{t('games.darts.instructionDetail3')}</li>
               <li>{t('games.darts.instructionDetail4')}</li>
               <li>{t('games.darts.instructionDetail5')}</li>
             </ol>
           </div>
         </details>
       </div>
     </div>
   );
 }
