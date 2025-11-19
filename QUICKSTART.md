# Quick Start Guide

Get Super Invite up and running in minutes!

## Prerequisites

- Bun >= 1.3.0
- PostgreSQL database
- Telegram Bot Token (get from [@BotFather](https://t.me/botfather))

## Setup Steps

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment

Update `apps/server/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
TELEGRAM_BOT_TOKEN=your_bot_token_here
BETTER_AUTH_SECRET=your_secret_here
CORS_ORIGINS=http://localhost:3001,http://localhost:3000
```

Update `apps/web/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Setup Database

```bash
# Push schema to database
bun run db:push

# Or run migrations
bun run db:migrate
```

### 4. Start Development

```bash
# Start both server and web
bun run dev

# Or start individually
bun run dev:server  # Server on :3000
bun run dev:web     # Web on :3001
```

### 5. Access the App

- **Web Dashboard**: http://localhost:3001
- **API Server**: http://localhost:3000
- **Health Check**: http://localhost:3000/healthcheck

## Project Structure

```
super-invite/
├── apps/
│   ├── server/              # Express API (Port 3000)
│   │   ├── src/
│   │   │   ├── config/      # Configuration
│   │   │   ├── enums/       # Enums
│   │   │   ├── errors/      # Error classes
│   │   │   ├── helper/      # Helper functions
│   │   │   ├── lib/         # Custom router
│   │   │   ├── middleware/  # Middleware
│   │   │   ├── routes/      # API routes
│   │   │   ├── services/    # Business logic
│   │   │   └── types/       # TypeScript types
│   │   └── .env
│   └── web/                 # Next.js Dashboard (Port 3001)
│       ├── src/
│       │   ├── app/         # Pages
│       │   ├── components/  # Components
│       │   └── lib/         # Utils
│       └── .env
└── packages/
    ├── auth/                # Better Auth
    ├── config/              # Shared config
    └── db/                  # Prisma

## Available API Routes

### Public Routes
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register
- `GET /api/v1/auth/me` - Get current user

### Protected Routes (Auth Required)

**Bots**
- `GET /api/v1/bots` - List bots
- `POST /api/v1/bots` - Create bot
- `GET /api/v1/bots/:id` - Get bot
- `PUT /api/v1/bots/:id` - Update bot
- `DELETE /api/v1/bots/:id` - Delete bot

**Invites**
- `GET /api/v1/invites` - List invites
- `POST /api/v1/invites` - Create invite
- `GET /api/v1/invites/:id` - Get invite
- `DELETE /api/v1/invites/:id` - Revoke invite
- `GET /api/v1/invites/:id/stats` - Get stats

**Dashboard**
- `GET /api/v1/dashboard/stats` - Get stats
- `GET /api/v1/dashboard/recent-activity` - Get activity

## Next Steps

1. **Implement Database Schema**: Update `packages/db/prisma/schema.prisma`
2. **Add Telegram Integration**: Implement bot API calls in services
3. **Complete Auth**: Set up Better Auth with your preferred provider
4. **Build UI**: Create forms and dialogs for bot/invite management
5. **Add Scheduler**: Implement auto-kick functionality

## Development Tips

### Check Types
```bash
bun run check-types
```

### Database Commands
```bash
bun run db:studio    # Open Prisma Studio
bun run db:push      # Push schema changes
bun run db:migrate   # Run migrations
bun run db:generate  # Generate Prisma client
```

### Build for Production
```bash
bun run build
```

## Troubleshooting

### Port Already in Use
Change ports in:
- `apps/server/.env` - PORT=3000
- `apps/web/package.json` - dev script port

### Database Connection Error
- Check DATABASE_URL in `apps/server/.env`
- Ensure PostgreSQL is running
- Verify credentials

### Module Not Found
```bash
bun install
```

## Getting Help

- Check `ARCHITECTURE.md` for architecture details
- Review `README.md` for full documentation
- Look at Elite Squad codebase for examples

## What's Included

✅ **Server**
- Custom router with validation
- Auth middleware
- Error handling
- Service layer pattern
- Type-safe routes

✅ **Web**
- Next.js 15 with App Router
- Tailwind CSS styling
- Dark mode support
- React Query for data fetching
- Responsive layout with sidebar

✅ **Core Features**
- Bot management routes
- Invite management routes
- Dashboard with stats
- Settings page
- API client

## What's Next (TODO)

- [ ] Prisma schema for bots/invites/members
- [ ] Telegram Bot API integration
- [ ] Better Auth implementation
- [ ] Invite link generation
- [ ] Auto-kick scheduler
- [ ] Bot configuration UI
- [ ] Member management UI
- [ ] Analytics dashboard

Happy coding! 🚀
