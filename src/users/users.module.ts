import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersApiController } from './users-api.controller';
import { AuthController } from '../auth/auth.controller';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [UsersApiController, UsersController],
  providers: [UsersService, UsersResolver],
})
export class UsersModule {}
