import "dotenv/config"
import express from "express"
import cors from "cors"
import { auth } from "@super-invite/auth"
import { toNodeHandler } from "better-auth/node"
import { config } from './config/configuration'
import { setupRoutes } from './routes'
import { errorHandler } from './middleware/error.middleware'
import { initializeScheduler } from './jobs/scheduler'
import { initializeBots, botManager } from './bot'

const app = express()

// Middleware
app.use(cors({
  origin: config.CORS_ORIGINS,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/healthcheck', (_req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Super Invite API - OK',
      version: config.API_VERSION,
      timestamp: new Date().toISOString(),
    },
    error: null,
  })
})

// Auth routes - Better Auth handles all auth endpoints
app.use("/api/auth", toNodeHandler(auth))

// Setup routes and start server
async function startServer() {
  // API routes
  await setupRoutes(app)

  // Error handling
  app.use(errorHandler)

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Endpoint not found',
        status: 404,
        path: req.path,
        method: req.method,
      },
      data: null,
    })
  })

  console.log(`🤖 Super Invite API starting...`)
  console.log(`📍 Environment: ${config.NODE_ENV}`)
  console.log(`🌐 Port: ${config.PORT}`)

  app.listen(config.PORT, async () => {
    console.log(`🚀 Super Invite API is running on port ${config.PORT}`)
    console.log(`🔗 Health check: http://localhost:${config.PORT}/healthcheck`)
    
    // Initialize Telegram bots
    await initializeBots()
    
    // Initialize background jobs
    initializeScheduler()
  })

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`)
    await botManager.stop()
    process.exit(0)
  }

  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
}

startServer().catch(console.error)
