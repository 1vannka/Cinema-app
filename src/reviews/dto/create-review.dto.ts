import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
    @ApiProperty({ example: 'Шикарный фильм'})
    @IsString()
    @IsNotEmpty()
    comment: string;

    @ApiProperty({ example: 1})
    @IsInt()
    userId: number;
}