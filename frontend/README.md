# PromptFlow Frontend

React + TypeScript + Vite 前端应用，用于 PromptFlow 提示词管理平台。

## 环境配置

### 开发环境

1. 复制环境变量配置文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，设置你的配置：
```env
# API 基础 URL
VITE_API_BASE_URL=http://localhost:3001

# 应用环境
VITE_APP_ENV=development

# 应用名称
VITE_APP_NAME=PromptFlow
```

### 生产环境

1. 复制生产环境配置文件：
```bash
cp .env.production.example .env.production
```

2. 根据你的生产环境设置相应的值：
```env
# 生产环境 API 地址
VITE_API_BASE_URL=https://api.your-domain.com

# 应用环境
VITE_APP_ENV=production
```

## 环境变量说明

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `VITE_API_BASE_URL` | API 服务器基础 URL | `http://localhost:3001` | 是 |
| `VITE_APP_ENV` | 应用运行环境 | `development` | 是 |
| `VITE_APP_NAME` | 应用显示名称 | `PromptFlow` | 是 |
| `VITE_ENABLE_ANALYTICS` | 是否启用分析 | `false` | 否 |
| `VITE_GA_TRACKING_ID` | Google Analytics ID | - | 否 |

### 环境变量值的格式说明

**包含空格的应用名称：**
```env
# 方法 1：不加引号（推荐）
VITE_APP_NAME=My Awesome App

# 方法 2：使用双引号
VITE_APP_NAME="My Awesome App"

# 方法 3：使用单引号
VITE_APP_NAME='My Awesome App'
```

**特殊字符处理：**
- 包含空格：直接写入或使用引号包围
- 包含引号：使用相反类型的引号包围
- 包含特殊符号：建议使用引号包围

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 运行测试
npm test

# 运行 linting
npm run lint
```

## 构建和部署

### 本地构建

```bash
# 使用默认环境变量构建
npm run build

# 使用生产环境变量构建
npm run build -- --mode production
```

### Docker 构建

项目包含 Dockerfile 和 nginx 配置，支持容器化部署：

```bash
# 构建 Docker 镜像
docker build -t promptflow-frontend .

# 运行容器
docker run -p 80:80 promptflow-frontend
```

### 部署配置

在部署时，可以通过以下方式配置环境变量：

1. **构建时注入**：在构建时设置环境变量
   ```bash
   VITE_API_BASE_URL=https://api.production.com npm run build
   ```

2. **使用 .env 文件**：创建 `.env.production` 文件并在构建时使用
   ```bash
   npm run build -- --mode production
   ```

3. **CI/CD 环境变量**：在 CI/CD 平台（如 GitHub Actions）中设置环境变量

## 项目结构

```
frontend/
├── src/
│   ├── components/     # 可复用组件
│   ├── pages/         # 页面组件
│   ├── services/      # API 服务
│   ├── context/       # React Context
│   ├── types/         # TypeScript 类型定义
│   └── App.tsx        # 应用主组件
├── public/            # 静态资源
├── .env.example       # 环境变量示例
└── vite.config.ts     # Vite 配置
```

## 技术栈

- **React** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Axios** - HTTP 客户端
- **React Router** - 路由管理
- **Recharts** - 数据可视化

## 注意事项

1. 所有环境变量必须以 `VITE_` 前缀开头才能在客户端代码中访问
2. 不要在环境变量中存储敏感信息（如 API 密钥），这些信息会暴露在客户端代码中
3. 生产环境部署时，确保 API 服务器配置了正确的 CORS 设置