import { Controller, Get, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import {
  DailyStatsResponseDto,
  WeeklyStatsResponseDto,
  MonthlyStatsResponseDto,
  DashboardStatsResponseDto,
} from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics (summary)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics',
    type: DashboardStatsResponseDto,
  })
  async getDashboardStats(@CurrentUser('id') userId: string) {
    return this.statisticsService.getDashboardStats(userId);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Get daily statistics' })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date in YYYY-MM-DD format',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily statistics',
    type: DailyStatsResponseDto,
  })
  async getDailyStats(
    @CurrentUser('id') userId: string,
    @Query('date') date: string,
  ) {
    return this.statisticsService.getDailyStats(userId, date);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Get weekly statistics' })
  @ApiQuery({ name: 'date', required: true, description: 'Any date within the target week (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Weekly statistics', type: WeeklyStatsResponseDto })
  async getWeeklyStats(
    @CurrentUser('id') userId: string,
    @Query('date') date: string,
  ) {
    return this.statisticsService.getWeeklyStats(userId, date);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Get monthly statistics' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Monthly statistics', type: MonthlyStatsResponseDto })
  async getMonthlyStats(
    @CurrentUser('id') userId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.statisticsService.getMonthlyStats(userId, year, month);
  }
}