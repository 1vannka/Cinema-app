import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
  Render,
  ForbiddenException,
  NotFoundException,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import type { Request, Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AppRole } from '../auth/auth.types';

@ApiExcludeController()
@Controller('tickets')
@UseGuards(AuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('book/:sessionId')
  @Render('tickets/add')
  async getBookPage(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const session = await this.ticketsService.getSessionInfo(sessionId);
    if (!session) {
      throw new NotFoundException('Сеанс не найден');
    }

    const displayDate = new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(session.datetime));

    return { session, displayDate };
  }

  @Post()
  async create(
    @Body('sessionId', ParseIntPipe) sessionId: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Залогинься');
    }

    try {
      await this.ticketsService.create(authUser.userId, sessionId);
      return res.redirect(`/users/${authUser.userId}`);
    } catch (error) {
      const session = await this.ticketsService.getSessionInfo(sessionId);
      if (!session) {
        throw new NotFoundException('Сеанс не найден');
      }

      const displayDate = new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(session.datetime));
      return res.render('tickets/add', {
        error: error.message,
        session,
        displayDate,
      });
    }
  }

  @Get(':id/edit')
  @Render('tickets/edit')
  async editPage(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Доступ запрещен');
    }

    const ticket = await this.ticketsService.findOne(id);
    if (!ticket) {
      throw new NotFoundException('Билет не найден');
    }

    if (ticket.userId !== authUser.userId && authUser.role !== AppRole.ADMIN) {
      throw new ForbiddenException('Не твой билет');
    }

    const displayDate = new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ticket.session.datetime));

    return { ticket, displayDate };
  }

  @Post(':id/delete')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Доступ запрещен');
    }
    await this.ticketsService.remove(
      id,
      authUser.userId,
      authUser.role === AppRole.ADMIN,
    );

    return res.redirect(`/users/${authUser.userId}`);
  }
}
