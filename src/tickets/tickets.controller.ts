import { Controller, Get, Post, Body, Param, Req, Res, Render, ForbiddenException, NotFoundException, ParseIntPipe } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import express from 'express';
import {ApiExcludeController} from "@nestjs/swagger";

@ApiExcludeController()
@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) {
    }

    @Get('book/:sessionId')
    @Render('tickets/add')
    async getBookPage(@Param('sessionId', ParseIntPipe) sessionId: number, @Req() req: any, @Res() res: express.Response) {
        if (!req.session.userId) {
            return res.redirect('/auth/register');
        }

        const session = await this.ticketsService.getSessionInfo(sessionId);
        if (!session) {
            throw new NotFoundException('Сеанс не найден');
        }

        const displayDate = new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
        }).format(new Date(session.datetime));

        return {session, displayDate};
    }

    @Post()
    async create(@Body('sessionId', ParseIntPipe) sessionId: number, @Req() req: any, @Res() res: express.Response) {
        if (!req.session.userId) {
            throw new ForbiddenException('Залогинься');
        }

        try {
            await this.ticketsService.create(req.session.userId, sessionId);
            return res.redirect(`/users/${req.session.userId}`);
        } catch (error) {
            const session = await this.ticketsService.getSessionInfo(sessionId);
            if (!session) {
                throw new NotFoundException('Сеанс не найден');
            }

            const displayDate = new Intl.DateTimeFormat('ru-RU', {
                day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
            }).format(new Date(session.datetime));
            return res.render('tickets/add', {error: error.message, session, displayDate});
        }
    }

    @Get(':id/edit')
    @Render('tickets/edit')
    async editPage(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Res() res: express.Response) {
        if (!req.session.userId) {
            return res.redirect('/auth/register');
        }

        const ticket = await this.ticketsService.findOne(id);
        if (!ticket) {
            throw new NotFoundException('Билет не найден');
        }

        if (ticket.userId !== req.session.userId && !req.session.isAdmin) {
            throw new ForbiddenException('Не твой билет');
        }

        const displayDate = new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
        }).format(new Date(ticket.session.datetime));

        return {ticket, displayDate};
    }

    @Post(':id/delete')
    async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Res() res: express.Response) {
        if (!req.session.userId) {
            throw new ForbiddenException();
        }
        await this.ticketsService.remove(id, req.session.userId, req.session.isAdmin);

        return res.redirect(`/users/${req.session.userId}`);
    }
}