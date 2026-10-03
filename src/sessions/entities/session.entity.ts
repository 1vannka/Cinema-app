import { ApiProperty } from '@nestjs/swagger';

export class SessionEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '2026-03-25T19:00:00.000Z' })
  datetime: Date;

  @ApiProperty({ example: 100 })
  capacity: number;

  @ApiProperty({ example: 10 })
  movieId: number;
}
