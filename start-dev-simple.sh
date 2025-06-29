#!/bin/bash

# PromptFlow 开发环境启动脚本 (简化版)
# 用法: ./start-dev-simple.sh [stop|status|logs]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 进程ID文件
PIDFILE=".dev-pids"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 停止服务
stop_services() {
    log_info "正在停止服务..."
    
    # 从PID文件读取并杀掉进程
    if [ -f "$PIDFILE" ]; then
        while read line; do
            if [ ! -z "$line" ] && kill -0 $line 2>/dev/null; then
                kill -TERM $line 2>/dev/null || true
            fi
        done < "$PIDFILE"
        rm -f "$PIDFILE"
    fi
    
    # 清理端口和进程
    npx kill-port 3001 5173 2>/dev/null || true
    pkill -f "node.*npm.*dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "ts-node.*src/index.ts" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    
    log_success "服务已停止"
}

# 检查服务状态
check_status() {
    echo "============================================"
    echo "PromptFlow 服务状态"
    echo "============================================"
    
    # 检查端口
    if lsof -i :3001 >/dev/null 2>&1; then
        echo -e "后端 (3001): ${GREEN}运行中${NC} - http://localhost:3001"
    else
        echo -e "后端 (3001): ${RED}未运行${NC}"
    fi
    
    if lsof -i :5173 >/dev/null 2>&1; then
        echo -e "前端 (5173): ${GREEN}运行中${NC} - http://localhost:5173"
    else
        echo -e "前端 (5173): ${RED}未运行${NC}"
    fi
    
    # 检查日志文件
    if [ -f "logs/backend.log" ]; then
        echo -e "后端日志: ${BLUE}logs/backend.log${NC}"
    fi
    
    if [ -f "logs/frontend.log" ]; then
        echo -e "前端日志: ${BLUE}logs/frontend.log${NC}"
    fi
    
    echo "============================================"
}

# 显示日志
show_logs() {
    if [ "$1" = "backend" ]; then
        if [ -f "logs/backend.log" ]; then
            tail -f logs/backend.log
        else
            log_error "后端日志文件不存在"
        fi
    elif [ "$1" = "frontend" ]; then
        if [ -f "logs/frontend.log" ]; then
            tail -f logs/frontend.log
        else
            log_error "前端日志文件不存在"
        fi
    else
        if [ -f "logs/backend.log" ] && [ -f "logs/frontend.log" ]; then
            tail -f logs/backend.log logs/frontend.log
        else
            log_error "日志文件不存在"
        fi
    fi
}

# 启动服务
start_services() {
    # 清理已有进程
    log_info "清理已有进程..."
    stop_services
    sleep 2
    
    # 检查目录
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        log_error "未找到项目目录，请在项目根目录运行"
        exit 1
    fi
    
    # 创建日志目录
    mkdir -p logs
    
    # 启动后端
    log_info "启动后端服务器..."
    cd backend
    pnpm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID >> "../$PIDFILE"
    cd ..
    
    # 等待后端启动
    sleep 3
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        log_error "后端启动失败，查看: logs/backend.log"
        exit 1
    fi
    
    # 启动前端
    log_info "启动前端服务器..."
    cd frontend
    pnpm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID >> "../$PIDFILE"
    cd ..
    
    # 等待前端启动
    sleep 3
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        log_error "前端启动失败，查看: logs/frontend.log"
        stop_services
        exit 1
    fi
    
    log_success "服务启动成功"
    check_status
    
    echo ""
    echo "使用命令:"
    echo "  $0 status  - 查看状态"
    echo "  $0 stop    - 停止服务"
    echo "  $0 logs    - 查看日志"
    echo "  $0 logs backend  - 查看后端日志"
    echo "  $0 logs frontend - 查看前端日志"
}

# 主逻辑
case "${1:-start}" in
    "stop")
        stop_services
        ;;
    "status")
        check_status
        ;;
    "logs")
        show_logs $2
        ;;
    "start"|"")
        start_services
        ;;
    *)
        echo "用法: $0 [start|stop|status|logs]"
        echo ""
        echo "命令:"
        echo "  start   - 启动开发服务器 (默认)"
        echo "  stop    - 停止所有服务"
        echo "  status  - 查看服务状态"
        echo "  logs    - 查看所有日志"
        echo "  logs backend  - 查看后端日志"
        echo "  logs frontend - 查看前端日志"
        exit 1
        ;;
esac