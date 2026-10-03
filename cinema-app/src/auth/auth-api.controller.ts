import { Controller, Post, Body, HttpStatus, Res } from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiExcludeController} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import express from 'express';

@ApiExcludeController()
@ApiTags('auth')
@Controller('api/auth')
export class AuthApiController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @ApiOperation({ summary: 'Регистрация нового пользователя' })
    @ApiResponse({ status: 201, description: 'Пользователь успешно зарегистрирован' })
    @ApiResponse({ status: 400, description: 'Логин или Email уже заняты' })
    async register(@Body() body: any, @Res() res: express.Response) {
        const { login, email, password, name } = body;

        const newUser = await this.authService.register(login, email, password, name);

        if (!newUser) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Пользователь с таким логином или email уже существует'
            });
        }

        delete (newUser as any).password;
        return res.status(HttpStatus.CREATED).json(newUser);
    }

    @Post('login')
    @ApiOperation({ summary: 'Вход в систему' })
    @ApiResponse({ status: 200, description: 'Успешный вход' })
    @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
    async login(@Body() body: any, @Res() res: express.Response) {
        const user = await this.authService.validateUser(String(body.login), String(body.password));

        if (!user) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Неверный логин или пароль'
            });
        }

        return res.status(HttpStatus.OK).json({
            message: 'Вход выполнен успешно',
            userId: user.id
        });
    }
}