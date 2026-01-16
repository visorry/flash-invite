import type { Express } from 'express'
import restHandler from './handlers/rest.handler'
import { requireAuth } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'
import * as botsRoute from './bots.route'
import * as invitesRoute from './invites.route'
import * as membersRoute from './members.route'
import * as dashboardRoute from './dashboard.route'
import * as telegramEntitiesRoute from './telegram-entities.route'
import * as tokensRoute from './tokens.route'
import * as adminRoute from './admin.route'
import * as botRoute from './bot.route'
import * as authRoute from './auth.route'
import * as forwardRulesRoute from './forward-rules.route'
import * as autoApprovalRoute from './auto-approval.route'
import * as autoDropRoute from './auto-drop.route'
import * as paymentsRoute from './payments.route'
import * as paymentsWebhookRoute from './payments-webhook.route'
import * as tokenBundlesRoute from './token-bundles.route'
import * as subscriptionsRoute from './subscriptions.route'
import * as userRoute from './user.route'
import * as telegramRoute from './telegram.route'
import * as botAdminRoute from './admin/bot-admin.route'
import * as plansRoute from './plans.route'
import * as configRoute from './config.route'
import * as broadcastRoute from './broadcast.route'
import * as promoterRoute from './promoter.route'


const publicAPIs = Promise.resolve({
  auth: authRoute,
  'payments-webhook': paymentsWebhookRoute,
  telegram: telegramRoute,
  plans: plansRoute,
  config: configRoute,
})

const v1APIs = Promise.resolve({
  bots: botsRoute,
  invites: invitesRoute,
  members: membersRoute,
  dashboard: dashboardRoute,
  'telegram-entities': telegramEntitiesRoute,
  tokens: tokensRoute,
  bot: botRoute,
  'forward-rules': forwardRulesRoute,
  'auto-approval': autoApprovalRoute,
  'auto-drop': autoDropRoute,
  payments: paymentsRoute,
  'token-bundles': tokenBundlesRoute,
  subscriptions: subscriptionsRoute,
  user: userRoute,
  broadcast: broadcastRoute,
  promoter: promoterRoute,
})

const adminAPIs = Promise.resolve({
  admin: adminRoute,
  'bot-admin': botAdminRoute,
})

export const setupRoutes = (app: Express) => {
  // Public routes (no auth required)
  restHandler(publicAPIs, '/api/v1', app)

  // Protected routes (auth required)
  restHandler(v1APIs, '/api/v1', app, requireAuth)

  // Admin routes (auth + admin required)
  restHandler(adminAPIs, '/api/v1', app, [requireAuth, requireAdmin])
}
