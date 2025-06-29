import dotenv from 'dotenv';
import { Sequelize, QueryTypes } from 'sequelize';

dotenv.config();

const queryUsers = async () => {
  console.log('🔍 查询PostgreSQL数据库中的用户数据...');
  
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'prompt_flow',
    logging: false,
    pool: {
      max: 1,
      min: 0,
      acquire: 5000,
      idle: 10000
    }
  });

  try {
    await sequelize.authenticate();
    console.log('✅ 连接到PostgreSQL数据库成功');
    console.log(`📍 数据库: ${process.env.POSTGRES_DB} @ ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}\n`);

    // 查询所有用户
    const users = await sequelize.query(
      `SELECT 
        id, 
        username, 
        email, 
        "createdAt", 
        "updatedAt"
      FROM users 
      ORDER BY id`,
      {
        type: QueryTypes.SELECT,
      }
    );

    console.log('👥 用户表数据:');
    console.log('=====================================');
    
    if (users.length === 0) {
      console.log('📝 用户表为空');
    } else {
      users.forEach((user: any, index: number) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   用户名: ${user.username}`);
        console.log(`   邮箱: ${user.email}`);
        console.log(`   创建时间: ${user.createdAt}`);
        console.log(`   更新时间: ${user.updatedAt}`);
        console.log('   ---');
      });
      
      console.log(`\n📊 总用户数: ${users.length}`);
    }

    // 查询用户表统计信息
    const stats = await sequelize.query(
      `SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN "createdAt" >= NOW() - INTERVAL '24 hours' THEN 1 END) as users_last_24h,
        COUNT(CASE WHEN "createdAt" >= NOW() - INTERVAL '7 days' THEN 1 END) as users_last_7d,
        MIN("createdAt") as earliest_user,
        MAX("createdAt") as latest_user
      FROM users`,
      {
        type: QueryTypes.SELECT,
      }
    );

    console.log('\n📈 用户统计信息:');
    console.log('=====================================');
    const stat = stats[0] as any;
    console.log(`总用户数: ${stat.total_users}`);
    console.log(`最近24小时新用户: ${stat.users_last_24h}`);
    console.log(`最近7天新用户: ${stat.users_last_7d}`);
    console.log(`最早用户创建时间: ${stat.earliest_user}`);
    console.log(`最新用户创建时间: ${stat.latest_user}`);

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 数据库连接已关闭');
  }
};

queryUsers();