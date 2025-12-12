import Router from '../lib/router'
import type { Request } from 'express'
import autoApprovalService from '../services/auto-approval.service'
import { getRequestContext } from '../helper/context'
import { z } from 'zod'

const router = Router()

export const name = 'auto-approval'

// Validation schemas
const QuerySchema = z.object({
  botId: z.string().uuid().optional(),
})

const ParamsSchema = z.object({
  id: z.string().uuid(),
})

const CreateSchema = z.object({
  botId: z.string().uuid(),
  telegramEntityId: z.string().uuid(),
  name: z.string().min(1).max(100),
  approvalMode: z.number().min(0).max(2).optional(),
  delayInterval: z.number().min(0).optional(),
  delayUnit: z.number().min(0).max(4).optional(),
  requirePremium: z.boolean().optional(),
  requireUsername: z.boolean().optional(),
  minAccountAge: z.number().min(0).optional(),
  blockedCountries: z.array(z.string().length(2)).optional(),
  sendWelcomeMsg: z.boolean().optional(),
  welcomeMessage: z.string().max(4000).optional(),
})

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  approvalMode: z.number().min(0).max(2).optional(),
  delayInterval: z.number().min(0).optional(),
  delayUnit: z.number().min(0).max(4).optional(),
  requirePremium: z.boolean().optional(),
  requireUsername: z.boolean().optional(),
  minAccountAge: z.number().min(0).nullable().optional(),
  blockedCountries: z.array(z.string().length(2)).optional(),
  sendWelcomeMsg: z.boolean().optional(),
  welcomeMessage: z.string().max(4000).nullable().optional(),
})

// GET /auto-approval - List auto-approval rules
router.get(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { botId } = req.validatedQuery || {}
    return autoApprovalService.list(ctx, { botId })
  },
  {
    validation: QuerySchema,
  }
)

// GET /auto-approval/:id - Get rule details
router.get(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return autoApprovalService.getById(ctx, id)
  },
  {
    validation: ParamsSchema,
  }
)

// POST /auto-approval - Create a new rule
router.post(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return autoApprovalService.create(ctx, req.validatedBody)
  },
  {
    validation: CreateSchema,
  }
)

// PUT /auto-approval/:id - Update a rule
router.put(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return autoApprovalService.update(ctx, id, req.validatedBody)
  },
  {
    validation: [ParamsSchema, UpdateSchema],
  }
)

// POST /auto-approval/:id/toggle - Toggle rule active status
router.post(
  '/:id/toggle',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return autoApprovalService.toggleActive(ctx, id)
  },
  {
    validation: ParamsSchema,
  }
)

// DELETE /auto-approval/:id - Delete a rule
router.delete(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return autoApprovalService.delete(ctx, id)
  },
  {
    validation: ParamsSchema,
  }
)

// GET /auto-approval/:id/pending - Get pending approvals for a rule
router.get(
  '/:id/pending',
  async (req: Request) => {
    const { id } = req.validatedParams
    return autoApprovalService.getPendingApprovals(id)
  },
  {
    validation: ParamsSchema,
  }
)

// POST /auto-approval/:id/approve-all - Manually approve all pending requests
router.post(
  '/:id/approve-all',
  async (req: Request) => {
    const { id } = req.validatedParams
    return autoApprovalService.manuallyApproveAll(id)
  },
  {
    validation: ParamsSchema,
  }
)

export { router }
