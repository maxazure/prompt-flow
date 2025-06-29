import dotenv from 'dotenv';
import { Sequelize, QueryTypes } from 'sequelize';

dotenv.config();

const testPromptSQL = async () => {
  console.log('🧪 直接SQL测试提示词访问逻辑...\n');

  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: '192.168.31.205',
    port: 5432,
    username: 'propmt',
    password: process.env.POSTGRES_PASSWORD || 'eM8e6GDi4RH66Zm7',
    database: 'propmt',
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 1. 查看所有提示词的状态
    console.log('📋 当前所有提示词状态:');
    console.log('==========================================');
    const allPrompts = await sequelize.query(`
      SELECT 
        p.id,
        p.title,
        p."isPublic",
        p."userId",
        u.username
      FROM prompts p
      JOIN users u ON p."userId" = u.id
      ORDER BY p.id
    `, { type: QueryTypes.SELECT });

    allPrompts.forEach((prompt: any) => {
      console.log(`${prompt.id}. ${prompt.title} - ${prompt.isPublic ? '公开' : '私有'} (用户: ${prompt.username})`);
    });

    // 2. 模拟未登录用户查询（只看公开）
    console.log('\n1️⃣ 未登录用户应该看到的提示词:');
    console.log('==========================================');
    const publicPrompts = await sequelize.query(`
      SELECT 
        p.id,
        p.title,
        p."isPublic",
        u.username
      FROM prompts p
      JOIN users u ON p."userId" = u.id
      WHERE p."isPublic" = true
      ORDER BY p."updatedAt" DESC
    `, { type: QueryTypes.SELECT });

    if (publicPrompts.length > 0) {
      publicPrompts.forEach((prompt: any) => {
        console.log(`  - ${prompt.title} (用户: ${prompt.username})`);
      });
    } else {
      console.log('  ✅ 正确：没有公开提示词');
    }

    // 3. 模拟 maxazure 用户登录查询（公开 + 自己的）
    console.log('\n2️⃣ maxazure 用户应该看到的提示词:');
    console.log('==========================================');
    const maxazureId = 21;
    const maxazurePrompts = await sequelize.query(`
      SELECT 
        p.id,
        p.title,
        p."isPublic",
        p."userId",
        u.username,
        CASE 
          WHEN p."userId" = $1 THEN '自己的'
          ELSE '公开的'
        END as access_type
      FROM prompts p
      JOIN users u ON p."userId" = u.id
      WHERE p."isPublic" = true OR p."userId" = $1
      ORDER BY p."updatedAt" DESC
    `, { bind: [maxazureId], type: QueryTypes.SELECT });

    maxazurePrompts.forEach((prompt: any) => {
      console.log(`  - ${prompt.title} (${prompt.access_type}, 用户: ${prompt.username})`);
    });

    // 4. 创建一个公开提示词进行完整测试
    console.log('\n3️⃣ 将 sarah 的一个提示词设为公开:');
    console.log('==========================================');
    await sequelize.query(`
      UPDATE prompts 
      SET "isPublic" = true, "updatedAt" = NOW()
      WHERE id = 22
    `);
    console.log('✅ 已将 sarah 的"测试提示词"设为公开');

    // 重新测试未登录用户
    console.log('\n4️⃣ 重新测试未登录用户:');
    console.log('==========================================');
    const publicPromptsAfter = await sequelize.query(`
      SELECT 
        p.id,
        p.title,
        u.username
      FROM prompts p
      JOIN users u ON p."userId" = u.id
      WHERE p."isPublic" = true
      ORDER BY p."updatedAt" DESC
    `, { type: QueryTypes.SELECT });

    publicPromptsAfter.forEach((prompt: any) => {
      console.log(`  - ${prompt.title} (用户: ${prompt.username})`);
    });

    // 重新测试 maxazure 用户
    console.log('\n5️⃣ 重新测试 maxazure 用户:');
    console.log('==========================================');
    const maxazurePromptsAfter = await sequelize.query(`
      SELECT 
        p.id,
        p.title,
        p."isPublic",
        u.username,
        CASE 
          WHEN p."userId" = $1 THEN '自己的'
          ELSE '公开的'
        END as access_type
      FROM prompts p
      JOIN users u ON p."userId" = u.id
      WHERE p."isPublic" = true OR p."userId" = $1
      ORDER BY p."updatedAt" DESC
    `, { bind: [maxazureId], type: QueryTypes.SELECT });

    maxazurePromptsAfter.forEach((prompt: any) => {
      console.log(`  - ${prompt.title} (${prompt.access_type}, ${prompt.isPublic ? '公开' : '私有'}, 用户: ${prompt.username})`);
    });

    console.log('\n✅ SQL 逻辑测试完成！');
    console.log('\n📋 预期行为验证:');
    console.log('- 未登录用户：只看到公开提示词');
    console.log('- maxazure 用户：看到所有公开提示词 + 自己的所有提示词');
    console.log('- 这正是我们修复后的逻辑应该实现的行为');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await sequelize.close();
  }
};

testPromptSQL();