# Error Handling and Token Expiration Implementation

## Overview
This document summarizes the implementation of error handling (Tasks 13.1, 13.3, 13.5, 13.7) and token expiration (Tasks 16.1, 16.2) for the Promoter 2.0 feature.

## Implemented Tasks

### Task 13.1: Vault Access Error Handling ✅
**Location:** `apps/server/src/services/promoter.service.ts` - `capturePost()` method

**Implementation:**
- Added vault access check using `botInstance.bot.telegram.getChat(chatId)`
- Detects when bot cannot access vault group
- Marks configuration as inactive when access is lost
- Logs error for monitoring with `[PROMOTER_ERROR]` prefix
- Gracefully handles database update errors

**Error Detection:**
- Bot instance not found
- Telegram API errors (403, chat not found, bot kicked)
- Network errors

**Requirements Satisfied:** 9.1

---

### Task 13.3: Marketing Group Access Error Handling ✅
**Location:** `apps/server/src/services/promoter.service.ts` - `createMarketingPost()` method

**Implementation:**
- Wrapped marketing post sending in try-catch block
- Detects access errors (403, bot kicked, not enough rights, chat not found)
- Logs detailed error messages for monitoring
- Re-throws error to allow caller to handle (enables retry logic)

**Error Detection:**
- `error.response?.error_code === 403`
- Bot was kicked from group
- Insufficient permissions
- Chat not found

**Requirements Satisfied:** 9.2

---

### Task 13.5: Delivery Retry on Network Errors ✅
**Location:** `apps/server/src/services/promoter.service.ts` - `retryWithBackoff()` function

**Implementation:**
- Enhanced `retryWithBackoff()` to specifically detect network errors
- Added network error codes: ECONNRESET, ETIMEDOUT, ENOTFOUND, ECONNREFUSED
- Retries up to 3 times with exponential backoff
- Logs network errors with `[PROMOTER_NETWORK_ERROR]` prefix
- Separate logging for network errors vs rate limit errors

**Network Error Detection:**
- `error.code === 'ECONNRESET'`
- `error.code === 'ETIMEDOUT'`
- `error.code === 'ENOTFOUND'`
- `error.code === 'ECONNREFUSED'`
- `error.message?.includes('network')`
- `error.message?.includes('timeout')`

**Backoff Strategy:**
- Attempt 1: 1 second delay
- Attempt 2: 2 second delay
- Attempt 3: 4 second delay

**Requirements Satisfied:** 9.3

---

### Task 13.7: Admin Permission Detection ✅
**Location:** `apps/server/src/services/promoter.service.ts` - `checkAdminPermissions()` method

**Implementation:**
- New method that checks bot admin status for all active configurations
- Checks both vault and marketing groups
- Uses `getChatMember()` to verify admin status
- Marks configurations as inactive when permissions are lost
- Returns detailed results including which configurations lost permissions

**Scheduled Execution:**
- Added to `apps/server/src/jobs/promoter-expiration.ts` as `processAdminPermissionCheck()`
- Runs every 6 hours via scheduler
- Runs on startup (after 20 seconds)

**Return Value:**
```typescript
{
  checked: number,
  permissionLost: Array<{
    configId: string,
    configName: string,
    groupType: 'vault' | 'marketing',
    groupName: string
  }>
}
```

**Requirements Satisfied:** 9.5

---

### Task 16.1: Create expireOldTokens() Method ✅
**Location:** `apps/server/src/services/promoter.service.ts` - `expireOldTokens()` method

**Implementation:**
- Queries for posts with `expiresAt <= now` and `isExpired = false`
- Marks all expired posts as expired using `updateMany()`
- Returns count of expired tokens
- Logs results for monitoring

**Query Logic:**
```typescript
where: {
  isExpired: false,
  expiresAt: {
    lte: now,
  },
}
```

**Requirements Satisfied:** 4.6

---

### Task 16.2: Create Scheduled Job to Run Expiration ✅
**Location:** 
- `apps/server/src/jobs/promoter-expiration.ts` - Job implementation
- `apps/server/src/jobs/scheduler.ts` - Job scheduling

**Implementation:**
- Created `processTokenExpiration()` job function
- Calls `promoterService.expireOldTokens()`
- Logs results with `[PROMOTER_EXPIRATION_JOB]` prefix
- Handles errors gracefully

**Scheduling:**
- Runs every 1 hour via `setInterval()`
- Runs on startup (after 15 seconds)
- Added to global scheduler intervals for cleanup on shutdown

**Requirements Satisfied:** 4.6

---

## Scheduler Configuration

### New Jobs Added to `apps/server/src/jobs/scheduler.ts`:

1. **Token Expiration Job**
   - Interval: Every 1 hour (60 * 60 * 1000 ms)
   - Initial run: 15 seconds after startup
   - Function: `processTokenExpiration()`

2. **Admin Permission Check Job**
   - Interval: Every 6 hours (6 * 60 * 60 * 1000 ms)
   - Initial run: 20 seconds after startup
   - Function: `processAdminPermissionCheck()`

### Scheduler Output:
```
✅ Job scheduler initialized
  - Kick expired members: Every 1 minute
  - Send expiry warnings: Every 5 minutes
  - Cleanup old invite links: Every 24 hours
  - Process scheduled forwards: Every 1 minute
  - Check expired subscriptions: Every 1 hour
  - Process auto-approvals: Every 1 minute
  - Expire promoter tokens: Every 1 hour
  - Check promoter admin permissions: Every 6 hours
```

---

## Error Logging Conventions

All error handling follows consistent logging patterns:

- `[PROMOTER_ERROR]` - General errors
- `[PROMOTER_NETWORK_ERROR]` - Network-specific errors
- `[PROMOTER_RATE_LIMIT]` - Rate limit errors
- `[PROMOTER_ADMIN_CHECK]` - Admin permission check logs
- `[PROMOTER_EXPIRATION]` - Token expiration logs
- `[PROMOTER_EXPIRATION_JOB]` - Scheduled expiration job logs
- `[PROMOTER_ADMIN_CHECK_JOB]` - Scheduled admin check job logs

---

## Testing Recommendations

### Manual Testing:
1. **Vault Access Error (13.1):**
   - Remove bot from vault group
   - Send message to vault group
   - Verify config is marked inactive
   - Check logs for error message

2. **Marketing Group Access Error (13.3):**
   - Remove bot from marketing group
   - Capture post in vault
   - Verify error is logged
   - Verify retry logic is triggered

3. **Network Error Retry (13.5):**
   - Simulate network failure (disconnect internet)
   - Attempt content delivery
   - Verify 3 retry attempts with exponential backoff
   - Check logs for network error messages

4. **Admin Permission Detection (13.7):**
   - Demote bot from admin to member in vault/marketing group
   - Wait for scheduled job to run (or trigger manually)
   - Verify config is marked inactive
   - Check logs for permission loss notification

5. **Token Expiration (16.1, 16.2):**
   - Create post with expiration enabled (1 day)
   - Manually update `expiresAt` to past date
   - Wait for scheduled job to run (or trigger manually)
   - Verify token is marked as expired
   - Attempt delivery with expired token
   - Verify expired token error message is sent

### Property-Based Testing:
- Property tests are marked as optional in the task list
- Can be implemented later for comprehensive coverage

---

## Future Enhancements

1. **User Notifications:**
   - Currently logs permission loss but doesn't notify users
   - TODO: Implement notification system (email, Telegram message, web app notification)

2. **Retry Queue:**
   - Marketing post errors are logged but not queued for retry
   - Could implement a retry queue with exponential backoff

3. **Metrics:**
   - Add metrics collection for error rates
   - Track permission loss frequency
   - Monitor token expiration patterns

4. **Health Checks:**
   - Periodic health checks for all active configurations
   - Proactive detection of issues before they affect users

---

## Files Modified

1. `apps/server/src/services/promoter.service.ts`
   - Added vault access error handling in `capturePost()`
   - Added marketing group error handling in `createMarketingPost()`
   - Enhanced `retryWithBackoff()` with network error detection
   - Added `checkAdminPermissions()` method
   - Added `expireOldTokens()` method

2. `apps/server/src/jobs/promoter-expiration.ts` (NEW)
   - Created `processTokenExpiration()` job
   - Created `processAdminPermissionCheck()` job

3. `apps/server/src/jobs/scheduler.ts`
   - Added imports for promoter jobs
   - Added token expiration interval (every 1 hour)
   - Added admin check interval (every 6 hours)
   - Added startup triggers for both jobs
   - Updated scheduler intervals map
   - Updated console output

---

## Completion Status

✅ Task 13.1: Add vault access error handling - COMPLETED
✅ Task 13.3: Add marketing group access error handling - COMPLETED
✅ Task 13.5: Add delivery retry on network errors - COMPLETED
✅ Task 13.7: Add admin permission detection - COMPLETED
✅ Task 16.1: Create expireOldTokens() method - COMPLETED
✅ Task 16.2: Create scheduled job to run expiration - COMPLETED

All tasks have been successfully implemented and are ready for testing.
