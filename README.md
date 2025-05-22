# CreataChain 기반 텔레그램 미션수행 게임 미니앱

지금 부터 2일간 공개모드 이지만 곧 비공개 전환할 예정임. 
매우 민감한 코드가 들어있고 , 추적가능한 파일이 주입되어 있으니 해킹당하고 싶으신 분은 알아서 하기바람.


## 📋 프로젝트 개요

CreataChain 블록체인 기반의 텔레그램 미니앱으로, 게임형 미션을 수행하고 Creata Wallet 인증을 통해 CTA 토큰 보상을 받을 수 있는 Web3 게임 플랫폼입니다.

## 🎮 게임 종류

### 1. Crypto Binary Options (암호화폐 예측)
- BTC, ETH, CTA 가격의 상승/하락 예측
- 1분 단위 예측 게임
- 연속 맞다ﾷ기 보너스 시스템

### 2. Lazy Derby (느린말 경주)
- 5마리 말 중 1등 예측
- 각 말별 고유 특성 시스템
- 30초 간의 진지한 경주

### 3. Reverse Darts (화살 피하기)
- 45초간 날아오는 화살 피하기
- 액션 기반 실시간 게임
- 난이도별 점수 배율 제공

## 🔗 블록체인 정보

- **네트워크**: Catena (CIP-20) Chain Mainnet
- **RPC URL**: https://cvm.node.creatachain.com
- **Chain ID**: 1000 (0x3E8)
- **Currency**: CTA
- **Explorer**: https://catena.explorer.creatachain.com

## 🔐 지원 지갑

- **Creata Wallet Android**: [Play Store](https://play.google.com/store/apps/details?id=com.creatawallet)
- **Creata Wallet Chrome Extension**: [Chrome Store](https://chromewebstore.google.com/detail/creata-chain/cnggilgmpgkjbkpbpbmkipjblgcdbpea)

## 🌍 다국어 지원

- 영어 (English)
- 한국어 (Korean)
- 베트남어 (Vietnamese)
- 일본어 (Japanese)

## 🚀 시작하기

### 전제 조건
- Node.js 18.0.0 이상
- PostgreSQL 13 이상
- Creata Wallet 설치

### 설치 및 실행

1. **레포지토리 클론**
```bash
git clone https://github.com/foani/mission.git
cd Creata_Mission
```

2. **의존성 설치**
```bash
npm install
```

3. **환경변수 설정**
```bash
cp .env.example .env
# .env 파일을 열어 설정값 수정
```

4. **데이터베이스 설정**
```bash
npm run db:generate
npm run db:push
```

5. **개발 서버 실행**
```bash
npm run dev
```

6. **빌드 및 배포**
```bash
npm run build
npm start
```

## 📚 API 문서

서버 실행 후 다음 URL에서 Swagger API 문서를 확인할 수 있습니다:
- http://localhost:3000/docs

### 주요 API 엔드포인트

- `POST /auth/verify-wallet` - 지갑 서명 인증
- `POST /auth/install-confirm` - 지갑 설치 확인
- `POST /game/submit` - 게임 결과 제출
- `GET /ranking` - 랭킹 조회
- `POST /airdrop/queue` - 보상 대상 등록 (어드민)
- `POST /airdrop/execute` - 에어드랍 실행 (어드민)

## 🛠️ 기술 스택

### 백엔드
- **프레임워크**: Fastify
- **데이터베이스**: PostgreSQL
- **ORM**: Prisma
- **블록체인**: ethers.js
- **인증**: JWT + EIP-191

### 프론트엔드
- **프레임워크**: React + TypeScript
- **연동**: Telegram WebApp SDK
- **스타일링**: Tailwind CSS

## 📊 랭킹 시스템
  격월로 진행 예정 ( 바뀔수 있음)
- **Diamond**: 상위 1% - 월 1000 CTA + 200 USDT ?
- **Platinum**: 상위 5% - 월 500 CTA 
- **Gold**: 상위 10% - 월 200 CTA
- **Silver**: 상위 25% - 월 100 CTA
- **Bronze**: 상위 50% - 월 50 CTA

## 📞 보안

- EIP-191 표준 메시지 서명
- API Rate Limiting (분당 60요청)
- CORS 설정 (텔레그램 도메인만)
- SQL Injection 방지 (Prisma ORM)
- XSS 방지 (입력값 검증)

## 🔍 테스트

```bash
# 단위 테스트 실행
npm test

# 테스트 일시 실행
npm run test:watch
```

## 📦 배포

### Docker
```bash
docker build -t creata-mission .
docker run -p 3000:3000 creata-mission
```

### Railway/Render
1. GitHub 레포지토리 연결
2. 환경변수 설정
3. 자동 배포 확인

## 📝 라이센스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 🤝 배껴가시려면 USDT 주셔요.

 Fork the Project 10,000 USDT

## 링크

- **공식 웹사이트**: https://creatachain.com
- **텔레그램**: https://t.me/creatachain_chat
- **트위터**: 
- **이메일**: kiikiihajohn@gmail.com

---

**만든 이**: Tori Team  
**마지막 업데이트**: 2025년 5월 22일
