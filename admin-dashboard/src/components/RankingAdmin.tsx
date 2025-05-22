  /**
   * RankingAdmin - 랭킹 관리 컴포넌트
   * 전체 사용자 랭킹, 시즌 리셋, 보상 지급 관리 기능
   */
  
  import React, { useState, useEffect } from 'react'
  import { 
    Trophy, Users, RefreshCw, Award, Crown, Medal, 
    ChevronUp, ChevronDown, Calendar, Download, 
    TrendingUp, Star, Gift, AlertCircle, CheckCircle
  } from 'lucide-react'
  
  // 랭킹 데이터 타입 정의
  interface RankingUser {
    rank: number
    userId: string
    walletAddress: string
    totalScore: number
    gamesPlayed: number
    averageScore: number
    lastActive: string
    winRate: number
    bestGame: string
    rewardsClaimed: number
  }
  
  interface SeasonInfo {
    currentSeason: number
    startDate: string
    endDate: string
    totalParticipants: number
    rewardPool: number
    status: 'active' | 'ended' | 'upcoming'
  }
  
  const RankingAdmin: React.FC = () => {
    const [rankings, setRankings] = useState<RankingUser[]>([])
    const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [rewardAmount, setRewardAmount] = useState('')
    const [showRewardModal, setShowRewardModal] = useState(false)
  
    useEffect(() => {
      loadRankingData()
    }, [])
  
    const loadRankingData = async () => {
      setLoading(true)
      
      // 하드코딩된 더미 데이터
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const dummyRankings: RankingUser[] = [
        {
          rank: 1,
          userId: 'user1',
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
          totalScore: 15420,
          gamesPlayed: 156,
          averageScore: 98.8,
          lastActive: '2025-05-22T10:30:00Z',
          winRate: 78.2,
          bestGame: 'derby',
          rewardsClaimed: 2850.5
        },
        {
          rank: 2,
          userId: 'user2',
          walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
          totalScore: 13890,
          gamesPlayed: 145,
          averageScore: 95.8,
          lastActive: '2025-05-22T09:15:00Z',
          winRate: 75.1,
          bestGame: 'binary',
          rewardsClaimed: 2340.0
        },
        {
          rank: 3,
          userId: 'user3',
          walletAddress: '0x5555555555555555555555555555555555555555',
          totalScore: 12650,
          gamesPlayed: 134,
          averageScore: 94.4,
          lastActive: '2025-05-21T16:20:00Z',
          winRate: 72.4,
          bestGame: 'darts',
          rewardsClaimed: 1980.3
        },
        {
          rank: 4,
          userId: 'user4',
          walletAddress: '0x7777777777777777777777777777777777777777',
          totalScore: 11200,
          gamesPlayed: 120,
          averageScore: 93.3,
          lastActive: '2025-05-22T12:10:00Z',
          winRate: 69.2,
          bestGame: 'derby',
          rewardsClaimed: 1750.8
        },
        {
          rank: 5,
          userId: 'user5',
          walletAddress: '0x3333333333333333333333333333333333333333',
          totalScore: 10850,
          gamesPlayed: 118,
          averageScore: 91.9,
          lastActive: '2025-05-20T14:45:00Z',
          winRate: 67.8,
          bestGame: 'binary',
          rewardsClaimed: 1650.2
        }
      ]
      
      const dummySeasonInfo: SeasonInfo = {
        currentSeason: 3,
        startDate: '2025-05-01T00:00:00Z',
        endDate: '2025-05-31T23:59:59Z',
        totalParticipants: 892,
        rewardPool: 50000,
        status: 'active'
      }
      
      setRankings(dummyRankings)
      setSeasonInfo(dummySeasonInfo)
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
  
    const getRankIcon = (rank: number) => {
      switch (rank) {
        case 1: return <Crown className="w-6 h-6 text-yellow-500" />
        case 2: return <Medal className="w-6 h-6 text-gray-400" />
        case 3: return <Award className="w-6 h-6 text-orange-600" />
        default: return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">#{rank}</span>
      }
    }
  
    const handleUserSelect = (userId: string) => {
      setSelectedUsers(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      )
    }
  
    const sendRewards = async () => {
      if (selectedUsers.length === 0 || !rewardAmount) {
        alert('사용자를 선택하고 보상 금액을 입력해주세요.')
        return
      }
      
      // 하드코딩된 보상 전송 시뮬레이션
      console.log('보상 전송:', {
        users: selectedUsers,
        amount: rewardAmount
      })
      
      alert(`${selectedUsers.length}명에게 ${rewardAmount} CTA 보상 전송 완료!`)
      
      setSelectedUsers([])
      setRewardAmount('')
      setShowRewardModal(false)
    }
  
    const resetSeason = async () => {
      if (confirm('정말 시즌을 리셋하시겠습니까? 모든 랭킹 데이터가 초기화됩니다.')) {
        console.log('시즌 리셋 실행')
        alert('시즌이 리셋되었습니다!')
        loadRankingData()
      }
    }
  
    const exportRanking = () => {
      const csvData = rankings.map(user => ({
        '순위': user.rank,
        '지갑주소': user.walletAddress,
        '총점수': user.totalScore,
        '게임수': user.gamesPlayed,
        '평균점수': user.averageScore.toFixed(1),
        '승률': `${user.winRate}%`,
        '주력게임': user.bestGame,
        '보상수령': user.rewardsClaimed,
        '마지막활동': formatDate(user.lastActive)
      }))
      
      console.log('랭킹 CSV 데이터:', csvData)
      alert('랭킹 데이터 내보내기 완료 (콘솔 확인)')
    }
  
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
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-800">랭킹 관리</h1>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportRanking}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>내보내기</span>
            </button>
            <button
              onClick={() => setShowRewardModal(true)}
              disabled={selectedUsers.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <Gift className="w-4 h-4" />
              <span>보상 지급 ({selectedUsers.length})</span>
            </button>
            <button
              onClick={resetSeason}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>시즌 리셋</span>
            </button>
          </div>
        </div>
  
        {/* 시즌 정보 카드 */}
        {seasonInfo && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-800">시즌 {seasonInfo.currentSeason} 정보</h2>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                seasonInfo.status === 'active' ? 'bg-green-100 text-green-800' :
                seasonInfo.status === 'ended' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {seasonInfo.status === 'active' ? '진행중' :
                 seasonInfo.status === 'ended' ? '종료' : '예정'}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{formatDate(seasonInfo.startDate)}</div>
                <div className="text-sm text-gray-600">시작일</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{formatDate(seasonInfo.endDate)}</div>
                <div className="text-sm text-gray-600">종료일</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{seasonInfo.totalParticipants.toLocaleString()}명</div>
                <div className="text-sm text-gray-600">참여자</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{seasonInfo.rewardPool.toLocaleString()} CTA</div>
                <div className="text-sm text-gray-600">보상 풀</div>
              </div>
            </div>
          </div>
        )}
  
        {/* 랭킹 테이블 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-800">전체 랭킹</h2>
              </div>
              <div className="text-sm text-gray-600">
                총 {rankings.length}명
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
                      checked={selectedUsers.length === rankings.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(rankings.map(user => user.userId))
                        } else {
                          setSelectedUsers([])
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    지갑 주소
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 점수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    게임 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    평균 점수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    승률
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주력 게임
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    보상 수령
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    마지막 활동
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rankings.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.userId)}
                        onChange={() => handleUserSelect(user.userId)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getRankIcon(user.rank)}
                        <span className="font-medium">{user.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono">
                        {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-lg font-semibold text-gray-900">
                          {user.totalScore.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{user.gamesPlayed}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{user.averageScore.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        user.winRate >= 70 ? 'text-green-600' :
                        user.winRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {user.winRate.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.bestGame}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{user.rewardsClaimed.toLocaleString()} CTA</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{formatDate(user.lastActive)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
  
        {/* 보상 지급 모달 */}
        {showRewardModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">보상 지급</h3>
                <button
                  onClick={() => setShowRewardModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    선택된 사용자: {selectedUsers.length}명
                  </label>
                  <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                    {selectedUsers.map(userId => {
                      const user = rankings.find(u => u.userId === userId)
                      return user ? (
                        <div key={userId} className="flex items-center justify-between py-1">
                          <span>{user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}</span>
                          <span className="text-xs text-gray-500">순위 #{user.rank}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    보상 금액 (개인당)
                  </label>
                  <input
                    type="number"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    placeholder="CTA 금액 입력"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowRewardModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={sendRewards}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    보상 지급
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  export default RankingAdmin