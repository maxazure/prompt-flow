#!/bin/bash

# PromptFlow 开发环境启动脚本
# 功能：
# 1. 杀掉已有的前端和后端进程
# 2. 同时启动前端和后端开发服务器
# 3. 脚本退出时自动清理进程

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 进程ID存储
BACKEND_PID=""
FRONTEND_PID=""

# 清理函数
cleanup() {
    log_info "正在清理进程..."
    
    if [ ! -z "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        log_info "停止后端进程 (PID: $BACKEND_PID)"
        kill -TERM $BACKEND_PID 2>/dev/null || true
        wait $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        log_info "停止前端进程 (PID: $FRONTEND_PID)"
        kill -TERM $FRONTEND_PID 2>/dev/null || true
        wait $FRONTEND_PID 2>/dev/null || true
    fi
    
    # 额外清理可能残留的进程
    pkill -f "node.*npm.*dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "ts-node.*src/index.ts" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    
    log_success "进程清理完成"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM EXIT

# 杀掉已有进程
log_info "正在清理已有的开发进程..."

# 杀掉端口占用的进程
npx kill-port 3001 5173 2>/dev/null || true

# 杀掉相关的Node.js进程
pkill -f "node.*npm.*dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "ts-node.*src/index.ts" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# 等待进程完全退出
sleep 2

log_success "已清理现有进程"

# 检查项目目录
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    log_error "未找到 backend 或 frontend 目录，请在项目根目录运行此脚本"
    exit 1
fi

# 检查依赖
log_info "检查项目依赖..."

if [ ! -d "backend/node_modules" ]; then
    log_warning "后端依赖未安装，正在安装..."
    cd backend && pnpm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    log_warning "前端依赖未安装，正在安装..."
    cd frontend && pnpm install && cd ..
fi

log_success "依赖检查完成"

# 创建日志目录
mkdir -p logs

# 启动后端
log_info "启动后端服务器 (端口: 3001)..."
cd backend
pnpm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    log_error "后端启动失败，查看日志: logs/backend.log"
    exit 1
fi

log_success "后端服务器启动成功 (PID: $BACKEND_PID)"

# 启动前端
log_info "启动前端开发服务器 (端口: 5173)..."
cd frontend
pnpm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 等待前端启动
sleep 3

# 检查前端是否启动成功
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    log_error "前端启动失败，查看日志: logs/frontend.log"
    cleanup
    exit 1
fi

log_success "前端开发服务器启动成功 (PID: $FRONTEND_PID)"

# 显示服务信息
echo ""
echo "============================================"
echo -e "${GREEN}🚀 PromptFlow 开发环境已启动${NC}"
echo "============================================"
echo -e "${BLUE}后端服务:${NC} http://localhost:3001"
echo -e "${BLUE}前端服务:${NC} http://localhost:5173"
echo -e "${BLUE}后端日志:${NC} tail -f logs/backend.log"
echo -e "${BLUE}前端日志:${NC} tail -f logs/frontend.log"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
echo "============================================"
echo ""

# 实时显示日志（可选）
if command -v multitail >/dev/null 2>&1; then
    log_info "使用 multitail 显示实时日志 (安装: brew install multitail)"
    multitail -ci green logs/backend.log -ci blue logs/frontend.log
else
    # 简单的日志显示
    tail -f logs/backend.log logs/frontend.log &
    TAIL_PID=$!
    
    # 等待用户中断
    while true; do
        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            log_error "后端进程意外退出"
            break
        fi
        
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            log_error "前端进程意外退出"
            break
        fi
        
        sleep 5
    done
    
    # 停止日志显示
    if [ ! -z "$TAIL_PID" ]; then
        kill $TAIL_PID 2>/dev/null || true
    fi
fi

# 清理会在 trap 中自动执行