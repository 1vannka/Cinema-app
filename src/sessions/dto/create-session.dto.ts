import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @ApiProperty({ example: 'Начало' })
  @IsString()
  @IsNotEmpty()
  movieTitle: string;

  @ApiProperty({ example: '2026-03-25T19:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  datetime: string;

  @ApiPropertyOptional({ example: 'Зал 1' })
  @IsOptional()
  @IsString()
  hall?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity?: number;
}