import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class TaskResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  icon: string;

  @Expose()
  @ApiProperty()
  color: string;

  @Expose()
  @ApiProperty()
  isActive: boolean;

  @Expose()
  @ApiProperty()
  totalTime: number;

  @Expose()
  @ApiProperty()
  lastUsed: Date;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
