# 🚀 部署指南

## 📋 部署前检查清单

### ✅ 环境要求
- [ ] Node.js 18+ 已安装
- [ ] npm 或 yarn 包管理器
- [ ] Git 版本控制
- [ ] 域名和 SSL 证书（生产环境）
- [ ] 数据库服务器（可选，SQLite 可本地运行）

### ✅ 代码准备
- [ ] 所有测试通过
- [ ] 代码已推送到 Git 仓库
- [ ] 环境变量配置完成
- [ ] 构建脚本验证通过

---

## 🖥️ 本地开发环境

### 快速启动
```bash
# 1. 克隆项目
git clone https://github.com/your-username/prompt-flow.git
cd prompt-flow

# 2. 安装后端依赖
cd backend
npm install

# 3. 安装前端依赖
cd ../frontend
npm install

# 4. 配置环境变量
# 后端 .env
echo "NODE_ENV=development
PORT=3001
JWT_SECRET=your_development_secret_key" > backend/.env

# 前端 .env
echo "VITE_API_URL=http://localhost:3001" > frontend/.env

# 5. 启动服务
# 终端1 - 启动后端
cd backend && npm run dev

# 终端2 - 启动前端
cd frontend && npm run dev
```

### 访问地址
- **前端应用**: http://localhost:5173
- **后端 API**: http://localhost:3001
- **API 健康检查**: http://localhost:3001/health

---

## ☁️ 云服务部署

### 1. Vercel + Railway 部署（推荐）

#### 前端部署 (Vercel)
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 部署前端
cd frontend
vercel

# 3. 配置环境变量
vercel env add VITE_API_URL production
# 输入: https://your-api-domain.railway.app
```

#### 后端部署 (Railway)
```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录 Railway
railway login

# 3. 初始化项目
cd backend
railway init

# 4. 配置环境变量
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your_production_secret_key
railway variables set PORT=3001

# 5. 部署
railway up
```

### 2. Heroku 部署

#### 后端部署到 Heroku
```bash
# 1. 安装 Heroku CLI
# 下载: https://devcenter.heroku.com/articles/heroku-cli

# 2. 登录 Heroku
heroku login

# 3. 创建应用
cd backend
heroku create your-app-name-api

# 4. 配置环境变量
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_production_secret_key

# 5. 部署
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

#### 前端部署配置
```json
{
  "name": "prompt-flow-frontend",
  "build": {
    "env": {
      "VITE_API_URL": "https://your-app-name-api.herokuapp.com"
    }
  }
}
```

### 3. Docker 容器化部署

#### 后端 Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

#### 前端 Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your_production_secret
    volumes:
      - ./data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://localhost:3001

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
```

---

## 🗄️ 数据库部署

### SQLite（开发/小规模）
```bash
# SQLite 文件会自动创建
# 确保数据目录有写权限
mkdir -p data
chmod 755 data
```

### PostgreSQL（生产环境推荐）

#### 环境变量配置
```env
# 替换 SQLite 配置
DB_TYPE=postgres
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=promptflow
DB_USER=your-username
DB_PASSWORD=your-password
```

#### 代码修改
```typescript
// backend/src/config/database.ts
const sequelize = new Sequelize({
  dialect: process.env.DB_TYPE === 'postgres' ? 'postgres' : 'sqlite',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'promptflow',
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  storage: process.env.DB_TYPE === 'sqlite' ? dbPath : undefined,
  logging: false,
});
```

---

## 🔧 环境变量配置

### 后端环境变量
```env
# 基础配置
NODE_ENV=production
PORT=3001

# 安全配置
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters
BCRYPT_ROUNDS=12

# 数据库配置
DB_TYPE=sqlite
# DB_HOST=your-postgres-host (PostgreSQL)
# DB_PORT=5432 (PostgreSQL)
# DB_NAME=promptflow (PostgreSQL)
# DB_USER=username (PostgreSQL)
# DB_PASSWORD=password (PostgreSQL)

# CORS 配置
ALLOWED_ORIGINS=https://your-frontend-domain.com

# 日志配置
LOG_LEVEL=info
```

### 前端环境变量
```env
# API 配置
VITE_API_URL=https://your-api-domain.com

# 应用配置
VITE_APP_NAME=PromptFlow
VITE_APP_VERSION=1.0.0

# 分析配置（可选）
VITE_GA_TRACKING_ID=GA_MEASUREMENT_ID
```

---

## 🔒 安全配置

### SSL/HTTPS 配置
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://frontend:80;
    }

    location /api {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 防火墙配置
```bash
# 只开放必要端口
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

---

## 📊 监控和日志

### 健康检查端点
```typescript
// 后端健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});
```

### 日志配置
```bash
# PM2 进程管理
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看日志
pm2 logs

# 监控
pm2 monit
```

---

## 🔄 CI/CD 自动部署

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        uses: railway-community/deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 🛠️ 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查数据库文件权限
ls -la database.sqlite

# 检查目录权限
ls -la data/

# 重置权限
chmod 644 database.sqlite
chmod 755 data/
```

#### 2. CORS 错误
```typescript
// 检查 CORS 配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
```

#### 3. 环境变量未加载
```bash
# 检查环境变量
echo $NODE_ENV
printenv | grep VITE_

# 重新加载环境变量
source .env
```

### 性能优化

#### 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_prompts_user_id ON prompts(userId);
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_public ON prompts(isPublic);
```

#### 静态资源优化
```bash
# 启用 gzip 压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# 设置缓存头
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## ✅ 部署验证清单

### 功能测试
- [ ] 用户注册和登录正常
- [ ] 提示词创建、编辑、删除功能
- [ ] 公共提示词显示正确
- [ ] API 响应时间合理（< 2秒）
- [ ] 移动端显示正常

### 安全检查
- [ ] HTTPS 正常工作
- [ ] JWT 令牌验证有效
- [ ] 权限控制正确
- [ ] 敏感信息未暴露

### 性能检查
- [ ] 页面加载速度 < 3秒
- [ ] API 响应时间 < 1秒
- [ ] 数据库查询优化
- [ ] 内存使用合理

---

**部署完成！** 🎉 你的 PromptFlow 应用现在已经可以为 Sarah 团队提供服务了！