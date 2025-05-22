 /**
  * CreataChain Mission Game Frontend 진입점
  * React + Telegram Mini App SDK
  */
 
 import React from 'react';
 import ReactDOM from 'react-dom/client';
 import App from './App.tsx';
 import './styles/index.css';
 import './i18n';
 
 // Telegram WebApp 초기화
 if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
   const tg = window.Telegram.WebApp;
   
   // Telegram WebApp 설정
   tg.ready();
   tg.expand();
   
   // 하드코딩된 테마 설정
   tg.setHeaderColor('#6366f1');
   tg.setBackgroundColor('#ffffff');
   
   console.log('🚀 Telegram WebApp initialized:', {
     version: tg.version,
     platform: tg.platform,
     colorScheme: tg.colorScheme,
     user: tg.initDataUnsafe?.user
   });
 } else {
   console.warn('⚠️ Telegram WebApp not available - running in browser mode');
 }
 
 // React 앱 렌더링
 ReactDOM.createRoot(document.getElementById('root')!).render(
   <React.StrictMode>
     <App />
   </React.StrictMode>,
 );
