import promoterService from '../services/promoter.service'

/**
 * Process token expiration for promoter posts
 * This job runs every hour and marks expired tokens as expired
 * Requirements: 4.6
 */
export async function processTokenExpiration() {
  try {
    console.log('[PROMOTER_EXPIRATION_JOB] Starting token expiration job')
    
    const expiredCount = await promoterService.expireOldTokens()
    
    if (expiredCount > 0) {
      console.log(`[PROMOTER_EXPIRATION_JOB] Successfully expired ${expiredCount} tokens`)
    } else {
      console.log('[PROMOTER_EXPIRATION_JOB] No tokens expired')
    }
  } catch (error: any) {
    console.error('[PROMOTER_EXPIRATION_JOB] Error processing token expiration:', error.message)
  }
}

/**
 * Process deletion of old marketing posts
 * This job runs every 5 minutes and deletes marketing posts that have passed their deletion time
 */
export async function processMarketingPostDeletion() {
  try {
    console.log('[PROMOTER_DELETION_JOB] Starting marketing post deletion job')
    
    const deletedCount = await promoterService.deleteOldMarketingPosts()
    
    if (deletedCount > 0) {
      console.log(`[PROMOTER_DELETION_JOB] Successfully deleted ${deletedCount} marketing posts`)
    }
  } catch (error: any) {
    console.error('[PROMOTER_DELETION_JOB] Error deleting marketing posts:', error.message)
  }
}

/**
 * Process deletion of old delivered content
 * This job runs every 5 minutes and deletes content sent to users that has passed their deletion time
 */
export async function processDeliveredContentDeletion() {
  try {
    console.log('[PROMOTER_DELIVERED_DELETION_JOB] Starting delivered content deletion job')
    
    const deletedCount = await promoterService.deleteOldDeliveredContent()
    
    if (deletedCount > 0) {
      console.log(`[PROMOTER_DELIVERED_DELETION_JOB] Successfully deleted ${deletedCount} delivered messages`)
    }
  } catch (error: any) {
    console.error('[PROMOTER_DELIVERED_DELETION_JOB] Error deleting delivered content:', error.message)
  }
}

/**
 * Process admin permission checks for promoter configurations
 * This job runs periodically to detect when bots lose admin permissions
 * Requirements: 9.5
 */
export async function processAdminPermissionCheck() {
  try {
    console.log('[PROMOTER_ADMIN_CHECK_JOB] Starting admin permission check job')
    
    const results = await promoterService.checkAdminPermissions()
    
    if (results.permissionLost.length > 0) {
      console.warn(
        `[PROMOTER_ADMIN_CHECK_JOB] Found ${results.permissionLost.length} configurations with lost permissions:`,
        results.permissionLost
      )
      
      // TODO: Notify users about lost permissions
      // This could be implemented by sending a notification through the web app
      // or by sending a message to the user via Telegram
    } else {
      console.log(`[PROMOTER_ADMIN_CHECK_JOB] All ${results.checked} configurations have valid permissions`)
    }
  } catch (error: any) {
    console.error('[PROMOTER_ADMIN_CHECK_JOB] Error checking admin permissions:', error.message)
  }
}
