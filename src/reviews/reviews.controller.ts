import { Controller, Get, Post, Body, Param, Req, Res, ForbiddenException, NotFoundException, Sse, ParseIntPipe } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Observable } from 'rxjs';
import express from 'express';
import {ApiExcludeController} from "@nestjs/swagger";

@ApiExcludeController()
@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {
    }

    @Get()
    findAll() {
        return this.reviewsService.findAll();
    }

    @Get('add')
    getAddForm(@Req() req: any, @Res() res: express.Response) {
        if (!req.session.userId) {
            return res.redirect('/auth/register');
        }
        return res.render('reviews/add');
    }

    @Post()
    async create(@Body() body: { comment: string }, @Req() req: any, @Res() res: express.Response) {
        if (!req.session.userId) {
            throw new ForbiddenException('Сначала войдите в систему');
        }
        await this.reviewsService.create(req.session.userId, body.comment);
        return res.redirect('/feedback');
    }

    @Get(':id/edit')
    async getEditForm(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Res() res: express.Response) {
        if (!req.session.userId) {
            return res.redirect('/auth/register');
        }

        const review = await this.reviewsService.findOne(id);
        if (!review) {
            throw new NotFoundException('Отзыв не найден');
        }

        if (review.userId !== req.session.userId && !req.session.isAdmin) {
            throw new ForbiddenException('Нельзя редактировать чужие отзывы');
        }

        return res.render('reviews/edit', {review});
    }

    @Post(':id/edit')
    async update(@Param('id', ParseIntPipe) id: number, @Body() body: {
        comment: string
    }, @Req() req: any, @Res() res: express.Response) {
        if (!req.session.userId) {
            throw new ForbiddenException('Доступ запрещен');
        }
        await this.reviewsService.update(id, req.session.userId, req.session.isAdmin, body.comment);
        return res.redirect('/feedback');
    }

    @Post(':id/delete')
    async removePost(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Res() res: express.Response) {
        if (!req.session.userId) {
            throw new ForbiddenException('Доступ запрещен');
        }
        await this.reviewsService.remove(id, req.session.userId, req.session.isAdmin);
        return res.redirect('/feedback');
    }

    @Sse('stream')
    stream(): Observable<any> {
        return this.reviewsService.reviewStream.asObservable();
    }
}