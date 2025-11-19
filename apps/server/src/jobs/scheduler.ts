import { kickExpiredMembers, cleanupOldInvites, sendExpiryWarnings } from './kick-expired-members'

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduler() {
  console.log('🕐 Initializing job scheduler...')

  // Kick expired members every minute
  setInterval(async () => {
    try {
      await kickExpiredMembers()
    } catch (error) {
      console.error('Error in kick job:', error)
    }
  }, 60 * 1000) // Every 1 minute

  // Send expiry warnings every 5 minutes
  setInterval(async () => {
    try {
      await sendExpiryWarnings()
    } catch (error) {
      console.error('Error in warning job:', error)
    }
  }, 5 * 60 * 1000) // Every 5 minutes

  // Cleanup old invite links once per day
  setInterval(async () => {
    try {
      await cleanupOldInvites()
    } catch (error) {
      console.error('Error in cleanup job:', error)
    }
  }, 24 * 60 * 60 * 1000) // Every 24 hours

  // Run kick job immediately on startup
  setTimeout(() => {
    kickExpiredMembers().catch(console.error)
  }, 5000) // Wait 5 seconds after startup

  console.log('✅ Job scheduler initialized')
  console.log('  - Kick expired members: Every 1 minute')
  console.log('  - Send expiry warnings: Every 5 minutes')
  console.log('  - Cleanup old invite links: Every 24 hours')
  console.log('  - GroupMember records: Kept permanently for analytics')
}
