import type { Express } from 'express'
import { convertToExpressRouter } from '../../lib/router'
import type { RouterType } from '../../lib/router'

interface APIGroup {
  [key: string]: {
    name: string
    router: RouterType
    middleware?: any[]
  }
}

const handler = async (
  apiGroup: Promise<APIGroup>,
  prefix: string,
  app: Express,
  globalMiddleware?: any
): Promise<void> => {
  const apis = await apiGroup

  Object.keys(apis).forEach((path) => {
    const api = apis[path]
    if (!api) {
      return
    }

    const expressRouter = convertToExpressRouter(api.router)

    const middlewares = []
    if (globalMiddleware) {
      middlewares.push(globalMiddleware)
    }
    if (api.middleware && api.middleware.length > 0) {
      middlewares.push(...api.middleware)
    }

    const fullPath = `${prefix}/${api.name}`
    if (middlewares.length > 0) {
      app.use(fullPath, ...middlewares, expressRouter)
    } else {
      app.use(fullPath, expressRouter)
    }

    console.log(`📍 Registered routes for ${fullPath}:`)
    const routes = api.router.calls()
    routes.forEach(route => {
      console.log(`   ${route.method} ${fullPath}${route.path}`)
    })
  })
}

export default handler
