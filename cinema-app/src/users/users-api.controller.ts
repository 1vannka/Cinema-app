import {
    Controller, Get, Post, Body, Param, Put, Delete, Query, Res, HttpStatus, ParseIntPipe, UsePipes, ValidationPipe,
    HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import express, { Response } from 'express';
import {UserEntity} from "./entities/user.entity";
import {TicketEntity} from "../tickets/entities/ticket.entity";
import {ReviewEntity} from "../reviews/entities/review.entity";
import {DeleteUserWithPasswordDto} from "./dto/delete-user-with-password.dto";
import {UpdateUserWithPasswordDto} from "./dto/update-user-with-password.dto";

@ApiTags('users')
@Controller('api/users')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class UsersApiController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @ApiOperation({ summary: 'Получить список пользователей' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество на странице' })
    @ApiResponse({ status: 200, description: 'Список пользователей', type: [UserEntity] })
    async findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        return this.usersService.findAll(skip, limitNum);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Получить пользователя по ID' })
    @ApiParam({ name: 'id', description: 'ID пользователя' })
    @ApiResponse({ status: 200, description: 'Пользователь найден', type: UserEntity })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Создать пользователя' })
    @ApiResponse({ status: 201, description: 'Пользователь создан' })
    async create(@Body() createUserDto: CreateUserDto) {
        throw new Error('Для создания используйте /auth/register');
    }

    @Get(':id/reviews')
    @ApiOperation({ summary: 'Получить все отзывы конкретного пользователя' })
    @ApiParam({ name: 'id', description: 'ID пользователя' })
    @ApiResponse({ status: 200, description: 'Список отзывов', type: [ReviewEntity] })
    async getUserReviews(@Param('id', ParseIntPipe) id: number) {
        const user = await this.usersService.findOne(id);
        return user.reviews || [];
    }

    @Get(':id/tickets')
    @ApiOperation({ summary: 'Получить все билеты конкретного пользователя' })
    @ApiParam({ name: 'id', description: 'ID пользователя' })
    @ApiResponse({ status: 200, description: 'Список билетов', type: [TicketEntity] })
    async getUserTickets(@Param('id', ParseIntPipe) id: number) {
        const user = await this.usersService.findOne(id);
        return user.tickets || [];
    }

    @Put(':id')
    @ApiOperation({ summary: 'Обновить пользователя' })
    @ApiParam({ name: 'id', description: 'ID пользователя' })
    @ApiResponse({ status: 200, description: 'Данные обновлены', type: UserEntity })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateUserWithPasswordDto
    ) {
        await this.usersService.findOne(id);
        const updateUserDto: UpdateUserDto = {
            name: body.name,
            password: body.password,
        };

        return this.usersService.updateWithPassword(id, body.currentPassword, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Удалить пользователя' })
    @ApiParam({ name: 'id', description: 'ID пользователя' })
    @ApiResponse({ status: 204, description: 'Пользователь удален' })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: DeleteUserWithPasswordDto,
    ) {
        await this.usersService.findOne(id);
        await this.usersService.removeWithPassword(id, body.password);
        return;
    }
}