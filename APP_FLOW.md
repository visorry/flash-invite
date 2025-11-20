# Super Invite - Application Flow Documentation

## Complete User Journey & System Flow

### 1. User Registration & Setup

```
User → Register Page
  ↓
Enter: Name, Email, Password
  ↓
POST /api/auth/sign-up/email
  ↓
Database: Create User record
  ↓
Session Created (Cookie set)
  ↓
Redirect to Dashboard
```

**Database Changes:**
- New `User` record created
- `TokenBalance` initialized (if configured)
- Session stored in database

---

### 2. Adding a Telegram Group

```
User → Groups Page → "Add Group"
  ↓
Enter: Group/Channel Link or ID
  ↓
POST /api/v1/telegram-entities
  ↓
Backend validates Telegram entity
  ↓
Check if bot is admin in group
  ↓
Database: Create TelegramEntity record
  ↓
Group appears in user's groups list
```

**Database Changes:**
- New `TelegramEntity` record
  - `userId`: Owner of the group
  - `telegramId`: Telegram's chat ID
  - `type`: Group or Channel
  - `title`: Group name
  - `isActive`: true
  - `botAdded`: true (if bot is admin)

**Requirements:**
- Bot must be added to the group as admin
- Bot needs permissions: Invite users, Manage chat

---

### 3. Creating an Invite Link

```
User → Invites Page → "Create Invite"
  ↓
Select: Group, Duration (value + unit), Optional Name
  ↓
POST /api/v1/invites
  ↓
Backend Process:
  1. Validate user owns the group
  2. Check group is active
  3. Generate unique token (32 chars)
  4. Get bot username from config/env
  5. Create bot start link: t.me/botname?start=TOKEN
  6. Calculate expiry date
  ↓
Database: Create InviteLink record
  ↓
Return invite link to user
```

**Database Changes:**
- New `InviteLink` record
  - `inviteLink`: `https://t.me/botname?start=TOKEN`
  - `telegramEntityId`: Target group
  - `userId`: Creator
  - `durationSeconds`: How long member can stay AFTER joining
  - `memberLimit`: 1 (one-time use)
  - `currentUses`: 0
  - `status`: ACTIVE (0)
  - `expiresAt`: When invite LINK expires (30 days from creation)
  - `metadata`: { token, name }

**Important Distinction:**
- **`expiresAt`**: When the invite LINK stops working (30 days from creation)
- **`durationSeconds`**: How long a member can stay AFTER they join
- **`memberLimit`**: 1 (one-time use)

**Link Expiry Logic:**
- Link expires after 30 days OR after first use (whichever comes first)
- This prevents unused links from staying active forever

**Example:**
- Member Duration: 7 days
- Link: `https://t.me/sleepingbunnybot?start=abc123xyz`
- Link expires: 30 days from now OR after first use
- Member can stay: 7 days AFTER joining (not from link creation)

---

### 4. User Clicks Invite Link (The Magic!)

```
User clicks: https://t.me/botname?start=TOKEN
  ↓
Opens Telegram app
  ↓
Bot receives /start command with TOKEN
  ↓
Bot Handler (start.ts):
  1. Extract token from message
  2. Find InviteLink by token in metadata
  3. Validate invite:
     - Status is ACTIVE
     - Not expired (expiresAt)
     - Not reached member limit
     - Group is active
  ↓
If valid:
  4. Calculate member expiry (now + durationSeconds)
  5. Create ONE-TIME Telegram invite link:
     - member_limit: 1 (single use)
     - expire_date: 1 hour from now
  6. Send message to user with invite button
  ↓
Database: Create/Update GroupMember record
  - telegramUserId: User's Telegram ID
  - telegramEntityId: Target group
  - username: @username
  - fullName: User's name
  - inviteLink: One-time Telegram link
  - joinedAt: Current time
  - expiresAt: joinedAt + durationSeconds
  - isActive: true
  ↓
Database: Increment InviteLink.currentUses
  ↓
User receives message with "Join Group" button
  ↓
User clicks button → Joins group
```

**Bot Message Example:**
```
🎉 Welcome! You've successfully unlocked access to the group.

🕒 Access valid until: Dec 25, 2024, 10:30 AM
🔒 You will be automatically removed after this time.

🚫 Do not share this link! It is uniquely generated for you.

[🔗 Join Premium Group]
```

**Database Changes:**
- `GroupMember` record created/updated
- `InviteLink.currentUses` incremented
- If `currentUses >= memberLimit`, status changes to EXPIRED

**Key Points:**
- Each user gets a UNIQUE one-time Telegram invite link
- The link expires in 1 hour OR after first use
- Member's access duration starts when they join
- Bot tracks when they joined and when they should be kicked

---

### 5. Member Tracking & Monitoring

```
User → Members Page
  ↓
GET /api/v1/members
  ↓
Backend:
  1. Get user's telegram entities
  2. Find all GroupMembers for those entities
  3. Sort by joinedAt (newest first)
  ↓
Display member cards with:
  - Name, username
  - Status badge (Active/Expired/Kicked)
  - Join date & time
  - Expiry date & time
  - Time remaining countdown
  - Duration (e.g., "7d 12h")
  - Telegram User ID
```

**Member Status Logic:**
- **Active**: `isActive = true` AND `expiresAt > now` AND `!kickedAt`
- **Expired**: `expiresAt < now` AND `!kickedAt`
- **Kicked**: `kickedAt` is set
- **Inactive**: `isActive = false`

---

### 6. Automatic Kick System (Background Job)

```
Cron Job runs every 5 minutes
  ↓
Job: kick-expired-members.ts
  ↓
Query: Find expired members
  - isActive = true
  - expiresAt < now
  - kickedAt = null
  ↓
For each expired member:
  1. Get group's Telegram ID
  2. Get bot instance (default or custom)
  3. Call bot.telegram.banChatMember(chatId, userId)
  4. Immediately unban (allows rejoin with new invite)
  5. Update GroupMember:
     - kickedAt = now
     - isActive = false
  ↓
Log results
```

**Kick Process:**
```javascript
// 1. Ban the user (removes from group)
await bot.telegram.banChatMember(chatId, userId)

// 2. Immediately unban (allows them to rejoin later)
await bot.telegram.unbanChatMember(chatId, userId)

// 3. Mark as kicked in database
await db.groupMember.update({
  where: { id },
  data: {
    kickedAt: new Date(),
    isActive: false
  }
})
```

**Why ban then unban?**
- `banChatMember` removes user from group
- Immediate `unbanChatMember` allows them to rejoin with a new invite
- Without unban, they'd be permanently blocked

---

### 7. Invite Link Expiration (Background Job)

```
Cron Job runs every 5 minutes
  ↓
Job: Check expired invite links
  ↓
Query: Find expired invites
  - status = ACTIVE
  - expiresAt < now
  ↓
Update status to EXPIRED
```

**Important Note:** Invite link expiry is different from member expiry:
- **Invite Link Expiry** (`expiresAt`): When the invite link itself stops working (30 days)
- **Member Duration** (`durationSeconds`): How long a member can stay AFTER joining
- **Member Expiry**: `joinedAt + durationSeconds` = when they should be kicked
- **One-Time Use**: Link becomes invalid after first use (memberLimit = 1)

**Example:**
- Invite created: Dec 25, 2024
- Invite link expires: Jan 24, 2025 (30 days later) OR after first use
- Member duration: 7 days
- User joins: Jan 1, 2025
- Link becomes invalid immediately (one-time use)
- User kicked: Jan 8, 2025 (7 days after joining)

---

### 8. Manual Invite Revocation

```
User → Invites Page → Click "Revoke" button
  ↓
DELETE /api/v1/invites/:id
  ↓
Backend:
  1. Verify user owns the invite
  2. Check invite is ACTIVE
  3. Try to revoke on Telegram (may fail, that's ok)
  4. Update database status to REVOKED
  ↓
Invite link no longer works
```

**Database Changes:**
- `InviteLink.status` = REVOKED (2)
- `InviteLink.revokedAt` = current time

---

## Data Flow Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       ├─── Register/Login ──→ Session Cookie
       │
       ├─── Add Group ──→ TelegramEntity
       │
       ├─── Create Invite ──→ InviteLink (with token)
       │                        │
       │                        └──→ Bot Start Link
       │                              │
       │                              ↓
       │                        User clicks link
       │                              │
       │                              ↓
       │                        Bot validates token
       │                              │
       │                              ↓
       │                        Creates one-time link
       │                              │
       │                              ↓
       │                        GroupMember record
       │                              │
       │                              ↓
       │                        User joins group
       │                              │
       │                              ↓
       │                        [Time passes...]
       │                              │
       │                              ↓
       │                        Cron job checks expiry
       │                              │
       │                              ↓
       │                        Bot kicks expired member
       │
       └─── View Members ──→ See all tracked members
```

---

## Database Schema Overview

### Key Tables

**User**
- Authentication & profile
- Links to: TokenBalance, Subscriptions, TelegramEntities, InviteLinks

**TelegramEntity**
- Represents a Telegram group/channel
- Links to: User (owner), InviteLinks, GroupMembers

**InviteLink**
- The bot start link users click
- Contains: token, duration, expiry, usage count
- Links to: User (creator), TelegramEntity (target group)

**GroupMember**
- Tracks who joined and when they should be kicked
- Contains: join time, expiry time, kick time
- Links to: TelegramEntity (which group)

---

## Key Features

### 1. One-Time Use Links
- Each invite link can only be used once (`memberLimit: 1`)
- After use, status changes to EXPIRED or LIMIT_REACHED

### 2. Time-Limited Access
- Members are automatically kicked after their duration expires
- Duration is flexible: minutes, hours, days, months, years

### 3. Bot Start Links
- Uses Telegram's deep linking: `t.me/bot?start=TOKEN`
- Token is stored in `InviteLink.metadata.token`
- Bot validates token and creates actual group invite

### 4. Automatic Cleanup
- Cron jobs run every 5 minutes
- Kicks expired members
- Marks expired invite links

### 5. Member Tracking
- Full history of who joined when
- Real-time status updates
- Time remaining countdown

---

## Security & Validation

### Invite Creation
- ✅ User must own the group
- ✅ Group must be active
- ✅ Bot must be admin in group
- ✅ Unique token generation

### Token Validation
- ✅ Token must exist in database
- ✅ Invite must be ACTIVE
- ✅ Not expired
- ✅ Not reached member limit
- ✅ Group must be active

### Member Kick
- ✅ Only kicks expired members
- ✅ Unbans immediately (allows rejoin)
- ✅ Updates database status
- ✅ Handles errors gracefully

---

## Configuration

### Environment Variables

**Server:**
```env
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=@your_bot_username
DATABASE_URL=postgresql://...
```

**Bot Setup:**
- Bot must be added to groups as admin
- Required permissions: Invite users, Manage chat
- Uses long polling (no webhook needed)

### Cron Schedule
- Kick expired members: Every 5 minutes
- Check expired invites: Every 5 minutes

---

## Common Scenarios

### Scenario 1: User Joins Successfully
1. User clicks invite link
2. Bot validates token ✅
3. Creates one-time Telegram link
4. User joins group
5. Member tracked in database
6. After duration expires, auto-kicked

### Scenario 2: Invite Link Expired
1. User clicks invite link
2. Bot validates token ❌ (expired)
3. Bot replies: "Invalid or expired invite link"
4. User cannot join

### Scenario 3: Member Limit Reached
1. First user clicks link → Joins ✅
2. Second user clicks same link
3. Bot validates token ❌ (limit reached)
4. Bot replies: "Invalid or expired invite link"

### Scenario 4: Manual Revocation
1. Admin revokes invite link
2. Status changes to REVOKED
3. Any user clicking link gets error
4. Existing members stay until their time expires

---

## Troubleshooting

### Bot Not Responding
- Check bot token is correct
- Verify bot is running (long polling active)
- Check bot is admin in the group

### Members Not Being Kicked
- Check cron job is running
- Verify bot has kick permissions
- Check database for expired members

### Invite Links Not Working
- Verify bot username is correct
- Check token exists in database
- Ensure invite status is ACTIVE

---

This is the complete flow of your Super Invite application!
