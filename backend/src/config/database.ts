import { Sequelize } from 'sequelize';
import path from 'path';

// 创建数据库连接
const createSequelizeInstance = (): Sequelize => {
  const isTest = process.env.NODE_ENV === 'test';
  const databaseType = process.env.DATABASE_TYPE || 'sqlite';
  
  console.log(`🔧 Creating database connection with type: ${databaseType}`);
  
  if (databaseType === 'postgres') {
    // PostgreSQL 配置
    console.log('🐘 Configuring PostgreSQL connection...');
    return new Sequelize({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      database: process.env.POSTGRES_DB || 'prompt_flow',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  } else if (databaseType === 'mysql') {
    // MySQL 配置
    console.log('🐬 Configuring MySQL connection...');
    return new Sequelize({
      dialect: 'mysql',
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      username: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DB || 'prompt_flow',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  } else {
    // SQLite 配置 (默认)
    console.log('📁 Configuring SQLite connection...');
    const dbPath = isTest
      ? ':memory:'
      : path.join(__dirname, '../../database.sqlite');
    
    return new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    });
  }
};

// 延迟初始化数据库连接
let sequelizeInstance: Sequelize | null = null;

// 清理缓存的数据库连接实例
export const clearDatabaseCache = async (): Promise<void> => {
  if (sequelizeInstance) {
    try {
      console.log('🧹 Clearing database connection cache...');
      await sequelizeInstance.close();
      console.log('✅ Previous database connection closed successfully');
    } catch (error) {
      console.warn('⚠️  Warning: Error closing previous database connection:', error);
    } finally {
      sequelizeInstance = null;
      console.log('🔄 Database instance cache cleared');
    }
  }
};

// 强制重新创建数据库连接（忽略缓存）
export const forceCreateConnection = (): Sequelize => {
  console.log('🔄 Force creating new database connection...');
  const newInstance = createSequelizeInstance();
  sequelizeInstance = newInstance;
  return newInstance;
};

export const getSequelizeInstance = (): Sequelize => {
  if (!sequelizeInstance) {
    sequelizeInstance = createSequelizeInstance();
  }
  return sequelizeInstance;
};

// 初始化时清理缓存（服务器重启时）
const initializeConnection = async (): Promise<Sequelize> => {
  // 清理之前的连接缓存
  await clearDatabaseCache();
  
  // 创建新的连接
  const instance = forceCreateConnection();
  
  console.log('🚀 Database connection initialized with cache clearing');
  return instance;
};

// 导出连接实例（在服务器启动时会重新初始化）
export const sequelize = getSequelizeInstance();

export const initDatabase = async () => {
  try {
    const isTest = process.env.NODE_ENV === 'test';
    const databaseType = process.env.DATABASE_TYPE || 'sqlite';
    
    console.log('🚀 Initializing database...');
    
    // 只在第一次启动时清理缓存，不在运行时关闭连接
    if (!sequelizeInstance) {
      console.log('🧹 Clearing any existing database cache (first startup)...');
      await clearDatabaseCache();
    }
    
    // 获取或创建数据库连接
    const currentSequelize = getSequelizeInstance();
    
    // 确保所有模型都被加载
    require('../models');
    
    await currentSequelize.authenticate();
    console.log(`Database connection established successfully. Using ${databaseType.toUpperCase()}.`);
    
    // 验证连接的数据库信息
    if (databaseType === 'postgres') {
      try {
        const result = await currentSequelize.query('SELECT current_database() as db, current_user as user');
        const dbInfo = result[0][0] as any;
        console.log(`📊 Connected to PostgreSQL database: ${dbInfo.db} (user: ${dbInfo.user})`);
      } catch (error) {
        console.warn('⚠️  Could not verify PostgreSQL connection details');
      }
    }
    
    // 在测试环境或首次运行时同步数据库
    await currentSequelize.sync({ force: isTest });
    console.log('Database synchronized.');
    
    console.log('✅ Database initialization completed');
  } catch (error) {
    const databaseType = process.env.DATABASE_TYPE || 'sqlite';
    console.error(`Unable to connect to the ${databaseType.toUpperCase()} database:`, error);
    throw error;
  }
};