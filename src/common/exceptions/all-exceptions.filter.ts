import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;

    status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
    }

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
      message,
    };

    try {
      response.status(status).json(errorResponse);
    } catch (responseError) {
      this.logger.error('Failed to send error response:', responseError);
    }
  }

  private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation
        const field = exception.meta?.target;
        const fieldName = Array.isArray(field) ? field.join(', ') : field;
        return {
          status: HttpStatus.CONFLICT,
          message: `${fieldName} Đã tồn tại`,
        };
      }
      case 'P2003': {
        // Foreign key constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Tham chiếu đến dữ liệu liên quan không hợp lệ',
        };
      }
      case 'P2025': {
        // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Không tìm thấy dữ liệu',
        };
      }
      case 'P2001': {
        // Record not found (alternative)
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Không tìm thấy dữ liệu',
        };
      }
      case 'P2014': {
        // Invalid ID
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'ID không hợp lệ',
        };
      }
      case 'P2000': {
        // Value too long
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Giá trị quá dài',
        };
      }
      case 'P2006': {
        // Invalid value
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Giá trị không hợp lệ',
        };
      }
      case 'P2011': {
        // Null constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Required field không được để trống',
        };
      }
      case 'P2012': {
        // Missing required value
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Missing required field',
        };
      }
      case 'P2016': {
        // Query interpretation error
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Query parameters không hợp lệ',
        };
      }
      case 'P2017': {
        // Records for relation not connected
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Records không được kết nối chính xác',
        };
      }
      case 'P2018': {
        // Required connected records not found
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Required connected records không tìm thấy',
        };
      }
      case 'P2019': {
        // Input error
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Dữ liệu đầu vào không hợp lệ',
        };
      }
      case 'P2020': {
        // Value out of range
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Giá trị không hợp lệ',
        };
      }
      case 'P2021': {
        // Table does not exist
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database table not found',
        };
      }
      case 'P2022': {
        // Column does not exist
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database column not found',
        };
      }
      case 'P2023': {
        // Inconsistent column data
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Inconsistent database data',
        };
      }
      case 'P2024': {
        // Connection timeout
        return {
          status: HttpStatus.REQUEST_TIMEOUT,
          message: 'Database connection timeout',
        };
      }
      case 'P2027': {
        // Multiple errors
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Multiple validation errors occurred',
        };
      }
      case 'P2028': {
        // Transaction API error
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database transaction failed',
        };
      }
      case 'P2030': {
        // Fulltext index not found
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Search index not available',
        };
      }
      case 'P2031': {
        // MongoDB ObjectId parsing error
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid ID format',
        };
      }
      case 'P2033': {
        // Number out of range
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Number is out of range',
        };
      }
      case 'P2034': {
        // Transaction conflict
        return {
          status: HttpStatus.CONFLICT,
          message: 'Transaction conflict occurred',
        };
      }
      default: {
        // Unknown Prisma error
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database operation failed',
        };
      }
    }
  }
}
