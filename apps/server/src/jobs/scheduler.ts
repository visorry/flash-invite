import { kickExpiredMembers, cleanupOldInvites, sendExpiryWarnings } from './kick-expired-members'

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduler() {
  console.log('🕐 Initializing job scheduler...')

  // Kick expired members every minute
  const kickInterval = setInterval(async () => {
    console.log('[SCHEDULER] Running kick expired members job...')
    try {
      await kickExpiredMembers()
    } catch (error) {
      console.error('[SCHEDULER] Error in kick job:', error)
    }
  }, 60 * 1000) // Every 1 minute

  // Send expiry warnings every 5 minutes
  const warningInterval = setInterval(async () => {
    console.log('[SCHEDULER] Running expiry warnings job...')
    try {
      await sendExpiryWarnings()
    } catch (error) {
      console.error('[SCHEDULER] Error in warning job:', error)
    }
  }, 5 * 60 * 1000) // Every 5 minutes

  // Cleanup old invite links once per day
  const cleanupInterval = setInterval(async () => {
    console.log('[SCHEDULER] Running cleanup job...')
    try {
      await cleanupOldInvites()
    } catch (error) {
      console.error('[SCHEDULER] Error in cleanup job:', error)
    }
  }, 24 * 60 * 60 * 1000) // Every 24 hours

  // Run kick job immediately on startup
  console.log('[SCHEDULER] Running initial kick job in 5 seconds...')
  setTimeout(() => {
    console.log('[SCHEDULER] Executing initial kick job now...')
    kickExpiredMembers().catch((error) => {
      console.error('[SCHEDULER] Error in initial kick job:', error)
    })
  }, 5000) // Wait 5 seconds after startup

  // Store intervals for cleanup on shutdown
  ;(global as any).schedulerIntervals = {
    kick: kickInterval,
    warning: warningInterval,
    cleanup: cleanupInterval,
  }

  console.log('✅ Job scheduler initialized')
  console.log('  - Kick expired members: Every 1 minute')
  console.log('  - Send expiry warnings: Every 5 minutes')
  console.log('  - Cleanup old invite links: Every 24 hours')
  console.log('  - GroupMember records: Kept permanently for analytics')
}
