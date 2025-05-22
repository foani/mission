 # CreataChain Mission Game - 설치 매뉴얼
 
 ## 📋 목차
 1. [시스템 요구사항](#시스템-요구사항)
 2. [개발 환경 설정](#개발-환경-설정)
 3. [프로젝트 설치](#프로젝트-설치)
 4. [환경 변수 설정](#환경-변수-설정)
 5. [데이터베이스 설정](#데이터베이스-설정)
 6. [개발 서버 실행](#개발-서버-실행)
 7. [문제 해결](#문제-해결)
 
 ---
 
 ## 🖥️ 시스템 요구사항
 
 ### 필수 요구사항
 - **Node.js**: v18.0.0 이상
 - **npm**: v8.0.0 이상 또는 **yarn**: v1.22.0 이상
 - **PostgreSQL**: v14.0 이상
 - **Git**: 최신 버전
 
 ### 권장 개발 환경
 - **OS**: Windows 10/11, macOS 12+, Ubuntu 20.04+
 - **IDE**: Visual Studio Code + TypeScript 확장
 - **Memory**: 8GB RAM 이상
 - **Storage**: 2GB 여유 공간
 
 ### 브라우저 지원
 - Chrome 90+
 - Firefox 85+
 - Safari 14+
 - Edge 90+
 
 ---
 
 ## ⚙️ 개발 환경 설정
 
 ### 1. Node.js 설치
 ```bash
 # Node.js 버전 확인
 node --version  # v18.0.0 이상 필요
 
 # Node.js가 없다면 nvm 사용 권장
 curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
 nvm install 18
 nvm use 18
 ```
 
 ### 2. PostgreSQL 설치
 
 #### Windows
 ```bash
 # Chocolatey 사용
 choco install postgresql
 
 # 또는 공식 설치 프로그램 다운로드
 # https://www.postgresql.org/download/windows/
 ```
 
 #### macOS
 ```bash
 # Homebrew 사용
 brew install postgresql
 brew services start postgresql
 ```
 
 #### Ubuntu/Linux
 ```bash
 sudo apt update
 sudo apt install postgresql postgresql-contrib
 sudo systemctl start postgresql
 sudo systemctl enable postgresql
 ```
 
 ### 3. Git 설정
 ```bash
 git config --global user.name "Your Name"
 git config --global user.email "your.email@example.com"
 
 ---
 
 ## 📦 프로젝트 설치
 
 ### 1. 저장소 클론
 ```bash
 # 프로젝트 클론
 git clone https://github.com/your-org/creata-mission-game.git
 cd creata-mission-game
 
 # 또는 ZIP 다운로드 후 압축 해제
 ```
 
 ### 2. 의존성 설치
 
 #### 백엔드 설치
 ```bash
 cd backend
 npm install
 
 # 또는 yarn 사용
 yarn install
 ```
 
 #### 프론트엔드 설치
 ```bash
 cd ../frontend
 npm install
 ```
 
 #### 관리자 대시보드 설치
 ```bash
 cd ../admin-dashboard
 npm install
 ```
 
 ### 3. 설치 확인
 ```bash
 # 각 디렉터리에서 실행
 npm run type-check  # TypeScript 컴파일 확인
 ```
 
 ---
 
 ## 🔐 환경 변수 설정
 
 ### 1. 백엔드 환경 변수
 ```bash
 cd backend
 cp .env.example .env
 ```
 
 **backend/.env 파일 설정:**
 ```env
 # 데이터베이스 설정
 DATABASE_URL="postgresql://username:password@localhost:5432/creata_mission_db"
 
 # 서버 설정
 PORT=3000
 NODE_ENV=development
 
 # JWT 비밀키 (랜덤 문자열 생성 권장)
 JWT_SECRET="your-super-secret-jwt-key-here"
 
 # CreataChain 네트워크 설정
 CATENA_RPC_URL="https://cvm.node.creatachain.com"
 CATENA_CHAIN_ID=1000
 CATENA_EXPLORER_URL="https://catena.explorer.creatachain.com"
 
 # 지갑 설정 (에어드랍용 - 보안 주의!)
 ADMIN_PRIVATE_KEY="your-admin-wallet-private-key"
 ADMIN_WALLET_ADDRESS="0x..."
 
 # 텔레그램 설정
 TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
 TELEGRAM_BOT_USERNAME="your_bot_username"
 
 # 로깅 설정
 LOG_LEVEL=debug
 ```
 
 ### 2. 프론트엔드 환경 변수
 ```bash
 cd ../frontend
 cp .env.example .env
 ```
 
 **frontend/.env 파일 설정:**
 ```env
 # API 설정
 VITE_API_BASE_URL=http://localhost:3000
 VITE_APP_TITLE="CreataChain Mission Game"
 
 # CreataChain 설정
 VITE_CATENA_RPC_URL="https://cvm.node.creatachain.com"
 VITE_CATENA_CHAIN_ID=1000
 VITE_CATENA_EXPLORER_URL="https://catena.explorer.creatachain.com"
 
 # 텔레그램 WebApp 설정
 VITE_TELEGRAM_BOT_USERNAME="your_bot_username"
 
 # 개발 모드 설정
 VITE_DEV_MODE=true
 ```
 
 ### 3. 관리자 대시보드 환경 변수
 ```bash
 cd ../admin-dashboard
 cp .env.example .env
 ```
 
 **admin-dashboard/.env 파일 설정:**
 ```env
 # API 설정
 VITE_API_BASE_URL=http://localhost:3000
 VITE_APP_TITLE="CreataChain Admin Dashboard"
 
 # 인증 설정
 VITE_ADMIN_DEFAULT_EMAIL="admin@creatachain.com"
 VITE_ADMIN_DEFAULT_PASSWORD="admin123"
 
 # CreataChain 설정
 VITE_CATENA_RPC_URL="https://cvm.node.creatachain.com"
 VITE_CATENA_CHAIN_ID=1000
 ```

---

## 🗄️ 데이터베이스 설정

### 1. PostgreSQL 데이터베이스 생성
```bash
# PostgreSQL 접속
sudo -u postgres psql

# 데이터베이스 및 사용자 생성
CREATE DATABASE creata_mission_db;
CREATE USER creata_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE creata_mission_db TO creata_user;
\q
```

### 2. Prisma 데이터베이스 마이그레이션
```bash
cd backend

# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션 실행
npx prisma migrate dev --name init

# 선택사항: 샘플 데이터 삽입
npx prisma db seed
```

### 3. 데이터베이스 연결 확인
```bash
# 데이터베이스 상태 확인
npx prisma studio
# http://localhost:5555 에서 데이터 확인 가능
```

---

## 🚀 개발 서버 실행

### 1. 백엔드 서버 시작
```bash
cd backend

# 개발 모드로 실행
npm run dev

# 또는 프로덕션 빌드 후 실행
npm run build
npm start
```
**백엔드 서버**: http://localhost:3000

### 2. 프론트엔드 개발 서버 시작
```bash
cd frontend

# 개발 서버 실행
npm run dev
```
**프론트엔드**: http://localhost:5173

### 3. 관리자 대시보드 시작
```bash
cd admin-dashboard

# 개발 서버 실행
npm run dev
```
**관리자 대시보드**: http://localhost:3001

### 4. 전체 서비스 동시 실행
각 서비스는 별도의 터미널에서 다음과 같이 실행할 수 있습니다.
```bash
cd backend && npm run dev       # 백엔드
cd frontend && npm run dev      # 프론트엔드
cd admin-dashboard && npm run dev  # 관리자 대시보드
```

---

## 🔧 문제 해결

### 일반적인 문제들

#### 1. Node.js 버전 충돌
```bash
# nvm으로 Node.js 버전 관리
nvm list
nvm use 18
```

#### 2. 포트 충돌 오류
```bash
# 포트 사용 확인 및 프로세스 종료
netstat -ano | findstr :3000  # Windows
lsof -ti:3000 | xargs kill -9  # macOS/Linux
```

#### 3. PostgreSQL 연결 오류
```bash
# PostgreSQL 서비스 상태 확인
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS

# 연결 테스트
psql -h localhost -U creata_user -d creata_mission_db
```

#### 4. Prisma 관련 오류
```bash
# Prisma 클라이언트 재생성
npx prisma generate --force

# 데이터베이스 리셋 (주의: 데이터 삭제됨)
npx prisma migrate reset
```

#### 5. npm 설치 오류
```bash
# 캐시 정리
npm cache clean --force

# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 6. TypeScript 컴파일 오류
```bash
# TypeScript 설정 확인
npx tsc --noEmit

# 타입 정의 파일 재설치
npm install @types/node @types/react --save-dev
```

### 로그 확인 방법

#### 백엔드 로그
```bash
# 개발 환경
tail -f backend/logs/combined.log

# 에러 로그만
tail -f backend/logs/error.log
```

#### 브라우저 개발자 도구
- **F12** 키로 개발자 도구 열기
- **Console** 탭에서 JavaScript 오류 확인
- **Network** 탭에서 API 호출 상태 확인

### 지원 및 문의

#### 기술 지원
- **이슈 추적**: [GitHub Issues](https://github.com/your-org/creata-mission-game/issues)
- **문서**: [프로젝트 Wiki](https://github.com/your-org/creata-mission-game/wiki)
- **이메일**: dev@creatachain.com

#### 유용한 명령어
```bash
# 프로젝트 상태 확인
npm run health-check

# 의존성 업데이트 확인
npm outdated

# 보안 취약점 검사
npm audit

# 프로젝트 정리
npm run clean
```

---

## ✅ 설치 완료 체크리스트

- [ ] Node.js v18+ 설치 완료
- [ ] PostgreSQL 설치 및 실행 중
- [ ] 프로젝트 클론 완료
- [ ] 모든 의존성 설치 완료
- [ ] 환경 변수 설정 완료
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 백엔드 서버 정상 실행 (http://localhost:3000)
- [ ] 프론트엔드 정상 실행 (http://localhost:5173)
- [ ] 관리자 대시보드 정상 실행 (http://localhost:3001)
- [ ] API 엔드포인트 응답 확인
- [ ] 브라우저에서 정상 접속 확인

설치가 완료되면 [사용 매뉴얼](./USER_MANUAL.md)을 참조하여 애플리케이션 사용법을 확인하세요.

---

**📝 참고사항**
- 프로덕션 배포 시에는 [배포 매뉴얼](./DEPLOYMENT_MANUAL.md)을 참조하세요
- CreataChain 스마트컨트랙트 배포는 [하드햇 가이드](./HARDHAT_GUIDE.md)를 확인하세요
- 개발 중 문제가 발생하면 GitHub Issues에 등록해주세요