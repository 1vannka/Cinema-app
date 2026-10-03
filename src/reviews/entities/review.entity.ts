import { ApiProperty } from '@nestjs/swagger';

export class ReviewEntity {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Шикарный фильм!' })
    comment: string;

    @ApiProperty({ example: '2026-03-24T12:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: 1 })
    userId: number;
}