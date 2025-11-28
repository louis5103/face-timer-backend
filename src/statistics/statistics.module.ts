import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { TimerSession } from '../timer/entities/timer-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimerSession])],
  providers: [StatisticsService],
  controllers: [StatisticsController],
})
export class StatisticsModule {}
