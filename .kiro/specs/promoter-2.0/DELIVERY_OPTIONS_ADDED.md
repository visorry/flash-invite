# Promoter 2.0 - Delivery Options & Auto-Delete Added

## Summary

Added advanced delivery options and auto-delete functionality to Promoter 2.0, matching the features available in Forward Rules.

## New Features Added

### 1. Caption Control in Marketing Posts
**Field**: `includeCaptionInCta` (boolean, default: true)

- **Enabled**: Marketing post includes original caption + CTA template
- **Disabled**: Marketing post only includes CTA template

**Example**:
```
Vault Post: "Amazing workout video 🔥"

With includeCaptionInCta=true:
Amazing workout video 🔥

Get exclusive access: https://t.me/bot?start=token123

With includeCaptionInCta=false:
Get exclusive access: https://t.me/bot?start=token123
```

### 2. Auto-Delete Marketing Posts
**Fields**:
- `deleteMarketingAfterEnabled` (boolean, default: false)
- `deleteMarketingInterval` (number)
- `deleteMarketingIntervalUnit` (0-5: seconds, minutes, hours, days, months, never)

**Functionality**:
- Automatically deletes marketing posts after specified time
- Runs every 5 minutes via background job
- Clears marketing message ID from database after deletion
- Useful for keeping marketing channels clean

**Example**: Delete marketing posts after 24 hours

### 3. Content Delivery Options

#### Hide Sender Name
**Field**: `hideSenderName` (boolean, default: false)
- Removes "Forwarded from" label
- Uses copy mode to send content

#### Copy Mode
**Field**: `copyMode` (boolean, default: false)
- Copies message instead of forwarding
- Hides original source completely

#### Remove Links
**Field**: `removeLinks` (boolean, default: false)
- Strips URLs from caption
- Removes @mentions from caption
- Applied before delivery to user

#### Add Watermark
**Field**: `addWatermark` (string, optional)
- Appends custom text to caption
- Added after removing links (if enabled)
- Useful for branding or attribution

**Example**:
```
Original caption: "Check out https://example.com @username"

With removeLinks=true, addWatermark="© MyBrand":
Check out 

© MyBrand
```

## Database Changes

### Schema Updates
Added to `PromoterConfig` model:
```prisma
includeCaptionInCta         Boolean @default(true)
deleteMarketingAfterEnabled Boolean @default(false)
deleteMarketingInterval     Int?
deleteMarketingIntervalUnit Int?    // 0-5
hideSenderName              Boolean @default(false)
copyMode                    Boolean @default(false)
removeLinks                 Boolean @default(false)
addWatermark                String?
```

### Migration
- Migration: `20260116155839_add_promoter_delivery_options`
- Status: Applied successfully

## Backend Changes

### Service Layer (`promoter.service.ts`)

#### Updated `createMarketingPost()`
- Checks `includeCaptionInCta` before adding caption to marketing post
- Respects user preference for caption inclusion

#### Updated `deliverContent()`
- Applies `removeLinks` to strip URLs and @mentions
- Adds `addWatermark` if configured
- Uses `copyMode` or `hideSenderName` to determine delivery method:
  - **Copy/Hide mode**: Sends media directly using file_id
  - **Forward mode**: Forwards original message (shows "Forwarded from")
- Handles modified captions separately when forwarding

#### New `deleteOldMarketingPosts()`
- Finds marketing posts past their deletion time
- Deletes messages via Telegram API
- Clears marketing message info from database
- Returns count of deleted posts

### Background Jobs

#### New Job: `processMarketingPostDeletion()`
- File: `apps/server/src/jobs/promoter-expiration.ts`
- Runs every 5 minutes
- Calls `deleteOldMarketingPosts()` service method

#### Scheduler Update
- Added marketing post deletion to scheduler
- Logs: "Delete old marketing posts: Every 5 minutes"

### Validation (`promoter.validation.ts`)
Added to schemas:
- `includeCaptionInCta`
- `deleteMarketingAfterEnabled`
- `deleteMarketingInterval`
- `deleteMarketingIntervalUnit`
- `hideSenderName`
- `copyMode`
- `removeLinks`
- `addWatermark`

## Frontend Changes

### Create Page (`apps/web/src/app/dashboard/promoter/create/page.tsx`)

#### New UI Sections

**1. Caption Control** (in CTA Configuration card)
- Toggle switch for "Include Original Caption"
- Description: "Include the vault post caption in marketing post"

**2. Auto-Delete Marketing Posts** (new card)
- Toggle switch to enable/disable
- Interval input (number)
- Unit selector (seconds, minutes, hours, days, months, never)
- Disabled when unit is "never"

**3. Content Delivery Options** (new card)
- Hide Sender Name toggle
- Copy Mode toggle
- Remove Links toggle
- Add Watermark textarea

### API Client (`api-client.ts`)
Updated `promoter.create()` type signature to include all new fields

### Edit Page
TODO: Needs to be updated with same fields (similar to create page)

## Use Cases

### 1. Clean Marketing Channel
**Scenario**: Keep marketing channel clean by auto-deleting old posts
**Configuration**:
- `deleteMarketingAfterEnabled`: true
- `deleteMarketingInterval`: 24
- `deleteMarketingIntervalUnit`: 3 (days)

### 2. Anonymous Content Delivery
**Scenario**: Hide source of content completely
**Configuration**:
- `hideSenderName`: true or `copyMode`: true
- `removeLinks`: true (optional, for extra privacy)

### 3. Branded Content
**Scenario**: Add branding to all delivered content
**Configuration**:
- `addWatermark`: "© MyBrand - Join @MyChannel"
- `copyMode`: true (to apply watermark)

### 4. CTA-Only Marketing
**Scenario**: Don't reveal content details in marketing post
**Configuration**:
- `includeCaptionInCta`: false
- `ctaTemplate`: "🔥 Exclusive content available! Click to access: {link}"

## Testing Recommendations

1. **Caption Control**: Test with/without captions in vault posts
2. **Auto-Delete**: Verify marketing posts are deleted after configured time
3. **Hide Sender**: Confirm no "Forwarded from" label appears
4. **Copy Mode**: Verify content is copied, not forwarded
5. **Remove Links**: Test URL and @mention removal
6. **Watermark**: Verify watermark is appended correctly
7. **Combined Options**: Test multiple options together

## Backward Compatibility

All new fields have sensible defaults:
- `includeCaptionInCta`: true (existing behavior)
- `deleteMarketingAfterEnabled`: false (no auto-delete)
- `hideSenderName`: false (show sender)
- `copyMode`: false (use forward)
- `removeLinks`: false (keep links)
- `addWatermark`: null (no watermark)

Existing promoter configurations will continue to work without changes.

## Next Steps

1. Update edit page with new fields
2. Add UI indicators for active delivery options in list view
3. Add analytics for deleted marketing posts
4. Consider adding preview mode to test delivery options

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
- New migration: `20260116155839_add_promoter_delivery_options`

## Summary

Promoter 2.0 now has feature parity with Forward Rules for content delivery and management. Users have full control over:
- How marketing posts are formatted
- When marketing posts are deleted
- How content is delivered to users
- What modifications are applied to content

This makes Promoter 2.0 a powerful and flexible content promotion system! 🚀
