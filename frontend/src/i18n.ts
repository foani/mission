 /**
  * 다국어 설정 (i18n)
  * 
  * CreataChain Mission Game 다국어 지원
  * 지원 언어: 영어(en), 한국어(ko), 베트남어(vi), 일본어(ja)
  */
 
 import i18n from 'i18next';
 import { initReactI18next } from 'react-i18next';
 
 // 언어 리소스 임포트
 import en from './locales/en.json';
 import ko from './locales/ko.json';
 import vi from './locales/vi.json';
 import ja from './locales/ja.json';
 
 // 언어 리소스 정의
 const resources = {
   en: { translation: en },
   ko: { translation: ko },
   vi: { translation: vi },
   ja: { translation: ja },
 };
 
 // 기본 언어 감지
 const getDefaultLanguage = (): string => {
   // 1. 로컬 스토리지에서 저장된 언어 확인
   const savedLanguage = localStorage.getItem('creata-language');
   if (savedLanguage && ['en', 'ko', 'vi', 'ja'].includes(savedLanguage)) {
     return savedLanguage;
   }
 
   // 2. Telegram WebApp 사용자 언어 확인
   if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
     const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;
     if (telegramUser?.language_code) {
       const langCode = telegramUser.language_code.toLowerCase();
       
       // 지원되는 언어로 매핑
       if (langCode.startsWith('ko')) return 'ko';
       if (langCode.startsWith('vi')) return 'vi';
       if (langCode.startsWith('ja')) return 'ja';
     }
   }
 
   // 3. 브라우저 언어 확인
   if (typeof navigator !== 'undefined') {
     const browserLang = navigator.language.toLowerCase();
     
     if (browserLang.startsWith('ko')) return 'ko';
     if (browserLang.startsWith('vi')) return 'vi';
     if (browserLang.startsWith('ja')) return 'ja';
   }
 
   // 4. 기본값으로 영어 반환
   return 'en';
 };
 
 // i18n 초기화
 i18n
   .use(initReactI18next)
   .init({
     resources,
     lng: getDefaultLanguage(),
     fallbackLng: 'en',
     
     interpolation: {
       escapeValue: false, // React에서는 XSS 보호가 기본적으로 전속됨
     },
     
     // 디버그 설정
     debug: import.meta.env.DEV,
     
     // 언어 감지 옵션
     detection: {
       order: ['localStorage', 'navigator'],
       caches: ['localStorage'],
     },
   });
 
 // 언어 변경 시 로컬 스토리지에 저장
 i18n.on('languageChanged', (lng) => {
   localStorage.setItem('creata-language', lng);
   console.log(`🌍 Language changed to: ${lng}`);
 });
 
 // 언어 리스트 상수
 export const SUPPORTED_LANGUAGES = [
   { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
   { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
   { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
   { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
 ];
 
 // 언어 변경 유틸리티 함수
 export const changeLanguage = (languageCode: string) => {
   if (SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode)) {
     i18n.changeLanguage(languageCode);
   } else {
     console.warn(`Unsupported language code: ${languageCode}`);
   }
 };
 
 // 현재 언어 가져오기
 export const getCurrentLanguage = () => i18n.language;
 
 // 언어 이름 가져오기
 export const getLanguageName = (code: string) => {
   const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
   return lang ? lang.nativeName : code;
 };
 
 export default i18n;
