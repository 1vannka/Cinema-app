import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateTicketDto {
    @ApiProperty({ example: 1})
    @IsInt()
    userId: number;

    @ApiProperty({ example: 10})
    @IsInt()
    sessionId: number;
}