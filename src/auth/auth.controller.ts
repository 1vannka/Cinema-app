import { Controller, Get, Redirect, Render } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('auth')
export class AuthController {
  @Get('register')
  @Render('auth/register')
  getRegister() {
    return { hideLogin: true };
  }

  @Get('login')
  @Redirect('/auth/register', 302)
  getLogin() {
    return;
  }
}
