import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
    constructor(private readonly prisma: PrismaService) {}

    async getSessionInfo(sessionId: number) {
        return this.prisma.session.findUnique({
            where: { id: sessionId },
            include: { movie: true }
        });
    }

    async create(userId: number, sessionId: number) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: { tickets: true }
        });

        if (!session) {
            throw new NotFoundException('Сеанс испарился');
        }

        const capacity = session.capacity;
        const rowLength = 10;

        const takenSeats = new Set(
            session.tickets.map(t => (t.row - 1) * rowLength + t.seat)
        );

        let freeSeatNumber: number | null = null;

        for (let i = 1; i <= capacity; i++) {
            if (!takenSeats.has(i)) {
                freeSeatNumber = i;
                break;
            }
        }

        if (!freeSeatNumber) {
            throw new BadRequestException('Всё распродано');
        }

        const row = Math.floor((freeSeatNumber - 1) / rowLength) + 1;
        const seat = ((freeSeatNumber - 1) % rowLength) + 1;

        return this.prisma.ticket.create({
            data: {
                userId,
                sessionId,
                row,
                seat,
                status: 'Оплачен',
            }
        });
    }

    async findOne(id: number) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id },
            include: { session: { include: { movie: true } } }
        });

        if (!ticket) {
            throw new NotFoundException('Билет не найден');
        }

        return ticket;
    }

    async findAll(skip?: any, take?: any) {
        if (skip) {
            skip = parseInt(skip);
        }
        if (take) {
            take = parseInt(take);
        }

        const [items, total] = await Promise.all([
            this.prisma.ticket.findMany({
                skip: skip,
                take: take,
                include: { session: { include: { movie: true } } }
            }),
            this.prisma.ticket.count()
        ]);

        return { items, total };
    }

    async removeById(id: number) {
        const ticket = await this.prisma.ticket.findUnique({ where: { id } });
        if (!ticket) {
            throw new NotFoundException('Билет не найден');
        }
        return this.prisma.ticket.delete({ where: { id } });
    }

    async remove(id: number, userId: number, isAdmin: boolean) {
        const ticket = await this.prisma.ticket.findUnique({ where: { id } });
        if (!ticket) {
            return;
        }

        if (ticket.userId !== userId && !isAdmin) {
            throw new ForbiddenException('Не надо трогать чужие билеты');
        }

        return this.prisma.ticket.delete({ where: { id } });
    }
}