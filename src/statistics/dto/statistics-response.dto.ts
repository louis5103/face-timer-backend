import { ApiProperty } from '@nestjs/swagger';

export class TaskStatsDto {
  @ApiProperty({ description: 'Task ID' })
  taskId: string;

  @ApiProperty({ description: 'Task title' })
  title: string;

  @ApiProperty({ description: 'Total duration in seconds' })
  duration: number;

  @ApiProperty({ description: 'Task color', required: false })
  color?: string;
}

export class HourlyStatsDto {
  @ApiProperty({ description: 'Hour of the day (0-23)' })
  hour: number;

  @ApiProperty({ description: 'Study duration in seconds' })
  duration: number;
}

export class DailyStatsResponseDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Total study time in seconds' })
  totalTime: number;

  @ApiProperty({ description: 'Breakdown by task', type: [TaskStatsDto] })
  tasks: TaskStatsDto[];

  @ApiProperty({ description: 'Hourly study breakdown', type: [HourlyStatsDto] })
  hourlyBreakdown: HourlyStatsDto[];
}

export class WeeklyStatsResponseDto {
  @ApiProperty({ description: 'Start date of the week' })
  weekStart: string;

  @ApiProperty({ description: 'End date of the week' })
  weekEnd: string;

  @ApiProperty({ description: 'Total study time in seconds for the week' })
  totalTime: number;

  @ApiProperty({ description: 'Daily breakdown', type: [DailyStatsResponseDto] })
  dailyBreakdown: DailyStatsResponseDto[];
}

export class MonthlyStatsResponseDto {
  @ApiProperty({ description: 'Year' })
  year: number;

  @ApiProperty({ description: 'Month' })
  month: number;

  @ApiProperty({ description: 'Daily breakdown', type: [DailyStatsResponseDto] })
  dailyBreakdown: DailyStatsResponseDto[];
}

export class DashboardStatsResponseDto {
  @ApiProperty({ description: 'Total study time today (seconds)' })
  todayTime: number;

  @ApiProperty({ description: 'Total study time this week (seconds)' })
  weekTime: number;

  @ApiProperty({ description: 'Total study time this month (seconds)' })
  monthTime: number;

  @ApiProperty({ description: 'Current study streak (days)' })
  currentStreak: number;
}
