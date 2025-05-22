 /**
  * CreataChain Mission Game Backend
  * 게임 설정 관리 API 라우트
  * 관리자가 게임 시간 등 설정을 조정할 수 있는 API
  */
 
 import { FastifyInstance } from 'fastify';
 import { PrismaClient } from '@prisma/client';
 
 const prisma = new PrismaClient();
 
 export default async function gameSettingsRoutes(app: FastifyInstance) {
   // 모든 게임 설정 조회
   app.get('/settings', async (request, reply) => {
     try {
       const settings = await prisma.gameSettings.findMany({
         where: { isActive: true },
         orderBy: { gameType: 'asc' }
       });
       
       return reply.send({
         success: true,
         data: settings
       });
     } catch (error) {
       console.error('Error fetching game settings:', error);
       return reply.status(500).send({
         success: false,
         message: 'Failed to fetch game settings'
       });
     }
   
     // 특정 게임 설정 조회
     app.get('/settings/:gameType', async (request, reply) => {
       try {
         const { gameType } = request.params as { gameType: string };
         
         const settings = await prisma.gameSettings.findUnique({
           where: { gameType }
         });
         
         if (!settings) {
           return reply.status(404).send({
             success: false,
             message: 'Game settings not found'
           });
         }
         
         return reply.send({
           success: true,
           data: settings
         });
       } catch (error) {
         console.error('Error fetching game settings:', error);
         return reply.status(500).send({
           success: false,
           message: 'Failed to fetch game settings'
         });
       
         // 게임 설정 업데이트 (관리자 전용)
         app.put('/settings/:gameType', {
           preHandler: async (request, reply) => {
             // TODO: JWT 인증 및 관리자 권한 확인
             // 현재는 간단한 헤더 검증만 수행
             const authHeader = request.headers.authorization;
             if (!authHeader || !authHeader.startsWith('Bearer ')) {
               return reply.status(401).send({
                 success: false,
                 message: 'Unauthorized - Admin access required'
               });
             }
           }
         }, async (request, reply) => {
           try {
             const { gameType } = request.params as { gameType: string };
             const updateData = request.body as {
               totalRounds?: number;
               choiceTimeSeconds?: number;
               resultDisplaySeconds?: number;
               pointsPerWin?: number;
               pointsPerLoss?: number;
               isActive?: boolean;
             };
             
             // 입력값 검증
             if (updateData.totalRounds && (updateData.totalRounds < 1 || updateData.totalRounds > 10)) {
               return reply.status(400).send({
                 success: false,
                 message: 'Total rounds must be between 1 and 10'
               });
             }
             
             if (updateData.choiceTimeSeconds && (updateData.choiceTimeSeconds < 5 || updateData.choiceTimeSeconds > 60)) {
               return reply.status(400).send({
                 success: false,
                 message: 'Choice time must be between 5 and 60 seconds'
               });
             }
             
             if (updateData.resultDisplaySeconds && (updateData.resultDisplaySeconds < 1 || updateData.resultDisplaySeconds > 10)) {
               return reply.status(400).send({
                 success: false,
                 message: 'Result display time must be between 1 and 10 seconds'
               });
             }
             
             const updatedSettings = await prisma.gameSettings.upsert({
               where: { gameType },
               create: {
                 gameType,
                 totalRounds: updateData.totalRounds || 3,
                 choiceTimeSeconds: updateData.choiceTimeSeconds || 10,
                 resultDisplaySeconds: updateData.resultDisplaySeconds || 3,
                 pointsPerWin: updateData.pointsPerWin || 100,
                 pointsPerLoss: updateData.pointsPerLoss || 0,
                 isActive: updateData.isActive !== undefined ? updateData.isActive : true
               },
               update: {
                 ...updateData,
                 updatedAt: new Date()
               }
             });
             
             return reply.send({
               success: true,
               data: updatedSettings,
               message: 'Game settings updated successfully'
             });
           } catch (error) {
             console.error('Error updating game settings:', error);
             return reply.status(500).send({
               success: false,
               message: 'Failed to update game settings'
             });
           
             // 게임 설정 초기화 (관리자 전용)
             app.post('/settings/init', {
               preHandler: async (request, reply) => {
                 const authHeader = request.headers.authorization;
                 if (!authHeader || !authHeader.startsWith('Bearer ')) {
                   return reply.status(401).send({
                     success: false,
                     message: 'Unauthorized - Admin access required'
                   });
                 }
               }
             }, async (request, reply) => {
               try {
                 // 기본 게임 설정 데이터
                 const defaultSettings = [
                   {
                     gameType: 'binary',
                     totalRounds: 3,
                     choiceTimeSeconds: 10,
                     resultDisplaySeconds: 3,
                     pointsPerWin: 100,
                     pointsPerLoss: 0
                   },
                   {
                     gameType: 'derby',
                     totalRounds: 1,
                     choiceTimeSeconds: 30,
                     resultDisplaySeconds: 5,
                     pointsPerWin: 150,
                     pointsPerLoss: 0
                   },
                   {
                     gameType: 'darts',
                     totalRounds: 5,
                     choiceTimeSeconds: 15,
                     resultDisplaySeconds: 3,
                     pointsPerWin: 50,
                     pointsPerLoss: 0
                   }
                 ];
                 
                 // 각 게임별로 upsert 수행
                 const results = [];
                 for (const setting of defaultSettings) {
                   const result = await prisma.gameSettings.upsert({
                     where: { gameType: setting.gameType },
                     create: setting,
                     update: {} // 이미 존재하면 업데이트하지 않음
                   });
                   results.push(result);
                 }
                 
                 return reply.send({
                   success: true,
                   data: results,
                   message: 'Game settings initialized successfully'
                 });
               } catch (error) {
                 console.error('Error initializing game settings:', error);
                 return reply.status(500).send({
                   success: false,
                   message: 'Failed to initialize game settings'
                 });
               }
             });
             }