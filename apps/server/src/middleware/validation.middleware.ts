import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { ValidationError } from '../errors/http-exception'

export const validateBody = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body)
      req.validatedBody = validated
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues
          .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
          .join(', ')
        next(new ValidationError(`Validation failed: ${errorMessage}`))
        return
      }
      next(error)
    }
  }
}

export const validateQuery = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const processedQuery: Record<string, any> = {}
      for (const [key, value] of Object.entries(req.query)) {
        if (Array.isArray(value)) {
          processedQuery[key] = value
        } else if (value === 'true') {
          processedQuery[key] = true
        } else if (value === 'false') {
          processedQuery[key] = false
        } else if (!isNaN(Number(value)) && value !== '') {
          processedQuery[key] = Number(value)
        } else {
          processedQuery[key] = value
        }
      }
      
      const validated = schema.parse(processedQuery)
      req.validatedQuery = validated
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues
          .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
          .join(', ')
        next(new ValidationError(`Query validation failed: ${errorMessage}`))
        return
      }
      next(error)
    }
  }
}

export const validateParams = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params)
      req.validatedParams = validated
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues
          .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
          .join(', ')
        next(new ValidationError(`Params validation failed: ${errorMessage}`))
        return
      }
      next(error)
    }
  }
}

export const ValidationMiddleware = (validation: any) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (Array.isArray(validation)) {
        for (const schema of validation) {
          if (schema.shape && 'id' in schema.shape) {
            const paramsResult = schema.safeParse(req.params)
            if (paramsResult.success) {
              req.validatedParams = paramsResult.data
            } else {
              const errorMessage = paramsResult.error.issues
                .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
                .join(', ')
              throw new ValidationError(`Params validation failed: ${errorMessage}`)
            }
          } else {
            const bodyResult = schema.safeParse(req.body)
            if (bodyResult.success) {
              req.validatedBody = bodyResult.data
            } else {
              const errorMessage = bodyResult.error.issues
                .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
                .join(', ')
              throw new ValidationError(`Body validation failed: ${errorMessage}`)
            }
          }
        }
      } else {
        let validationSuccess = false
        let lastError: z.ZodError | null = null

        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          const bodyResult = validation.safeParse(req.body)
          if (bodyResult.success) {
            req.validatedBody = bodyResult.data
            validationSuccess = true
          } else {
            lastError = bodyResult.error
          }
        }

        if (!validationSuccess) {
          const paramsResult = validation.safeParse(req.params)
          if (paramsResult.success) {
            req.validatedParams = paramsResult.data
            validationSuccess = true
          } else {
            if (!lastError) lastError = paramsResult.error
          }
        }

        if (!validationSuccess) {
          const processedQuery: Record<string, any> = {}
          for (const [key, value] of Object.entries(req.query)) {
            if (Array.isArray(value)) {
              processedQuery[key] = value
            } else if (value === 'true') {
              processedQuery[key] = true
            } else if (value === 'false') {
              processedQuery[key] = false
            } else if (!isNaN(Number(value)) && value !== '') {
              processedQuery[key] = Number(value)
            } else {
              processedQuery[key] = value
            }
          }
          const queryResult = validation.safeParse(processedQuery)
          if (queryResult.success) {
            req.validatedQuery = queryResult.data
            validationSuccess = true
          } else {
            if (!lastError) lastError = queryResult.error
          }
        }

        if (!validationSuccess && lastError) {
          const errorMessage = lastError.issues
            .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
            .join(', ')
          throw new ValidationError(`Validation failed: ${errorMessage}`)
        }
      }
      next()
    } catch (error) {
      if (error instanceof ValidationError) {
        next(error)
        return
      }
      next(error)
    }
  }
}
