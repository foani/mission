 /**
  * CreataChain Mission Game - 보상 설정 관리 라우트
  * 관리자가 보상 방식을 실시간으로 조정할 수 있는 API
  */
 
 import { FastifyInstance } from 'fastify';
 import { PrismaClient } from '@prisma/client';
 
 const prisma = new PrismaClient();
 
 // 보상 설정 인터페이스
 interface RewardSettingsInput {
   rewardType: 'immediate' | 'ranking' | 'daily' | 'weekly' | 'monthly';
   rankingTier?: 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze';
   rankStart?: number;
   rankEnd?: number;
   ctaAmount: number;
   bonusPercentage?: number;
   requirementScore?: number;
   requirementGames?: number;
   gameType?: 'binary' | 'derby' | 'darts' | 'all';
   description?: string;
   validUntil?: string;
   maxRecipients?: number;
 }
 
 export default async function rewardSettingsRoutes(app: FastifyInstance) {
   
   // 모든 보상 설정 조회
   app.get('/rewards/settings', async (req, res) => {
     try {
       const settings = await prisma.rewardSettings.findMany({
         where: { isActive: true },
         orderBy: [
           { rewardType: 'asc' },
           { rankStart: 'asc' }
         ]
       });
 
       return res.send({
         success: true,
         data: settings
       });
     } catch (error) {
       console.error('보상 설정 조회 오류:', error);
       return res.status(500).send({
         success: false,
         message: '보상 설정 조회에 실패했습니다.'
       });
     }
   });
 
   // 새로운 보상 설정 생성
   app.post('/rewards/settings', async (req, res) => {
     try {
       const input = req.body as RewardSettingsInput;
       
       // 입력값 검증
       if (!input.rewardType || !input.ctaAmount) {
         return res.status(400).send({
           success: false,
           message: 'rewardType과 ctaAmount는 필수 항목입니다.'
         });
       }
 
       const newSetting = await prisma.rewardSettings.create({
         data: {
           rewardType: input.rewardType,
           rankingTier: input.rankingTier,
           rankStart: input.rankStart,
           rankEnd: input.rankEnd,
           ctaAmount: input.ctaAmount,
           bonusPercentage: input.bonusPercentage,
           requirementScore: input.requirementScore,
           requirementGames: input.requirementGames,
           gameType: input.gameType,
           description: input.description,
           validUntil: input.validUntil ? new Date(input.validUntil) : null,
           maxRecipients: input.maxRecipients
         }
       });
 
       return res.send({
         success: true,
         data: newSetting,
         message: '보상 설정이 생성되었습니다.'
       });
     } catch (error) {
       console.error('보상 설정 생성 오류:', error);
       return res.status(500).send({
         success: false,
         message: '보상 설정 생성에 실패했습니다.'
       });
     }
   });
 
   // 기본 보상 설정 초기화
   app.post('/rewards/settings/init', async (req, res) => {
     try {
       // 기존 설정들을 비활성화
       await prisma.rewardSettings.updateMany({
         where: { isActive: true },
         data: { isActive: false }
       });
 
       // 기본 보상 설정들
       const defaultSettings = [
         {
           rewardType: 'immediate' as const,
           ctaAmount: 5,
           gameType: 'all' as const,
           description: '게임 완료 즉시 보상'
         },
         {
           rewardType: 'ranking' as const,
           rankingTier: 'diamond' as const,
           rankStart: 1,
           rankEnd: 1,
           ctaAmount: 5000,
           description: '1위 다이아몬드 보상'
         },
         {
           rewardType: 'ranking' as const,
           rankingTier: 'platinum' as const,
           rankStart: 2,
           rankEnd: 5,
           ctaAmount: 2500,
           description: '2-5위 플래티넘 보상'
         }
       ];
 
       const results = await Promise.all(
         defaultSettings.map(setting => 
           prisma.rewardSettings.create({ data: setting })
         )
       );
 
       return res.send({
         success: true,
         data: results,
         message: '기본 보상 설정이 초기화되었습니다.'
       });
     } catch (error) {
       console.error('보상 설정 초기화 오류:', error);
       return res.status(500).send({
         success: false,
         message: '보상 설정 초기화에 실패했습니다.'
       });
     }
   });
 }