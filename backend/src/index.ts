import dotenv from 'dotenv';

// 首先加载环境变量
dotenv.config();

// 然后导入需要环境变量的模块
import { initDatabase, clearDatabaseCache } from './config/database';
import { app } from './app';
import { Server } from 'http';
const PORT = process.env.PORT || 3001;

console.log('🔧 Environment Variables Check:');
console.log(`   📍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   🚪 PORT: ${process.env.PORT}`);
console.log(`   🔑 JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`   🤖 OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'NOT SET'}`);
console.log(`   🎯 OPENAI_MODEL: ${process.env.OPENAI_MODEL || 'gpt-4.1-nano (default)'}`);
console.log(`   🗄️ DATABASE_TYPE: ${process.env.DATABASE_TYPE || 'sqlite (default)'}`);
if (process.env.DATABASE_TYPE === 'postgres') {
  console.log(`   🐘 POSTGRES_HOST: ${process.env.POSTGRES_HOST || 'NOT SET'}`);
  console.log(`   🐘 POSTGRES_DB: ${process.env.POSTGRES_DB || 'NOT SET'}`);
}

let server: Server | null = null;

const startServer = async () => {
  try {
    console.log('🚀 Starting server with database cache clearing...');
    
    // 初始化数据库（包含缓存清理）
    await initDatabase();
    
    // 启动服务器
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('✅ Server started successfully with fresh database connection');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// 优雅关闭处理器
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  try {
    // 关闭HTTP服务器
    if (server) {
      console.log('🔌 Closing HTTP server...');
      await new Promise<void>((resolve) => {
        server!.close(() => {
          console.log('✅ HTTP server closed');
          resolve();
        });
      });
    }
    
    // 清理数据库连接缓存
    console.log('🧹 Clearing database connection cache...');
    await clearDatabaseCache();
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// 注册信号处理器
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app };