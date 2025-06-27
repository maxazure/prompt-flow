# 🔌 API Reference

Complete API documentation for the PromptFlow REST API. All endpoints use JSON for request and response bodies.

## 📋 API Overview

- **Base URL**: `http://localhost:3001/api` (development)
- **Version**: v1
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`

## 🔐 Authentication

Most endpoints require authentication via JWT token:

```http
Authorization: Bearer <your-jwt-token>
```

Get your token by logging in via the `/auth/login` endpoint.

## 📚 Endpoint Categories

### 🔑 [Authentication](./authentication.md)
User registration, login, and token management.

### 📝 [Prompts](./prompts.md)
Complete CRUD operations for prompt management.

### 🗂️ [Categories](./categories.md)
Category management with scope-based permissions.

### 🔄 [Versions](./versions.md)
Version control and history management for prompts.

### 👥 [Teams](./teams.md)
Team collaboration and member management.

### 💬 [Comments](./comments.md)
Comment system for prompt collaboration.

### 🤖 [AI Services](./ai.md)
AI-powered analysis and optimization endpoints.

## 🚀 Quick Start

### 1. Register a User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "myusername"
}
```

### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### 3. Create a Prompt
```http
POST /api/prompts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My First Prompt",
  "content": "You are a helpful assistant...",
  "categoryId": 1,
  "tags": ["assistant", "general"],
  "isPublic": false
}
```

## 📊 Response Format

All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

## 🔍 Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request data |
| `401` | Unauthorized | Authentication required |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |

## 🔄 Pagination

List endpoints support pagination:

```http
GET /api/prompts?page=1&limit=20&sort=createdAt&order=desc
```

**Response includes pagination metadata:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 🔍 Filtering and Search

Most list endpoints support filtering:

```http
GET /api/prompts?search=assistant&category=ai&tags=helpful&isPublic=true
```

## 📝 API Testing

### Using curl
```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.data.token')

# Use token for authenticated requests
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/prompts/my
```

### Using JavaScript/Fetch
```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
});
const { data } = await loginResponse.json();
const token = data.token;

// Authenticated request
const promptsResponse = await fetch('/api/prompts/my', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🛡️ Security Considerations

- **Always use HTTPS** in production
- **Validate all inputs** on both client and server
- **Store JWT tokens securely** (httpOnly cookies recommended)
- **Implement rate limiting** to prevent abuse
- **Use environment variables** for sensitive configuration

## 📖 Additional Resources

- **[Postman Collection](./postman-collection.json)** - Import for easy testing
- **[OpenAPI Specification](./openapi.yaml)** - Machine-readable API spec
- **[Error Code Reference](../reference/error-codes.md)** - Complete error code list
- **[Rate Limiting Guide](./rate-limiting.md)** - API usage limits and best practices

## 🐛 Reporting Issues

Found a bug or have suggestions for the API?

- **[Create an Issue](https://github.com/maxazure/prompt-flow/issues)**
- **[Join Discussions](https://github.com/maxazure/prompt-flow/discussions)**
- **[Contribute](../development/contributing.md)** to the API development