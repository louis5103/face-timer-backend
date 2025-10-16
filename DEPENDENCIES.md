# Face Timer Backend - 의존성 설치 가이드

이 프로젝트는 NestJS CLI를 사용하여 의존성을 직접 관리합니다.

## 🚀 프로젝트 초기화

### 1단계: NestJS 프로젝트 초기화

```bash
# 프로젝트 디렉토리로 이동
cd /Users/imsang-u/Desktop/git/face-timer-backend

# NestJS CLI 전역 설치 (아직 설치 안 했다면)
npm install -g @nestjs/cli

# NestJS 프로젝트 초기화 (기본 의존성 자동 설치)
# 주의: 이미 src/ 폴더가 있으므로 덮어쓰지 않도록 주의
nest new . --skip-git
```

또는 수동으로:

```bash
# package.json 생성
npm init -y

# NestJS 핵심 의존성 설치
npm install @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs
```

---

## 📦 필수 의존성 설치

### TypeORM & PostgreSQL

```bash
npm install @nestjs/typeorm typeorm pg
```

### 인증 (JWT, Passport)

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
npm install bcrypt
npm install -D @types/passport-jwt @types/passport-local @types/bcrypt
```

### 설정 관리

```bash
npm install @nestjs/config
```

### 유효성 검증 & 변환

```bash
npm install class-validator class-transformer
```

### API 문서 (Swagger)

```bash
npm install @nestjs/swagger
```

---

## 🛠️ 개발 의존성 설치

### TypeScript & Build Tools

```bash
npm install -D @nestjs/cli @nestjs/schematics
npm install -D typescript ts-node ts-loader tsconfig-paths
npm install -D @types/node @types/express
```

### 테스팅

```bash
npm install -D @nestjs/testing jest ts-jest @types/jest
npm install -D supertest @types/supertest
```

### 코드 품질 (ESLint & Prettier)

```bash
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

### 기타 유틸리티

```bash
npm install -D source-map-support
```

---

## 📋 전체 명령어 (한번에 실행)

### Production Dependencies

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

### Development Dependencies

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

---

## 📝 Package.json Scripts 추가

설치 후 `package.json`의 `scripts` 섹션에 다음을 추가하세요:

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
  }
}
```

---

## ✅ 설치 확인

```bash
# 설치된 패키지 확인
npm list --depth=0

# TypeScript 버전 확인
npx tsc --version

# NestJS CLI 버전 확인
nest --version
```

---

## 🚀 다음 단계

의존성 설치가 완료되면:

1. **데이터베이스 시작**
   ```bash
   docker-compose up -d
   ```

2. **개발 서버 실행**
   ```bash
   npm run start:dev
   ```

3. **API 문서 확인**
   - http://localhost:3000/api/docs

---

## 📦 버전 정보 (권장)

프로젝트는 다음 버전에서 테스트되었습니다:

- **Node.js**: v18.x 이상
- **NestJS**: v10.x
- **TypeScript**: v5.x
- **TypeORM**: v0.3.x
- **PostgreSQL**: v14.x

---

## 🔧 문제 해결

### Peer Dependencies 경고

```bash
# Peer dependencies를 자동으로 설치
npm install --legacy-peer-deps
```

### 버전 충돌

```bash
# 특정 버전 설치
npm install @nestjs/common@^10.0.0
```

### 캐시 문제

```bash
# npm 캐시 정리
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 참고 문서

- **NestJS 공식 문서**: https://docs.nestjs.com
- **TypeORM 문서**: https://typeorm.io
- **Passport 문서**: http://www.passportjs.org

---

**설치 완료 후 QUICKSTART.md를 참고하여 개발을 시작하세요!**
