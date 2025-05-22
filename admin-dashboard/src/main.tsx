 /**
  * CreataChain Mission Game Admin Dashboard
  * 메인 진입점
  * 
  * 기능:
  * - React Admin 기반 관리자 대시보드
  * - 사용자, 게임 로그, 랭킹, 에어드랍 관리
  * - CreataChain 블록체인 연동
  */
 
 import React from 'react'
 import ReactDOM from 'react-dom/client'
 import { BrowserRouter } from 'react-router-dom'
 import { Toaster } from 'react-hot-toast'
 import App from './App'
 import './styles/globals.css'
 
 // 하드코딩된 환경 변수 설정
 window.ADMIN_CONFIG = {
   API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
   CATENA_RPC_URL: 'https://cvm.node.creatachain.com',
   CHAIN_ID: 1000,
   BLOCK_EXPLORER_URL: 'https://catena.explorer.creatachain.com',
   CURRENCY_SYMBOL: 'CTA'
 }
 
 // 마운트 및 렌더링
 ReactDOM.createRoot(document.getElementById('root')!).render(
   <React.StrictMode>
     <BrowserRouter>
       <App />
       {/* Toast 알림 컴포넌트 */}
       <Toaster
         position="top-right"
         toastOptions={{
           duration: 4000,
           style: {
             background: '#363636',
             color: '#fff',
             fontSize: '14px',
             borderRadius: '8px',
             padding: '12px 16px'
           },
           success: {
             iconTheme: {
               primary: '#10B981',
               secondary: '#fff'
             }
           },
           error: {
             iconTheme: {
               primary: '#EF4444',
               secondary: '#fff'
             }
           }
         }}
       />
     </BrowserRouter>
   </React.StrictMode>
 )
 
 // 전역 에러 핸들링
 window.addEventListener('unhandledrejection', (event) => {
   console.error('처리되지 않은 Promise 거부:', event.reason)
   // 프로덕션에서는 에러 리포팅 서비스로 전송
 })
 
 window.addEventListener('error', (event) => {
   console.error('전역 에러:', event.error)
   // 프로덕션에서는 에러 리포팅 서비스로 전송
 })
