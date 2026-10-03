import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Request, Response } from 'express';
import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

type CacheStrategy = 'none' | 'api' | 'page';

@Injectable()
export class EtagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<'http' | 'graphql'>() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request>();
    const res = httpContext.getResponse<Response>();

    const cacheStrategy = this.resolveCacheStrategy(req, res);
    if (cacheStrategy === 'none') {
      return next.handle();
    }

    if (!res.getHeader('Cache-Control')) {
      const cacheControlValue =
        cacheStrategy === 'api'
          ? 'public, max-age=3600, must-revalidate'
          : 'private, max-age=300, must-revalidate';

      res.setHeader('Cache-Control', cacheControlValue);
    }

    return next.handle().pipe(
      mergeMap((data) => {
        if (res.headersSent) {
          return of(data);
        }

        const etag = this.generateEtag(req, data, cacheStrategy);
        res.setHeader('ETag', etag);

        if (this.matchesEtag(req.headers['if-none-match'], etag)) {
          if (cacheStrategy === 'page') {
            return of(data);
          }

          res.status(304);
          return of(null);
        }

        return of(data);
      }),
    );
  }

  private resolveCacheStrategy(req: Request, res: Response): CacheStrategy {
    const method = req.method.toUpperCase();
    if (method !== 'GET') {
      return 'none';
    }

    const url = req.originalUrl ?? req.url;
    if (url.startsWith('/api/')) {
      return 'api';
    }

    if (url.startsWith('/graphql')) {
      return 'none';
    }

    const accept = (req.headers.accept ?? '').toLowerCase();
    const acceptsHtml = accept.includes('text/html') || accept.includes('*/*');
    const hasAuthUser = Boolean(
      (req as Request & { authUser?: unknown }).authUser,
    );
    const hasLocalsUser = Boolean((res.locals as { user?: unknown }).user);
    const cookieHeader = req.headers.cookie ?? '';
    const hasSessionCookie = /(?:^|;\s*)sAccessToken=/.test(cookieHeader);
    const isAuthenticatedPage =
      hasAuthUser || hasLocalsUser || hasSessionCookie;

    if (acceptsHtml && !isAuthenticatedPage) {
      return 'page';
    }

    return 'none';
  }

  private generateEtag(
    req: Request,
    body: unknown,
    strategy: CacheStrategy,
  ): string {
    const serialized = this.serializeBody(body);
    const namespacedPayload = `${strategy}:${req.originalUrl ?? req.url}:${serialized}`;
    const hash = createHash('sha1')
      .update(namespacedPayload)
      .digest('base64url');
    return `"${hash}"`;
  }

  private serializeBody(body: unknown): string {
    if (body === null || body === undefined) {
      return '';
    }

    if (typeof body === 'string') {
      return body;
    }

    return JSON.stringify(body);
  }

  private matchesEtag(
    ifNoneMatch: string | string[] | undefined,
    generatedEtag: string,
  ): boolean {
    if (!ifNoneMatch) {
      return false;
    }

    const rawHeader = Array.isArray(ifNoneMatch)
      ? ifNoneMatch.join(',')
      : ifNoneMatch;
    const etags = rawHeader
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return (
      etags.includes(generatedEtag) ||
      etags.includes(`W/${generatedEtag}`) ||
      etags.includes('*')
    );
  }
}
