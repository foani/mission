/**
 * CTA Token Airdrop Smart Contract
 * CreataChain (Catena Mainnet) 기반 CIP-20 토큰 에어드롭 컨트랙트
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title CreataAirdrop
 * @dev CTA 토큰 에어드롭 관리 스마트컨트랙트
 * - 관리자 권한 기반 에어드롭 실행
 * - 머클트리 기반 대량 에어드롭 지원
 * - 개별/배치 에어드롭 모두 지원
 * - 에어드롭 히스토리 추적
 */
contract CreataAirdrop is Ownable, ReentrancyGuard {
    IERC20 public immutable ctaToken;
    
    // 에어드롭 캠페인 구조체
    struct AirdropCampaign {
        string name;
        uint256 totalAmount;
        uint256 distributedAmount;
        uint256 startTime;
        uint256 endTime;
        bytes32 merkleRoot;
        bool isActive;
        mapping(address => bool) hasClaimed;
    }
    
    // 개별 에어드롭 기록
    struct AirdropRecord {
        address recipient;
        uint256 amount;
        string rewardType; // 'ranking', 'event', 'referral', 'special'
        uint256 timestamp;
        bytes32 txHash;
    }
    
    // 상태 변수
    mapping(uint256 => AirdropCampaign) public campaigns;
    mapping(address => AirdropRecord[]) public userAirdropHistory;
    mapping(address => uint256) public totalUserRewards;
    
    uint256 public currentCampaignId;
    uint256 public totalAirdropped;
    uint256 public totalRecipients;
    
    // 관리자 주소들 (멀티시그 지원)
    mapping(address => bool) public admins;
    
    // 이벤트
    event AirdropExecuted(
        address indexed recipient,
        uint256 amount,
        string rewardType,
        uint256 timestamp
    );
    
    event CampaignCreated(
        uint256 indexed campaignId,
        string name,
        uint256 totalAmount,
        bytes32 merkleRoot
    );
    
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    
    // 수정자
    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }
    
    /**
     * @dev 생성자
     * @param _ctaToken CTA 토큰 컨트랙트 주소
     */
    constructor(address _ctaToken) {
        require(_ctaToken != address(0), "Invalid CTA token address");
        ctaToken = IERC20(_ctaToken);
        admins[msg.sender] = true;
    }
    
    /**
     * @dev 관리자 추가
     * @param _admin 새 관리자 주소
     */
    function addAdmin(address _admin) external onlyOwner validAddress(_admin) {
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }
    
    /**
     * @dev 관리자 제거
     * @param _admin 제거할 관리자 주소
     */
    function removeAdmin(address _admin) external onlyOwner {
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    
        
        /**
         * @dev 개별 에어드롭 실행
         * @param _recipient 받을 주소
         * @param _amount 에어드롭 수량
         * @param _rewardType 보상 타입
         */
        function executeAirdrop(
            address _recipient,
            uint256 _amount,
            string memory _rewardType
        ) external onlyAdmin validAddress(_recipient) nonReentrant {
            require(_amount > 0, "Amount must be greater than 0");
            require(ctaToken.balanceOf(address(this)) >= _amount, "Insufficient contract balance");
            
            // 토큰 전송
            require(ctaToken.transfer(_recipient, _amount), "Token transfer failed");
            
            // 기록 업데이트
            AirdropRecord memory record = AirdropRecord({
                recipient: _recipient,
                amount: _amount,
                rewardType: _rewardType,
                timestamp: block.timestamp,
                txHash: blockhash(block.number - 1)
            });
            
            userAirdropHistory[_recipient].push(record);
            totalUserRewards[_recipient] += _amount;
            totalAirdropped += _amount;
            
            if (userAirdropHistory[_recipient].length == 1) {
                totalRecipients++;
            }
            
            emit AirdropExecuted(_recipient, _amount, _rewardType, block.timestamp);
        }
        
        /**
         * @dev 배치 에어드롭 실행
         * @param _recipients 받을 주소 배열
         * @param _amounts 에어드롭 수량 배열
         * @param _rewardType 보상 타입
         */
        function executeBatchAirdrop(
            address[] memory _recipients,
            uint256[] memory _amounts,
            string memory _rewardType
        ) external onlyAdmin nonReentrant {
            require(_recipients.length == _amounts.length, "Arrays length mismatch");
            require(_recipients.length > 0, "Empty arrays");
            require(_recipients.length <= 100, "Too many recipients at once"); // 가스 제한
            
            uint256 totalAmount = 0;
            for (uint256 i = 0; i < _amounts.length; i++) {
                totalAmount += _amounts[i];
            }
            
            require(ctaToken.balanceOf(address(this)) >= totalAmount, "Insufficient contract balance");
            
            for (uint256 i = 0; i < _recipients.length; i++) {
                if (_recipients[i] != address(0) && _amounts[i] > 0) {
                    require(ctaToken.transfer(_recipients[i], _amounts[i]), "Token transfer failed");
                    
                    // 기록 업데이트
                    AirdropRecord memory record = AirdropRecord({
                        recipient: _recipients[i],
                        amount: _amounts[i],
                        rewardType: _rewardType,
                        timestamp: block.timestamp,
                        txHash: blockhash(block.number - 1)
                    });
                    
                    userAirdropHistory[_recipients[i]].push(record);
                    totalUserRewards[_recipients[i]] += _amounts[i];
                    totalAirdropped += _amounts[i];
                    
                    if (userAirdropHistory[_recipients[i]].length == 1) {
                        totalRecipients++;
                    }
                    
                    emit AirdropExecuted(_recipients[i], _amounts[i], _rewardType, block.timestamp);
                }
            }
        }
        
        /**
         * @dev 머클트리 기반 캠페인 생성
         * @param _name 캠페인 명
         * @param _totalAmount 총 에어드롭 수량
         * @param _merkleRoot 머클트리 루트
         * @param _duration 캠페인 지속 시간 (초)
         */
        function createCampaign(
            string memory _name,
            uint256 _totalAmount,
            bytes32 _merkleRoot,
            uint256 _duration
        ) external onlyAdmin {
            require(_totalAmount > 0, "Total amount must be greater than 0");
            require(_merkleRoot != bytes32(0), "Invalid merkle root");
            require(_duration > 0, "Duration must be greater than 0");
            
            currentCampaignId++;
            AirdropCampaign storage campaign = campaigns[currentCampaignId];
            campaign.name = _name;
            campaign.totalAmount = _totalAmount;
            campaign.distributedAmount = 0;
            campaign.startTime = block.timestamp;
            campaign.endTime = block.timestamp + _duration;
            campaign.merkleRoot = _merkleRoot;
            campaign.isActive = true;
            
            emit CampaignCreated(currentCampaignId, _name, _totalAmount, _merkleRoot);
        }
        
        /**
         * @dev 머클트리 증명을 통한 에어드롭 클레임
         * @param _campaignId 캠페인 ID
         * @param _amount 클레임할 수량
         * @param _merkleProof 머클 증명
         */
        function claimAirdrop(
            uint256 _campaignId,
            uint256 _amount,
            bytes32[] calldata _merkleProof
        ) external nonReentrant {
            AirdropCampaign storage campaign = campaigns[_campaignId];
            require(campaign.isActive, "Campaign not active");
            require(block.timestamp >= campaign.startTime, "Campaign not started");
            require(block.timestamp <= campaign.endTime, "Campaign ended");
            require(!campaign.hasClaimed[msg.sender], "Already claimed");
            require(_amount > 0, "Amount must be greater than 0");
            
            // 머클트리 검증
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender, _amount));
            require(
                MerkleProof.verify(_merkleProof, campaign.merkleRoot, leaf),
                "Invalid merkle proof"
            );
            
            require(
                campaign.distributedAmount + _amount <= campaign.totalAmount,
                "Campaign allocation exceeded"
            );
            
            // 클레임 처리
            campaign.hasClaimed[msg.sender] = true;
            campaign.distributedAmount += _amount;
            
            require(ctaToken.transfer(msg.sender, _amount), "Token transfer failed");
            
            // 기록 업데이트
            AirdropRecord memory record = AirdropRecord({
                recipient: msg.sender,
                amount: _amount,
                rewardType: "campaign",
                timestamp: block.timestamp,
                txHash: blockhash(block.number - 1)
            });
            
            userAirdropHistory[msg.sender].push(record);
            totalUserRewards[msg.sender] += _amount;
            totalAirdropped += _amount;
            
            if (userAirdropHistory[msg.sender].length == 1) {
                totalRecipients++;
            }
            emit AirdropExecuted(msg.sender, _amount, "campaign", block.timestamp);
            }
            
            /**
            * @dev 캠페인 비활성화
            * @param _campaignId 캠페인 ID
            */
            function deactivateCampaign(uint256 _campaignId) external onlyAdmin {
            campaigns[_campaignId].isActive = false;
            }
            
            /**
            * @dev 사용자 에어드롭 히스토리 조회
            * @param _user 사용자 주소
            * @return 에어드롭 기록 배열
            */
            function getUserAirdropHistory(address _user) external view returns (AirdropRecord[] memory) {
            return userAirdropHistory[_user];
            }
            
            /**
            * @dev 전체 통계 조회
            */
            function getGlobalStats() external view returns (
            uint256 _totalAirdropped,
            uint256 _totalRecipients,
            uint256 _contractBalance,
            uint256 _currentCampaignId
            ) {
            return (
            totalAirdropped,
            totalRecipients,
            ctaToken.balanceOf(address(this)),
            currentCampaignId
            );
            }
            
            /**
            * @dev 긴급 상황 시 토큰 회수 (소유자만)
            * @param _amount 회수할 수량
            */
            function emergencyWithdraw(uint256 _amount) external onlyOwner {
            require(_amount > 0, "Amount must be greater than 0");
            require(ctaToken.balanceOf(address(this)) >= _amount, "Insufficient balance");
            require(ctaToken.transfer(owner(), _amount), "Token transfer failed");
            }
            
            /**
            * @dev 컨트랙트 토큰 잔액 충전
            * @param _amount 충전할 수량
            */
            function depositTokens(uint256 _amount) external onlyAdmin {
            require(_amount > 0, "Amount must be greater than 0");
            require(
            ctaToken.transferFrom(msg.sender, address(this), _amount),
            "Token transfer failed"
            );
            }
            }
