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

const publicAPIs = Promise.resolve({
  auth: authRoute,
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
})

const adminAPIs = Promise.resolve({
  admin: adminRoute,
})

export const setupRoutes = (app: Express) => {
  // Public routes (no auth required)
  restHandler(publicAPIs, '/api/v1', app)

  // Protected routes (auth required)
  restHandler(v1APIs, '/api/v1', app, requireAuth)

  // Admin routes (auth + admin required)
  restHandler(adminAPIs, '/api/v1', app, [requireAuth, requireAdmin])
}
