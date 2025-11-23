import Router from '../lib/router'
import type { Request } from 'express'
import forwardRuleService from '../services/forward-rule.service'
import { getRequestContext } from '../helper/context'
import {
  ForwardRuleQuerySchema,
  ForwardRuleParamsSchema,
  CreateForwardRuleSchema,
  UpdateForwardRuleSchema,
} from '../validation/forward-rule.validation'

const router = Router()

export const name = 'forward-rules'

// GET /forward-rules - List forward rules
router.get(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { botId } = req.validatedQuery || {}
    return forwardRuleService.list(ctx, { botId })
  },
  {
    validation: ForwardRuleQuerySchema,
  }
)

// GET /forward-rules/:id - Get forward rule details
router.get(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return forwardRuleService.getById(ctx, id)
  },
  {
    validation: ForwardRuleParamsSchema,
  }
)

// POST /forward-rules - Create a new forward rule
router.post(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return forwardRuleService.create(ctx, req.validatedBody)
  },
  {
    validation: CreateForwardRuleSchema,
  }
)

// PUT /forward-rules/:id - Update a forward rule
router.put(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return forwardRuleService.update(ctx, id, req.validatedBody)
  },
  {
    validation: [ForwardRuleParamsSchema, UpdateForwardRuleSchema],
  }
)

// POST /forward-rules/:id/toggle - Toggle rule active status
router.post(
  '/:id/toggle',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return forwardRuleService.toggleActive(ctx, id)
  },
  {
    validation: ForwardRuleParamsSchema,
  }
)

// DELETE /forward-rules/:id - Delete a forward rule
router.delete(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return forwardRuleService.delete(ctx, id)
  },
  {
    validation: ForwardRuleParamsSchema,
  }
)

// POST /forward-rules/:id/start - Start a scheduled rule
router.post(
  '/:id/start',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return forwardRuleService.startRule(ctx, id)
  },
  {
    validation: ForwardRuleParamsSchema,
  }
)

// POST /forward-rules/:id/pause - Pause a scheduled rule
router.post(
  '/:id/pause',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return forwardRuleService.pauseRule(ctx, id)
  },
  {
    validation: ForwardRuleParamsSchema,
  }
)

// POST /forward-rules/:id/resume - Resume a paused rule
router.post(
  '/:id/resume',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return forwardRuleService.resumeRule(ctx, id)
  },
  {
    validation: ForwardRuleParamsSchema,
  }
)

// POST /forward-rules/:id/reset - Reset a rule to start over
router.post(
  '/:id/reset',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return forwardRuleService.resetRule(ctx, id)
  },
  {
    validation: ForwardRuleParamsSchema,
  }
)

export { router }
