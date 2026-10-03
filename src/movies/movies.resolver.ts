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
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MoviesService } from './movies.service';
import { PrismaService } from '../prisma/prisma.service';
import { MovieType } from '../graphql/types/movie.type';
import { SessionType } from '../graphql/types/session.type';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../auth/auth.types';

@InputType({ description: 'Данные для создания фильма' })
class CreateMovieInput {
  @Field({ description: 'Название фильма' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field({ description: 'Описание фильма' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @Field({ nullable: true, description: 'Путь к постеру' })
  @IsOptional()
  @IsString()
  image?: string;

  @Field({ nullable: true, description: 'Режиссер фильма' })
  @IsOptional()
  @IsString()
  director?: string;

  @Field({ nullable: true, description: 'Жанр фильма' })
  @IsOptional()
  @IsString()
  genre?: string;

  @Field(() => Int, { nullable: true, description: 'Длительность фильма' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @Field(() => Int, { nullable: true, description: 'Год выпуска' })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;
}

@InputType({ description: 'Данные для обновления фильма' })
class UpdateMovieInput {
  @Field({ nullable: true, description: 'Название фильма' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @Field({ nullable: true, description: 'Описание фильма' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @Field({ nullable: true, description: 'Путь к постеру фильма' })
  @IsOptional()
  @IsString()
  image?: string;

  @Field({ nullable: true, description: 'Режиссер фильма' })
  @IsOptional()
  @IsString()
  director?: string;

  @Field({ nullable: true, description: 'Жанр фильма' })
  @IsOptional()
  @IsString()
  genre?: string;

  @Field(() => Int, { nullable: true, description: 'Длительность фильма' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @Field(() => Int, { nullable: true, description: 'Год выпуска' })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;
}

@ObjectType({ description: 'Результат запроса списка фильмов с пагинацией' })
class MoviePageType {
  @Field(() => [MovieType], {
    description: 'Список фильмов на текущей странице',
  })
  items: MovieType[];

  @Field(() => Int, { description: 'Общее количество фильмов' })
  total: number;
}

@Resolver(() => MovieType)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MoviesResolver {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => MoviePageType, {
    description: 'Получить список фильмов с пагинацией',
  })
  async movies(
    @Args('page', {
      type: () => Int,
      nullable: true,
      description: 'Номер страницы',
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

    return this.moviesService.findAll(skip, safeLimit);
  }

  @Query(() => MovieType, { description: 'Получить фильм по идентификатору' })
  async movie(
    @Args('id', { type: () => Int, description: 'Идентификатор фильма' })
    id: number,
  ) {
    return this.moviesService.findOne(id);
  }

  @Mutation(() => MovieType, { description: 'Создать новый фильм' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  async createMovie(
    @Args('input', { description: 'Данные нового фильма' })
    input: CreateMovieInput,
  ) {
    return this.moviesService.create(input);
  }

  @Mutation(() => MovieType, { description: 'Обновить существующий фильм' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  async updateMovie(
    @Args('id', { type: () => Int, description: 'Идентификатор фильма' })
    id: number,
    @Args('input', { description: 'Новые данные фильма' })
    input: UpdateMovieInput,
  ) {
    await this.moviesService.findOne(id);
    return this.moviesService.update(id, input);
  }

  @Mutation(() => Boolean, { description: 'Удалить фильм' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  async removeMovie(
    @Args('id', { type: () => Int, description: 'Идентификатор фильма' })
    id: number,
  ) {
    await this.moviesService.findOne(id);
    await this.moviesService.remove(id);
    return true;
  }

  @ResolveField(() => [SessionType], {
    description: 'Сеансы выбранного фильма',
  })
  async sessions(@Parent() movie: MovieType) {
    return this.prisma.session.findMany({
      where: { movieId: movie.id },
      orderBy: { datetime: 'asc' },
    });
  }
}
