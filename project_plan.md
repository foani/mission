# CreataChain 기반 텔레그램 미션수행 게임 미니앱 개발 계획

## 📋 프로젝트 개요

**프로젝트명**: Creata Telegram Mission Game MiniApp  
**목적**: 게임형 미션수행 + Creata Wallet 인증 + 랭킹 기반 에어드랍  
**기술스택**: PostgreSQL + Prisma + Fastify + React + Telegram WebApp SDK  
**다국어 지원**: 영어, 한국어, 베트남어, 일본어
**블록체인**: CreataChain Catena 메인넷 기반 (EVM 호환)

## 🔗 블록체인 네트워크 정보

**Catena (CIP-20) Chain Mainnet 설정**:
- **Network Name**: Catena (CIP-20) Chain Mainnet
- **RPC URL**: https://cvm.node.creatachain.com
- **Chain ID**: 1000 (0x3E8)
- **Currency Symbol**: CTA
- **Block Explorer**: https://catena.explorer.creatachain.com
- **스마트컨트랙트**: CIP20 (Token) / CIP721 (NFT) 기반

## 🎮 초기 게임 목록
1. **Crypto Binary Options** - 업/다운 예측 게임
2. **Lazy Derby** - 느린말 1등 맞추기 게임  
3. **Reverse Darts** - 화살 피해가기 게임

## 🏗️ 전체 아키텍처
```
[Telegram 미니앱 UI] ↔ [백엔드 API (Fastify)] ↔ [PostgreSQL + Prisma]
                      ↔ [Creata Wallet 인증] ↔ [Catena Chain RPC]
                      
                      ## ✅ 게임 설정 관리 시스템 (완료)
                      
                      ### 구현된 기능
                      - **동적 게임 설정**: 관리자가 실시간으로 게임 설정 변경 가능
                      - **Binary Options 게임 설정 적용**: 하드코딩된 값들을 동적 설정으로 대체
                      - **관리자 대시보드**: 게임별 설정 관리 UI 완성
                      - **설정 항목**:
                      - 총 라운드 수 (1-10라운드)
                      - 선택 시간 (5-60초)
                      - 결과 표시 시간 (1-10초)
                      - 승리/패배 시 점수 (0-1000점)
                      - 게임 활성화 상태
                      
                      ## ✅ 보상 설정 관리 시스템 (완료)
                      
                      ### 구현된 기능
                      - **동적 보상 설정**: 관리자가 실시간으로 보상 방식 조정 가능
                      - **다양한 보상 타입 지원**: 즉시, 랭킹, 일일, 주간, 월간 보상
                      - **랭킹 기반 보상**: 순위별 차등 보상 시스템
                      - **조건별 보상**: 최소 게임 수, 점수 등 요구사항 설정
                      - **관리자 UI**: 직관적인 보상 설정 관리 인터페이스
                      - **미리보기 기능**: 보상 적용 전 시뮬레이션
                      
                      ### 백엔드 API
                      **GET /api/game/settings** - 모든 게임 설정 조회
                      **GET /api/game/settings/:gameType** - 특정 게임 설정 조회
                      **PUT /api/game/settings/:gameType** - 게임 설정 업데이트 (관리자)
                      **POST /api/game/settings/init** - 기본 설정 초기화 (관리자)
                      
                      ### 데이터베이스 스키마
                      ```sql
                      CREATE TABLE game_settings (
                        id SERIAL PRIMARY KEY,
                        game_type VARCHAR(50) UNIQUE NOT NULL,
                        total_rounds INT DEFAULT 3,
                        choice_time_seconds INT DEFAULT 10,
                        result_display_seconds INT DEFAULT 3,
                        points_per_win INT DEFAULT 100,
                        points_per_loss INT DEFAULT 0,
                        is_active BOOLEAN DEFAULT true,
                        created_at TIMESTAMP DEFAULT now(),
                        updated_at TIMESTAMP DEFAULT now()
                      );
                      ```
                      
                      ### 관리자 UI 컴포넌트
                      - **위치**: `/frontend/src/components/admin/GameSettingsManager.tsx`
                      - **기능**: 
                        - 각 게임별 설정 카드
                        - 실시간 플레이 시간 계산 미리보기
                        - 변경사항 감지 및 저장
                        - 설정 초기화 및 새로고침
                        - 반응형 디자인
                      
                      ### 변경된 파일 목록
                      ✅ `prisma/schema.prisma` - GameSettings 모델 추가
                      ✅ `backend/src/routes/gameSettings.routes.ts` - 게임 설정 API 라우트
                      ✅ `backend/src/index.ts` - 게임 설정 라우트 등록
                      ✅ `frontend/src/services/gameSettings.service.ts` - API 서비스 함수
                      ✅ `frontend/src/components/games/BinaryGame.tsx` - 동적 설정 적용
                      ✅ `frontend/src/components/admin/GameSettingsManager.tsx` - 관리자 UI
                      ✅ `frontend/src/components/admin/GameSettingsManager.css` - 스타일
                      
                      ### 시간 설정 예시
                      현재 Binary Options 게임 기본 설정:
                      - **총 라운드**: 3라운드
                      - **선택 시간**: 10초
                      - **결과 표시**: 3초
                      - **총 플레이 시간**: 39초 (0.65분)
                      
                      관리자가 다음과 같이 변경 가능:
                      - **5라운드 × (15초 선택 + 5초 결과) = 100초 (1분 40초)**
                      - **10라운드 × (30초 선택 + 3초 결과) = 330초 (5분 30초)**
                      
                      ### 다음 단계
                      - Derby, Darts 게임에도 동적 설정 적용
                      - 게임별 특화 설정 추가 (예: Derby 말 수, Darts 속도)
                      - 게임 설정 변경 이력 로깅
                      - A/B 테스트를 위한 설정 프리셋 기능
                      
                      ---
                      
```

## 🔐 Creata Wallet 인증 시스템

### 지원 지갑
- ✅ **Creata Wallet Android App**: https://play.google.com/store/apps/details?id=com.creatawallet
- ✅ **Creata Wallet Chrome Extension**: https://chromewebstore.google.com/detail/creata-chain/cnggilgmpgkjbkpbpbmkipjblgcdbpea
- ⏳ **향후 DID + 소셜로그인 지갑** 확장 예정

### 인증 방식 (EIP-191 표준)
**클라이언트 측**:
```typescript
// 지갑 주소 획득
const address = await window.creata.getAddress();

// 메시지 구성 및 서명
const msg = `Creata 인증 요청 @ ${Date.now()} by ${address}`;
const signature = await window.creata.signMessage(msg);
```

**서버 측**:
```typescript
// ethers.js로 서명 검증
import { verifyMessage } from 'ethers';
const recovered = verifyMessage(msg, signature);

// 주소 일치 확인
if (recovered.toLowerCase() === claimedAddress.toLowerCase()) {
    // 인증 성공 → 사용자 DB에 기록
}
```

### 지갑 설치 확인 방법
**앱 딥링크 방식**:
```typescript
const tryOpenApp = () => {
    const now = Date.now();
    window.location.href = 'creatawallet://'; // Creata 앱 딥링크
    
    setTimeout(() => {
        const elapsed = Date.now() - now;
        if (elapsed < 1500) {
            // 앱이 설치되어 있지 않음 → PlayStore로 유도
            window.location.href = 'https://play.google.com/store/apps/details?id=com.creatawallet';
        } else {
            // 설치되어 앱으로 전환됨
            alert('앱이 설치되어 있음');
        }
    }, 1000);
};
```

## 📁 프로젝트 파일 구조
```
Creata_Mission/
├── 📄 project_plan.md                    # ✅ 프로젝트 계획서
├── 📄 README.md                          # ✅ 프로젝트 설명서
├── 📄 .env.example                       # ✅ 환경변수 템플릿
├── 📄 .gitignore                         # ✅ Git 무시 파일
├── 📄 package.json                       # ✅ 프로젝트 의존성
├── 📄 tsconfig.json                      # ✅ TypeScript 설정
├── 📄 Dockerfile                         # ✅ Docker 설정
├── 📄 render.yaml                        # ✅ 배포 설정
├── 📄 .dockerignore                     # ✅ Docker 빌드 제외 파일
├── 📄 docker-entrypoint.sh              # ✅ Docker 시작 스크립트
│
├── 📁 prisma/                            # 데이터베이스 스키마
│   ├── 📄 schema.prisma                  # ✅ Prisma 스키마
│   ├── 📄 seed.ts                       # ✅ 시드 데이터
│   └── 📁 migrations/                    # ⏳ DB 마이그레이션
│
├── 📁 frontend/                          # 텔레그램 미니앱
│   ├── 📄 package.json                   # ✅ 프론트엔드 의존성
│   ├── 📄 index.html                     # ✅ 메인 HTML
│   ├── 📄 vite.config.ts                 # ✅ Vite 설정
│   ├── 📄 tsconfig.json                  # ✅ 프론트엔드 TS 설정
│   ├── 📄 tsconfig.json                  # ✅ 프론트엔드 TS 설정
│   ├── 📄 tsconfig.node.json             # ✅ Vite Node 설정
│   │
│   └── 📁 src/                           # 프론트엔드 소스코드
│       ├── 📄 main.tsx                   # ✅ 프론트엔드 진입점
│       ├── 📄 App.tsx                    # ✅ 메인 앱 컴포넌트
│       ├── 📄 i18n.ts                    # ✅ 다국어 설정
│       │
│       ├── 📁 components/                # 프론트엔드 컴포넌트
│       │   ├── 📄 GameHub.tsx            # ✅ 게임 허브
│       │   ├── 📄 WalletAuth.tsx         # ✅ 지갑 인증
│       │   └── 📁 games/                 # 게임 컴포넌트
│       │       ├── 📄 BinaryGame.tsx     # ✅ 바이너리 게임 (완성된 UI)
│       │       ├── 📄 BinaryGame.css     # ✅ 바이너리 게임 스타일
│       │       ├── 📄 DerbyGame.tsx      # ✅ 완성 - 관리자 설정 연동
│       │       ├── 📄 DerbyGame.css      # ✅ 완성 - 스타일링
│       │       ├── 📄 DartsGame.tsx      # ✅ 다트 게임 (완성된 UI)
│       │       └── 📄 DartsGame.css      # ✅ 다트 게임 스타일
│       │
│       ├── 📁 hooks/                     # React 훅
│       │   ├── 📄 useWallet.ts           # ✅ 지갑 훅
│       │   └── 📄 useTelegram.ts         # ✅ 텔레그램 훅
│       │
│       ├── 📁 services/                  # API 서비스
│       │   ├── 📄 api.ts                 # ✅ API 클라이언트
│       │   └── 📄 gameSettings.service.ts # ✅ 게임 설정 API 서비스
│       │
│       ├── 📁 locales/                   # 다국어 리소스
│       │   ├── 📄 en.json                # ✅ 영어 번역
│       │   ├── 📄 ko.json                # ✅ 한국어 번역
│       │   ├── 📄 vi.json                # ✅ 베트남어 번역
│       │   └── 📄 ja.json                # ✅ 일본어 번역
│       │
│       ├── 📁 types/                     # 타입 정의
│       │   └── 📄 index.ts               # ✅ 공통 타입
│       │
│       ├── 📁 utils/                     # 유틸리티
│       │   └── 📄 helpers.ts             # ✅ 헬퍼 함수
│       │
│       └── 📁 styles/                    # 스타일 파일
│           ├── 📄 globals.css            # ✅ 글로벌 스타일
│           └── 📄 components.css         # ✅ 컴포넌트 스타일
│
├── 📁 admin-dashboard/                   # 어드민 대시보드
│   ├── 📄 package.json                   # ✅ 어드민 의존성
│   ├── 📄 index.html                     # ✅ 어드민 HTML
│   ├── 📄 vite.config.ts                 # ✅ 어드민 Vite 설정
│   │
│   └── 📁 src/                           # 어드민 소스
│       ├── 📄 main.tsx                   # ✅ 어드민 진입점
├── 📁 admin-dashboard/                   # 어드민 대시보드 (통합 관리자 UI)
│   ├── 📄 package.json                   # ✅ 어드민 의존성
│   ├── 📄 index.html                     # ✅ 어드민 HTML
│   ├── 📄 vite.config.ts                 # ✅ 어드민 Vite 설정
│   │
│   └── 📁 src/                           # 어드민 소스
│       ├── 📄 main.tsx                   # ✅ 어드민 진입점
│       ├── 📄 App.tsx                    # ✅ 통합 관리자 대시보드 앱
│       │
│       ├── 📁 components/                # 어드민 컴포넌트
│       │   ├── 📄 UserList.tsx           # ✅ 사용자 목록 관리 (완료)
│       │   ├── 📄 GameLogs.tsx           # ✅ 게임 로그 관리 (완료)
│       │   ├── 📄 RankingAdmin.tsx       # ✅ 랭킹 관리 (완료)
│       │   ├── 📄 AirdropAdmin.tsx       # ✅ 에어드랍 관리 (완료)
│       │   ├── 📄 DerbyGameAdmin.tsx    # ✅ Derby 게임 관리 UI (이동 완료)
│       │   ├── 📄 DerbyGameAdmin.css    # ✅ Derby 관리자 스타일 (이동 완료)
│       │   ├── 📄 GameSettingsManager.tsx # ✅ 게임 설정 관리 UI (이동 완료)
│       │   ├── 📄 GameSettingsManager.css # ✅ 게임 설정 스타일 (이동 완료)
│       │   ├── 📄 RewardSettings.tsx    # ✅ 보상 설정 관리 UI (이동 완료)
│       │   └── 📄 RewardSettings.css    # ✅ 보상 설정 스타일 (이동 완료)
│       │
│       └── 📁 services/                  # 어드민 서비스
│           └── 📄 adminApi.ts            # ✅ 어드민 API (완료)
│
├── 📁 backend/                           # 백엔드 전용 폴더 (분리된 구조)
│   ├── 📄 package.json                   # ✅ 백엔드 의존성
│   ├── 📄 tsconfig.json                  # ✅ 백엔드 TS 설정
│   ├── 📄 .env.example                   # ✅ 백엔드 환경변수
│   ├── 📁 prisma/                        # 백엔드 DB 스키마
│   │   └── 📄 schema.prisma              # ✅ 백엔드 Prisma 스키마
│   └── 📁 src/                           # 백엔드 소스코드
│       ├── 📄 index.ts                   # ✅ 백엔드 서버 진입점
│       ├── 📄 env.ts                     # ✅ 백엔드 환경변수 관리
│       │
│       ├── 📁 db/                        # 백엔드 데이터베이스
│       │   └── 📄 client.ts              # ✅ 백엔드 Prisma 클라이언트
│       │
│       ├── 📁 routes/                    # 백엔드 API 라우트
│       │   ├── 📄 auth.routes.ts         # ✅ 백엔드 인증 API
│       │   ├── 📄 game.routes.ts         # ✅ 백엔드 게임 API
│       │   ├── 📄 ranking.routes.ts      # ✅ 백엔드 랭킹 API
│       │   ├── 📄 airdrop_routes.ts      # ✅ 백엔드 에어드랍 API (이름: airdrop_routes.ts)
│       │   ├── 📄 derbySettings.routes.ts # ✅ 완성 - Derby 게임 설정 API
│       │   ├── 📄 gameSettings.routes.ts   # ✅ 게임 설정 API
│       │   └── 📄 rewardSettings.routes.ts # ✅ 보상 설정 API
│       │
│       ├── 📁 services/                 # 백엔드 서비스
│       │   ├── 📄 auth.service.ts        # ✅ 인증 서비스
│       │   ├── 📄 game.service.ts        # ✅ 게임 서비스
│       │   ├── 📄 ranking.service.ts     # ✅ 랭킹 서비스
│       │   └── 📄 airdrop.service.ts     # ✅ 에어드랏 서비스
│       │
│       └── 📁 utils/                     # 백엔드 유틸리티
│           ├── 📄 signature.ts           # ✅ 서명 검증 유틸
│           └── 📄 blockchain.ts          # ✅ 블록체인 유틸
│
└── 📁 tests/                             # 테스트 파일
    ├── 📄 auth.test.ts                   # ✅ 인증 테스트 (완료)
    ├── 📄 game.test.ts                   # ✅ 게임 테스트 (완료)
    └── 📄 airdrop.test.ts                # ✅ 에어드랍 테스트 (완료)
```

## 💾 데이터베이스 스키마 설계

### Prisma 스키마 구조
```prisma
// Prisma schema for CreataChain Telegram Mission Game DApp
// DB: PostgreSQL

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(uuid())
  walletAddress     String    @unique
  telegramId        String?   @unique
  language          String    @default("en")
  isWalletVerified  Boolean   @default(false)
  isWalletInstalled Boolean   @default(false)
  score             Int       @default(0)
  lastPlayedAt      DateTime?
  createdAt         DateTime  @default(now())

  gameLogs      GameLog[]
  airdropQueue  AirdropQueue[]
}

model GameLog {
  id        Int      @id @default(autoincrement())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  gameType  String
  round     Int
  score     Int
  result    Json
  createdAt DateTime @default(now())
}

model AirdropQueue {
  id          Int       @id @default(autoincrement())
  user        User      @relation(fields: [userId], references: [id])
  userId      String
  rewardType  String
  ctaAmount   Decimal   @db.Numeric(20, 8)
  txHash      String?
  status      String    @default("pending") // pending | success | fail
  createdAt   DateTime  @default(now())
  processedAt DateTime?
}

model AdminUser {
  id           Int       @id @default(autoincrement())
  email        String    @unique
  passwordHash String
  role         String    @default("admin")
  lastLogin    DateTime?
}
```

### 주요 테이블 설명

#### users 테이블
- **id**: UUID 기본키
- **walletAddress**: 지갑 주소 (고유값)
- **telegramId**: 텔레그램 사용자 ID
- **language**: 언어 설정 (en, ko, vi, ja)
- **isWalletVerified**: 지갑 서명 인증 여부
- **isWalletInstalled**: Creata Wallet 앱 설치 여부
- **score**: 누적 점수 (캐시용)

#### game_logs 테이블
- **gameType**: 'binary', 'derby', 'darts'
- **round**: 게임 라운드 번호
- **result**: 게임 결과 상세 정보 (JSON)
  - Binary: `{choice: "up", correct: true, streak: 3}`
  - Derby: `{picked: "Horse 4", winner: "Horse 4", rank: 1}`
  - Darts: `{survived: 45, arrows_dodged: 12, combo: 5}`

#### airdrop_queue 테이블
- **rewardType**: 'ranking', 'event', 'referral', 'daily'
- **ctaAmount**: CTA 토큰 수량 (Decimal 정밀도)
- **txHash**: 블록체인 트랜잭션 해시
- **status**: 에어드랍 상태

### 인덱스 전략
```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_users_wallet_verified ON users(is_wallet_verified, is_wallet_installed);
CREATE INDEX idx_game_logs_user_id ON game_logs(user_id);
CREATE INDEX idx_game_logs_game_type ON game_logs(game_type, created_at);
CREATE INDEX idx_airdrop_status ON airdrop_queue(status);
CREATE INDEX idx_users_score_desc ON users(score DESC);

-- 랭킹 조회를 위한 Materialized View
CREATE MATERIALIZED VIEW ranking_snapshot AS
SELECT 
  u.id AS user_id,
  u.wallet_address,
  u.telegram_id,
  u.language,
  SUM(g.score) AS total_score,
  RANK() OVER (ORDER BY SUM(g.score) DESC) AS rank
FROM users u
JOIN game_logs g ON g.user_id = u.id
GROUP BY u.id;

-- 랭킹 갱신: REFRESH MATERIALIZED VIEW ranking_snapshot;
```

## 🎮 게임 상세 설계

### 🎯 1. Crypto Binary Options (암호화폐 예측 게임)

**게임 개요**: 암호화폐 가격의 상승/하락을 예측하는 게임

#### 게임 규칙
- **예측 시간**: 60초 (1분)
- **예측 대상**: BTC, ETH, CTA 가격
- **선택지**: UP (상승) / DOWN (하락)
- **결과 판정**: 1분 후 실제 가격 변동으로 결과 확인

#### 점수 시스템
- **정답**: +100점
- **오답**: +0점
- **연속 정답 보너스**:
  - 3연속: +50점 보너스
  - 5연속: +100점 보너스
  - 10연속: +200점 보너스

#### 레벨 시스템
- **초보자 (Beginner)**: 0-499점
- **중급자 (Intermediate)**: 500-1999점
- **고급자 (Advanced)**: 2000-4999점
- **전문가 (Expert)**: 5000-9999점
- **마스터 (Master)**: 10000점 이상

#### 일일 미션
- **일일 참여**: 5게임 참여 시 +50점 보너스
- **정확도 미션**: 70% 이상 적중 시 +100점 보너스
- **연속 참여**: 7일 연속 참여 시 +300점 보너스

---

### 🐎 2. Lazy Derby (느린말 경주 게임)

**게임 개요**: 5마리의 느린 말 중 1등을 예측하는 게임

#### 게임 규칙
- **말의 수**: 5마리 (Horse 1~5)
- **경주 시간**: 30초
- **각 말의 속도**: 랜덤하게 설정 (매우 느림)
- **예측**: 1등이 될 말을 선택

#### 말 특성 시스템
- **Thunder**: 가끔 빠른 속도 (확률: 20%)
- **Sleepy**: 항상 느림 (확률: 30%)
- **Lucky**: 운이 좋을 때 빠름 (확률: 25%)
- **Steady**: 일정한 속도 (확률: 15%)
- **Wild**: 예측 불가능 (확률: 10%)

#### 점수 시스템
- **1등 예측 성공**: +150점
- **2등 예측**: +50점 (위로상)
- **3등 이하**: +0점
- **연속 적중 보너스**:
  - 2연속: +75점 보너스
  - 3연속: +150점 보너스
  - 5연속: +300점 보너스

#### 레벨 시스템
- **견습 기수 (Apprentice Jockey)**: 0-599점
- **기수 (Jockey)**: 600-1999점
- **숙련 기수 (Skilled Jockey)**: 2000-4999점
- **마스터 기수 (Master Jockey)**: 5000-9999점
- **레전드 기수 (Legend Jockey)**: 10000점 이상

#### 일일 미션
- **일일 참여**: 3게임 참여 시 +75점 보너스
- **연속 적중**: 3연속 적중 시 +200점 보너스
- **특정 말 적중**: Thunder 말 적중 시 +100점 보너스

---

### ✅ 3. Reverse Darts (화살 피하기 게임) - 구현 완료

**게임 개요**: 날아오는 화살을 피하면서 점수를 얻는 액션 게임

#### 구현된 기능
- ✅ **동적 게임 설정 연동**: 백엔드 설정에 따른 라운드 수, 시간 제한 적용
- ✅ **다국어 지원**: 영어, 한국어, 일본어, 베트남어 완전 지원
- ✅ **실시간 게임플레이**: 마우스/터치 기반 캐릭터 이동
- ✅ **화살 회피 시스템**: 다방향에서 날아오는 화살 피하기
- ✅ **타겟 수집 시스템**: 보너스 점수를 위한 타겟 아이템
- ✅ **점수 계산 시스템**: 기본점수 + 시간보너스 + 완주보너스
- ✅ **게임 상태 관리**: 준비 → 플레이 → 완료 단계별 처리
- ✅ **반응형 디자인**: 모바일 및 데스크톱 호환

#### 게임 규칙
- **게임 시간**: 동적 설정 (기본 30초)
- **화살 속도**: 점점 빨라짐
- **화살 개수**: 시간이 지날수록 증가
- **조작**: 터치/클릭으로 캐릭터 이동
#### 점수 시스템
- **생존**: 1초당 +10점
- **화살 근접 회피**: 화살 근처 통과 시 +20점
- **완벽 생존**: 45초 풀타임 생존 시 +300점 보너스
- **콤보 시스템**:
  - 연속 근접 회피 시 점수 배율 증가
  - 2연속: 1.2배
  - 5연속: 1.5배
  - 10연속: 2.0배

#### 레벨 시스템
- **초보 전사 (Novice Warrior)**: 0-799점
- **전사 (Warrior)**: 800-2499점
- **숙련 전사 (Skilled Warrior)**: 2500-5999점
- **베테랑 전사 (Veteran Warrior)**: 6000-11999점
- **불사의 전사 (Immortal Warrior)**: 12000점 이상

#### 난이도 모드
- **Easy Mode**: 화살 속도 50% (점수 0.8배)
- **Normal Mode**: 기본 설정 (점수 1.0배)
- **Hard Mode**: 화살 속도 150% (점수 1.5배)
- **Nightmare Mode**: 화살 속도 200% (점수 2.0배)

#### 일일 미션
- **일일 참여**: 3게임 참여 시 +100점 보너스
- **생존 시간**: 총 생존 시간 180초 달성 시 +200점 보너스
- **고득점**: 단일 게임에서 800점 이상 시 +150점 보너스

---

## 🏆 종합 랭킹 시스템

### 글로벌 랭킹
- **전체 랭킹**: 모든 게임 점수 합산
- **게임별 랭킹**: 각 게임별 개별 랭킹
- **주간 랭킹**: 주간 획득 점수 기준
- **월간 랭킹**: 월간 획득 점수 기준

### 랭킹 구분
🥇 **Diamond (다이아몬드)**: 상위 1%
- 보상: 월 1000 CTA + 특별 NFT
- 혜택: 베타 게임 우선 체험

🥈 **Platinum (플래티넘)**: 상위 5%
- 보상: 월 500 CTA + 레어 NFT
- 혜택: 어드민과 직접 소통 채널

🥉 **Gold (골드)**: 상위 10%
- 보상: 월 200 CTA + 일반 NFT
- 혜택: 특별 게임 모드 해금

🏅 **Silver (실버)**: 상위 25%
- 보상: 월 100 CTA
- 혜택: 일일 미션 보너스 1.2배

🎖️ **Bronze (브론즈)**: 상위 50%
- 보상: 월 50 CTA
- 혜택: 주간 미션 해금

### 특별 랭킹
- **연속 참여왕**: 가장 많은 날 연속 참여
- **게임 마스터**: 모든 게임에서 고득점 달성
- **신속 대응왕**: 가장 빠른 게임 반응 속도
- **행운의 별**: 가장 많은 보너스 점수 획득

### 시즌 시스템
- **시즌 기간**: 3개월
- **시즌 초기화**: 랭킹 포인트 50% 초기화
- **시즌 보상**: 시즌 종료 시 특별 에어드랍
- **레거시 보상**: 이전 시즌 상위 랭커 영구 혜택

## 🎁 보상 시스템 상세

### 즉시 보상
- **게임 완료**: 최소 5 CTA
- **일일 미션**: 10-50 CTA
- **주간 미션**: 100-300 CTA
- **월간 미션**: 500-1000 CTA

### 랭킹 보상 (월별)
- **1위**: 5000 CTA + 레전더리 NFT
- **2-5위**: 2500 CTA + 에픽 NFT
- **6-20위**: 1000 CTA + 레어 NFT
- **21-100위**: 500 CTA + 일반 NFT
- **101-500위**: 200 CTA

### 특별 이벤트 보상
- **신규 게임 출시**: 참여자 전원 200 CTA
- **기념일 이벤트**: 더블 포인트 + 특별 NFT
- **커뮤니티 목표**: 전체 참여자 목표 달성 시 집단 보상

### NFT 컬렉션
- **게임 관련 NFT**: 각 게임의 특별 아이템
- **랭킹 배지 NFT**: 달성한 최고 랭킹 기념
- **시즌 기념 NFT**: 각 시즌별 한정 NFT
- **이벤트 기념 NFT**: 특별 이벤트 참여 기념

## 📊 게임 통계 및 분석

### 개인 통계
- **총 게임 수**: 참여한 전체 게임 횟수
- **승률**: 게임별 성공률
- **연속 기록**: 최대 연속 성공 기록
- **평균 점수**: 게임별 평균 점수
- **플레이 시간**: 총 게임 플레이 시간
- **선호 게임**: 가장 많이 플레이한 게임

### 글로벌 통계
- **일일 활성 사용자**: DAU
- **게임별 인기도**: 각 게임의 참여율
- **평균 세션 시간**: 사용자별 평균 플레이 시간
- **지역별 통계**: 국가/언어별 사용자 분포

### 성취 시스템
- **첫 승리**: 첫 게임 승리 달성
- **백전백승**: 10연승 달성
- **마라토너**: 100게임 참여
- **올마이티**: 모든 게임에서 승리 경험
- **시간 여행자**: 30일 연속 참여
- **포인트 헌터**: 10,000점 돌파
- **NFT 컬렉터**: 10개 이상 NFT 보유
- **소셜 스타**: 10명 이상 초대

## 🌐 다국어 지원 상세

### 지원 언어
- **영어 (English)**: 기본 언어
- **한국어 (Korean)**: 한국 시장 대상
- **베트남어 (Vietnamese)**: 베트남 시장 대상  
- **일본어 (Japanese)**: 일본 시장 대상

### 현지화 요소
- **게임 제목 및 설명**: 각 언어별 적절한 번역
- **UI 텍스트**: 모든 버튼, 메뉴, 메시지
- **에러 메시지**: 사용자 친화적 에러 안내
- **푸시 알림**: 현지 시간대 고려한 알림
- **이벤트 안내**: 문화적 특성 고려한 이벤트

### 지역별 특화 기능
- **한국**: 카카오톡 공유 기능
- **베트남**: Zalo 연동 기능
- **일본**: Line 연동 기능
- **글로벌**: 트위터/텔레그램 공유

## 🚀 API 명세서

### 인증 API
**POST /auth/verify-wallet** - 지갑 서명 인증
```typescript
Request: {
  "walletAddress": "0x123...",
  "message": "Creata 인증 요청 @timestamp",
  "signature": "0xabc..."
}

Response: {
  "success": true,
  "verified": true
}
```

**POST /auth/install-confirm** - Creata Wallet 설치 확인
```typescript
Request: {
  "walletAddress": "0x123...",
  "telegramId": "123456789"
}

Response: {
  "success": true,
  "installed": true
}
```

### 게임 API
**POST /game/submit** - 게임 결과 제출
```typescript
Request: {
  "walletAddress": "0x123...",
  "gameType": "derby",
  "round": 3,
  "score": 100,
  "result": {
    "picked": "Horse 4",
    "correct": true
  }
}

Response: {
  "success": true,
  "totalScore": 640
}
```

### 랭킹 API  
**GET /ranking?limit=10&language=ko** - 랭킹 조회
```typescript
Response: [
  {
    "rank": 1,
    "walletAddress": "0x123...",
    "telegramId": "123456789", 
    "score": 1020,
    "language": "ko"
  }
]
```

### 에어드랍 API (어드민)
**POST /airdrop/queue** - 보상 대상 등록
```typescript
Headers: Authorization: Bearer <JWT>
Request: {
  "walletAddress": "0x123...",
  "rewardType": "ranking",
  "ctaAmount": "12.5"
}

Response: {
  "queued": true
}
```

**POST /airdrop/execute** - 에어드랍 실행
```typescript
Response: {
  "success": true,
  "processed": 5
}
```

## 🛠️ 기술적 구현 상세

### CTA 토큰 전송 로직
```typescript
// ethers.js 기반 CTA 전송
import { ethers } from 'ethers';

const sendCta = async (to: string, amount: string) => {
  const provider = new ethers.JsonRpcProvider('https://cvm.node.creatachain.com');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  // 하드코딩된 CTA 토큰 컨트랙트 주소
  const ctaTokenAddress = '0x...'; // CIP-20 CTA 토큰 주소
  
  const ctaContract = new ethers.Contract(
    ctaTokenAddress,
    ['function transfer(address to, uint256 amount) returns (bool)'],
    wallet
  );
  
  const tx = await ctaContract.transfer(to, ethers.parseUnits(amount, 18));
  return tx.hash;
};
```

### 배포 설정
**Dockerfile**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**render.yaml** - Render 배포 설정
```yaml
services:
  - type: web
    name: creata-mission-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: node dist/index.js
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: creata-mission-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: PRIVATE_KEY  # 하드코딩된 에어드랍용 프라이베이트키
        sync: false
```

### 환경변수 설정
**.env.example**
```bash
# 데이터베이스
DATABASE_URL="postgresql://username:password@localhost:5432/creata_mission"

# JWT 비밀키
JWT_SECRET="your-jwt-secret-key"

# 블록체인 설정
CATENA_RPC="https://cvm.node.creatachain.com"
CHAIN_ID=1000

# 에어드랍용 프라이베이트키 (하드코딩된 지갑 정보)
PRIVATE_KEY="0x..."

# CTA 토큰 컨트랙트 (하드코딩된 컨트랙트 주소)
CTA_TOKEN_ADDRESS="0x..."

# 어드민 설정
ADMIN_EMAIL="admin@creatachain.com"
ADMIN_PASSWORD="admin123"

# 서버 설정
PORT=3000
NODE_ENV="development"
```

## 📈 성능 요구사항

### 예상 트래픽
- **동시 접속자**: 1,000명
- **일일 활성 사용자**: 10,000명
- **월간 게임 수**: 1,000,000게임
- **에어드랍 처리**: 일 1,000건

### 데이터베이스 성능
- **연결 풀**: 20개 동시 연결
- **인덱스 최적화**: 주요 쿼리 경로
- **랭킹 캐시**: Materialized View 5분마다 갱신
- **백업**: 일일 자동 백업

### 보안 요구사항
- **API Rate Limiting**: 사용자별 분당 60요청
- **SQL Injection 방지**: Prisma ORM 사용
- **XSS 방지**: 입력값 살이똈이셈
- **CORS 설정**: 텔레그램 도메인만 허용
- **환경변수 암호화**: 중요 정보 암호화 저장