# 🚀 Face Timer Backend - 설치 및 실행 가이드

## ⚡ 빠른 설치 (복사/붙여넣기)

```bash
# 1. 프로젝트 디렉토리로 이동
cd /Users/imsang-u/Desktop/git/face-timer-backend

# 2. NestJS CLI 전역 설치
npm install -g @nestjs/cli

# 3. Production 의존성 설치 (한 줄)
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/typeorm @nestjs/jwt @nestjs/passport @nestjs/config @nestjs/swagger typeorm pg passport passport-jwt passport-local bcrypt class-validator class-transformer reflect-metadata rxjs

# 4. Development 의존성 설치 (한 줄)
npm install -D @nestjs/cli @nestjs/schematics @nestjs/testing @types/node @types/express @types/jest @types/bcrypt @types/passport-jwt @types/passport-local @types/supertest @typescript-eslint/eslint-plugin @typescript-eslint/parser typescript ts-node ts-jest ts-loader tsconfig-paths jest supertest eslint eslint-config-prettier eslint-plugin-prettier prettier source-map-support

# 5. PostgreSQL 시작
docker-compose up -d

# 6. 개발 서버 실행
npm run start:dev
```

**완료!** 브라우저에서 http://localhost:3000/api/docs 를 열어보세요.

---

## 📋 단계별 상세 설명

### Step 1: NestJS CLI 설치

```bash
npm install -g @nestjs/cli

# 설치 확인
nest --version
```

### Step 2: Production 의존성

다음 명령어로 필수 런타임 라이브러리를 설치합니다:

```bash
npm install \
  @nestjs/common \
  @nestjs/core \
  @nestjs/platform-express \
  @nestjs/typeorm \
  @nestjs/jwt \
  @nestjs/passport \
  @nestjs/config \
  @nestjs/swagger \
  typeorm \
  pg \
  passport \
  passport-jwt \
  passport-local \
  bcrypt \
  class-validator \
  class-transformer \
  reflect-metadata \
  rxjs
```

**설치되는 항목:**
- NestJS 핵심 모듈
- TypeORM + PostgreSQL 드라이버
- JWT 인증 (Passport)
- 설정 관리 (@nestjs/config)
- API 문서화 (Swagger)
- 유효성 검증 (class-validator)

### Step 3: Development 의존성

다음 명령어로 개발 도구를 설치합니다:

```bash
npm install -D \
  @nestjs/cli \
  @nestjs/schematics \
  @nestjs/testing \
  @types/node \
  @types/express \
  @types/jest \
  @types/bcrypt \
  @types/passport-jwt \
  @types/passport-local \
  @types/supertest \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  typescript \
  ts-node \
  ts-jest \
  ts-loader \
  tsconfig-paths \
  jest \
  supertest \
  eslint \
  eslint-config-prettier \
  eslint-plugin-prettier \
  prettier \
  source-map-support
```

**설치되는 항목:**
- TypeScript 컴파일러 및 도구
- 테스팅 프레임워크 (Jest)
- 코드 품질 도구 (ESLint, Prettier)
- TypeScript 타입 정의 파일

### Step 4: Package.json Scripts 추가

`package.json` 파일의 `scripts` 섹션에 다음을 추가하세요:

```json
{
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

### Step 5: 환경 변수 확인

`.env` 파일이 올바르게 설정되어 있는지 확인하세요:

```bash
cat .env
```

필요시 데이터베이스 정보를 수정하세요:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=face_timer
```

### Step 6: PostgreSQL 시작

Docker Compose로 PostgreSQL을 실행합니다:

```bash
# PostgreSQL 컨테이너 시작
docker-compose up -d

# 컨테이너 상태 확인
docker-compose ps

# 로그 확인 (optional)
docker-compose logs postgres
```

### Step 7: 애플리케이션 실행

```bash
# 개발 모드 (Hot Reload 활성화)
npm run start:dev

# 일반 모드
npm run start

# 프로덕션 모드
npm run build
npm run start:prod
```

---

## ✅ 설치 확인

### 1. 의존성 확인

```bash
# 설치된 패키지 목록
npm list --depth=0

# TypeScript 버전
npx tsc --version

# NestJS CLI 버전
nest --version
```

### 2. 컴파일 확인

```bash
# TypeScript 컴파일 테스트
npm run build

# 빌드된 파일 확인
ls dist/
```

### 3. 서버 실행 확인

```bash
# 개발 서버 시작
npm run start:dev

# 다른 터미널에서 Health Check
curl http://localhost:3000/health
```

**예상 결과:**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" }
  }
}
```

### 4. Swagger 문서 확인

브라우저에서 다음 URL을 열어보세요:
- **Swagger UI**: http://localhost:3000/api/docs

---

## 🔧 문제 해결

### 문제 1: Peer Dependencies 경고

```bash
npm install --legacy-peer-deps
```

### 문제 2: TypeScript 버전 충돌

```bash
npm install typescript@latest --save-dev
```

### 문제 3: PostgreSQL 연결 실패

```bash
# 컨테이너 재시작
docker-compose restart postgres

# 컨테이너 로그 확인
docker-compose logs postgres

# 컨테이너 상태 확인
docker-compose ps
```

### 문제 4: 포트 충돌 (3000)

```bash
# .env 파일 수정
PORT=4000

# 또는 실행 시 지정
PORT=4000 npm run start:dev
```

### 문제 5: node_modules 문제

```bash
# 완전히 재설치
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 📊 설치 후 확인사항

다음 항목들이 정상적으로 설치되었는지 확인하세요:

- ✅ `node_modules/` 디렉토리 존재
- ✅ `package-lock.json` 파일 생성
- ✅ `nest --version` 명령어 동작
- ✅ `npm run start:dev` 실행 가능
- ✅ PostgreSQL 컨테이너 실행 중
- ✅ http://localhost:3000/api/docs 접속 가능

---

## 🎯 다음 단계

설치가 완료되었다면:

1. **API 테스트**
   - Swagger UI에서 회원가입/로그인 테스트
   - cURL이나 Postman으로 API 호출

2. **코드 탐색**
   - DEVELOPER_GUIDE.md - 전체 아키텍처 이해
   - 각 모듈의 코드 살펴보기

3. **추가 개발**
   - Statistics Module 구현
   - Ranking Module 구현
   - 테스트 코드 작성

---

## 📚 참고 문서

- [DEPENDENCIES.md](./DEPENDENCIES.md) - 의존성 상세 설명
- [QUICKSTART.md](./QUICKSTART.md) - 빠른 시작 가이드
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - 개발자 가이드
- [README.md](./README.md) - 프로젝트 개요

---

**설치에 성공하셨나요?** 🎉

이제 `npm run start:dev`를 실행하고 http://localhost:3000/api/docs 에서 API를 테스트해보세요!
