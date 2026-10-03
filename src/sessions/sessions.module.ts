import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import {PrismaModule} from "../prisma/prisma.module";
import {SessionsApiController} from "./sessions-api.controller";
import { SessionsResolver } from './sessions.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [SessionsApiController,SessionsController],
  providers: [SessionsService, SessionsResolver],
})
export class SessionsModule {}
