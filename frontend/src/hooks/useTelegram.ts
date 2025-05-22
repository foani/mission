 /**
  * Telegram WebApp SDK Hook
  * 
  * Telegram 미니앱 SDK와의 연동을 처리하는 커스텀 훅
  * - 사용자 정보 가져오기
  * - WebApp 기능 제어 (MainButton, BackButton 등)
  * - 테마 및 색상 관리
  */
 
 import { useState, useEffect, useCallback } from 'react';
 
 interface TelegramUser {
   id: number;
   is_bot: boolean;
   first_name: string;
   last_name?: string;
   username?: string;
   language_code?: string;
   is_premium?: boolean;
   photo_url?: string;
 }
 
 interface TelegramChat {
   id: number;
   type: string;
   title: string;
   username?: string;
   photo_url?: string;
 }
 
 export function useTelegram() {
   const [tg, setTg] = useState<typeof window.Telegram?.WebApp | null>(null);
   const [user, setUser] = useState<TelegramUser | null>(null);
   const [chat, setChat] = useState<TelegramChat | null>(null);
   const [isExpanded, setIsExpanded] = useState(false);
   const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
   const [isReady, setIsReady] = useState(false);
 
   // Telegram WebApp 초기화
   useEffect(() => {
     if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
       const webApp = window.Telegram.WebApp;
       setTg(webApp);
       
       // 사용자 정보 추출
       if (webApp.initDataUnsafe?.user) {
         setUser(webApp.initDataUnsafe.user);
       }
       
       // 채팅 정보 추출
       if (webApp.initDataUnsafe?.chat) {
         setChat(webApp.initDataUnsafe.chat);
       }
       
       // 상태 설정
       setIsExpanded(webApp.isExpanded);
       setColorScheme(webApp.colorScheme);
       
       // WebApp 초기화 및 기본 설정
       webApp.ready();
       webApp.expand();
       
       // 하드코딩된 테마 설정
       webApp.setHeaderColor('#6366f1');
       webApp.setBackgroundColor('#ffffff');
       
       setIsReady(true);
       
       console.log('🚀 Telegram WebApp initialized:', {
         version: webApp.version,
         platform: webApp.platform,
         user: webApp.initDataUnsafe?.user,
         colorScheme: webApp.colorScheme
       });
     } else {
       console.warn('⚠️ Telegram WebApp not available');
     }
   }, []);
 
   // 메인 버튼 제어
   const showMainButton = useCallback((text: string, onClick: () => void) => {
     if (tg?.MainButton) {
       tg.MainButton.text = text;
       tg.MainButton.onClick(onClick);
       tg.MainButton.show();
     }
   }, [tg]);
 
   const hideMainButton = useCallback(() => {
     if (tg?.MainButton) {
       tg.MainButton.hide();
     }
   }, [tg]);
 
   // 백 버튼 제어
   const showBackButton = useCallback((onClick: () => void) => {
     if (tg?.BackButton) {
       tg.BackButton.onClick(onClick);
       tg.BackButton.show();
     }
   }, [tg]);
 
   const hideBackButton = useCallback(() => {
     if (tg?.BackButton) {
       tg.BackButton.hide();
     }
   }, [tg]);
 
   // 알림 및 확인 대화상자
   const showAlert = useCallback((message: string) => {
     if (tg?.showAlert) {
       tg.showAlert(message);
     } else {
       alert(message); // 폴백
     }
   }, [tg]);
 
   const showConfirm = useCallback((message: string): Promise<boolean> => {
     return new Promise((resolve) => {
       if (tg?.showConfirm) {
         tg.showConfirm(message, (confirmed) => resolve(confirmed));
       } else {
         resolve(confirm(message)); // 폴백
       }
     });
   }, [tg]);
 
   // 팝업 표시
   const showPopup = useCallback((params: {
     title?: string;
     message: string;
     buttons?: Array<{ id: string; type?: string; text: string }>;
   }): Promise<string | null> => {
     return new Promise((resolve) => {
       if (tg?.showPopup) {
         tg.showPopup(params, (buttonId) => resolve(buttonId));
       } else {
         // 폴백 알림
         alert(params.message);
         resolve(null);
       }
     });
   }, [tg]);
 
   // WebApp 닫기
   const close = useCallback(() => {
     if (tg?.close) {
       tg.close();
     }
   }, [tg]);
 
   // 하파틱 피드백 기능
   const hapticFeedback = useCallback((type: 'impact' | 'notification' | 'selection' = 'impact') => {
     if (tg && 'HapticFeedback' in tg) {
       const haptic = (tg as any).HapticFeedback;
       switch (type) {
         case 'impact':
           haptic.impactOccurred?.('medium');
           break;
         case 'notification':
           haptic.notificationOccurred?.('success');
           break;
         case 'selection':
           haptic.selectionChanged?.();
           break;
       }
     }
   }, [tg]);
 
   return {
     tg,
     user,
     chat,
     isExpanded,
     colorScheme,
     isReady,
     // 메서드들
     showMainButton,
     hideMainButton,
     showBackButton,
     hideBackButton,
     showAlert,
     showConfirm,
     showPopup,
     close,
     hapticFeedback,
     // 유틸리티
     isTelegramWebApp: !!tg,
     getUserId: () => user?.id,
     getUserName: () => user?.username,
     getLanguageCode: () => user?.language_code || 'en',
   };
 }
