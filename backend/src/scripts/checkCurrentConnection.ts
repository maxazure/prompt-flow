import dotenv from 'dotenv';
import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

// 加载环境变量
dotenv.config();

const checkCurrentConnection = async () => {
  console.log('🔍 检查当前后台数据库连接配置...\n');

  // 1. 检查环境变量
  console.log('📋 环境变量配置:');
  console.log('==========================================');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || '未设置'}`);
  console.log(`DATABASE_TYPE: ${process.env.DATABASE_TYPE || '未设置'}`);
  console.log('');

  if (process.env.DATABASE_TYPE === 'postgres') {
    console.log('🐘 PostgreSQL 配置:');
    console.log(`POSTGRES_HOST: ${process.env.POSTGRES_HOST || '未设置'}`);
    console.log(`POSTGRES_PORT: ${process.env.POSTGRES_PORT || '未设置'}`);
    console.log(`POSTGRES_USER: ${process.env.POSTGRES_USER || '未设置'}`);
    console.log(`POSTGRES_DB: ${process.env.POSTGRES_DB || '未设置'}`);
    console.log(`POSTGRES_PASSWORD: ${process.env.POSTGRES_PASSWORD ? '已设置 (长度: ' + process.env.POSTGRES_PASSWORD.length + ')' : '未设置'}`);
  } else if (process.env.DATABASE_TYPE === 'sqlite') {
    console.log('📁 SQLite 配置:');
    console.log('数据库文件: backend/database.sqlite');
  } else {
    console.log('❓ 未识别的数据库类型或未设置');
  }

  console.log('\n==========================================\n');

  try {
    // 2. 测试实际连接
    console.log('🔗 测试数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 3. 获取数据库信息
    console.log('📊 实际连接的数据库信息:');
    console.log('==========================================');

    // 检查数据库类型
    const dialectName = sequelize.getDialect();
    console.log(`数据库类型: ${dialectName.toUpperCase()}`);

    if (dialectName === 'postgres') {
      // PostgreSQL 特定查询
      const serverInfo = await sequelize.query(
        `SELECT 
          current_database() as database_name,
          current_user as current_user,
          inet_server_addr() as server_ip,
          inet_server_port() as server_port,
          version() as version
        `,
        { type: QueryTypes.SELECT }
      );

      const info = serverInfo[0] as any;
      console.log(`服务器地址: ${info.server_ip || 'localhost'}`);
      console.log(`服务器端口: ${info.server_port || '5432'}`);
      console.log(`数据库名: ${info.database_name}`);
      console.log(`当前用户: ${info.current_user}`);
      console.log(`PostgreSQL版本: ${info.version.split(',')[0]}`);

      // 检查连接池配置
      const config = sequelize.config;
      console.log('\n🏊 连接池配置:');
      console.log(`Host: ${config.host}`);
      console.log(`Port: ${config.port}`);
      console.log(`Database: ${config.database}`);
      console.log(`Username: ${config.username}`);

    } else if (dialectName === 'sqlite') {
      // SQLite 特定查询
      const dbInfo = await sequelize.query('PRAGMA database_list', { type: QueryTypes.SELECT });
      const info = dbInfo[0] as any;
      console.log(`数据库文件: ${info.file}`);
      
      const version = await sequelize.query('SELECT sqlite_version() as version', { type: QueryTypes.SELECT });
      console.log(`SQLite版本: ${(version[0] as any).version}`);
    }

    // 4. 检查用户表数据
    console.log('\n👥 用户表快速检查:');
    console.log('==========================================');
    const userCount = await sequelize.query(
      'SELECT COUNT(*) as count FROM users',
      { type: QueryTypes.SELECT }
    );
    console.log(`用户总数: ${(userCount[0] as any).count}`);

    // 检查是否有特定用户
    const testUsers = await sequelize.query(
      `SELECT username, email FROM users WHERE email IN (
        'maxazure@gmail.com',
        'carol.liu@example.com',
        'alice.chen@example.com'
      ) ORDER BY email`,
      { type: QueryTypes.SELECT }
    );

    if (testUsers.length > 0) {
      console.log('找到的关键用户:');
      testUsers.forEach((user: any) => {
        console.log(`  - ${user.username} (${user.email})`);
      });
    } else {
      console.log('未找到关键用户');
    }

  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 可能的原因:');
        console.log('1. 数据库服务器未启动');
        console.log('2. 网络连接问题');
        console.log('3. 端口被阻塞');
        console.log('4. 配置错误');
      }
    }
  } finally {
    await sequelize.close();
    console.log('\n🔌 数据库连接已关闭');
  }
};

checkCurrentConnection();