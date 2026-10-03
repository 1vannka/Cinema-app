import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserType } from '../graphql/types/user.type';
import { ReviewType } from '../graphql/types/review.type';
import { TicketType } from '../graphql/types/ticket.type';

@InputType({ description: 'Данные для обновления пользователя' })
class UpdateUserInput {
    @Field({ description: 'Текущий пароль пользователя для подтверждения изменений' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    currentPassword: string;

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

    @Field({ description: 'Текущий пароль пользователя' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}

@ObjectType({ description: 'Результат запроса списка пользователей с пагинацией' })
class UserPageType {
    @Field(() => [UserType], { description: 'Список пользователей на текущей странице' })
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

    @Query(() => UserPageType, { description: 'Получить список пользователей с пагинацией' })
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

    @Query(() => UserType, { description: 'Получить пользователя по идентификатору' })
    async user(
        @Args('id', { type: () => Int, description: 'Идентификатор пользователя' })
        id: number,
    ) {
        return this.usersService.findOne(id);
    }

    @Mutation(() => UserType, { description: 'Обновить пользователя' })
    async updateUser(
        @Args('id', { type: () => Int, description: 'Идентификатор пользователя' })
        id: number,
        @Args('input', { description: 'Новые данные пользователя' })
        input: UpdateUserInput,
    ) {
        await this.usersService.findOne(id);
        return this.usersService.updateWithPassword(id, input.currentPassword, {
            name: input.name,
            password: input.password,
        });
    }

    @Mutation(() => Boolean, { description: 'Удалить пользователя' })
    async deleteUser(
        @Args('input', { description: 'Данные для удаления пользователя' })
        input: DeleteUserInput,
    ) {
        await this.usersService.findOne(input.id);
        await this.usersService.removeWithPassword(input.id, input.password);
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
