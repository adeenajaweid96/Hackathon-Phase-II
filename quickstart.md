# Todo Web Application - Quick Start Guide

This guide will help you get the Todo Web Application up and running quickly.

## Prerequisites

- Node.js 18+ and npm installed
- Backend API running (see backend setup instructions)
- Git (optional, for cloning)

## Backend Setup (Required First)

Before starting the frontend, ensure the backend API is running:

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and configure DATABASE_URL and JWT_SECRET

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend should now be running at `http://localhost:8000`.

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with the following values:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Configuration (generate secure random strings)
BETTER_AUTH_SECRET=your-secret-key-min-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret-min-32-characters-long
```

**Generate secure secrets:**

```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Testing the Application

### Manual Testing Flow

#### 1. Sign Up (Create Account)

1. Navigate to `http://localhost:3000`
2. You'll be redirected to the sign-in page
3. Click "Create one" to go to the sign-up page
4. Enter email and password (password must meet complexity requirements)
5. Click "Create Account"
6. You should be redirected to the todos page

**Expected Result:** Account created, JWT token stored, redirected to `/todos`

#### 2. Sign In (Existing User)

1. Navigate to `http://localhost:3000/signin`
2. Enter your email and password
3. Click "Sign In"
4. You should be redirected to the todos page

**Expected Result:** Authenticated, redirected to `/todos`

#### 3. View Todos

1. After signing in, you'll see the todos page
2. If you have no todos, you'll see an empty state message
3. The page shows a progress bar and statistics

**Expected Result:** Empty state or list of todos displayed

#### 4. Create Todo

1. Click the "Add Todo" button in the header
2. A modal dialog appears
3. Enter a title (required, max 200 characters)
4. Optionally enter a description (max 1000 characters)
5. Click "Create Todo"
6. The modal closes and the new todo appears in the list

**Expected Result:**
- Toast notification: "Todo created successfully!"
- New todo appears immediately (optimistic update)
- Todo persists after page refresh

#### 5. Toggle Todo Completion

1. Click the checkbox next to any todo
2. The todo should show visual changes (strikethrough, completed badge)
3. The progress bar updates

**Expected Result:**
- Toast notification: "Todo marked as completed!" or "Todo marked as incomplete"
- Visual changes appear immediately
- Completed todos show green badge

#### 6. Edit Todo

1. Hover over a todo item
2. Click the edit (pencil) icon
3. A modal dialog appears with pre-filled data
4. Modify the title or description
5. Click "Save Changes"

**Expected Result:**
- Toast notification: "Todo updated successfully!"
- Changes appear immediately
- Updated todo persists after page refresh

#### 7. Delete Todo

1. Hover over a todo item
2. Click the delete (trash) icon
3. A confirmation dialog appears
4. Review the todo details
5. Click "Delete Todo"

**Expected Result:**
- Toast notification: "Todo deleted successfully!"
- Todo removed immediately from list
- Deletion persists after page refresh

#### 8. Logout

1. Click the "Logout" button in the header
2. You should be redirected to the sign-in page
3. JWT token is cleared from localStorage

**Expected Result:** Logged out, redirected to `/signin`

### Responsive Design Testing

Test the application at different screen sizes:

- **Mobile**: 320px, 375px, 414px
- **Tablet**: 768px, 1024px
- **Desktop**: 1280px, 1920px

**How to test:**
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Select different device presets or enter custom dimensions
4. Verify all features work correctly at each size

### Error Handling Testing

#### Test Network Errors

1. Stop the backend server
2. Try to create/update/delete a todo
3. You should see error toast notifications
4. Changes should be rolled back (optimistic updates reversed)

#### Test Validation Errors

1. Try to create a todo with an empty title
2. Try to create a todo with a title > 200 characters
3. Try to sign up with an invalid email
4. Try to sign up with a weak password

**Expected Result:** Inline validation errors displayed, form submission prevented

#### Test Authentication Errors

1. Sign out
2. Try to access `/todos` directly
3. You should be redirected to `/signin`

## Common Issues and Solutions

### Issue: "Failed to fetch" errors

**Solution:**
- Ensure backend is running on `http://localhost:8000`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS is configured in backend

### Issue: Authentication not working

**Solution:**
- Verify JWT secrets match between frontend and backend
- Clear localStorage and try signing in again
- Check browser console for errors

### Issue: Todos not loading

**Solution:**
- Verify you're signed in (check for JWT token in localStorage)
- Check network tab for API errors
- Ensure backend database is set up correctly

### Issue: Build errors

**Solution:**
```bash
# Delete build artifacts
rm -rf .next node_modules

# Reinstall dependencies
npm install

# Try building again
npm run build
```

## Production Build

To create a production build:

```bash
# Build the application
npm run build

# Start production server
npm run start
```

The production build will be optimized for performance.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `BETTER_AUTH_SECRET` | Secret for Better Auth | Random 32+ char string |
| `BETTER_AUTH_URL` | Frontend URL | `http://localhost:3000` |
| `JWT_SECRET` | JWT signing secret | Random 32+ char string |

## API Endpoints Used

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user

### Todos
- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create todo
- `PATCH /api/todos/{id}` - Update todo
- `DELETE /api/todos/{id}` - Delete todo

## Success Criteria

The application is working correctly if:

- ✓ Users can sign up and sign in
- ✓ Authentication persists across page refreshes
- ✓ Users can view their todos
- ✓ Users can create new todos
- ✓ Users can edit existing todos
- ✓ Users can toggle todo completion
- ✓ Users can delete todos
- ✓ All operations show toast notifications
- ✓ Optimistic updates work (instant UI feedback)
- ✓ Errors are handled gracefully
- ✓ Application is responsive on all screen sizes
- ✓ Users can log out

## Next Steps

After verifying the application works:

1. Review the code structure in `frontend/README.md`
2. Explore the component architecture
3. Test edge cases and error scenarios
4. Consider adding additional features
5. Deploy to production (Vercel, Netlify, etc.)

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check the network tab for failed requests
3. Verify backend logs for API errors
4. Review the troubleshooting section in `frontend/README.md`

## License

MIT
