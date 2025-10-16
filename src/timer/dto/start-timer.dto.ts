import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartTimerDto {
  @ApiPropertyOptional({
    description: 'Task ID to associate with this timer session',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  taskId?: string;
}