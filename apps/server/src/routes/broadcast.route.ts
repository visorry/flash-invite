import Router from '../lib/router'
import type { Request } from 'express'
import broadcastUserService from '../services/broadcast-user.service'
import { getRequestContext } from '../helper/context'
import { z } from 'zod'

const router = Router()

export const name = 'broadcast'

// Validation schemas - using flat zod schemas like other routes
const BotIdParamsSchema = z.object({
  botId: z.string(),
})

const BroadcastIdParamsSchema = z.object({
  id: z.string(),
})

const MessageParamsSchema = z.object({
  botId: z.string(),
  groupId: z.string(),
})

const CreateBroadcastBodySchema = z.object({
  botId: z.string(),
  name: z.string().optional(),
  content: z.string().optional(),
  parseMode: z.string().optional(),
  buttons: z.any().optional(),
  sourceGroupId: z.string().optional(),
  sourceMessageIds: z.array(z.number()).optional(),
  watermarkEnabled: z.boolean().optional(),
  watermarkText: z.string().optional(),
  watermarkPosition: z.string().optional(),
  forwardMedia: z.boolean().optional(),
  copyMode: z.boolean().optional(),
  removeLinks: z.boolean().optional(),
  filterCriteria: z.object({
    isPremium: z.boolean().optional(),
    languageCode: z.string().optional(),
    activeWithinDays: z.number().optional(),
    isSubscribed: z.boolean().optional(),
  }).optional(),
  recipientIds: z.array(z.string()).optional(),
  scheduledFor: z.string().optional(),
})

// GET /broadcast/bots - List user's bots with subscriber counts
router.get(
  '/bots',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return broadcastUserService.listBotsWithSubscribers(ctx)
  }
)

// GET /broadcast/subscribers/:botId - Get subscribers for a bot
router.get(
  '/subscribers/:botId',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { botId } = req.params as { botId: string }
    const filters = req.query as any
    return broadcastUserService.getSubscribers(ctx, botId, {
      isPremium: filters.isPremium === 'true' ? true : undefined,
      languageCode: filters.languageCode,
      activeWithinDays: filters.activeWithinDays ? parseInt(filters.activeWithinDays) : undefined,
      search: filters.search,
    })
  },
  {
    validation: BotIdParamsSchema,
  }
)

// GET /broadcast/subscribers/:botId/stats - Get subscriber stats for a bot
router.get(
  '/subscribers/:botId/stats',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { botId } = req.params as { botId: string }
    return broadcastUserService.getSubscriberStats(ctx, botId)
  },
  {
    validation: BotIdParamsSchema,
  }
)

// GET /broadcast/source-groups/:botId - Get available source groups for a bot
router.get(
  '/source-groups/:botId',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { botId } = req.params as { botId: string }
    return broadcastUserService.getSourceGroups(ctx, botId)
  },
  {
    validation: BotIdParamsSchema,
  }
)

// GET /broadcast/messages/:botId/:groupId - Get recent messages from a group
router.get(
  '/messages/:botId/:groupId',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { botId, groupId } = req.params as { botId: string; groupId: string }
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
    return broadcastUserService.getSourceMessages(ctx, botId, groupId, limit)
  },
  {
    validation: MessageParamsSchema,
  }
)


// GET /broadcast/list - List user's broadcasts
router.get(
  '/list',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { botId } = req.query as { botId?: string }
    return broadcastUserService.listBroadcasts(ctx, botId)
  }
)

// GET /broadcast/:id - Get broadcast details
router.get(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.params
    return broadcastUserService.getBroadcastById(ctx, id)
  },
  {
    validation: BroadcastIdParamsSchema,
  }
)

// POST /broadcast - Create a new broadcast
router.post(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const data = req.body
    return broadcastUserService.createBroadcast(ctx, data)
  },
  {
    validation: CreateBroadcastBodySchema,
  }
)

// POST /broadcast/:id/send - Start sending a broadcast
router.post(
  '/:id/send',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.params
    return broadcastUserService.sendBroadcast(ctx, id)
  },
  {
    validation: BroadcastIdParamsSchema,
  }
)

// POST /broadcast/:id/cancel - Cancel a broadcast
router.post(
  '/:id/cancel',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.params
    return broadcastUserService.cancelBroadcast(ctx, id)
  },
  {
    validation: BroadcastIdParamsSchema,
  }
)

// DELETE /broadcast/:id - Delete a broadcast
router.delete(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.params
    return broadcastUserService.deleteBroadcast(ctx, id)
  },
  {
    validation: BroadcastIdParamsSchema,
  }
)

// POST /broadcast/preview - Preview a broadcast message
router.post(
  '/preview',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const data = req.body
    return broadcastUserService.previewBroadcast(ctx, data)
  },
  {
    validation: CreateBroadcastBodySchema,
  }
)

// POST /broadcast/:id/duplicate - Duplicate a broadcast for re-sending
router.post(
  '/:id/duplicate',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.params
    return broadcastUserService.duplicateBroadcast(ctx, id)
  },
  {
    validation: BroadcastIdParamsSchema,
  }
)

export { router }

