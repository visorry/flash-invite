import Router from '../lib/router'
import type { Request } from 'express'
import tokenService from '../services/token.service'
import { getRequestContext } from '../helper/context'

const router = Router()

export const name = 'tokens'

router.get(
  '/balance',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return tokenService.getBalance(ctx)
  }
)

router.get(
  '/transactions',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return tokenService.getTransactions(ctx)
  }
)

router.get(
  '/costs',
  async (_req: Request) => {
    return tokenService.getCostConfig()
  }
)

export { router }
