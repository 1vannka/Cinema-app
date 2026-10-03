import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
  ForbiddenException,
  NotFoundException,
  Sse,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Observable } from 'rxjs';
import type { Request, Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PublicAccess } from '../auth/decorators/public-access.decorator';
import { AppRole } from '../auth/auth.types';

@ApiExcludeController()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @PublicAccess()
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get('add')
  @UseGuards(AuthGuard)
  getAddForm(@Res() res: Response) {
    return res.render('reviews/add');
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() body: { comment: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Сначала войдите в систему');
    }
    await this.reviewsService.create(authUser.userId, body.comment);
    return res.redirect('/feedback');
  }

  @Get(':id/edit')
  @UseGuards(AuthGuard)
  async getEditForm(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Доступ запрещен');
    }

    const review = await this.reviewsService.findOne(id);
    if (!review) {
      throw new NotFoundException('Отзыв не найден');
    }

    if (review.userId !== authUser.userId && authUser.role !== AppRole.ADMIN) {
      throw new ForbiddenException('Нельзя редактировать чужие отзывы');
    }

    return res.render('reviews/edit', { review });
  }

  @Post(':id/edit')
  @UseGuards(AuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      comment: string;
    },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Доступ запрещен');
    }
    await this.reviewsService.update(
      id,
      authUser.userId,
      authUser.role === AppRole.ADMIN,
      body.comment,
    );
    return res.redirect('/feedback');
  }

  @Post(':id/delete')
  @UseGuards(AuthGuard)
  async removePost(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Доступ запрещен');
    }
    await this.reviewsService.remove(
      id,
      authUser.userId,
      authUser.role === AppRole.ADMIN,
    );
    return res.redirect('/feedback');
  }

  @Sse('stream')
  @PublicAccess()
  stream(): Observable<any> {
    return this.reviewsService.reviewStream.asObservable();
  }
}
