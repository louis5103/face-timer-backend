import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimerSession, SessionStatus } from '../timer/entities/timer-session.entity';
import { User } from '../users/entities/user.entity';
import { RankingResponseDto, RankingUserDto } from './dto';
import { Ranking, RankingPeriod } from './entities/ranking.entity';

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(TimerSession)
    private readonly sessionRepository: Repository<TimerSession>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Ranking)
    private readonly rankingRepository: Repository<Ranking>,
  ) {}

  async getRanking(
    period: RankingPeriod,
    page: number = 1,
    limit: number = 20,
    currentUserId?: string,
  ): Promise<RankingResponseDto> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    // Set date range based on period
    if (period === RankingPeriod.DAILY) {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === RankingPeriod.WEEKLY) {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startDate = new Date(now);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else { // monthly
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Try to retrieve cached rankings first
    const cachedRankings = await this.rankingRepository.find({
      where: {
        periodType: period,
        periodStartDate: startDate,
        periodEndDate: endDate,
      },
      order: { score: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'], // Load user details
    });

    let rankings: RankingUserDto[] = [];
    if (cachedRankings.length > 0) {
      rankings = cachedRankings.map((r, index) => ({
        userId: r.userId,
        name: r.user ? r.user.name : 'Unknown User',
        rank: (page - 1) * limit + index + 1,
        totalTime: BigInt(r.score),
      }));
    } else {
      // Aggregate study time by user if no cached rankings
      const queryBuilder = this.sessionRepository
        .createQueryBuilder('session')
        .select('session.user_id', 'userId')
        .addSelect('SUM(session.duration - session.total_pause_time)', 'totalTime')
        .where('session.status = :status', { status: SessionStatus.COMPLETED })
        .andWhere('session.start_time BETWEEN :startDate AND :endDate', { startDate, endDate })
        .groupBy('session.user_id')
        .orderBy('"totalTime"', 'DESC');

      const rawResults = await queryBuilder.getRawMany();

      // Fetch user details
      const userIds = rawResults.map((r) => r.userId);
      let users: User[] = [];
      if (userIds.length > 0) {
        users = await this.userRepository.findByIds(userIds);
      }
      const userMap = new Map(users.map(u => [u.id, u]));

      const newRankings: Ranking[] = [];
      rawResults.forEach((result) => {
        const user = userMap.get(result.userId);
        newRankings.push(
          this.rankingRepository.create({
            userId: result.userId,
            score: parseInt(result.totalTime, 10),
            periodType: period,
            periodStartDate: startDate,
            periodEndDate: endDate,
          }),
        );
      });
      await this.rankingRepository.save(newRankings);

      // Apply pagination to the newly saved rankings
      const paginatedRawResults = rawResults.slice((page - 1) * limit, page * limit);
      rankings = paginatedRawResults.map((result, index) => {
        const user = userMap.get(result.userId);
        return {
          userId: result.userId,
          name: user ? user.name : 'Unknown User',
          rank: (page - 1) * limit + index + 1,
          totalTime: BigInt(parseInt(result.totalTime, 10)),
        };
      });
    }

    let myRanking: RankingUserDto | undefined;

    if (currentUserId) {
      // Try to find current user's cached ranking
      const myCachedRanking = await this.rankingRepository.findOne({
        where: {
          userId: currentUserId,
          periodType: period,
          periodStartDate: startDate,
          periodEndDate: endDate,
        },
        relations: ['user'],
      });

      if (myCachedRanking) {
        // Calculate my rank based on all scores for the period
        const allRankingsForPeriod = await this.rankingRepository.find({
          where: {
            periodType: period,
            periodStartDate: startDate,
            periodEndDate: endDate,
          },
          order: { score: 'DESC' },
        });
        const myRankIndex = allRankingsForPeriod.findIndex(r => r.userId === currentUserId);

        myRanking = {
          userId: myCachedRanking.userId,
          name: myCachedRanking.user ? myCachedRanking.user.name : 'Me',
          rank: myRankIndex !== -1 ? myRankIndex + 1 : 0,
          totalTime: BigInt(myCachedRanking.score),
        };
      } else {
        // If not cached, calculate on the fly for current user
        const myResult = await this.sessionRepository
          .createQueryBuilder('session')
          .select('SUM(session.duration - session.total_pause_time)', 'totalTime')
          .where('session.user_id = :userId', { userId: currentUserId })
          .andWhere('session.status = :status', { status: SessionStatus.COMPLETED })
          .andWhere('session.start_time BETWEEN :startDate AND :endDate', { startDate, endDate })
          .getRawOne();
        
        const myTotalTime = myResult ? BigInt(parseInt(myResult.totalTime, 10) || 0) : BigInt(0);
        const currentUser = await this.userRepository.findOne({ where: { id: currentUserId } });
        
        myRanking = {
          userId: currentUserId,
          name: currentUser ? currentUser.name : 'Me',
          rank: 0, // Rank outside top list or to be calculated later
          totalTime: myTotalTime,
        };

        // Potentially save this single user's ranking if it doesn't exist
        if (myTotalTime > 0) {
            const existingMyRanking = await this.rankingRepository.findOne({
                where: {
                    userId: currentUserId,
                    periodType: period,
                    periodStartDate: startDate,
                    periodEndDate: endDate,
                }
            });
            if (!existingMyRanking) {
                await this.rankingRepository.save(this.rankingRepository.create({
                    userId: currentUserId,
                    score: Number(myTotalTime),
                    periodType: period,
                    periodStartDate: startDate,
                    periodEndDate: endDate,
                }));
            }
        }
      }
    }

    return {
      period: period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      rankings,
      myRanking,
    };
  }
}