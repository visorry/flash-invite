import type { User } from './app'

declare global {
  namespace Express {
    interface Request {
      user?: User
      session?: any
      validatedBody?: any
      validatedQuery?: any
      validatedParams?: any
      token?: string
    }
  }
}

export {}
