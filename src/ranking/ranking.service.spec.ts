import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RankingService } from './ranking.service';
import { TimerSession, SessionStatus } from '../timer/entities/timer-session.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { Ranking, RankingPeriod } from './entities/ranking.entity';
import { RankingResponseDto } from './dto';

describe('RankingService', () => {
  let service: RankingService;
  let timerSessionRepository: Repository<TimerSession>;
  let userRepository: Repository<User>;
  let rankingRepository: Repository<Ranking>;

  // Mock User entity fully
  const mockUser: User = {
    id: 'user1',
    email: 'test@example.com',
    password: 'password',
    name: 'Test User',
    avatar: null,
    timezone: 'UTC',
    settings: {},
    status: UserStatus.ACTIVE,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    deletedAt: null,
  };

  const mockUser2: User = {
    id: 'user2',
    email: 'test2@example.com',
    password: 'password',
    name: 'Test User 2',
    avatar: null,
    timezone: 'UTC',
    settings: {},
    status: UserStatus.ACTIVE,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    deletedAt: null,
  };

  // Mock TimerSession entity fully (including methods)
  const createMockTimerSession = (
    id: string,
    user: User,
    duration: number,
    startTime: Date,
    endTime: Date,
    status: SessionStatus = SessionStatus.COMPLETED,
    totalPauseTime: number = 0,
  ): TimerSession => ({
    id,
    user,
    task: null, // Default to null for simplicity in these tests
    startTime,
    endTime,
    duration,
    pauseCount: 0, // Default for simplicity
    totalPauseTime,
    status,
    faceStatsSummary: {}, // Default for simplicity
    createdAt: new Date(),
    updatedAt: new Date(),
    pauses: [], // Default for simplicity
    getEffectiveDuration: jest.fn().mockReturnValue(duration - totalPauseTime),
    isActive: jest.fn().mockReturnValue(status === SessionStatus.ACTIVE),
    canBePaused: jest.fn().mockReturnValue(status === SessionStatus.ACTIVE),
    canBeResumed: jest.fn().mockReturnValue(status === SessionStatus.PAUSED),
  });

  // Mock TimerSession data using the helper
  const mockTimerSessions: TimerSession[] = [
    createMockTimerSession(
      'session1',
      mockUser,
      3600, // 1 hour
      new Date('2025-11-01T08:00:00Z'),
      new Date('2025-11-01T09:00:00Z'),
    ),
    createMockTimerSession(
      'session2',
      mockUser,
      1800, // 30 minutes
      new Date('2025-11-01T10:00:00Z'),
      new Date('2025-11-01T10:30:00Z'),
    ),
    createMockTimerSession(
      'session3',
      mockUser2,
      7200, // 2 hours
      new Date('2025-11-01T09:00:00Z'),
      new Date('2025-11-01T11:00:00Z'),
    ),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RankingService,
        {
          provide: getRepositoryToken(TimerSession),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockReturnThis(),
              getRawMany: jest.fn(),
              getRawOne: jest.fn(),
            }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findByIds: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Ranking),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn().mockImplementation((dto) => ({
                ...dto,
                createdAt: dto.createdAt || new Date(),
                updatedAt: dto.updatedAt || new Date(),
                id: dto.id || 'mock-ranking-id',
            })),
            save: jest.fn().mockImplementation(async (entityOrEntities: any) => {
              if (Array.isArray(entityOrEntities)) {
                return entityOrEntities.map(e => ({...e, createdAt: e.createdAt || new Date(), updatedAt: e.updatedAt || new Date()}));
              }
              return {...entityOrEntities, createdAt: entityOrEntities.createdAt || new Date(), updatedAt: entityOrEntities.updatedAt || new Date()};
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RankingService>(RankingService);
    timerSessionRepository = module.get<Repository<TimerSession>>(getRepositoryToken(TimerSession));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    rankingRepository = module.get<Repository<Ranking>>(getRepositoryToken(Ranking));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRanking', () => {
    // Helper function to mock dates for specific period tests
    const mockDate = (dateString: string) => {
      const mock = new Date(dateString);
      jest.spyOn(global, 'Date').mockImplementation(() => mock as any);
    };

    beforeEach(() => {
      // Reset Date mock before each test in this describe block
      jest.spyOn(global, 'Date').mockRestore();
      jest.clearAllMocks(); // Clear all mocks before each test
    });

    it('should calculate daily ranking correctly when no cached data exists', async () => {
      mockDate('2025-11-01T12:00:00Z'); // Mock today's date

      // Mock the repository methods called within getRanking
      jest.spyOn(rankingRepository, 'find').mockResolvedValue([]); // No cached rankings
      jest.spyOn(timerSessionRepository.createQueryBuilder(), 'getRawMany').mockResolvedValue([
        { userId: 'user2', totalTime: 7200 },
        { userId: 'user1', totalTime: 5400 },
      ]);
      jest.spyOn(userRepository, 'findByIds').mockResolvedValue([mockUser, mockUser2]);
      // rankingRepository.create and save are mocked in useValue directly

      const result = await service.getRanking(RankingPeriod.DAILY, 1, 10);

      expect(result.period).toBe(RankingPeriod.DAILY);
      expect(result.rankings).toHaveLength(2);
      expect(result.rankings[0]).toEqual(
        expect.objectContaining({
          userId: 'user2',
          name: 'Test User 2',
          rank: 1,
          totalTime: BigInt(7200),
        }),
      );
      expect(result.rankings[1]).toEqual(
        expect.objectContaining({
          userId: 'user1',
          name: 'Test User',
          rank: 2,
          totalTime: BigInt(5400),
        }),
      );
      expect(rankingRepository.save).toHaveBeenCalledTimes(1); // Should save newly calculated rankings
    });

    it('should retrieve daily ranking from cache if available', async () => {
      mockDate('2025-11-01T12:00:00Z'); // Mock today's date
      
      const cachedRanking: Ranking[] = [
        {
          id: 'rank1',
          userId: 'user2',
          user: mockUser2,
          score: 7200,
          periodType: RankingPeriod.DAILY,
          periodStartDate: new Date('2025-11-01T00:00:00Z'),
          periodEndDate: new Date('2025-11-01T23:59:59Z'),
          createdAt: new Date('2025-11-01T12:00:00Z'), // Added missing property
          updatedAt: new Date('2025-11-01T12:00:00Z'), // Added missing property
        },
        {
          id: 'rank2',
          userId: 'user1',
          user: mockUser,
          score: 5400,
          periodType: RankingPeriod.DAILY,
          periodStartDate: new Date('2025-11-01T00:00:00Z'),
          periodEndDate: new Date('2025-11-01T23:59:59Z'),
          createdAt: new Date('2025-11-01T12:00:00Z'), // Added missing property
          updatedAt: new Date('2025-11-01T12:00:00Z'), // Added missing property
        },
      ];

      jest.spyOn(rankingRepository, 'find').mockResolvedValue(cachedRanking);
      jest.spyOn(timerSessionRepository.createQueryBuilder(), 'getRawMany').mockClear(); // Ensure calculation is skipped
      jest.spyOn(rankingRepository, 'save').mockClear(); // Ensure save is skipped

      const result = await service.getRanking(RankingPeriod.DAILY, 1, 10);

      expect(result.period).toBe(RankingPeriod.DAILY);
      expect(result.rankings).toHaveLength(2);
      expect(result.rankings[0]).toEqual(
        expect.objectContaining({
          userId: 'user2',
          name: 'Test User 2',
          rank: 1,
          totalTime: BigInt(7200),
        }),
      );
      expect(timerSessionRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(rankingRepository.save).not.toHaveBeenCalled();
    });

    it('should calculate myRanking correctly if current user is not in top list and not cached', async () => {
        mockDate('2025-11-01T12:00:00Z'); // Mock today's date

        // Mock rankingRepository.find for initial check
        jest.spyOn(rankingRepository, 'find').mockResolvedValue([]); 

        // Mock timerSessionRepository.createQueryBuilder for the initial raw data fetch
        const mockRawManyResult = [ { userId: 'user2', totalTime: 7200 } ];
        jest.spyOn(timerSessionRepository.createQueryBuilder(), 'getRawMany').mockResolvedValue(mockRawManyResult);

        // Mock userRepository.findByIds for fetching user details for the top list
        jest.spyOn(userRepository, 'findByIds').mockResolvedValue([mockUser2]);

        // Mock rankingRepository.create for when new ranking entities are created
        jest.spyOn(rankingRepository, 'create').mockImplementation((dto) => dto as Ranking);

        // Mock rankingRepository.findOne to return null for current user's cached ranking initially
        jest.spyOn(rankingRepository, 'findOne').mockResolvedValueOnce(null);

        // Mock timerSessionRepository.createQueryBuilder().getRawOne() for current user's total time calculation
        const mockGetRawOneResult = { totalTime: 5400 };
        jest.spyOn(timerSessionRepository.createQueryBuilder(), 'getRawOne').mockResolvedValue(mockGetRawOneResult);
        
        // Mock userRepository.findOne for current user's details
        jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

        // Mock rankingRepository.find for allRankingsForPeriod to calculate myRank
        jest.spyOn(rankingRepository, 'find')
          .mockResolvedValueOnce([]) // For the initial top list check
          .mockResolvedValueOnce([ // For allRankingsForPeriod when calculating myRank
            { id: 'rank2', userId: 'user2', user: mockUser2, score: 7200, periodType: RankingPeriod.DAILY, periodStartDate: new Date(), periodEndDate: new Date(), createdAt: new Date(), updatedAt: new Date() },
            { id: 'rank1', userId: 'user1', user: mockUser, score: 5400, periodType: RankingPeriod.DAILY, periodStartDate: new Date(), periodEndDate: new Date(), createdAt: new Date(), updatedAt: new Date() },
          ]);

        const result = await service.getRanking(RankingPeriod.DAILY, 1, 10, 'user1');
  
        expect(result.myRanking).toBeDefined();
        expect(result.myRanking).toEqual(
          expect.objectContaining({
            userId: 'user1',
            name: 'Test User',
            totalTime: BigInt(5400),
            rank: 2, // Should be calculated now
          }),
        );
        // Expect that user1's ranking was saved
        expect(rankingRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 'user1', score: 5400, periodType: RankingPeriod.DAILY })
        );
      });

    // Add more tests for weekly, monthly, pagination, edge cases, etc.
  });
});