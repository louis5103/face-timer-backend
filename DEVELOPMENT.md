# Face Timer Backend - Developer Documentation

## 📋 목차
1. [시스템 아키텍처](#시스템-아키텍처)
2. [데이터베이스 설계](#데이터베이스-설계)
3. [모듈별 상세 구조](#모듈별-상세-구조)
4. [인증 시스템](#인증-시스템)
5. [타이머 시스템](#타이머-시스템)
6. [API 엔드포인트](#api-엔드포인트)
7. [코드 패턴 및 규칙](#코드-패턴-및-규칙)

---

## 시스템 아키텍처

### 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Application                       │
│                    (Web / Mobile Frontend)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/HTTPS
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NestJS Application                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  Global JWT Guard (APP_GUARD)                 │
│  │   Guards     │  ↓ All routes protected by default            │
│  │  Middleware  │  @Public() decorator for exceptions           │
│  └──────────────┘                                               │
├─────────────────────────────────────────────────────────────────┤
│                          Controllers                            │
│  ┌─────────┬─────────┬─────────┬─────────┬──────────────┐       │
│  │  Auth   │  Users  │  Tasks  │  Timer  │  Statistics  │       │
│  │Controlle│Controlle│Controlle│Controlle│  Controller  │       │
│  └────┬────┴────┬────┴────┬────┴────┬────┴──────┬───────┘       │
├───────┼─────────┼─────────┼─────────┼───────────┼───────────────┤
│       ▼         ▼         ▼         ▼           ▼               │
│                          Services                               │
│  ┌─────────┬─────────┬─────────┬─────────┬──────────────┐       │
│  │  Auth   │  Users  │  Tasks  │  Timer  │  Statistics  │       │
│  │ Service │ Service │ Service │ Service │   Service    │       │
│  └────┬────┴────┬────┴────┬────┴────┬────┴──────┬───────┘       │
├───────┼─────────┼─────────┼─────────┼───────────┼───────────────┤
│       ▼         ▼         ▼         ▼           ▼               │
│                      TypeORM Repositories                       │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  User │ RefreshToken │ Task │ TimerSession │ etc.   │        │
│  └──────────────────────┬──────────────────────────────┘        │
└─────────────────────────┼───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐       │
│  │  users   │ refresh  │  tasks   │  timer   │ session  │       │
│  │          │ _tokens  │          │ _sessions│ _pauses  │       │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘       │ 
└─────────────────────────────────────────────────────────────────┘
```

### 레이어 아키텍처

```
┌────────────────────────────────────────────────────────┐
│                   Presentation Layer                   │
│  - Controllers: HTTP 요청/응답 처리                       │
│  - DTOs: 데이터 검증 및 변환                               │
│  - Guards: 인증/인가 검증                                 │
│  - Decorators: 메타데이터 및 파라미터 추출                   │
└────────────────────────────────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────┐
│                    Business Logic Layer                │
│  - Services: 비즈니스 로직 처리                             │
│  - Domain Logic: 엔티티 메서드 및 헬퍼                      │ 
│  - Validation: 비즈니스 규칙 검증                           │
└────────────────────────────────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────┐
│                   Data Access Layer                    │
│  - Repositories: 데이터베이스 접근                          │
│  - Entities: 데이터 모델 정의                              │
│  - TypeORM: ORM 쿼리 및 관계 관리                          │
└────────────────────────────────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────┐
│                    Database Layer                      │
│  - PostgreSQL: 데이터 저장소                              │
└────────────────────────────────────────────────────────┘
```

---

## 데이터베이스 설계

### ERD (Entity Relationship Diagram)

```
┌─────────────────────────┐
│        users            │
├─────────────────────────┤
│ id (PK)                 │ ◄──────────┐
│ email (UNIQUE)          │            │
│ password                │            │ 1
│ name                    │            │
│ avatar                  │            │
│ timezone                │            │
│ settings (JSONB)        │            │
│ status (ENUM)           │            │
│ created_at              │            │
│ updated_at              │            │
│ deleted_at              │            │
└─────────────────────────┘            │
         │                             │
         │ 1                           │
         │                             │
         │ N                           │
         ▼                             │
┌─────────────────────────┐            │
│    refresh_tokens       │            │
├─────────────────────────┤            │
│ id (PK)                 │            │
│ user_id (FK) ───────────┼────────────┘
│ token (UNIQUE)          │
│ expires_at              │
│ is_revoked              │
│ created_at              │
└─────────────────────────┘


┌─────────────────────────┐
│        users            │
├─────────────────────────┤
│ id (PK)                 │ ◄──────────┐
└─────────────────────────┘            │
         │                             │ 1
         │ 1                           │
         │                             │
         │ N                           │
         ▼                             │
┌─────────────────────────┐            │
│        tasks            │            │
├─────────────────────────┤            │
│ id (PK)                 │            │
│ user_id (FK) ───────────┼────────────┘
│ title                   │ ◄──────────┐
│ icon                    │            │
│ color                   │            │ 1
│ is_active               │            │
│ total_time              │            │
│ last_used               │            │
│ created_at              │            │
│ updated_at              │            │
└─────────────────────────┘            │
                                       │
                                       │ N
┌─────────────────────────┐            │
│    timer_sessions       │            │
├─────────────────────────┤            │
│ id (PK)                 │            │
│ user_id (FK)            │            │
│ task_id (FK, NULLABLE)──┼────────────┘
│ start_time              │ ◄──────────┐
│ end_time                │            │
│ duration                │            │ 1
│ pause_count             │            │
│ total_pause_time        │            │
│ status (ENUM)           │            │
│ face_stats_summary      │            │
│ created_at              │            │
│ updated_at              │            │
└─────────────────────────┘            │
                                       │ N
                                       │
┌─────────────────────────┐            │
│    session_pauses       │            │
├─────────────────────────┤            │
│ id (PK)                 │            │
│ session_id (FK) ────────┼────────────┘
│ pause_start             │
│ pause_end               │
│ duration                │
│ created_at              │
└─────────────────────────┘
```

### 테이블 상세 정보

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hashed
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(500),
  timezone VARCHAR(50) DEFAULT 'UTC',
  settings JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active',  -- ENUM: active, inactive, suspended
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP  -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
```

#### refresh_tokens
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_revoked ON refresh_tokens(user_id, is_revoked);
```

#### tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  icon VARCHAR(100),
  color VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  total_time BIGINT DEFAULT 0,  -- 초 단위
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_user_active ON tasks(user_id, is_active);
CREATE INDEX idx_tasks_user_lastused ON tasks(user_id, last_used);
```

#### timer_sessions
```sql
CREATE TABLE timer_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration INTEGER DEFAULT 0,  -- 초 단위
  pause_count INTEGER DEFAULT 0,
  total_pause_time INTEGER DEFAULT 0,  -- 초 단위
  status VARCHAR(20) DEFAULT 'active',  -- ENUM: active, paused, completed, cancelled
  face_stats_summary JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_timer_sessions_user ON timer_sessions(user_id);
CREATE INDEX idx_timer_sessions_user_status ON timer_sessions(user_id, status);
CREATE INDEX idx_timer_sessions_task_start ON timer_sessions(task_id, start_time);
CREATE INDEX idx_timer_sessions_user_start ON timer_sessions(user_id, start_time);
```

#### session_pauses
```sql
CREATE TABLE session_pauses (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES timer_sessions(id) ON DELETE CASCADE,
  pause_start TIMESTAMP NOT NULL,
  pause_end TIMESTAMP,
  duration INTEGER,  -- 초 단위
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_pauses_session_start ON session_pauses(session_id, pause_start);
```

---

## 모듈별 상세 구조

### 1. Auth Module (인증 모듈)

#### 구조
```
auth/
├── dto/
│   ├── register.dto.ts          # 회원가입 DTO
│   ├── login.dto.ts              # 로그인 DTO
│   ├── refresh-token.dto.ts      # 토큰 갱신 DTO
│   ├── auth-response.dto.ts      # 응답 DTO
│   └── index.ts
├── entities/
│   ├── refresh-token.entity.ts   # RefreshToken 엔티티
│   └── index.ts
├── strategies/
│   ├── local.strategy.ts         # 이메일/비밀번호 검증
│   ├── jwt.strategy.ts           # Access Token 검증
│   ├── jwt-refresh.strategy.ts   # Refresh Token 검증
│   └── index.ts
├── auth.controller.ts            # HTTP 엔드포인트
├── auth.service.ts               # 비즈니스 로직
└── auth.module.ts                # 모듈 정의
```

#### 동작 원리

##### 1. 회원가입 플로우
```
Client                Controller           Service            UsersService
  │                      │                    │                     │
  │  POST /auth/register │                    │                     │
  ├─────────────────────►│                    │                     │
  │  RegisterDto         │                    │                     │
  │                      │  register()        │                     │
  │                      ├───────────────────►│                     │
  │                      │                    │  create()           │
  │                      │                    ├────────────────────►│
  │                      │                    │                     │
  │                      │                    │  ◄bcrypt password   │
  │                      │                    │  ◄save to DB        │
  │                      │                    │                     │
  │                      │                    │  User Entity        │
  │                      │                    │◄────────────────────┤
  │                      │                    │                     │
  │                      │  ◄generate tokens  │                     │
  │                      │  ◄create refresh   │                     │
  │                      │   token in DB      │                     │
  │                      │                    │                     │
  │                      │  AuthResponse      │                     │
  │                      │◄───────────────────┤                     │
  │  AuthResponse        │                    │                     │
  │◄─────────────────────┤                    │                     │
  │  {accessToken,       │                    │                     │
  │   refreshToken,      │                    │                     │
  │   user, expiresIn}   │                    │                     │
```

##### 2. 로그인 플로우
```
Client              Guard          Strategy        Service
  │                   │                │               │
  │  POST /login      │                │               │
  ├──────────────────►│                │               │
  │  LoginDto         │                │               │
  │                   │                │               │
  │              LocalAuthGuard        │               │
  │                   │                │               │
  │                   │  validate()    │               │
  │                   ├───────────────►│               │
  │                   │  email, pwd    │               │
  │                   │                │  validateUser()
  │                   │                ├──────────────►│
  │                   │                │               │
  │                   │                │  ◄find user   │
  │                   │                │  ◄compare pwd │
  │                   │                │               │
  │                   │  User obj      │               │
  │                   │◄───────────────┤               │
  │                   │                │               │
  │         req.user = User            │               │
  │                   │                │               │
  │      Controller.login()            │               │
  │                   │                │  login()      │
  │                   │                ├──────────────►│
  │                   │                │               │
  │                   │                │ ◄gen tokens   │
  │                   │                │ ◄save refresh │
  │                   │                │               │
  │                   │  AuthResponse  │               │
  │                   │◄───────────────┴───────────────┤
  │  AuthResponse     │                                │
  │◄──────────────────┤                                │
```

##### 3. Refresh Token Rotation
```
Client              Guard           Strategy         Service
  │                   │                 │                │
  │  POST /refresh    │                 │                │
  ├──────────────────►│                 │                │
  │  {refreshToken}   │                 │                │
  │                   │                 │                │
  │          JwtRefreshGuard            │                │
  │                   │                 │                │
  │                   │   validate()    │                │
  │                   ├────────────────►│                │
  │                   │   payload +     │                │
  │                   │   refreshToken  │                │
  │                   │                 │                │
  │                   │   validated     │                │
  │                   │◄────────────────┤                │
  │                   │                 │                │
  │      Controller.refresh()           │                │
  │                   │                 │  refresh()     │
  │                   │                 ├───────────────►│
  │                   │                 │                │
  │                   │                 │ 1. Find token  │
  │                   │                 │ 2. Validate    │
  │                   │                 │ 3. REVOKE old  │
  │                   │                 │ 4. Generate new│
  │                   │                 │ 5. Save new    │
  │                   │                 │                │
  │                   │  New tokens     │                │
  │                   │◄────────────────┴────────────────┤
  │  RefreshResponse  │                                  │
  │◄──────────────────┤                                  │
  │  {accessToken,    │                                  │
  │   refreshToken,   │                                  │
  │   expiresIn}      │                                  │
```

#### 핵심 코드 구조

**AuthService 주요 메서드**
```typescript
class AuthService {
  // 1. 회원가입
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // - UsersService로 사용자 생성
    // - 토큰 생성 (generateAuthResponse)
    // - DB에 refresh token 저장
  }

  // 2. 로그인
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // - 이메일로 사용자 조회 (+ password)
    // - 비밀번호 검증 (bcrypt.compare)
    // - 토큰 생성
  }

  // 3. Local Strategy용 검증
  async validateUser(email: string, password: string): Promise<User> {
    // - 사용자 조회
    // - 비밀번호 검증
    // - 사용자 반환 (password 제외)
  }

  // 4. 토큰 갱신 (Token Rotation)
  async refreshAccessToken(dto: RefreshTokenDto): Promise<RefreshResponseDto> {
    // - DB에서 refresh token 조회
    // - 유효성 검증 (expired, revoked)
    // - 기존 토큰 revoke (isRevoked = true)
    // - 새 토큰 쌍 생성
  }

  // 5. 로그아웃
  async logout(userId: string): Promise<void> {
    // - 사용자의 모든 refresh token revoke
  }

  // 6. Access Token 생성
  private generateAccessToken(userId: string, email: string): string {
    // - JWT payload: { sub: userId, email }
    // - 만료시간: JWT_EXPIRATION (900s = 15분)
  }

  // 7. Refresh Token 생성
  private async generateRefreshToken(userId: string): Promise<RefreshToken> {
    // - 랜덤 64 bytes 생성 (crypto)
    // - 만료시간: JWT_REFRESH_EXPIRATION (604800s = 7일)
    // - DB에 저장
  }
}
```

**Strategies**
```typescript
// 1. LocalStrategy - 로그인 시 email/password 검증
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  async validate(email: string, password: string): Promise<User> {
    // AuthService.validateUser() 호출
    // 검증 실패 시 UnauthorizedException
  }
}

// 2. JwtStrategy - Access Token 검증
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  async validate(payload: JwtPayload): Promise<User> {
    // payload에서 userId 추출
    // UsersService로 사용자 조회
    // 사용자 반환 → req.user에 저장됨
  }
}

// 3. JwtRefreshStrategy - Refresh Token 검증
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  async validate(req: Request, payload: any): Promise<any> {
    // request body에서 refreshToken 추출
    // payload + refreshToken 반환
  }
}
```

---

### 2. Users Module (사용자 모듈)

#### 구조
```
users/
├── dto/
│   ├── create-user.dto.ts        # 사용자 생성 DTO
│   ├── update-user.dto.ts        # 사용자 수정 DTO
│   ├── user-response.dto.ts      # 응답 DTO
│   └── index.ts
├── entities/
│   ├── user.entity.ts            # User 엔티티
│   └── index.ts
├── users.controller.ts           # HTTP 엔드포인트
├── users.service.ts              # 비즈니스 로직
└── users.module.ts               # 모듈 정의
```

#### User Entity 구조

```typescript
@Entity('users')
export class User {
  id: string;              // UUID
  email: string;           // UNIQUE, 로그인 ID
  password: string;        // bcrypt hashed, select: false
  name: string;            // 사용자 이름
  avatar: string;          // 프로필 이미지 URL (nullable)
  timezone: string;        // 타임존 (기본: UTC)
  settings: object;        // JSONB, 사용자 설정
  status: UserStatus;      // ENUM: active, inactive, suspended
  createdAt: Date;         // 생성 시간
  updatedAt: Date;         // 수정 시간
  deletedAt: Date;         // Soft Delete (nullable)

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // password가 bcrypt hash가 아니면 hash 처리
    // $2b$로 시작하는지 체크
  }

  // Methods
  async validatePassword(plainPassword: string): Promise<boolean> {
    // bcrypt.compare로 비밀번호 검증
  }
}
```

#### UsersService 주요 메서드

```typescript
class UsersService {
  // 1. 사용자 생성
  async create(dto: CreateUserDto): Promise<User> {
    // - 이메일 중복 체크
    // - User 엔티티 생성
    // - BeforeInsert Hook에서 자동 비밀번호 해싱
    // - DB 저장
  }

  // 2. 사용자 조회 (password 제외)
  async findOne(id: string): Promise<User> {
    // - ID로 조회
    // - password는 select: false라 자동 제외
  }

  // 3. 이메일로 조회 (password 포함)
  async findByEmailWithPassword(email: string): Promise<User> {
    // - QueryBuilder 사용
    // - .addSelect('user.password') 명시
    // - 로그인 검증에 사용
  }

  // 4. 사용자 수정
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    // - 사용자 조회
    // - 이메일 변경 시 중복 체크
    // - Object.assign으로 필드 업데이트
    // - BeforeUpdate Hook에서 비밀번호 해싱
    // - 저장
  }

  // 5. 사용자 삭제 (Soft Delete)
  async remove(id: string): Promise<void> {
    // - softRemove() 사용
    // - deletedAt에 현재 시간 설정
  }
}
```

---

### 3. Tasks Module (작업 모듈)

#### 구조
```
tasks/
├── dto/
│   ├── create-task.dto.ts        # 작업 생성 DTO
│   ├── update-task.dto.ts        # 작업 수정 DTO
│   ├── task-response.dto.ts      # 응답 DTO
│   └── index.ts
├── entities/
│   ├── task.entity.ts            # Task 엔티티
│   └── index.ts
├── tasks.controller.ts           # HTTP 엔드포인트
├── tasks.service.ts              # 비즈니스 로직
└── tasks.module.ts               # 모듈 정의
```

#### Task Entity 구조

```typescript
@Entity('tasks')
export class Task {
  id: string;              // UUID
  userId: string;          // FK to users
  user: User;              // ManyToOne relation
  title: string;           // 작업 제목 (최대 200자)
  icon: string;            // 이모지/아이콘 (nullable)
  color: string;           // Hex 컬러코드 (nullable)
  isActive: boolean;       // 활성/비활성 (기본: true)
  totalTime: number;       // 누적 시간 (초 단위)
  lastUsed: Date;          // 마지막 사용 시간 (nullable)
  createdAt: Date;         // 생성 시간
  updatedAt: Date;         // 수정 시간

  // Indexes:
  // - user_id
  // - user_id + is_active
  // - user_id + last_used
}
```

#### TasksService 주요 메서드

```typescript
class TasksService {
  // 1. 작업 생성
  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    // - Task 엔티티 생성 (userId 포함)
    // - DB 저장
  }

  // 2. 모든 작업 조회
  async findAll(userId: string): Promise<Task[]> {
    // - userId로 필터링
    // - 정렬: lastUsed DESC, createdAt DESC
  }

  // 3. 활성 작업만 조회
  async findAllActive(userId: string): Promise<Task[]> {
    // - userId + isActive: true
    // - 정렬: lastUsed DESC, createdAt DESC
  }

  // 4. 단일 작업 조회 (소유권 검증)
  async findOne(id: string, userId: string): Promise<Task> {
    // - ID로 조회
    // - 소유권 검증 (task.userId === userId)
    // - 실패 시 ForbiddenException
  }

  // 5. 작업 수정
  async update(id: string, userId: string, dto: UpdateTaskDto): Promise<Task> {
    // - findOne으로 조회 + 검증
    // - Object.assign으로 업데이트
    // - 저장
  }

  // 6. 누적 시간 증가 (타이머 종료 시 호출)
  async incrementTotalTime(id: string, userId: string, duration: number): Promise<Task> {
    // - findOne으로 조회 + 검증
    // - totalTime += duration
    // - lastUsed = 현재 시간
    // - 저장
  }

  // 7. 활성/비활성 토글
  async toggleActive(id: string, userId: string): Promise<Task> {
    // - findOne으로 조회 + 검증
    // - isActive = !isActive
    // - 저장
  }

  // 8. 작업 통계
  async getTaskStats(userId: string): Promise<TaskStats> {
    // - 모든 작업 조회
    // - 집계: total, active, inactive, totalTime
  }
}
```

#### 소유권 검증 패턴

```typescript
// 모든 작업 관련 메서드에서 반복되는 패턴
async findOne(id: string, userId: string): Promise<Task> {
  const task = await this.taskRepository.findOne({ where: { id } });
  
  if (!task) {
    throw new NotFoundException('Task not found');
  }
  
  // 핵심: 소유권 검증
  if (task.userId !== userId) {
    throw new ForbiddenException('You do not have access to this task');
  }
  
  return task;
}

// 이 패턴이 다른 메서드들에서 재사용됨:
// - update()
// - remove()
// - toggleActive()
// - incrementTotalTime()
```

---

### 4. Timer Module (타이머 모듈)

#### 구조
```
timer/
├── dto/
│   ├── start-timer.dto.ts        # 타이머 시작 DTO
│   ├── stop-timer.dto.ts         # 타이머 종료 DTO
│   ├── timer-response.dto.ts     # 응답 DTO
│   └── index.ts
├── entities/
│   ├── timer-session.entity.ts   # TimerSession 엔티티
│   ├── session-pause.entity.ts   # SessionPause 엔티티
│   └── index.ts
├── timer.controller.ts           # HTTP 엔드포인트
├── timer.service.ts              # 비즈니스 로직
└── timer.module.ts               # 모듈 정의
```

#### Entity 구조

**TimerSession**
```typescript
@Entity('timer_sessions')
export class TimerSession {
  id: string;                    // UUID
  userId: string;                // FK to users
  user: User;                    // ManyToOne relation
  taskId: string | null;         // FK to tasks (nullable, SET NULL)
  task: Task | null;             // ManyToOne relation
  startTime: Date;               // 세션 시작 시간
  endTime: Date | null;          // 세션 종료 시간 (nullable)
  duration: number;              // 전체 시간 (초)
  pauseCount: number;            // 일시정지 횟수
  totalPauseTime: number;        // 총 일시정지 시간 (초)
  status: SessionStatus;         // ENUM: active, paused, completed, cancelled
  faceStatsSummary: object;      // JSONB, 얼굴 인식 통계 (nullable)
  createdAt: Date;               // 생성 시간
  updatedAt: Date;               // 수정 시간

  // Helper Methods
  getEffectiveDuration(): number {
    // 실제 작업 시간 = duration - totalPauseTime
  }

  isActive(): boolean {
    return this.status === SessionStatus.ACTIVE;
  }

  canBePaused(): boolean {
    return this.status === SessionStatus.ACTIVE;
  }

  canBeResumed(): boolean {
    return this.status === SessionStatus.PAUSED;
  }

  // Indexes:
  // - user_id + status
  // - task_id + start_time
  // - user_id + start_time
}
```

**SessionPause**
```typescript
@Entity('session_pauses')
export class SessionPause {
  id: string;                    // UUID
  sessionId: string;             // FK to timer_sessions
  session: TimerSession;         // ManyToOne relation
  pauseStart: Date;              // 일시정지 시작
  pauseEnd: Date | null;         // 일시정지 종료 (nullable)
  duration: number | null;       // 일시정지 시간 (초, nullable)
  createdAt: Date;               // 생성 시간

  // Helper Methods
  isActive(): boolean {
    return this.pauseEnd === null;
  }

  calculateDuration(): number {
    // (pauseEnd - pauseStart) / 1000
  }

  // Indexes:
  // - session_id + pause_start
}
```

#### 타이머 상태 머신

```
                    startTimer()
                         │
                         ▼
┌────────────────────────────────────┐
│           ACTIVE                   │
│  - 타이머 실행 중                     │
│  - 시간 증가                         │
└────────────────────────────────────┘
         │                    │
         │ pauseTimer()       │ stopTimer()
         ▼                    ▼
┌────────────────┐    ┌──────────────────┐
│    PAUSED      │    │   COMPLETED      │
│  - 일시정지      │    │  - 정상 종료        │
│  - 시간 정지     │    │  - Task 시간 업데이트│
└────────────────┘    └──────────────────┘
         │
         │ resumeTimer()
         ▼
┌────────────────────────────────────┐
│           ACTIVE                   │
│  - 타이머 재개                        │
└────────────────────────────────────┘

cancelTimer() → CANCELLED (언제든지 가능, 완료 제외)
```

#### TimerService 주요 메서드 및 플로우

**1. 타이머 시작**
```typescript
async startTimer(userId: string, dto: StartTimerDto): Promise<TimerSession> {
  // 1. 활성 세션 중복 체크
  const activeSession = await this.getActiveSession(userId);
  if (activeSession) {
    throw new ConflictException('Active session already exists');
  }

  // 2. Task 유효성 검증 (taskId가 있다면)
  if (dto.taskId) {
    await this.tasksService.findOne(dto.taskId, userId);
  }

  // 3. 새 세션 생성
  const session = this.sessionRepository.create({
    userId,
    taskId: dto.taskId || null,
    startTime: new Date(),
    status: SessionStatus.ACTIVE,
  });

  // 4. DB 저장
  return await this.sessionRepository.save(session);
}
```

**2. 일시정지**
```typescript
async pauseTimer(sessionId: string, userId: string): Promise<TimerSession> {
  // 1. 세션 조회 + 소유권 검증
  const session = await this.findSessionById(sessionId, userId);

  // 2. 상태 검증
  if (!session.canBePaused()) {
    throw new BadRequestException('Cannot pause');
  }

  // 3. SessionPause 레코드 생성
  const pause = this.pauseRepository.create({
    sessionId: session.id,
    pauseStart: new Date(),
  });
  await this.pauseRepository.save(pause);

  // 4. 세션 상태 업데이트
  session.status = SessionStatus.PAUSED;
  session.pauseCount += 1;

  return await this.sessionRepository.save(session);
}
```

**3. 재개**
```typescript
async resumeTimer(sessionId: string, userId: string): Promise<TimerSession> {
  // 1. 세션 조회 + 검증
  const session = await this.findSessionById(sessionId, userId);

  // 2. 상태 검증
  if (!session.canBeResumed()) {
    throw new BadRequestException('Cannot resume');
  }

  // 3. 활성 일시정지 찾기
  const activePause = await this.pauseRepository.findOne({
    where: {
      sessionId: session.id,
      pauseEnd: IsNull(),  // pauseEnd가 null인 레코드
    },
  });

  // 4. 일시정지 종료
  if (activePause) {
    activePause.pauseEnd = new Date();
    activePause.duration = activePause.calculateDuration();
    await this.pauseRepository.save(activePause);

    // 5. 총 일시정지 시간 업데이트
    session.totalPauseTime += activePause.duration;
  }

  // 6. 세션 상태 업데이트
  session.status = SessionStatus.ACTIVE;

  return await this.sessionRepository.save(session);
}
```

**4. 종료**
```typescript
async stopTimer(
  sessionId: string,
  userId: string,
  dto: StopTimerDto,
): Promise<TimerSession> {
  // 1. 세션 조회 + 검증
  const session = await this.findSessionById(sessionId, userId);

  // 2. 상태 검증
  if (session.status === SessionStatus.COMPLETED) {
    throw new BadRequestException('Already completed');
  }

  // 3. 활성 일시정지가 있다면 종료
  const activePause = await this.pauseRepository.findOne({
    where: {
      sessionId: session.id,
      pauseEnd: IsNull(),
    },
  });

  if (activePause) {
    activePause.pauseEnd = new Date();
    activePause.duration = activePause.calculateDuration();
    await this.pauseRepository.save(activePause);

    session.totalPauseTime += activePause.duration;
  }

  // 4. 세션 종료 처리
  session.endTime = new Date();
  session.duration = Math.floor(
    (session.endTime.getTime() - session.startTime.getTime()) / 1000,
  );
  session.status = SessionStatus.COMPLETED;
  session.faceStatsSummary = dto.faceStatsSummary || null;

  const savedSession = await this.sessionRepository.save(session);

  // 5. Task 시간 업데이트 (effectiveDuration)
  if (session.taskId) {
    await this.tasksService.incrementTotalTime(
      session.taskId,
      userId,
      savedSession.getEffectiveDuration(),  // duration - totalPauseTime
    );
  }

  return savedSession;
}
```

#### 시간 계산 로직

```
┌─────────────────────────────────────────────────────────────────┐
│                      Timeline                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Start                Pause      Resume      Pause     Stop     │
│    │                   │           │           │         │       │
│    ▼───────ACTIVE──────▼──PAUSED──▼──ACTIVE───▼─PAUSED─▼       │
│    10:00             10:15       10:20       10:35    10:40     │
│                                                                  │
│  duration = 10:40 - 10:00 = 40분                                │
│                                                                  │
│  Pause 1: 10:15 - 10:20 = 5분                                   │
│  Pause 2: 10:35 - 10:40 = 5분                                   │
│  totalPauseTime = 5 + 5 = 10분                                  │
│                                                                  │
│  effectiveDuration = duration - totalPauseTime                   │
│                    = 40 - 10 = 30분 (실제 작업 시간)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 인증 시스템

### Global Guard 패턴

```
┌────────────────────────────────────────────────────────────────┐
│                      모든 HTTP 요청                              │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│               JwtAuthGuard (APP_GUARD)                         │
│                 자동으로 모든 요청에 적용                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Check: @Public() decorator 있나?                            │
│     ├─ Yes → 검증 스킵, 요청 통과 ✓                                │
│     └─ No  → 2단계로                                             │
│                                                                │
│  2. Extract: Authorization Header에서 Bearer Token 추출          │
│     ├─ 없음 → 401 Unauthorized                                  │
│     └─ 있음 → 3단계로                                            │
│                                                               │
│  3. Verify: JwtStrategy.validate() 호출                        │
│     ├─ 유효 → User 객체를 req.user에 저장, 요청 통과 ✓               │
│     └─ 무효 → 401 Unauthorized                                  │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                      Controller                                │
│                                                                │
│  @CurrentUser() 데코레이터로 req.user 접근                         │
└────────────────────────────────────────────────────────────────┘
```

### 인증 예외 처리

```typescript
// app.module.ts - Global Guard 등록
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,  // 모든 라우트에 자동 적용
    },
  ],
})
export class AppModule {}

// auth.controller.ts - 인증 불필요 라우트
@Controller('auth')
export class AuthController {
  @Public()  // ← 이 데코레이터로 인증 스킵
  @Post('register')
  async register() { }

  @Public()  // ← 로그인도 인증 불필요
  @Post('login')
  async login() { }

  // @Public() 없음 → JWT 필수
  @Post('logout')
  async logout(@CurrentUser('id') userId: string) { }
}
```

### JWT 토큰 구조

**Access Token (JWT)**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid-here",
    "email": "user@example.com",
    "iat": 1234567890,
    "exp": 1234568790  // 900초 후 (15분)
  },
  "signature": "..."
}
```

**Refresh Token (Random)**
```
- Format: Hex string (128자)
- Storage: DB의 refresh_tokens 테이블
- Expiration: 7일
- Rotation: 매번 갱신 시 새로운 토큰 발급 + 기존 토큰 revoke
```

### 보안 기능

1. **Password Hashing**
```typescript
// User Entity - BeforeInsert/BeforeUpdate Hook
async hashPassword() {
  if (this.password && !this.password.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
}
```

2. **Token Rotation**
```typescript
// Refresh 시 기존 토큰 무효화
refreshTokenEntity.isRevoked = true;
await this.refreshTokenRepository.save(refreshTokenEntity);

// 새 토큰 발급
const newToken = crypto.randomBytes(64).toString('hex');
```

3. **Token Revocation**
```typescript
// 로그아웃 시 모든 토큰 무효화
await this.refreshTokenRepository.update(
  { userId, isRevoked: false },
  { isRevoked: true },
);
```

---

## API 엔드포인트

### 인증 (Public)
```
POST   /auth/register          # 회원가입
POST   /auth/login             # 로그인
POST   /auth/refresh           # 토큰 갱신
POST   /auth/logout            # 로그아웃 (Protected)
GET    /auth/me                # 내 정보 (Protected)
```

### 사용자 (Protected)
```
GET    /users/me               # 내 프로필 조회
PATCH  /users/me               # 내 프로필 수정
DELETE /users/me               # 계정 삭제
GET    /users/:id              # 사용자 조회
```

### 작업 (Protected)
```
GET    /tasks                  # 모든 작업 조회
GET    /tasks/active           # 활성 작업 조회
GET    /tasks/stats            # 작업 통계
POST   /tasks                  # 작업 생성
GET    /tasks/:id              # 단일 작업 조회
PATCH  /tasks/:id              # 작업 수정
PATCH  /tasks/:id/toggle       # 활성/비활성 토글
DELETE /tasks/:id              # 작업 삭제
```

### 타이머 (Protected)
```
POST   /timer/start            # 타이머 시작
POST   /timer/:id/pause        # 일시정지
POST   /timer/:id/resume       # 재개
POST   /timer/:id/stop         # 종료
POST   /timer/:id/cancel       # 취소
GET    /timer/active           # 현재 활성 세션
GET    /timer/history          # 세션 히스토리 (?limit=20)
GET    /timer/:id              # 세션 조회
GET    /timer/:id/pauses       # 일시정지 기록
```

---

## 코드 패턴 및 규칙

### 1. DTO 패턴

**Request DTO**
```typescript
// class-validator 사용
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
  color?: string;
}
```

**Response DTO**
```typescript
// class-transformer 사용
@Exclude()
export class TaskResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  // password 같은 민감 정보는 자동 제외됨
}
```

### 2. Service 패턴

```typescript
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    // 다른 서비스 의존성 주입
    private readonly otherService: OtherService,
  ) {}

  // 항상 async/await 사용
  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    // 1. 검증
    // 2. 엔티티 생성
    // 3. DB 저장
    // 4. 반환
  }
}
```

### 3. Controller 패턴

```typescript
@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create task' })
  @ApiResponse({ status: 201, type: TaskResponseDto })
  async create(
    @CurrentUser('id') userId: string,  // 커스텀 데코레이터
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(userId, dto);
  }
}
```

### 4. 에러 처리

```typescript
// Service Layer에서 명시적 에러 throw
if (!task) {
  throw new NotFoundException('Task not found');
}

if (task.userId !== userId) {
  throw new ForbiddenException('Access denied');
}

if (activeSession) {
  throw new ConflictException('Active session exists');
}

// NestJS가 자동으로 적절한 HTTP 상태코드로 변환:
// - NotFoundException → 404
// - ForbiddenException → 403
// - ConflictException → 409
// - BadRequestException → 400
// - UnauthorizedException → 401
```

### 5. TypeORM 쿼리 패턴

```typescript
// 1. 기본 조회
await this.repository.findOne({ where: { id } });

// 2. 관계 포함
await this.repository.find({
  where: { userId },
  relations: ['task', 'user'],
});

// 3. QueryBuilder (복잡한 쿼리)
await this.repository
  .createQueryBuilder('user')
  .where('user.email = :email', { email })
  .addSelect('user.password')  // select: false 필드 선택
  .getOne();

// 4. NULL 체크
await this.repository.findOne({
  where: {
    sessionId,
    pauseEnd: IsNull(),  // pauseEnd IS NULL
  },
});
```

### 6. 트랜잭션 패턴 (필요 시)

```typescript
async complexOperation(data: any): Promise<void> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 여러 DB 작업
    await queryRunner.manager.save(entity1);
    await queryRunner.manager.save(entity2);

    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
```

---

## 개발 가이드

### 새 기능 추가 시 체크리스트

1. **Entity 생성**
    - [ ] 필드 정의
    - [ ] 관계 설정 (ManyToOne, OneToMany)
    - [ ] 인덱스 정의
    - [ ] 헬퍼 메서드 추가

2. **DTO 생성**
    - [ ] Create DTO (class-validator)
    - [ ] Update DTO (모든 필드 optional)
    - [ ] Response DTO (class-transformer)

3. **Service 생성**
    - [ ] Repository 주입
    - [ ] CRUD 메서드
    - [ ] 소유권 검증 로직
    - [ ] 에러 처리

4. **Controller 생성**
    - [ ] @ApiTags 추가
    - [ ] @ApiBearerAuth (인증 필요 시)
    - [ ] @ApiOperation, @ApiResponse (Swagger)
    - [ ] @CurrentUser 데코레이터 사용

5. **Module 등록**
    - [ ] TypeOrmModule.forFeature([Entity])
    - [ ] providers, controllers 등록
    - [ ] exports (다른 모듈에서 사용 시)

6. **테스트**
    - [ ] Unit tests (Service)
    - [ ] E2E tests (Controller)
    - [ ] Postman/Swagger 테스트

---

이 문서는 Face Timer Backend의 전체 구조와 동작 원리를 설명합니다.
각 모듈의 상세 구현은 해당 소스 코드를 참고하세요.