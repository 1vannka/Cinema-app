import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';

@Injectable()
export class AuthRedirectMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    await verifySession({ sessionRequired: false })(
      req as any,
      res,
      (err: any) => {
        if (err) {
          return next(err);
        }

        if (!(req as any).session) {
          return res.redirect('/auth/register');
        }
        next();
      },
    );
  }
}
