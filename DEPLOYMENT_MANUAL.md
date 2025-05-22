 # CreataChain Mission Game - 배포 매뉴얼
 
 ## 📋 목차
 1. [배포 개요](#배포-개요)
 2. [프로덕션 환경 준비](#프로덕션-환경-준비)
 3. [Docker 배포](#docker-배포)
 4. [Railway 배포](#railway-배포)
 5. [Render 배포](#render-배포)
 6. [Vercel 배포](#vercel-배포)
 7. [데이터베이스 배포](#데이터베이스-배포)
 8. [도메인 및 SSL 설정](#도메인-및-ssl-설정)
 9. [모니터링 및 유지보수](#모니터링-및-유지보수)
 10. [배포 후 체크리스트](#배포-후-체크리스트)
 
 ---
 
 ## 🚀 배포 개요
 
 CreataChain Mission Game은 다음과 같은 구성 요소를 가지고 있습니다:
 
 ### 애플리케이션 구성
 - **백엔드 API**: Node.js + Fastify + PostgreSQL
 - **프론트엔드**: React + Vite (텔레그램 미니앱)
 - **관리자 대시보드**: React + React Admin
 - **데이터베이스**: PostgreSQL + Prisma
 - **블록체인**: CreataChain Catena Network
 
 ### 배포 전략
 ```
 ┌─────────────────────────────────┐
 │ 프론트엔드 (텔레그램 미니앱)        │
 │ → Vercel 또는 Netlify             │
 ├─────────────────────────────────┤
 │ 관리자 대시보드                    │
 │ → Vercel 또는 Netlify             │
 ├─────────────────────────────────┤
 │ 백엔드 API                       │
 │ → Railway, Render, 또는 VPS        │
 ├─────────────────────────────────┤
 │ 데이터베이스                        │
 │ → Railway, Supabase, 또는 AWS RDS │
 └─────────────────────────────────┘
 ```
 
 ### 배포 단계
 1. **빌드 및 테스트**: 로컬에서 전체 시스템 테스트
 2. **데이터베이스 준비**: 프로덕션 PostgreSQL 설정
 3. **백엔드 배포**: API 서버 배포
 4. **프론트엔드 배포**: 정적 사이트 배포
 5. **도메인 연결**: 커스텀 도메인 설정
 6. **SSL 인증서**: HTTPS 설정
 7. **모니터링**: 서비스 상태 감시
 
 ---
 
 ## 🔧 프로덕션 환경 준비
 
 ### 1. 환경 변수 설정
 
 #### 백엔드 프로덕션 환경변수
 ```env
 # 기본 설정
 NODE_ENV=production
 PORT=3000
 
 # 데이터베이스 (프로덕션)
 DATABASE_URL="postgresql://user:password@host:5432/creata_mission_prod"
 
 # JWT 보안 (강력한 비밀키 사용)
 JWT_SECRET="긴밀한-랜덤-문자열-64자리-이상"
 
 # CreataChain 네트워크
 CATENA_RPC_URL="https://cvm.node.creatachain.com"
 CATENA_CHAIN_ID=1000
 CATENA_EXPLORER_URL="https://catena.explorer.creatachain.com"
 
 # 지갑 설정 (보안 주의!)
 ADMIN_PRIVATE_KEY="실제-개인키-넣지말것"
 ADMIN_WALLET_ADDRESS="0x..."
 
 # 텔레그램 설정
 TELEGRAM_BOT_TOKEN="실제-봇-토큰"
 TELEGRAM_BOT_USERNAME="실제_봇_사용자명"
 
 # 로깅
 LOG_LEVEL=info
 
 # CORS 설정
 ALLOWED_ORIGINS="https://yourdomain.com,https://admin.yourdomain.com"
 ```
 
 #### 프론트엔드 프로덕션 환경변수
 ```env
 # API 설정
 VITE_API_BASE_URL=https://api.yourdomain.com
 VITE_APP_TITLE="CreataChain Mission Game"
 
 # CreataChain 설정
 VITE_CATENA_RPC_URL="https://cvm.node.creatachain.com"
 VITE_CATENA_CHAIN_ID=1000
 VITE_CATENA_EXPLORER_URL="https://catena.explorer.creatachain.com"
 
 # 텔레그램 WebApp 설정
 VITE_TELEGRAM_BOT_USERNAME="실제_봇_사용자명"
 
 # 프로덕션 모드
 VITE_DEV_MODE=false
 ```
 
 ### 2. 보안 고려사항
 
 #### 민감 정보 보호
 - **개인키**: 환경변수로만 관리, 코드에 하드코딩 금지
 - **JWT SECRET**: 64자 이상의 강력한 랜덤 문자열
 - **데이터베이스**: SSL/TLS 연결 필수
 - **API 키**: 암호화된 저장소에 보관
 
 #### 네트워크 보안
 ```bash
 # 방화벽 설정 (예시: UFW)
 sudo ufw allow 22    # SSH
 sudo ufw allow 80    # HTTP
 sudo ufw allow 443   # HTTPS
 sudo ufw allow 5432  # PostgreSQL (내부만)
 sudo ufw enable
 
 ---
 
 ## 🐳 Docker 배포
 
 ### 1. Docker 컴포즈 설정
 
 #### docker-compose.yml
 ```yaml
 version: '3.8'
 
 services:
   # PostgreSQL 데이터베이스
   postgres:
     image: postgres:15-alpine
     environment:
       POSTGRES_DB: creata_mission_prod
       POSTGRES_USER: creata_user
       POSTGRES_PASSWORD: ${DB_PASSWORD}
     volumes:
       - postgres_data:/var/lib/postgresql/data
     ports:
       - "5432:5432"
     networks:
       - creata-network
     restart: unless-stopped
 
   # 백엔드 API
   backend:
     build:
       context: ./backend
       dockerfile: Dockerfile
     environment:
       - NODE_ENV=production
       - DATABASE_URL=postgresql://creata_user:${DB_PASSWORD}@postgres:5432/creata_mission_prod
       - JWT_SECRET=${JWT_SECRET}
       - CATENA_RPC_URL=https://cvm.node.creatachain.com
       - CATENA_CHAIN_ID=1000
       - ADMIN_PRIVATE_KEY=${ADMIN_PRIVATE_KEY}
       - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
     ports:
       - "3000:3000"
     depends_on:
       - postgres
     networks:
       - creata-network
     restart: unless-stopped
     volumes:
       - ./backend/logs:/app/logs
 
   # 프론트엔드 (옵션)
   frontend:
     build:
       context: ./frontend
       dockerfile: Dockerfile
       args:
         - VITE_API_BASE_URL=http://localhost:3000
         - VITE_CATENA_RPC_URL=https://cvm.node.creatachain.com
         - VITE_TELEGRAM_BOT_USERNAME=${TELEGRAM_BOT_USERNAME}
     ports:
       - "5173:80"
     networks:
       - creata-network
     restart: unless-stopped
 
   # 관리자 대시보드
   admin:
     build:
       context: ./admin-dashboard
       dockerfile: Dockerfile
       args:
         - VITE_API_BASE_URL=http://localhost:3000
     ports:
       - "3001:80"
     networks:
       - creata-network
     restart: unless-stopped
 
   # Nginx 리버스 프록시 (옵션)
   nginx:
     image: nginx:alpine
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./nginx.conf:/etc/nginx/nginx.conf
       - ./ssl:/etc/nginx/ssl
     depends_on:
       - backend
       - frontend
       - admin
     networks:
       - creata-network
     restart: unless-stopped
 
 volumes:
   postgres_data:
 
 networks:
   creata-network:
     driver: bridge
 ```
 
 ### 2. 개별 Dockerfile 작성
 
 #### 백엔드 Dockerfile
 ```dockerfile
 # backend/Dockerfile
 FROM node:18-alpine AS builder
 
 WORKDIR /app
 
 # 의존성 설치
 COPY package*.json ./
 RUN npm ci --only=production
 
 # 소스 코드 복사
 COPY . .
 
 # Prisma 및 TypeScript 빌드
 RUN npx prisma generate
 RUN npm run build
 
 # 프로덕션 이미지
 FROM node:18-alpine AS production
 
 WORKDIR /app
 
 # 빌드 결과물 복사
 COPY --from=builder /app/dist ./dist
 COPY --from=builder /app/node_modules ./node_modules
 COPY --from=builder /app/package*.json ./
 COPY --from=builder /app/prisma ./prisma
 
 # 비root 사용자 생성
 RUN addgroup -g 1001 -S nodejs
 RUN adduser -S backend -u 1001
 
 # 로그 디렉터리 생성
 RUN mkdir -p /app/logs && chown -R backend:nodejs /app
 
 USER backend
 
 EXPOSE 3000
 
 CMD ["node", "dist/index.js"]
 ```
 
 #### 프론트엔드 Dockerfile
 ```dockerfile
 # frontend/Dockerfile
 FROM node:18-alpine AS builder
 
 WORKDIR /app
 
 # 빌드 인수 수신
 ARG VITE_API_BASE_URL
 ARG VITE_CATENA_RPC_URL
 ARG VITE_TELEGRAM_BOT_USERNAME
 
 # 의존성 설치
 COPY package*.json ./
 RUN npm ci
 
 # 소스 코드 복사
 COPY . .
 
 # 빌드
 RUN npm run build
 
 # Nginx로 정적 파일 서빙
 FROM nginx:alpine
 
 # 빌드 결과물 복사
 COPY --from=builder /app/dist /usr/share/nginx/html
 
 # Nginx 설정
 COPY nginx.conf /etc/nginx/conf.d/default.conf
 
 EXPOSE 80
 
 CMD ["nginx", "-g", "daemon off;"]
 ```
 
 ### 3. 배포 명령어
 
 #### 기본 배포
 ```bash
 # 환경변수 설정
 cp .env.example .env
 # .env 파일 편집 후
 
 # Docker 빌드 및 실행
 docker-compose build
 docker-compose up -d
 
 # 데이터베이스 마이그레이션
 docker-compose exec backend npx prisma migrate deploy
 
 # 상태 확인
 docker-compose ps
 ```
 
 #### 로그 확인
 ```bash
 # 전체 로그
 docker-compose logs -f
 
 # 개별 서비스 로그
 docker-compose logs -f backend
 docker-compose logs -f postgres
 ```
 
 #### 업데이트 및 재시작
 ```bash
 # 서비스 재시작
 docker-compose restart backend
 
 # 업데이트 배포
 docker-compose build backend
 docker-compose up -d backend
 
 # 전체 재배포
 docker-compose down
 docker-compose build
 docker-compose up -d
 ```

---

## 🚅 Railway 배포

### 1. Railway 설정

#### 프로젝트 생성
```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 생성
railway new
```

#### railway.json 설정
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. 데이터베이스 설정

#### PostgreSQL 추가
```bash
# Railway에서 PostgreSQL 서비스 추가
railway add postgresql

# 데이터베이스 연결 정보 확인
railway variables
```

#### 백엔드 서비스 배포
```bash
# 백엔드 디렉터리로 이동
cd backend

# Railway 서비스 연결
railway link

# 환경변수 설정
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="실제-jwt-비밀키"
railway variables set CATENA_RPC_URL="https://cvm.node.creatachain.com"
railway variables set ADMIN_PRIVATE_KEY="실제-개인키"
railway variables set TELEGRAM_BOT_TOKEN="실제-봇-토큰"

# 배포
railway up
```

### 3. 데이터베이스 마이그레이션
```bash
# Railway를 통한 마이그레이션
railway run npx prisma migrate deploy

# 또는 로컬에서 DATABASE_URL 사용
export DATABASE_URL="railway-postgresql-url"
npx prisma migrate deploy
```

### 4. 커스텀 도메인 설정
```bash
# Railway 대시보드에서 설정
# Settings > Domains > Custom Domain
# api.yourdomain.com 추가
```

---

## 🎨 Render 배포

### 1. Render 설정

#### render.yaml 설정
```yaml
databases:
  - name: creata-mission-db
    databaseName: creata_mission_prod
    user: creata_user
    plan: free

services:
  # 백엔드 API
  - type: web
    name: creata-mission-backend
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: creata-mission-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: CATENA_RPC_URL
        value: https://cvm.node.creatachain.com
      - key: CATENA_CHAIN_ID
        value: 1000
      - key: ADMIN_PRIVATE_KEY
        sync: false  # 수동으로 설정 필요
      - key: TELEGRAM_BOT_TOKEN
        sync: false  # 수동으로 설정 필요

  # 프론트엔드 (정적 사이트)
  - type: web
    name: creata-mission-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_BASE_URL
        value: https://creata-mission-backend.onrender.com
      - key: VITE_CATENA_RPC_URL
        value: https://cvm.node.creatachain.com
      - key: VITE_TELEGRAM_BOT_USERNAME
        sync: false

  # 관리자 대시보드
  - type: web
    name: creata-mission-admin
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_BASE_URL
        value: https://creata-mission-backend.onrender.com
```

### 2. 수동 배포 과정

#### 1단계: 데이터베이스 생성
1. Render 대시보드 접속
2. "New PostgreSQL" 클릭
3. Database Name: `creata_mission_prod`
4. User: `creata_user`
5. Plan: Free 또는 유료 선택

#### 2단계: 백엔드 배포
1. "New Web Service" 클릭
2. GitHub 레포지토리 연결
3. Root Directory: `backend`
4. Environment: Node
5. Build Command: `npm install && npm run build`
6. Start Command: `npm start`
7. 환경변수 설정

#### 3단계: 프론트엔드 배포
1. "New Static Site" 클릭
2. GitHub 레포지토리 연결
3. Root Directory: `frontend`
4. Build Command: `npm install && npm run build`
5. Publish Directory: `dist`
6. 환경변수 설정

### 3. 데이터베이스 마이그레이션
```bash
# Render 대시보드에서 DATABASE_URL 복사
export DATABASE_URL="render-postgresql-url"

# 마이그레이션 실행
npx prisma migrate deploy

# 또는 Render Shell에서 실행
# Render 대시보드 > 서비스 > Shell
npx prisma migrate deploy
```

---

## ⚜️ Vercel 배포

### 1. 프론트엔드 배포

#### vercel.json 설정
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "VITE_API_BASE_URL": "https://api.yourdomain.com",
    "VITE_CATENA_RPC_URL": "https://cvm.node.creatachain.com",
    "VITE_CATENA_CHAIN_ID": "1000",
    "VITE_TELEGRAM_BOT_USERNAME": "your_bot_username"
  },
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

#### Vercel CLI 배포
```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 프론트엔드 배포
cd frontend
vercel

# 관리자 대시보드 배포
cd ../admin-dashboard
vercel
```

### 2. 환경변수 설정
```bash
# Vercel 환경변수 설정
vercel env add VITE_API_BASE_URL production
vercel env add VITE_CATENA_RPC_URL production
vercel env add VITE_TELEGRAM_BOT_USERNAME production

# 또는 Vercel 대시보드에서 설정
# Settings > Environment Variables
```

### 3. 커스텀 도메인
```bash
# 도메인 추가
vercel domains add yourdomain.com
vercel domains add admin.yourdomain.com

# DNS 설정
# A record: yourdomain.com -> 76.76.19.61
# CNAME: admin.yourdomain.com -> your-project.vercel.app
```

---

## 🗄️ 데이터베이스 배포

### 1. Supabase PostgreSQL

#### 설정 과정
1. [Supabase](https://supabase.com) 접속
2. "New Project" 생성
3. Organization: 선택 또는 생성
4. Name: `creata-mission-game`
5. Database Password: 강력한 비밀번호
6. Region: 가장 가까운 지역 선택

#### 연결 정보
```bash
# Supabase 대시보드에서 획득
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

### 2. AWS RDS 설정

#### RDS 인스턴스 생성
```bash
# AWS CLI로 RDS 생성
aws rds create-db-instance \
  --db-instance-identifier creata-mission-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username creata_admin \
  --master-user-password "SecurePassword123!" \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --backup-retention-period 7 \
  --multi-az false
```

### 3. 데이터베이스 마이그레이션

#### Prisma 마이그레이션
```bash
# 프로덕션 DATABASE_URL 설정
export DATABASE_URL="postgresql://user:password@host:5432/database"

# 마이그레이션 실행
npx prisma migrate deploy

# 데이터 시딩 (옵션)
npx prisma db seed
```

---

## 🌐 도메인 및 SSL 설정

### 1. 도메인 설정

#### DNS 레코드 구성
```bash
# 메인 도메인 (Vercel)
A     yourdomain.com        76.76.19.61
CNAME www.yourdomain.com    yourdomain.com

# API 도메인 (Railway/Render)
CNAME api.yourdomain.com    backend-service.railway.app

# 관리자 도메인
CNAME admin.yourdomain.com  admin-project.vercel.app
```

### 2. SSL 인증서

#### Let's Encrypt (VPS/도커 사용 시)
```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
sudo certbot --nginx -d admin.yourdomain.com

# 자동 갱신 설정
sudo crontab -e
# 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 모니터링 및 유지보수

### 1. 애플리케이션 모니터링

#### Uptime Monitoring
```bash
# UptimeRobot, Pingdom, 또는 StatusCake 사용
# 모니터링 URL:
# - https://api.yourdomain.com/health
# - https://yourdomain.com
# - https://admin.yourdomain.com
```

### 2. 성능 모니터링

#### 데이터베이스 모니터링
```sql
-- 느린 쿠리 감시
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements 
WHERE calls > 100
ORDER BY total_time DESC 
LIMIT 10;
```

---

## ✅ 배포 후 체크리스트

### 기본 기능 테스트
- [ ] 백엔드 API 정상 작동 (https://api.yourdomain.com/health)
- [ ] 프론트엔드 접속 가능 (https://yourdomain.com)
- [ ] 관리자 대시보드 접속 (https://admin.yourdomain.com)
- [ ] PostgreSQL 데이터베이스 연결 정상
- [ ] Prisma 마이그레이션 완료

### 보안 체크
- [ ] HTTPS 설정 완료 (SSL 인증서 유효)
- [ ] 환경변수 보안 설정 완료
- [ ] CORS 설정 적절히 제한됨
- [ ] 비인가 API 엔드포인트 차단
- [ ] 데이터베이스 연결 SSL/TLS 사용

### 성능 체크
- [ ] API 응답시간 2초 이하
- [ ] 프론트엔드 로딩시간 3초 이하
- [ ] 데이터베이스 쿠리 성능 확인
- [ ] CDN 설정 (정적 자산 최적화)

### 기능 테스트
- [ ] 사용자 등록 및 로그인
- [ ] Creata Wallet 연결 테스트
- [ ] 3가지 게임 정상 작동
- [ ] 점수 저장 및 랭킹 업데이트
- [ ] 에어드랍 기능 테스트
- [ ] 관리자 대시보드 모든 기능
- [ ] 다국어 지원 (한글/영어/베트남어/일본어)

### 모니터링 설정
- [ ] Uptime 모니터링 설정 완료
- [ ] 로그 수집 시스템 작동
- [ ] 에러 알림 시스템 테스트
- [ ] 데이터베이스 백업 설정
- [ ] 성능 메트릭 수집

### 비즈니스 체크
- [ ] 텔레그램 봇 연결 테스트
- [ ] CreataChain Catena 네트워크 연결
- [ ] CTA 토큰 에어드랍 테스트
- [ ] 지갑 인증 프로세스 테스트
- [ ] 게임 결과 정확성 검증

---

**🎉 배포 완료!**

모든 체크리스트를 통과하면 CreataChain Mission Game이 성공적으로 배포된 것입니다!