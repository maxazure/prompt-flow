import dotenv from 'dotenv';
import { Sequelize, QueryTypes } from 'sequelize';

// 强制加载环境变量
dotenv.config();

const forcePostgresConnection = async () => {
  console.log('🔧 强制创建PostgreSQL连接...\n');

  // 显式设置环境变量（确保生效）
  process.env.DATABASE_TYPE = 'postgres';
  
  console.log('📋 当前环境变量:');
  console.log(`DATABASE_TYPE: ${process.env.DATABASE_TYPE}`);
  console.log(`POSTGRES_HOST: ${process.env.POSTGRES_HOST}`);
  console.log(`POSTGRES_PORT: ${process.env.POSTGRES_PORT}`);
  console.log(`POSTGRES_USER: ${process.env.POSTGRES_USER}`);
  console.log(`POSTGRES_DB: ${process.env.POSTGRES_DB}\n`);

  // 直接创建PostgreSQL连接（绕过缓存）
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'prompt_flow',
    logging: false,
  });

  try {
    console.log('🔗 测试PostgreSQL连接...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL连接成功！\n');

    // 验证连接的数据库信息
    const dbInfo = await sequelize.query(
      `SELECT 
        current_database() as database_name,
        current_user as current_user,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port
      `,
      { type: QueryTypes.SELECT }
    );

    const info = dbInfo[0] as any;
    console.log('🎯 实际连接信息:');
    console.log('==========================================');
    console.log(`数据库类型: PostgreSQL`);
    console.log(`服务器地址: ${info.server_ip}`);
    console.log(`服务器端口: ${info.server_port}`);
    console.log(`数据库名: ${info.database_name}`);
    console.log(`当前用户: ${info.current_user}`);

    // 检查用户数据
    const userCount = await sequelize.query(
      'SELECT COUNT(*) as count FROM users',
      { type: QueryTypes.SELECT }
    );

    const users = await sequelize.query(
      'SELECT id, username, email FROM users ORDER BY id',
      { type: QueryTypes.SELECT }
    );

    console.log('\n👥 用户数据:');
    console.log('==========================================');
    console.log(`总用户数: ${(userCount[0] as any).count}`);
    console.log('用户列表:');
    users.forEach((user: any) => {
      console.log(`  ${user.id}. ${user.username} (${user.email})`);
    });

    console.log('\n✅ 确认：后台应该连接到PostgreSQL服务器');
    console.log('📍 服务器: 192.168.31.205:5432');
    console.log('📊 数据库: propmt');

  } catch (error) {
    console.error('❌ PostgreSQL连接失败:', error);
  } finally {
    await sequelize.close();
  }
};

forcePostgresConnection();