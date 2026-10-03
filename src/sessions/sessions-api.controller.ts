import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    ParseIntPipe,
    UsePipes,
    ValidationPipe,
    Query, Res, HttpStatus, HttpCode
} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery} from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import express from "express";
import {TicketEntity} from "../tickets/entities/ticket.entity";
import {SessionEntity} from "./entities/session.entity";
import {UpdateSessionDto} from "./dto/update-session.dto";

@ApiTags('sessions')
@Controller('api/sessions')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class SessionsApiController {
    constructor(private readonly sessionsService: SessionsService) {}

    @Get()
    @ApiOperation({ summary: 'Получить список всех сеансов' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество элементов' })
    @ApiResponse({ status: 200, description: 'Список сеансов', type: [SessionEntity] })
    async findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        return this.sessionsService.findAll(skip, limitNum);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Получить сеанс по ID' })
    @ApiParam({ name: 'id', description: 'ID сеанса' })
    @ApiResponse({ status: 200, description: 'Сеанс найден', type: SessionEntity })
    @ApiResponse({ status: 404, description: 'Сеанс не найден' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.sessionsService.findOne(id);
    }

    @Get(':id/tickets')
    @ApiOperation({ summary: 'Получить все билеты на конкретный сеанс' })
    @ApiParam({ name: 'id', description: 'ID сеанса' })
    @ApiResponse({ status: 200, description: 'Список билетов.', type: [TicketEntity] })
    async getSessionTickets(@Param('id', ParseIntPipe) id: number) {
        const session = await this.sessionsService.findOne(id);
        return session.tickets || [];
    }

    @Post()
    @ApiOperation({ summary: 'Создать новый сеанс' })
    @ApiResponse({ status: 201, description: 'Сеанс успешно создан', type: SessionEntity })
    @ApiResponse({ status: 400, description: 'Ошибка валидации данных' })
    async create(@Body() createSessionDto: CreateSessionDto) {
        return this.sessionsService.create(createSessionDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Обновить данные сеанса' })
    @ApiParam({ name: 'id', description: 'ID сеанса' })
    @ApiResponse({ status: 200, description: 'Сеанс обновлен', type: SessionEntity })
    @ApiResponse({ status: 404, description: 'Сеанс не найден' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateSessionDto: UpdateSessionDto
    ) {
        await this.sessionsService.findOne(id);
        return this.sessionsService.update(id, updateSessionDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Удалить сеанс' })
    @ApiParam({ name: 'id', description: 'ID сеанса' })
    @ApiResponse({ status: 204, description: 'Сеанс удален' })
    @ApiResponse({ status: 404, description: 'Сеанс не найден' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.sessionsService.findOne(id);
        await this.sessionsService.remove(id);
        return;
    }
}