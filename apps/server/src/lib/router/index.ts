import type { Request, Response, NextFunction } from 'express'
import { Router as ExpressRouter } from 'express'

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export type HttpMethodType = keyof typeof HttpMethod

export interface ApiOption {
  version?: string
  dto?: string | {
    type: string
    paginate?: boolean
  }
  validation?: any
}

export interface RouterOption {
  middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>
  dto?: string | {
    type: string
    paginate?: boolean
  }
  validation?: any
  api?: ApiOption
}

export type ExpressMiddleware<T = any> = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<T> | T

export interface RouterCallsType {
  fn: ExpressMiddleware
  path: string
  method: HttpMethodType
  option?: ApiOption
  middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>
}

export interface RouterType {
  calls: () => RouterCallsType[]
  get: <T = any>(path: string, fn: ExpressMiddleware<T>, options?: RouterOption) => void
  post: <T = any>(path: string, fn: ExpressMiddleware<T>, options?: RouterOption) => void
  put: <T = any>(path: string, fn: ExpressMiddleware<T>, options?: RouterOption) => void
  patch: <T = any>(path: string, fn: ExpressMiddleware<T>, options?: RouterOption) => void
  delete: <T = any>(path: string, fn: ExpressMiddleware<T>, options?: RouterOption) => void
}

function Router(): RouterType {
  const calls: Record<string, RouterCallsType> = {}

  function generateKey(path: string, method: HttpMethodType, options?: ApiOption) {
    if (!options?.version) return `${method}-${path}`
    return `${method}-${path}-${options.version}`
  }

  function request(path: string, method: HttpMethodType, fn: ExpressMiddleware, options?: RouterOption) {
    const key = generateKey(path, method, options?.api)
    
    const apiOption: ApiOption = {
      ...options?.api,
      dto: options?.dto || options?.api?.dto,
      validation: options?.validation || options?.api?.validation,
    }
    
    calls[key] = {
      fn,
      path,
      method,
      option: apiOption,
      middleware: options?.middleware || [],
    }
  }

  function get<T = any>(path = '/', fn: ExpressMiddleware<T>, options?: RouterOption) {
    request(path, HttpMethod.GET, fn, options)
  }

  function post<T = any>(path = '/', fn: ExpressMiddleware<T>, options?: RouterOption) {
    request(path, HttpMethod.POST, fn, options)
  }

  function put<T = any>(path = '/', fn: ExpressMiddleware<T>, options?: RouterOption) {
    request(path, HttpMethod.PUT, fn, options)
  }

  function patch<T = any>(path = '/', fn: ExpressMiddleware<T>, options?: RouterOption) {
    request(path, HttpMethod.PATCH, fn, options)
  }

  function deleteRequest<T = any>(path = '/', fn: ExpressMiddleware<T>, options?: RouterOption) {
    request(path, HttpMethod.DELETE, fn, options)
  }

  return {
    calls: () =>
      Object.keys(calls)
        .map((key) => calls[key])
        .filter((e) => e) as RouterCallsType[],
    get,
    post,
    patch,
    put,
    delete: deleteRequest,
  }
}

export function convertToExpressRouter(customRouter: RouterType): ExpressRouter {
  const router = ExpressRouter()
  const calls = customRouter.calls()

  calls.forEach((call) => {
    const method = call.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete'
    
    let path = call.path || '/'
    if (!path.startsWith('/')) {
      path = '/' + path
    }
    
    const middlewares: any[] = [...(call.middleware || [])]
    
    if (call.option?.validation) {
      const ValidationMiddleware = require('../../middleware/validation.middleware').ValidationMiddleware
      middlewares.unshift(ValidationMiddleware(call.option.validation))
    }
    
    try {
      router[method](path, ...middlewares, async (req: Request, res: Response, next: NextFunction) => {
        const result = await call.fn(req, res, next)

        if (result !== undefined && !res.headersSent) {
          let statusCode = 200
          if (call.method === HttpMethod.POST) {
            statusCode = 201
          } else if (call.method === HttpMethod.DELETE && result === null) {
            statusCode = 204
          }

          const response = {
            success: true,
            data: result,
            error: null,
          }

          res.status(statusCode).json(response)
        }
      })
    } catch (error) {
      console.error(`Error registering route ${method.toUpperCase()} ${path}:`, error)
      throw error
    }
  })

  return router
}

export default Router
