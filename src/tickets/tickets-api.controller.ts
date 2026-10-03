import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
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
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketEntity } from './entities/ticket.entity';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../auth/auth.types';
import type { Request } from 'express';

@ApiTags('tickets')
@Controller('api/tickets')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard, RolesGuard)
export class TicketsApiController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.ADMIN)
  @ApiOperation({
    summary: 'Получить список всех билетов (только для админов)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Список билетов.',
    type: [TicketEntity],
  })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен (нужны права админа)',
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    return this.ticketsService.findAll(skip, limitNum);
  }

  @Get(':id')
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.USER, AppRole.ADMIN)
  @ApiOperation({ summary: 'Получить билет по ID' })
  @ApiParam({ name: 'id', description: 'ID билета' })
  @ApiResponse({ status: 200, description: 'Билет найден', type: TicketEntity })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 403, description: 'Попытка получить чужой билет' })
  @ApiResponse({ status: 404, description: 'Билет не найден' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const ticket = await this.ticketsService.findOne(id);
    const authUser = req.authUser!;

    if (ticket.userId !== authUser.userId && authUser.role !== AppRole.ADMIN) {
      throw new ForbiddenException('Нельзя просматривать чужие билеты');
    }

    return ticket;
  }

  @Post()
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.USER, AppRole.ADMIN)
  @ApiOperation({ summary: 'Купить билет' })
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiResponse({
    status: 201,
    description: 'Билет успешно создан',
    type: TicketEntity,
  })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 404, description: 'Сеанс не найден' })
  async create(@Body() dto: CreateTicketDto, @Req() req: Request) {
    return this.ticketsService.create(req.authUser!.userId, dto.sessionId);
  }

  @Delete(':id')
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.USER, AppRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Отменить билет' })
  @ApiParam({ name: 'id', description: 'ID билета' })
  @ApiResponse({ status: 204, description: 'Билет удален' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 403, description: 'Попытка удалить чужой билет' })
  @ApiResponse({ status: 404, description: 'Билет не найден' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const authUser = req.authUser!;

    await this.ticketsService.remove(
      id,
      authUser.userId,
      authUser.role === AppRole.ADMIN,
    );
    return;
  }
}
