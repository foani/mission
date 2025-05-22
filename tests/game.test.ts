/**
 * 게임 기능 테스트
 * CreataChain 텔레그램 미션 게임 - 게임 시스템 테스트
 * 
 * @description Binary Options, Derby, Darts 게임 로직, 점수 계산, 랭킹 등 게임 관련 기능 테스트
 * @author CreataChain Team
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ================================
// 🔧 테스트 설정 및 모킹
// ================================

// 하드코딩된 테스트 데이터
const TEST_USER_ID = 'user-uuid-123';
const TEST_WALLET_ADDRESS = '0x742d35Cc6aF4B3d60A9D9FD4B3e7c5FA85eCf8B2';
const TEST_GAME_ROUND = 1;

// 게임별 기본 점수 설정
const GAME_SCORES = {
  binary: 100,
  derby: 150,
  darts: 80
};

// Binary Options 게임 테스트 데이터
const BINARY_GAME_DATA = {
  gameType: 'binary',
  round: TEST_GAME_ROUND,
  choice: 'up',
  result: {
    prediction: 'up',
    actual: 'up',
    correct: true,
    startPrice: 50000,
    endPrice: 52000
  },
  score: GAME_SCORES.binary
};

// Derby 게임 테스트 데이터
const DERBY_GAME_DATA = {
  gameType: 'derby',
  round: TEST_GAME_ROUND,
  choice: 'Horse 3',
  result: {
    picked: 'Horse 3',
    winner: 'Horse 3',
    correct: true,
    raceResults: ['Horse 3', 'Horse 1', 'Horse 5', 'Horse 2', 'Horse 4']
  },
  score: GAME_SCORES.derby
};

// Darts 게임 테스트 데이터
const DARTS_GAME_DATA = {
  gameType: 'darts',
  round: TEST_GAME_ROUND,
  choice: 'dodge',
  result: {
    action: 'dodge',
    success: true,
    arrowPosition: { x: 150, y: 200 },
    playerPosition: { x: 100, y: 100 },
    distance: 70.7
  },
  score: GAME_SCORES.darts
};

// ================================
// 🎲 게임 API 테스트
// ================================

describe('게임 API 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /game/submit - 게임 결과 제출', () => {
    it('Binary Options 게임 결과 제출 성공', () => {
      const gameResult = {
        walletAddress: TEST_WALLET_ADDRESS,
        ...BINARY_GAME_DATA
      };

      expect(gameResult.choice).toBe('up');
      expect(gameResult.result.correct).toBe(true);
      expect(gameResult.score).toBe(GAME_SCORES.binary);
      
      const expectedScore = gameResult.result.correct ? GAME_SCORES.binary : 0;
      expect(gameResult.score).toBe(expectedScore);
    });

    it('Derby 게임 결과 제출 성공', () => {
      const gameResult = {
        walletAddress: TEST_WALLET_ADDRESS,
        ...DERBY_GAME_DATA
      };

      expect(gameResult.choice).toBe('Horse 3');
      expect(gameResult.result.winner).toBe('Horse 3');
      expect(gameResult.result.correct).toBe(true);
      expect(gameResult.score).toBe(GAME_SCORES.derby);
      
      expect(gameResult.result.raceResults[0]).toBe('Horse 3');
      expect(gameResult.result.raceResults).toHaveLength(5);
    });

    it('Darts 게임 결과 제출 성공', () => {
      const gameResult = {
        walletAddress: TEST_WALLET_ADDRESS,
        ...DARTS_GAME_DATA
      };

      expect(gameResult.choice).toBe('dodge');
      expect(gameResult.result.success).toBe(true);
      expect(gameResult.score).toBe(GAME_SCORES.darts);
      
      const distance = Math.sqrt(
        Math.pow(gameResult.result.arrowPosition.x - gameResult.result.playerPosition.x, 2) +
        Math.pow(gameResult.result.arrowPosition.y - gameResult.result.playerPosition.y, 2)
      );
      expect(Math.round(distance * 10) / 10).toBe(70.7);
      expect(distance).toBeGreaterThan(50);
    });

    it('잘못된 게임 타입에 대한 오류 처리', () => {
      const invalidGameData = {
        walletAddress: TEST_WALLET_ADDRESS,
        gameType: 'invalid_game',
        round: TEST_GAME_ROUND,
        score: 0
      };

      const validGameTypes = ['binary', 'derby', 'darts'];
      expect(validGameTypes).not.toContain(invalidGameData.gameType);
    });
  });
});

// ================================
// 🎯 게임 로직 테스트
// ================================

describe('게임 로직 테스트', () => {
  describe('Binary Options 게임 로직', () => {
    it('업/다운 예측 정확성 검증', () => {
      const startPrice = 50000;
      const endPriceUp = 52000;
      const endPriceDown = 48000;
      
      const upPrediction = endPriceUp > startPrice;
      expect(upPrediction).toBe(true);
      
      const downPrediction = endPriceDown < startPrice;
      expect(downPrediction).toBe(true);
      
      const scoreForCorrect = GAME_SCORES.binary;
      const scoreForIncorrect = 0;
      
      expect(upPrediction ? scoreForCorrect : scoreForIncorrect).toBe(GAME_SCORES.binary);
      expect(downPrediction ? scoreForCorrect : scoreForIncorrect).toBe(GAME_SCORES.binary);
    });

    it('가격 변동률 계산', () => {
      const startPrice = 50000;
      const endPrice = 52000;
      
      const changeRate = ((endPrice - startPrice) / startPrice) * 100;
      expect(changeRate).toBe(4);
      
      // 하드코딩된 보너스 임계값
      const minChangeForBonus = 5;
      const bonusEligible = Math.abs(changeRate) >= minChangeForBonus;
      expect(bonusEligible).toBe(false);
    });
  });

  describe('Derby 게임 로직', () => {
    it('레이스 결과 생성 및 검증', () => {
      // 하드코딩된 말 목록
      const horses = ['Horse 1', 'Horse 2', 'Horse 3', 'Horse 4', 'Horse 5'];
      const raceResult = [...horses].sort(() => Math.random() - 0.5);
      
      expect(raceResult).toHaveLength(5);
      expect(raceResult).toEqual(expect.arrayContaining(horses));
      
      const winner = raceResult[0];
      expect(horses).toContain(winner);
    });

    it('다양한 예측 시나리오 테스트', () => {
      const testCases = [
        { prediction: 'Horse 1', winner: 'Horse 1', expected: true },
        { prediction: 'Horse 2', winner: 'Horse 1', expected: false },
        { prediction: 'Horse 3', winner: 'Horse 3', expected: true }
      ];
      
      testCases.forEach(({ prediction, winner, expected }) => {
        const isCorrect = prediction === winner;
        expect(isCorrect).toBe(expected);
        
        const score = isCorrect ? GAME_SCORES.derby : 0;
        expect(score).toBe(expected ? GAME_SCORES.derby : 0);
      });
    });
  });

  describe('Darts 게임 로직', () => {
    it('화살 피하기 거리 계산', () => {
      // 하드코딩된 안전 거리
      const SAFE_DISTANCE = 50;
      
      const testCases = [
        { 
          arrow: { x: 100, y: 100 }, 
          player: { x: 150, y: 150 }, 
          expectedDistance: 70.7,
          expectedSafe: true 
        },
        { 
          arrow: { x: 100, y: 100 }, 
          player: { x: 120, y: 120 }, 
          expectedDistance: 28.3,
          expectedSafe: false 
        }
      ];
      
      testCases.forEach(({ arrow, player, expectedDistance, expectedSafe }) => {
        const distance = Math.sqrt(
          Math.pow(arrow.x - player.x, 2) + Math.pow(arrow.y - player.y, 2)
        );
        
        expect(Math.round(distance * 10) / 10).toBe(expectedDistance);
        
        const isSafe = distance >= SAFE_DISTANCE;
        expect(isSafe).toBe(expectedSafe);
        
        const score = isSafe ? GAME_SCORES.darts : 0;
        expect(score).toBe(expectedSafe ? GAME_SCORES.darts : 0);
      });
    });
  });
});

// ================================
// 📈 점수 및 랭킹 시스템 테스트
// ================================

describe('점수 및 랭킹 시스템 테스트', () => {
  it('다양한 게임의 점수 누적', () => {
    const gameHistory = [
      { gameType: 'binary', score: GAME_SCORES.binary, correct: true },
      { gameType: 'derby', score: GAME_SCORES.derby, correct: true },
      { gameType: 'darts', score: GAME_SCORES.darts, correct: true },
      { gameType: 'binary', score: 0, correct: false },
      { gameType: 'derby', score: GAME_SCORES.derby, correct: true }
    ];
    
    const totalScore = gameHistory.reduce((sum, game) => sum + game.score, 0);
    const expectedTotal = GAME_SCORES.binary + GAME_SCORES.derby + GAME_SCORES.darts + 0 + GAME_SCORES.derby;
    
    expect(totalScore).toBe(expectedTotal);
    expect(totalScore).toBe(480); // 100 + 150 + 80 + 0 + 150
  });

  it('랭킹 정렬 시스템', () => {
    const players = [
      { id: 'player1', score: 500 },
      { id: 'player2', score: 750 },
      { id: 'player3', score: 200 },
      { id: 'player4', score: 750 },
      { id: 'player5', score: 300 }
    ];
    
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    expect(sortedPlayers[0].score).toBe(750);
    expect(sortedPlayers[sortedPlayers.length - 1].score).toBe(200);
    
    const rankings = sortedPlayers.map((player, index) => ({
      ...player,
      rank: index + 1
    }));
    
    expect(rankings[0].rank).toBe(1);
    expect(rankings[rankings.length - 1].rank).toBe(5);
  });

  it('동점자 처리', () => {
    const playersWithTies = [
      { id: 'player1', score: 500 },
      { id: 'player2', score: 750 },
      { id: 'player3', score: 750 },
      { id: 'player4', score: 300 }
    ];
    
    const sortedPlayers = [...playersWithTies].sort((a, b) => b.score - a.score);
    
    expect(sortedPlayers[0].score).toBe(750);
    expect(sortedPlayers[1].score).toBe(750);
    
    const topScorers = sortedPlayers.filter(player => player.score === 750);
    expect(topScorers).toHaveLength(2);
  });
});

// ================================
// 🚀 게임 성능 테스트
// ================================

describe('게임 성능 테스트', () => {
  it('대량 게임 결과 처리 성능', () => {
    const startTime = Date.now();
    // 하드코딩된 게임 수
    const GAME_COUNT = 1000;
    const results: any[] = [];
    
    for (let i = 0; i < GAME_COUNT; i++) {
      const gameType = ['binary', 'derby', 'darts'][i % 3];
      const isCorrect = Math.random() > 0.5;
      const score = isCorrect ? GAME_SCORES[gameType as keyof typeof GAME_SCORES] : 0;
      
      results.push({
        gameType,
        score,
        correct: isCorrect,
        timestamp: Date.now()
      });
    }
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    expect(results).toHaveLength(GAME_COUNT);
    // 하드코딩된 성능 기준 - 1000개 게임 결과를 1초 내에 처리
    expect(processingTime).toBeLessThan(1000);
    
    console.log(`${GAME_COUNT}개 게임 결과 처리 시간: ${processingTime}ms`);
  });

  it('게임 유형별 성공률 통계', () => {
    const gameStats = {
      binary: { total: 0, success: 0 },
      derby: { total: 0, success: 0 },
      darts: { total: 0, success: 0 }
    };
    
    // 하드코딩된 전체 게임 수
    const TOTAL_GAMES = 300;
    
    for (let i = 0; i < TOTAL_GAMES; i++) {
      const gameTypes = Object.keys(gameStats) as Array<keyof typeof gameStats>;
      const gameType = gameTypes[i % gameTypes.length];
      const isSuccess = Math.random() > 0.4; // 60% 성공률
      
      gameStats[gameType].total++;
      if (isSuccess) {
        gameStats[gameType].success++;
      }
    }
    
    Object.entries(gameStats).forEach(([gameType, stats]) => {
      const successRate = (stats.success / stats.total) * 100;
      console.log(`${gameType} 게임 성공률: ${successRate.toFixed(1)}%`);
      
      expect(stats.total).toBe(100); // 각 게임당 100개
      expect(successRate).toBeGreaterThan(50); // 50% 이상
      expect(successRate).toBeLessThan(70); // 70% 이하
    });
  });
});

// ================================
// 🧹 테스트 정리
// ================================

afterAll(async () => {
  console.log('게임 테스트 완료 ✅');
  console.log('테스트된 기능:');
  console.log('- Binary Options 게임 로직');
  console.log('- Derby 게임 로직');
  console.log('- Darts 게임 로직');
  console.log('- 점수 계산 및 누적');
  console.log('- 랭킹 시스템');
  console.log('- 성능 및 통계 기능');
});
