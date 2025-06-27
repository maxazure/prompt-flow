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

export const getSequelizeInstance = (): Sequelize => {
  if (!sequelizeInstance) {
    sequelizeInstance = createSequelizeInstance();
  }
  return sequelizeInstance;
};

export const sequelize = getSequelizeInstance();

export const initDatabase = async () => {
  try {
    const isTest = process.env.NODE_ENV === 'test';
    const databaseType = process.env.DATABASE_TYPE || 'sqlite';
    
    // 确保所有模型都被加载
    require('../models');
    
    await sequelize.authenticate();
    console.log(`Database connection established successfully. Using ${databaseType.toUpperCase()}.`);
    
    // 在测试环境或首次运行时同步数据库
    await sequelize.sync({ force: isTest });
    console.log('Database synchronized.');
  } catch (error) {
    const databaseType = process.env.DATABASE_TYPE || 'sqlite';
    console.error(`Unable to connect to the ${databaseType.toUpperCase()} database:`, error);
    throw error;
  }
};