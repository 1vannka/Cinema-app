import {
    Controller, Get, Post, Body, Param, Put, Delete, Query, Res, HttpStatus, ParseIntPipe, UsePipes, ValidationPipe,
    HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import {ReviewEntity} from "./entities/review.entity";

@ApiTags('reviews')
@Controller('api/reviews')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ReviewsApiController {
    constructor(private readonly reviewsService: ReviewsService) {}

    @Get()
    @ApiOperation({ summary: 'Получить список отзывов' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Список отзывов', type: [ReviewEntity] })
    async findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        return this.reviewsService.findAllPaginated(skip, limitNum);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Получить отзыв по ID' })
    @ApiParam({ name: 'id', description: 'ID отзыва' })
    @ApiResponse({ status: 200, description: 'Отзыв найден', type: ReviewEntity })
    @ApiResponse({ status: 404, description: 'Отзыв не найден' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.reviewsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Создать отзыв' })
    @ApiResponse({ status: 201, description: 'Отзыв создан', type: ReviewEntity })
    @ApiResponse({ status: 400, description: 'Ошибка валидации' })
    async create(@Body() dto: CreateReviewDto) {
        return this.reviewsService.create(dto.userId, dto.comment);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Изменить текст отзыва' })
    @ApiParam({ name: 'id', description: 'ID отзыва' })
    @ApiResponse({ status: 200, description: 'Отзыв обновлен', type: ReviewEntity })
    @ApiResponse({ status: 404, description: 'Отзыв не найден' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateReviewDto
    ) {
        return this.reviewsService.updateById(id, dto.comment);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Удалить отзыв'})
    @ApiParam({ name: 'id', description: 'ID отзыва' })
    @ApiResponse({ status: 204, description: 'Отзыв удален' })
    @ApiResponse({ status: 404, description: 'Отзыв не найден' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.reviewsService.removeById(id);
    }
}