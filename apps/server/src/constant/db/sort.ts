import type { DBEntitySortOption } from '../../types/db'
import DBEntity from './entity'

const EntitySort: DBEntitySortOption = {
  [DBEntity.User]: ['name', 'email', 'createdAt', 'updatedAt'],
  [DBEntity.Bot]: ['name', 'channelName', 'createdAt', 'updatedAt'],
  [DBEntity.Invite]: ['createdAt', 'expiresAt', 'usedCount'],
  [DBEntity.Member]: ['joinedAt', 'firstName', 'lastName'],
  [DBEntity.Activity]: ['createdAt', 'action'],
}

export default EntitySort
