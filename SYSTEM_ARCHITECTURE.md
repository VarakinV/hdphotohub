# System Architecture Diagrams

## Overall System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        PublicPage[Public Delivery Page]
        AdminUI[Admin Dashboard]
    end

    subgraph "Application Layer - Next.js 14"
        AppRouter[App Router]
        AuthMiddleware[Auth Middleware]
        APIRoutes[API Routes]
        ServerComponents[Server Components]
        ClientComponents[Client Components]
    end

    subgraph "Authentication Layer"
        AuthJS[Auth.js]
        CredProvider[Credentials Provider]
        SessionMgmt[Session Management]
        JWT[JWT Tokens]
    end

    subgraph "Data Layer"
        Prisma[Prisma ORM]
        PostgreSQL[PostgreSQL - Neon]
    end

    subgraph "Storage Layer - Future"
        S3[AWS S3]
        Sharp[Sharp Image Processing]
    end

    Browser --> AppRouter
    AppRouter --> AuthMiddleware
    AuthMiddleware --> AdminUI
    AuthMiddleware --> PublicPage

    AdminUI --> ServerComponents
    PublicPage --> ServerComponents
    ServerComponents --> APIRoutes

    APIRoutes --> AuthJS
    AuthJS --> CredProvider
    AuthJS --> SessionMgmt
    SessionMgmt --> JWT

    APIRoutes --> Prisma
    Prisma --> PostgreSQL

    APIRoutes -.-> S3
    APIRoutes -.-> Sharp
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS
    participant AuthJS
    participant Prisma
    participant Database

    alt Registration
        User->>Browser: Enter email/password
        Browser->>NextJS: POST /api/auth/register
        NextJS->>NextJS: Validate input
        NextJS->>NextJS: Hash password (bcrypt)
        NextJS->>Prisma: Create user
        Prisma->>Database: INSERT user
        Database-->>Prisma: User created
        Prisma-->>NextJS: User object
        NextJS-->>Browser: Success response
        Browser-->>User: Redirect to login
    end

    alt Login
        User->>Browser: Enter credentials
        Browser->>NextJS: POST /api/auth/signin
        NextJS->>AuthJS: Authorize credentials
        AuthJS->>Prisma: Get user by email
        Prisma->>Database: SELECT user
        Database-->>Prisma: User data
        Prisma-->>AuthJS: User object
        AuthJS->>AuthJS: Verify password
        AuthJS->>AuthJS: Create JWT token
        AuthJS-->>NextJS: Session created
        NextJS-->>Browser: Set cookie + redirect
        Browser-->>User: Admin dashboard
    end

    alt Protected Route Access
        User->>Browser: Navigate to /admin
        Browser->>NextJS: GET /admin
        NextJS->>AuthMiddleware: Check auth
        AuthMiddleware->>AuthJS: Verify session
        AuthJS->>AuthJS: Validate JWT
        alt Valid Session
            AuthJS-->>AuthMiddleware: Authorized
            AuthMiddleware-->>NextJS: Allow access
            NextJS-->>Browser: Admin page
        else Invalid Session
            AuthJS-->>AuthMiddleware: Unauthorized
            AuthMiddleware-->>NextJS: Redirect
            NextJS-->>Browser: Login page
        end
    end
```

## Database Schema

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string password
        string name
        string image
        Role role
        datetime createdAt
        datetime updatedAt
    }

    Realtor {
        string id PK
        string name
        string email
        string phone
        string headshot
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    Order {
        string id PK
        string realtorId FK
        string slug UK
        OrderStatus status
        datetime publishedAt
        datetime createdAt
        datetime updatedAt
    }

    Property {
        string id PK
        string orderId FK
        string address
        int sqft
        int yearBuilt
        string mlsNumber
        decimal price
        int beds
        int baths
        text description
    }

    Photo {
        string id PK
        string orderId FK
        string originalUrl
        string mlsUrl
        string filename
        int orderIndex
        datetime createdAt
    }

    Video {
        string id PK
        string orderId FK
        string url
        string filename
        datetime createdAt
    }

    FloorPlan {
        string id PK
        string orderId FK
        string url
        string filename
        datetime createdAt
    }

    Attachment {
        string id PK
        string orderId FK
        string url
        string filename
        string fileType
        datetime createdAt
    }

    EmbeddedMedia {
        string id PK
        string orderId FK
        string url
        MediaType type
        datetime createdAt
    }

    User ||--o{ Realtor : creates
    Realtor ||--o{ Order : has
    Order ||--|| Property : contains
    Order ||--o{ Photo : includes
    Order ||--o{ Video : includes
    Order ||--o{ FloorPlan : includes
    Order ||--o{ Attachment : includes
    Order ||--o{ EmbeddedMedia : includes
```

## Component Architecture

```mermaid
graph TD
    subgraph "App Router Structure"
        Root[app/]
        Root --> AuthGroup["(auth)/"]
        Root --> AdminGroup[admin/]
        Root --> APIGroup[api/]

        AuthGroup --> LoginPage[login/page.tsx]
        AuthGroup --> RegisterPage[register/page.tsx]

        AdminGroup --> AdminLayout[layout.tsx]
        AdminGroup --> Dashboard[dashboard/page.tsx]
        AdminGroup --> Realtors[realtors/]
        AdminGroup --> Orders[orders/]

        APIGroup --> AuthAPI["auth/[...nextauth]/route.ts"]
        APIGroup --> RegisterAPI[register/route.ts]
    end

    subgraph "Component Library"
        Components[components/]
        Components --> AuthComps[auth/]
        Components --> UIComps[ui/]
        Components --> Providers[providers/]

        AuthComps --> LoginForm[login-form.tsx]
        AuthComps --> RegisterForm[register-form.tsx]
        AuthComps --> LogoutButton[logout-button.tsx]

        UIComps --> ShadcnUI[Shadcn Components]

        Providers --> SessionProvider[session-provider.tsx]
    end

    subgraph "Core Libraries"
        Lib[lib/]
        Lib --> AuthLib[auth/]
        Lib --> DBLib[db/]
        Lib --> Utils[utils/]

        AuthLib --> AuthConfig[auth.config.ts]
        AuthLib --> AuthCore[auth.ts]

        DBLib --> PrismaClient[prisma.ts]

        Utils --> PasswordUtil[password.ts]
    end
```

## Deployment Architecture

```mermaid
graph LR
    subgraph "Development"
        LocalDev[Local Development]
        LocalDB[Local PostgreSQL]
    end

    subgraph "Version Control"
        GitHub[GitHub Repository]
    end

    subgraph "CI/CD"
        VercelCI[Vercel CI/CD]
    end

    subgraph "Production - Vercel"
        VercelApp[Next.js Application]
        EdgeFunc[Edge Functions]
        CDN[Vercel CDN]
    end

    subgraph "External Services"
        NeonDB[Neon PostgreSQL]
        AWSS3[AWS S3]
    end

    LocalDev --> GitHub
    GitHub --> VercelCI
    VercelCI --> VercelApp
    VercelApp --> EdgeFunc
    EdgeFunc --> CDN

    VercelApp --> NeonDB
    VercelApp --> AWSS3

    LocalDev -.-> LocalDB
    LocalDev -.-> NeonDB
```

## Request Flow for Milestone 1

```mermaid
flowchart TD
    Start([User Request]) --> Router{Route Type?}

    Router -->|Public| PublicRoute[Public Page]
    Router -->|Auth| AuthRoute[Auth Pages]
    Router -->|Admin| Middleware[Auth Middleware]

    Middleware --> CheckAuth{Authenticated?}
    CheckAuth -->|No| Redirect[Redirect to Login]
    CheckAuth -->|Yes| AdminPage[Admin Dashboard]

    AuthRoute --> LoginCheck{Login or Register?}
    LoginCheck -->|Login| LoginForm[Login Form]
    LoginCheck -->|Register| RegisterForm[Register Form]

    LoginForm --> ValidateCreds[Validate Credentials]
    ValidateCreds --> AuthJS[Auth.js Provider]
    AuthJS --> DBQuery[Database Query]
    DBQuery --> VerifyPass{Password Match?}
    VerifyPass -->|Yes| CreateSession[Create Session]
    VerifyPass -->|No| LoginError[Show Error]

    RegisterForm --> ValidateInput[Validate Input]
    ValidateInput --> HashPass[Hash Password]
    HashPass --> CreateUser[Create User in DB]
    CreateUser --> RegSuccess[Registration Success]

    CreateSession --> SetCookie[Set JWT Cookie]
    SetCookie --> AdminPage

    AdminPage --> RenderDashboard[Render Dashboard]
    PublicRoute --> RenderPublic[Render Public Page]

    RenderDashboard --> End([Response])
    RenderPublic --> End
    LoginError --> End
    RegSuccess --> End
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        Input[User Input]
        Input --> Validation[Input Validation]
        Validation --> Sanitization[Data Sanitization]

        subgraph "Authentication"
            Sanitization --> PassHash[Password Hashing - Bcrypt]
            PassHash --> AuthCheck[Auth.js Verification]
            AuthCheck --> JWTGen[JWT Generation]
        end

        subgraph "Authorization"
            JWTGen --> RouteProtect[Route Protection]
            RouteProtect --> RoleCheck[Role-Based Access]
        end

        subgraph "Data Protection"
            RoleCheck --> Prisma[Prisma ORM]
            Prisma --> ParamQueries[Parameterized Queries]
            ParamQueries --> SSL[SSL/TLS Encryption]
            SSL --> Database[(Neon PostgreSQL)]
        end

        subgraph "Session Security"
            JWTGen --> HTTPOnly[HTTP-Only Cookies]
            HTTPOnly --> CSRF[CSRF Protection]
            CSRF --> SessionExp[Session Expiry]
        end
    end
```

## File Upload Flow (Future Implementation)

```mermaid
sequenceDiagram
    participant Admin
    participant Browser
    participant NextJS
    participant Sharp
    participant S3
    participant Database

    Admin->>Browser: Select images
    Browser->>Browser: Client-side validation
    Browser->>NextJS: POST /api/upload
    NextJS->>NextJS: Validate file type/size

    alt Image Processing
        NextJS->>Sharp: Process image
        Sharp->>Sharp: Create print version
        Sharp->>Sharp: Create MLS version (1280px)
        Sharp-->>NextJS: Processed images
    end

    NextJS->>S3: Upload original
    S3-->>NextJS: Original URL
    NextJS->>S3: Upload MLS version
    S3-->>NextJS: MLS URL

    NextJS->>Database: Save URLs
    Database-->>NextJS: Saved
    NextJS-->>Browser: Upload complete
    Browser-->>Admin: Show success
```
