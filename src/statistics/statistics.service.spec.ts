import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { TimerSession, SessionStatus } from '../timer/entities/timer-session.entity';
import { SessionPause } from '../timer/entities/session-pause.entity';
import { Repository } from 'typeorm';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockReturnThis(),
  }),
});

describe('StatisticsService', () => {
  let service: StatisticsService;
  let sessionRepository: MockRepository<TimerSession>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: getRepositoryToken(TimerSession),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
    sessionRepository = module.get<MockRepository<TimerSession>>(
      getRepositoryToken(TimerSession),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateEffectiveDuration (Private Helper Test via getDailyStats)', () => {
    it('should correctly calculate hourly breakdown without pauses', async () => {
      // Arrange
      const date = '2024-03-20';
      // Session: 10:00 ~ 12:00 (2 hours)
      const session = new TimerSession();
      session.id = '1';
      session.startTime = new Date('2024-03-20T10:00:00.000Z');
      session.endTime = new Date('2024-03-20T12:00:00.000Z');
      session.status = SessionStatus.COMPLETED;
      session.pauses = [];
      session.task = { id: 'task1', title: 'Math', color: 'red' } as any;

      sessionRepository.find.mockResolvedValue([session]);

      // Act
      const result = await service.getDailyStats('user1', date);

      // Assert
      expect(result.totalTime).toBe(7200); // 2 hours = 7200s
      
      // Check hourly stats (UTC basis as per mock data)
      // 10:00 - 11:00 -> 3600s
      // 11:00 - 12:00 -> 3600s
      const hour10 = result.hourlyBreakdown.find(h => h.hour === 10);
      const hour11 = result.hourlyBreakdown.find(h => h.hour === 11);
      const hour12 = result.hourlyBreakdown.find(h => h.hour === 12);

      expect(hour10?.duration).toBe(3600);
      expect(hour11?.duration).toBe(3600);
      expect(hour12?.duration).toBe(0);
    });

    it('should correctly subtract pauses from hourly breakdown', async () => {
      // Arrange
      const date = '2024-03-20';
      // Session: 10:00 ~ 12:00
      // Pause:   10:30 ~ 11:30 (1 hour pause)
      // Actual:  10:00~10:30 (30m), Pause, 11:30~12:00 (30m)
      const session = new TimerSession();
      session.startTime = new Date('2024-03-20T10:00:00.000Z');
      session.endTime = new Date('2024-03-20T12:00:00.000Z');
      session.pauses = [
        {
          pauseStart: new Date('2024-03-20T10:30:00.000Z'),
          pauseEnd: new Date('2024-03-20T11:30:00.000Z'),
        } as SessionPause,
      ];
      session.task = { id: 'task1', title: 'Math' } as any;

      sessionRepository.find.mockResolvedValue([session]);

      // Act
      const result = await service.getDailyStats('user1', date);

      // Assert
      expect(result.totalTime).toBe(3600); // Total 1 hour study

      const hour10 = result.hourlyBreakdown.find(h => h.hour === 10);
      const hour11 = result.hourlyBreakdown.find(h => h.hour === 11);

      // 10:00 ~ 11:00 total is 60m. Pause is 10:30~11:00 (30m). Study = 30m (1800s)
      expect(hour10?.duration).toBe(1800);

      // 11:00 ~ 12:00 total is 60m. Pause is 11:00~11:30 (30m). Study = 30m (1800s)
      expect(hour11?.duration).toBe(1800);
    });

    it('should handle complex multiple pauses', async () => {
      // Arrange
      // Session: 10:00 ~ 11:00 (3600s)
      // Pause 1: 10:10 ~ 10:20 (600s)
      // Pause 2: 10:40 ~ 10:50 (600s)
      // Total Study: 3600 - 1200 = 2400s
      const session = new TimerSession();
      session.startTime = new Date('2024-03-20T10:00:00.000Z');
      session.endTime = new Date('2024-03-20T11:00:00.000Z');
      session.pauses = [
        {
          pauseStart: new Date('2024-03-20T10:10:00.000Z'),
          pauseEnd: new Date('2024-03-20T10:20:00.000Z'),
        } as SessionPause,
        {
          pauseStart: new Date('2024-03-20T10:40:00.000Z'),
          pauseEnd: new Date('2024-03-20T10:50:00.000Z'),
        } as SessionPause,
      ];
      session.task = { id: 'task1' } as any;

      sessionRepository.find.mockResolvedValue([session]);

      // Act
      const result = await service.getDailyStats('user1', '2024-03-20');

      // Assert
      expect(result.totalTime).toBe(2400);
      const hour10 = result.hourlyBreakdown.find(h => h.hour === 10);
      expect(hour10?.duration).toBe(2400);
    });
  });
});