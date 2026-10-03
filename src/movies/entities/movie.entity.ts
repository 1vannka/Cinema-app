import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MovieEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Начало' })
  title: string;

  @ApiPropertyOptional({ example: 'Кристофер Нолан' })
  director: string | null;

  @ApiPropertyOptional({ example: 2010 })
  year: number | null;

  @ApiPropertyOptional({ example: 'Фантастика' })
  genre: string | null;

  @ApiPropertyOptional({ example: 123 })
  duration: number | null;

  @ApiProperty({ example: 'Сюжет про сны' })
  description: string;

  @ApiPropertyOptional({ example: '/images/inception.jpg' })
  image: string | null;
}
