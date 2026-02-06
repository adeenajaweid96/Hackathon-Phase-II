# Todo App Frontend

A modern, responsive todo application built with Next.js 16+, TypeScript, and Tailwind CSS.

## Features

- User authentication (signup, signin, logout)
- Create, read, update, and delete todos
- Mark todos as complete/incomplete
- Responsive design (mobile-first)
- Real-time optimistic updates
- Toast notifications for user feedback
- Form validation with Zod
- Server-side rendering with Next.js App Router

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Authentication**: Better Auth (JWT tokens)
- **Notifications**: Sonner
- **HTTP Client**: Custom API client with fetch

## Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000` (see backend README)

## Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the frontend directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and configure the following variables:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret-here-min-32-chars
```

**Important**: Generate secure random strings for `BETTER_AUTH_SECRET` and `JWT_SECRET`. You can use:

```bash
openssl rand -base64 32
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
frontend/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home page (redirects)
│   ├── signin/              # Sign in page
│   ├── signup/              # Sign up page
│   ├── todos/               # Todos page
│   └── api/                 # API routes
│       └── auth/            # Better Auth routes
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── todos/              # Todo components
│   └── ui/                 # Reusable UI components
├── lib/                    # Utilities and hooks
│   ├── hooks/              # Custom React hooks
│   ├── providers/          # Context providers
│   ├── utils/              # Utility functions
│   ├── validation/         # Zod schemas
│   ├── api-client.ts       # API client wrapper
│   ├── auth.ts             # Better Auth config
│   └── types.ts            # TypeScript types
├── styles/                 # Global styles
│   └── globals.css         # Tailwind + custom CSS
├── middleware.ts           # Route protection
└── public/                 # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Development Workflow

### 1. Authentication Flow

1. User visits the app
2. Middleware checks for JWT token
3. Unauthenticated users are redirected to `/signin`
4. After signin/signup, JWT token is stored in localStorage
5. Token is included in all API requests via Authorization header
6. Authenticated users can access `/todos`

### 2. Todo Management

- **View Todos**: Fetched on page load with React Query
- **Create Todo**: Form validation → API call → Optimistic update → Toast notification
- **Update Todo**: Pre-filled form → Validation → API call → Cache update
- **Toggle Complete**: Checkbox → Optimistic update → API call
- **Delete Todo**: Confirmation dialog → API call → Remove from cache

### 3. State Management

- **Authentication**: React Context (AuthProvider)
- **Server State**: React Query (todos, mutations)
- **Form State**: React Hook Form
- **UI State**: Local component state

## Key Features

### Responsive Design

The app is fully responsive and tested on:
- Mobile: 320px, 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1920px

### Optimistic Updates

All mutations use optimistic updates for instant UI feedback:
- Create todo: Immediately appears in list
- Update todo: Changes reflect instantly
- Toggle complete: Checkbox updates immediately
- Delete todo: Removed from list instantly

If the API call fails, changes are rolled back automatically.

### Form Validation

All forms use Zod schemas for validation:
- **Email**: Valid email format, lowercase, trimmed
- **Password**: Min 8 chars, uppercase, lowercase, number, special char
- **Todo Title**: Required, max 200 chars
- **Todo Description**: Optional, max 1000 chars

### Error Handling

- API errors are parsed and displayed as user-friendly messages
- Network errors show appropriate fallback messages
- Validation errors are displayed inline on form fields
- Toast notifications for all operations

## API Integration

The frontend communicates with the backend API at `http://localhost:8000`:

### Authentication Endpoints

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Authenticate user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Todo Endpoints

- `GET /api/todos` - Get all todos for authenticated user
- `POST /api/todos` - Create new todo
- `PATCH /api/todos/{id}` - Update todo
- `DELETE /api/todos/{id}` - Delete todo

All todo endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Troubleshooting

### Common Issues

**1. "Failed to fetch" errors**
- Ensure backend API is running on `http://localhost:8000`
- Check CORS configuration in backend
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

**2. Authentication not working**
- Verify JWT secrets match between frontend and backend
- Check browser console for token errors
- Clear localStorage and try signing in again

**3. Todos not loading**
- Check network tab for API errors
- Verify JWT token is being sent in headers
- Ensure user is authenticated

**4. Build errors**
- Delete `.next` folder and `node_modules`
- Run `npm install` again
- Check for TypeScript errors with `npm run lint`

## Performance Optimization

- Server Components for static content
- Client Components only where interactivity is needed
- React Query caching (5 min stale time, 10 min cache time)
- Optimistic updates for instant feedback
- Image optimization with next/image
- Font optimization with next/font

## Security

- JWT tokens stored in localStorage (httpOnly cookies in production)
- CSRF protection via Better Auth
- Input validation on all forms
- XSS prevention via React's built-in escaping
- Route protection via middleware

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT
