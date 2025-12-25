import Router from '../lib/router'
import type { Request } from 'express'
import autoDropService from '../services/auto-drop.service'
import { getRequestContext } from '../helper/context'
import { z } from 'zod'

const router = Router()

export const name = 'auto-drop'

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
  startPostId: z.number().int().min(1).optional(),
  endPostId: z.number().int().min(1).optional(),
  batchSize: z.number().int().min(1).max(100).optional(),
  dropInterval: z.number().int().min(1).optional(),
  dropUnit: z.number().int().min(0).max(3).optional(),
  deliveryMode: z.number().int().min(0).max(1).optional(),
  randomSelection: z.boolean().optional(),
  totalPostsInSource: z.number().int().min(1).optional(),
  deleteAfterEnabled: z.boolean().optional(),
  deleteTimeout: z.number().int().min(1).optional(),
  vipMessageEnabled: z.boolean().optional(),
  vipMessage: z.string().optional(),
  cooldownEnabled: z.boolean().optional(),
  cooldownSeconds: z.number().int().min(1).optional(),
  welcomeMessage: z.string().optional(),
  hideAuthorSignature: z.boolean().optional(),
})

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  startPostId: z.number().int().min(1).nullable().optional(),
  endPostId: z.number().int().min(1).nullable().optional(),
  batchSize: z.number().int().min(1).max(100).optional(),
  dropInterval: z.number().int().min(1).optional(),
  dropUnit: z.number().int().min(0).max(3).optional(),
  deliveryMode: z.number().int().min(0).max(1).optional(),
  randomSelection: z.boolean().optional(),
  totalPostsInSource: z.number().int().min(1).nullable().optional(),
  deleteAfterEnabled: z.boolean().optional(),
  deleteTimeout: z.number().int().min(1).optional(),
  vipMessageEnabled: z.boolean().optional(),
  vipMessage: z.string().nullable().optional(),
  cooldownEnabled: z.boolean().optional(),
  cooldownSeconds: z.number().int().min(1).optional(),
  welcomeMessage: z.string().nullable().optional(),
  hideAuthorSignature: z.boolean().optional(),
})

// GET /auto-drop - List auto-drop rules
router.get(
  '/',
  async (req: Request) => {
    const query = QuerySchema.parse(req.query)
    const ctx = getRequestContext(req)
    return await autoDropService.list(ctx, query)
  }
)

// GET /auto-drop/:id - Get auto-drop rule by ID
router.get(
  '/:id',
  async (req: Request) => {
    const params = ParamsSchema.parse(req.params)
    const ctx = getRequestContext(req)
    return await autoDropService.getById(ctx, params.id)
  }
)

// POST /auto-drop - Create auto-drop rule
router.post(
  '/',
  async (req: Request) => {
    const body = CreateSchema.parse(req.body)
    const ctx = getRequestContext(req)
    return await autoDropService.create(ctx, body)
  }
)

// PUT /auto-drop/:id - Update auto-drop rule
router.put(
  '/:id',
  async (req: Request) => {
    const params = ParamsSchema.parse(req.params)
    const body = UpdateSchema.parse(req.body)
    const ctx = getRequestContext(req)
    return await autoDropService.update(ctx, params.id, body)
  }
)

// POST /auto-drop/:id/toggle - Toggle active status
router.post(
  '/:id/toggle',
  async (req: Request) => {
    const params = ParamsSchema.parse(req.params)
    const ctx = getRequestContext(req)
    return await autoDropService.toggleActive(ctx, params.id)
  }
)

// DELETE /auto-drop/:id - Delete auto-drop rule
router.delete(
  '/:id',
  async (req: Request) => {
    const params = ParamsSchema.parse(req.params)
    const ctx = getRequestContext(req)
    return await autoDropService.delete(ctx, params.id)
  }
)

// POST /auto-drop/:id/start - Start auto-drop rule
router.post(
  '/:id/start',
  async (req: Request) => {
    const params = ParamsSchema.parse(req.params)
    const ctx = getRequestContext(req)
    return await autoDropService.start(ctx, params.id)
  }
)

// POST /auto-drop/:id/pause - Pause auto-drop rule
router.post(
  '/:id/pause',
  async (req: Request) => {
    const params = ParamsSchema.parse(req.params)
    const ctx = getRequestContext(req)
    return await autoDropService.pause(ctx, params.id)
  }
)

// POST /auto-drop/:id/resume - Resume auto-drop rule
router.post(
  '/:id/resume',
  async (req: Request) => {
    const params = ParamsSchema.parse(req.params)
    const ctx = getRequestContext(req)
    return await autoDropService.resume(ctx, params.id)
  }
)

// POST /auto-drop/:id/reset - Reset auto-drop rule
router.post(
  '/:id/reset',
  async (req: Request) => {
    const params = ParamsSchema.parse(req.params)
    const ctx = getRequestContext(req)
    return await autoDropService.reset(ctx, params.id)
  }
)

// POST /auto-drop/:id/on-demand - Trigger on-demand post delivery
const OnDemandSchema = z.object({
  telegramUserId: z.string(),
})

router.post(
  '/:id/on-demand',
  async (req: Request) => {
    const params = ParamsSchema.parse(req.params)
    const body = OnDemandSchema.parse(req.body)
    const ctx = getRequestContext(req)
    return await autoDropService.handleOnDemandRequest(ctx, params.id, body.telegramUserId)
  }
)

export { router }