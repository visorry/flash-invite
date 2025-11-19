// Plan Types
export enum PlanType {
  FREE = 0,
  BASIC = 1,
  PRO = 2,
  ENTERPRISE = 3,
}

// Plan Intervals
export enum PlanInterval {
  MONTHLY = 0,
  YEARLY = 1,
  LIFETIME = 2,
}

// Subscription Status
export enum SubscriptionStatus {
  ACTIVE = 0,
  CANCELLED = 1,
  EXPIRED = 2,
  PENDING = 3,
}

// Transaction Types
export enum TransactionType {
  PURCHASE = 0,
  REWARD = 1,
  REFUND = 2,
  INVITE_COST = 3,
  SUBSCRIPTION = 4,
}

// Transaction Status
export enum TransactionStatus {
  PENDING = 0,
  COMPLETED = 1,
  FAILED = 2,
  CANCELLED = 3,
}

// Token Actions (also used for invite duration types)
export enum TokenAction {
  INVITE_1_HOUR = 0,
  INVITE_3_HOURS = 1,
  INVITE_6_HOURS = 2,
  INVITE_12_HOURS = 3,
  INVITE_24_HOURS = 4,
  INVITE_3_DAYS = 5,
  INVITE_7_DAYS = 6,
  INVITE_30_DAYS = 7,
}

// Telegram Entity Types
export enum TelegramEntityType {
  GROUP = 0,
  SUPERGROUP = 1,
  CHANNEL = 2,
}

// Invite Link Status
export enum InviteLinkStatus {
  ACTIVE = 0,
  EXPIRED = 1,
  REVOKED = 2,
  LIMIT_REACHED = 3,
}

// Helper to get duration in seconds from TokenAction
export function getDurationSeconds(action: TokenAction): number {
  const durations: Record<TokenAction, number> = {
    [TokenAction.INVITE_1_HOUR]: 3600,
    [TokenAction.INVITE_3_HOURS]: 10800,
    [TokenAction.INVITE_6_HOURS]: 21600,
    [TokenAction.INVITE_12_HOURS]: 43200,
    [TokenAction.INVITE_24_HOURS]: 86400,
    [TokenAction.INVITE_3_DAYS]: 259200,
    [TokenAction.INVITE_7_DAYS]: 604800,
    [TokenAction.INVITE_30_DAYS]: 2592000,
  }
  return durations[action]
}

// Helper to get human-readable duration
export function getDurationLabel(action: TokenAction): string {
  const labels: Record<TokenAction, string> = {
    [TokenAction.INVITE_1_HOUR]: '1 Hour',
    [TokenAction.INVITE_3_HOURS]: '3 Hours',
    [TokenAction.INVITE_6_HOURS]: '6 Hours',
    [TokenAction.INVITE_12_HOURS]: '12 Hours',
    [TokenAction.INVITE_24_HOURS]: '24 Hours',
    [TokenAction.INVITE_3_DAYS]: '3 Days',
    [TokenAction.INVITE_7_DAYS]: '7 Days',
    [TokenAction.INVITE_30_DAYS]: '30 Days',
  }
  return labels[action]
}
