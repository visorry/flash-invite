export const DBEntity = {
  User: 'User',
  Bot: 'Bot',
  Invite: 'Invite',
  Member: 'Member',
  Activity: 'Activity',
} as const

export default DBEntity
export type DBEntityKey = keyof typeof DBEntity
export type DBEntityType = typeof DBEntity[DBEntityKey]
