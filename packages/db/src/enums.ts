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

// Duration units for token pricing
export enum DurationUnit {
  MINUTE = 0,
  HOUR = 1,
  DAY = 2,
  MONTH = 3,
  YEAR = 4,
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

// Broadcast Status
export enum BroadcastStatus {
  PENDING = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  FAILED = 3,
  CANCELLED = 4,
}

// Helper to get duration unit label
export function getDurationUnitLabel(unit: DurationUnit): string {
  const labels: Record<DurationUnit, string> = {
    [DurationUnit.MINUTE]: 'Minute',
    [DurationUnit.HOUR]: 'Hour',
    [DurationUnit.DAY]: 'Day',
    [DurationUnit.MONTH]: 'Month',
    [DurationUnit.YEAR]: 'Year',
  }
  return labels[unit]
}

// Helper to get seconds per duration unit
export function getSecondsPerUnit(unit: DurationUnit): number {
  const seconds: Record<DurationUnit, number> = {
    [DurationUnit.MINUTE]: 60,
    [DurationUnit.HOUR]: 3600,
    [DurationUnit.DAY]: 86400,
    [DurationUnit.MONTH]: 2592000, // 30 days
    [DurationUnit.YEAR]: 31536000, // 365 days
  }
  return seconds[unit]
}
