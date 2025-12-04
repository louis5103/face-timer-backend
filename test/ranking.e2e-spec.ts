import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/entities/user.entity';
import { TimerSession, SessionStatus } from '../src/timer/entities/timer-session.entity';
import { Ranking, RankingPeriod } from '../src/ranking/entities/ranking.entity';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

describe('RankingController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;

  let user1: User;
  let user2: User;
  let adminUser: User;
  let user1Token: string;
  let user2Token: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, TimerSession, Ranking],
          synchronize: true,
          logging: false,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);

    // Clear db before tests
    await dataSource.manager.clear(Ranking);
    await dataSource.manager.clear(TimerSession);
    await dataSource.manager.clear(User);

    // Create mock users
    user1 = await dataSource.getRepository(User).save({
      email: 'user1@test.com',
      name: 'User One',
      password: 'password123',
      isVerified: true,
    });
    user2 = await dataSource.getRepository(User).save({
      email: 'user2@test.com',
      name: 'User Two',
      password: 'password123',
      isVerified: true,
    });
    adminUser = await dataSource.getRepository(User).save({
      email: 'admin@test.com',
      name: 'Admin User',
      password: 'adminpassword',
      isVerified: true,
    });

    // Generate JWT tokens
    user1Token = jwtService.sign({ id: user1.id, email: user1.email });
    user2Token = jwtService.sign({ id: user2.id, email: user2.email });
    adminToken = jwtService.sign({ id: adminUser.id, email: adminUser.email });

    // Insert mock TimerSessions for testing
    // User 1 sessions
    await dataSource.getRepository(TimerSession).save({
      userId: user1.id,
      duration: 3600, // 1 hour
      totalPauseTime: 0,
      status: SessionStatus.COMPLETED,
      startTime: new Date('2025-11-01T08:00:00Z'),
      endTime: new Date('2025-11-01T09:00:00Z'),
    });
    await dataSource.getRepository(TimerSession).save({
      userId: user1.id,
      duration: 1800, // 30 minutes
      totalPauseTime: 0,
      status: SessionStatus.COMPLETED,
      startTime: new Date('2025-11-01T10:00:00Z'),
      endTime: new Date('2025-11-01T10:30:00Z'),
    });
    // User 2 sessions
    await dataSource.getRepository(TimerSession).save({
      userId: user2.id,
      duration: 7200, // 2 hours
      totalPauseTime: 0,
      status: SessionStatus.COMPLETED,
      startTime: new Date('2025-11-01T09:00:00Z'),
      endTime: new Date('2025-11-01T11:00:00Z'),
    });
    // Another session for user1 for a different day/week/month
    await dataSource.getRepository(TimerSession).save({
      userId: user1.id,
      duration: 5400, // 1.5 hours
      totalPauseTime: 0,
      status: SessionStatus.COMPLETED,
      startTime: new Date('2025-11-08T14:00:00Z'),
      endTime: new Date('2025-11-08T15:30:00Z'),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // Helper to mock the current date for ranking calculations
  const mockDate = (dateString: string) => {
    const mock = new Date(dateString);
    jest.spyOn(global, 'Date').mockImplementation(() => mock as any);
  };

  afterEach(() => {
    jest.spyOn(global, 'Date').mockRestore(); // Restore original Date object
  });

  it('should return 401 if no token is provided', () => {
    return request(app.getHttpServer())
      .get('/ranking/daily')
      .expect(401);
  });

  describe('GET /ranking/daily', () => {
    it('should return daily ranking for the mocked day (2025-11-01)', async () => {
      mockDate('2025-11-01T12:00:00Z'); // Mock current date to be 2025-11-01

      const response = await request(app.getHttpServer())
        .get('/ranking/daily')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.period).toBe(RankingPeriod.DAILY);
      expect(response.body.rankings).toHaveLength(2);
      expect(response.body.rankings[0]).toEqual(
        expect.objectContaining({ userId: user2.id, name: user2.name, rank: 1, totalTime: 7200 }),
      );
      expect(response.body.rankings[1]).toEqual(
        expect.objectContaining({ userId: user1.id, name: user1.name, rank: 2, totalTime: 5400 }),
      );
      expect(response.body.myRanking).toEqual(
        expect.objectContaining({ userId: user1.id, name: user1.name, totalTime: 5400 }),
      );
    });

    it('should handle pagination for daily ranking', async () => {
        mockDate('2025-11-01T12:00:00Z'); // Mock current date to be 2025-11-01
  
        const response = await request(app.getHttpServer())
          .get('/ranking/daily?page=1&limit=1')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);
  
        expect(response.body.period).toBe(RankingPeriod.DAILY);
        expect(response.body.rankings).toHaveLength(1);
        expect(response.body.rankings[0]).toEqual(
          expect.objectContaining({ userId: user2.id, name: user2.name, rank: 1, totalTime: 7200 }),
        );
      });
  });

  describe('GET /ranking/weekly', () => {
    it('should return weekly ranking for the mocked week (starting 2025-10-27 for 2025-11-01)', async () => {
      // 2025-11-01 is a Saturday. The week typically starts on Monday.
      // So for a week containing 2025-11-01, it would be Oct 27 - Nov 2
      mockDate('2025-11-01T12:00:00Z'); 

      const response = await request(app.getHttpServer())
        .get('/ranking/weekly')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.period).toBe(RankingPeriod.WEEKLY);
      expect(response.body.rankings).toHaveLength(2);
      // User2 has 7200, User1 has 3600+1800=5400 on Nov 1st.
      // So for the week containing Nov 1st, User2 (7200) > User1 (5400)
      expect(response.body.rankings[0]).toEqual(
        expect.objectContaining({ userId: user2.id, name: user2.name, rank: 1, totalTime: 7200 }),
      );
      expect(response.body.rankings[1]).toEqual(
        expect.objectContaining({ userId: user1.id, name: user1.name, rank: 2, totalTime: 5400 }),
      );
      expect(response.body.myRanking).toEqual(
        expect.objectContaining({ userId: user1.id, name: user1.name, totalTime: 5400 }),
      );
    });

    it('should return weekly ranking for the mocked week (starting 2025-11-03 for 2025-11-08)', async () => {
      // 2025-11-08 is a Saturday. The week typically starts on Monday.
      // So for a week containing 2025-11-08, it would be Nov 3 - Nov 9
      mockDate('2025-11-08T12:00:00Z'); 

      const response = await request(app.getHttpServer())
        .get('/ranking/weekly')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.period).toBe(RankingPeriod.WEEKLY);
      expect(response.body.rankings).toHaveLength(1); // Only user1 has sessions this week
      expect(response.body.rankings[0]).toEqual(
        expect.objectContaining({ userId: user1.id, name: user1.name, rank: 1, totalTime: 5400 }),
      );
      expect(response.body.myRanking).toEqual(
        expect.objectContaining({ userId: user1.id, name: user1.name, totalTime: 5400 }),
      );
    });
  });

  describe('GET /ranking/monthly', () => {
    it('should return monthly ranking for the mocked month (2025-11)', async () => {
      mockDate('2025-11-15T12:00:00Z'); // Mock current date to be in November 2025

      const response = await request(app.getHttpServer())
        .get('/ranking/monthly')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.period).toBe(RankingPeriod.MONTHLY);
      expect(response.body.rankings).toHaveLength(2);
      // User2 has 7200 (Nov 1st). User1 has 5400 (Nov 1st) + 5400 (Nov 8th) = 10800.
      expect(response.body.rankings[0]).toEqual(
        expect.objectContaining({ userId: user1.id, name: user1.name, rank: 1, totalTime: 10800 }),
      );
      expect(response.body.rankings[1]).toEqual(
        expect.objectContaining({ userId: user2.id, name: user2.name, rank: 2, totalTime: 7200 }),
      );
      expect(response.body.myRanking).toEqual(
        expect.objectContaining({ userId: user1.id, name: user1.name, totalTime: 10800 }),
      );
    });
  });
});
