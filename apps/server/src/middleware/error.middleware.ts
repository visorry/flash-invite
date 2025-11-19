import type { Request, Response, NextFunction } from 'express'
import { HttpException } from '../errors/http-exception'
import { HttpStatus } from '../enums/http-status.enum'
import { AppErrorCode } from '../enums/app-error-code.enum'
import { config } from '../config/configuration'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let status = HttpStatus.INTERNAL_SERVER_ERROR
  let code = AppErrorCode.UNKNOWN
  let message = err.message

  if (err instanceof HttpException) {
    status = err.status
    code = err.code
  }

  // Log server errors (5xx)
  if (status >= 500) {
    console.error('Server Error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    })
  }

  res.status(status).json({
    success: false,
    error: {
      message,
      status,
      code,
      ...(err instanceof HttpException && err.description ? { description: err.description } : {}),
      ...(config.IS_DEV ? { stack: err.stack } : {}),
    },
    data: null,
  })
}
