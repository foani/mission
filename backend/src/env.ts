/**
 * 환경변수 관리 및 검증
 * CreataChain 기반 텔레그램 미션 게임용 환경설정
 * TypeScript 타입 안전성과 런타임 검증 포함
 */

import { config } from 'dotenv';
import { z } from 'zod';

// .env 파일 로드
config();

/**
 * 환경변수 스키마 정의 (Zod 기반 검증)
 * 모든 필수 환경변수와 선택적 환경변수 타입 정의
 */
const envSchema = z.object({
  // 기본 서버 설정
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
  HOST: z.string().default('0.0.0.0'),
  
  // 데이터베이스 설정
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  
  // JWT 및 보안 설정
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  
  // CreataChain 블록체인 설정
  CATENA_RPC_URL: z.string().url().default('https://cvm.node.creatachain.com'),
  CATENA_CHAIN_ID: z.string().transform(Number).pipe(z.number()).default('1000'),
  CATENA_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'CATENA_PRIVATE_KEY must be a valid private key'),
  
  // 에어드랍 및 보상 설정
  CTA_TOKEN_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'CTA_TOKEN_ADDRESS must be a valid Ethereum address'),
  MAX_AIRDROP_AMOUNT: z.string().transform(Number).pipe(z.number().positive()).default('1000'),
  
  // Redis 설정 (캐싱용 - 선택적)
  REDIS_URL: z.string().url().optional(),
  REDIS_PASSWORD: z.string().optional(),
  
  // 로깅 설정
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('pretty'),
  
  // CORS 설정
  CORS_ORIGINS: z.string().default('*'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'), // 15분
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),
  
  // 텔레그램 봇 설정 (향후 확장용)
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().url().optional(),

/**
 * 환경변수 타입 정의
 * Zod 스키마에서 추론된 TypeScript 타입
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * 환경변수 검증 및 파싱 함수
 * 서버 시작 시 호출되어 필수 환경변수 유무 확인
 */
function validateEnv(): EnvConfig {
  try {
    const parsed = envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
    
    // 개발환경에서만 환경변수 디버그 정보 출력
    if (parsed.NODE_ENV === 'development') {
      console.log('🔍 Development environment detected:');
      console.log('- Database:', parsed.DATABASE_URL.replace(/\/\/[^@]+@/, '//***:***@')); // 비밀번호 마스킹
      console.log('- Port:', parsed.PORT);
      console.log('- Catena RPC:', parsed.CATENA_RPC_URL);
      console.log('- Log Level:', parsed.LOG_LEVEL);
    }
    
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ Unexpected error during environment validation:', error);
    }
    
    console.error('\n📝 Please check your .env file and ensure all required variables are set.');
    console.error('Refer to .env.example for the complete list of required environment variables.\n');
    
    process.exit(1);
  }
}

/**
 * 검증된 환경변수 인스턴스
 * 애플리케이션 전체에서 사용할 수 있는 타입 안전한 환경변수
 */
export const env = validateEnv();

/**
 * 환경변수 체크 헬퍼 함수들
 */
export const envHelpers = {
  /**
   * 개발 환경 여부 확인
   */
  isDevelopment: () => env.NODE_ENV === 'development',
  
  /**
   * 프로덕션 환경 여부 확인
   */
  isProduction: () => env.NODE_ENV === 'production',
  
  /**
   * 테스트 환경 여부 확인
   */
  isTest: () => env.NODE_ENV === 'test',
  
  /**
   * Redis 사용 가능 여부 확인
   */
  hasRedis: () => Boolean(env.REDIS_URL),
  
  /**
   * 텔레그램 봇 설정 여부 확인
   */
  hasTelegramBot: () => Boolean(env.TELEGRAM_BOT_TOKEN),
  
  /**
   * CORS 오리진 배열로 내보내기
   */
  getCorsOrigins: () => {
    if (env.CORS_ORIGINS === '*') {
      return '*';
    }
    return env.CORS_ORIGINS.split(',').map(origin => origin.trim());
  },
  
  /**
   * 로그 레벨 숫자로 변환 (pino 등에서 사용)
   */
  getLogLevelNumber: () => {
    const levels = { error: 50, warn: 40, info: 30, debug: 20 };
    return levels[env.LOG_LEVEL] || 30;
  },
};

/**
 * 환경변수 상태 및 정보 출력 함수
 * 서버 시작 시 호출하여 환경 정보 확인
 */
export function printEnvInfo(): void {
  const info = [
    `🌍 Environment: ${env.NODE_ENV}`,
    `🔌 Server: ${env.HOST}:${env.PORT}`,
    `📊 Database: Connected`,
    `🔗 Blockchain: Catena (Chain ID: ${env.CATENA_CHAIN_ID})`,
    `📝 Logging: ${env.LOG_LEVEL} (${env.LOG_FORMAT})`,
    envHelpers.hasRedis() ? '✅ Redis: Enabled' : '❌ Redis: Disabled',
    envHelpers.hasTelegramBot() ? '✅ Telegram Bot: Configured' : '❌ Telegram Bot: Not configured',
  ];
  
  console.log('\n' + '━'.repeat(50));
  console.log('🚀 CreataChain Mission Game Backend');
  console.log('━'.repeat(50));
  info.forEach(line => console.log(line));
  console.log('━'.repeat(50) + '\n');
}

// 기본 익스포트
export default env;