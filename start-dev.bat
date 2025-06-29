@echo off
setlocal enabledelayedexpansion

REM PromptFlow 开发环境启动脚本 (Windows版本)
REM 功能：
REM 1. 杀掉已有的前端和后端进程
REM 2. 同时启动前端和后端开发服务器
REM 3. 脚本退出时自动清理进程

title PromptFlow Development Server

echo [INFO] 正在清理已有的开发进程...

REM 杀掉端口占用的进程
npx kill-port 3001 5173 >nul 2>&1

REM 杀掉相关的Node.js进程
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im "npm.cmd" >nul 2>&1
taskkill /f /im "pnpm.cmd" >nul 2>&1

REM 等待进程完全退出
timeout /t 2 >nul

echo [SUCCESS] 已清理现有进程

REM 检查项目目录
if not exist "backend" (
    echo [ERROR] 未找到 backend 目录，请在项目根目录运行此脚本
    pause
    exit /b 1
)

if not exist "frontend" (
    echo [ERROR] 未找到 frontend 目录，请在项目根目录运行此脚本
    pause
    exit /b 1
)

echo [INFO] 检查项目依赖...

REM 检查依赖
if not exist "backend\node_modules" (
    echo [WARNING] 后端依赖未安装，正在安装...
    cd backend
    call pnpm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo [WARNING] 前端依赖未安装，正在安装...
    cd frontend
    call pnpm install
    cd ..
)

echo [SUCCESS] 依赖检查完成

REM 创建日志目录
if not exist "logs" mkdir logs

echo [INFO] 启动后端服务器 (端口: 3001)...

REM 启动后端
cd backend
start "Backend Server" /min cmd /c "pnpm run dev > ..\logs\backend.log 2>&1"
cd ..

REM 等待后端启动
timeout /t 3 >nul

echo [SUCCESS] 后端服务器启动成功

echo [INFO] 启动前端开发服务器 (端口: 5173)...

REM 启动前端
cd frontend
start "Frontend Server" /min cmd /c "pnpm run dev > ..\logs\frontend.log 2>&1"
cd ..

REM 等待前端启动
timeout /t 3 >nul

echo [SUCCESS] 前端开发服务器启动成功

echo.
echo ============================================
echo 🚀 PromptFlow 开发环境已启动
echo ============================================
echo 后端服务: http://localhost:3001
echo 前端服务: http://localhost:5173
echo 后端日志: logs\backend.log
echo 前端日志: logs\frontend.log
echo.
echo 按任意键停止所有服务...
echo ============================================
echo.

REM 等待用户输入
pause >nul

echo [INFO] 正在停止服务...

REM 杀掉进程
npx kill-port 3001 5173 >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im "npm.cmd" >nul 2>&1
taskkill /f /im "pnpm.cmd" >nul 2>&1

echo [SUCCESS] 服务已停止

endlocal