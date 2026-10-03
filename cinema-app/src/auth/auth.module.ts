import { Module } from '@nestjs/common';
import {PrismaModule} from "../prisma/prisma.module";
import {AuthController} from "./auth.controller";
import {AuthApiController} from "./auth-api.controller";
import {AuthService} from "./auth.service";

@Module({
    imports: [PrismaModule],
    controllers: [AuthController, AuthApiController],
    providers: [AuthService],
})
export class AuthModule {}
