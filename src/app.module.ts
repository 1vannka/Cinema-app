import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { MoviesModule } from './movies/movies.module';
import { SessionsModule } from './sessions/sessions.module';
import { TicketsModule } from './tickets/tickets.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AuthModule } from './auth/auth.module';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'node:path';
import { GraphqlComplexityPlugin } from './graphql/graphql-complexity.plugin';
import { StorageModule } from './storage/storage.module';
import { AuthRedirectMiddleware } from './auth/middleware/auth-redirect.middleware';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      path: '/graphql',
      context: ({ req, res }) => ({ req, res }),
      introspection: true,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    }),
    PrismaModule,
    StorageModule,
    UsersModule,
    MoviesModule,
    SessionsModule,
    TicketsModule,
    ReviewsModule,
    AuthModule.registerFromEnv(),
  ],
  controllers: [AppController],
  providers: [AppService, GraphqlComplexityPlugin],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthRedirectMiddleware).forRoutes(
      { path: 'movies/add', method: RequestMethod.GET },
      { path: 'movies', method: RequestMethod.POST },
      { path: 'movies/:id/edit', method: RequestMethod.GET },
      { path: 'movies/:id/edit', method: RequestMethod.POST },
      { path: 'movies/:id/delete', method: RequestMethod.POST },

      { path: 'sessions/add', method: RequestMethod.GET },
      { path: 'sessions', method: RequestMethod.POST },
      { path: 'sessions/:id/edit', method: RequestMethod.GET },
      { path: 'sessions/:id/edit', method: RequestMethod.POST },
      { path: 'sessions/:id/delete', method: RequestMethod.POST },

      { path: 'tickets/book/:sessionId', method: RequestMethod.GET },
      { path: 'tickets', method: RequestMethod.POST },
      { path: 'tickets/:id/edit', method: RequestMethod.GET },
      { path: 'tickets/:id/delete', method: RequestMethod.POST },

      { path: 'reviews/add', method: RequestMethod.GET },
      { path: 'reviews', method: RequestMethod.POST },
      { path: 'reviews/:id/edit', method: RequestMethod.GET },
      { path: 'reviews/:id/edit', method: RequestMethod.POST },
      { path: 'reviews/:id/delete', method: RequestMethod.POST },

      { path: 'users/:id', method: RequestMethod.GET },
      { path: 'users/:id/edit', method: RequestMethod.GET },
      { path: 'users/:id/edit', method: RequestMethod.POST },
      { path: 'users/:id/delete', method: RequestMethod.POST },
    );
  }
}
