 # CreataChain 기반 텔레그램 미션수행 게임 미니앱 Dockerfile
 # Multi-stage build를 사용하여 프론트엔드와 백엔드를 함께 빌드
 
 # Stage 1: 프론트엔드 빌드
 FROM node:20-alpine AS frontend-builder
 
 WORKDIR /app/frontend
 
 # 프론트엔드 의존성 설치
 COPY frontend/package*.json ./
 RUN npm ci
 
 # 프론트엔드 소스 복사 및 빌드
 COPY frontend/ ./
 RUN npm run build
 
 # Stage 2: 백엔드 빌드
 FROM node:20-alpine AS backend-builder
 
 WORKDIR /app/backend
 
 # 백엔드 의존성 설치
 COPY backend/package*.json ./
 RUN npm ci
 
 # 백엔드 소스 복사 및 빌드
 COPY backend/ ./
 RUN npm run build

# Prisma 클라이언트 생성
RUN npx prisma generate

# 필요 없는 개발 패키지 제거
RUN npm prune --omit=dev
 
 # Stage 3: 프로덕션 이미지
 FROM node:20-alpine
 
 # 시스템 의존성 설치
 RUN apk add --no-cache \
     postgresql-client \
     curl \
     && rm -rf /var/cache/apk/*
 
 WORKDIR /app
 
 # 백엔드 프로덕션 파일 복사
 COPY --from=backend-builder /app/backend/dist ./backend/dist
 COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
 COPY --from=backend-builder /app/backend/prisma ./backend/prisma
 COPY --from=backend-builder /app/backend/package*.json ./backend/
 
 # 프론트엔드 빌드 파일 복사 (백엔드에서 정적 파일로 서빙)
 COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
 
 # 환경 변수 설정
 ENV NODE_ENV=production
 ENV PORT=3000
 
 # 사용자 생성 (보안)
 RUN addgroup -g 1001 -S nodejs && \
     adduser -S creata -u 1001
 
 # 앱 파일 권한 설정
 RUN chown -R creata:nodejs /app
 USER creata
 
 # 헬스체크 추가
 HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
     CMD curl -f http://localhost:3000/health || exit 1
 
 # 포트 노출
 EXPOSE 3000
 
 # 시작 스크립트 생성
 COPY --chown=creata:nodejs docker-entrypoint.sh /usr/local/bin/
 RUN chmod +x /usr/local/bin/docker-entrypoint.sh
 
 ENTRYPOINT ["docker-entrypoint.sh"]
 CMD ["node", "backend/dist/index.js"]
