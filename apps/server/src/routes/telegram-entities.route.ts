import Router from '../lib/router'
import type { Request } from 'express'
import telegramEntityService from '../services/telegram-entity.service'
import { getRequestContext } from '../helper/context'
import { DBEntity } from '../constant/db'
import { z } from 'zod'

const router = Router()

export const name = 'telegram-entities'

const CreateEntitySchema = z.object({
  telegramId: z.string().min(1, 'Telegram ID is required'),
  type: z.number().int().min(0).max(2), // TelegramEntityType
  title: z.string().min(1, 'Title is required'),
  username: z.string().optional(),
  description: z.string().optional(),
  botId: z.string().optional(), // Optional: if not provided, use platform bot
})

const UpdateEntitySchema = z.object({
  title: z.string().min(1).optional(),
  username: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

const EntityParamsSchema = z.object({
  id: z.string().uuid('Invalid entity ID'),
})

router.get(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req, { entity: DBEntity.Bot })
    return telegramEntityService.list(ctx)
  }
)

router.get(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req, { entity: DBEntity.Bot })
    const { id } = req.validatedParams
    return telegramEntityService.getById(ctx, id)
  },
  {
    validation: EntityParamsSchema,
  }
)

router.post(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const data = req.validatedBody
    return telegramEntityService.create(ctx, data)
  },
  {
    validation: CreateEntitySchema,
  }
)

router.put(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    const data = req.validatedBody
    return telegramEntityService.update(ctx, id, data)
  },
  {
    validation: [EntityParamsSchema, UpdateEntitySchema],
  }
)

router.delete(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    await telegramEntityService.delete(ctx, id)
    return { message: 'Telegram entity deleted successfully' }
  },
  {
    validation: EntityParamsSchema,
  }
)

router.post(
  '/:id/sync-members',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    const entity = await telegramEntityService.syncMemberCount(ctx, id)
    return entity
  },
  {
    validation: EntityParamsSchema,
  }
)

export { router }
