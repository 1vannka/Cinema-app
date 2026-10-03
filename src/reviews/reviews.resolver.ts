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
import { IsNotEmpty, IsString } from 'class-validator';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewType } from '../graphql/types/review.type';
import { UserType } from '../graphql/types/user.type';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../auth/auth.types';

@InputType({ description: 'Данные для создания отзыва' })
class CreateReviewInput {
  @Field({ description: 'Текст отзыва' })
  @IsString()
  @IsNotEmpty()
  comment: string;
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
  @Field(() => [ReviewType], {
    description: 'Список отзывов на текущей странице',
  })
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

  @Query(() => ReviewPageType, {
    description: 'Получить список отзывов с пагинацией',
  })
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
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.USER, AppRole.ADMIN)
  async createReview(
    @Args('input', { description: 'Данные нового отзыва' })
    input: CreateReviewInput,
    @Context() context: any,
  ) {
    const authUser = context.req?.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    return this.reviewsService.create(authUser.userId, input.comment);
  }

  @Mutation(() => ReviewType, { description: 'Обновить текст отзыва' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.USER, AppRole.ADMIN)
  async updateReview(
    @Args('id', { type: () => Int, description: 'Идентификатор отзыва' })
    id: number,
    @Args('input', { description: 'Новые данные отзыва' })
    input: UpdateReviewInput,
    @Context() context: any,
  ) {
    const authUser = context.req?.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    const review = await this.reviewsService.findOne(id);
    if (review.userId !== authUser.userId && authUser.role !== AppRole.ADMIN) {
      throw new ForbiddenException('Нельзя редактировать чужой отзыв');
    }

    return this.reviewsService.updateById(id, input.comment);
  }

  @Mutation(() => Boolean, { description: 'Удалить отзыв' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.USER, AppRole.ADMIN)
  async deleteReview(
    @Args('id', { type: () => Int, description: 'Идентификатор отзыва' })
    id: number,
    @Context() context: any,
  ) {
    const authUser = context.req?.authUser;
    if (!authUser) {
      throw new ForbiddenException('Требуется авторизация');
    }

    const review = await this.reviewsService.findOne(id);
    if (review.userId !== authUser.userId && authUser.role !== AppRole.ADMIN) {
      throw new ForbiddenException('Нельзя удалять чужой отзыв');
    }

    await this.reviewsService.removeById(id);
    return true;
  }

  @ResolveField(() => UserType, { description: 'Автор отзыва' })
  async user(@Parent() review: ReviewType) {
    return this.prisma.user.findUnique({ where: { id: review.userId } });
  }
}
