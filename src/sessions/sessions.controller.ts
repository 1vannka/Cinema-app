import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Render,
  Res,
  ForbiddenException,
  NotFoundException,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import express from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../auth/auth.types';

@ApiExcludeController()
@Controller('sessions')
@UseGuards(AuthGuard, RolesGuard)
@Roles(AppRole.ADMIN)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('add')
  @Render('sessions/add')
  getAddForm() {
    return {};
  }

  @Post()
  async create(@Body() dto: CreateSessionDto, @Res() res: express.Response) {
    try {
      await this.sessionsService.create(dto);
      return res.redirect('/movies');
    } catch (error) {
      return res.render('sessions/add', {
        error: error.message,
        formData: dto,
      });
    }
  }

  @Get(':id/edit')
  async getEditForm(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: express.Response,
  ) {
    const session = await this.sessionsService.findOne(id);
    if (!session) {
      throw new NotFoundException('Сеанс не найден');
    }

    const formattedDate = session.datetime.toISOString().slice(0, 16);

    return res.render('sessions/edit', {
      session,
      formattedDate,
    });
  }

  @Post(':id/edit')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSessionDto,
    @Res() res: express.Response,
  ) {
    const session = await this.sessionsService.update(id, dto);
    return res.redirect(`/movies/${session.movieId}`);
  }

  @Post(':id/delete')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: express.Response,
  ) {
    const session = await this.sessionsService.findOne(id);
    if (session) {
      await this.sessionsService.remove(id);

      return res.redirect(`/movies/${session.movieId}`);
    }
    return res.redirect('/movies');
  }
}
