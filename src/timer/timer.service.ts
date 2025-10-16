import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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
  ) {}

  async startTimer(
    userId: string,
    startTimerDto: StartTimerDto,
  ): Promise<TimerSession> {
    const activeSession = await this.getActiveSession(userId);
    if (activeSession) {
      throw new ConflictException(
        'You already have an active timer session. Please stop it first.',
      );
    }

    if (startTimerDto.taskId) {
      await this.tasksService.findOne(startTimerDto.taskId, userId);
    }

    const session = this.sessionRepository.create({
      // ✅ 관계 객체 형태로 ID를 전달합니다.
      user: { id: userId },
      task: startTimerDto.taskId ? { id: startTimerDto.taskId } : null,
      startTime: new Date(),
      status: SessionStatus.ACTIVE,
    });

    return await this.sessionRepository.save(session);
  }

  async pauseTimer(sessionId: string, userId: string): Promise<TimerSession> {
    const session = await this.findSessionById(sessionId, userId);

    if (!session.canBePaused()) {
      throw new BadRequestException(
        'Timer session cannot be paused in its current state',
      );
    }

    const pause = this.pauseRepository.create({
      // ✅ 관계 객체 형태로 ID를 전달합니다.
      session: { id: session.id },
      pauseStart: new Date(),
    });
    await this.pauseRepository.save(pause);

    session.status = SessionStatus.PAUSED;
    session.pauseCount += 1;

    return await this.sessionRepository.save(session);
  }

  async resumeTimer(sessionId: string, userId: string): Promise<TimerSession> {
    const session = await this.findSessionById(sessionId, userId);

    if (!session.canBeResumed()) {
      throw new BadRequestException(
        'Timer session cannot be resumed in its current state',
      );
    }

    const activePause = await this.pauseRepository.findOne({
      where: {
        // ✅ where 조건절을 관계 객체 형태로 변경합니다.
        session: { id: session.id },
        pauseEnd: IsNull(),
      },
    });

    if (activePause) {
      activePause.pauseEnd = new Date();
      activePause.duration = activePause.calculateDuration();
      await this.pauseRepository.save(activePause);

      session.totalPauseTime += activePause.duration;
    }

    session.status = SessionStatus.ACTIVE;

    return await this.sessionRepository.save(session);
  }

  async stopTimer(
    sessionId: string,
    userId: string,
    stopTimerDto: StopTimerDto,
  ): Promise<TimerSession> {
    // findOneByOrFail 대신 findSessionById를 사용하여 소유권을 먼저 검증합니다.
    const session = await this.findSessionById(sessionId, userId);
    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Timer session is already completed');
    }

    const activePause = await this.pauseRepository.findOne({
      where: {
        session: { id: session.id },
        pauseEnd: IsNull(),
      },
    });

    if (activePause) {
      activePause.pauseEnd = new Date();
      activePause.duration = activePause.calculateDuration();
      await this.pauseRepository.save(activePause);
      session.totalPauseTime += activePause.duration;
    }

    session.endTime = new Date();
    session.duration = Math.floor(
      (session.endTime.getTime() - session.startTime.getTime()) / 1000,
    );
    session.status = SessionStatus.COMPLETED;
    session.faceStatsSummary = stopTimerDto.faceStatsSummary || null;

    const savedSession = await this.sessionRepository.save(session);

    // task 관계를 로드해야 taskId에 접근할 수 있습니다.
    const sessionWithTask = await this.sessionRepository.findOne({
      where: { id: savedSession.id },
      relations: ['task'],
    });

    if (sessionWithTask && sessionWithTask.task) {
      await this.tasksService.incrementTotalTime(
        sessionWithTask.task.id,
        userId,
        savedSession.getEffectiveDuration(),
      );
    }

    return savedSession;
  }

  async cancelTimer(sessionId: string, userId: string): Promise<TimerSession> {
    const session = await this.findSessionById(sessionId, userId);
    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed session');
    }
    session.status = SessionStatus.CANCELLED;
    session.endTime = new Date();
    return await this.sessionRepository.save(session);
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
