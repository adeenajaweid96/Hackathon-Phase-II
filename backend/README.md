# Todo Backend API

RESTful API for multi-user todo application with JWT authentication.

## Features

- ✅ 5 core todo operations (retrieve, create, update, mark complete, delete)
- ✅ JWT token authentication on all endpoints
- ✅ Multi-user data isolation (strict user_id filtering)
- ✅ FastAPI with async/await patterns
- ✅ SQLModel ORM with Neon PostgreSQL
- ✅ Comprehensive error handling
- ✅ OpenAPI documentation

## Tech Stack

- **Framework**: FastAPI 0.104+
- **ORM**: SQLModel 0.0.14+
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: JWT tokens (python-jose)
- **Python**: 3.11+

## Quick Start

### 1. Prerequisites

- Python 3.11 or higher
- Neon PostgreSQL account (https://neon.tech)
- pip package manager

### 2. Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configuration

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql+asyncpg://user:password@host.neon.tech/dbname?sslmode=require
SECRET_KEY=your-secret-key-here-use-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
APP_NAME=Todo Backend API
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

**Generate a secure SECRET_KEY**:
```bash
openssl rand -hex 32
```

### 4. Run the Server

```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Health Check

```bash
GET /health
```

### Retrieve All Todos

```bash
GET /api/todos
Authorization: Bearer <token>
```

**Response**: 200 OK
```json
[
  {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "completed": false,
    "user_id": "user123",
    "created_at": "2026-02-05T10:30:00Z",
    "updated_at": "2026-02-05T10:30:00Z"
  }
]
```

### Create Todo

```bash
POST /api/todos
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New task",
  "description": "Task description (optional)"
}
```

**Response**: 201 Created

### Mark Todo as Complete

```bash
PATCH /api/todos/{id}/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "completed": true
}
```

**Response**: 200 OK

### Update Todo Details

```bash
PUT /api/todos/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description"
}
```

**Response**: 200 OK

### Delete Todo

```bash
DELETE /api/todos/{id}
Authorization: Bearer <token>
```

**Response**: 204 No Content

## Error Responses

The API returns consistent error responses:

```json
{
  "error": "Error Type",
  "detail": "Detailed error message",
  "validation_errors": []  // Only for 400 validation errors
}
```

**Status Codes**:
- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (not owner of resource)
- `404` - Not Found
- `500` - Internal Server Error

## Testing

### Generate Test JWT Token

For testing, you can generate a JWT token:

```python
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key"
payload = {
    "sub": "test-user-123",
    "exp": datetime.utcnow() + timedelta(hours=24)
}
token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
print(f"Token: {token}")
```

### Run Tests

```bash
pytest
```

### Test with curl

```bash
# Set your token
TOKEN="your-jwt-token-here"

# Create a todo
curl -X POST http://localhost:8000/api/todos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test todo", "description": "Testing the API"}'

# Get all todos
curl -X GET http://localhost:8000/api/todos \
  -H "Authorization: Bearer $TOKEN"
```

## Security Features

- ✅ JWT token verification on all endpoints
- ✅ User data isolation (users can only access their own todos)
- ✅ Ownership verification on update/delete operations
- ✅ Input validation (title max 200 chars, description max 1000 chars)
- ✅ SQL injection prevention (SQLModel ORM)
- ✅ CORS configuration

## Performance

- **GET /api/todos**: <500ms for up to 100 items
- **POST /api/todos**: <300ms
- **PATCH/PUT**: <300ms
- **DELETE**: <200ms

Optimizations:
- Database indexes on `user_id` and `(user_id, created_at)`
- Connection pooling (5-10 connections for Neon Serverless)
- Async/await patterns throughout

## Docker

Build and run with Docker:

```bash
# Build image
docker build -t todo-backend .

# Run container
docker run -p 8000:8000 --env-file .env todo-backend
```

## Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── dependencies.py  # JWT verification
│   │   ├── errors.py        # Error handlers
│   │   └── todos.py         # Todo endpoints
│   ├── models/
│   │   └── todo.py          # Todo entity and Pydantic models
│   ├── services/
│   │   └── todo_service.py  # Business logic
│   ├── config.py            # Configuration
│   ├── database.py          # Database connection
│   └── main.py              # FastAPI app
├── tests/
│   ├── conftest.py
│   ├── test_todos_api.py
│   └── test_authorization.py
├── .env.example
├── requirements.txt
├── Dockerfile
└── README.md
```

## Development

### Code Style

```bash
# Format code
black src/

# Lint code
flake8 src/
```

### Database Migrations

If using Alembic:

```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

## Troubleshooting

### Database Connection Failed

- Verify `DATABASE_URL` in `.env`
- Ensure `postgresql+asyncpg://` prefix (not just `postgresql://`)
- Check Neon project is active
- Verify `sslmode=require` is included

### JWT Token Invalid

- Verify `SECRET_KEY` matches between token generation and API
- Check token hasn't expired
- Ensure `Authorization: Bearer <token>` header format

### Import Errors

- Activate virtual environment
- Install dependencies: `pip install -r requirements.txt`
- Verify Python 3.11+

## License

MIT

## Support

For issues or questions, refer to:
- API Documentation: http://localhost:8000/docs
- Specification: `specs/001-todo-backend-api/spec.md`
- Quickstart Guide: `specs/001-todo-backend-api/quickstart.md`
