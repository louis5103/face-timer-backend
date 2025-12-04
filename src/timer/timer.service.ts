import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TimerSession, SessionStatus } from './entities/timer-session.entity';
import { SessionPause } from './entities/session-pause.entity';
import { TasksService } from '../tasks/tasks.service';
import { StartTimerDto, StopTimerDto } from './dto';

@Injectable()
export class TimerService {
  constructor(
    @InjectRepository(TimerSession)
    private readonly sessionRepository: Repository<TimerSession>,
    @InjectRepository(SessionPause)
    private readonly pauseRepository: Repository<SessionPause>,
    private readonly tasksService: TasksService,
    private readonly dataSource: DataSource,
  ) {}

  // Clean up zombie sessions every hour
  @Cron(CronExpression.EVERY_HOUR)
  async handleZombieSessions() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const zombieSessions = await this.sessionRepository.find({
      where: [
        { status: SessionStatus.ACTIVE, startTime: LessThan(cutoffTime) },
        { status: SessionStatus.PAUSED, startTime: LessThan(cutoffTime) },
      ],
      relations: ['task', 'user'],
    });

    for (const session of zombieSessions) {
      try {
        // Force complete after 24 hours
        const maxDuration = 24 * 60 * 60; // 24 hours in seconds
        session.endTime = new Date(
          session.startTime.getTime() + maxDuration * 1000,
        );
        session.duration = Math.max(0, maxDuration - session.totalPauseTime);
        session.status = SessionStatus.COMPLETED;

        await this.sessionRepository.save(session);

        if (session.task) {
          await this.tasksService.incrementTotalTime(
            session.task.id,
            session.user.id,
            session.duration,
          );
        }
      } catch (error) {
        console.error(
          `Failed to clean up zombie session ${session.id}:`,
          error,
        );
      }
    }
  }

  async startTimer(
    userId: string,
    startTimerDto: StartTimerDto,
  ): Promise<TimerSession> {
    // 1. 기존 세션 정리 (트랜잭션 외부에서 처리)
    const activeSession = await this.getActiveSession(userId);
    if (activeSession) {
      await this.stopTimer(activeSession.id, userId, {
        faceStatsSummary: {},
      } as any);
    }

    // 2. 새 세션 시작 (트랜잭션 적용)
    return this.dataSource.transaction(async (manager) => {
      // Task 유효성 검사는 읽기 작업이므로 트랜잭션 외부나 내부 어디든 상관없으나,
      // 여기서는 TaskService가 내부적으로 리포지토리를 쓰므로 그대로 둡니다.
      // 다만, TaskService가 트랜잭션 매니저를 받지 않으므로, 엄밀한 정합성을 위해서는 TaskService도 리팩토링해야 하지만,
      // Task 존재 여부 확인 정도는 큰 문제가 되지 않습니다.
      if (startTimerDto.taskId) {
        await this.tasksService.findOne(startTimerDto.taskId, userId);
      }

      const session = manager.create(TimerSession, {
        user: { id: userId },
        task: startTimerDto.taskId ? { id: startTimerDto.taskId } : null,
        startTime: new Date(),
        status: SessionStatus.ACTIVE,
      });

      return await manager.save(session);
    });
  }

  async pauseTimer(sessionId: string, userId: string): Promise<TimerSession> {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(TimerSession, {
        where: { id: sessionId, user: { id: userId } },
      });

      if (!session) {
        throw new NotFoundException(`Timer session not found or access denied`);
      }

      if (!session.canBePaused()) {
        throw new BadRequestException(
          'Timer session cannot be paused in its current state',
        );
      }

      const pause = manager.create(SessionPause, {
        session: { id: session.id },
        pauseStart: new Date(),
      });
      await manager.save(pause);

      session.status = SessionStatus.PAUSED;
      session.pauseCount += 1;

      return await manager.save(session);
    });
  }

  async resumeTimer(sessionId: string, userId: string): Promise<TimerSession> {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(TimerSession, {
        where: { id: sessionId, user: { id: userId } },
      });

      if (!session) {
        throw new NotFoundException(`Timer session not found or access denied`);
      }

      if (!session.canBeResumed()) {
        throw new BadRequestException(
          'Timer session cannot be resumed in its current state',
        );
      }

      const activePause = await manager.findOne(SessionPause, {
        where: {
          session: { id: session.id },
          pauseEnd: IsNull(),
        },
      });

      if (activePause) {
        activePause.pauseEnd = new Date();
        activePause.duration = Math.floor(
          (activePause.pauseEnd.getTime() - activePause.pauseStart.getTime()) /
            1000,
        );
        await manager.save(activePause);

        session.totalPauseTime += activePause.duration;
      }

      session.status = SessionStatus.ACTIVE;

      return await manager.save(session);
    });
  }

  async stopTimer(
    sessionId: string,
    userId: string,
    stopTimerDto: StopTimerDto,
  ): Promise<TimerSession> {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(TimerSession, {
        where: { id: sessionId, user: { id: userId } },
        relations: ['task'], // Task 정보도 함께 로드
      });

      if (!session) {
        throw new NotFoundException(`Timer session not found or access denied`);
      }

      if (session.status === SessionStatus.COMPLETED) {
        throw new BadRequestException('Timer session is already completed');
      }

      const activePause = await manager.findOne(SessionPause, {
        where: {
          session: { id: session.id },
          pauseEnd: IsNull(),
        },
      });

      if (activePause) {
        activePause.pauseEnd = new Date();
        activePause.duration = Math.floor(
          (activePause.pauseEnd.getTime() - activePause.pauseStart.getTime()) /
            1000,
        );
        await manager.save(activePause);
        session.totalPauseTime += activePause.duration;
      }

      session.endTime = new Date();
      session.duration = Math.floor(
        (session.endTime.getTime() - session.startTime.getTime()) / 1000,
      );
      session.status = SessionStatus.COMPLETED;
      session.faceStatsSummary = stopTimerDto.faceStatsSummary || null;

      const savedSession = await manager.save(session);

      // Task 누적 시간 업데이트
      if (session.task) {
        // TasksService의 메서드는 내부적으로 별도 트랜잭션을 쓸 수 있으나,
        // 여기서는 단순히 호출만 합니다. 엄밀한 정합성을 위해선 TasksService도 manager를 받아야 합니다.
        // 현재 구조상 TasksService 호출이 실패하면 전체 트랜잭션이 롤백됩니다.
        await this.tasksService.incrementTotalTime(
          session.task.id,
          userId,
          session.duration - session.totalPauseTime, // getEffectiveDuration() 로직 인라인
        );
      }

      return savedSession;
    });
  }

  async cancelTimer(sessionId: string, userId: string): Promise<TimerSession> {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(TimerSession, {
        where: { id: sessionId, user: { id: userId } },
      });

      if (!session) {
        throw new NotFoundException(`Timer session not found or access denied`);
      }

      if (session.status === SessionStatus.COMPLETED) {
        throw new BadRequestException('Cannot cancel a completed session');
      }

      session.status = SessionStatus.CANCELLED;
      session.endTime = new Date();
      return await manager.save(session);
    });
  }

  async getActiveSession(userId: string): Promise<TimerSession | null> {
    return await this.sessionRepository.findOne({
      where: [
        { user: { id: userId }, status: SessionStatus.ACTIVE },
        { user: { id: userId }, status: SessionStatus.PAUSED },
      ],
      relations: ['task'],
    });
  }

  async findSessionById(
    sessionId: string,
    userId: string,
  ): Promise<TimerSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
    });
    if (!session) {
      throw new NotFoundException(`Timer session not found or access denied`);
    }
    return session;
  }

  async getUserSessions(
    userId: string,
    limit: number = 20,
  ): Promise<TimerSession[]> {
    return await this.sessionRepository.find({
      where: { user: { id: userId } },
      relations: ['task'],
      order: { startTime: 'DESC' },
      take: limit,
    });
  }

  async getSessionPauses(sessionId: string): Promise<SessionPause[]> {
    return await this.pauseRepository.find({
      where: { session: { id: sessionId } },
      order: { pauseStart: 'ASC' },
    });
  }
}
