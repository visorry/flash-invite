import { BadRequestError } from '../errors/http-exception'

/**
 * In-memory cooldown tracker for on-demand auto-drop requests
 * Structure: Map<ruleId_userId, timestamp>
 */
const cooldowns = new Map<string, number>()

/**
 * Generate cooldown key for rule and user combination
 */
function getCooldownKey(ruleId: string, userId: string): string {
  return `${ruleId}_${userId}`
}

/**
 * Check if user can make a request (not in cooldown)
 * If allowed, sets the cooldown timestamp
 * @returns remaining cooldown seconds, or 0 if allowed
 */
export function checkAndSetCooldown(
  ruleId: string,
  userId: string,
  cooldownSeconds: number
): number {
  const key = getCooldownKey(ruleId, userId)
  const now = Date.now()
  const lastUsed = cooldowns.get(key)

  if (lastUsed) {
    const elapsed = (now - lastUsed) / 1000 // convert to seconds
    const remaining = cooldownSeconds - elapsed

    if (remaining > 0) {
      return Math.ceil(remaining)
    }
  }

  // Set cooldown
  cooldowns.set(key, now)
  return 0
}

/**
 * Get remaining cooldown time for a user
 * @returns remaining seconds, or 0 if no cooldown
 */
export function getRemainingCooldown(
  ruleId: string,
  userId: string,
  cooldownSeconds: number
): number {
  const key = getCooldownKey(ruleId, userId)
  const lastUsed = cooldowns.get(key)

  if (!lastUsed) {
    return 0
  }

  const now = Date.now()
  const elapsed = (now - lastUsed) / 1000
  const remaining = cooldownSeconds - elapsed

  return remaining > 0 ? Math.ceil(remaining) : 0
}

/**
 * Clear cooldown for a specific user (useful for testing or admin overrides)
 */
export function clearCooldown(ruleId: string, userId: string): void {
  const key = getCooldownKey(ruleId, userId)
  cooldowns.delete(key)
}

/**
 * Clear all cooldowns (useful for cleanup or testing)
 */
export function clearAllCooldowns(): void {
  cooldowns.clear()
}

export default {
  checkAndSetCooldown,
  getRemainingCooldown,
  clearCooldown,
  clearAllCooldowns,
}
