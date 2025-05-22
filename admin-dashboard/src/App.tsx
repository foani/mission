 /**
  * CreataChain Mission Game Admin Dashboard App
  * 통합 관리자 대시보드 - 모든 게임 관리 기능 포함
  */
 
 import React, { useState } from 'react'
 import { Admin, Resource, Layout, AppBar, Menu, Sidebar } from 'react-admin'
 import { dataProvider } from './services/adminApi'
 import { authProvider } from './services/authProvider'
 import { Dashboard } from './components/Dashboard'
 import { UserList } from './components/UserList'
 import { GameLogs } from './components/GameLogs'
 import { RankingAdmin } from './components/RankingAdmin'
 import { AirdropAdmin } from './components/AirdropAdmin'
 // 새로 통합된 게임 관리 컴포넌트들
 import { DerbyGameAdmin } from './components/DerbyGameAdmin'
 import { GameSettingsManager } from './components/GameSettingsManager'
 import { RewardSettings } from './components/RewardSettings'
 import { Users, Trophy, GamepadIcon, Gift, Settings, Horse, Target, Award } from 'lucide-react'
 import './styles/admin.css'
 
 // 탭 기반 통합 관리 인터페이스
 const AdminTabs = () => {
   const [activeTab, setActiveTab] = useState('dashboard')
 
   const tabs = [
     { id: 'dashboard', label: '대시보드', icon: <Settings className="w-4 h-4" />, component: <Dashboard /> },
     { id: 'users', label: '사용자 관리', icon: <Users className="w-4 h-4" />, component: <UserList /> },
     { id: 'games', label: '게임 로그', icon: <GamepadIcon className="w-4 h-4" />, component: <GameLogs /> },
     { id: 'derby', label: 'Derby 게임', icon: <Horse className="w-4 h-4" />, component: <DerbyGameAdmin /> },
     { id: 'settings', label: '게임 설정', icon: <Target className="w-4 h-4" />, component: <GameSettingsManager /> },
     { id: 'rewards', label: '보상 설정', icon: <Award className="w-4 h-4" />, component: <RewardSettings /> },
     { id: 'ranking', label: '랭킹 관리', icon: <Trophy className="w-4 h-4" />, component: <RankingAdmin /> },
     { id: 'airdrop', label: '에어드랍', icon: <Gift className="w-4 h-4" />, component: <AirdropAdmin /> },
   ]
 
   return (
     <div className="min-h-screen bg-gray-50">
       {/* 상단 네비게이션 */}
       <nav className="bg-white shadow-sm border-b border-gray-200">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex justify-between h-16">
             <div className="flex items-center">
               <img 
                 src="/creata-logo.png" 
                 alt="CreataChain" 
                 className="h-8 w-auto"
               />
               <h1 className="ml-4 text-xl font-semibold text-gray-900">
                 CreataChain Game Admin
               </h1>
             </div>
             <div className="flex items-center space-x-4">
               <span className="text-sm text-gray-600">관리자</span>
             </div>
           </div>
         </div>
       </nav>
 
       {/* 탭 네비게이션 */}
       <div className="bg-white shadow-sm">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex space-x-8 overflow-x-auto">
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                   activeTab === tab.id
                     ? 'border-indigo-500 text-indigo-600'
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 }`}
               >
                 {tab.icon}
                 <span>{tab.label}</span>
               </button>
             ))}
           </div>
         </div>
       </div>
 
       {/* 컨텐츠 영역 */}
       <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
         {tabs.find(tab => tab.id === activeTab)?.component}
       </main>
     </div>
   )
 }
     
     // 메인 App 컴포넌트 - 통합 관리자 대시보드 사용
     const App = () => {
       return <AdminTabs />
     }
     
     export default App
           
