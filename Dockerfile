# 多阶段构建：前端构建阶段
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
# 复制 package 文件并安装依赖（优化缓存）
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund

# 复制源码并构建
COPY frontend/ ./
RUN npm run build

# 后端构建阶段
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend
# 复制 package 文件并安装所有依赖
COPY backend/package*.json ./
RUN npm ci --no-audit --no-fund

# 复制源码并构建
COPY backend/ ./
RUN npm run build

# 清理并只保留生产依赖
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# 生产阶段：单一服务
FROM node:18-alpine AS production

# 安装必要软件包
RUN apk add --no-cache \
    nginx \
    wget \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 创建非特权用户
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# 设置工作目录
WORKDIR /app

# 复制后端构建文件
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/

# 复制前端构建文件到 nginx 目录
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# 创建 nginx 配置
RUN mkdir -p /etc/nginx/conf.d
COPY <<EOF /etc/nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml;

    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;
        
        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # 静态文件缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Frame-Options "SAMEORIGIN" always;
            add_header X-Content-Type-Options "nosniff" always;
        }

        # 前端路由
        location / {
            try_files \$uri \$uri/ /index.html;
            # HTML 文件不缓存
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }

        # API 代理到后端
        location /api {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            
            # API 超时设置
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # 健康检查
        location /health {
            proxy_pass http://localhost:3001/health;
            access_log off;
        }
        
        # 隐藏服务器版本信息
        server_tokens off;
    }
}
EOF

# 创建启动脚本
COPY <<EOF /app/start.sh
#!/bin/sh
set -e

echo "🚀 Starting PromptFlow..."

# 创建必要的目录和权限
mkdir -p /var/log/nginx /var/lib/nginx/tmp
chown -R appuser:appgroup /var/log/nginx /var/lib/nginx

# 启动后端服务（后台运行）
echo "📡 Starting backend server..."
cd /app/backend
su-exec appuser node dist/index.js &
BACKEND_PID=\$!

# 健康检查：等待后端启动
echo "⏳ Waiting for backend to be ready..."
for i in \$(seq 1 30); do
    if wget --quiet --tries=1 --spider http://localhost:3001/health 2>/dev/null; then
        echo "✅ Backend is ready"
        break
    fi
    if [ \$i -eq 30 ]; then
        echo "❌ Backend failed to start"
        exit 1
    fi
    sleep 1
done

# 启动 nginx
echo "🌐 Starting nginx..."
exec nginx -g 'daemon off;'
EOF

RUN chmod +x /app/start.sh

# 创建必要目录并设置权限
RUN mkdir -p /var/log/nginx /var/lib/nginx/tmp /run/nginx && \
    chown -R appuser:appgroup /app /usr/share/nginx/html /var/log/nginx /var/lib/nginx /run/nginx

# 安装 su-exec 用于权限切换
RUN apk add --no-cache su-exec

# 暴露端口
EXPOSE 80

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/app/start.sh"]