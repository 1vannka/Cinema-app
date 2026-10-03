import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { IS_PUBLIC_ACCESS_KEY } from '../auth.constants';
import { AuthService } from '../auth.service';
import { SessionRequest } from 'supertokens-node/framework/express';
import { GqlExecutionContext } from '@nestjs/graphql';
import Session from 'supertokens-node/recipe/session';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const { req, res } = this.getRequestResponse(context);

    try {
      const session = await Session.getSession(req as any, res as any, {
        sessionRequired: true,
      });
      const superTokensUserId = session.getUserId();

      const user =
        await this.authService.getUserBySupertokensId(superTokensUserId);

      if (!user) {
        throw new UnauthorizedException(
          'Пользователь не найден в локальной БД',
        );
      }

      req.authUser = {
        userId: user.id,
        login: user.login,
        role: user.role as any,
        superTokensUserId,
      };

      res.locals.isAdmin = user.role === 'ADMIN';

      return true;
    } catch (err) {
      throw new UnauthorizedException('Требуется авторизация');
    }
  }

  private getRequestResponse(context: ExecutionContext): {
    req: SessionRequest;
    res: Response;
  } {
    if (context.getType<'http' | 'graphql'>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext();
      return {
        req: ctx.req as SessionRequest,
        res: ctx.res as Response,
      };
    }

    const httpCtx = context.switchToHttp();
    return {
      req: httpCtx.getRequest<SessionRequest>(),
      res: httpCtx.getResponse<Response>(),
    };
  }
}
