import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private static readonly RENDER_PATCHED_FLAG = '__requestTimingRenderPatched';
  private readonly logger = new Logger(TimingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { req, res } = this.getHttpContext(context);

    if (!req || !res) {
      return next.handle();
    }

    const startedAt = process.hrtime.bigint();
    this.patchRender(res, startedAt);

    return next.handle().pipe(
      map((data) => {
        const elapsedMs = this.getElapsedMs(startedAt);
        this.setElapsedHeader(res, elapsedMs);

        if (this.shouldInjectIntoViewModel(req, data)) {
          return {
            ...(data as Record<string, unknown>),
            serverElapsedTimeMs: elapsedMs.toFixed(2),
          };
        }

        return data;
      }),
      finalize(() => {
        const elapsedMs = this.getElapsedMs(startedAt);
        this.setElapsedHeader(res, elapsedMs);
        this.logger.log(
          `${req.method} ${req.originalUrl ?? req.url} - ${elapsedMs.toFixed(2)}ms`,
        );
      }),
    );
  }

  private getHttpContext(context: ExecutionContext): {
    req?: Request;
    res?: Response;
  } {
    if (context.getType<'http' | 'graphql'>() === 'http') {
      const httpContext = context.switchToHttp();
      return {
        req: httpContext.getRequest<Request>(),
        res: httpContext.getResponse<Response>(),
      };
    }

    if (context.getType<'http' | 'graphql'>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();

      if (info?.path?.prev !== undefined) {
        return {};
      }

      const gqlReqRes = gqlContext.getContext<{
        req?: Request;
        res?: Response;
      }>();
      return {
        req: gqlReqRes?.req,
        res: gqlReqRes?.res,
      };
    }

    return {};
  }

  private shouldInjectIntoViewModel(req: Request, data: unknown): boolean {
    const url = req.originalUrl ?? req.url;
    if (url.startsWith('/api/') || url.startsWith('/graphql')) {
      return false;
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return false;
    }

    return !this.isExpressResponse(data);
  }

  private isExpressResponse(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      'setHeader' in value &&
      'status' in value
    );
  }

  private patchRender(res: Response, startedAt: bigint): void {
    const anyRes = res as unknown as Record<string, unknown>;
    if (anyRes[TimingInterceptor.RENDER_PATCHED_FLAG]) {
      return;
    }

    anyRes[TimingInterceptor.RENDER_PATCHED_FLAG] = true;
    const originalRender = res.render.bind(res);

    res.render = ((view: string, options?: unknown, callback?: unknown) => {
      const elapsedMs = this.getElapsedMs(startedAt);
      this.setElapsedHeader(res, elapsedMs);

      let model: Record<string, unknown> = {};
      let cb: unknown;

      if (typeof options === 'function') {
        cb = options;
      } else {
        model =
          options && typeof options === 'object'
            ? { ...(options as Record<string, unknown>) }
            : {};
        cb = callback;
      }

      model.serverElapsedTimeMs = elapsedMs.toFixed(2);

      if (cb) {
        return originalRender(
          view,
          model,
          cb as (err: Error, html: string) => void,
        );
      }

      return originalRender(view, model);
    }) as Response['render'];
  }

  private getElapsedMs(startedAt: bigint): number {
    return Number(process.hrtime.bigint() - startedAt) / 1_000_000;
  }

  private setElapsedHeader(res: Response, elapsedMs: number): void {
    if (!res.headersSent) {
      res.setHeader('X-Elapsed-Time', `${elapsedMs.toFixed(2)}ms`);
    }
  }
}
