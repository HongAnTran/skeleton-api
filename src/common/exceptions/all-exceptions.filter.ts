import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // Log the error with context
    const errorContext = {
      method: request.method,
      url: request.url,
      status,
      message,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(`Server Error:`, exception, errorContext);
    } else {
      this.logger.warn(`Client Error:`, errorContext);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
      path: request.url,
    };

    try {
      response.status(status).json(errorResponse);
    } catch (responseError) {
      this.logger.error('Failed to send error response:', responseError);
    }
  }
}
