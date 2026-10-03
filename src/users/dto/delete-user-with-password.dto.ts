import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class DeleteUserWithPasswordDto {
  @ApiProperty({
    example: '12345678',
    description: 'Текущий пароль пользователя',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
