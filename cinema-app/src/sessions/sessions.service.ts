import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import {UpdateSessionDto} from "./dto/update-session.dto";

@Injectable()
export class SessionsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateSessionDto) {
        const movie = await this.prisma.movie.findFirst({
            where: { title: dto.movieTitle },
        });

        if (!movie) {
            throw new NotFoundException(`Фильм с названием "${dto.movieTitle}" не найден в базе.`);
        }

        return this.prisma.session.create({
            data: {
                datetime: new Date(dto.datetime),
                hall: dto.hall,
                movieId: movie.id,
                capacity: Number(dto.capacity) || 50,
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
            this.prisma.session.findMany({
                skip: skip,
                take: take,
                orderBy: { datetime: 'asc' },
                include: { movie: true }
            }),
            this.prisma.session.count()
        ]);

        return { items, total };
    }

    async findOne(id: number) {
        const session = await this.prisma.session.findUnique({
            where: { id },
            include: { tickets: true }
        });

        if (!session) {
            throw new NotFoundException('Сеанс не найден');
        }

        return session;
    }

    async update(id: number, dto: UpdateSessionDto) {
        const dataToUpdate: any = {};

        if (dto.datetime) {
            dataToUpdate.datetime = new Date(dto.datetime);
        }
        if (dto.hall !== undefined) {
            dataToUpdate.hall = dto.hall;
        }
        if (dto.capacity !== undefined) {
            dataToUpdate.capacity = Number(dto.capacity);
        }

        if (dto.movieTitle) {
            const movie = await this.prisma.movie.findFirst({
                where: { title: dto.movieTitle },
            });
            if (!movie) {
                throw new NotFoundException(`Фильм с названием "${dto.movieTitle}" не найден.`);
            }
            dataToUpdate.movieId = movie.id;
        }

        return this.prisma.session.update({
            where: { id },
            data: dataToUpdate
        });
    }

    async remove(id: number) {
        return this.prisma.session.delete({ where: { id } });
    }
}