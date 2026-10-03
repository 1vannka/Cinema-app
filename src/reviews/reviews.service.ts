import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Subject } from 'rxjs';

@Injectable()
export class ReviewsService {
  public reviewStream = new Subject<any>();

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, comment: string) {
    const newReview = await this.prisma.review.create({
      data: { comment, userId },
      include: { user: true },
    });

    this.reviewStream.next({ data: newReview });
    return newReview;
  }

  async findAll() {
    return this.prisma.review.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllPaginated(skip?: any, take?: any) {
    if (skip) {
      skip = parseInt(skip);
    }
    if (take) {
      take = parseInt(take);
    }

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        skip: skip,
        take: take,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count(),
    ]);

    return { items, total };
  }

  async findOne(id: number) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!review) {
      throw new NotFoundException('Отзыв не найден');
    }
    return review;
  }

  async updateById(id: number, comment: string) {
    await this.findOne(id);
    return this.prisma.review.update({
      where: { id },
      data: { comment },
      include: { user: true },
    });
  }

  async update(id: number, userId: number, isAdmin: boolean, comment: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new Error('Отзыв не найден');
    }
    if (review.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Нельзя редактировать чужое');
    }

    return this.prisma.review.update({
      where: { id },
      data: { comment },
      include: { user: true },
    });
  }

  async remove(id: number, userId: number, isAdmin: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      return null;
    }
    if (review.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Нельзя удалять чужое');
    }

    return this.prisma.review.delete({ where: { id } });
  }

  async removeById(id: number) {
    await this.findOne(id);
    return this.prisma.review.delete({ where: { id } });
  }
}
