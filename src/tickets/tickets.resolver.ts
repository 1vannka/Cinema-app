import {
  Args,
  Context,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  ForbiddenException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { IsInt, Min } from 'class-validator';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { TicketType } from '../graphql/types/ticket.type';
import { SessionType } from '../graphql/types/session.type';
import { UserType } from '../graphql/types/user.type';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../auth/auth.types';

@InputType({ description: 'Данные для покупки билета' })
class BuyTicketInput {
  @Field(() => Int, { description: 'Идентификатор сеанса' })
  @IsInt()
  @Min(1)
  sessionId: number;
}

@ObjectType({ description: 'Результат запроса списка билетов с пагинацией' })
class TicketPageType {
  @Field(() => [TicketType], {
    description: 'Список билетов на текущей странице',
  })
  items: TicketType[];

  @Field(() => Int, { description: 'Общее количество билетов' })
  total: number;
}

@Resolver(() => TicketType)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TicketsResolver {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => TicketPageType, {
    description: 'Получить список билетов с пагинацией',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  async tickets(
    @Args('page', {
      type: () => Int,
      nullable: true,
      description: 'Номер страницы, начиная с 1',
    })
    page = 1,
    @Args('limit', {
      type: () => Int,
      nullable: true,
      description: 'Количество элементов на странице',
    })
    limit = 10,
  ) {
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 10;
    const skip = (safePage - 1) * safeLimit;

    return this.ticketsService.findAll(skip, safeLimit);
  }

  @Query(() => TicketType, { description: 'Получить билет по идентификатору' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.USER, AppRole.ADMIN)
  async ticket(
    @Args('id', { type: () => Int, description: 'Идентификатор билета' })
    id: number,
    @Context() context: any,
  ) {
    const authUser = context.req?.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    const ticket = await this.ticketsService.findOne(id);
    if (ticket.userId !== authUser.userId && authUser.role !== AppRole.ADMIN) {
      throw new ForbiddenException('Нельзя просматривать чужие билеты');
    }

    return ticket;
  }

  @Mutation(() => TicketType, { description: 'Купить билет на сеанс' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.USER, AppRole.ADMIN)
  async buyTicket(
    @Args('input', { description: 'Данные для покупки билета' })
    input: BuyTicketInput,
    @Context() context: any,
  ) {
    const authUser = context.req?.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    return this.ticketsService.create(authUser.userId, input.sessionId);
  }

  @Mutation(() => Boolean, { description: 'Отменить купленный билет' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.USER, AppRole.ADMIN)
  async cancelTicket(
    @Args('id', { type: () => Int, description: 'Идентификатор билета' })
    id: number,
    @Context() context: any,
  ) {
    const authUser = context.req?.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    await this.ticketsService.remove(
      id,
      authUser.userId,
      authUser.role === AppRole.ADMIN,
    );
    return true;
  }

  @ResolveField(() => UserType, {
    description: 'Пользователь, которому принадлежит билет',
  })
  async user(@Parent() ticket: TicketType) {
    return this.prisma.user.findUnique({ where: { id: ticket.userId } });
  }

  @ResolveField(() => SessionType, {
    description: 'Сеанс, на который куплен билет',
  })
  async session(@Parent() ticket: TicketType) {
    return this.prisma.session.findUnique({ where: { id: ticket.sessionId } });
  }
}
