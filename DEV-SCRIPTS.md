# PromptFlow 开发脚本使用指南

## 🚀 快速启动

### 推荐方式：使用npm脚本

```bash
# 启动开发环境 (推荐)
npm run dev

# 或者直接使用
npm start

# Windows用户
npm run dev:win
```

### 方法二：直接使用脚本

#### Linux/macOS:
```bash
# 进入项目根目录
cd /path/to/prompt-flow

# 启动开发环境 (简化版，推荐)
./start-dev-simple.sh

# 启动开发环境 (交互式日志)
./start-dev.sh
```

#### Windows:
```cmd
# 进入项目根目录
cd C:\path\to\prompt-flow

# 启动开发环境
start-dev.bat
```

## 🎯 服务管理命令

```bash
# 启动服务
npm start                    # 或 ./start-dev-simple.sh

# 停止服务
npm run stop                 # 或 ./start-dev-simple.sh stop

# 查看状态
npm run status               # 或 ./start-dev-simple.sh status

# 查看日志
npm run logs                 # 或 ./start-dev-simple.sh logs
npm run logs backend         # 查看后端日志
npm run logs frontend        # 查看前端日志

# 清理端口
npm run kill-ports
```

## 🛠️ 脚本功能

### 自动化功能
- ✅ **进程清理**: 自动杀掉已有的前端/后端进程
- ✅ **端口清理**: 自动释放 3001 和 5173 端口
- ✅ **依赖检查**: 自动检查并安装缺失的依赖
- ✅ **并行启动**: 同时启动前端和后端服务
- ✅ **日志记录**: 自动记录日志到 `logs/` 目录
- ✅ **优雅退出**: 脚本退出时自动清理所有子进程

### 服务信息
- **后端服务**: http://localhost:3001
- **前端服务**: http://localhost:5173
- **后端日志**: logs/backend.log
- **前端日志**: logs/frontend.log

## 📋 使用说明

### 启动服务
1. 确保在项目根目录运行脚本
2. 脚本会自动检查并安装依赖
3. 服务启动后会显示访问地址
4. 实时日志会在终端显示

### 停止服务
- **Linux/macOS**: 按 `Ctrl+C`
- **Windows**: 按任意键

### 查看日志
```bash
# 实时查看后端日志
tail -f logs/backend.log

# 实时查看前端日志
tail -f logs/frontend.log

# 同时查看两个日志（如果安装了multitail）
multitail logs/backend.log logs/frontend.log
```

## 🔧 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 手动清理端口
npm run kill-ports
# 或
npx kill-port 3001 5173
```

#### 2. 权限问题 (Linux/macOS)
```bash
# 给脚本添加执行权限
chmod +x start-dev.sh
```

#### 3. 依赖问题
```bash
# 重新安装依赖
cd backend && rm -rf node_modules && pnpm install && cd ..
cd frontend && rm -rf node_modules && pnpm install && cd ..
```

#### 4. 进程残留
```bash
# 手动杀掉Node.js进程
pkill -f "node.*npm.*dev"
pkill -f "vite"
pkill -f "nodemon"
```

### 日志调试
- 检查 `logs/backend.log` 排查后端问题
- 检查 `logs/frontend.log` 排查前端问题
- 确保数据库连接正常
- 检查环境变量配置

## 🌟 高级用法

### 自定义端口
如需修改端口，编辑以下文件：
- 后端端口: `backend/src/index.ts`
- 前端端口: `frontend/vite.config.ts`

### 环境变量
确保设置以下环境变量：
- `NODE_ENV=development`
- `JWT_SECRET=your_secret`
- `OPENAI_API_KEY=your_api_key`
- 数据库相关配置

### 生产环境部署
开发脚本仅用于开发环境，生产环境请使用：
```bash
# 构建前端
cd frontend && npm run build

# 启动生产服务
cd backend && npm run start
```

## 📞 技术支持

如遇到问题，请检查：
1. Node.js 版本 >= 18
2. pnpm 已安装
3. 项目依赖完整
4. 环境变量配置正确
5. 数据库连接正常

---

**注意**: 此脚本为开发环境专用，不适用于生产环境部署。