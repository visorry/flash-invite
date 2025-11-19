import 'dotenv/config'

const NODE_ENV = process.env.NODE_ENV || 'development'
const PORT = process.env.PORT || 3000

const IS_DEV = NODE_ENV === 'development'
const IS_PROD = NODE_ENV === 'production'

export const config = {
  PORT: Number(PORT),
  NODE_ENV,
  IS_DEV,
  IS_PROD,

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-here',
  
  // CORS Origins
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [
    'http://localhost:3001',
    'http://localhost:3000',
  ],

  // Telegram Bot
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',

  // API Version
  API_VERSION: '1.0.0',
} as const

export type Config = typeof config
