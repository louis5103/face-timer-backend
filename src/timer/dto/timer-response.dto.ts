import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SessionStatus } from '../entities/timer-session.entity';

@Exclude()
export class TimerSessionResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty()
  taskId: string | null;

  @Expose()
  @ApiProperty()
  startTime: Date;

  @Expose()
  @ApiProperty()
  endTime: Date | null;

  @Expose()
  @ApiProperty()
  duration: number;

  @Expose()
  @ApiProperty()
  pauseCount: number;

  @Expose()
  @ApiProperty()
  totalPauseTime: number;

  @Expose()
  @ApiProperty()
  status: SessionStatus;

  @Expose()
  @ApiProperty()
  faceStatsSummary: Record<string, any> | null;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}

@Exclude()
export class SessionPauseResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  sessionId: string;

  @Expose()
  @ApiProperty()
  pauseStart: Date;

  @Expose()
  @ApiProperty()
  pauseEnd: Date | null;

  @Expose()
  @ApiProperty()
  duration: number | null;

  @Expose()
  @ApiProperty()
  createdAt: Date;
}