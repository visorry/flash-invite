# Multiple Bots Rotation Feature

## Overview
Added support for rotating through multiple bots in promotional deep links to increase user engagement with different bots.

## Implementation

### Database Changes
**Migration**: `20260116180907_add_multiple_bots_to_promoter`

Added to `PromoterConfig` model:
- `multipleBotsEnabled` (Boolean): Enable/disable bot rotation
- `additionalBotIds` (String[]): Array of additional bot IDs to rotate through
- `currentBotIndex` (Int): Tracks which bot to use next in rotation

### Backend Changes

#### Service Layer (`apps/server/src/services/promoter.service.ts`)
- Added `getNextBotForMarketing()` function:
  - Returns primary bot if rotation disabled
  - Builds array of all bots (primary + additional)
  - Uses `currentBotIndex` to select bot sequentially
  - Updates index for next rotation
  - Returns bot username for deep link generation

- Updated `createMarketingPost()`:
  - Calls `getNextBotForMarketing()` instead of using primary bot directly
  - Generates deep link with rotated bot username
  - Token remains the same across all bots

#### Validation (`apps/server/src/validation/promoter.validation.ts`)
- Added `multipleBotsEnabled` (boolean, optional)
- Added `additionalBotIds` (array of UUIDs, optional)

### Frontend Changes

#### API Client (`apps/web/src/lib/api-client.ts`)
- Updated `promoter.create()` type signature
- Updated `promoter.update()` type signature
- Added `multipleBotsEnabled` and `additionalBotIds` fields

#### Create Page (`apps/web/src/app/dashboard/promoter/create/page.tsx`)
- Added state for multiple bots feature
- Added `useEffect` to find common bots when vault and marketing groups selected
- Logic finds bots that have admin access to BOTH groups
- Excludes primary bot from additional bots list
- Added "Multiple Bots Rotation" card with:
  - Enable toggle
  - Checkbox list of common bots
  - Counter showing total bots in rotation
  - Warning if no common bots found

#### Edit Page (`apps/web/src/app/dashboard/promoter/[id]/edit/page.tsx`)
- Added same multiple bots UI as create page
- Loads existing configuration
- Fetches common bots dynamically
- Updates configuration with selected bots

## How It Works

### Setup
1. User selects primary bot, vault group, and marketing group
2. System finds all bots that are admin in BOTH groups
3. User enables "Multiple Bots" toggle
4. User selects additional bots from common bots list

### Rotation Logic
1. When a new post is captured from vault:
   - System creates marketing post with CTA
   - `getNextBotForMarketing()` selects next bot in sequence
   - Deep link uses selected bot's username
   - Token remains the same (works with any bot)
   - Index increments for next post

2. Example sequence with 3 bots:
   - Post 1: `https://t.me/bot1?start=token123`
   - Post 2: `https://t.me/bot2?start=token456`
   - Post 3: `https://t.me/bot3?start=token789`
   - Post 4: `https://t.me/bot1?start=token012` (wraps around)

### Token Delivery
- All bots in rotation must handle the `/start` command
- Token validation works regardless of which bot user clicks
- Content delivery happens through the bot user interacted with
- Same token can be used across all bots

## Benefits
1. **Increased Engagement**: Users interact with multiple bots
2. **Load Distribution**: Spreads user interactions across bots
3. **Flexibility**: Easy to add/remove bots from rotation
4. **Seamless**: Same token works with all bots
5. **Sequential**: Predictable rotation pattern

## Requirements
- All bots must be admin in both vault and marketing groups
- All bots must have `/start` command handler
- All bots must be able to access vault content
- All bots must be able to send messages to users

## UI Features
- Visual indication of total bots in rotation
- Warning when no common bots available
- Easy checkbox selection
- Automatic filtering of eligible bots
- Real-time validation

## Status
✅ Database schema updated
✅ Migration applied
✅ Backend service implemented
✅ Validation schemas updated
✅ API client updated
✅ Create page UI complete
✅ Edit page UI complete
✅ Server builds successfully
✅ Ready for testing
