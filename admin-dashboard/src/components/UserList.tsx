 /**
  * UserList - 사용자 목록 관리 컴포넌트
  * 전체 사용자 조회, 검색, 필터링, 상세정보 보기 기능
  */
 
 import React, { useState, useEffect } from 'react'
 import { 
   Users, Search, Filter, RefreshCw, Eye, CheckCircle, XCircle, 
   Wallet, Calendar, MoreVertical, Download, UserCheck, AlertTriangle
 } from 'lucide-react'
 
 // 사용자 데이터 타입 정의
 interface User {
   id: string
   walletAddress: string
   telegramId: string | null
   language: string
   isWalletVerified: boolean
   isWalletInstalled: boolean
   score: number
   lastPlayedAt: string | null
   createdAt: string
   totalGames: number
   totalRewards: number
 }
 
 interface UserListFilters {
   search: string
   language: string
   verified: string
   installed: string
   sortBy: string
   sortOrder: 'asc' | 'desc'
 }
 
 const UserList: React.FC = () => {
   const [users, setUsers] = useState<User[]>([])
   const [loading, setLoading] = useState(true)
   const [totalUsers, setTotalUsers] = useState(0)
   const [currentPage, setCurrentPage] = useState(1)
   const [pageSize] = useState(20)
   const [filters, setFilters] = useState<UserListFilters>({
     search: '',
     language: '',
     verified: '',
     installed: '',
     sortBy: 'createdAt',
     sortOrder: 'desc'
   })
   const [selectedUser, setSelectedUser] = useState<User | null>(null)
   const [showDetails, setShowDetails] = useState(false)
 
   useEffect(() => {
     loadUsers()
   }, [currentPage, filters])
 
   const loadUsers = async () => {
     setLoading(true)
     
     // 하드코딩된 더미 데이터 생성
     await new Promise(resolve => setTimeout(resolve, 800))
     
     const dummyUsers: User[] = [
       {
         id: '1',
         walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
         telegramId: '@user1',
         language: 'ko',
         isWalletVerified: true,
         isWalletInstalled: true,
         score: 15420,
         lastPlayedAt: '2025-05-22T10:30:00Z',
         createdAt: '2025-05-20T09:15:00Z',
         totalGames: 45,
         totalRewards: 1250.5
       },
       {
         id: '2', 
         walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
         telegramId: '@user2',
         language: 'en',
         isWalletVerified: true,
         isWalletInstalled: false,
         score: 13890,
         lastPlayedAt: '2025-05-22T08:45:00Z',
         createdAt: '2025-05-19T14:22:00Z',
         totalGames: 38,
         totalRewards: 980.0
       },
       {
         id: '3',
         walletAddress: '0x5555555555555555555555555555555555555555',
         telegramId: null,
         language: 'vi',
         isWalletVerified: false,
         isWalletInstalled: true,
         score: 12650,
         lastPlayedAt: '2025-05-21T16:20:00Z',
         createdAt: '2025-05-18T11:10:00Z',
         totalGames: 32,
         totalRewards: 750.2
       },
       {
         id: '4',
         walletAddress: '0x7777777777777777777777777777777777777777',
         telegramId: '@user4',
         language: 'ja',
         isWalletVerified: true,
         isWalletInstalled: true,
         score: 11200,
         lastPlayedAt: '2025-05-22T12:10:00Z',
         createdAt: '2025-05-17T08:30:00Z',
         totalGames: 29,
         totalRewards: 650.8
       },
       {
         id: '5',
         walletAddress: '0x3333333333333333333333333333333333333333',
         telegramId: '@user5',
         language: 'ko',
         isWalletVerified: false,
         isWalletInstalled: false,
         score: 10850,
         lastPlayedAt: null,
         createdAt: '2025-05-22T07:45:00Z',
         totalGames: 0,
         totalRewards: 0
       }
     ]
     
     // 필터링 로직
     let filteredUsers = dummyUsers.filter(user => {
       if (filters.search && !user.walletAddress.toLowerCase().includes(filters.search.toLowerCase()) && 
           !user.telegramId?.toLowerCase().includes(filters.search.toLowerCase())) {
         return false
       }
       if (filters.language && user.language !== filters.language) return false
       if (filters.verified === 'true' && !user.isWalletVerified) return false
       if (filters.verified === 'false' && user.isWalletVerified) return false
       if (filters.installed === 'true' && !user.isWalletInstalled) return false
       if (filters.installed === 'false' && user.isWalletInstalled) return false
       return true
     })
     
     // 정렬
     filteredUsers.sort((a, b) => {
       let aVal: any = a[filters.sortBy as keyof User]
       let bVal: any = b[filters.sortBy as keyof User]
       
       if (filters.sortBy === 'createdAt' || filters.sortBy === 'lastPlayedAt') {
         aVal = new Date(aVal || 0).getTime()
         bVal = new Date(bVal || 0).getTime()
       }
       
       if (filters.sortOrder === 'asc') {
         return aVal > bVal ? 1 : -1
       } else {
         return aVal < bVal ? 1 : -1
       }
     })
     
     setUsers(filteredUsers)
     setTotalUsers(filteredUsers.length)
     setLoading(false)
   }
 
   const formatDate = (dateString: string | null) => {
     if (!dateString) return '-'
     return new Date(dateString).toLocaleString('ko-KR', {
       year: 'numeric',
       month: '2-digit', 
       day: '2-digit',
       hour: '2-digit',
       minute: '2-digit'
     })
   }
 
   const getLanguageName = (lang: string) => {
     const names: Record<string, string> = {
       ko: '한국어',
       en: 'English',
       ja: '日本語',
       vi: 'Tiếng Việt'
     }
     return names[lang] || lang
   }
 
   const handleFilterChange = (key: keyof UserListFilters, value: string) => {
     setFilters(prev => ({ ...prev, [key]: value }))
     setCurrentPage(1)
   }
 
   const exportUsers = () => {
     // 하드코딩된 CSV 내보내기 시뮬레이션
     const csvData = users.map(user => ({
       '지갑주소': user.walletAddress,
       '텔레그램ID': user.telegramId || '',
       '언어': getLanguageName(user.language),
       '인증상태': user.isWalletVerified ? '인증완료' : '미인증',
       '지갑설치': user.isWalletInstalled ? '설치됨' : '미설치',
       '점수': user.score,
       '게임수': user.totalGames,
       '보상': user.totalRewards,
       '마지막접속': formatDate(user.lastPlayedAt),
       '가입일': formatDate(user.createdAt)
     }))
     
     console.log('CSV 내보내기 데이터:', csvData)
     alert('사용자 데이터 내보내기 완료 (콘솔 확인)')
   }
  * CreataChain Mission Game - 사용자 목록 관리 컴포넌트
  * 사용자 정보, 지갑 인증 상태, 게임 참여 현황 관리
  */
 
 
   return (
     <div className="space-y-6">
       {/* 헤더 */}
       <div className="border-b border-gray-200 pb-4">
         <h1 className="text-2xl font-bold text-gray-900 flex items-center">
           <Users className="w-8 h-8 mr-3 text-blue-600" />
           사용자 관리
         </h1>
         <p className="text-gray-600 mt-2">
           전체 사용자 {totalUsers.toLocaleString()}명의 정보를 관리할 수 있습니다.
         </p>
       </div>
 
       {/* 필터 및 검색 */}
       <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
           {/* 검색 */}
           <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
             <input
               type="text"
               placeholder="지갑주소 또는 텔레그램 ID 검색"
               className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               value={filters.search}
               onChange={(e) => handleFilterChange('search', e.target.value)}
             />
           </div>
 
           {/* 언어 필터 */}
           <select
             className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             value={filters.language}
             onChange={(e) => handleFilterChange('language', e.target.value)}
           >
             <option value="">모든 언어</option>
             <option value="ko">한국어</option>
             <option value="en">English</option>
             <option value="ja">日本語</option>
             <option value="vi">Tiếng Việt</option>
           </select>
 
           {/* 인증 상태 */}
           <select
             className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             value={filters.verified}
             onChange={(e) => handleFilterChange('verified', e.target.value)}
           >
             <option value="">모든 인증 상태</option>
             <option value="true">인증 완료</option>
             <option value="false">미인증</option>
           </select>
 
           {/* 지갑 설치 */}
           <select
             className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             value={filters.installed}
             onChange={(e) => handleFilterChange('installed', e.target.value)}
           >
             <option value="">모든 설치 상태</option>
             <option value="true">지갑 설치됨</option>
             <option value="false">지갑 미설치</option>
           </select>
 
           {/* 액션 버튼들 */}
           <div className="flex space-x-2">
             <button
               onClick={loadUsers}
               className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               disabled={loading}
             >
               <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
               새로고침
             </button>
             <button
               onClick={exportUsers}
               className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
             >
               <Download className="w-4 h-4 mr-2" />
               내보내기
             </button>
           </div>
         </div>
 
         {/* 정렬 옵션 */}
         <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2">
             <Filter className="w-4 h-4 text-gray-500" />
             <span className="text-sm text-gray-600">정렬:</span>
             <select
               className="px-2 py-1 border border-gray-300 rounded text-sm"
               value={filters.sortBy}
               onChange={(e) => handleFilterChange('sortBy', e.target.value)}
             >
               <option value="createdAt">가입일</option>
               <option value="lastPlayedAt">마지막 접속</option>
               <option value="score">점수</option>
               <option value="totalGames">게임수</option>
               <option value="totalRewards">보상</option>
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
   DateField,
   
         {/* 사용자 테이블 */}
         <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
           {loading ? (
             <div className="flex items-center justify-center h-64">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
               <span className="ml-4 text-gray-600">사용자 데이터 로딩 중...</span>
             </div>
           ) : users.length === 0 ? (
             <div className="text-center py-12">
               <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
               <p className="text-gray-500 text-lg">조건에 맞는 사용자가 없습니다.</p>
               <p className="text-gray-400 text-sm mt-2">필터 조건을 다시 확인해주세요.</p>
             </div>
           ) : (
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       사용자 정보
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       인증 상태
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       게임 현황
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       마지막 접속
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       액션
                     </th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {users.map((user) => (
                     <tr key={user.id} className="hover:bg-gray-50">
                       {/* 사용자 정보 */}
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div>
                           <div className="flex items-center">
                             <Wallet className="w-4 h-4 text-gray-400 mr-2" />
                             <span className="text-sm font-mono text-gray-900">
                               {user.walletAddress.slice(0, 10)}...{user.walletAddress.slice(-8)}
                             </span>
                           </div>
                           <div className="flex items-center mt-1">
                             <span className="text-xs text-gray-500">
                               {user.telegramId || '텔레그램 미연결'} | {getLanguageName(user.language)}
                             </span>
                           </div>
                         </div>
                       </td>
   
                       {/* 인증 상태 */}
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="space-y-1">
                           <div className="flex items-center">
                             {user.isWalletVerified ? (
                               <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                             ) : (
                               <XCircle className="w-4 h-4 text-red-500 mr-2" />
                             )}
                             <span className={`text-xs ${
                               user.isWalletVerified ? 'text-green-700' : 'text-red-700'
                             }`}>
                               {user.isWalletVerified ? '인증완료' : '미인증'}
                             </span>
                           </div>
                           <div className="flex items-center">
                             {user.isWalletInstalled ? (
                               <UserCheck className="w-4 h-4 text-blue-500 mr-2" />
                             ) : (
                               <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />
                             )}
                             <span className={`text-xs ${
                               user.isWalletInstalled ? 'text-blue-700' : 'text-orange-700'
                             }`}>
                               {user.isWalletInstalled ? '지갑설치' : '미설치'}
                             </span>
                           </div>
                         </div>
                       </td>
   
                       {/* 게임 현황 */}
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div>
                           <div className="text-sm font-medium text-gray-900">
                             {user.score.toLocaleString()}점
                           </div>
                           <div className="text-xs text-gray-500">
                             게임 {user.totalGames}회 | 보상 {user.totalRewards.toLocaleString()} CTA
                           </div>
                         </div>
                       </td>
   
                       {/* 마지막 접속 */}
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         <div className="flex items-center">
                           <Calendar className="w-4 h-4 mr-2" />
                           {formatDate(user.lastPlayedAt)}
                         </div>
                         <div className="text-xs text-gray-400 mt-1">
                           가입: {formatDate(user.createdAt)}
                         </div>
                       </td>
   
                       {/* 액션 */}
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <button
                           onClick={() => {
                             setSelectedUser(user)
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
   FilterButton,
   
         {/* 사용자 상세 정보 모달 */}
         {showDetails && selectedUser && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-gray-900">사용자 상세 정보</h2>
                 <button
                   onClick={() => {
                     setShowDetails(false)
                     setSelectedUser(null)
                   }}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <XCircle className="w-6 h-6" />
                 </button>
               </div>
   
               <div className="space-y-6">
                 {/* 기본 정보 */}
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <h3 className="text-lg font-semibold text-gray-900 mb-3">기본 정보</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-medium text-gray-600">지갑 주소</label>
                       <p className="text-sm font-mono text-gray-900 mt-1 break-all">
                         {selectedUser.walletAddress}
                       </p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-600">텔레그램 ID</label>
                       <p className="text-sm text-gray-900 mt-1">
                         {selectedUser.telegramId || '미연결'}
                       </p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-600">언어</label>
                       <p className="text-sm text-gray-900 mt-1">
                         {getLanguageName(selectedUser.language)}
                       </p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-600">가입일</label>
                       <p className="text-sm text-gray-900 mt-1">
                         {formatDate(selectedUser.createdAt)}
                       </p>
                     </div>
                   </div>
                 </div>
   
                 {/* 인증 상태 */}
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <h3 className="text-lg font-semibold text-gray-900 mb-3">인증 상태</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="flex items-center space-x-2">
                       {selectedUser.isWalletVerified ? (
                         <CheckCircle className="w-5 h-5 text-green-500" />
                       ) : (
                         <XCircle className="w-5 h-5 text-red-500" />
                       )}
                       <span className={selectedUser.isWalletVerified ? 'text-green-700' : 'text-red-700'}>
                         지갑 인증: {selectedUser.isWalletVerified ? '완료' : '미완료'}
                       </span>
                     </div>
                     <div className="flex items-center space-x-2">
                       {selectedUser.isWalletInstalled ? (
                         <UserCheck className="w-5 h-5 text-blue-500" />
                       ) : (
                         <AlertTriangle className="w-5 h-5 text-orange-500" />
                       )}
                       <span className={selectedUser.isWalletInstalled ? 'text-blue-700' : 'text-orange-700'}>
                         지갑 설치: {selectedUser.isWalletInstalled ? '완료' : '미완료'}
                       </span>
                     </div>
                   </div>
                 </div>
   
                 {/* 게임 통계 */}
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <h3 className="text-lg font-semibold text-gray-900 mb-3">게임 통계</h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="text-center">
                       <p className="text-2xl font-bold text-blue-600">{selectedUser.score.toLocaleString()}</p>
                       <p className="text-sm text-gray-600">총 점수</p>
                     </div>
                     <div className="text-center">
                       <p className="text-2xl font-bold text-green-600">{selectedUser.totalGames}</p>
                       <p className="text-sm text-gray-600">총 게임수</p>
                     </div>
                     <div className="text-center">
                       <p className="text-2xl font-bold text-purple-600">{selectedUser.totalRewards.toLocaleString()}</p>
                       <p className="text-sm text-gray-600">총 보상 (CTA)</p>
                     </div>
                     <div className="text-center">
                       <p className="text-lg font-bold text-gray-600">
                         {selectedUser.lastPlayedAt ? formatDate(selectedUser.lastPlayedAt) : '없음'}
                       </p>
                       <p className="text-sm text-gray-600">마지막 플레이</p>
                     </div>
                   </div>
                 </div>
               </div>
   
               <div className="mt-6 flex justify-end">
                 <button
                   onClick={() => {
                     setShowDetails(false)
                     setSelectedUser(null)
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
   
   export default UserList