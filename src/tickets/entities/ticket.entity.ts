import { ApiProperty } from '@nestjs/swagger';

export class TicketEntity {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 5 })
    row: number;

    @ApiProperty({ example: 12 })
    seat: number;

    @ApiProperty({ example: 'Оплачен' })
    status: string;

    @ApiProperty({ example: 1 })
    userId: number;

    @ApiProperty({ example: 10 })
    sessionId: number;
}