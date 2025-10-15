import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { TimerModule } from './timer/timer.module';
import { StatisticsModule } from './statistics/statistics.module';
import { RankingModule } from './ranking/ranking.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    TasksModule,
    TimerModule,
    StatisticsModule,
    RankingModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
