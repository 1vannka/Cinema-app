import { DynamicModule, Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_MODULE_OPTIONS } from './auth.constants';
import { AuthModuleOptions } from './auth.types';
import { SuperTokensService } from './supertokens.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthRedirectMiddleware } from './middleware/auth-redirect.middleware';
import { AuthApiController } from './auth-api.controller';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuthController, AuthApiController],
  providers: [AuthService],
})
export class AuthModule {
  static register(options: AuthModuleOptions): DynamicModule {
    return {
      module: AuthModule,
      imports: [PrismaModule],
      controllers: [AuthController, AuthApiController],
      providers: [
        AuthService,
        SuperTokensService,
        AuthGuard,
        RolesGuard,
        AuthRedirectMiddleware,
        {
          provide: AUTH_MODULE_OPTIONS,
          useValue: options,
        },
      ],
      exports: [
        AuthService,
        SuperTokensService,
        AuthGuard,
        RolesGuard,
        AuthRedirectMiddleware,
      ],
    };
  }

  static registerFromEnv(): DynamicModule {
    const options: AuthModuleOptions = {
      connectionURI:
        process.env.SUPERTOKENS_CONNECTION_URI ?? 'https://try.supertokens.com',
      apiKey: process.env.SUPERTOKENS_API_KEY,
      appName: process.env.SUPERTOKENS_APP_NAME ?? 'KinoRoom',
      apiDomain: process.env.SUPERTOKENS_API_DOMAIN ?? 'http://localhost:3000',
      websiteDomain:
        process.env.SUPERTOKENS_WEBSITE_DOMAIN ?? 'http://localhost:3000',
      apiBasePath: process.env.SUPERTOKENS_API_BASE_PATH ?? '/auth',
      websiteBasePath: process.env.SUPERTOKENS_WEBSITE_BASE_PATH ?? '/auth',
    };

    return this.register(options);
  }
}
