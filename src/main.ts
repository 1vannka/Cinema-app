import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import session from "express-session";
import {PrismaService} from "./prisma/prisma.service";
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );

  const hbs = require('hbs');

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.useGlobalFilters(new GlobalExceptionFilter());

  hbs.registerPartials(join(__dirname, '..', 'views/partials'));

  app.use(
      session({
          secret: 'kino-room-secret-key',
          resave: false,
          saveUninitialized: false,
          cookie: { maxAge: 24 * 60 * 60 * 1000 },
      }),
  );

    const prismaService = app.get(PrismaService);
    app.use(async (req: any, res: any, next: any) => {
        if (req.session.authError) {
            res.locals.authError = req.session.authError;
            delete req.session.authError;
        }

        if (req.session && req.session.userId) {
            const user = await prismaService.user.findUnique({
                where: { id: req.session.userId },
            });
            if (user) {
                res.locals.user = user;
                res.locals.isAdmin = req.session.isAdmin;
            }
        }
        next();
    });

    const config = new DocumentBuilder()
        .setTitle('КиноРум API')
        .setDescription('REST API для управления кинотеатром (фильмы, сеансы, билеты)')
        .setVersion('1.0')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
