import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionType } from '../graphql/types/session.type';
import { MovieType } from '../graphql/types/movie.type';
import { TicketType } from '../graphql/types/ticket.type';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../auth/auth.types';

@InputType({ description: 'Данные для создания сеанса' })
class CreateSessionInput {
  @Field({ description: 'Название фильма, для которого создается сеанс' })
  @IsString()
  @IsNotEmpty()
  movieTitle: string;

  @Field({ description: 'Дата и время начала сеанса в ISO-формате' })
  @IsDateString()
  @IsNotEmpty()
  datetime: string;

  @Field({ nullable: true, description: 'Название зала' })
  @IsOptional()
  @IsString()
  hall?: string;

  @Field(() => Int, { nullable: true, description: 'Вместимость зала' })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

@InputType({ description: 'Данные для обновления сеанса' })
class UpdateSessionInput {
  @Field({ nullable: true, description: 'Новое название фильма' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  movieTitle?: string;

  @Field({ nullable: true, description: 'Новая дата и время начала' })
  @IsOptional()
  @IsDateString()
  datetime?: string;

  @Field({ nullable: true, description: 'Новое название зала' })
  @IsOptional()
  @IsString()
  hall?: string;

  @Field(() => Int, { nullable: true, description: 'Новая вместимость зала' })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

@ObjectType({ description: 'Результат запроса списка сеансов с пагинацией' })
class SessionPageType {
  @Field(() => [SessionType], {
    description: 'Список сеансов на текущей странице',
  })
  items: SessionType[];

  @Field(() => Int, { description: 'Общее количество сеансов' })
  total: number;
}

@Resolver(() => SessionType)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class SessionsResolver {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => SessionPageType, {
    description: 'Получить список сеансов с пагинацией',
  })
  async sessions(
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

    return this.sessionsService.findAll(skip, safeLimit);
  }

  @Query(() => SessionType, { description: 'Получить сеанс по идентификатору' })
  async session(
    @Args('id', { type: () => Int, description: 'Идентификатор сеанса' })
    id: number,
  ) {
    return this.sessionsService.findOne(id);
  }

  @Mutation(() => SessionType, { description: 'Создать новый сеанс' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  async createSession(
    @Args('input', { description: 'Данные нового сеанса' })
    input: CreateSessionInput,
  ) {
    return this.sessionsService.create(input);
  }

  @Mutation(() => SessionType, { description: 'Обновить сеанс' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  async updateSession(
    @Args('id', { type: () => Int, description: 'Идентификатор сеанса' })
    id: number,
    @Args('input', { description: 'Новые данные сеанса' })
    input: UpdateSessionInput,
  ) {
    await this.sessionsService.findOne(id);
    return this.sessionsService.update(id, input);
  }

  @Mutation(() => Boolean, { description: 'Удалить сеанс' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  async removeSession(
    @Args('id', { type: () => Int, description: 'Идентификатор сеанса' })
    id: number,
  ) {
    await this.sessionsService.findOne(id);
    await this.sessionsService.remove(id);
    return true;
  }

  @ResolveField(() => MovieType, {
    description: 'Фильм, к которому относится сеанс',
  })
  async movie(@Parent() session: SessionType) {
    return this.prisma.movie.findUnique({ where: { id: session.movieId } });
  }

  @ResolveField(() => [TicketType], {
    description: 'Билеты, купленные на этот сеанс',
  })
  async tickets(@Parent() session: SessionType) {
    return this.prisma.ticket.findMany({
      where: { sessionId: session.id },
      orderBy: [{ row: 'asc' }, { seat: 'asc' }],
    });
  }
}
