 /**
  * CreataChain Admin Dashboard - 메인 대시보드 컴포넌트
  * 전체 시스템 현황, 통계, 요약 정보를 표시하는 메인 화면
  */
 
 import React, { useState, useEffect } from 'react'
 import { 
   Users, GamepadIcon, Trophy, Gift, TrendingUp, AlertCircle, 
   CheckCircle, Clock, BarChart3, Activity, Wallet, Coins 
 } from 'lucide-react'
 
 // 하드코딩된 통계 데이터 (실제 구현에서는 API에서 가져옴)
 interface DashboardStats {
   totalUsers: number
   activeUsers: number  
   totalGames: number
   recentGames: number
   totalRewards: number
   pendingAirdrops: number
   topRankers: Array<{id: string, address: string, score: number}>
   recentActivities: Array<{id: string, type: string, description: string, timestamp: string}>
 }
 
 const Dashboard: React.FC = () => {
   const [stats, setStats] = useState<DashboardStats | null>(null)
   const [loading, setLoading] = useState(true)
 
   useEffect(() => {
     // 하드코딩된 더미 데이터 로딩 시뮬레이션
     const loadDashboardData = async () => {
       await new Promise(resolve => setTimeout(resolve, 1000)) // 로딩 시뮬레이션
       
       const dummyStats: DashboardStats = {
         totalUsers: 1247,
         activeUsers: 892,
         totalGames: 15683,
         recentGames: 156,
         totalRewards: 45280.5,
         pendingAirdrops: 23,
         topRankers: [
           { id: '1', address: '0x1234...5678', score: 15420 },
           { id: '2', address: '0x9876...4321', score: 13890 },
           { id: '3', address: '0x5555...9999', score: 12650 },
           { id: '4', address: '0x7777...2222', score: 11200 },
           { id: '5', address: '0x3333...8888', score: 10850 }
         ],
         recentActivities: [
           { id: '1', type: 'game', description: 'Derby 게임 라운드 #1255 완료', timestamp: '2분 전' },
           { id: '2', type: 'airdrop', description: 'CTA 에어드랍 25개 지급 완료', timestamp: '5분 전' },
           { id: '3', type: 'user', description: '신규 사용자 10명 가입', timestamp: '12분 전' },
           { id: '4', type: 'reward', description: '보상 설정 업데이트', timestamp: '25분 전' },
           { id: '5', type: 'game', description: 'Binary Options 게임 설정 변경', timestamp: '1시간 전' }
         ]
       }
       
       setStats(dummyStats)
       setLoading(false)
     }
 
     loadDashboardData()
   }, [])
 
   if (loading) {
     return (
       <div className="flex items-center justify-center h-64">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
         <span className="ml-4 text-gray-600">대시보드 로딩 중...</span>
       </div>
     )
   }
 
   if (!stats) {
     return (
       <div className="text-center text-red-600 p-8">
         <AlertCircle className="w-12 h-12 mx-auto mb-4" />
         데이터를 불러올 수 없습니다.
       </div>
     )
   }
 
   return (
     <div className="space-y-6">
       {/* 헤더 */}
       <div className="border-b border-gray-200 pb-4">
         <h1 className="text-2xl font-bold text-gray-900 flex items-center">
           <BarChart3 className="w-8 h-8 mr-3 text-indigo-600" />
           CreataChain 게임 관리 대시보드
         </h1>
         <p className="text-gray-600 mt-2">
           실시간 시스템 현황 및 주요 지표를 확인할 수 있습니다.
         </p>
       </div>
 
       {/* 주요 통계 카드들 */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* 전체 사용자 */}
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">전체 사용자</p>
               <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
               <p className="text-sm text-green-600 mt-1">
                 활성 사용자: {stats.activeUsers.toLocaleString()}
               </p>
             </div>
             <Users className="w-12 h-12 text-blue-500" />
           </div>
         </div>
 
         {/* 게임 현황 */}
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">총 게임 수</p>
               <p className="text-3xl font-bold text-gray-900">{stats.totalGames.toLocaleString()}</p>
               <p className="text-sm text-green-600 mt-1">
                 최근 24시간: {stats.recentGames}
               </p>
             </div>
             <GamepadIcon className="w-12 h-12 text-green-500" />
           </div>
         </div>
 
         {/* 보상 현황 */}
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">총 보상 지급</p>
               <p className="text-3xl font-bold text-gray-900">{stats.totalRewards.toLocaleString()} CTA</p>
               <p className="text-sm text-orange-600 mt-1">
                 대기 중: {stats.pendingAirdrops}건
               </p>
             </div>
             <Coins className="w-12 h-12 text-yellow-500" />
           </div>
         </div>
 
         {/* 시스템 상태 */}
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">시스템 상태</p>
               <p className="text-xl font-bold text-green-600 flex items-center mt-2">
                 <CheckCircle className="w-5 h-5 mr-2" />
                 정상 운영
               </p>
               <p className="text-sm text-gray-500 mt-1">
                 Catena Chain 연결됨
               </p>
             </div>
             <Activity className="w-12 h-12 text-green-500" />
           </div>
         </div>
       </div>
  
        {/* 콘텐츠 그리드 - 랭킹 및 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TOP 5 랭킹 */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              TOP 5 랭킹
            </h3>
            <div className="space-y-3">
              {stats.topRankers.map((ranker, index) => (
                <div key={ranker.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{ranker.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{ranker.score.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">점수</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                전체 랭킹 보기 →
              </button>
            </div>
          </div>
  
          {/* 최근 활동 */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              최근 활동
            </h3>
            <div className="space-y-3">
              {stats.recentActivities.map((activity) => {
                const getActivityIcon = (type: string) => {
                  switch (type) {
                    case 'game': return <GamepadIcon className="w-4 h-4 text-green-500" />
                    case 'airdrop': return <Gift className="w-4 h-4 text-purple-500" />
                    case 'user': return <Users className="w-4 h-4 text-blue-500" />
                    case 'reward': return <Coins className="w-4 h-4 text-yellow-500" />
                    default: return <Activity className="w-4 h-4 text-gray-500" />
                  }
                }
  
                return (
                  <div key={activity.id} className="flex items-start space-x-3 py-2">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                전체 로그 보기 →
              </button>
            </div>
          </div>
        </div>
  
        {/* 하단 빠른 액션 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">빠른 액션</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-center transition-all duration-200">
              <Users className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">사용자 관리</span>
            </button>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-center transition-all duration-200">
              <GamepadIcon className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">게임 설정</span>
            </button>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-center transition-all duration-200">
              <Gift className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">에어드랍</span>
            </button>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-center transition-all duration-200">
              <Trophy className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">랭킹 관리</span>
            </button>
          </div>
        </div>
      </div>
    )
  
  }
  
  export default Dashboard
  export { Dashboard }