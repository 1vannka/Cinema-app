import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserWithPasswordDto {
  @ApiProperty({
    example: '12345678',
    description: 'Текущий пароль пользователя',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  currentPassword: string;

  @ApiPropertyOptional({
    example: 'Новое имя',
    description: 'Новое имя пользователя',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    example: '87654321',
    description: 'Новый пароль пользователя',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
