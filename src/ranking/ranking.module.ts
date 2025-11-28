import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { AchievementService } from './achievement.service';
import { TimerSession } from '../timer/entities/timer-session.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimerSession, User])],
  controllers: [RankingController],
  providers: [RankingService, AchievementService],
  exports: [RankingService, AchievementService],
})
export class RankingModule {}
