import Router from '../lib/router'
import type { Request } from 'express'
import userBotService from '../services/user-bot.service'
import { getRequestContext } from '../helper/context'
import {
  CreateBotSchema,
  BotParamsSchema,
  BotQuerySchema,
  LinkEntitySchema,
  EntityParamsSchema,
} from '../validation/bot.validation'

const router = Router()

export const name = 'bots'

// GET /bots - List user's bots
router.get(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return userBotService.list(ctx)
  },
  {
    validation: BotQuerySchema,
  }
)

// GET /bots/cost - Get bot creation cost config
router.get(
  '/cost',
  async (_req: Request) => {
    return userBotService.getBotCostConfig()
  }
)

// GET /bots/:id - Get bot details
router.get(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return userBotService.getById(ctx, id)
  },
  {
    validation: BotParamsSchema,
  }
)

// GET /bots/:id/chats - Get chats for a bot
router.get(
  '/:id/chats',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return userBotService.getChats(ctx, id)
  },
  {
    validation: BotParamsSchema,
  }
)

// POST /bots - Create a new bot
router.post(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { token } = req.validatedBody
    return userBotService.create(ctx, token)
  },
  {
    validation: CreateBotSchema,
  }
)

// POST /bots/:id/sync - Sync bot chats
router.post(
  '/:id/sync',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return userBotService.syncChats(ctx, id)
  },
  {
    validation: BotParamsSchema,
  }
)

// POST /bots/:id/default - Set bot as default
router.post(
  '/:id/default',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return userBotService.setDefault(ctx, id)
  },
  {
    validation: BotParamsSchema,
  }
)

// POST /bots/:id/entities - Link bot to entity
router.post(
  '/:id/entities',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    const { telegramEntityId, isPrimary } = req.validatedBody
    return userBotService.linkToEntity(ctx, id, telegramEntityId, isPrimary)
  },
  {
    validation: [BotParamsSchema, LinkEntitySchema],
  }
)

// DELETE /bots/:id - Delete a bot
router.delete(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return userBotService.delete(ctx, id)
  },
  {
    validation: BotParamsSchema,
  }
)

// DELETE /bots/:id/entities/:entityId - Unlink bot from entity
router.delete(
  '/:id/entities/:entityId',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id, entityId } = req.validatedParams
    return userBotService.unlinkFromEntity(ctx, id, entityId)
  },
  {
    validation: EntityParamsSchema,
  }
)

export { router }
