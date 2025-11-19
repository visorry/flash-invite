# Super Invite

A platform for Telegram channel/group owners to manage invite links with time limits and auto-kick functionality.

## Features

- 🤖 **Bot Management**: Configure and manage multiple Telegram bots
- 🔗 **Invite Links**: Generate time-limited invite links
- ⏰ **Auto-Kick**: Automatically remove members after specified time
- 📊 **Dashboard**: Track invites, members, and activity
- 🎨 **Modern UI**: Built with Next.js 15 and Tailwind CSS

## Project Structure

```
super-invite/
├── apps/
│   ├── server/          # Express API server
│   │   ├── src/
│   │   │   ├── config/       # Configuration
│   │   │   ├── enums/        # Enums (HTTP status, error codes)
│   │   │   ├── errors/       # Custom error classes
│   │   │   ├── helper/       # Helper functions (context)
│   │   │   ├── lib/          # Custom router implementation
│   │   │   ├── middleware/   # Auth, validation, error handling
│   │   │   ├── routes/       # API routes
│   │   │   ├── services/     # Business logic
│   │   │   └── types/        # TypeScript types
│   │   └── package.json
│   └── web/             # Next.js dashboard
│       ├── src/
│       │   ├── app/          # App router pages
│       │   ├── components/   # React components
│       │   └── lib/          # Utilities, API client
│       └── package.json
└── packages/
    ├── auth/            # Better Auth configuration
    ├── config/          # Shared config
    └── db/              # Prisma database

## Getting Started

### Prerequisites

- Bun >= 1.3.0
- PostgreSQL
- Telegram Bot Token

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   # Server (.env in apps/server/)
   cp apps/server/.env.example apps/server/.env
   
   # Web (.env in apps/web/)
   cp apps/web/.env.example apps/web/.env
   ```

4. Configure your database and Telegram bot token in `apps/server/.env`

5. Run database migrations:
   ```bash
   bun run db:push
   ```

### Development

Run all services:
```bash
bun run dev
```

Or run individually:
```bash
# Server only
bun run dev:server

# Web only
bun run dev:web
```

The server will run on http://localhost:3000
The web dashboard will run on http://localhost:3001

## API Routes

### Public Routes
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Get current user

### Protected Routes (require authentication)
- `GET /api/v1/bots` - List all bots
- `POST /api/v1/bots` - Create a new bot
- `GET /api/v1/bots/:id` - Get bot details
- `PUT /api/v1/bots/:id` - Update bot
- `DELETE /api/v1/bots/:id` - Delete bot

- `GET /api/v1/invites` - List all invites
- `POST /api/v1/invites` - Create invite link
- `GET /api/v1/invites/:id` - Get invite details
- `DELETE /api/v1/invites/:id` - Revoke invite
- `GET /api/v1/invites/:id/stats` - Get invite statistics

- `GET /api/v1/dashboard/stats` - Dashboard statistics
- `GET /api/v1/dashboard/recent-activity` - Recent activity

## Architecture

### Server Architecture (Elite Squad Style)

- **Custom Router**: Type-safe router with automatic validation and error handling
- **Middleware**: Auth, validation, and error handling middleware
- **Services**: Business logic separated from routes
- **Context Pattern**: Request context for user, filters, and pagination
- **Error Handling**: Centralized error handling with custom error classes
- **Type Safety**: Full TypeScript support with proper types

### Web Architecture

- **Next.js 15**: App router with server components
- **Tailwind CSS**: Utility-first styling
- **React Query**: Data fetching and caching
- **Shadcn UI**: Component library foundation
- **Dark Mode**: Theme support with next-themes

## TODO

- [ ] Implement Prisma schema for bots, invites, and members
- [ ] Integrate Telegram Bot API
- [ ] Add authentication with Better Auth
- [ ] Implement invite link generation
- [ ] Add auto-kick scheduler
- [ ] Create bot configuration UI
- [ ] Add member management
- [ ] Implement analytics and reporting

## Tech Stack

- **Backend**: Bun, Express, TypeScript
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Database**: PostgreSQL with Prisma
- **Auth**: Better Auth
- **Validation**: Zod
- **API Client**: React Query

## License

MIT
