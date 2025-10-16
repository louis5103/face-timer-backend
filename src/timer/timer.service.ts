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
      userId,
      taskId: startTimerDto.taskId || null,
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
      sessionId: session.id,
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
        sessionId: session.id,
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
    const session = await this.findSessionById(sessionId, userId);

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Timer session is already completed');
    }

    const activePause = await this.pauseRepository.findOne({
      where: {
        sessionId: session.id,
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

    if (session.taskId) {
      await this.tasksService.incrementTotalTime(
        session.taskId,
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
        { userId, status: SessionStatus.ACTIVE },
        { userId, status: SessionStatus.PAUSED },
      ],
      relations: ['task'],
    });
  }

  async findSessionById(
    sessionId: string,
    userId: string,
  ): Promise<TimerSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Timer session not found');
    }

    return session;
  }

  async getUserSessions(
    userId: string,
    limit: number = 20,
  ): Promise<TimerSession[]> {
    return await this.sessionRepository.find({
      where: { userId },
      relations: ['task'],
      order: { startTime: 'DESC' },
      take: limit,
    });
  }

  async getSessionPauses(sessionId: string): Promise<SessionPause[]> {
    return await this.pauseRepository.find({
      where: { sessionId },
      order: { pauseStart: 'ASC' },
    });
  }
}
