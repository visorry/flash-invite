import type { Request, Response, NextFunction } from 'express'
import { auth } from '@super-invite/auth'
import { UnauthorizedError, ForbiddenError } from '../errors/http-exception'
import { AppErrorCode } from '../enums/app-error-code.enum'

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    })

    if (!session?.user) {
      next(new UnauthorizedError('Authentication required', AppErrorCode.UNAUTHORIZED))
      return
    }

    req.user = session.user as any
    req.session = session as any
    next()
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      next(error)
      return
    }
    next(new UnauthorizedError('Invalid authentication', AppErrorCode.INVALID_TOKEN))
  }
}
