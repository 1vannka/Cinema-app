import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { IsInt, Min } from 'class-validator';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { TicketType } from '../graphql/types/ticket.type';
import { SessionType } from '../graphql/types/session.type';
import { UserType } from '../graphql/types/user.type';

@InputType({ description: 'Данные для покупки билета' })
class BuyTicketInput {
    @Field(() => Int, { description: 'Идентификатор пользователя' })
    @IsInt()
    @Min(1)
    userId: number;

    @Field(() => Int, { description: 'Идентификатор сеанса' })
    @IsInt()
    @Min(1)
    sessionId: number;
}

@ObjectType({ description: 'Результат запроса списка билетов с пагинацией' })
class TicketPageType {
    @Field(() => [TicketType], { description: 'Список билетов на текущей странице' })
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

    @Query(() => TicketPageType, { description: 'Получить список билетов с пагинацией' })
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
    async ticket(
        @Args('id', { type: () => Int, description: 'Идентификатор билета' })
        id: number,
    ) {
        return this.ticketsService.findOne(id);
    }

    @Mutation(() => TicketType, { description: 'Купить билет на сеанс' })
    async buyTicket(
        @Args('input', { description: 'Данные для покупки билета' })
        input: BuyTicketInput,
    ) {
        return this.ticketsService.create(input.userId, input.sessionId);
    }

    @Mutation(() => Boolean, { description: 'Отменить купленный билет' })
    async cancelTicket(
        @Args('id', { type: () => Int, description: 'Идентификатор билета' })
        id: number,
    ) {
        await this.ticketsService.removeById(id);
        return true;
    }

    @ResolveField(() => UserType, { description: 'Пользователь, которому принадлежит билет' })
    async user(@Parent() ticket: TicketType) {
        return this.prisma.user.findUnique({ where: { id: ticket.userId } });
    }

    @ResolveField(() => SessionType, { description: 'Сеанс, на который куплен билет' })
    async session(@Parent() ticket: TicketType) {
        return this.prisma.session.findUnique({ where: { id: ticket.sessionId } });
    }
}
