# 📚 API 参考文档

## 🌐 基础信息

**Base URL**: `http://localhost:3001/api` (开发环境)  
**Production URL**: `https://your-domain.com/api`

**API 版本**: v1  
**认证方式**: JWT Bearer Token  
**数据格式**: JSON  
**字符编码**: UTF-8

## 🚀 API 快速参考

### 核心端点总览
| 分类 | 端点 | 方法 | 认证 | 说明 |
|------|------|------|------|------|
| **认证** | `/auth/register` | POST | ❌ | 用户注册 |
| **认证** | `/auth/login` | POST | ❌ | 用户登录 |
| **提示词** | `/prompts` | GET | 可选 | 获取公开提示词 |
| **提示词** | `/prompts/my` | GET | ✅ | 获取个人提示词 |
| **提示词** | `/prompts` | POST | ✅ | 创建提示词 |
| **提示词** | `/prompts/:id` | GET | 可选 | 获取单个提示词 |
| **提示词** | `/prompts/:id` | PUT | ✅ | 更新提示词 |
| **提示词** | `/prompts/:id` | DELETE | ✅ | 删除提示词 |
| **版本** | `/prompts/:id/versions` | GET | ✅ | 获取版本历史 |
| **版本** | `/prompts/:id/versions` | POST | ✅ | 创建新版本 |
| **版本** | `/prompts/:id/versions/:v` | GET | ✅ | 获取特定版本 |
| **版本** | `/prompts/:id/revert/:v` | POST | ✅ | 版本回滚 |
| **团队** | `/teams` | GET | ✅ | 获取用户团队 |
| **团队** | `/teams` | POST | ✅ | 创建团队 |
| **团队** | `/teams/:id` | GET | ✅ | 获取团队详情 |
| **团队** | `/teams/:id` | PUT | ✅ | 更新团队信息 |
| **团队** | `/teams/:id` | DELETE | ✅ | 删除团队 |
| **团队成员** | `/teams/:id/members` | POST | ✅ | 邀请成员 |
| **团队成员** | `/teams/:id/members/:memberId` | PUT | ✅ | 更新成员角色 |
| **团队成员** | `/teams/:id/members/:memberId` | DELETE | ✅ | 移除成员 |
| **评论** | `/comments/prompt/:promptId` | GET | ✅ | 获取提示词评论 |
| **评论** | `/comments` | POST | ✅ | 创建评论 |
| **评论** | `/comments/:id` | PUT | ✅ | 更新评论 |
| **评论** | `/comments/:id` | DELETE | ✅ | 删除评论 |
| **评论** | `/comments/:id/resolve` | PUT | ✅ | 标记评论已解决 |
| **AI优化** | `/ai/analyze` | POST | ✅ | 分析提示词质量 |
| **AI优化** | `/ai/optimize` | POST | ✅ | 生成优化版本 |
| **AI优化** | `/ai/similar` | POST | ✅ | 获取相似提示词 |
| **AI优化** | `/ai/categorize` | POST | ✅ | 自动分类提示词 |
| **AI优化** | `/ai/prompts/:id/analyze` | GET | ✅ | 分析指定提示词 |
| **AI优化** | `/ai/insights` | GET | ✅ | 获取使用统计洞察 |
| **系统** | `/health` | GET | ❌ | 健康检查 |

### 认证标识
- ✅ = 需要认证 (JWT Token)
- ❌ = 无需认证
- 可选 = 认证可选，影响返回内容

---

## 🔐 认证 Authentication

### 🔑 用户注册
创建新用户账户

```http
POST /auth/register
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "sarah",
  "email": "sarah@example.com",
  "password": "password123"
}
```

**响应 (201 Created)**:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "sarah",
    "email": "sarah@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**错误响应**:
```json
// 400 Bad Request - 验证失败
{
  "error": "Username is required, Email is required, Password must be at least 6 characters"
}

// 400 Bad Request - 用户已存在
{
  "error": "Email already exists"
}

// 400 Bad Request - 用户名已存在
{
  "error": "Username already exists"
}
```

### 🔓 用户登录
用户身份验证

```http
POST /auth/login
Content-Type: application/json
```

**请求体**:
```json
{
  "email": "sarah@example.com",
  "password": "password123"
}
```

**响应 (200 OK)**:
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "sarah",
    "email": "sarah@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**错误响应**:
```json
// 400 Bad Request - 参数错误
{
  "error": "Email is required, Password is required"
}

// 401 Unauthorized - 凭据无效
{
  "error": "Invalid credentials"
}
```

---

## 📝 提示词管理 Prompts

### 📋 获取公开提示词列表
获取公开提示词列表，支持筛选

```http
GET /prompts?category=web-development&isTemplate=true
Authorization: Bearer <token> (可选)
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `category` | string | 否 | 按分类筛选 |
| `isTemplate` | boolean | 否 | 筛选模板 |

**响应 (200 OK)**:
```json
{
  "prompts": [
    {
      "id": 1,
      "title": "Website Generator",
      "content": "Create a modern, responsive website for {company}...",
      "description": "Template for generating professional websites",
      "version": 1,
      "isTemplate": true,
      "category": "web-development",
      "tags": ["html", "css", "responsive"],
      "userId": 1,
      "parentId": null,
      "isPublic": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": 1,
        "username": "sarah"
      }
    }
  ]
}
```

**权限说明**:
- **所有用户** (认证和未认证): 只能查看公共提示词 (`isPublic: true`)

### 📋 获取用户个人提示词列表
获取当前用户的所有提示词（包括公开和私有），支持筛选

```http
GET /prompts/my?category=web-development&isTemplate=true
Authorization: Bearer <token>
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `category` | string | 否 | 按分类筛选 |
| `isTemplate` | boolean | 否 | 筛选模板 |

**响应 (200 OK)**:
```json
{
  "prompts": [
    {
      "id": 1,
      "title": "Website Generator",
      "content": "Create a modern, responsive website for {company}...",
      "description": "Template for generating professional websites",
      "version": 1,
      "isTemplate": true,
      "category": "web-development",
      "tags": ["html", "css", "responsive"],
      "userId": 1,
      "parentId": null,
      "isPublic": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": 1,
        "username": "sarah"
      }
    },
    {
      "id": 2,
      "title": "Private Prompt",
      "content": "This is my private prompt...",
      "description": "Personal use only",
      "version": 1,
      "isTemplate": false,
      "category": "personal",
      "tags": ["private"],
      "userId": 1,
      "parentId": null,
      "isPublic": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": 1,
        "username": "sarah"
      }
    }
  ]
}
```

**权限说明**:
- **认证用户**: 可查看自己的所有提示词（公开和私有）
- **需要认证**: 此端点需要有效的 JWT Token

**错误响应**:
```json
// 401 Unauthorized - 未认证
{
  "error": "No token provided"
}
```

### 🔍 获取单个提示词
根据 ID 获取特定提示词

```http
GET /prompts/:id
Authorization: Bearer <token> (可选)
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 提示词 ID |

**响应 (200 OK)**:
```json
{
  "prompt": {
    "id": 1,
    "title": "Website Generator",
    "content": "Create a modern, responsive website for {company}...",
    "description": "Template for generating professional websites",
    "version": 1,
    "isTemplate": true,
    "category": "web-development",
    "tags": ["html", "css", "responsive"],
    "userId": 1,
    "parentId": null,
    "isPublic": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": 1,
      "username": "sarah"
    }
  }
}
```

**错误响应**:
```json
// 404 Not Found
{
  "error": "Prompt not found"
}

// 403 Forbidden - 私有提示词无权限访问
{
  "error": "Access denied"
}
```

### ➕ 创建提示词
创建新的提示词

```http
POST /prompts
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "title": "API Code Generator",
  "content": "Generate RESTful API code for {endpoint} with {method}...",
  "description": "Template for generating API endpoints",
  "category": "api-development",
  "tags": ["api", "rest", "code"],
  "isTemplate": true,
  "isPublic": false
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 提示词标题 (3-200字符) |
| `content` | string | 是 | 提示词内容 (至少10字符) |
| `description` | string | 否 | 描述信息 (最多1000字符) |
| `category` | string | 否 | 分类 (最多100字符) |
| `tags` | string[] | 否 | 标签数组 (最多10个) |
| `isTemplate` | boolean | 否 | 是否为模板 (默认: false) |
| `isPublic` | boolean | 否 | 是否公开 (默认: false) |

**响应 (201 Created)**:
```json
{
  "message": "Prompt created successfully",
  "prompt": {
    "id": 2,
    "title": "API Code Generator",
    "content": "Generate RESTful API code for {endpoint} with {method}...",
    "description": "Template for generating API endpoints",
    "version": 1,
    "isTemplate": true,
    "category": "api-development",
    "tags": ["api", "rest", "code"],
    "userId": 1,
    "parentId": null,
    "isPublic": false,
    "createdAt": "2024-01-01T01:00:00.000Z",
    "updatedAt": "2024-01-01T01:00:00.000Z"
  }
}
```

**错误响应**:
```json
// 400 Bad Request - 验证失败
{
  "error": "Title is required, Content is required"
}

// 401 Unauthorized - 未认证
{
  "error": "No token provided"
}
```

### ✏️ 更新提示词
更新现有提示词

```http
PUT /prompts/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 提示词 ID |

**请求体** (所有字段都是可选的):
```json
{
  "title": "Updated API Code Generator",
  "content": "Generate enhanced RESTful API code...",
  "description": "Enhanced template for generating API endpoints",
  "category": "api-development",
  "tags": ["api", "rest", "code", "enhanced"],
  "isTemplate": true,
  "isPublic": true
}
```

**响应 (200 OK)**:
```json
{
  "message": "Prompt updated successfully",
  "prompt": {
    "id": 2,
    "title": "Updated API Code Generator",
    "content": "Generate enhanced RESTful API code...",
    "description": "Enhanced template for generating API endpoints",
    "version": 1,
    "isTemplate": true,
    "category": "api-development",
    "tags": ["api", "rest", "code", "enhanced"],
    "userId": 1,
    "parentId": null,
    "isPublic": true,
    "createdAt": "2024-01-01T01:00:00.000Z",
    "updatedAt": "2024-01-01T02:00:00.000Z",
    "user": {
      "id": 1,
      "username": "sarah"
    }
  }
}
```

**错误响应**:
```json
// 404 Not Found
{
  "error": "Prompt not found"
}

// 403 Forbidden - 无权限修改
{
  "error": "Access denied"
}

// 400 Bad Request - 验证失败
{
  "error": "Title cannot be empty"
}
```

### 🗑️ 删除提示词
删除指定提示词

```http
DELETE /prompts/:id
Authorization: Bearer <token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 提示词 ID |

**响应 (200 OK)**:
```json
{
  "message": "Prompt deleted successfully"
}
```

**错误响应**:
```json
// 404 Not Found
{
  "error": "Prompt not found"
}

// 403 Forbidden - 无权限删除
{
  "error": "Access denied"
}
```

---

## 📚 版本控制 API

### 🔍 获取版本历史
获取指定提示词的所有版本历史

```http
GET /prompts/:id/versions
Authorization: Bearer <token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 提示词 ID |

**响应 (200 OK)**:
```json
{
  "versions": [
    {
      "id": 3,
      "promptId": 1,
      "version": 3,
      "title": "Updated Website Generator",
      "content": "Create a modern, responsive website for {company}...",
      "description": "Updated template for generating professional websites",
      "category": "web-development",
      "tags": ["html", "css", "responsive", "updated"],
      "userId": 1,
      "changeLog": "Added mobile-first approach",
      "createdAt": "2024-01-15T14:30:00Z",
      "updatedAt": "2024-01-15T14:30:00Z",
      "user": {
        "id": 1,
        "username": "sarah"
      }
    },
    {
      "id": 2,
      "promptId": 1,
      "version": 2,
      "title": "Website Generator v2",
      "content": "Create a website for {company}...",
      "description": "Template for generating websites",
      "category": "web-development",
      "tags": ["html", "css"],
      "userId": 1,
      "changeLog": "Improved structure",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "user": {
        "id": 1,
        "username": "sarah"
      }
    }
  ]
}
```

### ✏️ 创建新版本
为现有提示词创建新版本

```http
POST /prompts/:id/versions
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 提示词 ID |

**请求体**:
```json
{
  "title": "Updated Website Generator",
  "content": "Create a modern, responsive website for {company}...",
  "description": "Updated template with mobile-first approach",
  "category": "web-development",
  "tags": ["html", "css", "responsive", "mobile-first"],
  "changeLog": "Added mobile-first design principles"
}
```

**响应 (201 Created)**:
```json
{
  "id": 4,
  "promptId": 1,
  "version": 4,
  "title": "Updated Website Generator",
  "content": "Create a modern, responsive website for {company}...",
  "description": "Updated template with mobile-first approach",
  "category": "web-development",
  "tags": ["html", "css", "responsive", "mobile-first"],
  "userId": 1,
  "changeLog": "Added mobile-first design principles",
  "createdAt": "2024-01-15T15:00:00Z",
  "updatedAt": "2024-01-15T15:00:00Z",
  "user": {
    "id": 1,
    "username": "sarah"
  }
}
```

### 📖 获取特定版本
获取提示词的特定版本

```http
GET /prompts/:id/versions/:version
Authorization: Bearer <token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 提示词 ID |
| `version` | number | 是 | 版本号 |

**响应 (200 OK)**:
```json
{
  "id": 2,
  "promptId": 1,
  "version": 2,
  "title": "Website Generator v2",
  "content": "Create a website for {company}...",
  "description": "Template for generating websites",
  "category": "web-development",
  "tags": ["html", "css"],
  "userId": 1,
  "changeLog": "Improved structure",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "user": {
    "id": 1,
    "username": "sarah"
  }
}
```

### ↩️ 版本回滚
将提示词回滚到指定版本

```http
POST /prompts/:id/revert/:version
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 提示词 ID |
| `version` | number | 是 | 要回滚到的版本号 |

**请求体**:
```json
{
  "changeLog": "Reverted to stable version due to issues"
}
```

**响应 (200 OK)**:
```json
{
  "id": 1,
  "title": "Website Generator v2",
  "content": "Create a website for {company}...",
  "description": "Template for generating websites",
  "version": 5,
  "isTemplate": true,
  "category": "web-development",
  "tags": ["html", "css"],
  "userId": 1,
  "parentId": null,
  "isPublic": true,
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T16:00:00Z",
  "user": {
    "id": 1,
    "username": "sarah"
  }
}
```

**版本控制错误响应**:
```json
// 400 Bad Request - 无效的 ID 或版本号
{
  "error": "Invalid prompt ID or version"
}

// 403 Forbidden - 只有所有者可以创建版本或回滚
{
  "error": "Only prompt owner can create new versions"
}

// 404 Not Found - 提示词或版本不存在
{
  "error": "Prompt not found"
}
{
  "error": "Version not found"
}
```

**权限说明**:
- **查看版本历史**: 需要对提示词有访问权限（公共或拥有者）
- **创建新版本**: 只有提示词所有者可以操作
- **版本回滚**: 只有提示词所有者可以操作

---

## 🤖 AI 优化 API

### 📊 分析提示词质量
分析提示词质量并获取优化建议

```http
POST /ai/analyze
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "content": "创建一个网站"
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "score": 45,
    "strengths": ["使用礼貌用语，表达清晰"],
    "weaknesses": ["提示词过于简短，可能缺乏足够的上下文"],
    "suggestions": [
      {
        "type": "specificity",
        "title": "增加详细信息",
        "description": "提示词太短，建议添加更多具体要求和上下文信息",
        "originalText": "创建一个网站",
        "suggestedText": "考虑添加：具体任务要求、期望输出格式、示例等",
        "confidence": 0.8,
        "impact": "medium"
      }
    ],
    "estimatedTokens": 15,
    "readabilityScore": 85
  }
}
```

### 🚀 生成优化版本
根据选择的建议生成优化后的提示词

```http
POST /ai/optimize
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "content": "创建一个网站",
  "suggestions": [
    {
      "type": "specificity",
      "title": "增加详细信息",
      "description": "提示词太短，建议添加更多具体要求和上下文信息",
      "originalText": "创建一个网站",
      "suggestedText": "考虑添加：具体任务要求、期望输出格式、示例等",
      "confidence": 0.8,
      "impact": "medium"
    }
  ]
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "original": "创建一个网站",
    "optimized": "请帮我创建一个现代化的响应式网站，要求包含以下功能：\n1. 首页展示企业信息\n2. 产品展示页面\n3. 联系我们页面\n4. 移动端友好的设计\n\n请提供完整的HTML、CSS和基础JavaScript代码。"
  }
}
```

### 🔍 获取相似提示词
根据内容查找相似的提示词

```http
POST /ai/similar
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "content": "创建网站",
  "limit": 5
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "similar": [
      {
        "type": "ai_suggestion",
        "title": "创建一个响应式网页设计",
        "content": "创建一个响应式网页设计"
      },
      {
        "type": "existing_prompt",
        "id": 123,
        "title": "Website Generator",
        "content": "Generate a complete website structure...",
        "category": "web-development"
      }
    ],
    "categories": ["web-development", "design"]
  }
}
```

### 🏷️ 自动分类提示词
自动识别提示词的类别

```http
POST /ai/categorize
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "content": "创建一个响应式网页，包含HTML和CSS"
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "categories": ["web-development", "design"],
    "suggested_category": "web-development"
  }
}
```

### 🎯 分析指定提示词
分析数据库中的特定提示词

```http
GET /ai/prompts/:id/analyze
Authorization: Bearer <token>
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "prompt": {
      "id": 123,
      "title": "Website Generator",
      "content": "Create a modern, responsive website..."
    },
    "analysis": {
      "score": 85,
      "strengths": ["包含示例说明，有助于理解", "结构清晰，易于遵循"],
      "weaknesses": [],
      "suggestions": [],
      "estimatedTokens": 120,
      "readabilityScore": 92
    }
  }
}
```

### 📈 获取使用统计洞察
获取用户的提示词使用统计和改进建议

```http
GET /ai/insights
Authorization: Bearer <token>
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "total_prompts": 25,
    "avg_length": 180,
    "category_distribution": {
      "web-development": 12,
      "documentation": 8,
      "general": 5
    },
    "recent_activity": [
      {
        "length": 150,
        "category": "web-development",
        "created": "2024-06-24T10:30:00Z"
      }
    ],
    "recommendations": [
      "尝试使用更具体的描述来提高提示词效果",
      "添加示例可以帮助AI更好地理解需求",
      "保持提示词简洁明了，避免冗余信息"
    ]
  }
}
```

**AI 优化功能说明**:
- **智能分析**: 基于启发式规则和AI分析的双重评估
- **优化建议**: 提供针对性的改进建议和具体修改方案
- **相似推荐**: 帮助用户发现相关的高质量提示词
- **自动分类**: 智能识别提示词所属类别
- **使用洞察**: 提供个性化的使用统计和改进建议

**注意事项**:
- AI 分析功能需要配置 OpenAI API Key 才能获得完整功能
- 未配置时将提供基础的启发式分析
- 分析结果仅供参考，最终质量以实际使用效果为准

---

## 🩺 系统健康检查

### ❤️ 健康状态检查
检查 API 服务状态

```http
GET /health
```

**响应 (200 OK)**:
```json
{
  "status": "OK",
  "message": "PromptFlow API is running"
}
```

---

## 🔒 认证和授权

### JWT Token 使用
所有需要认证的接口都需要在请求头中包含 JWT Token：

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token 过期处理
- **Token 有效期**: 7天
- **过期状态码**: 401 Unauthorized
- **自动重定向**: 前端会自动跳转到登录页面

### 权限控制
| 操作 | 游客 | 注册用户 | 资源所有者 |
|------|------|----------|------------|
| 查看公共提示词 | ✅ | ✅ | ✅ |
| 查看个人提示词 | ❌ | ✅ (自己的) | ✅ |
| 查看私有提示词详情 | ❌ | ❌ | ✅ |
| 创建提示词 | ❌ | ✅ | ✅ |
| 修改提示词 | ❌ | ❌ | ✅ |
| 删除提示词 | ❌ | ❌ | ✅ |
| 版本控制操作 | ❌ | ❌ | ✅ |

---

## 📊 错误码说明

### HTTP 状态码
| 状态码 | 说明 | 示例场景 |
|--------|------|----------|
| 200 | 成功 | 获取数据成功 |
| 201 | 创建成功 | 注册用户、创建提示词 |
| 400 | 请求错误 | 参数验证失败 |
| 401 | 未授权 | Token 无效或过期 |
| 403 | 禁止访问 | 无权限操作资源 |
| 404 | 资源不存在 | 提示词不存在 |
| 500 | 服务器错误 | 内部错误 |

### 错误响应格式
```json
{
  "error": "错误描述信息"
}
```

---

## 🌐 CORS 配置

### 允许的来源
- 开发环境: `http://localhost:5173`
- 生产环境: 根据部署配置

### 允许的方法
- GET, POST, PUT, DELETE, OPTIONS

### 允许的头部
- Content-Type, Authorization

---

## 📈 API 限制

### 请求频率限制
- **未认证用户**: 100 请求/小时
- **认证用户**: 1000 请求/小时

### 数据大小限制
- **请求体大小**: 最大 1MB
- **提示词内容**: 最大 50KB
- **标签数量**: 最大 10 个

---

## 💡 使用示例

### JavaScript/TypeScript
```typescript
// 登录示例
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    return data.user;
  } else {
    throw new Error(data.error);
  }
};

// 获取公开提示词示例
const getPublicPrompts = async (category?: string) => {
  const token = localStorage.getItem('token');
  const url = new URL('/api/prompts', window.location.origin);
  
  if (category) {
    url.searchParams.append('category', category);
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });
  
  return response.json();
};

// 获取个人提示词示例
const getMyPrompts = async (category?: string) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication required');
  
  const url = new URL('/api/prompts/my', window.location.origin);
  
  if (category) {
    url.searchParams.append('category', category);
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
};
```

### Python
```python
import requests

# 登录示例
def login(email, password):
    response = requests.post('/api/auth/login', json={
        'email': email,
        'password': password
    })
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(response.json()['error'])

# 创建提示词示例
def create_prompt(token, title, content):
    response = requests.post('/api/prompts', 
        headers={'Authorization': f'Bearer {token}'},
        json={
            'title': title,
            'content': content,
            'isPublic': True
        }
    )
    
    return response.json()
```

### cURL
```bash
# 登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah@example.com","password":"password123"}'

# 获取公开提示词
curl -X GET "http://localhost:3001/api/prompts?category=web-development" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取个人提示词
curl -X GET "http://localhost:3001/api/prompts/my?category=web-development" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 创建提示词
curl -X POST http://localhost:3001/api/prompts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Prompt",
    "content": "This is a test prompt content",
    "isPublic": true
  }'
```

---

## 👥 团队协作 API

### 🏢 获取用户团队列表
获取当前用户所属的所有团队

```http
GET /teams
Authorization: Bearer <token>
```

**响应 (200 OK)**:
```json
{
  "teams": [
    {
      "id": 1,
      "name": "开发团队",
      "description": "产品开发团队",
      "ownerId": 1,
      "isActive": true,
      "createdAt": "2024-06-24T00:00:00.000Z",
      "updatedAt": "2024-06-24T00:00:00.000Z",
      "owner": {
        "id": 1,
        "username": "leader",
        "email": "leader@example.com"
      },
      "members": [
        {
          "id": 1,
          "teamId": 1,
          "userId": 1,
          "role": "owner",
          "joinedAt": "2024-06-24T00:00:00.000Z",
          "user": {
            "id": 1,
            "username": "leader",
            "email": "leader@example.com"
          }
        }
      ]
    }
  ]
}
```

### 🏢 创建新团队
创建一个新的团队

```http
POST /teams
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "新团队",
  "description": "团队描述"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 团队名称 (3-100字符) |
| `description` | string | 否 | 团队描述 |

**响应 (201 Created)**:
```json
{
  "message": "Team created successfully",
  "team": {
    "id": 2,
    "name": "新团队",
    "description": "团队描述",
    "ownerId": 1,
    "isActive": true,
    "createdAt": "2024-06-24T00:00:00.000Z",
    "updatedAt": "2024-06-24T00:00:00.000Z",
    "owner": {
      "id": 1,
      "username": "leader",
      "email": "leader@example.com"
    },
    "members": [
      {
        "id": 2,
        "teamId": 2,
        "userId": 1,
        "role": "owner",
        "joinedAt": "2024-06-24T00:00:00.000Z",
        "user": {
          "id": 1,
          "username": "leader",
          "email": "leader@example.com"
        }
      }
    ]
  }
}
```

### 👥 邀请成员加入团队
邀请用户加入团队

```http
POST /teams/:id/members
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 团队 ID |

**请求体**:
```json
{
  "email": "member@example.com",
  "role": "editor"
}
```

**团队角色**:
- `owner`: 团队所有者 (拥有所有权限)
- `admin`: 管理员 (可邀请/移除成员、管理团队设置)
- `editor`: 编辑者 (可编辑团队提示词)
- `viewer`: 查看者 (只能查看团队内容)

**响应 (201 Created)**:
```json
{
  "message": "Member invited successfully"
}
```

### 🔄 更新成员角色
更新团队成员的角色

```http
PUT /teams/:id/members/:memberId
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 团队 ID |
| `memberId` | number | 是 | 成员用户 ID |

**请求体**:
```json
{
  "role": "admin"
}
```

**响应 (200 OK)**:
```json
{
  "message": "Member role updated successfully"
}
```

### 🚪 移除团队成员
移除团队成员

```http
DELETE /teams/:id/members/:memberId
Authorization: Bearer <token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 团队 ID |
| `memberId` | number | 是 | 成员用户 ID |

**响应 (200 OK)**:
```json
{
  "message": "Member removed successfully"
}
```

**权限说明**:
- **邀请成员**: 只有 owner 和 admin 可以邀请
- **更新角色**: 只有 owner 和 admin 可以操作
- **移除成员**: admin 和 owner 可以移除其他成员，用户可以自己离开团队
- **Owner 限制**: 不能移除或降级团队所有者

---

## 💬 评论反馈 API

### 📝 获取提示词评论
获取指定提示词的所有评论

```http
GET /comments/prompt/:promptId
Authorization: Bearer <token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `promptId` | number | 是 | 提示词 ID |

**响应 (200 OK)**:
```json
{
  "comments": [
    {
      "id": 1,
      "promptId": 1,
      "userId": 2,
      "content": "这个提示词写得很好！",
      "parentId": null,
      "isResolved": false,
      "createdAt": "2024-06-24T00:00:00.000Z",
      "updatedAt": "2024-06-24T00:00:00.000Z",
      "user": {
        "id": 2,
        "username": "reviewer"
      },
      "replies": [
        {
          "id": 2,
          "promptId": 1,
          "userId": 1,
          "content": "谢谢你的反馈！",
          "parentId": 1,
          "isResolved": false,
          "createdAt": "2024-06-24T01:00:00.000Z",
          "updatedAt": "2024-06-24T01:00:00.000Z",
          "user": {
            "id": 1,
            "username": "author"
          }
        }
      ]
    }
  ]
}
```

### 💬 创建评论
为提示词创建新评论或回复

```http
POST /comments
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "promptId": 1,
  "content": "这是一条评论",
  "parentId": null
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `promptId` | number | 是 | 提示词 ID |
| `content` | string | 是 | 评论内容 (1-1000字符) |
| `parentId` | number | 否 | 父评论 ID (用于回复) |

**响应 (201 Created)**:
```json
{
  "message": "Comment created successfully",
  "comment": {
    "id": 3,
    "promptId": 1,
    "userId": 2,
    "content": "这是一条评论",
    "parentId": null,
    "isResolved": false,
    "createdAt": "2024-06-24T02:00:00.000Z",
    "updatedAt": "2024-06-24T02:00:00.000Z",
    "user": {
      "id": 2,
      "username": "reviewer"
    }
  }
}
```

### ✏️ 更新评论
更新评论内容（仅评论作者可操作）

```http
PUT /comments/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 评论 ID |

**请求体**:
```json
{
  "content": "更新后的评论内容"
}
```

**响应 (200 OK)**:
```json
{
  "message": "Comment updated successfully",
  "comment": {
    "id": 3,
    "content": "更新后的评论内容",
    "updatedAt": "2024-06-24T03:00:00.000Z",
    "user": {
      "id": 2,
      "username": "reviewer"
    }
  }
}
```

### 🗑️ 删除评论
删除评论（评论作者或提示词所有者可操作）

```http
DELETE /comments/:id
Authorization: Bearer <token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 评论 ID |

**响应 (200 OK)**:
```json
{
  "message": "Comment deleted successfully"
}
```

### ✅ 标记评论已解决
标记评论为已解决状态（仅提示词所有者可操作）

```http
PUT /comments/:id/resolve
Authorization: Bearer <token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 评论 ID |

**响应 (200 OK)**:
```json
{
  "message": "Comment resolved successfully",
  "isResolved": true
}
```

**评论系统权限说明**:
- **查看评论**: 需要对提示词有访问权限
- **创建评论**: 需要对提示词有访问权限
- **编辑评论**: 只有评论作者可以编辑
- **删除评论**: 评论作者或提示词所有者可以删除
- **解决评论**: 只有提示词所有者可以标记为已解决

**错误响应**:
```json
// 403 Forbidden - 权限不足
{
  "error": "Access denied"
}

// 404 Not Found - 资源不存在
{
  "error": "Comment not found"
}

// 400 Bad Request - 参数错误
{
  "error": "Content is required"
}
```

---

## 📚 附录

### 数据模型说明

#### User 用户模型
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  password: string; // 仅在后端存储，API 响应中不包含
  createdAt: Date;
  updatedAt: Date;
}
```

#### Prompt 提示词模型
```typescript
interface Prompt {
  id: number;
  title: string;
  content: string;
  description?: string;
  version: number;
  isTemplate: boolean;
  category?: string;
  tags?: string[];
  userId: number;
  parentId?: number; // 用于版本控制
  teamId?: number; // 所属团队
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: Pick<User, 'id' | 'username'>;
  team?: Pick<Team, 'id' | 'name'>;
}
```

#### Team 团队模型
```typescript
interface Team {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner?: Pick<User, 'id' | 'username' | 'email'>;
  members?: TeamMember[];
}
```

#### TeamMember 团队成员模型
```typescript
interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: Pick<User, 'id' | 'username' | 'email'>;
  team?: Pick<Team, 'id' | 'name'>;
}
```

#### Comment 评论模型
```typescript
interface Comment {
  id: number;
  promptId: number;
  userId: number;
  content: string;
  parentId?: number; // 用于回复
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: Pick<User, 'id' | 'username'>;
  prompt?: Pick<Prompt, 'id' | 'title'>;
  replies?: Comment[];
}
```

---

**API 文档版本**: v2.0.0  
**最后更新**: 2024-06-24  
**维护者**: PromptFlow 开发团队

### 📝 更新日志

#### v2.0.0 (2024-06-24) - 团队协作重大更新
- ✅ 新增团队协作系统 (8个API端点)
- ✅ 团队管理功能 (创建、更新、删除团队)
- ✅ 成员权限分级系统 (owner/admin/editor/viewer)
- ✅ 评论反馈系统 (5个API端点)
- ✅ 支持评论回复和状态管理
- ✅ 完整的权限控制和安全验证
- ✅ 新增数据模型: Team, TeamMember, Comment
- ✅ 81个测试用例全部通过 (新增47个团队协作测试)
- ✅ Phase 2 团队协作功能全部实现

#### v1.2.0 (2024-06-24)
- ✅ 完成模板库系统开发
- ✅ Phase 1 核心功能全部实现
- ✅ 新增模板浏览和使用功能
- ✅ 完善前端模板集成
- ✅ 增加模板库测试覆盖

#### v1.1.0 (2024-06-24)
- ✅ 新增 `/prompts/my` 端点用于获取用户个人提示词
- ✅ 增强权限控制说明
- ✅ 更新使用示例和代码片段
- ✅ 添加 API 快速参考表格
- ✅ 完善错误处理文档
- ✅ 高级编辑器功能完整支持

#### v1.0.0 (2024-01-01)
- ✅ 完整的认证系统 API
- ✅ 提示词管理 CRUD 操作
- ✅ 版本控制系统 API
- ✅ 健康检查端点