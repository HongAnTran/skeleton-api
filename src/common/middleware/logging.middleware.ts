import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('User-Agent') || '';
    const startTime = Date.now();

    // Log cache-related headers from client
    const ifNoneMatch = request.get('If-None-Match');
    const ifModifiedSince = request.get('If-Modified-Since');
    const cacheControl = request.get('Cache-Control');

    if (ifNoneMatch || ifModifiedSince || cacheControl) {
      this.logger.warn(
        `🔍 Cache headers detected - ${method} ${originalUrl} - If-None-Match: ${ifNoneMatch}, If-Modified-Since: ${ifModifiedSince}, Cache-Control: ${cacheControl}`,
      );
    }

    response.on('close', () => {
      const { statusCode } = response;
      const contentLength = response.get('Content-Length');
      const responseTime = Date.now() - startTime;

      // Log status 304 with special attention
      if (statusCode === 304) {
        this.logger.warn(
          `⚠️  ${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip} - ${responseTime}ms [NOT MODIFIED]`,
        );
      } else {
        this.logger.log(
          `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip} - ${responseTime}ms`,
        );
      }
    });

    next();
  }
}
