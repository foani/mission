 /**
  * CreataChain Mission Game 메인 앱 컴포넌트
  * 
  * 주요 기능:
  * - 지갑 인증 및 연결
  * - 게임 선택 및 플레이
  * - 랭킹 보기
  * - 다국어 지원
  */
 
 import React, { useState, useEffect } from 'react';
 import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
 import { useTranslation } from 'react-i18next';
 
 // 컴포넌트 임포트
 import WalletAuth from './components/WalletAuth';
 import GameSelector from './components/GameSelector';
 import BinaryOptions from './components/BinaryOptions';
 import LazyDerby from './components/LazyDerby';
 import ReverseDarts from './components/ReverseDarts';
 import Ranking from './components/Ranking';
 import LanguageSelector from './components/LanguageSelector';
 import Navigation from './components/Navigation';
 
 // 타입 및 훅 임포트
 import { useWallet } from './hooks/useWallet';
 import { useTelegram } from './hooks/useTelegram';
 import type { User } from './types';
 
 function App() {
   const { t } = useTranslation();
   const { isConnected, walletAddress, connectWallet, user } = useWallet();
   const { tg, user: telegramUser } = useTelegram();
   
   const [currentGame, setCurrentGame] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(true);
 
   // 초기 로딩 및 설정
   useEffect(() => {
     const initializeApp = async () => {
       try {
         // Telegram WebApp 초기 설정
         if (tg) {
           tg.ready();
           tg.expand();
           
           // 다크 모드 지원
           if (tg.colorScheme === 'dark') {
             document.documentElement.classList.add('dark');
           }
         }
         
         // 자동 지갑 연결 시도 (localStorage등에 저장된 경우)
         const savedWallet = localStorage.getItem('creata-wallet-connected');
         if (savedWallet && !isConnected) {
           await connectWallet();
         }
         
       } catch (error) {
         console.error('App initialization error:', error);
       } finally {
         setIsLoading(false);
       }
     };
 
     initializeApp();
   }, [tg, isConnected, connectWallet]);
 
   // 로딩 화면
   if (isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
         <div className="text-center">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
           <p className="text-gray-600">{t('loading')}</p>
         </div>
       </div>
     );
   }
 
   // 지갑 미연결 상태
   if (!isConnected) {
     return (
       <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
         <div className="container mx-auto px-4 py-8">
           <div className="text-center mb-8">
             <h1 className="text-3xl font-bold text-gray-900 mb-2">
               {t('app.title')}
             </h1>
             <p className="text-gray-600">
               {t('app.subtitle')}
             </p>
           </div>
           
           <LanguageSelector />
           <WalletAuth />
           
           {/* Telegram 사용자 정보 표시 (디버그용) */}
           {telegramUser && (
             <div className="mt-8 p-4 bg-white rounded-lg shadow">
               <h3 className="font-semibold mb-2">{t('telegram.userInfo')}</h3>
               <p className="text-sm text-gray-600">
                 {telegramUser.first_name} {telegramUser.last_name}
                 {telegramUser.username && ` (@${telegramUser.username})`}
               </p>
             </div>
           )}
         </div>
       </div>
     );
   }
 
   // 메인 앱 컴포넌트
   return (
     <Router>
       <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
         <div className="container mx-auto px-4 py-4">
           {/* 헤더 */}
           <header className="mb-6">
             <div className="flex items-center justify-between">
               <div>
                 <h1 className="text-2xl font-bold text-gray-900">
                   {t('app.title')}
                 </h1>
                 <p className="text-sm text-gray-600">
                   {t('wallet.connected')}: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                 </p>
               </div>
               
               <div className="flex items-center gap-2">
                 <LanguageSelector />
                 {user && (
                   <div className="text-right">
                     <p className="text-sm font-semibold">{t('user.score')}: {user.score}</p>
                     <p className="text-xs text-gray-500">{t('user.rank')}: #{user.rank || 'N/A'}</p>
                   </div>
                 )}
               </div>
             </div>
           </header>
 
           {/* 라우트 */}
           <Routes>
             <Route path="/" element={<GameSelector />} />
             <Route path="/game/binary" element={<BinaryOptions />} />
             <Route path="/game/derby" element={<LazyDerby />} />
             <Route path="/game/darts" element={<ReverseDarts />} />
             <Route path="/ranking" element={<Ranking />} />
             <Route path="*" element={<Navigate to="/" replace />} />
           </Routes>
 
           {/* 네비게이션 */}
           <Navigation />
         </div>
       </div>
     </Router>
   );
 }
 
 export default App;
