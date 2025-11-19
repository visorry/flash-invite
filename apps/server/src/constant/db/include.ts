import type { EntityIncludeConfig } from '../../types/db'
import { DBEntity } from './entity'

const EntityInclude: EntityIncludeConfig = {
  [DBEntity.User]: [
    'bots',
    'invites',
    'activities',
    { key: 'botCount', value: 'bots', count: true },
    { key: 'inviteCount', value: 'invites', count: true },
    {
      key: 'bots',
      value: 'bots',
      override: () => ({
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          name: true,
          channelName: true,
          channelId: true,
          isActive: true,
          createdAt: true,
        }
      }),
    },
    {
      key: 'invites',
      value: 'invites',
      override: () => ({
        orderBy: {
          createdAt: 'desc'
        },
        take: 10,
        select: {
          id: true,
          inviteLink: true,
          usedCount: true,
          maxUses: true,
          expiresAt: true,
          isActive: true,
          createdAt: true,
        }
      }),
    },
  ],
  [DBEntity.Bot]: [
    'user',
    'invites',
    'members',
    { key: 'inviteCount', value: 'invites', count: true },
    { key: 'memberCount', value: 'members', count: true },
    {
      key: 'user',
      value: 'user',
      override: () => ({
        select: {
          id: true,
          name: true,
          email: true,
        }
      }),
    },
    {
      key: 'invites',
      value: 'invites',
      override: () => ({
        orderBy: {
          createdAt: 'desc'
        },
        where: {
          isActive: true,
        },
        select: {
          id: true,
          inviteLink: true,
          usedCount: true,
          maxUses: true,
          expiresAt: true,
          createdAt: true,
        }
      }),
    },
    {
      key: 'activeMembers',
      value: 'members',
      override: () => ({
        where: {
          isActive: true,
          isKicked: false,
        },
        select: {
          id: true,
          telegramUserId: true,
          telegramUsername: true,
          firstName: true,
          lastName: true,
          joinedAt: true,
        }
      }),
    },
  ],
  [DBEntity.Invite]: [
    'bot',
    'user',
    'members',
    { key: 'memberCount', value: 'members', count: true },
    {
      key: 'bot',
      value: 'bot',
      override: () => ({
        select: {
          id: true,
          name: true,
          channelName: true,
          channelId: true,
        }
      }),
    },
    {
      key: 'user',
      value: 'user',
      override: () => ({
        select: {
          id: true,
          name: true,
          email: true,
        }
      }),
    },
    {
      key: 'members',
      value: 'members',
      override: () => ({
        orderBy: {
          joinedAt: 'desc'
        },
        select: {
          id: true,
          telegramUserId: true,
          telegramUsername: true,
          firstName: true,
          lastName: true,
          joinedAt: true,
          isActive: true,
          isKicked: true,
          kickedAt: true,
        }
      }),
    },
  ],
  [DBEntity.Member]: [
    'invite',
    'bot',
    {
      key: 'invite',
      value: 'invite',
      override: () => ({
        select: {
          id: true,
          inviteLink: true,
          expiresAt: true,
          autoKickAfterHours: true,
        }
      }),
    },
    {
      key: 'bot',
      value: 'bot',
      override: () => ({
        select: {
          id: true,
          name: true,
          channelName: true,
          channelId: true,
        }
      }),
    },
  ],
  [DBEntity.Activity]: [
    'user',
    'bot',
    'invite',
    {
      key: 'user',
      value: 'user',
      override: () => ({
        select: {
          id: true,
          name: true,
          email: true,
        }
      }),
    },
    {
      key: 'bot',
      value: 'bot',
      override: () => ({
        select: {
          id: true,
          name: true,
          channelName: true,
        }
      }),
    },
    {
      key: 'invite',
      value: 'invite',
      override: () => ({
        select: {
          id: true,
          inviteLink: true,
        }
      }),
    },
  ],
}

export default EntityInclude
