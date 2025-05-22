 /**
  * AirdropAdmin - 에어드랍 관리 컴포넌트
  * 보상 대기열, 트랜잭션 실행, 에어드랍 히스토리 관리
  */
 
 import React, { useState, useEffect } from 'react'
 import { 
   Gift, Send, Clock, CheckCircle, AlertCircle, DollarSign,
   Users, Calendar, Filter, Download, RefreshCw, Search,
   TrendingUp, Award, Coins, ExternalLink, Copy
 } from 'lucide-react'
 
 // 에어드랍 대기열 아이템 타입
 interface AirdropQueueItem {
   id: string
   userId: string
   walletAddress: string
   rewardType: string
   ctaAmount: number
   status: 'pending' | 'processing' | 'success' | 'failed'
   createdAt: string
   processedAt?: string
   txHash?: string
   errorMessage?: string
 }
 
 // 에어드랍 통계 타입
 interface AirdropStats {
   totalPending: number
   totalProcessed: number
   totalAmount: number
   successRate: number
   failedCount: number
 }
 
 const AirdropAdmin: React.FC = () => {
   const [airdropQueue, setAirdropQueue] = useState<AirdropQueueItem[]>([])
   const [stats, setStats] = useState<AirdropStats | null>(null)
   const [loading, setLoading] = useState(true)
   const [processing, setProcessing] = useState(false)
   const [selectedItems, setSelectedItems] = useState<string[]>([])
   const [filterStatus, setFilterStatus] = useState<string>('all')
   const [searchTerm, setSearchTerm] = useState('')
   const [showAddModal, setShowAddModal] = useState(false)
   const [newReward, setNewReward] = useState({
     walletAddress: '',
     rewardType: 'ranking',
     ctaAmount: ''
   })
 
   useEffect(() => {
     loadAirdropData()
   }, [])
 
   const loadAirdropData = async () => {
     setLoading(true)
     
     // 하드코딩된 더미 데이터
     await new Promise(resolve => setTimeout(resolve, 1000))
     
     const dummyQueue: AirdropQueueItem[] = [
       {
         id: 'airdrop_1',
         userId: 'user1',
         walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
         rewardType: 'ranking',
         ctaAmount: 100.5,
         status: 'pending',
         createdAt: '2025-05-22T10:30:00Z'
       },
       {
         id: 'airdrop_2',
         userId: 'user2',
         walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
         rewardType: 'event',
         ctaAmount: 50.0,
         status: 'processing',
         createdAt: '2025-05-22T09:15:00Z'
       },
       {
         id: 'airdrop_3',
         userId: 'user3',
         walletAddress: '0x5555555555555555555555555555555555555555',
         rewardType: 'referral',
         ctaAmount: 25.0,
         status: 'success',
         createdAt: '2025-05-21T16:20:00Z',
         processedAt: '2025-05-21T16:25:00Z',
         txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
       },
       {
         id: 'airdrop_4',
         userId: 'user4',
         walletAddress: '0x7777777777777777777777777777777777777777',
         rewardType: 'ranking',
         ctaAmount: 75.0,
         status: 'failed',
         createdAt: '2025-05-21T14:10:00Z',
         processedAt: '2025-05-21T14:15:00Z',
         errorMessage: 'Insufficient gas fee'
       }
     ]
     
     const dummyStats: AirdropStats = {
       totalPending: 2,
       totalProcessed: 2,
       totalAmount: 250.5,
       successRate: 75.0,
       failedCount: 1
     }
     
     setAirdropQueue(dummyQueue)
     setStats(dummyStats)
     setLoading(false)
   }
 
   const formatDate = (dateString: string) => {
     return new Date(dateString).toLocaleString('ko-KR', {
       year: 'numeric',
       month: '2-digit',
       day: '2-digit',
       hour: '2-digit',
       minute: '2-digit'
     })
   }
 
   const getStatusIcon = (status: string) => {
     switch (status) {
       case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
       case 'processing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
       case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
       case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
       default: return null
     }
   }
 
   const getStatusBadge = (status: string) => {
     const baseClass = "px-2 py-1 rounded-full text-xs font-medium"
     switch (status) {
       case 'pending': return `${baseClass} bg-yellow-100 text-yellow-800`
       case 'processing': return `${baseClass} bg-blue-100 text-blue-800`
       case 'success': return `${baseClass} bg-green-100 text-green-800`
       case 'failed': return `${baseClass} bg-red-100 text-red-800`
       default: return baseClass
     }
   }
 
   const handleItemSelect = (itemId: string) => {
     setSelectedItems(prev => 
       prev.includes(itemId) 
         ? prev.filter(id => id !== itemId)
         : [...prev, itemId]
     )
   }
 
   const processSelected = async () => {
     if (selectedItems.length === 0) {
       alert('처리할 항목을 선택해주세요.')
       return
     }
     
     setProcessing(true)
     
     try {
       // 선택된 항목들에서 에어드롭 데이터 추출
       const selectedAirdrops = airdropQueue.filter(item => 
         selectedItems.includes(item.id) && item.status === 'pending'
       )
       
       if (selectedAirdrops.length === 0) {
         alert('처리 가능한 대기중 항목이 없습니다.')
         setProcessing(false)
         return
       }
       
       console.log('에어드롭 처리 시작:', selectedAirdrops)
       
      // 블록체인 에어드롭 실행 (실제 구현 시)
      // const blockchainService = new BlockchainAirdropService()
       // 
       // for (const airdrop of selectedAirdrops) {
       //   const result = await blockchainService.executeAirdrop(
       //     airdrop.walletAddress,
       //     airdrop.ctaAmount.toString(),
       //     airdrop.rewardType
       //   )
       //   
       //   if (result.status === 'success') {
       //     // DB 업데이트: status = 'success', txHash = result.txHash
       //   } else {
       //     // DB 업데이트: status = 'failed'
       //   }
       // }
       
       // 하드코딩된 시뮬레이션
       await new Promise(resolve => setTimeout(resolve, 3000))
       
       // 더미 결과 업데이트
       setAirdropQueue(prev => prev.map(item => {
         if (selectedItems.includes(item.id) && item.status === 'pending') {
           return {
             ...item,
             status: Math.random() > 0.1 ? 'success' : 'failed', // 90% 성공률
             processedAt: new Date().toISOString(),
             txHash: Math.random() > 0.1 ? 
               `0x${Math.random().toString(16).substr(2, 64)}` : undefined
           }
         }
         return item
       }))
       
       const successCount = selectedAirdrops.length * 0.9 // 예상 성공률
       alert(`에어드롭 처리 완료! 성공: ${Math.floor(successCount)}건, 실패: ${selectedAirdrops.length - Math.floor(successCount)}건`)
       
     } catch (error) {
       console.error('에어드롭 처리 오류:', error)
       alert('에어드롭 처리 중 오류가 발생했습니다.')
     } finally {
       setSelectedItems([])
       setProcessing(false)
       loadAirdropData()
     }
   }
 
   const addNewReward = async () => {
     if (!newReward.walletAddress || !newReward.ctaAmount) {
       alert('지갑 주소와 금액을 입력해주세요.')
       return
     }
     
     // 하드코딩된 추가 시뮬레이션
     const newItem: AirdropQueueItem = {
       id: `airdrop_${Date.now()}`,
       userId: `user_${Date.now()}`,
       walletAddress: newReward.walletAddress,
       rewardType: newReward.rewardType,
       ctaAmount: parseFloat(newReward.ctaAmount),
       status: 'pending',
       createdAt: new Date().toISOString()
     }
     
     setAirdropQueue(prev => [newItem, ...prev])
     setNewReward({ walletAddress: '', rewardType: 'ranking', ctaAmount: '' })
     setShowAddModal(false)
     
     alert('새 보상이 대기열에 추가되었습니다!')
   }
 
   const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text)
     alert('클립보드에 복사되었습니다!')
   
   
     const filteredQueue = airdropQueue.filter(item => {
       const statusMatch = filterStatus === 'all' || item.status === filterStatus
       const searchMatch = item.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.rewardType.toLowerCase().includes(searchTerm.toLowerCase())
       return statusMatch && searchMatch
     })
   
     if (loading) {
       return (
         <div className="flex items-center justify-center min-h-screen">
           <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
         </div>
       )
     }
   
     return (
       <div className="p-6 space-y-6">
         {/* 헤더 섹션 */}
         <div className="flex justify-between items-center">
           <div className="flex items-center space-x-3">
             <Gift className="w-8 h-8 text-purple-500" />
             <h1 className="text-3xl font-bold text-gray-800">에어드랍 관리</h1>
           </div>
           <div className="flex space-x-3">
             <button
               onClick={() => setShowAddModal(true)}
               className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
             >
               <Gift className="w-4 h-4" />
               <span>보상 추가</span>
             </button>
             <button
               onClick={processSelected}
               disabled={selectedItems.length === 0 || processing}
               className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
             >
               {processing ? (
                 <RefreshCw className="w-4 h-4 animate-spin" />
               ) : (
                 <Send className="w-4 h-4" />
               )}
               <span>{processing ? '처리중...' : `선택 항목 처리 (${selectedItems.length})`}</span>
             </button>
           </div>
         </div>
   
         {/* 통계 카드 섹션 */}
         {stats && (
           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
             <div className="bg-white rounded-lg border border-gray-200 p-4">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-gray-600">대기중</p>
                   <p className="text-2xl font-bold text-yellow-600">{stats.totalPending}</p>
                 </div>
                 <Clock className="w-8 h-8 text-yellow-500" />
               </div>
             </div>
             
             <div className="bg-white rounded-lg border border-gray-200 p-4">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-gray-600">처리완료</p>
                   <p className="text-2xl font-bold text-green-600">{stats.totalProcessed}</p>
                 </div>
                 <CheckCircle className="w-8 h-8 text-green-500" />
               </div>
             </div>
             
             <div className="bg-white rounded-lg border border-gray-200 p-4">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-gray-600">총 금액</p>
                   <p className="text-2xl font-bold text-purple-600">{stats.totalAmount.toLocaleString()} CTA</p>
                 </div>
                 <Coins className="w-8 h-8 text-purple-500" />
               </div>
             </div>
             
             <div className="bg-white rounded-lg border border-gray-200 p-4">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-gray-600">성공률</p>
                   <p className="text-2xl font-bold text-blue-600">{stats.successRate.toFixed(1)}%</p>
                 </div>
                 <TrendingUp className="w-8 h-8 text-blue-500" />
               </div>
             </div>
             
             <div className="bg-white rounded-lg border border-gray-200 p-4">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-gray-600">실패</p>
                   <p className="text-2xl font-bold text-red-600">{stats.failedCount}</p>
                 </div>
                 <AlertCircle className="w-8 h-8 text-red-500" />
               </div>
             </div>
           </div>
         )}
   
         {/* 필터 및 검색 섹션 */}
         <div className="bg-white rounded-lg border border-gray-200 p-4">
           <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
             <div className="flex items-center space-x-2">
               <Filter className="w-4 h-4 text-gray-500" />
               <select
                 value={filterStatus}
                 onChange={(e) => setFilterStatus(e.target.value)}
                 className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
               >
                 <option value="all">모든 상태</option>
                 <option value="pending">대기중</option>
                 <option value="processing">처리중</option>
                 <option value="success">성공</option>
                 <option value="failed">실패</option>
               </select>
             </div>
             
             <div className="flex items-center space-x-2 flex-1">
               <Search className="w-4 h-4 text-gray-500" />
               <input
                 type="text"
                 placeholder="지갑 주소 또는 보상 유형으로 검색..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
               />
             </div>
             
             <div className="text-sm text-gray-600">
               총 {filteredQueue.length}개 항목
             </div>
           </div>
         
         
               {/* 에어드랍 대기열 테이블 */}
               <div className="bg-white rounded-lg border border-gray-200">
                 <div className="p-6 border-b border-gray-200">
                   <div className="flex items-center justify-between">
                     <h2 className="text-xl font-semibold text-gray-800">에어드랍 대기열</h2>
                     <div className="text-sm text-gray-600">
                       {filteredQueue.length > 0 && (
                         <span>선택된 {selectedItems.length} / {filteredQueue.length}개</span>
                       )}
                     </div>
                   </div>
                 </div>
                 
                 <div className="overflow-x-auto">
                   <table className="w-full">
                     <thead className="bg-gray-50">
                       <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           <input
                             type="checkbox"
                             checked={selectedItems.length === filteredQueue.length && filteredQueue.length > 0}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 setSelectedItems(filteredQueue.map(item => item.id))
                               } else {
                                 setSelectedItems([])
                               }
                             }}
                             className="rounded border-gray-300"
                           />
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           상태
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           지갑 주소
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           보상 유형
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           금액
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           생성일
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           처리일
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                           트랜잭션
                         </th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {filteredQueue.map((item) => (
                         <tr key={item.id} className="hover:bg-gray-50">
                           <td className="px-6 py-4 whitespace-nowrap">
                             <input
                               type="checkbox"
                               checked={selectedItems.includes(item.id)}
                               onChange={() => handleItemSelect(item.id)}
                               className="rounded border-gray-300"
                             />
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <div className="flex items-center space-x-2">
                               {getStatusIcon(item.status)}
                               <span className={getStatusBadge(item.status)}>
                                 {item.status === 'pending' ? '대기중' :
                                  item.status === 'processing' ? '처리중' :
                                  item.status === 'success' ? '성공' : '실패'}
                               </span>
                             </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <div className="flex items-center space-x-2">
                               <span className="text-sm font-mono">
                                 {item.walletAddress.slice(0, 6)}...{item.walletAddress.slice(-4)}
                               </span>
                               <button
                                 onClick={() => copyToClipboard(item.walletAddress)}
                                 className="text-gray-400 hover:text-gray-600"
                               >
                                 <Copy className="w-3 h-3" />
                               </button>
                             </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                               {item.rewardType}
                             </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <div className="flex items-center space-x-1">
                               <Coins className="w-4 h-4 text-purple-500" />
                               <span className="text-sm font-semibold text-gray-900">
                                 {item.ctaAmount.toLocaleString()} CTA
                               </span>
                             </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <span className="text-sm text-gray-500">{formatDate(item.createdAt)}</span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             <span className="text-sm text-gray-500">
                               {item.processedAt ? formatDate(item.processedAt) : '-'}
                             </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                             {item.txHash ? (
                               <div className="flex items-center space-x-2">
                                 <span className="text-sm font-mono text-blue-600">
                                   {item.txHash.slice(0, 8)}...{item.txHash.slice(-6)}
                                 </span>
                                 <button
                                   onClick={() => copyToClipboard(item.txHash!)}
                                   className="text-gray-400 hover:text-gray-600"
                                 >
                                   <Copy className="w-3 h-3" />
                                 </button>
                                 <ExternalLink className="w-3 h-3 text-gray-400" />
                               </div>
                             ) : (
                               <span className="text-sm text-gray-400">-</span>
                             )}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                   
                   {filteredQueue.length === 0 && (
                     <div className="text-center py-12">
                       <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                       <p className="text-gray-500">에어드랍 데이터가 없습니다.</p>
                     </div>
                   )}
                 </div>
                 
                 {/* 보상 추가 모달 */}
                 {showAddModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                 <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                 <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-semibold text-gray-800">새 보상 추가</h3>
                 <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                 >
                  ✕
                 </button>
                 </div>
                 
                 <div className="space-y-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지갑 주소
                  </label>
                  <input
                    type="text"
                    value={newReward.walletAddress}
                    onChange={(e) => setNewReward(prev => ({ ...prev, walletAddress: e.target.value }))}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                 </div>
                 
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    보상 유형
                  </label>
                  <select
                    value={newReward.rewardType}
                    onChange={(e) => setNewReward(prev => ({ ...prev, rewardType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="ranking">랭킹 보상</option>
                    <option value="event">이벤트 보상</option>
                    <option value="referral">추천 보상</option>
                    <option value="special">특별 보상</option>
                  </select>
                 </div>
                 
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    보상 금액 (CTA)
                  </label>
                  <input
                    type="number"
                    value={newReward.ctaAmount}
                    onChange={(e) => setNewReward(prev => ({ ...prev, ctaAmount: e.target.value }))}
                    placeholder="100.0"
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                 </div>
                 
                 <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setNewReward({ walletAddress: '', rewardType: 'ranking', ctaAmount: '' })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={addNewReward}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    추가
                  </button>
                 </div>
                 </div>
                 </div>
                 </div>
                 )}
                 </div>
                 )
                 }
                 
                 export default AirdropAdmin