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
  UsePipes,
  ValidationPipe,
  HttpCode,
  Header,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiCookieAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { MovieEntity } from './entities/movie.entity';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { SessionEntity } from '../sessions/entities/session.entity';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../auth/auth.types';
import { PublicAccess } from '../auth/decorators/public-access.decorator';

@ApiTags('movies')
@Controller('api/movies')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard, RolesGuard)
export class MoviesApiController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @PublicAccess()
  @Header('Cache-Control', 'public, max-age=3600, must-revalidate')
  @ApiOperation({ summary: 'Получить список всех фильмов' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер страницы',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество элементов на странице',
  })
  @ApiResponse({
    status: 200,
    description: 'Список фильмов успешно получен',
    type: [MovieEntity],
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    return this.moviesService.findAll(skip, limitNum);
  }

  @Get(':id')
  @PublicAccess()
  @Header('Cache-Control', 'public, max-age=3600, must-revalidate')
  @ApiOperation({ summary: 'Получить фильм по ID' })
  @ApiParam({ name: 'id', description: 'ID фильма' })
  @ApiResponse({ status: 200, description: 'Фильм найден.', type: MovieEntity })
  @ApiResponse({ status: 404, description: 'Фильм не найден.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.findOne(id);
  }

  @Get(':id/sessions')
  @PublicAccess()
  @Header('Cache-Control', 'public, max-age=3600, must-revalidate')
  @ApiOperation({ summary: 'Получить все сеансы конкретного фильма' })
  @ApiParam({ name: 'id', description: 'ID фильма' })
  @ApiResponse({
    status: 200,
    description: 'Сеансы получены.',
    type: [SessionEntity],
  })
  @ApiResponse({ status: 404, description: 'Фильм не найден.' })
  async getMovieSessions(@Param('id', ParseIntPipe) id: number) {
    const movie = await this.moviesService.findOne(id);
    return movie.sessions || [];
  }

  @Post()
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: 'Создать новый фильм' })
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiResponse({
    status: 201,
    description: 'Фильм успешно создан',
    type: MovieEntity,
  })
  @ApiResponse({ status: 400, description: 'Ошибка валидации данных' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен',
  })
  async create(@Body() createMovieDto: CreateMovieDto) {
    return this.moviesService.create(createMovieDto);
  }

  @Put(':id')
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: 'Обновить данные фильма' })
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiParam({ name: 'id', description: 'ID фильма' })
  @ApiResponse({
    status: 200,
    description: 'Фильм обновлен',
    type: MovieEntity,
  })
  @ApiResponse({ status: 404, description: 'Фильм не найден' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovieDto: UpdateMovieDto,
  ) {
    await this.moviesService.findOne(id);
    return this.moviesService.update(id, updateMovieDto);
  }

  @Delete(':id')
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить фильм' })
  @ApiParam({ name: 'id', description: 'ID фильма' })
  @ApiResponse({ status: 204, description: 'Фильм удален' })
  @ApiResponse({ status: 404, description: 'Фильм не найден' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.moviesService.findOne(id);
    await this.moviesService.remove(id);
    return;
  }
}
