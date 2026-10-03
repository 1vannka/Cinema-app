import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMovieDto {
  @ApiProperty({ example: 'Начало' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Сюжет про сны' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: '/images/inception.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 'Кристофер Нолан' })
  @IsOptional()
  @IsString()
  director?: string;

  @ApiPropertyOptional({ example: 'Фантастика' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({ example: 123 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  duration?: number;

  @ApiPropertyOptional({ example: 2010 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  @Type(() => Number)
  year?: number;
}
