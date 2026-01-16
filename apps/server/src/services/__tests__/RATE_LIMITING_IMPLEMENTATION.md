# Rate Limiting and Retry Logic Implementation

## Tasks Completed

### Task 9.1: Create rate limiter utility ✅
- **Status**: Complete
- **Requirements**: 6.1, 6.2, 6.7

### Task 9.3: Implement retry with exponential backoff ✅
- **Status**: Complete
- **Requirements**: 6.3, 6.4, 6.5, 6.6

## Implementation Details

### Rate Limiting Utilities

The rate limiting functionality was already partially implemented in `promoter.service.ts`. The following utilities exist:

#### 1. Marketing Post Rate Limiter
```typescript
const botMarketingTimestamps = new Map<string, number>()
const MIN_MARKETING_DELAY_MS = 3000 // 3 seconds between marketing posts

async function waitForMarketingRateLimit(botId: string): Promise<void>
```
- **Purpose**: Enforces a minimum 3-second delay between marketing posts per bot
- **Requirement**: 6.1, 6.7
- **Implementation**: Tracks last send time per bot using a Map, waits if necessary

#### 2. Delivery Rate Limiter
```typescript
const botDeliveryTimestamps = new Map<string, number>()
const MIN_DELIVERY_DELAY_MS = 1000 // 1 second between deliveries

async function waitForDeliveryRateLimit(botId: string): Promise<void>
```
- **Purpose**: Enforces a minimum 1-second delay between content deliveries per bot
- **Requirement**: 6.2, 6.7
- **Implementation**: Tracks last send time per bot using a Map, waits if necessary

### Retry Logic with Exponential Backoff

A new utility function was added to handle retries with exponential backoff:

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  botId: string,
  operationName: string,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T>
```

#### Features:
1. **Telegram 429 Detection** (Requirement 6.3)
   - Detects rate limit errors from multiple sources:
     - `error.response?.error_code === 429`
     - `error.code === 429`
     - `error.message?.includes('Too Many Requests')`
     - `error.message?.includes('429')`

2. **Respect retry_after Parameter** (Requirement 6.4)
   - Extracts `retry_after` from Telegram's error response
   - Falls back to `attempt * 5` seconds if not provided
   - Waits the specified time before retrying

3. **Exponential Backoff** (Requirement 6.5)
   - For non-rate-limit errors, uses exponential backoff
   - Formula: `baseDelayMs * Math.pow(2, attempt - 1)`
   - Default base delay: 1000ms
   - Retry delays: 1s, 2s, 4s

4. **Retry Limit**
   - Maximum 3 retry attempts (configurable)
   - Throws the last error after max retries

5. **Logging** (Requirement 6.6)
   - Logs rate limit events with details
   - Logs retry attempts with wait times
   - Logs final failure after max retries

### Integration Points

The retry logic is integrated into:

#### 1. Marketing Post Creation
```typescript
const sentMessage = await retryWithBackoff(
  () => botInstance.bot.telegram.sendMessage(marketingChatId, messageText),
  config.botId,
  'createMarketingPost'
)
```

#### 2. Content Delivery (Photo)
```typescript
await retryWithBackoff(
  () => botInstance.bot.telegram.sendPhoto(telegramUserId, post.fileId, { caption }),
  botId,
  'deliverPhoto'
)
```

#### 3. Content Delivery (Video)
```typescript
await retryWithBackoff(
  () => botInstance.bot.telegram.sendVideo(telegramUserId, post.fileId, { caption }),
  botId,
  'deliverVideo'
)
```

#### 4. Content Delivery (Document)
```typescript
await retryWithBackoff(
  () => botInstance.bot.telegram.sendDocument(telegramUserId, post.fileId, { caption }),
  botId,
  'deliverDocument'
)
```

## Requirements Coverage

| Requirement | Description | Status |
|-------------|-------------|--------|
| 6.1 | Enforce 3-second delay between marketing posts | ✅ Complete |
| 6.2 | Enforce 1-second delay between deliveries | ✅ Complete |
| 6.3 | Detect Telegram 429 errors | ✅ Complete |
| 6.4 | Respect retry_after parameter | ✅ Complete |
| 6.5 | Retry up to 3 times with exponential backoff | ✅ Complete |
| 6.6 | Log rate limit events | ✅ Complete |
| 6.7 | Track last send time per bot | ✅ Complete |

## Error Handling

### Rate Limit Errors (429)
- Detected from multiple error sources
- Respects Telegram's `retry_after` parameter
- Logs with `[PROMOTER_RATE_LIMIT]` prefix
- Retries up to 3 times

### Other Errors
- Uses exponential backoff
- Logs with `[PROMOTER_ERROR]` prefix
- Retries up to 3 times
- Throws error after max retries

## Testing Notes

The existing unit tests in `promoter-delivery.test.ts` need a database connection to run. The tests are structured correctly but require:
- `DATABASE_URL` environment variable to be set
- Database to be accessible
- Test data setup in `beforeEach` hooks

The implementation is type-safe and follows TypeScript best practices.

## Next Steps

The following optional property-based tests can be implemented:
- Task 9.2: Property test for rate limit timestamp tracking (Property 19)
- Task 9.4: Property test for rate limit retry (Property 18)

These tests would validate:
- Timestamps are updated after each send operation
- Retry logic correctly handles 429 errors with backoff
- Multiple retries respect the exponential backoff pattern
