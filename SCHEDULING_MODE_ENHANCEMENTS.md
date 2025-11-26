# Scheduling Mode Enhancements

## Overview
Enhanced the Forward Rules scheduling mode with batch processing, flexible intervals, auto-deletion, and broadcast messaging capabilities.

## New Features

### 1. Batch Size Configuration
- **Field**: `batchSize` (default: 1)
- **Range**: 1-100 posts per batch
- **Description**: Configure how many posts should be forwarded in a single batch execution

### 2. Post Interval with Units
- **Fields**: 
  - `postInterval`: The interval value (default: 30)
  - `postIntervalUnit`: The time unit (default: 0 = minutes)
- **Units**:
  - 0 = Minutes
  - 1 = Hours
  - 2 = Days
  - 3 = Months
- **Description**: Flexible time interval between batch executions

### 3. Delete Interval with Units
- **Fields**:
  - `deleteAfterEnabled`: Enable/disable auto-deletion (default: false)
  - `deleteInterval`: The interval value
  - `deleteIntervalUnit`: The time unit
- **Units**:
  - 0 = Minutes
  - 1 = Hours
  - 2 = Days
  - 3 = Months
  - 4 = Never (no deletion)
- **Description**: Automatically delete forwarded messages after specified time

### 4. Broadcast Message Configuration
- **Fields**:
  - `broadcastEnabled`: Enable/disable broadcast (default: false)
  - `broadcastMessage`: The message text to send
  - `broadcastParseMode`: Text formatting (Plain Text, HTML, Markdown)
- **Description**: Send a custom message to the destination chat after each batch completes
- **Optional**: Can be enabled/disabled independently

## Database Changes

### New Columns in `forward_rule` table:
```sql
- batch_size (INT, default: 1)
- post_interval (INT, default: 30)
- post_interval_unit (INT, default: 0)
- delete_after_enabled (BOOLEAN, default: false)
- delete_interval (INT, nullable)
- delete_interval_unit (INT, nullable)
- broadcast_enabled (BOOLEAN, default: false)
- broadcast_message (TEXT, nullable)
- broadcast_parse_mode (VARCHAR, nullable)
```

### Removed Column:
- `interval_minutes` (replaced by `post_interval` + `post_interval_unit`)

## Implementation Details

### Backend Changes

#### 1. Schema (`packages/db/prisma/schema/schema.prisma`)
- Added new fields to ForwardRule model
- Replaced `intervalMinutes` with flexible interval system

#### 2. Validation (`apps/server/src/validation/forward-rule.validation.ts`)
- Updated CreateForwardRuleSchema with new fields
- Updated UpdateForwardRuleSchema with new fields
- Added validation for interval units (0-3 for post, 0-4 for delete)

#### 3. Service (`apps/server/src/services/forward-rule.service.ts`)
- Updated CreateForwardRuleData interface
- Updated UpdateForwardRuleData interface
- Modified create and update methods to handle new fields

#### 4. Scheduler (`apps/server/src/jobs/forward-scheduler.ts`)
- Modified `processRule()` to process batches instead of single messages
- Added `calculateNextRunTime()` helper for flexible intervals
- Added `scheduleMessageDeletion()` for auto-deletion
- Added `sendBroadcastMessage()` for batch completion notifications
- Updated `forwardMessageById()` to schedule deletions

### Frontend Changes

#### UI (`apps/web/src/app/(dashboard)/forward-rules/create/page.tsx`)
- Added batch size input
- Added post interval with unit selector (Minutes/Hours/Days/Months)
- Added delete interval toggle with unit selector (Minutes/Hours/Days/Months/Never)
- Added broadcast message toggle with text area and parse mode selector
- Updated form submission to include all new fields

## Usage Example

### Creating a Rule with New Features:
```typescript
{
  name: "Daily News Digest",
  scheduleMode: 1, // Scheduled
  batchSize: 5, // Forward 5 posts per batch
  postInterval: 6, // Every 6...
  postIntervalUnit: 1, // ...hours
  deleteAfterEnabled: true,
  deleteInterval: 24, // Delete after 24...
  deleteIntervalUnit: 1, // ...hours
  broadcastEnabled: true,
  broadcastMessage: "📰 Latest news batch delivered!",
  broadcastParseMode: "HTML"
}
```

This configuration will:
1. Forward 5 messages every 6 hours
2. Delete each forwarded message after 24 hours
3. Send a broadcast message after each batch of 5 messages

## Migration

Run the migration:
```bash
cd packages/db
npx prisma migrate dev
```

The migration file: `20251126141015_add_batch_and_broadcast_to_forward_rules`

## Notes

- Batch processing improves efficiency for high-volume forwarding
- Flexible intervals allow for better scheduling control
- Auto-deletion helps manage chat clutter
- Broadcast messages provide batch completion notifications
- All new features are optional and backward compatible
