import Router from '../lib/router'
import type { Request } from 'express'
import tokenService from '../services/token.service'
import { getRequestContext } from '../helper/context'
import { z } from 'zod'

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

// Calculate cost for a given duration
const CalculateCostSchema = z.object({
  durationSeconds: z.coerce.number().int().positive(),
})

router.get(
  '/calculate-cost',
  async (req: Request) => {
    const { durationSeconds } = req.validatedQuery
    const cost = await tokenService.calculateInviteCost(durationSeconds)
    return { durationSeconds, cost }
  },
  {
    validation: CalculateCostSchema,
  }
)

export { router }
