import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  Matches,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskDto {
  @ApiPropertyOptional({
    example: 'Study Mathematics',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: '📚', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string;

  @ApiPropertyOptional({
    example: '#3B82F6',
    description: 'Hex color code',
    pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Color must be a valid hex color code (e.g., #3B82F6)',
  })
  color?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
