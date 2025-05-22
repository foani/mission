/**
 * Blockchain Airdrop Service
 * CreataChain (Catena Mainnet) 스마트컨트랙트 연동 서비스
 */

import { ethers } from 'ethers'
import { CreataAirdropABI } from '../contracts/abi/CreataAirdrop.abi'

// CreataChain (Catena Mainnet) 설정
const CATENA_RPC_URL = 'https://cvm.node.creatachain.com'
const CATENA_CHAIN_ID = 1000

// 하드코딩된 컨트랙트 주소 (실제 배포 후 업데이트 필요)
const AIRDROP_CONTRACT_ADDRESS = process.env.AIRDROP_CONTRACT_ADDRESS || '0x...' // 하드코딩된 컨트랙트 주소
const CTA_TOKEN_ADDRESS = process.env.CTA_TOKEN_ADDRESS || '0x...' // 하드코딩된 CTA 토큰 주소

// 관리자 개인키 (환경변수에서 관리)
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '' // 하드코딩된 개인키

interface AirdropTransaction {
  recipient: string
  amount: string
  rewardType: string
  txHash?: string
  status: 'pending' | 'success' | 'failed'
  gasUsed?: string
  blockNumber?: number
}

interface BatchAirdropTransaction {
  recipients: string[]
  amounts: string[]
  rewardType: string
  txHash?: string
  status: 'pending' | 'success' | 'failed'
  totalAmount: string
  successCount?: number
  failCount?: number
}

class BlockchainAirdropService {
  private provider: ethers.providers.JsonRpcProvider
  private wallet: ethers.Wallet
  private airdropContract: ethers.Contract
  
  constructor() {
    // CreataChain (Catena) 제공자 설정
    this.provider = new ethers.providers.JsonRpcProvider({
      url: CATENA_RPC_URL,
      timeout: 30000
    }, {
      chainId: CATENA_CHAIN_ID,
      name: 'Catena Mainnet'
    })
    
    // 관리자 지갑 설정
    if (!ADMIN_PRIVATE_KEY) {
      throw new Error('하드코딩된 관리자 개인키가 설정되지 않았습니다')
    }
    
    this.wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, this.provider)
    
    // 에어드롭 컨트랙트 인스턴스
    this.airdropContract = new ethers.Contract(
      AIRDROP_CONTRACT_ADDRESS,
      CreataAirdropABI,
      this.wallet
    )
  }
  
  /**
   * 개별 에어드롭 실행
   * @param recipient 받을 주소
   * @param amount CTA 수량 (wei 단위)
   * @param rewardType 보상 타입
   */
  async executeAirdrop(
    recipient: string,
    amount: string,
    rewardType: string
  ): Promise<AirdropTransaction> {
    try {
      console.log(`에어드롭 실행 시작: ${recipient}, ${amount} CTA, ${rewardType}`)
      
      // 가스 예상 및 검증
      const gasLimit = await this.airdropContract.estimateGas.executeAirdrop(
        recipient,
        ethers.utils.parseEther(amount),
        rewardType
      )
      
      // 트랜잭션 전송
      const tx = await this.airdropContract.executeAirdrop(
        recipient,
        ethers.utils.parseEther(amount),
        rewardType,
        {
          gasLimit: gasLimit.mul(120).div(100), // 20% 여유
          gasPrice: await this.provider.getGasPrice()
        }
      )
      
      console.log(`트랜잭션 전송 완료: ${tx.hash}`)
      
      // 트랜잭션 대기
      const receipt = await tx.wait()
      
      console.log(`트랜잭션 확인 완료: ${receipt.transactionHash}, 블록: ${receipt.blockNumber}`)
      
      return {
        recipient,
        amount,
        rewardType,
        txHash: receipt.transactionHash,
        status: 'success',
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      }
      
    } catch (error: any) {
      console.error('에어드롭 실행 실패:', error)
      
      return {
        recipient,
        amount,
        rewardType,
        status: 'failed'
      }
    }
  }
  
  /**
   * 배치 에어드롭 실행
   * @param recipients 받을 주소 배열
   * @param amounts 수량 배열
   * @param rewardType 보상 타입
   */
  async executeBatchAirdrop(
    recipients: string[],
    amounts: string[],
    rewardType: string
  ): Promise<BatchAirdropTransaction> {
    try {
      console.log(`배치 에어드롭 실행 시작: ${recipients.length}명`)
      
      // 수량을 wei로 변환
      const amountsInWei = amounts.map(amount => ethers.utils.parseEther(amount))
      
      // 가스 예상
      const gasLimit = await this.airdropContract.estimateGas.executeBatchAirdrop(
        recipients,
        amountsInWei,
        rewardType
      )
      
      // 트랜잭션 전송
      const tx = await this.airdropContract.executeBatchAirdrop(
        recipients,
        amountsInWei,
        rewardType,
        {
          gasLimit: gasLimit.mul(120).div(100),
          gasPrice: await this.provider.getGasPrice()
        }
      )
      
      console.log(`배치 트랜잭션 전송 완료: ${tx.hash}`)
      
      // 트랜잭션 대기
      const receipt = await tx.wait()
      
      // 총 수량 계산
      const totalAmount = amounts.reduce((sum, amount) => {
        return sum + parseFloat(amount)
      }, 0).toString()
      
      console.log(`배치 트랜잭션 확인 완료: ${receipt.transactionHash}`)
      
      return {
        recipients,
        amounts,
        rewardType,
        txHash: receipt.transactionHash,
        status: 'success',
        totalAmount,
        successCount: recipients.length,
        failCount: 0
      }
      
    } catch (error: any) {
      console.error('배치 에어드롭 실행 실패:', error)
      
      const totalAmount = amounts.reduce((sum, amount) => {
        return sum + parseFloat(amount)
      }, 0).toString()
      
      return {
        recipients,
        amounts,
        rewardType,
        status: 'failed',
        totalAmount,
        successCount: 0,
        failCount: recipients.length
      }
    }
  }
  
  /**
   * 컨트랙트 통계 조회
   */
  async getContractStats() {
    try {
      const stats = await this.airdropContract.getGlobalStats()
      
      return {
        totalAirdropped: ethers.utils.formatEther(stats._totalAirdropped),
        totalRecipients: stats._totalRecipients.toNumber(),
        contractBalance: ethers.utils.formatEther(stats._contractBalance),
        currentCampaignId: stats._currentCampaignId.toNumber()
      }
    } catch (error) {
      console.error('컨트랙트 통계 조회 실패:', error)
      throw error
    }
  }
  
  /**
   * 사용자 에어드롭 히스토리 조회
   * @param userAddress 사용자 주소
   */
  async getUserAirdropHistory(userAddress: string) {
    try {
      const history = await this.airdropContract.getUserAirdropHistory(userAddress)
      
      return history.map((record: any) => ({
        recipient: record.recipient,
        amount: ethers.utils.formatEther(record.amount),
        rewardType: record.rewardType,
        timestamp: new Date(record.timestamp.toNumber() * 1000).toISOString(),
        txHash: record.txHash
      }))
    } catch (error) {
      console.error('사용자 히스토리 조회 실패:', error)
      throw error
    }
  }
  
  /**
   * 컨트랙트에 토큰 충전
   * @param amount 충전할 CTA 수량
   */
  async depositTokens(amount: string): Promise<string> {
    try {
      console.log(`토큰 충전 시작: ${amount} CTA`)
      
      const tx = await this.airdropContract.depositTokens(
        ethers.utils.parseEther(amount)
      )
      
      const receipt = await tx.wait()
      console.log(`토큰 충전 완료: ${receipt.transactionHash}`)
      
      return receipt.transactionHash
    } catch (error) {
      console.error('토큰 충전 실패:', error)
      throw error
    }
  }
  
  /**
   * 네트워크 정보 확인
   */
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork()
      const blockNumber = await this.provider.getBlockNumber()
      const gasPrice = await this.provider.getGasPrice()
      const balance = await this.wallet.getBalance()
      
      return {
        chainId: network.chainId,
        networkName: network.name,
        blockNumber,
        gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
        adminBalance: ethers.utils.formatEther(balance),
        contractAddress: AIRDROP_CONTRACT_ADDRESS
      }
    } catch (error) {
      console.error('네트워크 정보 조회 실패:', error)
      throw error
    }
  }
  
  /**
   * 트랜잭션 상태 확인
   * @param txHash 트랜잭션 해시
   */
  async getTransactionStatus(txHash: string) {
    try {
      const tx = await this.provider.getTransaction(txHash)
      const receipt = await this.provider.getTransactionReceipt(txHash)
      
      if (!tx) {
        return { status: 'not_found' }
      }
      
      if (!receipt) {
        return { status: 'pending', transaction: tx }
      }
      
      return {
        status: receipt.status === 1 ? 'success' : 'failed',
        transaction: tx,
        receipt: {
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          transactionHash: receipt.transactionHash
        }
      }
    } catch (error) {
      console.error('트랜잭션 상태 확인 실패:', error)
      return { status: 'error', error: error.message }
    }
  }
}

export { BlockchainAirdropService, AirdropTransaction, BatchAirdropTransaction }
export default new BlockchainAirdropService()
