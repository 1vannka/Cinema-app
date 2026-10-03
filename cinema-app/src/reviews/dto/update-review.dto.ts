import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateReviewDto {
    @ApiProperty({ example: 'Пересмотрел, фильм так себе'})
    @IsString()
    @IsNotEmpty()
    comment: string;
}