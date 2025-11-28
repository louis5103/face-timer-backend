import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimerSession, SessionStatus } from '../timer/entities/timer-session.entity';
import { User } from '../users/entities/user.entity';
import { RankingResponseDto, RankingUserDto } from './dto';

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(TimerSession)
    private readonly sessionRepository: Repository<TimerSession>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getRanking(
    period: 'daily' | 'weekly' | 'monthly',
    page: number = 1,
    limit: number = 20,
    currentUserId?: string,
  ): Promise<RankingResponseDto> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    // Set date range based on period
    if (period === 'daily') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
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

    // Aggregate study time by user
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .select('session.user_id', 'userId')
      .addSelect('SUM(session.duration - session.total_pause_time)', 'totalTime')
      .where('session.status = :status', { status: SessionStatus.COMPLETED })
      .andWhere('session.start_time BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('session.user_id')
      .orderBy('"totalTime"', 'DESC')
      .limit(limit)
      .offset((page - 1) * limit);

    const rawResults = await queryBuilder.getRawMany();

    // Fetch user details
    const userIds = rawResults.map((r) => r.userId);
    let users: User[] = [];
    if (userIds.length > 0) {
      // findByIds is deprecated, use findBy with In
      users = await this.userRepository
        .createQueryBuilder('user')
        .where('user.id IN (:...userIds)', { userIds })
        .getMany();
    }
    
    const userMap = new Map(users.map(u => [u.id, u]));

    const rankings: RankingUserDto[] = rawResults.map((result, index) => {
      const user = userMap.get(result.userId);
      return {
        userId: result.userId,
        name: user ? user.name : 'Unknown User',
        rank: (page - 1) * limit + index + 1,
        totalTime: parseInt(result.totalTime, 10),
      };
    });

    let myRanking: RankingUserDto | undefined;

    if (currentUserId) {
      myRanking = rankings.find(r => r.userId === currentUserId);

      if (!myRanking) {
        const myResult = await this.sessionRepository
          .createQueryBuilder('session')
          .select('SUM(session.duration - session.total_pause_time)', 'totalTime')
          .where('session.user_id = :userId', { userId: currentUserId })
          .andWhere('session.status = :status', { status: SessionStatus.COMPLETED })
          .andWhere('session.start_time BETWEEN :startDate AND :endDate', { startDate, endDate })
          .getRawOne();
        
        const myTotalTime = myResult ? parseInt(myResult.totalTime, 10) || 0 : 0;
        const currentUser = await this.userRepository.findOne({ where: { id: currentUserId } });
        
        myRanking = {
          userId: currentUserId,
          name: currentUser ? currentUser.name : 'Me',
          rank: 0, // Rank outside top list
          totalTime: myTotalTime,
        };
      }
    }

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      rankings,
      myRanking,
    };
  }
}