import {Controller, Post, Get, Body, Req, Res, Render} from '@nestjs/common';
import express from 'express';
import {AuthService} from './auth.service';
import {ApiExcludeController} from "@nestjs/swagger";

@ApiExcludeController()
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }

    @Get('register')
    @Render('auth/register')
    getRegister() {
        return { hideLogin: true };
    }

    @Post('register')
    async register(@Body() body: any, @Req() req: any, @Res() res: express.Response) {
        const { login, email, password, name } = body;

        const newUser = await this.authService.register(login, email, password, name);

        if (!newUser) {
            req.session.authError = 'Пользователь с таким логином или email уже существует';
            return res.redirect('/auth/register');
        }

        return res.redirect('/');
    }

    @Post('login')
    async login(@Body() body: any, @Req() req: any, @Res() res: express.Response) {
        const { login, password } = body;
        const referer = req.get('referer') || '/';

        const user = await this.authService.validateUser(String(login), String(password));

        if (!user) {
            req.session.authError = 'Неверный логин или пароль';
            return res.redirect(referer);
        }

        req.session.userId = user.id;

        req.session.isAdmin = user.login === 'admin';

        return res.redirect(referer);
    }

    @Get('logout')
    logout(@Req() req: any, @Res() res: express.Response) {
        const referer = req.get('referer') || '/';
        req.session.destroy(() => res.redirect(referer));
    }
}