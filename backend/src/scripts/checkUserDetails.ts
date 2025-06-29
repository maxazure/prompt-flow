import dotenv from 'dotenv';
import { Sequelize, QueryTypes } from 'sequelize';

dotenv.config();

const checkUserDetails = async () => {
  console.log('🔍 检查用户详细信息...');
  
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
    console.log('✅ 数据库连接成功\n');

    // 查看用户表结构
    console.log('📋 用户表结构:');
    const tableInfo = await sequelize.query(
      `SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position`,
      {
        type: QueryTypes.SELECT,
      }
    );

    tableInfo.forEach((col: any) => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(必填)' : '(可选)'}`);
    });

    // 查看maxazure@gmail.com用户的详细信息
    console.log('\n🔍 maxazure@gmail.com 用户详细信息:');
    const userDetail = await sequelize.query(
      `SELECT 
        id,
        username,
        email,
        "createdAt",
        "updatedAt"
      FROM users 
      WHERE email = 'maxazure@gmail.com'`,
      {
        type: QueryTypes.SELECT,
      }
    );

    if (userDetail.length > 0) {
      const user = userDetail[0] as any;
      console.log('=====================================');
      console.log(`ID: ${user.id}`);
      console.log(`用户名 (username): "${user.username}"`);
      console.log(`邮箱 (email): "${user.email}"`);
      console.log(`创建时间: ${user.createdAt}`);
      console.log(`更新时间: ${user.updatedAt}`);
      console.log('=====================================');
      
      if (user.username === user.email) {
        console.log('⚠️  注意: 用户名和邮箱设置为相同值');
        console.log('💡 建议: 用户名应该是一个简短的显示名称，比如 "maxazure"');
      }
    } else {
      console.log('❌ 未找到该用户');
    }

    // 显示所有用户的用户名和邮箱对比
    console.log('\n📊 所有用户的用户名 vs 邮箱:');
    const allUsers = await sequelize.query(
      `SELECT id, username, email FROM users ORDER BY id`,
      {
        type: QueryTypes.SELECT,
      }
    );

    console.log('ID | 用户名                 | 邮箱');
    console.log('---|----------------------|------------------------');
    allUsers.forEach((user: any) => {
      const id = user.id.toString().padEnd(2);
      const username = user.username.substring(0, 20).padEnd(20);
      const email = user.email;
      console.log(`${id} | ${username} | ${email}`);
    });

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await sequelize.close();
  }
};

checkUserDetails();