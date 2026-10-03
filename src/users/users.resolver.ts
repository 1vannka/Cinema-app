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
  BadRequestException,
  ForbiddenException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserType } from '../graphql/types/user.type';
import { ReviewType } from '../graphql/types/review.type';
import { TicketType } from '../graphql/types/ticket.type';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../auth/auth.types';

@InputType({ description: 'Данные для обновления пользователя' })
class UpdateUserInput {
  @Field({
    nullable: true,
    description: 'Текущий пароль пользователя для подтверждения изменений',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  currentPassword?: string;

  @Field({ nullable: true, description: 'Новое отображаемое имя пользователя' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Field({ nullable: true, description: 'Новый пароль пользователя' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

@InputType({ description: 'Данные для подтвержденного удаления пользователя' })
class DeleteUserInput {
  @Field(() => Int, { description: 'Идентификатор пользователя' })
  @IsInt()
  @Min(1)
  id: number;

  @Field({ nullable: true, description: 'Текущий пароль пользователя' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

@ObjectType({
  description: 'Результат запроса списка пользователей с пагинацией',
})
class UserPageType {
  @Field(() => [UserType], {
    description: 'Список пользователей на текущей странице',
  })
  items: UserType[];

  @Field(() => Int, { description: 'Общее количество пользователей' })
  total: number;
}

@Resolver(() => UserType)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => UserPageType, {
    description: 'Получить список пользователей с пагинацией',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  async users(
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

    return this.usersService.findAll(skip, safeLimit);
  }

  @Query(() => UserType, {
    description: 'Получить пользователя по идентификатору',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.USER, AppRole.ADMIN)
  async user(
    @Args('id', { type: () => Int, description: 'Идентификатор пользователя' })
    id: number,
    @Context() context: any,
  ) {
    const authUser = context.req?.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    if (authUser.role !== AppRole.ADMIN && authUser.userId !== id) {
      throw new ForbiddenException('Можно получить только свой профиль');
    }

    return this.usersService.findOne(id);
  }

  @Mutation(() => UserType, { description: 'Обновить пользователя' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.USER, AppRole.ADMIN)
  async updateUser(
    @Args('id', { type: () => Int, description: 'Идентификатор пользователя' })
    id: number,
    @Args('input', { description: 'Новые данные пользователя' })
    input: UpdateUserInput,
    @Context() context: any,
  ) {
    const authUser = context.req?.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    if (authUser.role !== AppRole.ADMIN && authUser.userId !== id) {
      throw new ForbiddenException('Можно изменять только свой профиль');
    }

    await this.usersService.findOne(id);

    return this.usersService.update(id, {
      name: input.name,
    });
  }

  @Mutation(() => Boolean, { description: 'Удалить пользователя' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.USER, AppRole.ADMIN)
  async deleteUser(
    @Args('input', { description: 'Данные для удаления пользователя' })
    input: DeleteUserInput,
    @Context() context: any,
  ) {
    const authUser = context.req?.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    if (authUser.role !== AppRole.ADMIN && authUser.userId !== input.id) {
      throw new ForbiddenException('Можно удалить только свой профиль');
    }

    await this.usersService.findOne(input.id);
    await this.usersService.remove(input.id);

    return true;
  }

  @ResolveField(() => [ReviewType], { description: 'Отзывы пользователя' })
  async reviews(@Parent() user: UserType) {
    return this.prisma.review.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  @ResolveField(() => [TicketType], { description: 'Билеты пользователя' })
  async tickets(@Parent() user: UserType) {
    return this.prisma.ticket.findMany({
      where: { userId: user.id },
      orderBy: { id: 'desc' },
    });
  }
}
