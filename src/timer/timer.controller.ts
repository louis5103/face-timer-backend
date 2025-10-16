import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TimerService } from './timer.service';
import {
  StartTimerDto,
  StopTimerDto,
  TimerSessionResponseDto,
  SessionPauseResponseDto,
} from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Timer')
@ApiBearerAuth()
@Controller('timer')
export class TimerController {
  constructor(private readonly timerService: TimerService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new timer session' })
  @ApiResponse({
    status: 201,
    description: 'Timer session started',
    type: TimerSessionResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Active session already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async start(
    @CurrentUser('id') userId: string,
    @Body() startTimerDto: StartTimerDto,
  ) {
    return this.timerService.startTimer(userId, startTimerDto);
  }

  @Post(':sessionId/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause an active timer session' })
  @ApiResponse({
    status: 200,
    description: 'Timer session paused',
    type: TimerSessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Cannot pause session' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async pause(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.timerService.pauseTimer(sessionId, userId);
  }

  @Post(':sessionId/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a paused timer session' })
  @ApiResponse({
    status: 200,
    description: 'Timer session resumed',
    type: TimerSessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Cannot resume session' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resume(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.timerService.resumeTimer(sessionId, userId);
  }

  @Post(':sessionId/stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop and complete a timer session' })
  @ApiResponse({
    status: 200,
    description: 'Timer session stopped',
    type: TimerSessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session already completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async stop(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
    @Body() stopTimerDto: StopTimerDto,
  ) {
    return this.timerService.stopTimer(sessionId, userId, stopTimerDto);
  }

  @Post(':sessionId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a timer session' })
  @ApiResponse({
    status: 200,
    description: 'Timer session cancelled',
    type: TimerSessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Cannot cancel completed session' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancel(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.timerService.cancelTimer(sessionId, userId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get current active timer session' })
  @ApiResponse({
    status: 200,
    description: 'Active session or null',
    type: TimerSessionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActive(@CurrentUser('id') userId: string) {
    return this.timerService.getActiveSession(userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user timer session history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of timer sessions',
    type: [TimerSessionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.timerService.getUserSessions(userId, limit);
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get a specific timer session' })
  @ApiResponse({
    status: 200,
    description: 'Timer session details',
    type: TimerSessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.timerService.findSessionById(sessionId, userId);
  }

  @Get(':sessionId/pauses')
  @ApiOperation({ summary: 'Get pause history for a session' })
  @ApiResponse({
    status: 200,
    description: 'List of session pauses',
    type: [SessionPauseResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSessionPauses(@Param('sessionId') sessionId: string) {
    return this.timerService.getSessionPauses(sessionId);
  }
}