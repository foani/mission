 /**
  * GameLogs - 게임 로그 관리 컴포넌트
  * 전체 게임 플레이 기록, 통계, 필터링, 상세 분석 기능
  */
 
 import React, { useState, useEffect } from 'react'
 import { 
   GamepadIcon, Search, Filter, RefreshCw, Eye, Calendar, 
   TrendingUp, Users, Target, Trophy, AlertCircle, BarChart3,
   Clock, Coins, Download, Play, CheckCircle
 } from 'lucide-react'
 
 // 게임 로그 데이터 타입 정의
 interface GameLog {
   id: string
   userId: string
   userWalletAddress: string
   gameType: string
   round: number
   score: number
   result: {
     choice?: string
     correct?: boolean
     picked?: string
     timeCompleted?: number
     targetsHit?: number
     [key: string]: any
   }
   createdAt: string
   duration?: number
 }
 
 interface GameLogFilters {
   search: string
   gameType: string
   dateFrom: string
   dateTo: string
   minScore: string
   maxScore: string
   result: string
   sortBy: string
   sortOrder: 'asc' | 'desc'
 }
 
 interface GameStats {
   totalGames: number
   totalPlayers: number
   averageScore: number
   gamesByType: Record<string, number>
   topScorers: Array<{address: string, score: number, gameType: string}>
 }
 
 const GameLogs: React.FC = () => {
   const [logs, setLogs] = useState<GameLog[]>([])
   const [stats, setStats] = useState<GameStats | null>(null)
   const [loading, setLoading] = useState(true)
   const [totalLogs, setTotalLogs] = useState(0)
   const [currentPage, setCurrentPage] = useState(1)
   const [pageSize] = useState(50)
   const [filters, setFilters] = useState<GameLogFilters>({
     search: '',
     gameType: '',
     dateFrom: '',
     dateTo: '',
     minScore: '',
     maxScore: '',
     result: '',
     sortBy: 'createdAt',
     sortOrder: 'desc'
   })
   const [selectedLog, setSelectedLog] = useState<GameLog | null>(null)
   const [showDetails, setShowDetails] = useState(false)
 
   useEffect(() => {
     loadGameLogs()
   }, [currentPage, filters])
 
   const loadGameLogs = async () => {
     setLoading(true)
     
     // 하드코딩된 더미 데이터 생성
     await new Promise(resolve => setTimeout(resolve, 1000))
     
     const dummyLogs: GameLog[] = [
       {
         id: '1',
         userId: 'user1',
         userWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
         gameType: 'binary',
         round: 1255,
         score: 100,
         result: {
           choice: 'up',
           correct: true,
           timeCompleted: 45
         },
         createdAt: '2025-05-22T10:30:00Z',
         duration: 45
       },
       {
         id: '2',
         userId: 'user2', 
         userWalletAddress: '0x9876543210fedcba9876543210fedcba98765432',
         gameType: 'derby',
         round: 892,
         score: 150,
         result: {
           picked: 'Horse 3',
           correct: true
         },
         createdAt: '2025-05-22T09:15:00Z',
         duration: 120
       },
       {
         id: '3',
         userId: 'user3',
         userWalletAddress: '0x5555555555555555555555555555555555555555',
         gameType: 'darts',
         round: 445,
         score: 75,
         result: {
           targetsHit: 3,
           correct: false,
           timeCompleted: 180
         },
         createdAt: '2025-05-22T08:45:00Z',
         duration: 180
       },
       {
         id: '4',
         userId: 'user1',
         userWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
         gameType: 'binary',
         round: 1256,
         score: 0,
         result: {
           choice: 'down',
           correct: false,
           timeCompleted: 30
         },
         createdAt: '2025-05-22T08:30:00Z',
         duration: 30
       },
       {
         id: '5',
         userId: 'user4',
         userWalletAddress: '0x7777777777777777777777777777777777777777',
         gameType: 'derby',
         round: 893,
         score: 150,
         result: {
           picked: 'Horse 1',
           correct: true
         },
         createdAt: '2025-05-22T07:20:00Z',
         duration: 95
       }
     ]
     
     // 통계 데이터 생성
     const dummyStats: GameStats = {
       totalGames: 15683,
       totalPlayers: 892,
       averageScore: 87.5,
       gamesByType: {
         binary: 8450,
         derby: 4231,
         darts: 3002
       },
       topScorers: [
         { address: '0x1234...5678', score: 150, gameType: 'derby' },
         { address: '0x9876...4321', score: 150, gameType: 'derby' },
         { address: '0x5555...9999', score: 125, gameType: 'binary' },
         { address: '0x7777...2222', score: 100, gameType: 'darts' },
         { address: '0x3333...8888', score: 100, gameType: 'binary' }
       ]
     }
     
     // 필터링 로직
     let filteredLogs = dummyLogs.filter(log => {
       if (filters.search && !log.userWalletAddress.toLowerCase().includes(filters.search.toLowerCase()) &&
           !log.id.includes(filters.search)) {
         return false
       }
       if (filters.gameType && log.gameType !== filters.gameType) return false
       if (filters.minScore && log.score < parseInt(filters.minScore)) return false
       if (filters.maxScore && log.score > parseInt(filters.maxScore)) return false
       if (filters.result === 'success' && !log.result.correct) return false
       if (filters.result === 'fail' && log.result.correct) return false
       return true
     })
     
     // 정렬
     filteredLogs.sort((a, b) => {
       let aVal: any = a[filters.sortBy as keyof GameLog]
       let bVal: any = b[filters.sortBy as keyof GameLog]
       
       if (filters.sortBy === 'createdAt') {
         aVal = new Date(aVal).getTime()
         bVal = new Date(bVal).getTime()
       }
       
       if (filters.sortOrder === 'asc') {
         return aVal > bVal ? 1 : -1
       } else {
         return aVal < bVal ? 1 : -1
       }
     })
     
     setLogs(filteredLogs)
     setStats(dummyStats)
     setTotalLogs(filteredLogs.length)
     setLoading(false)
   }
 
   const formatDate = (dateString: string) => {
     return new Date(dateString).toLocaleString('ko-KR', {
       year: 'numeric',
       month: '2-digit',
       day: '2-digit',
       hour: '2-digit',
       minute: '2-digit',
       second: '2-digit'
     })
   }
 
   const getGameTypeName = (gameType: string) => {
     const names: Record<string, string> = {
       binary: 'Binary Options',
       derby: 'Lazy Derby',
       darts: 'Reverse Darts'
     }
     return names[gameType] || gameType
   }
 
   const getGameTypeIcon = (gameType: string) => {
     switch (gameType) {
       case 'binary': return <TrendingUp className="w-4 h-4 text-blue-500" />
       case 'derby': return <Trophy className="w-4 h-4 text-yellow-500" />
       case 'darts': return <Target className="w-4 h-4 text-red-500" />
       default: return <GamepadIcon className="w-4 h-4 text-gray-500" />
     }
   }
 
   const handleFilterChange = (key: keyof GameLogFilters, value: string) => {
     setFilters(prev => ({ ...prev, [key]: value }))
     setCurrentPage(1)
   }
 
   const exportLogs = () => {
     // 하드코딩된 CSV 내보내기 시뮬레이션
     const csvData = logs.map(log => ({
       '로그ID': log.id,
       '사용자': log.userWalletAddress,
       '게임타입': getGameTypeName(log.gameType),
       '라운드': log.round,
       '점수': log.score,
       '결과': log.result.correct ? '성공' : '실패',
       '플레이시간': `${log.duration}초`,
       '생성시간': formatDate(log.createdAt)
     }))
     
     console.log('게임 로그 CSV 데이터:', csvData)
     alert('게임 로그 내보내기 완료 (콘솔 확인)')
   }
  * CreataChain Mission Game - 게임 로그 관리 컴포넌트
  * 모든 게임 플레이 기록 및 분석
  */
 
 
   return (
     <div className="space-y-6">
       {/* 헤더 */}
       <div className="border-b border-gray-200 pb-4">
         <h1 className="text-2xl font-bold text-gray-900 flex items-center">
           <GamepadIcon className="w-8 h-8 mr-3 text-green-600" />
           게임 로그 관리
         </h1>
         <p className="text-gray-600 mt-2">
           전체 {totalLogs.toLocaleString()}개의 게임 기록을 분석할 수 있습니다.
         </p>
       </div>
 
       {/* 통계 카드들 */}
       {stats && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-gray-600">총 게임 수</p>
                 <p className="text-3xl font-bold text-gray-900">{stats.totalGames.toLocaleString()}</p>
               </div>
               <Play className="w-12 h-12 text-blue-500" />
             </div>
           </div>
           
           <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-gray-600">참여 플레이어</p>
                 <p className="text-3xl font-bold text-gray-900">{stats.totalPlayers.toLocaleString()}</p>
               </div>
               <Users className="w-12 h-12 text-green-500" />
             </div>
           </div>
           
           <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-gray-600">평균 점수</p>
                 <p className="text-3xl font-bold text-gray-900">{stats.averageScore.toFixed(1)}</p>
               </div>
               <BarChart3 className="w-12 h-12 text-purple-500" />
             </div>
           </div>
           
           <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-gray-600">인기 게임</p>
                 <p className="text-xl font-bold text-gray-900">
                   {getGameTypeName(Object.keys(stats.gamesByType).reduce((a, b) => 
                     stats.gamesByType[a] > stats.gamesByType[b] ? a : b
                   ))}
                 </p>
                 <p className="text-sm text-gray-500">
                   {Math.max(...Object.values(stats.gamesByType)).toLocaleString()}회 플레이
                 </p>
               </div>
               <Trophy className="w-12 h-12 text-yellow-500" />
             </div>
           </div>
         </div>
       )}
 
       {/* 필터 및 검색 */}
       <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
           {/* 검색 */}
           <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
             <input
               type="text"
               placeholder="사용자 또는 로그 ID 검색"
               className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               value={filters.search}
               onChange={(e) => handleFilterChange('search', e.target.value)}
             />
           </div>
 
           {/* 게임 타입 */}
           <select
             className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             value={filters.gameType}
             onChange={(e) => handleFilterChange('gameType', e.target.value)}
           >
             <option value="">모든 게임</option>
             <option value="binary">Binary Options</option>
             <option value="derby">Lazy Derby</option>
             <option value="darts">Reverse Darts</option>
           </select>
 
           {/* 결과 필터 */}
           <select
             className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             value={filters.result}
             onChange={(e) => handleFilterChange('result', e.target.value)}
           >
             <option value="">모든 결과</option>
             <option value="success">성공</option>
             <option value="fail">실패</option>
           </select>
 
           {/* 액션 버튼들 */}
           <div className="flex space-x-2">
             <button
               onClick={loadGameLogs}
               className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               disabled={loading}
             >
               <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
               새로고침
             </button>
             <button
               onClick={exportLogs}
               className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
             >
               <Download className="w-4 h-4 mr-2" />
               내보내기
             </button>
           </div>
         </div>
 
         {/* 점수 범위 필터 */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">최소 점수</label>
             <input
               type="number"
               placeholder="0"
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               value={filters.minScore}
               onChange={(e) => handleFilterChange('minScore', e.target.value)}
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">최대 점수</label>
             <input
               type="number"
               placeholder="1000"
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               value={filters.maxScore}
               onChange={(e) => handleFilterChange('maxScore', e.target.value)}
             />
           </div>
           <div className="flex items-end">
             <div className="flex items-center space-x-2">
               <Filter className="w-4 h-4 text-gray-500" />
               <span className="text-sm text-gray-600">정렬:</span>
               <select
                 className="px-2 py-1 border border-gray-300 rounded text-sm"
                 value={filters.sortBy}
                 onChange={(e) => handleFilterChange('sortBy', e.target.value)}
               >
                 <option value="createdAt">생성시간</option>
                 <option value="score">점수</option>
                 <option value="gameType">게임타입</option>
                 <option value="round">라운드</option>
               </select>
               <button
                 onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                 className="px-2 py-1 text-sm text-blue-600 hover:text-blue-700"
               >
                 {filters.sortOrder === 'asc' ? '오름차순' : '내림차순'}
               </button>
             </div>
           </div>
         </div>
       </div>
   
         {/* 게임 로그 테이블 */}
         <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
           {loading ? (
             <div className="flex items-center justify-center h-64">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
               <span className="ml-4 text-gray-600">게임 로그 로딩 중...</span>
             </div>
           ) : logs.length === 0 ? (
             <div className="text-center py-12">
               <GamepadIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
               <p className="text-gray-500 text-lg">조건에 맞는 게임 로그가 없습니다.</p>
               <p className="text-gray-400 text-sm mt-2">필터 조건을 다시 확인해주세요.</p>
             </div>
           ) : (
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       게임 정보
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       사용자
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       결과
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       점수 & 시간
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       생성시간
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       액션
                     </th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {logs.map((log) => (
                     <tr key={log.id} className="hover:bg-gray-50">
                       {/* 게임 정보 */}
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           {getGameTypeIcon(log.gameType)}
                           <div className="ml-3">
                             <div className="text-sm font-medium text-gray-900">
                               {getGameTypeName(log.gameType)}
                             </div>
                             <div className="text-xs text-gray-500">
                               라운드 #{log.round}
                             </div>
                           </div>
                         </div>
                       </td>
   
                       {/* 사용자 */}
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm font-mono text-gray-900">
                           {log.userWalletAddress.slice(0, 10)}...{log.userWalletAddress.slice(-8)}
                         </div>
                         <div className="text-xs text-gray-500">
                           ID: {log.id}
                         </div>
                       </td>
   
                       {/* 결과 */}
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           {log.result.correct ? (
                             <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                           ) : (
                             <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                           )}
                           <span className={`text-sm font-medium ${
                             log.result.correct ? 'text-green-700' : 'text-red-700'
                           }`}>
                             {log.result.correct ? '성공' : '실패'}
                           </span>
                         </div>
                         <div className="text-xs text-gray-500 mt-1">
                           {log.gameType === 'binary' && log.result.choice && `선택: ${log.result.choice}`}
                           {log.gameType === 'derby' && log.result.picked && `선택: ${log.result.picked}`}
                           {log.gameType === 'darts' && log.result.targetsHit !== undefined && `타겟: ${log.result.targetsHit}`}
                         </div>
                       </td>
   
                       {/* 점수 & 시간 */}
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm font-bold text-gray-900">
                           {log.score}점
                         </div>
                         <div className="text-xs text-gray-500 flex items-center mt-1">
                           <Clock className="w-3 h-3 mr-1" />
                           {log.duration}초
                         </div>
                       </td>
   
                       {/* 생성시간 */}
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         <div className="flex items-center">
                           <Calendar className="w-4 h-4 mr-2" />
                           <div>
                             <div>{formatDate(log.createdAt).split(' ')[0]}</div>
                             <div className="text-xs">{formatDate(log.createdAt).split(' ')[1]}</div>
                           </div>
                         </div>
                       </td>
   
                       {/* 액션 */}
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <button
                           onClick={() => {
                             setSelectedLog(log)
                             setShowDetails(true)
                           }}
                           className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                         >
                           <Eye className="w-4 h-4 mr-1" />
                           상세보기
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
         </div>
   
         {/* 게임 로그 상세 정보 모달 */}
         {showDetails && selectedLog && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-gray-900">게임 로그 상세 정보</h2>
                 <button
                   onClick={() => {
                     setShowDetails(false)
                     setSelectedLog(null)
                   }}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <AlertCircle className="w-6 h-6" />
                 </button>
               </div>
   
               <div className="space-y-6">
                 {/* 기본 정보 */}
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                     {getGameTypeIcon(selectedLog.gameType)}
                     <span className="ml-2">게임 정보</span>
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                       <label className="text-sm font-medium text-gray-600">게임 타입</label>
                       <p className="text-sm text-gray-900 mt-1">
                         {getGameTypeName(selectedLog.gameType)}
                       </p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-600">라운드</label>
                       <p className="text-sm text-gray-900 mt-1">
                         #{selectedLog.round}
                       </p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-600">로그 ID</label>
                       <p className="text-sm font-mono text-gray-900 mt-1">
                         {selectedLog.id}
                       </p>
                     </div>
                   </div>
                 </div>
   
                 {/* 사용자 정보 */}
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <h3 className="text-lg font-semibold text-gray-900 mb-3">사용자 정보</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-medium text-gray-600">지갑 주소</label>
                       <p className="text-sm font-mono text-gray-900 mt-1 break-all">
                         {selectedLog.userWalletAddress}
                       </p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-600">사용자 ID</label>
                       <p className="text-sm text-gray-900 mt-1">
                         {selectedLog.userId}
                       </p>
                     </div>
                   </div>
                 </div>
   
                 {/* 게임 결과 */}
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <h3 className="text-lg font-semibold text-gray-900 mb-3">게임 결과</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                       <label className="text-sm font-medium text-gray-600">결과</label>
                       <div className="flex items-center mt-1">
                         {selectedLog.result.correct ? (
                           <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                         ) : (
                           <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                         )}
                         <span className={`text-sm font-medium ${
                           selectedLog.result.correct ? 'text-green-700' : 'text-red-700'
                         }`}>
                           {selectedLog.result.correct ? '성공' : '실패'}
                         </span>
                       </div>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-600">점수</label>
                       <p className="text-lg font-bold text-blue-600 mt-1">
                         {selectedLog.score}점
                       </p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-600">플레이 시간</label>
                       <p className="text-sm text-gray-900 mt-1">
                         {selectedLog.duration}초
                       </p>
                     </div>
                   </div>
   
                   {/* 게임별 상세 정보 */}
                   <div className="mt-4 p-3 bg-white rounded border">
                     <h4 className="text-md font-medium text-gray-800 mb-2">상세 데이터</h4>
                     <div className="text-sm text-gray-600">
                       {selectedLog.gameType === 'binary' && (
                         <div>
                           <p><strong>선택:</strong> {selectedLog.result.choice}</p>
                           <p><strong>완료 시간:</strong> {selectedLog.result.timeCompleted}초</p>
                         </div>
                       )}
                       {selectedLog.gameType === 'derby' && (
                         <div>
                           <p><strong>선택한 말:</strong> {selectedLog.result.picked}</p>
                         </div>
                       )}
                       {selectedLog.gameType === 'darts' && (
                         <div>
                           <p><strong>맞춘 타겟:</strong> {selectedLog.result.targetsHit}개</p>
                           <p><strong>완료 시간:</strong> {selectedLog.result.timeCompleted}초</p>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
   
                 {/* 시간 정보 */}
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <h3 className="text-lg font-semibold text-gray-900 mb-3">시간 정보</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-medium text-gray-600">게임 시작 시간</label>
                       <p className="text-sm text-gray-900 mt-1">
                         {formatDate(selectedLog.createdAt)}
                       </p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-600">총 소요 시간</label>
                       <p className="text-sm text-gray-900 mt-1">
                         {selectedLog.duration}초
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
   
               <div className="mt-6 flex justify-end">
                 <button
                   onClick={() => {
                     setShowDetails(false)
                     setSelectedLog(null)
                   }}
                   className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                 >
                   닫기
                 </button>
               </div>
             </div>
           </div>
         )}
       </div>
     )
   }
   
   export default GameLogs