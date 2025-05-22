 /**
  * 지갑 인증 컴포넌트
  * 
  * Creata Wallet 및 MetaMask 연결/인증 처리
  * - 지갑 설치 안내
  * - 지갑 연결 및 인증
  * - 오류 처리 및 사용자 피드백
  */
 
 import React, { useState } from 'react';
 import { useTranslation } from 'react-i18next';
 import { Wallet, Download, CheckCircle, AlertCircle, Loader } from 'lucide-react';
 import { useWallet } from '../hooks/useWallet';
 import { useTelegram } from '../hooks/useTelegram';
 
 const WalletAuth: React.FC = () => {
   const { t } = useTranslation();
   const {
     isConnected,
     walletAddress,
     walletType,
     isLoading,
     error,
     connectWallet,
     verifyWallet,
     user,
     isCreataWalletAvailable,
     isMetaMaskAvailable,
     hasAnyWallet
   } = useWallet();
   
   const { showAlert, hapticFeedback } = useTelegram();
   const [isVerifying, setIsVerifying] = useState(false);
 
   // 지갑 연결 처리
   const handleConnectWallet = async () => {
     try {
       hapticFeedback('selection');
       const success = await connectWallet();
       
       if (success) {
         hapticFeedback('notification');
         showAlert(t('wallet.connected'));
       }
     } catch (error: any) {
       hapticFeedback('impact');
       showAlert(error.message || t('errors.walletError'));
     }
   };
 
   // 지갑 인증 처리
   const handleVerifyWallet = async () => {
     try {
       setIsVerifying(true);
       hapticFeedback('selection');
       
       const success = await verifyWallet();
       
       if (success) {
         hapticFeedback('notification');
         showAlert(t('wallet.verified'));
       }
     } catch (error: any) {
       hapticFeedback('impact');
       showAlert(error.message || t('wallet.verificationFailed'));
     } finally {
       setIsVerifying(false);
     }
   };
 
   // Creata Wallet 설치 안내
   const handleInstallCreataWallet = () => {
     hapticFeedback('selection');
     // 하드코딩된 Creata Wallet 다운로드 링크
     const creataWalletUrl = 'https://play.google.com/store/apps/details?id=com.creatawallet';
     window.open(creataWalletUrl, '_blank');
   };
 
   // 지갑이 연결되었지만 인증되지 않은 경우
   if (isConnected && !user?.isWalletVerified) {
     return (
       <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
         <div className="text-center">
           <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <AlertCircle className="w-8 h-8 text-yellow-600" />
           </div>
           
           <h2 className="text-xl font-bold text-gray-900 mb-2">
             {t('wallet.verifyTitle')}
           </h2>
           
           <p className="text-gray-600 mb-4">
             {t('wallet.verifyDescription')}
           </p>
           
           <div className="mb-4 p-3 bg-gray-50 rounded-lg">
             <p className="text-sm text-gray-500 mb-1">{t('wallet.address')}</p>
             <p className="text-sm font-mono text-gray-900">
               {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
             </p>
           </div>
           
           <button
             onClick={handleVerifyWallet}
             disabled={isVerifying}
             className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
           >
             {isVerifying ? (
               <>
                 <Loader className="w-4 h-4 animate-spin" />
                 {t('wallet.verifying')}
               </>
             ) : (
               <>
                 <CheckCircle className="w-4 h-4" />
                 {t('wallet.verifyButton')}
               </>
             )}
           </button>
           
           {error && (
             <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
               <p className="text-sm text-red-600">{error}</p>
             </div>
           )}
         </div>
       </div>
     );
   }
 
   // 지갑이 연결되고 인증된 경우 (성공 상태)
   if (isConnected && user?.isWalletVerified) {
     return (
       <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
         <div className="text-center">
           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <CheckCircle className="w-8 h-8 text-green-600" />
           </div>
           
           <h2 className="text-xl font-bold text-gray-900 mb-2">
             {t('wallet.verified')}
           </h2>
           
           <div className="mb-4 p-3 bg-gray-50 rounded-lg">
             <p className="text-sm text-gray-500 mb-1">{t('wallet.address')}</p>
             <p className="text-sm font-mono text-gray-900">
               {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
             </p>
             
             <div className="mt-2 flex items-center justify-between text-sm">
               <span className="text-gray-500">{t('user.score')}</span>
               <span className="font-semibold text-indigo-600">{user.score}</span>
             </div>
           </div>
           
           <div className="text-sm text-green-600 flex items-center justify-center gap-1">
             <CheckCircle className="w-4 h-4" />
             {t('wallet.connected')} ({walletType === 'creata' ? 'Creata Wallet' : 'MetaMask'})
           </div>
         </div>
       </div>
     );
   }
 
   // 지갑이 설치되지 않은 경우
   if (!hasAnyWallet) {
     return (
       <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
         <div className="text-center">
           <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <Download className="w-8 h-8 text-orange-600" />
           </div>
           
           <h2 className="text-xl font-bold text-gray-900 mb-2">
             {t('wallet.notInstalled')}
           </h2>
           
           <p className="text-gray-600 mb-6">
             {t('wallet.installMessage')}
           </p>
           
           <button
             onClick={handleInstallCreataWallet}
             className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mb-4"
           >
             <Download className="w-4 h-4" />
             {t('wallet.installButton')}
           </button>
           
           <p className="text-xs text-gray-500">
             {t('wallet.description')}
           </p>
         </div>
       </div>
     );
   }
 
   // 기본 상태: 지갑 연결 대기
   return (
     <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
       <div className="text-center">
         <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
           <Wallet className="w-8 h-8 text-indigo-600" />
         </div>
         
         <h2 className="text-xl font-bold text-gray-900 mb-2">
           {t('wallet.title')}
         </h2>
         
         <p className="text-gray-600 mb-6">
           {t('wallet.description')}
         </p>
         
         <button
           onClick={handleConnectWallet}
           disabled={isLoading}
           className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
         >
           {isLoading ? (
             <>
               <Loader className="w-4 h-4 animate-spin" />
               {t('wallet.connecting')}
             </>
           ) : (
             <>
               <Wallet className="w-4 h-4" />
               {t('wallet.connect')}
             </>
           )}
         </button>
         
         {/* 사용 가능한 지갑 표시 */}
         <div className="mt-4 text-sm text-gray-500">
           <p>사용 가능한 지갑:</p>
           <div className="flex justify-center gap-2 mt-2">
             {isCreataWalletAvailable && (
               <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                 Creata Wallet
               </span>
             )}
             {isMetaMaskAvailable && (
               <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                 MetaMask
               </span>
             )}
             {!isCreataWalletAvailable && !isMetaMaskAvailable && (
               <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                 지갑 없음
               </span>
             )}
           </div>
         </div>
         
         {error && (
           <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
             <p className="text-sm text-red-600">{error}</p>
           </div>
         )}
       </div>
     </div>
   );
 };
 
 export default WalletAuth;
