import { ApiProperty } from '@nestjs/swagger';

export class FormFieldDto {
  @ApiProperty({ example: 'email', description: 'ID поля' })
  id: string;

  @ApiProperty({ example: 'admin@cinema.ru', description: 'Значение поля' })
  value: string;
}

export class SuperTokensAuthDto {
  @ApiProperty({
    type: [FormFieldDto],
    example: [
      { id: 'email', value: 'admin@cinema.ru' },
      { id: 'password', value: '12345678' },
    ],
  })
  formFields: FormFieldDto[];
}

export class SuperTokensResponseDto {
  @ApiProperty({ example: 'OK' })
  status: string;
}
