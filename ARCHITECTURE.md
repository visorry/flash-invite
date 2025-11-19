# Architecture Guide

This document explains the architecture patterns used in Super Invite, based on the Elite Squad codebase.

## Server Architecture

### Custom Router Pattern

The custom router provides a type-safe, Express-compatible routing system with automatic validation and error handling.

```typescript
import Router from '../lib/router'

const router = Router()

router.get(
  '/endpoint',
  async (req: Request) => {
    // Your logic here
    return { data: 'response' }
  },
  {
    validation: YourZodSchema,  // Optional validation
    dto: 'YourDTO',             // Optional DTO transformation
  }
)
```

### Middleware Stack

1. **Auth Middleware** (`requireAuth`): Validates user session
2. **Validation Middleware**: Automatically validates request body/params/query
3. **Error Middleware**: Centralized error handling

### Service Layer

Services contain business logic and are separated from routes:

```typescript
// services/bot.service.ts
const create = async (ctx: RequestContext, data: any) => {
  // Business logic here
  return result
}

export default { create, list, getById, update, delete }
```

### Context Pattern

Request context provides user info, filters, and pagination:

```typescript
const ctx = getRequestContext(req)
// ctx contains: user, token, requestId, filter, pagination
```

### Error Handling

Custom error classes for different HTTP statuses:

```typescript
throw new NotFoundError('Resource not found')
throw new BadRequestError('Invalid input')
throw new UnauthorizedError('Auth required')
```

### Route Registration

Routes are organized by feature and registered with a REST handler:

```typescript
// routes/index.ts
const v1APIs = Promise.resolve({
  bots: botsRoute,
  invites: invitesRoute,
})

restHandler(v1APIs, '/api/v1', app, requireAuth)
```

## Web Architecture

### App Router Structure

```
app/
├── (dashboard)/          # Dashboard layout group
│   ├── layout.tsx       # Shared layout with sidebar
│   ├── page.tsx         # Dashboard home
│   ├── bots/
│   ├── invites/
│   └── settings/
└── layout.tsx           # Root layout
```

### Component Organization

```
components/
├── ui/                  # Base UI components (Button, Card)
├── layout/              # Layout components (Header, Sidebar)
├── bots/                # Bot-specific components
├── invites/             # Invite-specific components
└── dashboard/           # Dashboard components
```

### Data Fetching

Using React Query for server state management:

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['bots'],
  queryFn: () => apiClient.get('/api/v1/bots'),
})
```

### API Client

Type-safe API client with automatic error handling:

```typescript
const data = await apiClient.post('/api/v1/bots', {
  name: 'My Bot',
  botToken: 'token',
})
```

## Key Patterns

### 1. Type Safety
- Full TypeScript coverage
- Zod schemas for validation
- Type-safe API responses

### 2. Separation of Concerns
- Routes handle HTTP
- Services handle business logic
- Middleware handles cross-cutting concerns

### 3. Error Handling
- Custom error classes
- Centralized error middleware
- Consistent error responses

### 4. Validation
- Zod schemas
- Automatic validation middleware
- Type inference from schemas

### 5. Context Pattern
- Request context for user info
- Automatic filter/pagination extraction
- Consistent service signatures

## Response Format

All API responses follow this format:

```typescript
{
  success: boolean
  data: T | null
  error: {
    message: string
    status: number
    code: string
  } | null
}
```

## Adding New Features

### 1. Create Route

```typescript
// routes/feature.route.ts
import Router from '../lib/router'

const router = Router()
export const name = 'feature'

router.get('/', async (req) => {
  // Implementation
})

export { router }
```

### 2. Create Service

```typescript
// services/feature.service.ts
const list = async (ctx: RequestContext) => {
  // Implementation
}

export default { list }
```

### 3. Register Route

```typescript
// routes/index.ts
import * as featureRoute from './feature.route'

const v1APIs = Promise.resolve({
  feature: featureRoute,
})
```

### 4. Create Web Page

```typescript
// app/(dashboard)/feature/page.tsx
export default function FeaturePage() {
  return <div>Feature Page</div>
}
```

## Best Practices

1. **Always use context pattern** for services
2. **Validate all inputs** with Zod schemas
3. **Use custom error classes** for error handling
4. **Keep routes thin** - move logic to services
5. **Type everything** - leverage TypeScript
6. **Use React Query** for data fetching
7. **Follow naming conventions** from Elite Squad
