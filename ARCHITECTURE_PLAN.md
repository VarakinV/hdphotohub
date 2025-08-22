# Real Estate Photography Delivery Platform - Architecture Plan

## Project Overview

A simplified HD Photohub clone for delivering real estate photography to clients with a robust admin panel for managing orders and content.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **UI**: TailwindCSS + Shadcn UI
- **Authentication**: Auth.js (NextAuth v5) with Credentials Provider
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Storage**: AWS S3 (future implementation)
- **Image Processing**: Sharp (future implementation)
- **Hosting**: Vercel-compatible

## Milestone 1: Project Setup & Authentication

### Project Structure

```
hdphotohub-clone/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── logout-button.tsx
│   ├── ui/
│   │   └── (shadcn components)
│   └── providers/
│       └── session-provider.tsx
├── lib/
│   ├── auth/
│   │   ├── auth.config.ts
│   │   └── auth.ts
│   ├── db/
│   │   └── prisma.ts
│   └── utils/
│       └── password.ts
├── prisma/
│   └── schema.prisma
├── middleware.ts
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Database Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  image     String?
  role      Role     @default(ADMIN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
}
```

### Environment Variables

```env
# .env.local
DATABASE_URL="your-neon-database-connection-string"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### Key Implementation Details

#### 1. Authentication Flow

- **Registration**: Admin users can register with email/password
- **Login**: Email/password authentication via Auth.js Credentials Provider
- **Session Management**: JWT-based sessions with Auth.js
- **Password Security**: Bcrypt hashing with salt rounds of 12
- **Route Protection**: Middleware-based protection for /admin/\* routes

#### 2. Auth.js Configuration

```typescript
// lib/auth/auth.config.ts
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { verifyPassword } from '@/lib/utils/password';
import { getUserByEmail } from '@/lib/db/users';

export default {
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate and authenticate user
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');

      if (isOnAdmin) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
```

#### 3. Middleware Configuration

```typescript
// middleware.ts
import NextAuth from 'next-auth';
import authConfig from '@/lib/auth/auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ['/admin/:path*'],
};
```

#### 4. UI Components (Shadcn)

- **Form**: For login and registration forms
- **Input**: For email and password fields
- **Button**: For submit and navigation actions
- **Card**: For form containers
- **Label**: For form field labels
- **Alert**: For error messages
- **Toast**: For success notifications

### API Endpoints

#### Authentication Routes

- `POST /api/auth/signin` - Login endpoint
- `POST /api/auth/signout` - Logout endpoint
- `GET /api/auth/session` - Get current session
- `POST /api/auth/register` - Register new admin (custom endpoint)

### Security Considerations

1. **Password Requirements**:

   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

2. **Session Security**:

   - JWT tokens with secure HTTP-only cookies
   - CSRF protection enabled
   - Session expiry after 24 hours of inactivity

3. **Database Security**:
   - Parameterized queries via Prisma
   - Connection pooling for optimal performance
   - SSL/TLS encryption for database connections

### Testing Checklist

- [ ] User can register with valid email/password
- [ ] Registration fails with invalid email format
- [ ] Registration fails with weak password
- [ ] Registration fails with duplicate email
- [ ] User can login with correct credentials
- [ ] Login fails with incorrect credentials
- [ ] Session persists after page refresh
- [ ] User can logout successfully
- [ ] /admin routes redirect to login when not authenticated
- [ ] /admin routes are accessible when authenticated
- [ ] Session expires after inactivity period

## Future Milestones

### Milestone 2: Client Management

- Realtor CRUD operations
- Profile management with headshots
- Contact information storage

### Milestone 3: Order Management

- Order creation workflow
- Property data management
- Multi-tab interface for different content types

### Milestone 4: Media Handling

- AWS S3 integration
- Image upload and processing with Sharp
- Video upload functionality
- PDF document management

### Milestone 5: Client Delivery Pages

- Public delivery pages with unique slugs
- Gallery views for photos
- Download functionality (individual and bulk)
- Embedded media support (iGUIDE, virtual tours)

### Milestone 6: Production Deployment

- Vercel deployment configuration
- Environment variable management
- Performance optimization
- Security hardening

## Development Workflow

### Initial Setup Commands

```bash
# 1. Initialize Next.js project
npx create-next-app@latest hdphotohub-clone --typescript --tailwind --app

# 2. Install dependencies
npm install @prisma/client prisma
npm install next-auth@beta @auth/prisma-adapter
npm install bcryptjs @types/bcryptjs
npm install zod react-hook-form @hookform/resolvers

# 3. Install Shadcn UI
npx shadcn-ui@latest init
npx shadcn-ui@latest add form input button card label toast alert

# 4. Initialize Prisma
npx prisma init

# 5. Run migrations
npx prisma migrate dev --name init

# 6. Generate Prisma client
npx prisma generate

# 7. Start development server
npm run dev
```

### Git Workflow

```bash
# Initial commit
git init
git add .
git commit -m "Initial project setup with Next.js 14 and authentication"

# Feature branches
git checkout -b feature/auth-implementation
git checkout -b feature/admin-dashboard
git checkout -b feature/client-management
```

## Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Lighthouse Score**: > 90
- **Bundle Size**: < 200KB (initial load)

## Monitoring & Analytics (Future)

- Error tracking with Sentry
- Performance monitoring with Vercel Analytics
- User analytics with Plausible/Umami

## Documentation Requirements

- API documentation with OpenAPI/Swagger
- Component documentation with Storybook
- User guide for admin panel
- Deployment guide for self-hosting
