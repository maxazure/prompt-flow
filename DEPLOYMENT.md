# PromptFlow 部署指南

## Docker 部署

### 本地开发环境

```bash
# 构建并启动所有服务
docker-compose up --build

# 后台运行
docker-compose up -d --build

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 生产环境部署

1. **设置环境变量**

创建 `.env` 文件：

```bash
JWT_SECRET=your_super_secret_jwt_key_here
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-nano
```

2. **使用生产配置启动**

```bash
# 拉取最新镜像并启动
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 查看状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

3. **数据持久化**

生产环境的数据库文件会保存在 `./data` 目录中，请确保定期备份。

### Docker Hub 镜像

- **后端镜像**: `maxazure/prompt-flow-backend:latest`
- **前端镜像**: `maxazure/prompt-flow-frontend:latest`

## GitHub Actions 自动部署

### 配置 Secrets

在 GitHub 仓库中设置以下 Secrets：

1. `DOCKERHUB_USERNAME`: 你的 Docker Hub 用户名 (maxazure)
2. `DOCKERHUB_TOKEN`: 你的 Docker Hub 访问令牌

### 自动构建触发条件

- **Push 到 main/master 分支**: 自动构建并推送 `latest` 标签
- **创建 Git 标签**: 自动构建并推送对应版本标签
- **Pull Request**: 仅构建，不推送

### 手动创建版本

```bash
# 创建并推送版本标签
git tag v1.0.0
git push origin v1.0.0
```

## 服务访问

- **前端**: http://localhost
- **后端 API**: http://localhost:3001
- **健康检查**: http://localhost:3001/health

## 故障排除

### 查看容器状态
```bash
docker ps
docker-compose ps
```

### 查看日志
```bash
docker logs prompt-flow-backend-prod
docker logs prompt-flow-frontend-prod
```

### 重启服务
```bash
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend
```

### 清理和重建
```bash
# 停止并删除容器
docker-compose -f docker-compose.prod.yml down

# 清理镜像（可选）
docker image prune -f

# 重新拉取并启动
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 监控和维护

### 健康检查
- 后端: `GET /health`
- 前端: 通过 nginx 状态

### 日志轮转
建议配置 Docker 日志轮转：

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### 备份
定期备份 `./data` 目录中的数据库文件。

## 扩展部署

### 使用反向代理 (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 使用 Docker Swarm 或 Kubernetes

可以将 Docker Compose 配置转换为 Swarm 服务或 Kubernetes 部署配置。