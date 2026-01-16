import { kickExpiredMembers, cleanupOldInvites, sendExpiryWarnings } from './kick-expired-members'
import { processScheduledForwards } from './forward-scheduler'
import { checkExpiredSubscriptions } from './subscription-expiry.job'
import { processTokenExpiration, processAdminPermissionCheck, processMarketingPostDeletion, processDeliveredContentDeletion } from './promoter-expiration'
import autoApprovalService from '../services/auto-approval.service'

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

  // Process scheduled forwards every minute
  const forwardInterval = setInterval(async () => {
    try {
      await processScheduledForwards()
    } catch (error) {
      console.error('[SCHEDULER] Error in forward scheduler job:', error)
    }
  }, 60 * 1000) // Every 1 minute

  // Check expired subscriptions every hour
  const subscriptionExpiryInterval = setInterval(async () => {
    console.log('[SCHEDULER] Running subscription expiry check...')
    try {
      await checkExpiredSubscriptions()
    } catch (error) {
      console.error('[SCHEDULER] Error in subscription expiry job:', error)
    }
  }, 60 * 60 * 1000) // Every 1 hour

  // Process scheduled auto-approvals every minute
  const autoApprovalInterval = setInterval(async () => {
    try {
      await autoApprovalService.processScheduledApprovals()
    } catch (error) {
      console.error('[SCHEDULER] Error in auto-approval job:', error)
    }
  }, 60 * 1000) // Every 1 minute

  // Process promoter token expiration every hour
  const promoterExpirationInterval = setInterval(async () => {
    console.log('[SCHEDULER] Running promoter token expiration job...')
    try {
      await processTokenExpiration()
    } catch (error) {
      console.error('[SCHEDULER] Error in promoter expiration job:', error)
    }
  }, 60 * 60 * 1000) // Every 1 hour

  // Check promoter admin permissions every 6 hours
  const promoterAdminCheckInterval = setInterval(async () => {
    console.log('[SCHEDULER] Running promoter admin permission check...')
    try {
      await processAdminPermissionCheck()
    } catch (error) {
      console.error('[SCHEDULER] Error in promoter admin check job:', error)
    }
  }, 6 * 60 * 60 * 1000) // Every 6 hours

  // Delete old marketing posts every 5 minutes
  const marketingPostDeletionInterval = setInterval(async () => {
    try {
      await processMarketingPostDeletion()
    } catch (error) {
      console.error('[SCHEDULER] Error in marketing post deletion job:', error)
    }
  }, 5 * 60 * 1000) // Every 5 minutes

  // Delete old delivered content every 5 minutes
  const deliveredContentDeletionInterval = setInterval(async () => {
    try {
      await processDeliveredContentDeletion()
    } catch (error) {
      console.error('[SCHEDULER] Error in delivered content deletion job:', error)
    }
  }, 5 * 60 * 1000) // Every 5 minutes

  // Run kick job immediately on startup
  console.log('[SCHEDULER] Running initial kick job in 5 seconds...')
  setTimeout(() => {
    console.log('[SCHEDULER] Executing initial kick job now...')
    kickExpiredMembers().catch((error) => {
      console.error('[SCHEDULER] Error in initial kick job:', error)
    })
  }, 5000) // Wait 5 seconds after startup

  // Run subscription expiry check on startup (after 10 seconds)
  setTimeout(() => {
    console.log('[SCHEDULER] Running initial subscription expiry check...')
    checkExpiredSubscriptions().catch((error) => {
      console.error('[SCHEDULER] Error in initial subscription expiry check:', error)
    })
  }, 10000)

  // Run promoter token expiration on startup (after 15 seconds)
  setTimeout(() => {
    console.log('[SCHEDULER] Running initial promoter token expiration...')
    processTokenExpiration().catch((error) => {
      console.error('[SCHEDULER] Error in initial promoter expiration:', error)
    })
  }, 15000)

  // Run promoter admin check on startup (after 20 seconds)
  setTimeout(() => {
    console.log('[SCHEDULER] Running initial promoter admin permission check...')
    processAdminPermissionCheck().catch((error) => {
      console.error('[SCHEDULER] Error in initial promoter admin check:', error)
    })
  }, 20000)

    // Store intervals for cleanup on shutdown
    ; (global as any).schedulerIntervals = {
      kick: kickInterval,
      warning: warningInterval,
      cleanup: cleanupInterval,
      forward: forwardInterval,
      subscriptionExpiry: subscriptionExpiryInterval,
      autoApproval: autoApprovalInterval,
      promoterExpiration: promoterExpirationInterval,
      promoterAdminCheck: promoterAdminCheckInterval,
      marketingPostDeletion: marketingPostDeletionInterval,
      deliveredContentDeletion: deliveredContentDeletionInterval,
    }

  console.log('✅ Job scheduler initialized')
  console.log('  - Kick expired members: Every 1 minute')
  console.log('  - Send expiry warnings: Every 5 minutes')
  console.log('  - Cleanup old invite links: Every 24 hours')
  console.log('  - Process scheduled forwards: Every 1 minute')
  console.log('  - Check expired subscriptions: Every 1 hour')
  console.log('  - Process auto-approvals: Every 1 minute')
  console.log('  - Expire promoter tokens: Every 1 hour')
  console.log('  - Check promoter admin permissions: Every 6 hours')
  console.log('  - Delete old marketing posts: Every 5 minutes')
  console.log('  - Delete old delivered content: Every 5 minutes')
  console.log('  - GroupMember records: Kept permanently for analytics')
}
