import type { Request, Response, NextFunction } from 'express'
import { ForbiddenError } from '../errors/http-exception'
import { AppErrorCode } from '../enums/app-error-code.enum'

export const requireAdmin = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const user = req.user

    if (!user) {
      next(new ForbiddenError('Authentication required', AppErrorCode.UNAUTHORIZED))
      return
    }

    // Check if user is admin
    if (!(user as any).isAdmin) {
      next(new ForbiddenError('Admin access required', AppErrorCode.FORBIDDEN))
      return
    }

    next()
  } catch (error) {
    next(new ForbiddenError('Admin access required', AppErrorCode.FORBIDDEN))
  }
}
