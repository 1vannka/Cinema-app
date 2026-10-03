import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import {PrismaModule} from "../prisma/prisma.module";
import {MoviesApiController} from "./movies-api.controller";
import { MoviesResolver } from './movies.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [MoviesApiController, MoviesController],
  providers: [MoviesService, MoviesResolver],
})
export class MoviesModule {}
