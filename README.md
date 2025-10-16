<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).





---

# Face Timer Backend

Face Timer is a productivity application that uses facial recognition to track work sessions, ensuring users stay focused on their tasks.

## 🚀 Features

- **User Authentication**: JWT-based authentication with refresh token rotation
- **Task Management**: Create and manage tasks with icons and colors
- **Timer Sessions**: Start, pause, resume, and stop timer sessions
- **Face Detection Integration**: Track face detection statistics during sessions
- **Statistics & Analytics**: View productivity statistics and insights
- **Ranking System**: Competitive rankings and achievements

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd face-timer-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Application
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=face_timer

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=900
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRATION=604800
```

4. Create PostgreSQL database:
```bash
createdb face_timer
```

5. Run migrations (if using migrations):
```bash
npm run migration:run
```

## 🚀 Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

Swagger documentation is available at:
```
http://localhost:3000/api/docs
```

## 🗂️ Project Structure

```
src/
├── auth/               # Authentication module
│   ├── dto/           # Data transfer objects
│   ├── entities/      # RefreshToken entity
│   ├── strategies/    # Passport strategies (JWT, Local, Refresh)
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/             # User management module
│   ├── dto/
│   ├── entities/      # User entity
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── tasks/             # Task management module
│   ├── dto/
│   ├── entities/      # Task entity
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   └── tasks.module.ts
├── timer/             # Timer session module
│   ├── dto/
│   ├── entities/      # TimerSession, SessionPause entities
│   ├── timer.controller.ts
│   ├── timer.service.ts
│   └── timer.module.ts
├── statistics/        # Statistics module
├── ranking/           # Ranking module
├── health/            # Health check module
├── common/            # Shared resources
│   ├── decorators/    # Custom decorators (@Public, @CurrentUser)
│   └── guards/        # Auth guards
├── app.module.ts
└── main.ts
```

## 🔐 Authentication

The API uses JWT-based authentication with refresh token rotation:

1. **Register**: `POST /auth/register`
2. **Login**: `POST /auth/login`
3. **Refresh Token**: `POST /auth/refresh`
4. **Logout**: `POST /auth/logout`

All endpoints (except authentication and public routes) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## 📊 Key Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Tasks
- `GET /tasks` - Get all tasks
- `GET /tasks/active` - Get active tasks
- `GET /tasks/stats` - Get task statistics
- `POST /tasks` - Create task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### Timer
- `POST /timer/start` - Start timer session
- `POST /timer/:id/pause` - Pause session
- `POST /timer/:id/resume` - Resume session
- `POST /timer/:id/stop` - Stop session
- `GET /timer/active` - Get active session
- `GET /timer/history` - Get session history

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🏗️ Database Schema

### Users
- User authentication and profile information
- Soft delete support

### Tasks
- User-specific tasks
- Track total time and last used

### Timer Sessions
- Track work sessions
- Support pause/resume
- Store face detection statistics

### Session Pauses
- Track pause periods within sessions

### Refresh Tokens
- JWT refresh token management
- Token rotation support

## 🔒 Security Features

- ✅ Global JWT authentication guard
- ✅ Password hashing with bcrypt
- ✅ Refresh token rotation
- ✅ Token revocation support
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection prevention (TypeORM)

## 📝 Development

### Code Style
```bash
# Format code
npm run format

# Lint code
npm run lint
```

### Database Migrations
```bash
# Generate migration
npm run migration:generate -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

Your Name - [@yourhandle](https://twitter.com/yourhandle)

## 🙏 Acknowledgments

- NestJS for the amazing framework
- TypeORM for database management
- Passport for authentication
