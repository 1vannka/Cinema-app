import {Injectable, NotFoundException} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MoviesService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createMovieDto: CreateMovieDto) {
        return this.prisma.movie.create({
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
    }

    async findAll(skip?: any, take?: any) {
        if (skip) {
            skip = parseInt(skip);
        }
        if (take) {
            take = parseInt(take);
        }

        const [items, total] = await Promise.all([
            this.prisma.movie.findMany({
                skip: skip,
                take: take,
                orderBy: { id: 'desc' }
            }),
            this.prisma.movie.count()
        ]);

        return { items, total };
    }

    async findOne(id: number) {
        const movie = await this.prisma.movie.findUnique({
            where: { id },
            include: { sessions: { orderBy: { datetime: 'asc' } } }
        });

        if (!movie) {
            throw new NotFoundException(`Фильм не найден`);
        }

        if (movie.sessions) {
            (movie as any).sessions = movie.sessions.map(s => {
                return {
                    ...s,
                    displayDate: new Intl.DateTimeFormat('ru-RU', {
                        day: '2-digit',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                    }).format(new Date(s.datetime))
                };
            });
        }
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
        return this.prisma.movie.update({
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
    }

    async remove(id: number) {
        return this.prisma.movie.delete({
            where: { id },
        });
    }
}