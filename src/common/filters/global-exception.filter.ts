import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const res = context.getResponse<Response>();
    const req = context.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Ошибка сервера';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resObj = exception.getResponse() as any;

      if (typeof resObj === 'object' && resObj.message) {
        message = resObj.message;
      } else {
        message = resObj;
      }
    } else {
      console.error('Unhandled Exception:', exception);
    }

    if (!req || !req.url) {
      return;
    }

    if (req.url.startsWith('/api/')) {
      res.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    } else {
      const errorMessage = Array.isArray(message)
        ? message.join(', ')
        : message;
      res.status(status).render('error', {
        statusCode: status,
        message: errorMessage,
      });
    }
  }
}
