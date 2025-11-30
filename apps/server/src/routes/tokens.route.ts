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

// ============ Daily Token Claim ============

// POST /tokens/claim-daily - Claim daily tokens
router.post(
  '/claim-daily',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return tokenService.claimDailyTokens(ctx)
  }
)

// GET /tokens/claim-status - Get daily claim status
router.get(
  '/claim-status',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return tokenService.getDailyClaimStatus(ctx)
  }
)

// GET /tokens/claim-history - Get claim history
const ClaimHistorySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(30),
})

router.get(
  '/claim-history',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { limit } = req.validatedQuery
    return tokenService.getClaimHistory(ctx, limit)
  },
  {
    validation: ClaimHistorySchema,
  }
)

// GET /tokens/welcome-bonus-status - Check if user has received welcome bonus
router.get(
  '/welcome-bonus-status',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return tokenService.getWelcomeBonusStatus(ctx)
  }
)

// GET /tokens/welcome-bonus-config - Get welcome bonus configuration (public)
router.get(
  '/welcome-bonus-config',
  async (_req: Request) => {
    return tokenService.getWelcomeBonusConfig()
  }
)

// POST /tokens/claim-welcome-bonus - Claim welcome bonus (auto-grants if not already received)
router.post(
  '/claim-welcome-bonus',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return tokenService.claimWelcomeBonus(ctx)
  }
)

export { router }
