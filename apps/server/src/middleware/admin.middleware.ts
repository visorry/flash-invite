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

    // Check if user is admin (you can add a role field to User model)
    // For now, we'll check if user has an isAdmin field or role
    if (!(user as any).isAdmin && (user as any).role !== 'admin') {
      next(new ForbiddenError('Admin access required', AppErrorCode.FORBIDDEN))
      return
    }

    next()
  } catch (error) {
    next(new ForbiddenError('Admin access required', AppErrorCode.FORBIDDEN))
  }
}
