import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * CreataChain 게임 미니앱 데이터베이스 시드 데이터
 * 개발 및 테스트 환경을 위한 초기 데이터 생성
 */
async function main() {
  console.log('🌱 시드 데이터 생성을 시작합니다...');

  // 1. 어드민 사용자 생성
  console.log('👤 어드민 사용자 생성 중...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@creatachain.com' },
    update: {},
    create: {
      email: 'admin@creatachain.com',
      passwordHash: adminPassword,
      role: 'admin',
      isActive: true,
    },
  });
  
  console.log('✅ 어드민 사용자 생성 완료:', admin.email);

  // 2. 시스템 설정 생성
  console.log('⚙️ 시스템 설정 생성 중...');
  
  const systemConfigs = [
    {
      key: 'game_binary_settings',
      value: {
        timeLimit: 60, // 60초
        baseScore: 100,
        streakBonus: { 3: 50, 5: 100, 10: 200 },
        supportedPairs: ['BTC/USD', 'ETH/USD', 'CTA/USD']
      },
      category: 'game',
      description: 'Binary Options 게임 설정',
    },
    {
      key: 'game_derby_settings', 
      value: {
        timeLimit: 30, // 30초
        baseScore: 150,
        streakBonus: { 2: 75, 3: 150, 5: 300 },
        horses: [
          { name: 'Thunder', speedVariation: 0.2 },
          { name: 'Sleepy', speedVariation: 0.1 },
          { name: 'Lucky', speedVariation: 0.3 },
          { name: 'Steady', speedVariation: 0.05 },
          { name: 'Wild', speedVariation: 0.5 }
        ]
      },
      category: 'game',
      description: 'Lazy Derby 게임 설정',
    },
    {
      key: 'game_darts_settings',
      value: {
        timeLimit: 45, // 45초
        baseScore: 10, // 초당 10점
        nearMissBonus: 20,
        survivalBonus: 300,
        comboMultiplier: { 2: 1.2, 5: 1.5, 10: 2.0 },
        difficulties: {
          easy: { speedMultiplier: 0.5, scoreMultiplier: 0.8 },
          normal: { speedMultiplier: 1.0, scoreMultiplier: 1.0 },
          hard: { speedMultiplier: 1.5, scoreMultiplier: 1.5 },
          nightmare: { speedMultiplier: 2.0, scoreMultiplier: 2.0 }
        }
      },
      category: 'game',
      description: 'Reverse Darts 게임 설정',
    },
    {
      key: 'ranking_rewards',
      value: {
        monthly: {
          diamond: { percentage: 1, cta: 1000, nft: 'legendary' },
          platinum: { percentage: 5, cta: 500, nft: 'epic' },
          gold: { percentage: 10, cta: 200, nft: 'rare' },
          silver: { percentage: 25, cta: 100, nft: null },
          bronze: { percentage: 50, cta: 50, nft: null }
        }
      },
      category: 'reward',
      description: '랭킹별 보상 설정',
    },
    {
      key: 'daily_missions',
      value: {
        binary: { gamesRequired: 5, bonus: 50 },
        derby: { gamesRequired: 3, bonus: 75 },
        darts: { gamesRequired: 3, bonus: 100 },
        accuracy: { threshold: 0.7, bonus: 100 },
        consecutive: { days: 7, bonus: 300 }
      },
      category: 'reward',
      description: '일일 미션 설정',
    }
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }
  
  console.log('✅ 시스템 설정 생성 완료');

  // 3. 테스트용 사용자 데이터 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('👥 테스트 사용자 생성 중...');
    
    const testUsers = [
      {
        walletAddress: '0x1111111111111111111111111111111111111111',
        telegramId: '123456789',
        language: 'ko',
        isWalletVerified: true,
        isWalletInstalled: true,
        score: 2500,
      },
      {
        walletAddress: '0x2222222222222222222222222222222222222222',
        telegramId: '987654321',
        language: 'en',
        isWalletVerified: true,
        isWalletInstalled: true,
        score: 1800,
      },
      {
        walletAddress: '0x3333333333333333333333333333333333333333',
        telegramId: '456789123',
        language: 'vi',
        isWalletVerified: true,
        isWalletInstalled: false,
        score: 3200,
      },
    ];

    for (const userData of testUsers) {
      await prisma.user.upsert({
        where: { walletAddress: userData.walletAddress },
        update: {},
        create: userData,
      });
    }
    
    console.log('✅ 테스트 사용자 생성 완료');
  }

  console.log('🎉 시드 데이터 생성이 완료되었습니다!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 시드 데이터 생성 중 오류 발생:', e);
    await prisma.$disconnect();
    process.exit(1);
  });