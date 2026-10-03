import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Res,
  HttpStatus,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  HttpCode,
  UseGuards,
  Req,
  ForbiddenException,
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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewEntity } from './entities/review.entity';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../auth/auth.types';
import { PublicAccess } from '../auth/decorators/public-access.decorator';
import type { Request } from 'express';

@ApiTags('reviews')
@Controller('api/reviews')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard, RolesGuard)
export class ReviewsApiController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @PublicAccess()
  @ApiOperation({ summary: 'Получить список отзывов' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Список отзывов',
    type: [ReviewEntity],
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    return this.reviewsService.findAllPaginated(skip, limitNum);
  }

  @Get(':id')
  @PublicAccess()
  @ApiOperation({ summary: 'Получить отзыв по ID' })
  @ApiParam({ name: 'id', description: 'ID отзыва' })
  @ApiResponse({ status: 200, description: 'Отзыв найден', type: ReviewEntity })
  @ApiResponse({ status: 404, description: 'Отзыв не найден' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.findOne(id);
  }

  @Post()
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.USER, AppRole.ADMIN)
  @ApiOperation({ summary: 'Создать отзыв' })
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiResponse({ status: 201, description: 'Отзыв создан', type: ReviewEntity })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async create(@Body() dto: CreateReviewDto, @Req() req: Request) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    return this.reviewsService.create(authUser.userId, dto.comment);
  }

  @Put(':id')
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.USER, AppRole.ADMIN)
  @ApiOperation({ summary: 'Изменить текст отзыва' })
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiParam({ name: 'id', description: 'ID отзыва' })
  @ApiResponse({
    status: 200,
    description: 'Отзыв обновлен',
    type: ReviewEntity,
  })
  @ApiResponse({ status: 404, description: 'Отзыв не найден' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewDto,
    @Req() req: Request,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    const review = await this.reviewsService.findOne(id);
    if (review.userId !== authUser.userId && authUser.role !== AppRole.ADMIN) {
      throw new ForbiddenException('Нельзя редактировать чужой отзыв');
    }

    return this.reviewsService.updateById(id, dto.comment);
  }

  @Delete(':id')
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.USER, AppRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить отзыв' })
  @ApiParam({ name: 'id', description: 'ID отзыва' })
  @ApiResponse({ status: 204, description: 'Отзыв удален' })
  @ApiResponse({ status: 404, description: 'Отзыв не найден' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    const review = await this.reviewsService.findOne(id);
    if (review.userId !== authUser.userId && authUser.role !== AppRole.ADMIN) {
      throw new ForbiddenException('Нельзя удалять чужой отзыв');
    }

    return this.reviewsService.removeById(id);
  }
}
