import { NotFoundError, BadRequestError, ConflictError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { TelegramEntityType } from '@super-invite/db'
import { telegramBot } from '../lib/telegram'
import { generatePrismaInclude } from '../helper/db/include'
import { DBEntity } from '../constant/db'

const list = async (ctx: RequestContext) => {
  const include = generatePrismaInclude(DBEntity.Bot, ctx)
  const filter = ctx.filter || {}
  const pagination = ctx.pagination || {}

  // Add user filter
  if (ctx.user) {
    filter.userId = ctx.user.id
  }

  const [items, total] = await Promise.all([
    db.telegramEntity.findMany({
      where: filter,
      ...(include && { include }),
      skip: pagination.skip,
      take: pagination.take,
      orderBy: pagination.orderBy || { createdAt: 'desc' },
    }),
    db.telegramEntity.count({ where: filter }),
  ])

  return {
    items,
    total,
    page: pagination.current || 1,
    size: pagination.take || 20,
  }
}

const getById = async (ctx: RequestContext, id: string) => {
  const include = generatePrismaInclude(DBEntity.Bot, ctx)

  const entity = await db.telegramEntity.findUnique({
    where: { id },
    ...(include && { include }),
  })

  if (!entity) {
    throw new NotFoundError('Telegram entity not found')
  }

  // Check ownership
  if (ctx.user && entity.userId !== ctx.user.id) {
    throw new NotFoundError('Telegram entity not found')
  }

  return entity
}

const create = async (ctx: RequestContext, data: {
  telegramId: string
  type: TelegramEntityType
  title: string
  username?: string
  description?: string
}) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  // Check if entity already exists
  const existing = await db.telegramEntity.findUnique({
    where: { telegramId: data.telegramId },
  })

  if (existing) {
    throw new ConflictError('This Telegram group/channel is already registered')
  }

  // Verify bot has access to the chat
  try {
    const chat = await telegramBot.getChat(data.telegramId)
    const isAdmin = await telegramBot.isBotAdmin(data.telegramId)

    if (!isAdmin) {
      throw new BadRequestError('Bot must be an admin in the group/channel')
    }

    // Get member count
    const memberCount = await telegramBot.getChatMemberCount(data.telegramId)

    // Create entity
    const entity = await db.telegramEntity.create({
      data: {
        userId: ctx.user.id,
        telegramId: data.telegramId,
        type: data.type,
        title: data.title || chat.title || 'Unknown',
        username: data.username || chat.username,
        description: data.description || chat.description,
        memberCount,
        botAdded: true,
        botAddedAt: new Date(),
        isActive: true,
      },
    })

    return entity
  } catch (error: any) {
    if (error instanceof BadRequestError || error instanceof ConflictError) {
      throw error
    }
    throw new BadRequestError(`Failed to verify Telegram group/channel: ${error.message}`)
  }
}

const update = async (ctx: RequestContext, id: string, data: {
  title?: string
  username?: string
  description?: string
  isActive?: boolean
}) => {
  await getById(ctx, id)

  const updated = await db.telegramEntity.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  })

  return updated
}

const deleteEntity = async (ctx: RequestContext, id: string) => {
  await getById(ctx, id)

  // Check if there are active invite links
  const activeInvites = await db.inviteLink.count({
    where: {
      telegramEntityId: id,
      status: 0, // ACTIVE
    },
  })

  if (activeInvites > 0) {
    throw new ConflictError('Cannot delete entity with active invite links')
  }

  await db.telegramEntity.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  })
}

const syncMemberCount = async (ctx: RequestContext, id: string) => {
  const entity = await getById(ctx, id)

  try {
    const memberCount = await telegramBot.getChatMemberCount(entity.telegramId)

    const updated = await db.telegramEntity.update({
      where: { id },
      data: {
        memberCount,
        updatedAt: new Date(),
      },
    })

    return updated
  } catch (error: any) {
    throw new BadRequestError(`Failed to sync member count: ${error.message}`)
  }
}

export default {
  list,
  getById,
  create,
  update,
  delete: deleteEntity,
  syncMemberCount,
}
