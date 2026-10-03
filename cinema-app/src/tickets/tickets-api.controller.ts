import {
    Controller, Get, Post, Body, Param, Delete, Query, Res, HttpStatus, ParseIntPipe, UsePipes, ValidationPipe,
    HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import express, { Response } from 'express';
import {TicketEntity} from "./entities/ticket.entity";

@ApiTags('tickets')
@Controller('api/tickets')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TicketsApiController {
    constructor(private readonly ticketsService: TicketsService) {}

    @Get()
    @ApiOperation({ summary: 'Получить список всех билетов' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Список билетов.', type: [TicketEntity] })
    async findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Res() res: express.Response
    ) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        return this.ticketsService.findAll(skip, limitNum);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Получить билет по ID' })
    @ApiParam({ name: 'id', description: 'ID билета' })
    @ApiResponse({ status: 200, description: 'Билет найден', type: TicketEntity })
    @ApiResponse({ status: 404, description: 'Билет не найден' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.ticketsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Купить билет' })
    @ApiResponse({ status: 201, description: 'Билет успешно создан', type: TicketEntity })
    @ApiResponse({ status: 400, description: 'Ошибка валидации' })
    async create(@Body() dto: CreateTicketDto) {
        return this.ticketsService.create(dto.userId, dto.sessionId);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Отменить билет' })
    @ApiParam({ name: 'id', description: 'ID билета' })
    @ApiResponse({ status: 204, description: 'Билет удален' })
    @ApiResponse({ status: 404, description: 'Билет не найден' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.ticketsService.removeById(id);
        return;
    }
}