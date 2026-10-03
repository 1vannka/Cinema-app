import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TicketsApiController } from './tickets-api.controller';
import { TicketsResolver } from './tickets.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [TicketsApiController, TicketsController],
  providers: [TicketsService, TicketsResolver],
})
export class TicketsModule {}
