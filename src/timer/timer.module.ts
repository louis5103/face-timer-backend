import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimerService } from './timer.service';
import { TimerController } from './timer.controller';
import { TimerSession } from './entities/timer-session.entity';
import { SessionPause } from './entities/session-pause.entity';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimerSession, SessionPause]),
    TasksModule,
  ],
  controllers: [TimerController],
  providers: [TimerService],
  exports: [TimerService, TypeOrmModule],
})
export class TimerModule {}
