import { IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StopTimerDto {
  @ApiPropertyOptional({
    description: 'Face detection statistics summary',
    example: {
      totalFrames: 1800,
      faceDetectedFrames: 1650,
      faceDetectionRate: 0.917,
      averageConfidence: 0.95,
    },
  })
  @IsObject()
  @IsOptional()
  faceStatsSummary?: Record<string, any>;
}