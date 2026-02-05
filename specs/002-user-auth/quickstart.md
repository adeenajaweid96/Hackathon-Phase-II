# Quickstart Guide: User Authentication

**Date**: 2026-02-05
**Feature**: 002-user-auth
**Purpose**: Setup instructions and testing guide for user authentication

## Prerequisites

Before starting, ensure you have:

- **Python 3.11+** installed
- **Node.js 18+** and npm/pnpm installed
- **Neon PostgreSQL** account (sign up at https://neon.tech)
- **Git** for version control
- **Existing backend** from specs/001-todo-backend-api (completed)

## 1. Backend Setup (Authentication Endpoints)

### 1.1 Install Additional Dependencies

```bash
cd backend
pip install bcrypt passlib[bcrypt] slowapi
```

**New dependencies**:
- `bcrypt`: Password hashing library
- `passlib[bcrypt]`: Password hashing utilities
- `slowapi`: Rate limiting for FastAPI

### 1.2 Update Environment Variables

Edit `backend/.env` to add authentication configuration:

```env
# Existing configuration
DATABASE_URL=postgresql+asyncpg://user:password@host.neon.tech/dbname?sslmode=require
SECRET_KEY=your-jwt-secret-key-here
ALGORITHM=HS256

# New: Better Auth configuration
BETTER_AUTH_SECRET=your-better-auth-secret-here
BETTER_AUTH_URL=http://localhost:3000

# New: Rate limiting configuration
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=5
```

**Important**: Generate secure secrets:
```bash
# Generate JWT secret
openssl rand -hex 32

# Generate Better Auth secret
openssl rand -hex 32
```

### 1.3 Run Database Migration

Create and apply the users table migration:

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "Create users table"

# Apply migration
alembic upgrade head
```

**Verify migration**:
```bash
# Connect to Neon database and verify users table exists
psql $DATABASE_URL -c "\d users"
```

Expected output:
```
                                Table "public.users"
       Column        |            Type             | Nullable |      Default
---------------------+-----------------------------+----------+-------------------
 id                  | uuid                        | not null | uuid_generate_v4()
 email               | character varying(255)      | not null |
 password_hash       | character varying(255)      | not null |
 created_at          | timestamp without time zone | not null | now()
 last_login_at       | timestamp without time zone |          |
 is_active           | boolean                     | not null | true
 failed_login_attempts| integer                    | not null | 0
 locked_until        | timestamp without time zone |          |
```

### 1.4 Start Backend Server

```bash
cd backend
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Application startup complete.
```

**Verify authentication endpoints**:
- Navigate to http://localhost:8000/docs
- You should see new endpoints: `/api/auth/signup`, `/api/auth/signin`, `/api/auth/logout`, `/api/auth/me`

## 2. Frontend Setup (Next.js with Better Auth)

### 2.1 Create Next.js Application

```bash
# From project root
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir

cd frontend
```

### 2.2 Install Better Auth and Dependencies

```bash
npm install better-auth @better-auth/react
npm install -D @types/node
```

### 2.3 Configure Environment Variables

Create `frontend/.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth configuration
BETTER_AUTH_SECRET=your-better-auth-secret-here
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# JWT configuration (must match backend)
JWT_SECRET=your-jwt-secret-key-here
```

**Important**: Use the same secrets as backend for JWT validation.

### 2.4 Start Frontend Development Server

```bash
cd frontend
npm run dev
```

**Expected output**:
```
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

## 3. Testing the Authentication Flow

### 3.1 Test User Signup (Backend API)

**Using curl**:
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response** (201 Created):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "testuser@example.com",
    "created_at": "2026-02-05T10:30:00Z",
    "last_login_at": "2026-02-05T10:30:00Z"
  }
}
```

**Save the access_token** for subsequent requests.

### 3.2 Test User Signin (Backend API)

```bash
curl -X POST http://localhost:8000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "testuser@example.com",
    "created_at": "2026-02-05T10:30:00Z",
    "last_login_at": "2026-02-05T11:45:00Z"
  }
}
```

### 3.3 Test Protected Endpoint (Get Current User)

```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "testuser@example.com",
  "created_at": "2026-02-05T10:30:00Z",
  "last_login_at": "2026-02-05T11:45:00Z"
}
```

### 3.4 Test Rate Limiting

Attempt to sign in with incorrect password 6 times:

```bash
# Attempt 1-5 (should return 401)
for i in {1..5}; do
  curl -X POST http://localhost:8000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email": "testuser@example.com", "password": "WrongPassword"}'
  echo "\nAttempt $i"
done

# Attempt 6 (should return 429 - account locked)
curl -X POST http://localhost:8000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser@example.com", "password": "WrongPassword"}'
```

**Expected Response for Attempt 6** (429 Too Many Requests):
```json
{
  "error": "Too Many Requests",
  "detail": "Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes."
}
```

### 3.5 Test Frontend Authentication Flow

1. **Navigate to signup page**: http://localhost:3000/signup
2. **Fill in registration form**:
   - Email: `newuser@example.com`
   - Password: `SecurePass123!`
3. **Click "Sign Up"**
4. **Verify redirect** to todos page (http://localhost:3000/todos)
5. **Verify authentication state** persists after page refresh

**Test signin**:
1. **Logout** (click logout button)
2. **Navigate to signin page**: http://localhost:3000/signin
3. **Fill in credentials**:
   - Email: `newuser@example.com`
   - Password: `SecurePass123!`
4. **Click "Sign In"**
5. **Verify redirect** to todos page

## 4. Integration with Existing Todo API

### 4.1 Test Authenticated Todo Access

After signing in, test that todo endpoints require authentication:

```bash
# Get todos (should work with valid token)
curl -X GET http://localhost:8000/api/todos \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"

# Get todos (should fail without token)
curl -X GET http://localhost:8000/api/todos
```

**Expected Response without token** (401 Unauthorized):
```json
{
  "error": "Unauthorized",
  "detail": "Could not validate credentials"
}
```

### 4.2 Test Multi-User Data Isolation

Create two users and verify they cannot access each other's todos:

```bash
# User 1: Sign up
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user1@example.com", "password": "SecurePass123!"}'
# Save user1_token

# User 2: Sign up
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user2@example.com", "password": "SecurePass123!"}'
# Save user2_token

# User 1: Create todo
curl -X POST http://localhost:8000/api/todos \
  -H "Authorization: Bearer $user1_token" \
  -H "Content-Type: application/json" \
  -d '{"title": "User 1 Todo", "description": "Private to user 1"}'

# User 2: Try to get User 1's todos (should return empty array)
curl -X GET http://localhost:8000/api/todos \
  -H "Authorization: Bearer $user2_token"
```

**Expected Response for User 2** (200 OK with empty array):
```json
[]
```

## 5. Running Automated Tests

### 5.1 Backend Tests

```bash
cd backend
pytest tests/test_auth_api.py -v
```

**Expected output**:
```
tests/test_auth_api.py::test_signup_success PASSED
tests/test_auth_api.py::test_signup_duplicate_email PASSED
tests/test_auth_api.py::test_signup_weak_password PASSED
tests/test_auth_api.py::test_signin_success PASSED
tests/test_auth_api.py::test_signin_invalid_credentials PASSED
tests/test_auth_api.py::test_signin_rate_limiting PASSED
tests/test_auth_api.py::test_get_current_user PASSED
tests/test_auth_api.py::test_logout PASSED

======================== 8 passed in 3.45s ========================
```

### 5.2 Frontend Tests

```bash
cd frontend
npm test
```

### 5.3 End-to-End Tests

```bash
cd frontend
npx playwright test tests/e2e/auth.spec.ts
```

## 6. Common Troubleshooting

### Issue: Database Connection Failed

**Symptoms**:
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solutions**:
1. Verify Neon connection string in `.env`
2. Ensure `postgresql+asyncpg://` prefix (not just `postgresql://`)
3. Check if Neon project is active
4. Verify network connectivity

### Issue: JWT Token Invalid

**Symptoms**:
```
401 Unauthorized: Could not validate credentials
```

**Solutions**:
1. Verify `SECRET_KEY` in backend `.env` matches token generation
2. Check token hasn't expired (24 hours)
3. Ensure `Authorization: Bearer <token>` header format
4. Verify token is properly encoded (no extra spaces)

### Issue: Password Validation Fails

**Symptoms**:
```
400 Bad Request: Password must contain at least one uppercase letter
```

**Solutions**:
1. Ensure password meets all requirements:
   - At least 8 characters
   - At least one uppercase letter (A-Z)
   - At least one lowercase letter (a-z)
   - At least one number (0-9)
   - At least one special character (!@#$%^&*(),.?":{}|<>)

### Issue: Account Locked

**Symptoms**:
```
429 Too Many Requests: Account temporarily locked
```

**Solutions**:
1. Wait 15 minutes for automatic lockout expiration
2. Or manually reset in database:
   ```sql
   UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = 'user@example.com';
   ```

### Issue: Better Auth Configuration Error

**Symptoms**:
```
Error: BETTER_AUTH_SECRET is not defined
```

**Solutions**:
1. Ensure `.env.local` exists in frontend directory
2. Verify `BETTER_AUTH_SECRET` is set
3. Restart Next.js dev server after changing environment variables

## 7. Performance Testing

### 7.1 Basic Load Test

```bash
# Install Apache Bench (if not installed)
# On macOS: brew install httpd
# On Ubuntu: sudo apt-get install apache2-utils

# Test signin endpoint
ab -n 1000 -c 10 -p signin.json -T application/json \
  http://localhost:8000/api/auth/signin
```

**signin.json**:
```json
{"email": "testuser@example.com", "password": "SecurePass123!"}
```

**Target Performance**:
- Signin: <500ms average (including bcrypt verification)
- Signup: <1 minute average
- Token validation: <10ms average

### 7.2 Monitor Performance

```bash
# Enable SQL query logging
# In backend/.env, set: DEBUG=True

# Watch logs for slow queries
tail -f logs/app.log | grep "slow query"
```

## 8. Next Steps

After completing the quickstart:

1. ✅ Verify all 4 authentication endpoints work correctly
2. ✅ Test rate limiting and account lockout
3. ✅ Verify multi-user data isolation
4. ✅ Test frontend authentication flow
5. ⏭️ Implement additional features (password reset, email verification)
6. ⏭️ Set up CI/CD pipeline
7. ⏭️ Configure production environment
8. ⏭️ Implement monitoring and logging

## 9. Additional Resources

- **Better Auth Documentation**: https://better-auth.com/docs
- **FastAPI Security**: https://fastapi.tiangolo.com/tutorial/security/
- **Next.js Authentication**: https://nextjs.org/docs/authentication
- **Bcrypt Best Practices**: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

## Support

For issues or questions:
1. Check this quickstart guide
2. Review API documentation at http://localhost:8000/docs
3. Check the troubleshooting section above
4. Review specification at `specs/002-user-auth/spec.md`
5. Contact the development team

---

**Last Updated**: 2026-02-05
**Version**: 1.0.0
