import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {IsString, IsOptional, IsInt, IsUrl, Max, Min} from 'class-validator';

export class CreateMovieDto {
    @ApiProperty({example: 'Начало'})
    @IsString()
    title: string;

    @ApiProperty({example: 'Сюжет про сны'})
    @IsString()
    description: string;

    @ApiPropertyOptional({ example: '/images/inception.jpg'})
    @IsOptional()
    @IsString()
    image?: string;

    @ApiPropertyOptional({ example: 'Кристофер Нолан'})
    @IsOptional()
    @IsString()
    director?: string;

    @ApiPropertyOptional({ example: 'Фантастика'})
    @IsOptional()
    @IsString()
    genre?: string;

    @ApiPropertyOptional({ example: 123})
    @IsOptional()
    @IsInt()
    @Min(1)
    duration?: number;

    @ApiPropertyOptional({ example: 2010})
    @IsOptional()
    @IsInt()
    @Min(1900)
    @Max(2100)
    year?: number;
}