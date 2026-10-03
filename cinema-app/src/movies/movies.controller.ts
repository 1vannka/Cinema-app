import {
    Controller, Get, Post, Body, Param, NotFoundException, ParseIntPipe, Render, Res, Req, ForbiddenException,
    Query
} from '@nestjs/common';
import express from 'express';
import {MoviesService} from './movies.service';
import {CreateMovieDto} from './dto/create-movie.dto';
import {UpdateMovieDto} from './dto/update-movie.dto';
import {ApiExcludeController} from "@nestjs/swagger";

@ApiExcludeController()
@Controller('movies')
export class MoviesController {
    constructor(private readonly moviesService: MoviesService) {
    }

    @Get()
    @Render('movies/poster')
    async findAll() {
        const { items } = await this.moviesService.findAll();
        return { posterMovies: items };
    }

    @Get('add')
    @Render('movies/add')
    getAddForm(@Req() req: any) {
        if (!req.session?.isAdmin) {
            throw new ForbiddenException('Только для админа');
        }

        return {};
    }

    @Post()
    async create(@Body() createMovieDto: CreateMovieDto, @Res() res: express.Response, @Req() req: any) {
        if (!req.session?.isAdmin) throw new ForbiddenException('Только для админа');

        if (createMovieDto.duration) {
            createMovieDto.duration = Number(createMovieDto.duration);
        }
        if (createMovieDto.year) {
            createMovieDto.year = Number(createMovieDto.year);
        }

        await this.moviesService.create(createMovieDto);
        return res.redirect('/movies');
    }

    @Get('search')
    async search(@Query('q') q: string, @Res() res: express.Response) {
        if (!q || q.trim() === '') {
            return res.redirect('/movies');
        }

        const movie = await this.moviesService.search(q);

        if (movie) {
            return res.redirect(`/movies/${movie.id}`);
        } else {
            return res.redirect(`/movies?error=Фильм «${q}» не найден`);
        }
    }

    @Get(':id')
    @Render('movies/movie')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const movie = await this.moviesService.findOne(id);

        if (!movie) {
            throw new NotFoundException('Фильм не найден');
        }
        return { movie };
    }

    @Get(':id/edit')
    @Render('movies/edit')
    async getEditForm(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        if (!req.session?.isAdmin) {
            throw new ForbiddenException('Только для админа');
        }
        const movie = await this.moviesService.findOne(id);
        if (!movie) {
            throw new NotFoundException('Фильм не найден');
        }

        return { movie };
    }

    @Post(':id/edit')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateMovieDto: UpdateMovieDto,
        @Res() res: express.Response,
        @Req() req: any
    ) {
        if (!req.session?.isAdmin) {
            throw new ForbiddenException('Только для админа');
        }

        if (updateMovieDto.duration) {
            updateMovieDto.duration = Number(updateMovieDto.duration);
        }
        if (updateMovieDto.year) {
            updateMovieDto.year = Number(updateMovieDto.year);
        }

        await this.moviesService.update(id, updateMovieDto);
        return res.redirect(`/movies/${id}`);
    }

    @Post(':id/delete')
    async remove(@Param('id', ParseIntPipe) id: number, @Res() res: express.Response, @Req() req: any) {
        if (!req.session?.isAdmin) {
            throw new ForbiddenException('Только для админа');
        }

        await this.moviesService.remove(id);
        return res.redirect('/movies');
    }
}