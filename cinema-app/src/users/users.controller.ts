import {
    Controller, Get, Post, Body, Param, Render, NotFoundException, ParseIntPipe, Req, Res, ForbiddenException,
    BadRequestException
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import express, { Response } from 'express';
import {ApiExcludeController} from "@nestjs/swagger";

@ApiExcludeController()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get(':id')
    @Render('users/profile')
    async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Res() res: express.Response) {
        if (!req.session.userId) {
            return res.redirect('/auth/register');
        }
        if (req.session.userId !== id && !req.session.isAdmin) {
            throw new ForbiddenException('Это не твой профиль');
        }

        const userProfile = await this.usersService.findOne(id);
        if (!userProfile) {
            throw new NotFoundException('Пользователь не найден');
        }

        return { userProfile };
    }

    @Get(':id/edit')
    @Render('users/edit')
    async getEditForm(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Res() res: express.Response) {
        if (!req.session.userId) {
            return res.redirect('/auth/register');
        }
        if (req.session.userId !== id && !req.session.isAdmin) {
            throw new ForbiddenException('Это не твой профиль');
        }

        const userProfile = await this.usersService.findOne(id);
        if (!userProfile) {
            throw new NotFoundException('Пользователь не найден');
        }

        return { userProfile };
    }

    @Post(':id/edit')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
        @Req() req: any,
        @Res() res: express.Response
    ) {
        if (req.session.userId !== id && !req.session.isAdmin) {
            throw new ForbiddenException('Доступ запрещен');
        }

        await this.usersService.update(id, updateUserDto);
        return res.redirect(`/users/${id}`);
    }

    @Post(':id/delete')
    @Render('users/profile')
    async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Res() res: express.Response) {
        if (req.session.userId !== id) {
            throw new ForbiddenException('Можно удалить только свой аккаунт');
        }

        if (req.session.isAdmin) {
            throw new ForbiddenException('Администратор не может быть удален');
        }

        try {
            await this.usersService.remove(id);
            req.session.destroy(() => res.redirect('/'));
        } catch (error) {
            if (error instanceof BadRequestException) {
                const userProfile = await this.usersService.findOne(id);
                return {
                    userProfile,
                    error: error.getResponse()['message'],
                    errorType: 'warning'
                };
            }
            throw error;
        }
    }
}