import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Render,
  NotFoundException,
  ParseIntPipe,
  Req,
  Res,
  ForbiddenException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import type { Request, Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AppRole } from '../auth/auth.types';

@ApiExcludeController()
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @Render('users/profile')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Доступ запрещен');
    }

    if (authUser.userId !== id && authUser.role !== AppRole.ADMIN) {
      throw new ForbiddenException('Это не твой профиль');
    }

    const userProfile = await this.usersService.findOne(id);
    if (!userProfile) {
      throw new NotFoundException('Пользователь не найден');
    }

    return { userProfile };
  }

  @Get(':id/edit')
  @Render('users/edit')
  async getEditForm(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Доступ запрещен');
    }

    if (authUser.userId !== id && authUser.role !== AppRole.ADMIN) {
      throw new ForbiddenException('Это не твой профиль');
    }

    const userProfile = await this.usersService.findOne(id);
    if (!userProfile) {
      throw new NotFoundException('Пользователь не найден');
    }

    return { userProfile };
  }

  @Post(':id/edit')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Доступ запрещен');
    }

    if (authUser.userId !== id && authUser.role !== AppRole.ADMIN) {
      throw new ForbiddenException('Доступ запрещен');
    }

    await this.usersService.update(id, updateUserDto);
    return res.redirect(`/users/${id}`);
  }

  @Post(':id/delete')
  @Render('users/profile')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authUser = req.authUser;
    if (!authUser) {
      throw new ForbiddenException('Доступ запрещен');
    }

    if (authUser.userId !== id) {
      throw new ForbiddenException('Можно удалить только свой аккаунт');
    }

    if (authUser.role === AppRole.ADMIN) {
      throw new ForbiddenException('Администратор не может быть удален');
    }

    try {
      await this.usersService.remove(id);

      return res.redirect('/auth');
    } catch (error) {
      if (error instanceof BadRequestException) {
        const userProfile = await this.usersService.findOne(id);
        return {
          userProfile,
          error: error.getResponse()['message'],
          errorType: 'warning',
        };
      }
      throw error;
    }
  }
}
