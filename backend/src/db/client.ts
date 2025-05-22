/**
 * Prisma 클라이언트 설정 및 초기화
 * CreataChain 기반 텔레그램 미션 게임용 데이터베이스 연결
 */

import { PrismaClient } from '@prisma/client';
import { env } from '../env';

/**
 * Prisma 클라이언트 싱글톤 인스턴스
 * 개발환경에서는 글로벌 객체에 저장하여 Hot Reload 시 재연결 방지
 * 프로덕션에서는 새 인스턴스 생성
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma 클라이언트 생성 함수
 * 로그 레벨과 에러 포맷 설정 포함
 */
function createPrismaClient() {
  return new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event', 
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  errorFormat: 'pretty',
  });

}

/**
 * 메인 Prisma 클라이언트 인스턴스
 * 개발환경에서는 전역 변수 재사용, 프로덕션에서는 새로 생성
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 개발환경에서만 전역 변수에 저장
if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Prisma 클라이언트 이벤트 리스너 설정
 * 쿼리 로깅 및 에러 처리
 */
prisma.$on('query', (e) => {
  if (env.NODE_ENV === 'development') {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
  }
});

prisma.$on('error', (e) => {
  console.error('Prisma Error:', e);
});

prisma.$on('info', (e) => {
  if (env.NODE_ENV === 'development') {
    console.info('Prisma Info:', e.message);
  }
});

prisma.$on('warn', (e) => {
  console.warn('Prisma Warning:', e.message);
});

/**
 * 데이터베이스 연결 테스트 함수
 * 서버 시작시 DB 연결 상태 확인용
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * 데이터베이스 연결 종료 함수
 * 서버 종료시 깔끔한 연결 해제용
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✅ Database connection closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}

/**
 * 데이터베이스 헬스체크 함수
 * 서버 상태 확인 API에서 사용
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // 간단한 쿼리로 DB 상태 확인
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    
    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
/**
 * 트랜잭션 헬퍼 함수
 * 복잡한 비즈니스 로직에서 트랜잭션 사용을 간소화
 */
export async function executeTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback);
}

// 기본 export
export default prisma;
