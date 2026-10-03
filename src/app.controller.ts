import { Controller, Get, Render, Query } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  private getUserSession(login: string) {
    return login ? { name: login } : null;
  }

  @Get()
  @Render('index')
  async getIndexPage() {
    const currentMovies = await this.prisma.movie.findMany({
      take: 4,
      orderBy: { id: 'desc' },
    });

    const count = await this.prisma.movie.count();
    const dayMovie =
      count > 0
        ? await this.prisma.movie.findFirst({
            skip: Math.floor(Math.random() * count),
          })
        : null;

    return {
      loadNews: true,
      loadReviews: false,
      currentMovies,
      dayMovie,
    };
  }

  @Get('about')
  @Render('about')
  getAboutPage() {
    return {
      loadNews: false,
      loadReviews: false,
    };
  }

  @Get('feedback')
  @Render('feedback')
  getFeedbackPage() {
    return {
      loadNews: false,
      loadReviews: true,
    };
  }
}
