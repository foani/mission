 #!/bin/sh
 # CreataChain 게임 미니앱 Docker 엔트리포인트 스크립트
 
 set -e
 
 echo "🚀 Starting CreataChain Mission Game MiniApp..."
 
 # 데이터베이스 연결 대기
 echo "⏳ Waiting for database connection..."
 cd /app/backend
 
 # DATABASE_URL이 설정되어 있는지 확인
 if [ -z "$DATABASE_URL" ]; then
     echo "❌ ERROR: DATABASE_URL environment variable is not set"
     exit 1
 fi
 
 # 데이터베이스 연결 테스트 (최대 30초 대기)
 echo "🔌 Testing database connection..."
 for i in $(seq 1 30); do
     if npx prisma db push --accept-data-loss --skip-generate 2>/dev/null; then
         echo "✅ Database connected successfully"
         break
     fi
     echo "⏳ Attempt $i: Database not ready yet, waiting 1 second..."
     sleep 1
 done
 
 # 최종 연결 테스트
 if ! npx prisma db push --accept-data-loss --skip-generate >/dev/null 2>&1; then
     echo "❌ ERROR: Could not connect to database after 30 seconds"
     exit 1
 fi
 
 # Prisma 마이그레이션 실행
 echo "🔄 Running database migrations..."
 npx prisma db push --accept-data-loss
 
 # 시드 데이터 투입 (선택적)
 if [ "$SEED_DB" = "true" ]; then
     echo "🌱 Seeding database..."
     if [ -f "prisma/seed.ts" ]; then
         npx tsx prisma/seed.ts
     else
         echo "⚠️  No seed file found, skipping seeding"
     fi
 fi
 
 echo "✅ Database setup completed"
 
 # 환경 변수 검증
 echo "🔍 Validating environment variables..."
 
required_vars="DATABASE_URL JWT_SECRET CATENA_PRIVATE_KEY CATENA_RPC_URL"
 for var in $required_vars; do
     if [ -z "$(eval echo \$$var)" ]; then
         echo "❌ ERROR: Required environment variable $var is not set"
         exit 1
     fi
 done
 
 echo "✅ All required environment variables are set"
 
 # 포트 검증
 if [ -z "$PORT" ]; then
     export PORT=3000
 fi
 
 echo "🌐 Server will start on port $PORT"
 
 # 헬스체크 엔드포인트 확인용 로그
 echo "💡 Health check endpoint: http://localhost:$PORT/health"
 
 # 로그 레벨 설정
 if [ -z "$LOG_LEVEL" ]; then
     export LOG_LEVEL=info
 fi
 
 echo "📝 Log level set to: $LOG_LEVEL"
 
 # 앱 시작
 echo "🎮 Starting CreataChain Mission Game server..."
 echo "=================================================="
 
 # 전달받은 명령어 실행
 exec "$@"
