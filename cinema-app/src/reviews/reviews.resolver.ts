import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewType } from '../graphql/types/review.type';
import { UserType } from '../graphql/types/user.type';

@InputType({ description: 'Данные для создания отзыва' })
class CreateReviewInput {
    @Field({ description: 'Текст отзыва' })
    @IsString()
    @IsNotEmpty()
    comment: string;

    @Field(() => Int, { description: 'Идентификатор автора отзыва' })
    @IsInt()
    @Min(1)
    userId: number;
}

@InputType({ description: 'Данные для обновления отзыва' })
class UpdateReviewInput {
    @Field({ description: 'Новый текст отзыва' })
    @IsString()
    @IsNotEmpty()
    comment: string;
}

@ObjectType({ description: 'Результат запроса списка отзывов с пагинацией' })
class ReviewPageType {
    @Field(() => [ReviewType], { description: 'Список отзывов на текущей странице' })
    items: ReviewType[];

    @Field(() => Int, { description: 'Общее количество отзывов' })
    total: number;
}

@Resolver(() => ReviewType)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ReviewsResolver {
    constructor(
        private readonly reviewsService: ReviewsService,
        private readonly prisma: PrismaService,
    ) {}

    @Query(() => ReviewPageType, { description: 'Получить список отзывов с пагинацией' })
    async reviews(
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

        return this.reviewsService.findAllPaginated(skip, safeLimit);
    }

    @Query(() => ReviewType, { description: 'Получить отзыв по идентификатору' })
    async review(
        @Args('id', { type: () => Int, description: 'Идентификатор отзыва' })
        id: number,
    ) {
        return this.reviewsService.findOne(id);
    }

    @Mutation(() => ReviewType, { description: 'Создать новый отзыв' })
    async createReview(
        @Args('input', { description: 'Данные нового отзыва' })
        input: CreateReviewInput,
    ) {
        return this.reviewsService.create(input.userId, input.comment);
    }

    @Mutation(() => ReviewType, { description: 'Обновить текст отзыва' })
    async updateReview(
        @Args('id', { type: () => Int, description: 'Идентификатор отзыва' })
        id: number,
        @Args('input', { description: 'Новые данные отзыва' })
        input: UpdateReviewInput,
    ) {
        return this.reviewsService.updateById(id, input.comment);
    }

    @Mutation(() => Boolean, { description: 'Удалить отзыв' })
    async deleteReview(
        @Args('id', { type: () => Int, description: 'Идентификатор отзыва' })
        id: number,
    ) {
        await this.reviewsService.removeById(id);
        return true;
    }

    @ResolveField(() => UserType, { description: 'Автор отзыва' })
    async user(@Parent() review: ReviewType) {
        return this.prisma.user.findUnique({ where: { id: review.userId } });
    }
}
