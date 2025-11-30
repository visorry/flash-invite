import Router from '../lib/router'
import type { Request } from 'express'
import adminService from '../services/admin.service'
import tokenService from '../services/token.service'
import botMemberService from '../services/bot-member.service'
import broadcastService from '../services/broadcast.service'
import { getRequestContext } from '../helper/context'
import { z } from 'zod'
import { DurationUnit, AutomationFeatureType } from '@super-invite/db'
import db from '@super-invite/db'
import { BadRequestError } from '../errors/http-exception'

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
  dailyTokens: z.number().int().min(0).optional().default(0),
  maxGroups: z.number().int().positive().nullable().optional(),
  maxInvitesPerDay: z.number().int().positive().nullable().optional(),
  features: z.array(z.string()).optional(),
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

// Get welcome bonus config
router.get(
  '/welcome-bonus-config',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.getWelcomeBonusConfig(ctx)
  }
)

// Update welcome bonus config
const UpdateWelcomeBonusConfigSchema = z.object({
  amount: z.number().int().min(0).max(10000),
  enabled: z.boolean().optional(),
})

router.put(
  '/welcome-bonus-config',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const data = req.validatedBody
    return adminService.updateWelcomeBonusConfig(ctx, data)
  },
  {
    validation: UpdateWelcomeBonusConfigSchema,
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

// Automation pricing configuration
router.get(
  '/automation-pricing',
  async (req: Request) => {
    return tokenService.getAutomationCostConfig()
  }
)

const UpsertAutomationPricingSchema = z.object({
  featureType: z.number().int().min(0).max(1), // AutomationFeatureType enum
  costPerRule: z.number().int().min(0),
  freeRulesAllowed: z.number().int().min(0),
  description: z.string().optional(),
})

router.post(
  '/automation-pricing',
  async (req: Request) => {
    const data = req.validatedBody
    return tokenService.upsertAutomationCostConfig(
      data.featureType as AutomationFeatureType,
      data.costPerRule,
      data.freeRulesAllowed,
      data.description
    )
  },
  {
    validation: UpsertAutomationPricingSchema,
  }
)

const DeleteAutomationPricingSchema = z.object({
  featureType: z.coerce.number().int().min(0).max(1),
})

router.delete(
  '/automation-pricing/:featureType',
  async (req: Request) => {
    const { featureType } = req.validatedParams
    return tokenService.deleteAutomationCostConfig(featureType as AutomationFeatureType)
  },
  {
    validation: DeleteAutomationPricingSchema,
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

// ============ Token Bundles Admin Routes ============
import tokenBundleAdminService from '../services/admin/token-bundle-admin.service'
import {
  CreateBundleSchema,
  UpdateBundleSchema,
  BundleParamsSchema
} from '../validation/token-bundle.validation'

// Get all bundles (including inactive)
router.get(
  '/token-bundles',
  async (_req: Request) => {
    return tokenBundleAdminService.getAllBundles()
  }
)

// Create new bundle
router.post(
  '/token-bundles',
  async (req: Request) => {
    const data = req.validatedBody
    return tokenBundleAdminService.createBundle(data)
  },
  {
    validation: CreateBundleSchema,
  }
)

// Update bundle
router.put(
  '/token-bundles/:id',
  async (req: Request) => {
    const { id } = req.validatedParams
    const data = req.validatedBody
    return tokenBundleAdminService.updateBundle(id, data)
  },
  {
    validation: [BundleParamsSchema, UpdateBundleSchema],
  }
)

// Delete bundle (soft delete)
router.delete(
  '/token-bundles/:id',
  async (req: Request) => {
    const { id } = req.validatedParams
    return tokenBundleAdminService.deleteBundle(id)
  },
  {
    validation: BundleParamsSchema,
  }
)

// Toggle active status
router.patch(
  '/token-bundles/:id/toggle',
  async (req: Request) => {
    const { id } = req.validatedParams
    return tokenBundleAdminService.toggleActive(id)
  },
  {
    validation: BundleParamsSchema,
  }
)

// Seed default token bundles
import { DEFAULT_TOKEN_BUNDLES } from '../config/default-token-bundles'

router.post(
  '/seed/token-bundles',
  async (_req: Request) => {
    console.log('[ADMIN] Starting token bundles seed...')
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const bundleData of DEFAULT_TOKEN_BUNDLES) {
      try {
        // Check if bundle exists by name (including soft deleted ones)
        const existing = await db.tokenBundle.findFirst({
          where: { name: bundleData.name }
        })

        if (existing) {
          results.skipped++
          continue
        }

        await db.tokenBundle.create({
          data: bundleData,
        })
        results.created++
        console.log(`[ADMIN] Created token bundle "${bundleData.name}"`)
      } catch (error: any) {
        results.errors.push(`${bundleData.name}: ${error.message}`)
        console.error(`[ADMIN] Error creating token bundle "${bundleData.name}":`, error)
      }
    }

    console.log('[ADMIN] Token bundles seed completed:', results)
    return results
  }
)

// ============ User Migration Routes ============
import userOnboardingService from '../services/user-onboarding.service'

// Assign free tier to all users without subscriptions
router.post(
  '/migrate/assign-free-tier',
  async (_req: Request) => {
    console.log('[ADMIN] Starting free tier migration...')

    // Get all users
    const users = await db.user.findMany({
      select: { id: true, email: true },
    })

    const results = {
      total: users.length,
      assigned: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const user of users) {
      try {
        const subscription = await userOnboardingService.assignFreeTier(user.id)
        if (subscription) {
          results.assigned++
          console.log(`[ADMIN] Assigned free tier to ${user.email}`)
        } else {
          results.skipped++
          console.log(`[ADMIN] Skipped ${user.email} (already has subscription or no free plan)`)
        }
      } catch (error: any) {
        results.errors.push(`${user.email}: ${error.message}`)
        console.error(`[ADMIN] Error assigning free tier to ${user.email}:`, error)
      }
    }

    console.log('[ADMIN] Free tier migration completed:', results)
    return results
  }
)

// Seed default plans
import { DEFAULT_PLANS } from '../config/default-plans'

router.post(
  '/seed/plans',
  async (_req: Request) => {
    console.log('[ADMIN] Starting plans seed...')

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const planData of DEFAULT_PLANS) {
      try {
        // Check if plan with same name already exists
        const existing = await db.plan.findFirst({
          where: { name: planData.name },
        })

        if (existing) {
          results.skipped++
          console.log(`[ADMIN] Plan "${planData.name}" already exists, skipping`)
          continue
        }

        // Create the plan
        await db.plan.create({
          data: planData,
        })

        results.created++
        console.log(`[ADMIN] Created plan "${planData.name}"`)
      } catch (error: any) {
        results.errors.push(`${planData.name}: ${error.message}`)
        console.error(`[ADMIN] Error creating plan "${planData.name}":`, error)
      }
    }

    console.log('[ADMIN] Plans seed completed:', results)
    return results
  }
)

// Reset plans (delete all and recreate from seed)
router.post(
  '/reset/plans',
  async (_req: Request) => {
    console.log('[ADMIN] Starting plans reset...')

    try {
      // Check for existing subscriptions
      const subscriptionCount = await db.subscription.count()
      if (subscriptionCount > 0) {
        throw new BadRequestError(`Cannot reset plans: There are ${subscriptionCount} subscriptions linked to existing plans. Please delete them first.`)
      }

      // Delete all existing plans
      const deleted = await db.plan.deleteMany({})
      console.log(`[ADMIN] Deleted ${deleted.count} existing plans`)

      // Create default plans
      const results = {
        deleted: deleted.count,
        created: 0,
        errors: [] as string[],
      }

      for (const planData of DEFAULT_PLANS) {
        try {
          await db.plan.create({
            data: planData,
          })
          results.created++
          console.log(`[ADMIN] Created plan "${planData.name}"`)
        } catch (error: any) {
          results.errors.push(`${planData.name}: ${error.message}`)
          console.error(`[ADMIN] Error creating plan "${planData.name}":`, error)
        }
      }

      console.log('[ADMIN] Plans reset completed:', results)
      return results
    } catch (error: any) {
      console.error('[ADMIN] Plans reset failed:', error)
      throw error
    }
  }
)

export { router }
