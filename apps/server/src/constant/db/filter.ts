import type { DBEntityFilterOption } from '../../types/db'
import DBEntity from './entity'

// Helper formatters
// const parseNumber = (value: string): number => parseInt(value, 10)
const parseBoolean = (value: string): boolean => value === 'true'

const EntityFilter: DBEntityFilterOption = {
  [DBEntity.User]: {
    search: {
      search: ['name', 'email'],
    },
    id: {
      key: 'id',
    },
    name: {
      options: {
        path: 'contains',
        filter: {
          mode: 'insensitive',
        },
      },
    },
    email: {
      options: {
        path: 'contains',
        filter: {
          mode: 'insensitive',
        },
      },
    },
  },
  [DBEntity.Bot]: {
    search: {
      search: ['name', 'channelName'],
    },
    id: {
      key: 'id',
    },
    name: {
      options: {
        path: 'contains',
        filter: {
          mode: 'insensitive',
        },
      },
    },
    channelName: {
      options: {
        path: 'contains',
        filter: {
          mode: 'insensitive',
        },
      },
    },
    channelId: {
      key: 'channelId',
    },
    userId: {
      key: 'userId',
    },
    isActive: {
      formatter: parseBoolean,
    },
  },
  [DBEntity.Invite]: {
    search: {
      search: ['inviteLink'],
    },
    id: {
      key: 'id',
    },
    botId: {
      key: 'botId',
    },
    userId: {
      key: 'userId',
    },
    isActive: {
      formatter: parseBoolean,
    },
    isExpired: {
      formatter: parseBoolean,
    },
  },
  [DBEntity.Member]: {
    search: {
      search: ['telegramUsername', 'firstName', 'lastName'],
    },
    id: {
      key: 'id',
    },
    inviteId: {
      key: 'inviteId',
    },
    botId: {
      key: 'botId',
    },
    telegramUserId: {
      key: 'telegramUserId',
    },
    isActive: {
      formatter: parseBoolean,
    },
    isKicked: {
      formatter: parseBoolean,
    },
  },
  [DBEntity.Activity]: {
    search: {
      search: ['action', 'description'],
    },
    id: {
      key: 'id',
    },
    userId: {
      key: 'userId',
    },
    botId: {
      key: 'botId',
    },
    inviteId: {
      key: 'inviteId',
    },
    action: {
      options: {
        path: 'contains',
        filter: {
          mode: 'insensitive',
        },
      },
    },
  },
}

export default EntityFilter
