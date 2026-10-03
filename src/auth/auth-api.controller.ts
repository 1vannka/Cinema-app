import {
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { SuperTokensResponseDto } from './dto/auth-api.dto';
import { AuthGuard } from './guards/auth.guard';
import { AuthApiExceptionFilter } from './filters/auth-api-exception.filter';

const authFormSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      example: 'artur@example.ru',
    },
    password: {
      type: 'string',
      example: '12345678',
    },
  },
  required: ['email', 'password'],
};

@ApiTags('Auth API')
@Controller('auth')
@UseFilters(AuthApiExceptionFilter)
export class AuthApiController {
  @Post('signin')
  @ApiOperation({ summary: 'Авторизация пользователя' })
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiBody({ schema: authFormSchema })
  @ApiResponse({ status: 200, type: SuperTokensResponseDto })
  async signIn() {
    return;
  }

  @Post('signup')
  @ApiOperation({ summary: 'Регистрация' })
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiBody({ schema: authFormSchema })
  @ApiResponse({ status: 200, type: SuperTokensResponseDto })
  async signUp() {
    return;
  }

  @Post('signout')
  @ApiOperation({ summary: 'Выход' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  async signOut() {
    return;
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Получить данные текущего пользователя',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  async getProfile(@Req() req: any) {
    return {
      message: 'Сессия активна',
      user: req.authUser,
    };
  }
}
