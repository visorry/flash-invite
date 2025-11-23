import Router from '../lib/router'
import type { Request } from 'express'
import adminService from '../services/admin.service'
import tokenService from '../services/token.service'
import botMemberService from '../services/bot-member.service'
import broadcastService from '../services/broadcast.service'
import { getRequestContext } from '../helper/context'
import { z } from 'zod'
import { DurationUnit } from '@super-invite/db'

const router = Router()

export const name = 'admin'

const UserParamsSchema = z.object({
  id: z.string().min(1, 'Invalid user ID'),
})

const UpdateUserRoleSchema = z.object({
  isAdmin: z.boolean(),
})

// Get all users
router.get(
  '/users',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.listUsers(ctx)
  }
)

// Get user by ID
router.get(
  '/users/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return adminService.getUserById(ctx, id)
  },
  {
    validation: UserParamsSchema,
  }
)

// Update user role
router.put(
  '/users/:id/role',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    const data = req.validatedBody
    return adminService.updateUserRole(ctx, id, data)
  },
  {
    validation: [UserParamsSchema, UpdateUserRoleSchema],
  }
)

// Get all subscriptions
router.get(
  '/subscriptions',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.listSubscriptions(ctx)
  }
)

// Get all plans
router.get(
  '/plans',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.listPlans(ctx)
  }
)

// Get platform stats
router.get(
  '/stats',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.getPlatformStats(ctx)
  }
)

// Get all telegram entities (all users)
router.get(
  '/telegram-entities',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.listAllTelegramEntities(ctx)
  }
)

// Get all invite links (all users)
router.get(
  '/invite-links',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.listAllInviteLinks(ctx)
  }
)

// Add tokens to user
const AddTokensSchema = z.object({
  amount: z.number().int().positive(),
  description: z.string().optional(),
})

router.post(
  '/users/:id/tokens',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    const data = req.validatedBody
    return adminService.addTokensToUser(ctx, id, data.amount, data.description)
  },
  {
    validation: [UserParamsSchema, AddTokensSchema],
  }
)

// Add subscription to user
const AddSubscriptionSchema = z.object({
  planId: z.string().uuid(),
})

router.post(
  '/users/:id/subscription',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    const data = req.validatedBody
    return adminService.addSubscriptionToUser(ctx, id, data.planId)
  },
  {
    validation: [UserParamsSchema, AddSubscriptionSchema],
  }
)

// Create plan
const CreatePlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  type: z.number().int(),
  interval: z.number().int(),
  price: z.number(),
  tokensIncluded: z.number().int().positive(),
  maxGroups: z.number().int().positive().nullable().optional(),
  maxInvitesPerDay: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
})

router.post(
  '/plans',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const data = req.validatedBody
    return adminService.createPlan(ctx, data)
  },
  {
    validation: CreatePlanSchema,
  }
)

// Update plan
const PlanParamsSchema = z.object({
  id: z.string().uuid(),
})

router.put(
  '/plans/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    const data = req.validatedBody
    return adminService.updatePlan(ctx, id, data)
  },
  {
    validation: [PlanParamsSchema, CreatePlanSchema],
  }
)

// Delete plan
router.delete(
  '/plans/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return adminService.deletePlan(ctx, id)
  },
  {
    validation: PlanParamsSchema,
  }
)

// Get config
router.get(
  '/config',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.getConfig(ctx)
  }
)

// Update config
const UpdateConfigSchema = z.object({
  botToken: z.string().optional(),
  botUsername: z.string().optional(),
})

router.put(
  '/config',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const data = req.validatedBody
    return adminService.updateConfig(ctx, data)
  },
  {
    validation: UpdateConfigSchema,
  }
)

// Token pricing configuration
router.get(
  '/token-pricing',
  async (req: Request) => {
    return tokenService.getCostConfig()
  }
)

const UpsertTokenPricingSchema = z.object({
  durationUnit: z.number().int().min(0).max(4), // DurationUnit enum
  costPerUnit: z.number().int().min(0),
  description: z.string().optional(),
})

router.post(
  '/token-pricing',
  async (req: Request) => {
    const data = req.validatedBody
    return tokenService.upsertCostConfig(
      data.durationUnit as DurationUnit,
      data.costPerUnit,
      data.description
    )
  },
  {
    validation: UpsertTokenPricingSchema,
  }
)

const DeleteTokenPricingSchema = z.object({
  durationUnit: z.coerce.number().int().min(0).max(4),
})

router.delete(
  '/token-pricing/:durationUnit',
  async (req: Request) => {
    const { durationUnit } = req.validatedParams
    return tokenService.deleteCostConfig(durationUnit as DurationUnit)
  },
  {
    validation: DeleteTokenPricingSchema,
  }
)

// Bot members
router.get(
  '/bot-members',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return botMemberService.list(ctx)
  }
)

router.get(
  '/bot-members/stats',
  async (req: Request) => {
    return botMemberService.getStats()
  }
)

const BotMemberParamsSchema = z.object({
  id: z.string().uuid(),
})

router.get(
  '/bot-members/:id',
  async (req: Request) => {
    const { id } = req.validatedParams
    return botMemberService.getById(id)
  },
  {
    validation: BotMemberParamsSchema,
  }
)

// ============ Broadcast Routes ============

// List all templates
router.get(
  '/broadcast/templates',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return broadcastService.listTemplates(ctx)
  }
)

// Get template by ID
const TemplateParamsSchema = z.object({
  id: z.string().uuid(),
})

router.get(
  '/broadcast/templates/:id',
  async (req: Request) => {
    const { id } = req.validatedParams
    return broadcastService.getTemplateById(id)
  },
  {
    validation: TemplateParamsSchema,
  }
)

// Create template
const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1),
  parseMode: z.string().optional(),
  buttons: z.array(z.array(z.object({
    text: z.string().min(1),
    url: z.string().url().optional(),
    callback_data: z.string().optional(),
  }))).optional(),
})

router.post(
  '/broadcast/templates',
  async (req: Request) => {
    const data = req.validatedBody
    return broadcastService.createTemplate(data)
  },
  {
    validation: CreateTemplateSchema,
  }
)

// Update template
const UpdateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  parseMode: z.string().optional(),
  buttons: z.array(z.array(z.object({
    text: z.string().min(1),
    url: z.string().url().optional(),
    callback_data: z.string().optional(),
  }))).optional().nullable(),
  isActive: z.boolean().optional(),
})

router.put(
  '/broadcast/templates/:id',
  async (req: Request) => {
    const { id } = req.validatedParams
    const data = req.validatedBody
    return broadcastService.updateTemplate(id, data)
  },
  {
    validation: [TemplateParamsSchema, UpdateTemplateSchema],
  }
)

// Delete template
router.delete(
  '/broadcast/templates/:id',
  async (req: Request) => {
    const { id } = req.validatedParams
    return broadcastService.deleteTemplate(id)
  },
  {
    validation: TemplateParamsSchema,
  }
)

// List all broadcasts
router.get(
  '/broadcast/list',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return broadcastService.listBroadcasts(ctx)
  }
)

// Get broadcast stats
router.get(
  '/broadcast/stats',
  async () => {
    return broadcastService.getStats()
  }
)

// Get filtered bot members for recipient selection
router.get(
  '/broadcast/recipients',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const filter: any = {}
    if (req.query.isPremium !== undefined) {
      filter.isPremium = req.query.isPremium === 'true'
    }
    if (req.query.languageCode) {
      filter.languageCode = req.query.languageCode
    }
    if (req.query.activeWithinDays) {
      filter.activeWithinDays = parseInt(req.query.activeWithinDays as string)
    }
    return broadcastService.getFilteredBotMembers(ctx, filter)
  }
)

// Get broadcast by ID
router.get(
  '/broadcast/:id',
  async (req: Request) => {
    const { id } = req.validatedParams
    return broadcastService.getBroadcastById(id)
  },
  {
    validation: TemplateParamsSchema,
  }
)

// Create and send broadcast
const CreateBroadcastSchema = z.object({
  botId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  content: z.string().min(1),
  parseMode: z.string().optional(),
  buttons: z.array(z.array(z.object({
    text: z.string().min(1),
    url: z.string().url().optional(),
    callback_data: z.string().optional(),
  }))).optional(),
  recipientIds: z.array(z.string().uuid()).min(1),
  filterCriteria: z.object({
    botId: z.string().uuid().optional(),
    isPremium: z.boolean().optional(),
    languageCode: z.string().optional(),
    activeWithinDays: z.number().int().positive().optional(),
  }).optional(),
})

router.post(
  '/broadcast/send',
  async (req: Request) => {
    const data = req.validatedBody
    // Create the broadcast
    const broadcast = await broadcastService.createBroadcast(data)
    // Send it immediately
    return broadcastService.sendBroadcast(broadcast.id)
  },
  {
    validation: CreateBroadcastSchema,
  }
)

// Cancel broadcast (only works for pending broadcasts)
router.post(
  '/broadcast/:id/cancel',
  async (req: Request) => {
    const { id } = req.validatedParams
    return broadcastService.cancelBroadcast(id)
  },
  {
    validation: TemplateParamsSchema,
  }
)

export { router }
