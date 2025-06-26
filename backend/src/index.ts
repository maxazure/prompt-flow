import dotenv from 'dotenv';

// 首先加载环境变量
dotenv.config({ path: '../.env' });

// 然后导入需要环境变量的模块
import { initDatabase } from './config/database';
import { app } from './app';
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

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app };