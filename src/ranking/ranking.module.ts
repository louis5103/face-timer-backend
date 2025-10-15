import { Module } from '@nestjs/common';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { AchievementService } from './achievement.service';

@Module({
  controllers: [RankingController],
  providers: [RankingService, AchievementService],
  exports: [RankingService, AchievementService],
})
export class RankingModule {}
