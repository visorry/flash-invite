# FlashInvite

Open-source Telegram bot management platform with advanced automation, monetization, and analytics.

## What is FlashInvite?

FlashInvite is a comprehensive platform for managing Telegram bots, groups, and channels. It provides tools for creating time-limited invite links, auto-approving join requests, forwarding messages between channels, broadcasting to users, and monetizing your Telegram communities with subscriptions and tokens.

## Features

### Bot Management
- Add and manage multiple Telegram bots
- Health monitoring and status tracking
- Multi-bot support per user
- Token-based bot cost system

### Invite Links
- Generate time-limited invite links (seconds to years)
- Member limits per link
- Auto-kick members after expiration
- Join tracking and analytics
- Member renewal support

### Auto-Approval Rules
- **Instant approval** - Approve join requests immediately
- **Delayed approval** - Add spam protection with configurable delays
- **Manual override** - Instantly approve all pending requests with one click
- Filters: Premium users, username requirement, account age, country blocking
- Welcome messages after approval
- Real-time pending count tracking

### Message Forwarding
- Forward messages between channels/groups
- **Realtime mode** - Instant forwarding
- **Scheduled mode** - Batch forwarding with intervals
- Content filters (media, text, documents, stickers, polls)
- Keyword filtering (whitelist/blacklist)
- Text modifications (remove links, add watermarks)
- Shuffle and repeat options

### Broadcasting
- Send mass messages to bot users
- HTML/Markdown formatting
- Inline keyboard buttons
- Template management
- Progress tracking and statistics

### Welcome/Goodbye Messages
- Customizable welcome and goodbye messages per group
- Auto-delete after specified time
- User mentions and custom keyboards

### Monetization
- **Subscriptions** - Recurring plans with token allocations
- **Token system** - Pay-per-use model for features
- **Payment gateways** - PhonePe and Cashfree integration
- Daily token claims for subscribers
- Token bundles for direct purchase

### Admin Panel
- User management with role assignment
- Cost configuration for features
- System settings management
- Analytics and reporting

## Tech Stack

- **Runtime**: Bun (fast JavaScript runtime)
- **Backend**: Express + TypeScript
- **Frontend**: Next.js 15 (App Router) + React 19
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Better Auth
- **Styling**: Tailwind CSS + Shadcn UI
- **API Client**: TanStack Query (React Query)
- **Validation**: Zod
- **Telegram**: Telegraf (Bot API wrapper)

## Project Structure

```
super-invite/
├── apps/
│   ├── server/              # Express API backend
│   │   ├── src/
│   │   │   ├── bot/         # Telegram bot handlers
│   │   │   ├── config/      # App configuration
│   │   │   ├── jobs/        # Cron jobs and schedulers
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── services/    # Business logic
│   │   │   ├── middleware/  # Express middleware
│   │   │   └── validation/  # Zod schemas
│   │   └── package.json
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # App router pages
│       │   ├── components/  # React components
│       │   ├── hooks/       # Custom React hooks
│       │   └── lib/         # API client, utilities
│       └── package.json
└── packages/
    ├── auth/                # Better Auth config
    ├── config/              # Shared configuration
    └── db/                  # Prisma schema and migrations
        └── prisma/
            └── schema/      # Database models
```

## Getting Started

### Prerequisites

- **Bun** >= 1.3.0 ([Install Bun](https://bun.sh))
- **PostgreSQL** (local or hosted like Neon, Supabase)
- **Telegram Bot Token** ([Create bot with BotFather](https://t.me/botfather))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/super-invite.git
   cd super-invite
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**

   Create `.env` file in `apps/server/`:
   ```bash
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/superinvite"

   # App
   NODE_ENV="development"
   PORT=3000
   FRONTEND_URL="http://localhost:3001"

   # Auth (generate random secrets)
   BETTER_AUTH_SECRET="your-secret-key"
   BETTER_AUTH_URL="http://localhost:3000"

   # Payment Gateways (optional)
   PHONEPE_MERCHANT_ID=""
   PHONEPE_SALT_KEY=""
   PHONEPE_SALT_INDEX=""
   ```

   Create `.env.local` file in `apps/web/`:
   ```bash
   NEXT_PUBLIC_API_URL="http://localhost:3000"
   BETTER_AUTH_URL="http://localhost:3000"
   BETTER_AUTH_SECRET="your-secret-key"
   ```

4. **Run database migrations**
   ```bash
   bun run db:migrate
   ```

5. **Start development servers**
   ```bash
   # All services
   bun run dev

   # Or individually
   bun run dev:server  # Backend on :3000
   bun run dev:web     # Frontend on :3001
   ```

6. **Access the app**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

## Development

### Available Scripts

```bash
# Development
bun run dev              # Run all services
bun run dev:server       # Backend only
bun run dev:web          # Frontend only

# Database
bun run db:migrate       # Run migrations
bun run db:push          # Push schema changes
bun run db:studio        # Open Prisma Studio
bun run db:generate      # Generate Prisma Client

# Build
bun run build            # Build all apps
bun run check-types      # TypeScript type checking
```

### Database Migrations

```bash
# Create a new migration
cd packages/db
npx prisma migrate dev --name migration_name

# Apply migrations
bun run db:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Adding a New Feature

1. **Define database model** in `packages/db/prisma/schema/schema.prisma`
2. **Create migration**: `cd packages/db && npx prisma migrate dev`
3. **Add service** in `apps/server/src/services/`
4. **Add routes** in `apps/server/src/routes/`
5. **Update API client** in `apps/web/src/lib/api-client.ts`
6. **Create UI** in `apps/web/src/app/dashboard/`

## API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
Most endpoints require authentication. Include the session cookie in requests.

### Key Endpoints

#### Bots
- `GET /bots` - List all user bots
- `POST /bots` - Add a new bot
- `DELETE /bots/:id` - Remove bot
- `POST /bots/:id/sync` - Sync bot chats

#### Invites
- `GET /invites` - List invite links
- `POST /invites` - Create invite link
- `DELETE /invites/:id` - Revoke invite
- `GET /invites/:id/stats` - Get statistics

#### Auto-Approval
- `GET /auto-approval` - List rules
- `POST /auto-approval` - Create rule
- `PUT /auto-approval/:id` - Update rule
- `POST /auto-approval/:id/toggle` - Enable/disable
- `GET /auto-approval/:id/pending` - Get pending approvals
- `POST /auto-approval/:id/approve-all` - Approve all pending

#### Forward Rules
- `GET /forward-rules` - List rules
- `POST /forward-rules` - Create rule
- `POST /forward-rules/:id/start` - Start forwarding
- `POST /forward-rules/:id/pause` - Pause forwarding
- `POST /forward-rules/:id/resume` - Resume forwarding

#### Tokens
- `GET /tokens/balance` - Get user token balance
- `GET /tokens/transactions` - Transaction history
- `POST /tokens/claim-daily` - Claim daily tokens


### Database Schema

Key models:
- **User** - User accounts and auth
- **Bot** - Telegram bots
- **TelegramEntity** - Groups/channels
- **InviteLink** - Time-limited invites
- **GroupMember** - Member tracking
- **AutoApprovalRule** - Auto-approval config
- **PendingApproval** - Delayed approvals queue
- **ForwardRule** - Message forwarding config
- **Subscription** - User subscriptions
- **TokenTransaction** - Token history
- **Payment** - Payment records

## Deployment

### Docker

```bash
# Build images
docker build -f Dockerfile.server -t super-invite-server .
docker build -f Dockerfile.web -t super-invite-web .

# Run with docker-compose
docker-compose up -d
```

### Manual Deployment

1. Build the apps:
   ```bash
   bun run build
   ```

2. Set production environment variables

3. Run migrations:
   ```bash
   bun run db:migrate
   ```

4. Start services:
   ```bash
   # Server
   cd apps/server && bun run start

   # Web
   cd apps/web && bun run start
   ```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add Zod validation for all inputs
- Update documentation when adding features
- Test your changes before submitting

## Roadmap

- [ ] Multi-language support (i18n)
- [ ] Advanced analytics dashboard
- [ ] Webhook support for external integrations
- [ ] More payment gateway options (Stripe, Razorpay)
- [ ] Referral system
- [ ] API rate limiting
- [ ] Mobile app (React Native)
- [ ] Plugin system for custom features

## Common Issues

### Database Connection Error
Make sure PostgreSQL is running and `DATABASE_URL` is correct in `.env`.

### Bot Token Invalid
Verify your bot token from BotFather. Make sure it's added via the dashboard after login.

### Port Already in Use
Change `PORT` in server's `.env` file or kill the process using the port.

### Prisma Client Not Generated
Run `bun run db:generate` to regenerate the Prisma client.


## Acknowledgments

Built with modern tools and inspired by the Telegram bot ecosystem. Thanks to all contributors and the open-source community.

---

**Made with ❤️ for the Telegram community**
