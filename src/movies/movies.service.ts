import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MoviesService {
  private readonly listCacheKeys = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private buildListCacheKey(skip?: number, take?: number) {
    return `movies:list:${skip ?? 0}:${take ?? 0}`;
  }

  private buildMovieCacheKey(id: number) {
    return `movies:one:${id}`;
  }

  private async invalidateListCache() {
    for (const key of this.listCacheKeys) {
      await this.cacheManager.del(key);
    }
    this.listCacheKeys.clear();
  }

  private async invalidateMovieCache(id: number) {
    await this.cacheManager.del(this.buildMovieCacheKey(id));
  }

  async create(createMovieDto: CreateMovieDto) {
    const createdMovie = await this.prisma.movie.create({
      data: {
        title: createMovieDto.title,
        description: createMovieDto.description,
        image: createMovieDto.image,
        director: createMovieDto.director,
        genre: createMovieDto.genre,
        duration: createMovieDto.duration,
        year: createMovieDto.year,
      },
    });

    await this.invalidateListCache();

    return createdMovie;
  }

  async findAll(skip?: any, take?: any) {
    if (skip) {
      skip = parseInt(skip);
    }
    if (take) {
      take = parseInt(take);
    }

    const listCacheKey = this.buildListCacheKey(skip, take);
    const cached = await this.cacheManager.get<{ items: any[]; total: number }>(
      listCacheKey,
    );
    if (cached) {
      return cached;
    }

    const [items, total] = await Promise.all([
      this.prisma.movie.findMany({
        skip: skip,
        take: take,
        orderBy: { id: 'desc' },
      }),
      this.prisma.movie.count(),
    ]);

    const result = { items, total };
    await this.cacheManager.set(listCacheKey, result);
    this.listCacheKeys.add(listCacheKey);

    return result;
  }

  async findOne(id: number) {
    const movieCacheKey = this.buildMovieCacheKey(id);
    const cachedMovie = await this.cacheManager.get<any>(movieCacheKey);
    if (cachedMovie) {
      return cachedMovie;
    }

    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: { sessions: { orderBy: { datetime: 'asc' } } },
    });

    if (!movie) {
      throw new NotFoundException(`Фильм не найден`);
    }

    if (movie.sessions) {
      (movie as any).sessions = movie.sessions.map((s) => {
        return {
          ...s,
          displayDate: new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(s.datetime)),
        };
      });
    }

    await this.cacheManager.set(movieCacheKey, movie);

    return movie;
  }

  async search(query: string) {
    return this.prisma.movie.findFirst({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
    });
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const updatedMovie = await this.prisma.movie.update({
      where: { id },
      data: {
        title: updateMovieDto.title,
        description: updateMovieDto.description,
        image: updateMovieDto.image,
        director: updateMovieDto.director,
        genre: updateMovieDto.genre,
        duration: updateMovieDto.duration,
        year: updateMovieDto.year,
      },
    });

    await this.invalidateMovieCache(id);
    await this.invalidateListCache();

    return updatedMovie;
  }

  async remove(id: number) {
    const deletedMovie = await this.prisma.movie.delete({
      where: { id },
    });

    await this.invalidateMovieCache(id);
    await this.invalidateListCache();

    return deletedMovie;
  }
}
