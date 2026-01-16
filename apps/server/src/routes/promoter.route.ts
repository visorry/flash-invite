import Router from '../lib/router'
import type { Request } from 'express'
import promoterService from '../services/promoter.service'
import { getRequestContext } from '../helper/context'
import {
  PromoterQuerySchema,
  PromoterParamsSchema,
  PromoterPostParamsSchema,
  CreatePromoterConfigSchema,
  UpdatePromoterConfigSchema,
} from '../validation/promoter.validation'

const router = Router()

export const name = 'promoter'

// GET /promoter/config - List promoter configurations
router.get(
  '/config',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { botId } = req.validatedQuery || {}
    return promoterService.list(ctx, { botId })
  },
  {
    validation: PromoterQuerySchema,
  }
)

// GET /promoter/config/:id - Get promoter configuration details
router.get(
  '/config/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return promoterService.getById(ctx, id)
  },
  {
    validation: PromoterParamsSchema,
  }
)

// POST /promoter/config - Create a new promoter configuration
router.post(
  '/config',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return promoterService.create(ctx, req.validatedBody)
  },
  {
    validation: CreatePromoterConfigSchema,
  }
)

// PATCH /promoter/config/:id - Update a promoter configuration
router.patch(
  '/config/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return promoterService.update(ctx, id, req.validatedBody)
  },
  {
    validation: [PromoterParamsSchema, UpdatePromoterConfigSchema],
  }
)

// DELETE /promoter/config/:id - Delete a promoter configuration
router.delete(
  '/config/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    await promoterService.delete(ctx, id)
    return { success: true, message: 'Configuration deleted successfully' }
  },
  {
    validation: PromoterParamsSchema,
  }
)

// POST /promoter/config/:id/toggle - Toggle configuration active status
router.post(
  '/config/:id/toggle',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return promoterService.toggleActive(ctx, id)
  },
  {
    validation: PromoterParamsSchema,
  }
)

// GET /promoter/config/:id/stats - Get configuration statistics
router.get(
  '/config/:id/stats',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return promoterService.getStats(ctx, id)
  },
  {
    validation: PromoterParamsSchema,
  }
)

// GET /promoter/post/:id/stats - Get post statistics
router.get(
  '/post/:id/stats',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return promoterService.getPostStats(ctx, id)
  },
  {
    validation: PromoterPostParamsSchema,
  }
)

export { router }
