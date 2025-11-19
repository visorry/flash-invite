import Router from '../lib/router'
import type { Request } from 'express'
import botService from '../services/bot.service'
import { getRequestContext } from '../helper/context'
import { DBEntity } from '../constant/db'
import {
  CreateBotSchema,
  UpdateBotSchema,
  BotParamsSchema,
  BotQuerySchema,
} from '../validation/bot.validation'

const router = Router()

export const name = 'bots'

router.get(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req, { entity: DBEntity.Bot })
    return botService.list(ctx)
  },
  {
    validation: BotQuerySchema,
  }
)

router.get(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req, { entity: DBEntity.Bot })
    const { id } = req.validatedParams
    return botService.getById(ctx, id)
  },
  {
    validation: BotParamsSchema,
  }
)

router.post(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const data = req.validatedBody
    return botService.create(ctx, data)
  },
  {
    validation: CreateBotSchema,
  }
)

router.put(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    const data = req.validatedBody
    return botService.update(ctx, id, data)
  },
  {
    validation: [BotParamsSchema, UpdateBotSchema],
  }
)

router.delete(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    await botService.delete(ctx, id)
    return { message: 'Bot deleted successfully' }
  },
  {
    validation: BotParamsSchema,
  }
)

export { router }
