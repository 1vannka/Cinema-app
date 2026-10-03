import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SuperTokensService } from '../auth/supertokens.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly superTokensService: SuperTokensService,
  ) {}

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
        tickets: {
          include: {
            session: {
              include: {
                movie: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    delete (user as any).password;

    if (user.tickets) {
      (user as any).tickets = user.tickets.map((ticket) => ({
        ...ticket,
        session: {
          ...ticket.session,
          displayDate: new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(ticket.session.datetime)),
        },
      }));

      if (user.reviews) {
        (user as any).reviews = user.reviews.map((review) => ({
          ...review,
          displayDate: new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }).format(new Date(review.createdAt)),
        }));
      }
    }

    return user;
  }

  async findAll(skip?: any, take?: any) {
    if (skip) {
      skip = parseInt(skip);
    }
    if (take) {
      take = parseInt(take);
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: skip,
        take: take,
        select: {
          id: true,
          login: true,
          email: true,
          name: true,
          role: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return { items, total };
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const dataToUpdate: any = {};
    if (updateUserDto.name) {
      dataToUpdate.name = updateUserDto.name;
    }

    return this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        supertokensId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const ticketsCount = await this.prisma.ticket.count({
      where: { userId: id },
    });

    if (ticketsCount > 0) {
      throw new BadRequestException(
        `Нельзя удалить аккаунт, у которого есть ${ticketsCount} билет(ов). Сначала удалите все билеты.`,
      );
    }

    await this.superTokensService.deleteUser(user.supertokensId);

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
