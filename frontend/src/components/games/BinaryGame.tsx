 /**
  * CreataChain Mission Game - Binary Options 게임
  * 업/다운 가격 예측 게임
  */
 
 import React, { useState, useEffect } from 'react';
 import { useTranslation } from 'react-i18next';
 import { getGameSettings, getDefaultGameSettings, GameSettings } from '../../services/gameSettings.service';
 import './BinaryGame.css';
 
 interface BinaryGameProps {
   walletAddress: string;
   onComplete: (score: number) => void;
 }
 
 interface PriceData {
   symbol: string;
   price: number;
   change24h: number;
 }
 
 interface GameRound {
   id: number;
   startPrice: number;
   endPrice: number;
   symbol: string;
   userChoice: 'up' | 'down' | null;
   result: 'win' | 'lose' | null;
   score: number;
 }
 
 export default function BinaryGame({ walletAddress, onComplete }: BinaryGameProps) {
   const { t } = useTranslation();
   const [gameState, setGameState] = useState<'waiting' | 'choosing' | 'revealing' | 'finished'>('waiting');
   const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
   const [priceData, setPriceData] = useState<PriceData | null>(null);
   const [countdown, setCountdown] = useState(10);
   const [userChoice, setUserChoice] = useState<'up' | 'down' | null>(null);
   const [roundNumber, setRoundNumber] = useState(1);
   const [totalScore, setTotalScore] = useState(0);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
   const [isLoadingSettings, setIsLoadingSettings] = useState(true);
 
   // 게임 설정 로드
   useEffect(() => {
     const loadGameSettings = async () => {
       try {
         setIsLoadingSettings(true);
         const settings = await getGameSettings('binary');
         
         if (settings) {
           setGameSettings(settings);
         } else {
           // API에서 설정을 찾을 수 없으면 기본값 사용
           const defaultSettings = getDefaultGameSettings('binary');
           setGameSettings(defaultSettings);
         }
       } catch (error) {
         console.error('Error loading game settings:', error);
         // 오류 발생 시 기본값 사용
         const defaultSettings = getDefaultGameSettings('binary');
         setGameSettings(defaultSettings);
       } finally {
         setIsLoadingSettings(false);
       }
     };
   
     loadGameSettings();
   }, []);
   
   useEffect(() => {
     if (gameSettings && !isLoadingSettings) {
       startNewRound();
     }
   }, [gameSettings, isLoadingSettings]);
   
   // 하드코딩된 가상의 암호화폐 데이터
   const cryptoSymbols = ['BTC', 'ETH', 'CTA', 'BNB', 'ADA'];
   useEffect(() => {
     let timer: NodeJS.Timeout;
     
     if (gameState === 'choosing' && countdown > 0) {
       timer = setTimeout(() => {
         setCountdown(countdown - 1);
       }, 1000);
     } else if (gameState === 'choosing' && countdown === 0) {
       // 시간 종료되면 자동으로 결과 공개
       revealResult();
     }
 
     return () => clearTimeout(timer);
   }, [gameState, countdown]);
 
   const generateMockPriceData = (): PriceData => {
     // 하드코딩된 모의 가격 데이터 생성
     const symbol = cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)];
     const basePrice = {
       BTC: 42000,
       ETH: 2800,
       CTA: 0.15, // 하드코딩된 CTA 가격
       BNB: 320,
       ADA: 0.8
     }[symbol] || 100;
 
     const volatility = Math.random() * 0.1 - 0.05; // -5% ~ +5%
     const price = basePrice * (1 + volatility);
     const change24h = (Math.random() * 20 - 10); // -10% ~ +10%
 
     return {
       symbol,
       price: Math.round(price * 100) / 100,
       change24h: Math.round(change24h * 100) / 100
     };
   };
 
   const startNewRound = () => {
     const mockData = generateMockPriceData();
     setPriceData(mockData);
     
     const newRound: GameRound = {
       id: Date.now(),
       startPrice: mockData.price,
       endPrice: 0,
       symbol: mockData.symbol,
       userChoice: null,
       result: null,
       score: 0
     };
     
     setCurrentRound(newRound);
     setUserChoice(null);
     setCountdown(gameSettings?.choiceTimeSeconds || 10);
     setGameState('choosing');
   };
 
   const makeChoice = (choice: 'up' | 'down') => {
     if (gameState !== 'choosing' || userChoice) return;
     
     setUserChoice(choice);
     setCurrentRound(prev => prev ? { ...prev, userChoice: choice } : null);
   };
 
   const revealResult = () => {
     if (!currentRound || !priceData) return;
 
     setGameState('revealing');
     
     // 결과 가격 계산 (랜덤하지만 약간의 로직 있음)
     const volatility = (Math.random() * 0.08 - 0.04); // -4% ~ +4%
     const endPrice = currentRound.startPrice * (1 + volatility);
     
     const priceWentUp = endPrice > currentRound.startPrice;
     const userWon = (
       (userChoice === 'up' && priceWentUp) || 
       (userChoice === 'down' && !priceWentUp)
     );
     
     const score = userWon ? (userChoice ? (gameSettings?.pointsPerWin || 100) : 0) : (gameSettings?.pointsPerLoss || 0); // 선택하지 않으면 0점
     
     const updatedRound: GameRound = {
       ...currentRound,
       endPrice: Math.round(endPrice * 100) / 100,
       result: userWon ? 'win' : 'lose',
       score
     };
     
     setCurrentRound(updatedRound);
     setTotalScore(prev => prev + score);
 
     // 3초 후 다음 라운드 또는 게임 종료
     setTimeout(() => {
       if (roundNumber >= (gameSettings?.totalRounds || 3)) {
         finishGame(totalScore + score);
       } else {
         setRoundNumber(prev => prev + 1);
         startNewRound();
       }
     }, (gameSettings?.resultDisplaySeconds || 3) * 1000);
   };
 
   const finishGame = async (finalScore: number) => {
     setGameState('finished');
     setIsSubmitting(true);
 
     try {
       // 게임 결과를 서버에 제출
       const response = await fetch('/api/game/submit', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           walletAddress,
           gameType: 'binary',
           round: roundNumber,
           score: finalScore,
           result: {
             choice: userChoice,
             correct: currentRound?.result === 'win',
             targetPrice: currentRound?.startPrice || 0,
             resultPrice: currentRound?.endPrice || 0
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
       onComplete(finalScore);
     }
   };
 
   const restartGame = () => {
     setRoundNumber(1);
     setTotalScore(0);
     startNewRound();
   };
 
   if (!currentRound || !priceData || isLoadingSettings || !gameSettings) {
     return (
       <div className="binary-game loading">
         <div className="loading-spinner">🔄</div>
         <p>{isLoadingSettings ? t('games.binary.loadingSettings') : t('games.binary.loading')}</p>
       </div>
     );
   }
 
   return (
     <div className="binary-game">
       {/* 프리미엄 게임 헤더 */}
       <div className="game-header">
         <div className="round-info">
           <span className="round-number">{t('games.binary.round')} {roundNumber}/{gameSettings?.totalRounds || 3}</span>
           <span className="total-score">{totalScore}</span>
         </div>
       </div>
   
       {/* 프리미엄 차트 섹션 */}
       <div className="chart-section">
         {/* 암호화폐 정보 */}
         <div className="crypto-info">
           <div className="crypto-symbol">
             <div className="symbol-icon">
               {priceData.symbol}
             </div>
             <div className="symbol-name">{priceData.symbol}</div>
           </div>
           <div className="current-price">
             <div className="price-value">
               ${currentRound.startPrice.toLocaleString()}
             </div>
             <div className={`price-change ${priceData.change24h >= 0 ? 'positive' : 'negative'}`}>
               {priceData.change24h >= 0 ? '+' : ''}{priceData.change24h.toFixed(2)}%
             </div>
           </div>
         </div>
   
         {/* 미니 차트 시각화 */}
         <div className="mini-chart">
           <div className="chart-line"></div>
         </div>
   
         {/* 결과 표시 (공개 상태일 때) */}
         {gameState === 'revealing' && (
           <div className="price-result">
             <div className="end-price">
               {t('games.binary.finalPrice')}: ${currentRound.endPrice.toLocaleString()}
             </div>
             <div className={`price-movement ${currentRound.endPrice > currentRound.startPrice ? 'up' : 'down'}`}>
               {currentRound.endPrice > currentRound.startPrice ? '↑' : '↓'} 
               {((currentRound.endPrice - currentRound.startPrice) / currentRound.startPrice * 100).toFixed(2)}%
             </div>
           </div>
         )}
       </div>
   
       {/* 게임 상태별 UI */}
       {gameState === 'choosing' && (
         <div className="choice-section">
           {/* 카운트다운 타이머 */}
           <div className="countdown-timer">
             <div className="countdown-display">{countdown}</div>
             <div className="countdown-label">{t('games.binary.timeLeft')}</div>
           </div>
   
           {/* 예측 선택 버튼 */}
           <div className="choice-buttons">
             <button 
               className={`choice-btn up ${userChoice === 'up' ? 'selected' : ''}`}
               onClick={() => makeChoice('up')}
               disabled={!!userChoice}
             >
               <span className="prediction-icon">↑</span>
               {t('games.binary.up')}
             </button>
             <button 
               className={`choice-btn down ${userChoice === 'down' ? 'selected' : ''}`}
               onClick={() => makeChoice('down')}
               disabled={!!userChoice}
             >
               <span className="prediction-icon">↓</span>
               {t('games.binary.down')}
             </button>
           </div>
         </div>
       )}
       
       {/* 결과 공개 섹션 */}
       {gameState === 'revealing' && (
         <div className="result-section">
           <div className="result-animation">
             {currentRound.result === 'win' ? '🎉' : '😔'}
           </div>
           <div className={`result-text ${currentRound.result}`}>
             {currentRound.result === 'win' 
               ? t('games.binary.youWon') 
               : t('games.binary.youLost')
             }
           </div>
           <div className="score-display">
             +{currentRound.score} {t('common.points')}
           </div>
         )}
         
         {/* 게임 완료 섹션 */}
         {gameState === 'finished' && (
           <div className="game-finished">
             <div className="final-score">{totalScore}</div>
             <div className="performance-message">
               {totalScore >= 250 && t('games.binary.excellent')}
               {totalScore >= 150 && totalScore < 250 && t('games.binary.good')}
               {totalScore < 150 && t('games.binary.keepTrying')}
             </div>
             <div className="action-buttons">
               {isSubmitting ? (
                 <div className="submitting">
                   <div className="spinner"></div>
                   {t('games.binary.submitting')}
                 </div>
               ) : (
                 <>
                   <button className="action-btn primary" onClick={restartGame}>
                     {t('games.binary.playAgain')}
                   </button>
                   <button className="action-btn secondary" onClick={() => window.history.back()}>
                     {t('common.back')}
                   </button>
                 </>
               )}
             </div>
           </div>
         )}
         </div>
         );
         }