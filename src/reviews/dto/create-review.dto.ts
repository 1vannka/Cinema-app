import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'Шикарный фильм' })
  @IsString()
  @IsNotEmpty()
  comment: string;
}
