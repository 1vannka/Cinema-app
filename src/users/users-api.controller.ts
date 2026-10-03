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
  BadRequestException,
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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { TicketEntity } from '../tickets/entities/ticket.entity';
import { ReviewEntity } from '../reviews/entities/review.entity';
import { DeleteUserWithPasswordDto } from './dto/delete-user-with-password.dto';
import { UpdateUserWithPasswordDto } from './dto/update-user-with-password.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../auth/auth.types';
import { PublicAccess } from '../auth/decorators/public-access.decorator';
import type { Request } from 'express';

@ApiTags('users')
@Controller('api/users')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthGuard, RolesGuard)
export class UsersApiController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: 'Получить список пользователей' })
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
    description: 'Количество на странице',
  })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей',
    type: [UserEntity],
  })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен',
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    return this.usersService.findAll(skip, limitNum);
  }

  @Get(':id')
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.USER, AppRole.ADMIN)
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Пользователь найден',
    type: UserEntity,
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    if (authUser.role !== AppRole.ADMIN && authUser.userId !== id) {
      throw new ForbiddenException('Можно получить только свой профиль');
    }

    return this.usersService.findOne(id);
  }

  @Get(':id/reviews')
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.USER, AppRole.ADMIN)
  @ApiOperation({ summary: 'Получить все отзывы конкретного пользователя' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Список отзывов',
    type: [ReviewEntity],
  })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getUserReviews(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    if (authUser.role !== AppRole.ADMIN && authUser.userId !== id) {
      throw new ForbiddenException('Можно просматривать только свои отзывы');
    }

    const user = await this.usersService.findOne(id);
    return user.reviews || [];
  }

  @Get(':id/tickets')
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.USER, AppRole.ADMIN)
  @ApiOperation({ summary: 'Получить все билеты конкретного пользователя' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Список билетов',
    type: [TicketEntity],
  })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getUserTickets(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    if (authUser.role !== AppRole.ADMIN && authUser.userId !== id) {
      throw new ForbiddenException('Можно просматривать только свои билеты');
    }

    const user = await this.usersService.findOne(id);
    return user.tickets || [];
  }

  @Put(':id')
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.USER, AppRole.ADMIN)
  @ApiOperation({ summary: 'Обновить пользователя' })
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Данные обновлены',
    type: UserEntity,
  })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserWithPasswordDto,
    @Req() req: Request,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    if (authUser.role !== AppRole.ADMIN && authUser.userId !== id) {
      throw new ForbiddenException('Можно изменять только свой профиль');
    }

    await this.usersService.findOne(id);

    const updateUserDto: UpdateUserDto = {
      name: body.name,
    };

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiCookieAuth('sAccessToken')
  @Roles(AppRole.USER, AppRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @ApiResponse({ status: 204, description: 'Пользователь удален' })
  @ApiResponse({
    status: 400,
    description: 'Нельзя удалить пользователя с активными билетами',
  })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    if (authUser.role !== AppRole.ADMIN && authUser.userId !== id) {
      throw new ForbiddenException('Можно удалить только свой профиль');
    }

    await this.usersService.findOne(id);
    await this.usersService.remove(id);

    return;
  }
}
