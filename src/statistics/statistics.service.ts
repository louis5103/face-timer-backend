import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { TimerSession, SessionStatus } from '../timer/entities/timer-session.entity';
import { SessionPause } from '../timer/entities/session-pause.entity';
import {
  DailyStatsResponseDto,
  WeeklyStatsResponseDto,
  MonthlyStatsResponseDto,
  TaskStatsDto,
  HourlyStatsDto,
  DashboardStatsResponseDto,
} from './dto';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(TimerSession)
    private readonly sessionRepository: Repository<TimerSession>,
  ) {}

  /**
   * Calculates the effective study duration (in seconds) of a session within a specific time range.
   * Subtracts pause durations that fall within the intersection of the session and the range.
   */
  private calculateEffectiveDuration(
    session: TimerSession,
    rangeStart: Date,
    rangeEnd: Date,
  ): number {
    if (!session.endTime) return 0;

    // 1. Calculate intersection of [sessionStart, sessionEnd] and [rangeStart, rangeEnd]
    const start =
      session.startTime > rangeStart ? session.startTime : rangeStart;
    const end = session.endTime < rangeEnd ? session.endTime : rangeEnd;

    if (start >= end) return 0;

    let duration = (end.getTime() - start.getTime()) / 1000;

    // 2. Subtract pauses that overlap with the intersection
    if (session.pauses) {
      for (const pause of session.pauses) {
        if (!pause.pauseEnd) continue;

        // Intersection of [pauseStart, pauseEnd] and [start, end]
        const pauseStart =
          pause.pauseStart > start ? pause.pauseStart : start;
        const pauseEnd = pause.pauseEnd < end ? pause.pauseEnd : end;

        if (pauseStart < pauseEnd) {
          duration -= (pauseEnd.getTime() - pauseStart.getTime()) / 1000;
        }
      }
    }

    return Math.max(0, duration);
  }

  async getDashboardStats(userId: string): Promise<DashboardStatsResponseDto> {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Get basic stats
    const dailyStats = await this.getDailyStats(userId, todayStr);
    const weeklyStats = await this.getWeeklyStats(userId, todayStr);
    const monthlyStats = await this.getMonthlyStats(
      userId,
      now.getFullYear(),
      now.getMonth() + 1,
    );

    // 2. Calculate Streak
    // Use raw query to get distinct dates.
    // "DATE(start_time)" works in PostgreSQL if start_time is timestamp.
    const recentSessions = await this.sessionRepository
      .createQueryBuilder('session')
      .select("to_char(session.start_time, 'YYYY-MM-DD')", 'date') // PostgreSQL specific
      .where('session.user_id = :userId', { userId })
      .andWhere('session.status = :status', { status: SessionStatus.COMPLETED })
      .groupBy("to_char(session.start_time, 'YYYY-MM-DD')")
      .orderBy('date', 'DESC')
      .limit(100)
      .getRawMany();

    const studyDates = recentSessions.map((r) => r.date);

    let streak = 0;
    let checkDate = new Date(now);

    // If user hasn't studied today yet, we shouldn't break the streak from yesterday.
    const hasStudiedToday = studyDates.includes(todayStr);
    if (!hasStudiedToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Limit loop to avoid infinite loop
    for (let i = 0; i < 100; i++) {
      const checkDateStr = checkDate.toISOString().split('T')[0];

      if (studyDates.includes(checkDateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      todayTime: dailyStats.totalTime,
      weekTime: weeklyStats.totalTime,
      monthTime: monthlyStats.totalTime,
      currentStreak: streak,
    };
  }

  async getDailyStats(
    userId: string,
    date: string,
  ): Promise<DailyStatsResponseDto> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await this.sessionRepository.find({
      where: {
        user: { id: userId },
        status: SessionStatus.COMPLETED,
        startTime: LessThanOrEqual(endOfDay),
        endTime: MoreThanOrEqual(startOfDay),
      },
      relations: ['task', 'pauses'],
    });

    const taskStatsMap = new Map<string, TaskStatsDto>();
    const hourlyStatsMap = new Map<number, number>();
    let totalTime = 0;

    // Initialize hourly stats
    for (let i = 0; i < 24; i++) {
      hourlyStatsMap.set(i, 0);
    }

    sessions.forEach((session) => {
      // 1. Total duration for the day (Task breakdown)
      const dayDuration = this.calculateEffectiveDuration(
        session,
        startOfDay,
        endOfDay,
      );
      
      if (dayDuration > 0) {
        totalTime += dayDuration;

        if (session.task) {
          const taskId = session.task.id;
          if (!taskStatsMap.has(taskId)) {
            taskStatsMap.set(taskId, {
              taskId,
              title: session.task.title,
              color: session.task.color,
              duration: 0,
            });
          }
          const taskStat = taskStatsMap.get(taskId);
          if (taskStat) {
            taskStat.duration += dayDuration;
          }
        }
      }

      // 2. Hourly breakdown
      for (let i = 0; i < 24; i++) {
        const hourStart = new Date(startOfDay);
        hourStart.setHours(i, 0, 0, 0);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(i + 1, 0, 0, 0);
        // Handle the last millisecond for the last hour if needed, 
        // but simple hour steps work fine with < comparison logic in helper.
        // Actually, calculateEffectiveDuration uses < end, so setHours(i+1) is correct boundary.
        
        const hourDuration = this.calculateEffectiveDuration(
          session,
          hourStart,
          hourEnd,
        );

        if (hourDuration > 0) {
          const existing = hourlyStatsMap.get(i) || 0;
          hourlyStatsMap.set(i, existing + hourDuration);
        }
      }
    });

    const hourlyBreakdown: HourlyStatsDto[] = [];
    for (let i = 0; i < 24; i++) {
      hourlyBreakdown.push({
        hour: i,
        duration: hourlyStatsMap.get(i) || 0,
      });
    }

    return {
      date,
      totalTime,
      tasks: Array.from(taskStatsMap.values()),
      hourlyBreakdown,
    };
  }

  async getWeeklyStats(
    userId: string,
    date: string,
  ): Promise<WeeklyStatsResponseDto> {
    const targetDate = new Date(date);
    const day = targetDate.getDay();
    const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday (0) to get Monday

    const weekStart = new Date(targetDate);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const sessions = await this.sessionRepository.find({
      where: {
        user: { id: userId },
        status: SessionStatus.COMPLETED,
        startTime: LessThanOrEqual(weekEnd),
        endTime: MoreThanOrEqual(weekStart),
      },
      relations: ['task', 'pauses'],
    });

    const dailyStatsMap = new Map<string, DailyStatsResponseDto>();
    let weeklyTotalTime = 0;

    // Initialize all days of the week
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dailyStatsMap.set(dateStr, {
        date: dateStr,
        totalTime: 0,
        tasks: [],
        hourlyBreakdown: [],
      });
    }

    sessions.forEach((session) => {
      // Iterate through each day of the week to distribute session time
      dailyStatsMap.forEach((dailyStat, dateStr) => {
        const dayStart = new Date(dateStr);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dateStr);
        dayEnd.setHours(23, 59, 59, 999);

        const duration = this.calculateEffectiveDuration(
          session,
          dayStart,
          dayEnd,
        );

        if (duration > 0) {
          dailyStat.totalTime += duration;
          weeklyTotalTime += duration;

          if (session.task) {
            const taskIndex = dailyStat.tasks.findIndex(
              (t) => t.taskId === session.task?.id,
            );
            if (taskIndex > -1) {
              dailyStat.tasks[taskIndex].duration += duration;
            } else {
              dailyStat.tasks.push({
                taskId: session.task.id,
                title: session.task.title,
                color: session.task.color,
                duration: duration,
              });
            }
          }
        }
      });
    });

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalTime: weeklyTotalTime,
      dailyBreakdown: Array.from(dailyStatsMap.values()),
    };
  }

  async getMonthlyStats(
    userId: string,
    year: number,
    month: number,
  ): Promise<MonthlyStatsResponseDto> {
    // month is 1-based
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const sessions = await this.sessionRepository.find({
      where: {
        user: { id: userId },
        status: SessionStatus.COMPLETED,
        startTime: LessThanOrEqual(endOfMonth),
        endTime: MoreThanOrEqual(startOfMonth),
      },
      relations: ['task', 'pauses'],
    });

    const dailyStatsMap = new Map<string, DailyStatsResponseDto>();
    let monthlyTotalTime = 0;

    sessions.forEach((session) => {
      // Need to iterate days? For monthly, simple loop might be heavy if many sessions.
      // However, we need to split session across days.
      // Optimization: Only iterate days that the session actually spans.
      
      if (!session.endTime) return;

      let current = new Date(session.startTime < startOfMonth ? startOfMonth : session.startTime);
      // Normalize to start of day
      current.setHours(0, 0, 0, 0);
      
      const sessionEnd = session.endTime > endOfMonth ? endOfMonth : session.endTime;

      while (current < sessionEnd) {
        const dayStart = new Date(current);
        const dayEnd = new Date(current);
        dayEnd.setHours(23, 59, 59, 999);
        
        // Stop if we go past session end (optimization)
        if (dayStart > sessionEnd) break;

        const duration = this.calculateEffectiveDuration(session, dayStart, dayEnd);
        
        if (duration > 0) {
          const dateStr = dayStart.toISOString().split('T')[0];
          
          if (!dailyStatsMap.has(dateStr)) {
            dailyStatsMap.set(dateStr, {
              date: dateStr,
              totalTime: 0,
              tasks: [],
              hourlyBreakdown: [],
            });
          }
          
          const dailyStat = dailyStatsMap.get(dateStr);
          if (dailyStat) {
            dailyStat.totalTime += duration;
            monthlyTotalTime += duration;

            if (session.task) {
              const taskIndex = dailyStat.tasks.findIndex(
                (t) => t.taskId === session.task?.id,
              );
              if (taskIndex > -1) {
                dailyStat.tasks[taskIndex].duration += duration;
              } else {
                dailyStat.tasks.push({
                  taskId: session.task.id,
                  title: session.task.title,
                  color: session.task.color,
                  duration: duration,
                });
              }
            }
          }
        }
        
        // Next day
        current.setDate(current.getDate() + 1);
      }
    });

    return {
      year,
      month,
      totalTime: monthlyTotalTime,
      dailyBreakdown: Array.from(dailyStatsMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    };
  }
}