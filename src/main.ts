import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TimingInterceptor } from './common/interceptors/timing.interceptor';
import { EtagInterceptor } from './common/interceptors/etag.interceptor';
import supertokens from 'supertokens-node';
import { middleware, errorHandler } from 'supertokens-node/framework/express';
import { SuperTokensService } from './auth/supertokens.service';
import Session from 'supertokens-node/recipe/session';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const hbs = require('hbs');
  hbs.localsAsRPC = false;
  app.disable('view cache');

  const superTokensService = app.get(SuperTokensService);
  superTokensService.initIfNeeded();

  app.enableCors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
    credentials: true,
  });

  app.use(express.urlencoded({ extended: true }));
  app.use((req: any, _res: any, next: any) => {
    if (
      req.method === 'POST' &&
      (req.path === '/auth/signin' || req.path === '/auth/signup') &&
      req.is('application/x-www-form-urlencoded')
    ) {
      const { email, password } = req.body ?? {};
      if (email && password) {
        req.body = {
          formFields: [
            { id: 'email', value: email },
            { id: 'password', value: password },
          ],
        };
        req.headers['content-type'] = 'application/json';
      }
    }
    next();
  });

  app.use(middleware());

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TimingInterceptor(), new EtagInterceptor());

  hbs.registerPartials(join(__dirname, '..', 'views/partials'));

  const prismaService = app.get(PrismaService);

  app.use(async (req: any, res: any, next: any) => {
    try {
      const session = await Session.getSession(req, res, {
        sessionRequired: false,
      });

      if (session !== undefined) {
        const sTokensId = session.getUserId();

        const user = await prismaService.user.findUnique({
          where: { supertokensId: sTokensId },
        });

        if (user) {
          res.locals.user = user;
          res.locals.isAdmin = user.role === 'ADMIN';
        }
      }
    } catch (err) {
      console.error('Session middleware error:', err);
    }
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('КиноРум API')
    .setDescription(
      'REST API для управления кинотеатром (фильмы, сеансы, билеты)',
    )
    .setVersion('1.0')
    .addSecurity('sAccessToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'sAccessToken',
      description: 'Cookie с access токеном SuperTokens',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.use(errorHandler());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
