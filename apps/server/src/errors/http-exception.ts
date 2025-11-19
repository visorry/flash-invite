import { AppErrorCode } from '../enums/app-error-code.enum'
import { HttpStatus } from '../enums/http-status.enum'

type HttpExceptionType = {
  message: string
  status?: number
  name?: string
  error?: any
  body?: any
  code?: AppErrorCode
  description?: string
}

class HttpException extends Error {
  status: number
  error: any
  body: any
  code: AppErrorCode
  description?: string

  constructor({ message, status, name, error, body, code, description }: HttpExceptionType) {
    super(message)
    this.name = name ?? 'HttpException'
    this.status = status ?? HttpStatus.INTERNAL_SERVER_ERROR
    this.error = error
    this.body = body
    this.code = code ?? AppErrorCode.UNKNOWN
    this.description = description
  }
}

export class NotFoundError extends HttpException {
  constructor(message = 'Resource not found', code = AppErrorCode.NOT_FOUND) {
    super({
      message,
      status: HttpStatus.NOT_FOUND,
      code,
      name: 'NotFoundError'
    })
  }
}

export class UnauthorizedError extends HttpException {
  constructor(message = 'Unauthorized access', code = AppErrorCode.UNAUTHORIZED) {
    super({
      message,
      status: HttpStatus.UNAUTHORIZED,
      code,
      name: 'UnauthorizedError'
    })
  }
}

export class ForbiddenError extends HttpException {
  constructor(message = 'Access forbidden', code = AppErrorCode.FORBIDDEN, description?: string) {
    super({
      message,
      status: HttpStatus.FORBIDDEN,
      code,
      name: 'ForbiddenError',
      description
    })
  }
}

export class ValidationError extends HttpException {
  constructor(message = 'Validation failed', code = AppErrorCode.VALIDATION_ERROR) {
    super({
      message,
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      code,
      name: 'ValidationError'
    })
  }
}

export class ConflictError extends HttpException {
  constructor(message = 'Resource conflict', code = AppErrorCode.ALREADY_EXISTS) {
    super({
      message,
      status: HttpStatus.CONFLICT,
      code,
      name: 'ConflictError'
    })
  }
}

export class BadRequestError extends HttpException {
  constructor(message = 'Bad request', code = AppErrorCode.VALIDATION_ERROR, description?: string) {
    super({
      message,
      status: HttpStatus.BAD_REQUEST,
      code,
      name: 'BadRequestError',
      description
    })
  }
}

export { HttpException }
