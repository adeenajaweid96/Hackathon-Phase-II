# Quickstart Guide: Todo Web Application Frontend

**Date**: 2026-02-05
**Feature**: 003-todo-frontend
**Purpose**: Setup instructions and testing guide for the frontend application

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** and npm/pnpm installed
- **Backend API running** (specs/001-todo-backend-api and specs/002-user-auth completed)
- **Backend URL** accessible (e.g., http://localhost:8000)
- **Git** for version control

## 1. Frontend Setup

### 1.1 Create Next.js Application

```bash
# From project root
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir

# Navigate to frontend directory
cd frontend
```

**Configuration prompts**:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No (use app/ directory directly)
- App Router: Yes
- Import alias: Yes (@/*)

### 1.2 Install Dependencies

```bash
# Core dependencies
npm install better-auth @better-auth/react
npm install @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install sonner  # Toast notifications

# Dev dependencies
npm install -D @types/node @types/react @types/react-dom
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
```

**Dependency purposes**:
- `better-auth`: Authentication library with JWT support
- `@tanstack/react-query`: Server state management and caching
- `react-hook-form`: Form state management
- `zod`: Schema validation
- `sonner`: Toast notifications for user feedback

### 1.3 Configure Environment Variables

Create `frontend/.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth configuration
BETTER_AUTH_SECRET=your-better-auth-secret-here
BETTER_AUTH_URL=http://localhost:3000

# JWT configuration (must match backend)
JWT_SECRET=your-jwt-secret-key-here
```

**Important**:
- `BETTER_AUTH_SECRET` and `JWT_SECRET` must match the backend configuration
- Generate secrets using: `openssl rand -hex 32`
- Never commit `.env.local` to version control

Create `frontend/.env.local.example` for documentation:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=generate-with-openssl-rand-hex-32
BETTER_AUTH_URL=http://localhost:3000
JWT_SECRET=must-match-backend-jwt-secret
```

### 1.4 Configure Next.js

Update `frontend/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // API rewrites for development (optional)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

### 1.5 Start Development Server

```bash
cd frontend
npm run dev
```

**Expected output**:
```
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Ready in 2.1s
```

## 2. Verify Backend APIs

Before testing the frontend, ensure backend APIs are running:

### 2.1 Check Backend Health

```bash
curl http://localhost:8000/health
```

**Expected response**:
```json
{"status": "healthy"}
```

### 2.2 Verify Authentication Endpoints

```bash
# Check signup endpoint
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'
```

**Expected response** (201 Created):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test@example.com",
    "created_at": "2026-02-05T10:30:00Z",
    "last_login_at": "2026-02-05T10:30:00Z"
  }
}
```

### 2.3 Verify Todos Endpoints

```bash
# Get todos (requires authentication)
curl -X GET http://localhost:8000/api/todos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected response** (200 OK):
```json
{
  "todos": []
}
```

## 3. Testing the Frontend

### 3.1 Test Authentication Flow (Manual)

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

### 3.2 Test Todo Management (Manual)

After signing in:

1. **Create a todo**:
   - Click "Add Todo" button
   - Enter title: "Buy groceries"
   - Enter description: "Milk, eggs, bread"
   - Click "Create"
   - Verify todo appears in list

2. **Complete a todo**:
   - Click checkbox next to todo
   - Verify todo is marked as complete (visual change)

3. **Edit a todo**:
   - Click edit button on todo
   - Modify title: "Buy groceries and snacks"
   - Click "Save"
   - Verify changes are reflected

4. **Delete a todo**:
   - Click delete button on todo
   - Confirm deletion in dialog
   - Verify todo is removed from list

### 3.3 Test Error Handling

**Test invalid credentials**:
1. Navigate to signin page
2. Enter incorrect password
3. Verify error message: "Invalid email or password"

**Test network errors**:
1. Stop backend server
2. Try to create a todo
3. Verify error message: "Unable to connect to server"

**Test session expiration**:
1. Sign in
2. Wait 24 hours (or manually expire token)
3. Try to access todos page
4. Verify redirect to signin page with message

### 3.4 Test Responsive Design

**Desktop (1920px)**:
- Open browser at full width
- Verify layout uses full width
- Verify navigation is horizontal

**Tablet (768px)**:
- Resize browser to 768px width
- Verify layout adapts to smaller screen
- Verify navigation remains usable

**Mobile (375px)**:
- Resize browser to 375px width
- Verify layout is single column
- Verify forms are touch-friendly
- Verify buttons are large enough for touch

## 4. Running Automated Tests

### 4.1 Unit Tests (Jest + React Testing Library)

```bash
cd frontend
npm test
```

**Expected output**:
```
PASS  tests/unit/components/auth/SignInForm.test.tsx
PASS  tests/unit/components/todos/TodoItem.test.tsx
PASS  tests/unit/lib/api-client.test.ts

Test Suites: 10 passed, 10 total
Tests:       45 passed, 45 total
```

### 4.2 End-to-End Tests (Playwright)

```bash
cd frontend
npx playwright test
```

**Expected output**:
```
Running 15 tests using 3 workers

  ✓ tests/e2e/auth.spec.ts:10:5 › User can sign up (5s)
  ✓ tests/e2e/auth.spec.ts:25:5 › User can sign in (3s)
  ✓ tests/e2e/todos.spec.ts:10:5 › User can create todo (4s)
  ✓ tests/e2e/todos.spec.ts:25:5 › User can complete todo (3s)
  ✓ tests/e2e/todos.spec.ts:40:5 › User can delete todo (3s)

  15 passed (45s)
```

### 4.3 Test Coverage

```bash
npm test -- --coverage
```

**Target coverage**:
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

## 5. Common Issues and Troubleshooting

### Issue: "Cannot connect to backend API"

**Symptoms**:
```
Error: Failed to fetch
Network request failed
```

**Solutions**:
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Verify CORS is enabled on backend
4. Check browser console for CORS errors

### Issue: "Authentication token invalid"

**Symptoms**:
```
401 Unauthorized: Could not validate credentials
```

**Solutions**:
1. Verify `JWT_SECRET` matches between frontend and backend
2. Check token hasn't expired (24 hours)
3. Clear browser cookies and sign in again
4. Verify Better Auth configuration

### Issue: "Better Auth configuration error"

**Symptoms**:
```
Error: BETTER_AUTH_SECRET is not defined
```

**Solutions**:
1. Ensure `.env.local` exists in frontend directory
2. Verify `BETTER_AUTH_SECRET` is set
3. Restart Next.js dev server after changing environment variables
4. Check environment variable naming (must start with `NEXT_PUBLIC_` for client-side access)

### Issue: "Todos not loading"

**Symptoms**:
- Empty todos list when user has todos
- Loading spinner never disappears

**Solutions**:
1. Check browser console for API errors
2. Verify authentication token is being sent in requests
3. Check backend logs for errors
4. Verify user ID in token matches todos in database

### Issue: "Form validation not working"

**Symptoms**:
- Form submits with invalid data
- No validation errors displayed

**Solutions**:
1. Check Zod schema definitions
2. Verify React Hook Form integration
3. Check browser console for validation errors
4. Ensure error messages are being displayed in UI

## 6. Development Workflow

### 6.1 Making Changes

1. **Create a new branch**:
   ```bash
   git checkout -b feature/add-todo-filters
   ```

2. **Make changes** to components, pages, or utilities

3. **Test changes**:
   ```bash
   npm test
   npm run build  # Verify production build works
   ```

4. **Commit changes**:
   ```bash
   git add .
   git commit -m "Add todo filtering by status"
   ```

### 6.2 Code Quality Checks

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

### 6.3 Building for Production

```bash
cd frontend
npm run build
npm start  # Start production server
```

**Expected output**:
```
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Production build ready
```

## 7. Performance Testing

### 7.1 Lighthouse Audit

1. Open Chrome DevTools
2. Navigate to Lighthouse tab
3. Run audit for:
   - Performance
   - Accessibility
   - Best Practices
   - SEO

**Target scores**:
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >80

### 7.2 Load Testing

```bash
# Install Apache Bench (if not installed)
# On macOS: brew install httpd
# On Ubuntu: sudo apt-get install apache2-utils

# Test homepage
ab -n 1000 -c 10 http://localhost:3000/

# Test todos page (requires authentication)
ab -n 1000 -c 10 -H "Cookie: auth.token=YOUR_TOKEN" http://localhost:3000/todos
```

**Target performance**:
- Homepage: <3 seconds initial load
- Todos page: <2 seconds with data
- Form submission: <3 seconds response

## 8. Next Steps

After completing the quickstart:

1. ✅ Verify all authentication flows work correctly
2. ✅ Test all todo CRUD operations
3. ✅ Verify responsive design on multiple devices
4. ✅ Run automated tests and verify coverage
5. ⏭️ Implement additional features (filtering, sorting, search)
6. ⏭️ Set up CI/CD pipeline
7. ⏭️ Configure production environment
8. ⏭️ Implement monitoring and logging

## 9. Additional Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Better Auth Documentation**: https://better-auth.com/docs
- **React Query Documentation**: https://tanstack.com/query/latest
- **React Hook Form**: https://react-hook-form.com/
- **Tailwind CSS**: https://tailwindcss.com/docs

## Support

For issues or questions:
1. Check this quickstart guide
2. Review specification at `specs/003-todo-frontend/spec.md`
3. Check implementation plan at `specs/003-todo-frontend/plan.md`
4. Review backend API documentation (specs/001 and specs/002)
5. Contact the development team

---

**Last Updated**: 2026-02-05
**Version**: 1.0.0
