import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    Query,
    HttpStatus,
    ParseIntPipe,
    UsePipes, ValidationPipe, HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import {MovieEntity} from "./entities/movie.entity";
import {UpdateMovieDto} from "./dto/update-movie.dto";
import {SessionEntity} from "../sessions/entities/session.entity";

@ApiTags('movies')
@Controller('api/movies')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MoviesApiController {
    constructor(private readonly moviesService: MoviesService) {
    }

    @Get()
    @ApiOperation({summary: 'Получить список всех фильмов'})
    @ApiQuery({name: 'page', required: false, type: Number, description: 'Номер страницы'})
    @ApiQuery({name: 'limit', required: false, type: Number, description: 'Количество элементов на странице'})
    @ApiResponse({status: 200, description: 'Список фильмов успешно получен', type: [MovieEntity]})
    async findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        return this.moviesService.findAll(skip, limitNum);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Получить фильм по ID' })
    @ApiParam({ name: 'id', description: 'ID фильма' })
    @ApiResponse({ status: 200, description: 'Фильм найден.', type: MovieEntity })
    @ApiResponse({ status: 404, description: 'Фильм не найден.' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.moviesService.findOne(id);
    }

    @Get(':id/sessions')
    @ApiOperation({ summary: 'Получить все сеансы конкретного фильма' })
    @ApiParam({ name: 'id', description: 'ID фильма' })
    @ApiResponse({ status: 200, description: 'Сеансы получены.', type: [SessionEntity] })
    async getMovieSessions(@Param('id', ParseIntPipe) id: number) {
        const movie = await this.moviesService.findOne(id);
        return movie.sessions || [];
    }

    @Post()
    @ApiOperation({ summary: 'Создать новый фильм' })
    @ApiResponse({ status: 201, description: 'Фильм успешно создан', type: MovieEntity })
    @ApiResponse({ status: 400, description: 'Ошибка валидации данных' })
    async create(@Body() createMovieDto: CreateMovieDto) {
        return this.moviesService.create(createMovieDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Обновить данные фильма' })
    @ApiParam({ name: 'id', description: 'ID фильма' })
    @ApiResponse({ status: 200, description: 'Фильм обновлен',type: MovieEntity })
    @ApiResponse({ status: 404, description: 'Фильм не найден' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateMovieDto: UpdateMovieDto
    ) {
        await this.moviesService.findOne(id);
        return this.moviesService.update(id, updateMovieDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Удалить фильм' })
    @ApiParam({ name: 'id', description: 'ID фильма' })
    @ApiResponse({ status: 204, description: 'Фильм удален' })
    @ApiResponse({ status: 404, description: 'Фильм не найден' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.moviesService.findOne(id);
        await this.moviesService.remove(id);
        return;
    }
}