# Authentication Implementation Research

**Feature**: User Authentication (002-user-auth)
**Date**: 2026-02-05
**Purpose**: Research and document authentication architecture decisions for Better Auth + FastAPI integration

---

## 1. Better Auth Integration with FastAPI

### Decision Made
Implement a **decoupled architecture** where Better Auth handles frontend authentication state in Next.js, while FastAPI independently validates JWT tokens for API authorization.

### Architecture Pattern

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Next.js       │         │   Better Auth    │         │   FastAPI       │
│   Frontend      │────────▶│   (Frontend)     │         │   Backend       │
│                 │         │                  │         │                 │
│  - UI Forms     │         │  - JWT Creation  │         │  - JWT Verify   │
│  - Auth State   │         │  - Session Mgmt  │         │  - User Data    │
│  - Token Store  │         │  - Token Refresh │         │  - Business API │
└─────────────────┘         └──────────────────┘         └─────────────────┘
         │                           │                            ▲
         │                           │                            │
         └───────────────────────────┴────────────────────────────┘
                    JWT Token in Authorization Header
```

### Rationale

1. **Better Auth is Frontend-Focused**: Better Auth is designed as a Next.js/React authentication library, not a backend authentication system. It excels at managing client-side authentication state, token storage, and session persistence.

2. **FastAPI Needs Independent Validation**: The FastAPI backend must independently verify JWT tokens to ensure security. It cannot rely on the frontend's authentication state.

3. **Shared JWT Secret**: Both Better Auth (for token generation) and FastAPI (for token verification) use the same JWT secret key, enabling stateless authentication.

4. **Clear Separation of Concerns**:
   - **Better Auth**: Handles user-facing authentication (login forms, session state, token refresh)
   - **FastAPI**: Handles API authorization (token validation, user identification, data filtering)

### Alternatives Considered

**Alternative 1: Better Auth as Full Stack Solution**
- **Rejected**: Better Auth doesn't have native FastAPI support. It's designed for Next.js API routes, not Python backends.

**Alternative 2: FastAPI-Only Authentication (No Better Auth)**
- **Rejected**: Violates constitutional requirement to use Better Auth. Also requires building custom frontend authentication state management.

**Alternative 3: Better Auth Backend Adapter**
- **Rejected**: No official Better Auth adapter exists for FastAPI. Creating a custom adapter would be complex and unmaintained.

### Implementation Approach

#### Frontend (Next.js + Better Auth)

```typescript
// lib/auth.ts - Better Auth Configuration
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: {
    // Better Auth can use its own session storage or rely on JWT
    type: "jwt-only" // Stateless mode
  },
  jwt: {
    secret: process.env.BETTER_AUTH_SECRET!,
    expiresIn: "24h"
  },
  providers: {
    credentials: {
      enabled: true,
      // Credentials are sent to FastAPI backend for verification
      async authorize(credentials) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials)
        });

        if (!response.ok) return null;

        const data = await response.json();
        return {
          id: data.user_id,
          email: data.email,
          token: data.access_token
        };
      }
    }
  }
});
```

#### Backend (FastAPI + JWT Verification)

```python
# api/dependencies.py - JWT Token Verification
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime
import os

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify JWT token and extract user information.
    This runs on every protected endpoint request.
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            os.getenv("JWT_SECRET"),
            algorithms=["HS256"]
        )

        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        exp: int = payload.get("exp")

        if user_id is None or email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )

        # Check token expiration
        if datetime.utcnow().timestamp() > exp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )

        return {"user_id": user_id, "email": email}

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
```

### Key Integration Points

1. **Shared JWT Secret**: Both systems must use the same secret key (loaded from environment variables)
2. **Token Claims**: JWT tokens must include `sub` (user_id), `email`, `exp` (expiration)
3. **Token Format**: Standard JWT format with HS256 algorithm
4. **Error Handling**: Both systems return 401 Unauthorized for invalid tokens

---

## 2. JWT Token Flow

### Decision Made
Implement **stateless JWT authentication** with httpOnly cookies for token storage and Authorization header for API requests.

### Complete Token Flow

```
┌──────────┐                                                    ┌──────────┐
│  User    │                                                    │ FastAPI  │
│ Browser  │                                                    │ Backend  │
└────┬─────┘                                                    └────┬─────┘
     │                                                                │
     │  1. POST /auth/signup (email, password)                       │
     │───────────────────────────────────────────────────────────────▶
     │                                                                │
     │                    2. Hash password (bcrypt)                  │
     │                    3. Create user in database                 │
     │                    4. Generate JWT token                      │
     │                       - sub: user_id                           │
     │                       - email: user@example.com                │
     │                       - exp: now + 24h                         │
     │                                                                │
     │  5. Return { access_token, user_id, email }                   │
     │◀───────────────────────────────────────────────────────────────
     │                                                                │
     │  6. Store token in httpOnly cookie                            │
     │     (Better Auth handles this)                                │
     │                                                                │
     │  7. GET /todos (Authorization: Bearer <token>)                │
     │───────────────────────────────────────────────────────────────▶
     │                                                                │
     │                    8. Extract token from header               │
     │                    9. Verify JWT signature                    │
     │                    10. Check expiration                       │
     │                    11. Extract user_id from token             │
     │                    12. Query todos WHERE user_id = <id>       │
     │                                                                │
     │  13. Return user's todos                                      │
     │◀───────────────────────────────────────────────────────────────
     │                                                                │
```

### Token Storage Strategy

**Decision**: Use **httpOnly cookies** for token storage (primary) with localStorage as fallback.

**Rationale**:
1. **Security**: httpOnly cookies cannot be accessed by JavaScript, preventing XSS attacks
2. **Automatic Transmission**: Cookies are automatically sent with requests
3. **Better Auth Support**: Better Auth has built-in cookie management
4. **CSRF Protection**: Use sameSite=strict flag to prevent CSRF attacks

**Configuration**:
```typescript
// Better Auth cookie configuration
cookies: {
  accessToken: {
    name: "auth.token",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "strict",
    maxAge: 60 * 60 * 24 // 24 hours
  }
}
```

### Token Generation (Backend)

```python
# services/auth_service.py
from jose import jwt
from datetime import datetime, timedelta
import os

def create_access_token(user_id: str, email: str) -> str:
    """
    Generate JWT token with user claims.
    """
    expire = datetime.utcnow() + timedelta(hours=24)

    payload = {
        "sub": user_id,  # Subject (user identifier)
        "email": email,
        "exp": expire,   # Expiration time
        "iat": datetime.utcnow()  # Issued at
    }

    token = jwt.encode(
        payload,
        os.getenv("JWT_SECRET"),
        algorithm="HS256"
    )

    return token
```

### Token Validation (Backend)

```python
# api/dependencies.py
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Validate JWT token on every protected request.
    """
    token = credentials.credentials

    try:
        # Decode and verify signature
        payload = jwt.decode(
            token,
            os.getenv("JWT_SECRET"),
            algorithms=["HS256"]
        )

        # Extract claims
        user_id = payload.get("sub")
        email = payload.get("email")

        # Validate required claims
        if not user_id or not email:
            raise HTTPException(status_code=401, detail="Invalid token")

        return {"user_id": user_id, "email": email}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Alternatives Considered

**Alternative 1: Refresh Tokens**
- **Rejected**: Adds complexity with token rotation and refresh endpoints. 24-hour expiration is acceptable for a todo app.

**Alternative 2: localStorage for Token Storage**
- **Rejected**: Vulnerable to XSS attacks. httpOnly cookies are more secure.

**Alternative 3: Session-Based Authentication**
- **Rejected**: Requires server-side session storage (Redis/database), adding infrastructure complexity. JWT is stateless and simpler.

---

## 3. Rate Limiting in FastAPI

### Decision Made
Implement **slowapi** library with in-memory storage for rate limiting authentication endpoints.

### Implementation Approach

```python
# main.py - FastAPI Application Setup
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# api/auth.py - Authentication Endpoints
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/auth/signin")
@limiter.limit("5/15minutes")  # 5 attempts per 15 minutes
async def signin(
    credentials: SignInRequest,
    request: Request
):
    """
    Sign in endpoint with rate limiting.
    """
    # Authentication logic here
    pass
```

### Rate Limiting Strategy

**Rule**: 5 failed login attempts per 15 minutes per IP address

**Rationale**:
1. **Brute Force Protection**: Prevents automated password guessing attacks
2. **User-Friendly**: Allows legitimate users to retry typos without excessive lockout
3. **IP-Based**: Tracks attempts by IP address (simple and effective)

### Advanced Rate Limiting (Email-Based)

For production, implement email-based rate limiting in addition to IP-based:

```python
# services/rate_limit.py
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict

class AuthRateLimiter:
    """
    Email-based rate limiting for authentication attempts.
    """
    def __init__(self):
        self.attempts: Dict[str, list] = defaultdict(list)
        self.lockout_duration = timedelta(minutes=15)
        self.max_attempts = 5

    def is_locked(self, email: str) -> bool:
        """
        Check if email is locked due to failed attempts.
        """
        now = datetime.utcnow()

        # Clean old attempts
        self.attempts[email] = [
            attempt for attempt in self.attempts[email]
            if now - attempt < self.lockout_duration
        ]

        return len(self.attempts[email]) >= self.max_attempts

    def record_failed_attempt(self, email: str):
        """
        Record a failed login attempt.
        """
        self.attempts[email].append(datetime.utcnow())

    def clear_attempts(self, email: str):
        """
        Clear attempts on successful login.
        """
        self.attempts[email] = []

# Usage in auth endpoint
rate_limiter = AuthRateLimiter()

@app.post("/auth/signin")
async def signin(credentials: SignInRequest):
    # Check if email is locked
    if rate_limiter.is_locked(credentials.email):
        raise HTTPException(
            status_code=429,
            detail="Too many failed attempts. Try again in 15 minutes."
        )

    # Attempt authentication
    user = await authenticate_user(credentials.email, credentials.password)

    if not user:
        rate_limiter.record_failed_attempt(credentials.email)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Clear attempts on success
    rate_limiter.clear_attempts(credentials.email)

    return {"access_token": create_access_token(user.id, user.email)}
```

### Alternatives Considered

**Alternative 1: Redis-Based Rate Limiting**
- **Pros**: Distributed, persistent, scales across multiple servers
- **Cons**: Requires Redis infrastructure, adds deployment complexity
- **Decision**: Use in-memory for MVP, migrate to Redis if scaling is needed

**Alternative 2: Database-Based Rate Limiting**
- **Pros**: Persistent, no additional infrastructure
- **Cons**: Adds database load, slower than in-memory
- **Decision**: Rejected due to performance concerns

**Alternative 3: No Rate Limiting**
- **Rejected**: Security requirement (FR-022, FR-023) mandates rate limiting

### Best Practices

1. **Return 429 Status Code**: Use HTTP 429 Too Many Requests for rate limit errors
2. **Generic Error Messages**: Don't reveal whether email exists when rate limited
3. **Exponential Backoff**: Consider increasing lockout duration for repeated violations
4. **Monitoring**: Log rate limit violations for security analysis
5. **Whitelist**: Allow bypassing rate limits for trusted IPs (admin, monitoring)

---

## 4. Password Hashing with Bcrypt

### Decision Made
Use **bcrypt with cost factor 12** via the `passlib` library for password hashing.

### Rationale

**Cost Factor 12 Analysis (2026 Standards)**:
- **Security**: Cost factor 12 provides ~4096 iterations (2^12), taking ~250-350ms per hash on modern hardware
- **Brute Force Resistance**: At 350ms per attempt, an attacker can try ~2.8 passwords/second, making brute force impractical
- **User Experience**: 250-350ms hashing time is acceptable for signup/signin operations
- **Future-Proof**: Cost factor 12 remains secure through 2026 and beyond (OWASP recommends 10-12)

**Industry Standards (2026)**:
- OWASP: Recommends bcrypt cost factor 10-12
- NIST: Recommends memory-hard functions (bcrypt qualifies)
- Django: Uses bcrypt with cost factor 12 by default
- Ruby on Rails: Uses bcrypt with cost factor 12

### Implementation Approach

```python
# requirements.txt
passlib[bcrypt]==1.7.4
bcrypt==4.1.2

# services/auth_service.py
from passlib.context import CryptContext

# Initialize password context
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Cost factor 12
)

def hash_password(password: str) -> str:
    """
    Hash password using bcrypt with cost factor 12.

    Args:
        password: Plain text password

    Returns:
        Hashed password string (includes salt and cost factor)
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash.

    Args:
        plain_password: User-provided password
        hashed_password: Stored password hash

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

# Usage in signup endpoint
@app.post("/auth/signup")
async def signup(credentials: SignUpRequest):
    # Hash password before storage
    password_hash = hash_password(credentials.password)

    # Create user with hashed password
    user = User(
        email=credentials.email,
        password_hash=password_hash
    )

    # Save to database
    db.add(user)
    await db.commit()

    return {"message": "User created successfully"}

# Usage in signin endpoint
@app.post("/auth/signin")
async def signin(credentials: SignInRequest):
    # Fetch user from database
    user = await db.get_user_by_email(credentials.email)

    if not user:
        # Generic error - don't reveal if email exists
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate token
    token = create_access_token(user.id, user.email)

    return {"access_token": token, "user_id": user.id, "email": user.email}
```

### Password Hash Format

Bcrypt produces hashes in the format:
```
$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW
 │  │  │                                                    │
 │  │  └─ Salt (22 characters)                             └─ Hash (31 characters)
 │  └─ Cost factor (12)
 └─ Algorithm identifier (2b = bcrypt)
```

### Alternatives Considered

**Alternative 1: Argon2**
- **Pros**: More modern, memory-hard, winner of Password Hashing Competition
- **Cons**: Less widely adopted, requires additional C libraries
- **Decision**: Rejected - bcrypt is industry standard and meets security requirements

**Alternative 2: PBKDF2**
- **Pros**: NIST-approved, built into Python standard library
- **Cons**: Less resistant to GPU/ASIC attacks than bcrypt
- **Decision**: Rejected - bcrypt provides better security

**Alternative 3: Scrypt**
- **Pros**: Memory-hard, resistant to hardware attacks
- **Cons**: Less widely adopted, more complex configuration
- **Decision**: Rejected - bcrypt is simpler and sufficient

**Alternative 4: Lower Cost Factor (10)**
- **Pros**: Faster hashing (~100ms)
- **Cons**: Less secure against future hardware improvements
- **Decision**: Rejected - cost factor 12 is recommended standard

**Alternative 5: Higher Cost Factor (14)**
- **Pros**: More secure
- **Cons**: Slower hashing (~1 second), poor user experience
- **Decision**: Rejected - cost factor 12 balances security and UX

### Security Best Practices

1. **Never Store Plain Text**: Always hash passwords before database storage
2. **Salt Included**: Bcrypt automatically generates and includes salt in hash
3. **Timing Attack Protection**: Use constant-time comparison (passlib handles this)
4. **Password Requirements**: Enforce complexity rules before hashing (FR-005)
5. **Hash Verification**: Always use `verify_password()`, never compare hashes directly

---

## 5. Better Auth Configuration

### Decision Made
Configure Better Auth in **JWT-only mode** with credentials provider for email/password authentication.

### Complete Better Auth Setup

```typescript
// lib/auth.ts - Better Auth Configuration
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next";

export const auth = betterAuth({
  // Database configuration (JWT-only mode)
  database: {
    type: "jwt-only",  // No session storage in database
  },

  // JWT configuration
  jwt: {
    secret: process.env.BETTER_AUTH_SECRET!,
    expiresIn: "24h",
    algorithm: "HS256"
  },

  // Cookie configuration
  cookies: {
    accessToken: {
      name: "auth.token",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/"
    }
  },

  // Authentication providers
  providers: {
    credentials: {
      enabled: true,

      // Custom authorization logic (calls FastAPI backend)
      async authorize(credentials: { email: string; password: string }) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/signin`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(credentials)
            }
          );

          if (!response.ok) {
            return null; // Authentication failed
          }

          const data = await response.json();

          return {
            id: data.user_id,
            email: data.email,
            token: data.access_token
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    }
  },

  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 // 24 hours
  },

  // Callbacks for customization
  callbacks: {
    async jwt({ token, user }) {
      // Add user info to JWT token
      if (user) {
        token.userId = user.id;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      // Add user info to session
      if (token) {
        session.user.id = token.userId;
        session.user.email = token.email;
      }
      return session;
    }
  },

  // Pages configuration
  pages: {
    signIn: "/signin",
    signUp: "/signup",
    error: "/auth/error"
  },

  // Security options
  security: {
    csrf: {
      enabled: true,
      tokenLength: 32
    }
  }
});

// Export auth handlers for Next.js API routes
export const { handlers, auth: getSession } = auth;
```

### API Route Setup (Next.js App Router)

```typescript
// app/api/auth/[...betterauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### Frontend Authentication Hook

```typescript
// lib/hooks/useAuth.ts
import { useSession } from "better-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    token: session?.user?.token
  };
}
```

### Protected Route Middleware

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await getSession();

  // Protect /todos routes
  if (request.nextUrl.pathname.startsWith("/todos")) {
    if (!session) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith("/signin") ||
      request.nextUrl.pathname.startsWith("/signup")) {
    if (session) {
      return NextResponse.redirect(new URL("/todos", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/todos/:path*", "/signin", "/signup"]
};
```

### Environment Variables

```bash
# .env.local (Frontend)
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development

# .env (Backend)
JWT_SECRET=your-secret-key-min-32-chars  # Must match BETTER_AUTH_SECRET
DATABASE_URL=postgresql://user:pass@host/db
```

### Alternatives Considered

**Alternative 1: Better Auth with Database Sessions**
- **Pros**: Server-side session storage, can revoke sessions
- **Cons**: Requires database queries on every request, adds complexity
- **Decision**: Rejected - JWT-only mode is simpler and stateless

**Alternative 2: NextAuth.js**
- **Pros**: More mature, larger community
- **Cons**: Not specified in constitution (Better Auth is mandated)
- **Decision**: Rejected - must use Better Auth per requirements

**Alternative 3: Custom JWT Implementation**
- **Pros**: Full control, no external dependencies
- **Cons**: Reinventing the wheel, security risks, violates Better Auth requirement
- **Decision**: Rejected - Better Auth provides tested implementation

### Integration with FastAPI Backend

**Token Flow**:
1. User submits credentials via Better Auth form
2. Better Auth calls FastAPI `/auth/signin` endpoint
3. FastAPI validates credentials and returns JWT token
4. Better Auth stores token in httpOnly cookie
5. Frontend includes token in Authorization header for API requests
6. FastAPI validates token on each request

**Key Points**:
- Better Auth manages frontend state and token storage
- FastAPI handles actual authentication logic and token generation
- Both systems share the same JWT secret for token verification
- Tokens are stateless (no database lookups required)

---

## Summary of Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| **Architecture** | Decoupled: Better Auth (frontend) + FastAPI (backend) | Clear separation of concerns, leverages each tool's strengths |
| **Token Storage** | httpOnly cookies (primary) | Security against XSS attacks, automatic transmission |
| **Token Expiration** | 24 hours | Balances security and user convenience |
| **Rate Limiting** | slowapi with 5 attempts/15 min | Prevents brute force, user-friendly |
| **Password Hashing** | bcrypt cost factor 12 via passlib | Industry standard, secure for 2026, good UX |
| **Better Auth Mode** | JWT-only (stateless) | Simpler architecture, no session database needed |

---

## Implementation Checklist

- [ ] Install dependencies: `better-auth`, `slowapi`, `passlib[bcrypt]`, `python-jose`
- [ ] Configure Better Auth in Next.js with JWT-only mode
- [ ] Implement FastAPI authentication endpoints (signup, signin, logout)
- [ ] Add JWT verification dependency to protected routes
- [ ] Implement rate limiting on authentication endpoints
- [ ] Set up password hashing with bcrypt cost factor 12
- [ ] Configure environment variables (JWT_SECRET, BETTER_AUTH_SECRET)
- [ ] Create User model in database with SQLModel
- [ ] Add authentication middleware to Next.js
- [ ] Implement frontend authentication forms (signin, signup)
- [ ] Add token storage and retrieval logic
- [ ] Write unit tests for authentication service
- [ ] Write integration tests for authentication flow
- [ ] Write E2E tests for complete user journey
- [ ] Document API endpoints in OpenAPI spec
- [ ] Add security headers (CORS, CSP, HSTS)

---

## Security Considerations

1. **JWT Secret Management**: Store in environment variables, never commit to version control
2. **HTTPS Enforcement**: Required in production for secure token transmission
3. **CORS Configuration**: Restrict to frontend domain only
4. **Rate Limiting**: Implement both IP-based and email-based rate limiting
5. **Generic Error Messages**: Never reveal whether email exists in error responses
6. **Password Requirements**: Enforce complexity rules (FR-005)
7. **Token Expiration**: 24-hour expiration with no automatic refresh
8. **httpOnly Cookies**: Prevent JavaScript access to tokens
9. **CSRF Protection**: Enable CSRF tokens in Better Auth
10. **Audit Logging**: Log all authentication events for security monitoring

---

## Performance Considerations

1. **Bcrypt Hashing Time**: ~250-350ms per operation (acceptable for auth endpoints)
2. **JWT Verification**: <10ms per request (minimal overhead)
3. **Rate Limiting**: In-memory storage for fast lookups
4. **Database Queries**: Single query for user lookup during signin
5. **Token Size**: JWT tokens ~200-300 bytes (minimal network overhead)

---

## References

- Better Auth Documentation: https://better-auth.com
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
- OWASP Password Storage: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- slowapi Documentation: https://github.com/laurentS/slowapi
- passlib Documentation: https://passlib.readthedocs.io/
