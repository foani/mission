 /**
  * derbySettings.routes.ts - Derby 게임 설정 API 라우트
  * 관리자가 Derby 게임 설정을 관리할 수 있는 API
  */
 
 import { FastifyInstance } from 'fastify';
 import { prisma } from '../db/client';
 
 interface DerbyGameSettings {
   id: string;
   raceDuration: number;
   countdownTime: number;
   winScore: number;
   loseScore: number;
   horses: {
     id: number;
     name: string;
     color: string;
     emoji: string;
     baseSpeed: number;
     lane: number;
   }[];
   isActive: boolean;
 }
 
 // 하드코딩된 기본 설정
 const DEFAULT_DERBY_SETTINGS: DerbyGameSettings = {
   id: 'derby_default',
   raceDuration: 15000,
   countdownTime: 3,
   winScore: 100,
   loseScore: 0,
   horses: [
     { id: 1, name: 'Thunder', color: '#FF6B6B', emoji: '🐎', baseSpeed: 0.8, lane: 1 },
     { id: 2, name: 'Lightning', color: '#4ECDC4', emoji: '🦄', baseSpeed: 0.6, lane: 2 },
     { id: 3, name: 'Storm', color: '#45B7D1', emoji: '🐴', baseSpeed: 0.4, lane: 3 },
     { id: 4, name: 'Blaze', color: '#96CEB4', emoji: '🎠', baseSpeed: 0.7, lane: 4 },
     { id: 5, name: 'Flash', color: '#FECA57', emoji: '🦓', baseSpeed: 0.5, lane: 5 }
   ],
   isActive: true
 };
 
 export default async function derbySettingsRoutes(app: FastifyInstance) {
   // Derby 게임 설정 조회
   app.get('/game/settings/derby', async (req, res) => {
     try {
       const settings = await prisma.gameSettings.findFirst({
         where: {
           gameType: 'derby'
         }
       });
 
       if (!settings) {
         // 설정이 없으면 기본 설정 반환
         return res.send(DEFAULT_DERBY_SETTINGS);
       }
 
       // DB에서 가져온 설정을 클라이언트 형식으로 변환
       const clientSettings: DerbyGameSettings = {
         id: settings.id,
         raceDuration: settings.raceDuration || DEFAULT_DERBY_SETTINGS.raceDuration,
         countdownTime: settings.countdownTime || DEFAULT_DERBY_SETTINGS.countdownTime,
         winScore: settings.winScore || DEFAULT_DERBY_SETTINGS.winScore,
         loseScore: settings.loseScore || DEFAULT_DERBY_SETTINGS.loseScore,
         horses: settings.horses as any || DEFAULT_DERBY_SETTINGS.horses,
         isActive: settings.isActive
       };
 
       return res.send(clientSettings);
     } catch (error) {
       console.error('Derby 설정 조회 오류:', error);
       return res.status(500).send({ 
         error: 'Derby 설정을 가져오는데 실패했습니다.' 
       });
     }
   });
 
   // Derby 게임 설정 업데이트 (관리자만)
   app.put('/game/settings/derby', async (req, res) => {
     try {
       const newSettings = req.body as DerbyGameSettings;
       
       // 입력 유효성 검사
       if (!newSettings.id || !Array.isArray(newSettings.horses)) {
         return res.status(400).send({ 
           error: '잘못된 설정 데이터입니다.' 
         });
       }
 
       // 말 데이터 유효성 검사
       for (const horse of newSettings.horses) {
         if (!horse.name || !horse.emoji || !horse.color || 
             horse.baseSpeed < 0.1 || horse.baseSpeed > 1.0) {
           return res.status(400).send({ 
             error: '말 설정 데이터가 잘못되었습니다.' 
           });
         }
       }
 
       // 기존 설정 업데이트 또는 새로 생성
       const updatedSettings = await prisma.gameSettings.upsert({
         where: {
           gameType: 'derby'
         },
         update: {
           raceDuration: newSettings.raceDuration,
           countdownTime: newSettings.countdownTime,
           winScore: newSettings.winScore,
           loseScore: newSettings.loseScore,
           horses: newSettings.horses as any,
           isActive: newSettings.isActive,
           updatedAt: new Date()
         },
         create: {
           gameType: 'derby',
           raceDuration: newSettings.raceDuration,
           countdownTime: newSettings.countdownTime,
           winScore: newSettings.winScore,
           loseScore: newSettings.loseScore,
           horses: newSettings.horses as any,
           isActive: newSettings.isActive
         }
       });
 
       console.log('Derby 설정 업데이트 성공:', updatedSettings.id);
       
       return res.send({ 
         success: true, 
         message: 'Derby 게임 설정이 성공적으로 업데이트되었습니다.',
         settings: updatedSettings
       });
     } catch (error) {
       console.error('Derby 설정 업데이트 오류:', error);
       return res.status(500).send({ 
         error: 'Derby 설정 업데이트에 실패했습니다.' 
       });
     }
   });
 
   // Derby 게임 설정 초기화 (관리자만)
   app.post('/game/settings/derby/reset', async (req, res) => {
     try {
       const resetSettings = await prisma.gameSettings.upsert({
         where: {
           gameType: 'derby'
         },
         update: {
           raceDuration: DEFAULT_DERBY_SETTINGS.raceDuration,
           countdownTime: DEFAULT_DERBY_SETTINGS.countdownTime,
           winScore: DEFAULT_DERBY_SETTINGS.winScore,
           loseScore: DEFAULT_DERBY_SETTINGS.loseScore,
           horses: DEFAULT_DERBY_SETTINGS.horses as any,
           isActive: DEFAULT_DERBY_SETTINGS.isActive,
           updatedAt: new Date()
         },
         create: {
           gameType: 'derby',
           raceDuration: DEFAULT_DERBY_SETTINGS.raceDuration,
           countdownTime: DEFAULT_DERBY_SETTINGS.countdownTime,
           winScore: DEFAULT_DERBY_SETTINGS.winScore,
           loseScore: DEFAULT_DERBY_SETTINGS.loseScore,
           horses: DEFAULT_DERBY_SETTINGS.horses as any,
           isActive: DEFAULT_DERBY_SETTINGS.isActive
         }
       });
 
       console.log('Derby 설정 초기화 성공:', resetSettings.id);
       
       return res.send({ 
         success: true, 
         message: 'Derby 게임 설정이 기본값으로 초기화되었습니다.',
         settings: DEFAULT_DERBY_SETTINGS
       });
     } catch (error) {
       console.error('Derby 설정 초기화 오류:', error);
       return res.status(500).send({ 
         error: 'Derby 설정 초기화에 실패했습니다.' 
       });
     }
   });
 
   // Derby 게임 활성화/비활성화 토글 (관리자만)
   app.patch('/game/settings/derby/toggle', async (req, res) => {
     try {
       const { isActive } = req.body as { isActive: boolean };
       
       const updatedSettings = await prisma.gameSettings.updateMany({
         where: {
           gameType: 'derby'
         },
         data: {
           isActive,
           updatedAt: new Date()
         }
       });
 
       if (updatedSettings.count === 0) {
         // 설정이 없으면 기본 설정으로 생성
         await prisma.gameSettings.create({
           data: {
             gameType: 'derby',
             raceDuration: DEFAULT_DERBY_SETTINGS.raceDuration,
             countdownTime: DEFAULT_DERBY_SETTINGS.countdownTime,
             winScore: DEFAULT_DERBY_SETTINGS.winScore,
             loseScore: DEFAULT_DERBY_SETTINGS.loseScore,
             horses: DEFAULT_DERBY_SETTINGS.horses as any,
             isActive
           }
         });
       }
 
       console.log(`Derby 게임 ${isActive ? '활성화' : '비활성화'} 완료`);
       
       return res.send({ 
         success: true, 
         message: `Derby 게임이 ${isActive ? '활성화' : '비활성화'}되었습니다.`,
         isActive
       });
     } catch (error) {
       console.error('Derby 게임 토글 오류:', error);
       return res.status(500).send({ 
         error: 'Derby 게임 상태 변경에 실패했습니다.' 
       });
     }
   });
 }
