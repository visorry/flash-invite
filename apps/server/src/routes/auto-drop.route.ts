import Router from '../lib/router'
import type { Request } from 'express'
import autoDropService from '../services/auto-drop.service'
import { getRequestContext } from '../helper/context'
import {
  AutoDropQuerySchema,
  AutoDropParamsSchema,
  CreateAutoDropSchema,
  UpdateAutoDropSchema,
} from '../validation/auto-drop.validation'

const router = Router()

export const name = 'auto-drop'

// GET /auto-drop - List auto drop rules
router.get(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { botId } = req.validatedQuery || {}
    return autoDropService.list(ctx, { botId })
  },
  {
    validation: AutoDropQuerySchema,
  }
)

// GET /auto-drop/:id - Get auto drop rule details
router.get(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return autoDropService.getById(ctx, id)
  },
  {
    validation: AutoDropParamsSchema,
  }
)

// POST /auto-drop - Create a new auto drop rule
router.post(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return autoDropService.create(ctx, req.validatedBody)
  },
  {
    validation: CreateAutoDropSchema,
  }
)

// PUT /auto-drop/:id - Update an auto drop rule
router.put(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return autoDropService.update(ctx, id, req.validatedBody)
  },
  {
    validation: [AutoDropParamsSchema, UpdateAutoDropSchema],
  }
)

// POST /auto-drop/:id/toggle - Toggle rule active status
router.post(
  '/:id/toggle',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return autoDropService.toggleActive(ctx, id)
  },
  {
    validation: AutoDropParamsSchema,
  }
)

// POST /auto-drop/:id/reset - Reset rule progress and stats
router.post(
  '/:id/reset',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return autoDropService.reset(ctx, id)
  },
  {
    validation: AutoDropParamsSchema,
  }
)

// DELETE /auto-drop/:id - Delete an auto drop rule
router.delete(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return autoDropService.delete(ctx, id)
  },
  {
    validation: AutoDropParamsSchema,
  }
)

export { router }
