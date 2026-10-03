import { Controller, Get, Post, Body, Param, Render, Res, Req, ForbiddenException, NotFoundException, ParseIntPipe } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import express from 'express';
import {ApiExcludeController} from "@nestjs/swagger";

@ApiExcludeController()
@Controller('sessions')
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) {
    }

    @Get('add')
    @Render('sessions/add')
    getAddForm(@Req() req: any) {
        if (!req.session.isAdmin) {
            throw new ForbiddenException('Только для админов');
        }
        return {};
    }

    @Post()
    async create(@Body() dto: CreateSessionDto, @Req() req: any, @Res() res: express.Response) {
        if (!req.session.isAdmin) {
            throw new ForbiddenException('Доступ запрещен');
        }
        try {
            await this.sessionsService.create(dto);
            return res.redirect('/movies');
        } catch (error) {
            return res.render('sessions/add', {error: error.message, formData: dto});
        }
    }

    @Get(':id/edit')
    async getEditForm(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Res() res: express.Response) {
        if (!req.session.isAdmin) {
            throw new ForbiddenException('Доступ запрещен');
        }

        const session = await this.sessionsService.findOne(id);
        if (!session) {
            throw new NotFoundException('Сеанс не найден');
        }

        const formattedDate = session.datetime.toISOString().slice(0, 16);

        return res.render('sessions/edit', {
            session,
            formattedDate
        });
    }

    @Post(':id/edit')
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateSessionDto, @Req() req: any, @Res() res: express.Response) {
        if (!req.session.isAdmin) {
            throw new ForbiddenException('Доступ запрещен');
        }

        const session = await this.sessionsService.update(id, dto);
        return res.redirect(`/movies/${session.movieId}`);
    }

    @Post(':id/delete')
    async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Res() res: express.Response) {
        if (!req.session.isAdmin) {
            throw new ForbiddenException('Доступ запрещен');
        }

        const session = await this.sessionsService.findOne(id);
        if (session) {
            await this.sessionsService.remove(id);

            return res.redirect(`/movies/${session.movieId}`);
        }
        return res.redirect('/movies');
    }
}