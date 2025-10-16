# Face Timer Backend - Quick Start Guide

## 🚀 빠른 시작 (5분 만에 실행하기)

### 1️⃣ 사전 준비

시스템에 다음이 설치되어 있는지 확인하세요:
- ✅ Node.js (v18 이상)
- ✅ Docker & Docker Compose
- ✅ npm 또는 yarn

### 2️⃣ 프로젝트 설정

```bash
# 1. 프로젝트 디렉토리로 이동
cd /Users/imsang-u/Desktop/git/face-timer-backend

# 2. 의존성 설치
# ⚠️ 이 프로젝트는 NestJS CLI로 의존성을 직접 관리합니다
# 자세한 내용은 DEPENDENCIES.md를 참고하세요

# NestJS CLI 전역 설치
npm install -g @nestjs/cli

# Production 의존성 설치
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/typeorm @nestjs/jwt @nestjs/passport @nestjs/config @nestjs/swagger typeorm pg passport passport-jwt passport-local bcrypt class-validator class-transformer reflect-metadata rxjs

# Development 의존성 설치
npm install -D @nestjs/cli @nestjs/schematics @nestjs/testing @types/node @types/express @types/jest @types/bcrypt @types/passport-jwt @types/passport-local @types/supertest @typescript-eslint/eslint-plugin @typescript-eslint/parser typescript ts-node ts-jest ts-loader tsconfig-paths jest supertest eslint eslint-config-prettier eslint-plugin-prettier prettier source-map-support

# 3. 환境 변수 확인
cat .env
# 필요시 .env 파일 수정 (DB 비밀번호 등)
```

### 3️⃣ 데이터베이스 시작

```bash
# Docker로 PostgreSQL 실행
docker-compose up -d

# 컨테이너 상태 확인
docker-compose ps

# PostgreSQL 로그 확인 (optional)
docker-compose logs postgres
```

### 4️⃣ 애플리케이션 실행

```bash
# 개발 모드로 실행 (Hot Reload 활성화)
npm run start:dev

# 또는 일반 실행
npm run start
```

### 5️⃣ 확인

브라우저에서 다음 URL을 열어보세요:

- **API Swagger 문서**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

---

## 📊 프로젝트 검증

```bash
# 코드 구조 검증
./validate.sh

# TypeScript 컴파일 체크
npm run build

# Linting
npm run lint

# Formatting
npm run format
```

---

## 🧪 첫 API 테스트

### Swagger UI 사용 (추천)

1. http://localhost:3000/api/docs 접속
2. 우측 상단 "Authorize" 버튼 클릭
3. 회원가입 → 로그인 → 토큰 복사 → Authorize 입력
4. 각 엔드포인트 테스트

### cURL 사용

```bash
# 1. 회원가입
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# 2. 로그인
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 응답에서 accessToken 복사

# 3. 작업 생성 (Bearer Token 필요)
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -d '{
    "title": "내 첫 작업",
    "icon": "📝",
    "color": "#3B82F6"
  }'

# 4. 타이머 시작
curl -X POST http://localhost:3000/timer/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -d '{
    "taskId": "<TASK_ID>"
  }'

# 5. 현재 활성 타이머 조회
curl http://localhost:3000/timer/active \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

---

## 🛠️ 개발 명령어

```bash
# 개발 서버 (Hot Reload)
npm run start:dev

# 디버그 모드
npm run start:debug

# 프로덕션 빌드
npm run build
npm run start:prod

# 테스트
npm run test
npm run test:watch
npm run test:cov

# 코드 품질
npm run lint
npm run format
```

---

## 🐳 Docker 명령어

```bash
# PostgreSQL 시작
docker-compose up -d

# PostgreSQL 중지
docker-compose down

# PostgreSQL 중지 + 볼륨 삭제 (데이터 초기화)
docker-compose down -v

# 로그 확인
docker-compose logs -f postgres

# PostgreSQL 접속
docker exec -it face-timer-postgres psql -U postgres -d face_timer
```

---

## 📁 프로젝트 구조 요약

```
face-timer-backend/
├── src/
│   ├── auth/              # 인증 모듈 (JWT, Refresh Token)
│   ├── users/             # 사용자 관리
│   ├── tasks/             # 작업 관리
│   ├── timer/             # 타이머 세션
│   ├── statistics/        # 통계 (구현 예정)
│   ├── health/            # 헬스 체크
│   ├── common/            # 공통 (Guards, Decorators)
│   ├── app.module.ts      # 루트 모듈
│   └── main.ts            # 엔트리 포인트
├── .env                   # 환경 변수
├── package.json           # 의존성
├── docker-compose.yml     # PostgreSQL 컨테이너
└── README.md              # 프로젝트 문서
```

---

## 🔐 기본 인증 플로우

```
1. 회원가입 → POST /auth/register
2. 로그인   → POST /auth/login (accessToken + refreshToken 받음)
3. API 호출 → Header: Authorization: Bearer <accessToken>
4. 토큰 만료 → POST /auth/refresh (새 accessToken 받음)
5. 로그아웃 → POST /auth/logout
```

---

## ⚠️ 문제 해결

### 포트 충돌 (3000)
```bash
# 다른 포트 사용
PORT=4000 npm run start:dev
```

### PostgreSQL 연결 실패
```bash
# 컨테이너 재시작
docker-compose restart postgres

# 컨테이너 로그 확인
docker-compose logs postgres
```

### TypeORM synchronize 오류
```bash
# .env에서 확인
NODE_ENV=development  # synchronize: true
NODE_ENV=production   # synchronize: false (운영 환경에서는 마이그레이션 사용)
```

---

## 📚 추가 문서

- **개발자 가이드**: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - 전체 시스템 아키텍처 및 구현 상세
- **README**: [README.md](./README.md) - 프로젝트 개요 및 설명
- **API 문서**: http://localhost:3000/api/docs - Swagger UI

---

## 🎯 다음 단계

1. ✅ **기본 설정 완료** - 프로젝트 실행 및 테스트
2. 🔄 **Statistics 모듈 구현** - 사용자 통계 및 분석
3. 🏆 **Ranking 모듈 구현** - 랭킹 시스템
4. 🧪 **테스트 코드 작성** - Unit & E2E Tests
5. 🚀 **배포 준비** - Docker, CI/CD 설정

---

Happy Coding! 🎉
