import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ApplicationException } from 'src/application/exceptions';
import { Response } from 'express';

@Catch(HttpException, ApplicationException, Error)
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException | ApplicationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = 500;
    let message = 'Internal server error';
    let code = 500;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception instanceof ApplicationException) {
      status = exception.status;
      message = exception.message;
      code = exception.code;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      code: code,
      timestamp: new Date().toISOString(),
    });
  }
}
