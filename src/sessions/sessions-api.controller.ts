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
  Query,
  Res,
  HttpStatus,
  HttpCode,
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
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { TicketEntity } from '../tickets/entities/ticket.entity';
import { SessionEntity } from './entities/session.entity';
import { UpdateSessionDto } from './dto/update-session.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../auth/auth.types';
import { PublicAccess } from '../auth/decorators/public-access.decorator';

@ApiTags('sessions')
@Controller('api/sessions')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard, RolesGuard)
export class SessionsApiController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @PublicAccess()
  @ApiOperation({ summary: 'Получить список всех сеансов' })
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
    description: 'Количество элементов',
  })
  @ApiResponse({
    status: 200,
    description: 'Список сеансов',
    type: [SessionEntity],
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    return this.sessionsService.findAll(skip, limitNum);
  }

  @Get(':id')
  @PublicAccess()
  @ApiOperation({ summary: 'Получить сеанс по ID' })
  @ApiParam({ name: 'id', description: 'ID сеанса' })
  @ApiResponse({
    status: 200,
    description: 'Сеанс найден',
    type: SessionEntity,
  })
  @ApiResponse({ status: 404, description: 'Сеанс не найден' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.findOne(id);
  }

  @Get(':id/tickets')
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.ADMIN, AppRole.USER)
  @ApiOperation({ summary: 'Получить все билеты на конкретный сеанс' })
  @ApiParam({ name: 'id', description: 'ID сеанса' })
  @ApiResponse({
    status: 200,
    description: 'Список билетов.',
    type: [TicketEntity],
  })
  @ApiResponse({ status: 404, description: 'Сеанс не найден' })
  async getSessionTickets(@Param('id', ParseIntPipe) id: number) {
    const session = await this.sessionsService.findOne(id);
    return session.tickets || [];
  }

  @Post()
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: 'Создать новый сеанс' })
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiResponse({
    status: 201,
    description: 'Сеанс успешно создан',
    type: SessionEntity,
  })
  @ApiResponse({ status: 400, description: 'Ошибка валидации данных' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен',
  })
  async create(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionsService.create(createSessionDto);
  }

  @Put(':id')
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: 'Обновить данные сеанса' })
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiParam({ name: 'id', description: 'ID сеанса' })
  @ApiResponse({
    status: 200,
    description: 'Сеанс обновлен',
    type: SessionEntity,
  })
  @ApiResponse({ status: 404, description: 'Сеанс не найден' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSessionDto: UpdateSessionDto,
  ) {
    await this.sessionsService.findOne(id);
    return this.sessionsService.update(id, updateSessionDto);
  }

  @Delete(':id')
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить сеанс' })
  @ApiParam({ name: 'id', description: 'ID сеанса' })
  @ApiResponse({ status: 204, description: 'Сеанс удален' })
  @ApiResponse({ status: 404, description: 'Сеанс не найден' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен (нужны права админа)',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.sessionsService.findOne(id);
    await this.sessionsService.remove(id);
    return;
  }
}