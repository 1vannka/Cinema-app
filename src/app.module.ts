import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {PrismaModule} from "./prisma/prisma.module";
import { UsersModule } from './users/users.module';
import { MoviesModule } from './movies/movies.module';
import { SessionsModule } from './sessions/sessions.module';
import { TicketsModule } from './tickets/tickets.module';
import { ReviewsModule } from './reviews/reviews.module';
import {AuthModule} from "./auth/auth.module";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import {ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { GraphQLModule } from "@nestjs/graphql";
import {join} from "node:path";
import {GraphqlComplexityPlugin} from "./graphql/graphql-complexity.plugin";

@Module({
    imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            sortSchema: true,
            path: '/graphql',
            introspection: true,
            playground: false,
            plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
        }),
        PrismaModule,
        UsersModule,
        MoviesModule,
        SessionsModule,
        TicketsModule,
        ReviewsModule,
        AuthModule,
    ],
    controllers: [AppController],
    providers: [AppService, GraphqlComplexityPlugin],
})
export class AppModule {}
