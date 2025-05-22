 /**
  * CreataChain 텔레그램 미션 게임 백엔드 서버
  * Fastify 기반 REST API 서버
  */
 
 import Fastify, { FastifyInstance } from 'fastify';
 import dotenv from 'dotenv';
 import cors from '@fastify/cors';
 import { PrismaClient } from '@prisma/client';
 
 // 환경변수 로드
 dotenv.config();
 
 // Prisma 클라이언트 초기화
 export const prisma = new PrismaClient({
   log: ['query', 'info', 'warn', 'error'],
 });
 
 // Fastify 앱 인스턴스 생성
 const app: FastifyInstance = Fastify({
   logger: {
     level: 'info',
     prettyPrint: process.env.NODE_ENV !== 'production'
   }
 });
 
 // CORS 설정
 app.register(cors, {
   // 하드코딩된 CORS 설정
   origin: true,
   credentials: true
 });
 
 // 라우트 등록
 app.register(async function(fastify) {
   // 헬스체크 엔드포인트
   fastify.get('/health', async (request, reply) => {
     return { 
       status: 'ok', 
       timestamp: new Date().toISOString(),
       service: 'CreataChain Mission Game API'
     };
   });
 
   // API 루트 정보
   fastify.get('/', async (request, reply) => {
     return {
       name: 'CreataChain Mission Game API',
       version: '1.0.0',
       description: 'Telegram Mini App for CreataChain Mission Games',
       endpoints: {
         auth: '/api/auth/*',
         game: '/api/game/*',
         ranking: '/api/ranking/*'
       }
     };
   });
 });
 
 // API 라우트 등록
 app.register(async function(fastify) {
   // 인증 관련 라우트
   await fastify.register(
     async function(authFastify) {
       const { default: authRoutes } = await import('./routes/auth.routes.js');
       await authRoutes(authFastify);
     },
     { prefix: '/api/auth' }
   );
 
   // 게임 관련 라우트
   await fastify.register(
     async function(gameFastify) {
       const { default: gameRoutes } = await import('./routes/game.routes.js');
       await gameRoutes(gameFastify);
     },
     { prefix: '/api/game' }
   );
 
   // 랭킹 관련 라우트
   await fastify.register(
     async function(rankingFastify) {
       const { default: rankingRoutes } = await import('./routes/ranking.routes.js');
       await rankingRoutes(rankingFastify);
     },
     { prefix: '/api/ranking' }
   );
   
   // 에어드랍 관련 라우트
   await fastify.register(
     async function(airdropFastify) {
       const { default: airdropRoutes } = await import('./routes/airdrop.routes.js');
       await airdropRoutes(airdropFastify);
     },
     { prefix: '/api/airdrop' }
   );
   
   // 게임 설정 관리 라우트
   await fastify.register(
     async function(gameSettingsFastify) {
       const { default: gameSettingsRoutes } = await import('./routes/gameSettings.routes.js');
       await gameSettingsRoutes(gameSettingsFastify);
     },
     { prefix: '/api/game' }
   );
   
   // 보상 설정 관리 라우트
   await fastify.register(
     async function(rewardSettingsFastify) {
       const { default: rewardSettingsRoutes } = await import('./routes/rewardSettings.routes.js');
       await rewardSettingsRoutes(rewardSettingsFastify);
     },
     { prefix: '/api' }
   );
   });
 
 // 전역 에러 핸들러
 app.setErrorHandler(async (error, request, reply) => {
   app.log.error(error);
   
   const isDevelopment = process.env.NODE_ENV !== 'production';
   
   return reply.status(500).send({
     error: 'Internal Server Error',
     message: isDevelopment ? error.message : 'Something went wrong',
     ...(isDevelopment && { stack: error.stack })
   });
 });
 
 // 404 핸들러
 app.setNotFoundHandler(async (request, reply) => {
   return reply.status(404).send({
     error: 'Not Found',
     message: `Route ${request.method} ${request.url} not found`
   });
 });
 
 // 서버 시작 함수
 const start = async (): Promise<void> => {
   try {
     // 데이터베이스 연결 테스트
     await prisma.$connect();
     app.log.info('✅ Database connected successfully');
     
     // 서버 포트 설정
     const port = Number(process.env.PORT) || 3000;
     const host = process.env.HOST || '0.0.0.0';
     
     await app.listen({ port, host });
     app.log.info(`🚀 CreataChain Mission Game API Server running on http://${host}:${port}`);
     
   } catch (err) {
     app.log.error('❌ Server startup failed:', err);
     process.exit(1);
   }
 };
 
 // Graceful shutdown 처리
 process.on('SIGINT', async () => {
   app.log.info('🛑 Shutting down gracefully...');
   try {
     await prisma.$disconnect();
     await app.close();
     process.exit(0);
   } catch (err) {
     app.log.error('❌ Error during shutdown:', err);
     process.exit(1);
   }
 });
 
 // 개발 모드에서만 서버 자동 시작
 if (require.main === module) {
   start();
 }
 
 export default app;
