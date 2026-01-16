# Auto-Delete Delivered Content Feature

## Overview

Added the ability to automatically delete content that has been delivered to users after a configured time period. This creates time-limited access to content, similar to self-destructing messages.

## Feature Description

**Auto-Delete Delivered Content** automatically removes messages sent to users' private chats after a specified time period. This is separate from auto-deleting marketing posts.

### What Gets Deleted

**User's Private Chat**:
```
[User receives content via /start command]
Bot sends: [Video/Photo/Document with caption]
```
☝️ **These messages get deleted** after the configured time

**Marketing Group**:
```
Promotional post: "🔥 Get content: https://t.me/bot?start=token"
```
☝️ **Not affected** by this feature (has its own auto-delete setting)

## Use Cases

### 1. Time-Limited Content
**Scenario**: Offer 24-hour access to exclusive content
**Configuration**:
- `deleteDeliveredAfterEnabled`: true
- `deleteDeliveredInterval`: 24
- `deleteDeliveredIntervalUnit`: 2 (hours)

**Result**: Content disappears from user's chat after 24 hours

### 2. Flash Sales / Limited Offers
**Scenario**: Promotional content available for 1 hour only
**Configuration**:
- `deleteDeliveredAfterEnabled`: true
- `deleteDeliveredInterval`: 1
- `deleteDeliveredIntervalUnit`: 2 (hours)

**Result**: Creates urgency, content auto-deletes after 1 hour

### 3. Self-Destructing Messages
**Scenario**: Sensitive content that should not be stored
**Configuration**:
- `deleteDeliveredAfterEnabled`: true
- `deleteDeliveredInterval`: 5
- `deleteDeliveredIntervalUnit`: 1 (minutes)

**Result**: Content disappears quickly after viewing

### 4. Temporary Access
**Scenario**: Trial content for new subscribers
**Configuration**:
- `deleteDeliveredAfterEnabled`: true
- `deleteDeliveredInterval`: 7
- `deleteDeliveredIntervalUnit`: 3 (days)

**Result**: 7-day trial access, then content is removed

## Technical Implementation

### Database Changes

#### PromoterConfig Model
Added fields:
```prisma
deleteDeliveredAfterEnabled Boolean @default(false)
deleteDeliveredInterval     Int?
deleteDeliveredIntervalUnit Int?    // 0-5
```

#### PromoterDelivery Model
Added fields:
```prisma
deliveredMessageIds Int[]   // Array of message IDs sent to user
chatId              String? // User's chat ID for deletion
```

### Service Layer

#### Updated `deliverContent()`
- Tracks all message IDs sent to user
- Stores message IDs in `deliveredMessageIds` array
- Stores user's chat ID for later deletion
- Handles both copy mode and forward mode
- Tracks additional messages (modified captions, etc.)

**Message Tracking**:
```typescript
const deliveredMessageIds: number[] = []

// Send content and track message ID
const sentMessage = await sendPhoto(...)
deliveredMessageIds.push(sentMessage.message_id)

// Store in database
await db.promoterDelivery.create({
  data: {
    deliveredMessageIds,
    chatId: telegramUserId,
    ...
  }
})
```

#### New `deleteOldDeliveredContent()`
- Finds deliveries past their deletion time
- Deletes all tracked messages via Telegram API
- Clears message IDs from database
- Handles errors gracefully (message may already be deleted)
- Returns count of deleted messages

**Deletion Logic**:
```typescript
for (const messageId of delivery.deliveredMessageIds) {
  await bot.telegram.deleteMessage(delivery.chatId, messageId)
}

// Clear the message IDs
await db.promoterDelivery.update({
  data: { deliveredMessageIds: [] }
})
```

### Background Jobs

#### New Job: `processDeliveredContentDeletion()`
- File: `apps/server/src/jobs/promoter-expiration.ts`
- Runs every 5 minutes
- Calls `deleteOldDeliveredContent()` service method
- Logs deletion count

#### Scheduler Update
- Added delivered content deletion to scheduler
- Logs: "Delete old delivered content: Every 5 minutes"

### Validation

Added to schemas:
- `deleteDeliveredAfterEnabled` (boolean)
- `deleteDeliveredInterval` (number, min: 1)
- `deleteDeliveredIntervalUnit` (number, 0-5)

### Frontend UI

#### Create Page
New card: "Auto-Delete Delivered Content"
- Toggle switch to enable/disable
- Interval input (number)
- Unit selector (seconds, minutes, hours, days, months, never)
- Warning message: "⚠️ This will delete content from users' private chats. Use carefully!"

## Time Units

| Unit | Value | Description |
|------|-------|-------------|
| Seconds | 0 | For testing or very short access |
| Minutes | 1 | Short-term access (5-60 minutes) |
| Hours | 2 | Medium-term access (1-24 hours) |
| Days | 3 | Long-term access (1-30 days) |
| Months | 4 | Extended access (30-day periods) |
| Never | 5 | Permanent access (no deletion) |

## Example Timeline

**Day 1, 10:00 AM**:
- You post video to Vault Group
- Bot creates marketing post with deep link

**Day 1, 2:00 PM**:
- User clicks link, presses Start
- Bot sends video to user's private chat
- Delivery record created with message IDs

**Day 2, 2:00 PM** (24 hours later, if auto-delete = 24 hours):
- Background job runs
- Bot deletes video from user's chat ✅
- Message IDs cleared from database ✅
- User can no longer access the content ✅

## Important Notes

### ⚠️ User Experience Considerations

1. **No Warning**: Users don't get notified before deletion
2. **Permanent**: Once deleted, content cannot be recovered
3. **All Messages**: Deletes all messages sent during delivery (media + captions)
4. **Silent**: Deletion happens in background, user may not notice immediately

### 💡 Best Practices

1. **Set Reasonable Times**: Don't make it too short (users need time to view)
2. **Communicate Clearly**: Tell users in marketing post that access is time-limited
3. **Test First**: Use longer intervals initially, adjust based on feedback
4. **Consider Time Zones**: Users in different time zones may have different viewing times

### 🔒 Privacy & Security

1. **Cannot Delete Downloaded Content**: If user downloads/saves media, you can't delete that
2. **Screenshots**: Users can screenshot before deletion
3. **Forwarded Messages**: If user forwards to another chat, those won't be deleted
4. **Bot Limitations**: Bot can only delete messages it sent

## Comparison with Marketing Post Auto-Delete

| Feature | Marketing Post Delete | Delivered Content Delete |
|---------|----------------------|--------------------------|
| **What** | Promotional posts in marketing group | Content sent to users |
| **Where** | Public marketing channel | Private user chats |
| **Purpose** | Keep channel clean | Time-limited access |
| **Impact** | Low (just promotions) | High (actual content) |
| **Reversible** | No | No |
| **User Notice** | May notice | May not notice |

## Configuration Examples

### Example 1: 24-Hour Flash Content
```typescript
{
  deleteDeliveredAfterEnabled: true,
  deleteDeliveredInterval: 24,
  deleteDeliveredIntervalUnit: 2, // hours
}
```

### Example 2: 5-Minute Preview
```typescript
{
  deleteDeliveredAfterEnabled: true,
  deleteDeliveredInterval: 5,
  deleteDeliveredIntervalUnit: 1, // minutes
}
```

### Example 3: 7-Day Trial
```typescript
{
  deleteDeliveredAfterEnabled: true,
  deleteDeliveredInterval: 7,
  deleteDeliveredIntervalUnit: 3, // days
}
```

### Example 4: Permanent Access
```typescript
{
  deleteDeliveredAfterEnabled: false,
  // or
  deleteDeliveredIntervalUnit: 5, // never
}
```

## Migration

- Migration: `20260116161125_add_auto_delete_delivered_content`
- Status: Applied successfully
- Backward Compatible: Yes (default is disabled)

## Files Modified

### Backend
- `packages/db/prisma/schema/schema.prisma`
- `apps/server/src/services/promoter.service.ts`
- `apps/server/src/validation/promoter.validation.ts`
- `apps/server/src/jobs/promoter-expiration.ts`
- `apps/server/src/jobs/scheduler.ts`

### Frontend
- `apps/web/src/app/dashboard/promoter/create/page.tsx`
- `apps/web/src/lib/api-client.ts`

### Database
- New migration: `20260116161125_add_auto_delete_delivered_content`

## Testing Recommendations

1. **Short Interval Test**: Set 1-minute deletion, verify it works
2. **Multiple Messages**: Test with content that sends multiple messages
3. **Error Handling**: Test when message is already deleted manually
4. **Copy vs Forward**: Test both delivery modes
5. **User Experience**: Verify user doesn't see errors when content is deleted

## Future Enhancements

1. **Deletion Warning**: Send warning message before deletion
2. **Extend Access**: Allow users to request more time
3. **View Count**: Track how many times user viewed before deletion
4. **Selective Deletion**: Delete only media, keep caption
5. **Deletion Notification**: Notify user when content is deleted

## Summary

Auto-Delete Delivered Content adds powerful time-limited access control to Promoter 2.0. Combined with marketing post auto-delete, you now have complete control over content lifecycle:

- **Marketing Posts**: Auto-delete to keep channel clean
- **Delivered Content**: Auto-delete to create urgency and time-limited access

This makes Promoter 2.0 perfect for flash sales, limited offers, trial content, and any scenario where temporary access is desired! 🚀
