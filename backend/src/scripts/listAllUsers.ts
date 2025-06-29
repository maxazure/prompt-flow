import dotenv from 'dotenv';
import { Sequelize, QueryTypes } from 'sequelize';

dotenv.config();

const listAllUsers = async () => {
  console.log('📋 列出所有用户详细信息...');
  
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

    // 查询所有用户的详细信息
    const users = await sequelize.query(
      `SELECT 
        id, 
        username, 
        email,
        "createdAt", 
        "updatedAt"
      FROM users 
      ORDER BY id ASC`,
      {
        type: QueryTypes.SELECT,
      }
    );

    console.log('👥 所有用户列表');
    console.log('========================================');
    console.log('| ID | 用户名              | 邮箱                      | 创建时间         |');
    console.log('|----|--------------------|--------------------------|-----------------|');
    
    users.forEach((user: any) => {
      const id = user.id.toString().padEnd(2);
      const username = user.username.substring(0, 18).padEnd(18);
      const email = user.email.substring(0, 24).padEnd(24);
      const createdAt = new Date(user.createdAt).toLocaleDateString('zh-CN');
      
      console.log(`| ${id} | ${username} | ${email} | ${createdAt}    |`);
    });
    
    console.log('========================================');
    console.log(`📊 总用户数: ${users.length}\n`);

    // 按用户类型分类
    console.log('📂 用户分类:');
    console.log('--------------------');
    
    const testUsers = users.filter((u: any) => 
      u.email.includes('alice.chen@example.com') || 
      u.email.includes('bob.wang@example.com') || 
      u.email.includes('carol.liu@example.com')
    );
    
    const personalUser = users.find((u: any) => u.email === 'maxazure@gmail.com');
    const otherUsers = users.filter((u: any) => 
      !testUsers.includes(u) && u.email !== 'maxazure@gmail.com'
    );

    if (personalUser) {
      console.log(`👤 个人账户: ${(personalUser as any).username} (${(personalUser as any).email})`);
    }
    
    if (testUsers.length > 0) {
      console.log('🧪 测试用户:');
      testUsers.forEach((user: any) => {
        console.log(`   - ${user.username} (${user.email})`);
      });
    }
    
    if (otherUsers.length > 0) {
      console.log('👥 其他用户:');
      otherUsers.forEach((user: any) => {
        console.log(`   - ${user.username} (${user.email})`);
      });
    }

    // 最近活动
    console.log('\n📅 最近活动:');
    console.log('--------------------');
    const recentUsers = users
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
      
    recentUsers.forEach((user: any, index: number) => {
      const timeAgo = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60));
      console.log(`${index + 1}. ${user.username} - ${timeAgo}小时前注册`);
    });

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await sequelize.close();
  }
};

listAllUsers();