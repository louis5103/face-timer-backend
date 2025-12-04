import { ApiProperty } from '@nestjs/swagger';

export class RankingUserDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User rank (1-based)' })
  rank: number;

  @ApiProperty({ description: 'Total study time in seconds', type: 'string', format: 'int64' })
  totalTime: bigint;
}

export class RankingResponseDto {
  @ApiProperty({ description: 'Ranking period (daily, weekly, monthly)' })
  period: string;

  @ApiProperty({ description: 'Start date of the period' })
  startDate: string;

  @ApiProperty({ description: 'End date of the period' })
  endDate: string;

  @ApiProperty({ description: 'List of ranked users', type: [RankingUserDto] })
  rankings: RankingUserDto[];

  @ApiProperty({ description: 'Current user ranking info', type: RankingUserDto, required: false })
  myRanking?: RankingUserDto;
}
