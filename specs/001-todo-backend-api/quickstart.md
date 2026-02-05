# Quickstart Guide: Todo Backend API

**Date**: 2026-02-05
**Feature**: 001-todo-backend-api
**Purpose**: Setup instructions and testing guide for the Todo Backend API

## Prerequisites

Before starting, ensure you have:

- **Python 3.11+** installed
- **pip** package manager
- **Neon PostgreSQL** account (sign up at https://neon.tech)
- **Git** for version control
- **curl** or **Postman** for API testing (optional)

## 1. Environment Setup

### 1.1 Clone Repository

```bash
git clone <repository-url>
cd phase-II
git checkout 001-todo-backend-api
```

### 1.2 Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 1.3 Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Expected dependencies** (requirements.txt):
```
fastapi==0.104.1
sqlmodel==0.0.14
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
asyncpg==0.29.0
python-dotenv==1.0.0
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
```

### 1.4 Configure Environment Variables

Create `.env` file in the `backend/` directory:

```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://user:password@host.neon.tech/dbname?sslmode=require

# JWT Configuration
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Configuration
APP_NAME=Todo Backend API
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

**Important**: Replace the following values:
- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `SECRET_KEY`: Generate a secure random key (use `openssl rand -hex 32`)

## 2. Database Setup

### 2.1 Get Neon Connection String

1. Log in to your Neon account at https://console.neon.tech
2. Create a new project or select existing project
3. Navigate to "Connection Details"
4. Copy the connection string
5. Replace `postgresql://` with `postgresql+asyncpg://` in your `.env` file

**Example Neon connection string**:
```
postgresql+asyncpg://user:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 2.2 Verify Database Connection

```bash
# Test database connection
python -c "
from sqlalchemy.ext.asyncio import create_async_engine
import asyncio
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

async def test_connection():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        print('✅ Database connection successful!')
    await engine.dispose()

asyncio.run(test_connection())
"
```

### 2.3 Run Database Migrations

```bash
# Initialize Alembic (if not already done)
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "Create todos table"

# Apply migrations
alembic upgrade head
```

**Note**: If migrations are already included in the repository, just run:
```bash
alembic upgrade head
```

## 3. Running the Development Server

### 3.1 Start the Server

```bash
# From backend/ directory
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 3.2 Verify Server is Running

Open your browser and navigate to:
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc (ReDoc)
- **Health Check**: http://localhost:8000/health (if implemented)

## 4. Testing the API

### 4.1 Obtain JWT Token

**Note**: This assumes the authentication system is already set up. If not, you'll need to implement or mock JWT token generation for testing.

For testing purposes, generate a test token:

```python
# test_token.py
from jose import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")

def create_test_token(user_id: str):
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# Generate tokens for two test users
user1_token = create_test_token("user1")
user2_token = create_test_token("user2")

print(f"User 1 Token: {user1_token}")
print(f"User 2 Token: {user2_token}")
```

Run:
```bash
python test_token.py
```

### 4.2 Test Endpoints with curl

**Create a Todo**:
```bash
curl -X POST http://localhost:8000/api/todos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs"
  }'
```

**Expected Response** (201 Created):
```json
{
  "id": 1,
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "completed": false,
  "user_id": "user1",
  "created_at": "2026-02-05T10:30:00Z",
  "updated_at": "2026-02-05T10:30:00Z"
}
```

**Retrieve All Todos**:
```bash
curl -X GET http://localhost:8000/api/todos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response** (200 OK):
```json
[
  {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "completed": false,
    "user_id": "user1",
    "created_at": "2026-02-05T10:30:00Z",
    "updated_at": "2026-02-05T10:30:00Z"
  }
]
```

**Mark Todo as Complete**:
```bash
curl -X PATCH http://localhost:8000/api/todos/1/complete \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

**Update Todo Details**:
```bash
curl -X PUT http://localhost:8000/api/todos/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title",
    "description": "Updated description"
  }'
```

**Delete Todo**:
```bash
curl -X DELETE http://localhost:8000/api/todos/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response** (204 No Content)

### 4.3 Test with Postman

1. Import the OpenAPI specification from `specs/001-todo-backend-api/contracts/openapi.yaml`
2. Set up environment variables:
   - `base_url`: http://localhost:8000
   - `token`: Your JWT token
3. Use `{{base_url}}` and `{{token}}` in requests
4. Test all 5 endpoints

## 5. Running Automated Tests

### 5.1 Run All Tests

```bash
# From backend/ directory
pytest
```

**Expected output**:
```
============================= test session starts ==============================
collected 15 items

tests/test_todos_api.py .........                                        [ 60%]
tests/test_authorization.py ......                                       [100%]

============================== 15 passed in 2.34s ===============================
```

### 5.2 Run Specific Test Categories

```bash
# Run only API endpoint tests
pytest tests/test_todos_api.py

# Run only authorization tests
pytest tests/test_authorization.py

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=src --cov-report=html
```

### 5.3 Test Coverage

View coverage report:
```bash
# Generate coverage report
pytest --cov=src --cov-report=html

# Open report in browser
# On Windows:
start htmlcov/index.html
# On macOS:
open htmlcov/index.html
# On Linux:
xdg-open htmlcov/index.html
```

**Target Coverage**: >80% for all modules

## 6. Common Troubleshooting

### Issue: Database Connection Failed

**Symptoms**:
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solutions**:
1. Verify Neon connection string in `.env`
2. Check if `sslmode=require` is included
3. Ensure `postgresql+asyncpg://` prefix (not just `postgresql://`)
4. Verify Neon project is active (not suspended)
5. Check network connectivity

### Issue: JWT Token Invalid

**Symptoms**:
```
401 Unauthorized: Could not validate credentials
```

**Solutions**:
1. Verify `SECRET_KEY` in `.env` matches token generation
2. Check token hasn't expired
3. Ensure `Authorization: Bearer <token>` header format
4. Verify token is properly encoded (no extra spaces)

### Issue: Import Errors

**Symptoms**:
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solutions**:
1. Activate virtual environment: `source venv/bin/activate`
2. Install dependencies: `pip install -r requirements.txt`
3. Verify Python version: `python --version` (should be 3.11+)

### Issue: Port Already in Use

**Symptoms**:
```
ERROR: [Errno 48] Address already in use
```

**Solutions**:
1. Stop other process using port 8000
2. Use different port: `uvicorn src.main:app --port 8001`
3. Find and kill process:
   ```bash
   # On Windows:
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F

   # On macOS/Linux:
   lsof -ti:8000 | xargs kill -9
   ```

### Issue: Validation Errors

**Symptoms**:
```
422 Unprocessable Entity: Validation error
```

**Solutions**:
1. Check request body matches schema (title required, max lengths)
2. Verify Content-Type header is `application/json`
3. Ensure JSON is properly formatted (no trailing commas)
4. Check field types (completed must be boolean, not string)

### Issue: Cross-User Access

**Symptoms**:
```
403 Forbidden: You do not have permission to access this todo
```

**Expected Behavior**: This is correct! Users should not access other users' todos.

**Solutions**:
1. Verify you're using the correct user's token
2. Check the todo belongs to the authenticated user
3. This is a security feature, not a bug

## 7. Development Workflow

### 7.1 Making Changes

1. Create a new branch for your changes
2. Make code modifications
3. Run tests: `pytest`
4. Run linter: `flake8 src/` (if configured)
5. Format code: `black src/` (if configured)
6. Commit changes with descriptive message

### 7.2 Adding New Endpoints

1. Define Pydantic models in `src/models/`
2. Implement service methods in `src/services/`
3. Create endpoint in `src/api/`
4. Write tests in `tests/`
5. Update OpenAPI spec in `specs/001-todo-backend-api/contracts/openapi.yaml`
6. Run tests to verify

### 7.3 Database Migrations

```bash
# Create new migration after model changes
alembic revision --autogenerate -m "Description of changes"

# Review generated migration in alembic/versions/
# Edit if necessary

# Apply migration
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

## 8. Performance Testing

### 8.1 Basic Load Test

```bash
# Install Apache Bench (if not installed)
# On macOS: brew install httpd
# On Ubuntu: sudo apt-get install apache2-utils

# Test GET /api/todos endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/todos
```

**Target Performance**:
- GET /api/todos: <500ms average
- POST /api/todos: <300ms average
- PATCH/PUT/DELETE: <300ms average

### 8.2 Monitor Performance

```bash
# Enable SQL query logging
# In .env, set: DEBUG=True

# Watch logs for slow queries
tail -f logs/app.log | grep "slow query"
```

## 9. Next Steps

After completing the quickstart:

1. ✅ Verify all 5 endpoints work correctly
2. ✅ Run automated tests and ensure they pass
3. ✅ Test cross-user access prevention
4. ✅ Verify performance targets are met
5. ⏭️ Integrate with frontend application
6. ⏭️ Set up CI/CD pipeline
7. ⏭️ Configure production environment
8. ⏭️ Implement monitoring and logging

## 10. Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **SQLModel Documentation**: https://sqlmodel.tiangolo.com/
- **Neon Documentation**: https://neon.tech/docs
- **Pydantic Documentation**: https://docs.pydantic.dev/
- **pytest Documentation**: https://docs.pytest.org/

## Support

For issues or questions:
1. Check this quickstart guide
2. Review API documentation at http://localhost:8000/docs
3. Check the troubleshooting section above
4. Review specification at `specs/001-todo-backend-api/spec.md`
5. Contact the development team

---

**Last Updated**: 2026-02-05
**Version**: 1.0.0
