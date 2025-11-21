import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly isProduction: boolean;

  constructor(private configService?: ConfigService) {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

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
        ? exception.getResponse()
        : 'Internal server error';

    // En production, masquer les détails des erreurs internes
    const errorMessage =
      typeof message === 'string' ? message : (message as any).message;
    const finalMessage =
      status === HttpStatus.INTERNAL_SERVER_ERROR && this.isProduction
        ? 'Internal server error'
        : errorMessage;

    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: Array.isArray(finalMessage)
        ? finalMessage
        : finalMessage,
    };

    // En développement, ajouter plus de détails
    if (!this.isProduction) {
      errorResponse.error =
        exception instanceof Error ? exception.message : 'Unknown error';
      if (exception instanceof Error && exception.stack) {
        errorResponse.stack = exception.stack;
      }
    }

    // Logger avec plus de détails pour le debugging
    const logContext = {
      statusCode: status,
      path: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        JSON.stringify({
          ...logContext,
          error:
            exception instanceof Error
              ? exception.message
              : 'Unknown error',
          stack:
            exception instanceof Error && !this.isProduction
              ? exception.stack
              : undefined,
        }),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}`,
        JSON.stringify(logContext),
      );
    }

    response.status(status).json(errorResponse);
  }
}
