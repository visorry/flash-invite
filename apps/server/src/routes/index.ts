import type { Express } from 'express'
import restHandler from './handlers/rest.handler'
import { requireAuth } from '../middleware/auth.middleware'
import * as botsRoute from './bots.route'
import * as invitesRoute from './invites.route'
import * as membersRoute from './members.route'
import * as dashboardRoute from './dashboard.route'
import * as telegramEntitiesRoute from './telegram-entities.route'
import * as tokensRoute from './tokens.route'

const v1APIs = Promise.resolve({
  bots: botsRoute,
  invites: invitesRoute,
  members: membersRoute,
  dashboard: dashboardRoute,
  'telegram-entities': telegramEntitiesRoute,
  tokens: tokensRoute,
})

export const setupRoutes = (app: Express) => {
  // Protected routes (auth required)
  restHandler(v1APIs, '/api/v1', app, requireAuth)
}
