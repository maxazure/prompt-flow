import dotenv from 'dotenv';
import { getPrompts } from '../services/promptService';
import { clearDatabaseCache, forceCreateConnection } from '../config/database';

dotenv.config();

const testPromptLogic = async () => {
  console.log('🧪 测试修复后的提示词获取逻辑...\n');

  try {
    // 强制创建新连接
    await clearDatabaseCache();
    const sequelize = forceCreateConnection();
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 确保模型加载
    require('../models');

    // 测试1: 未登录用户（应该只看到公开提示词）
    console.log('1️⃣ 测试未登录用户访问:');
    console.log('==========================================');
    const publicPrompts = await getPrompts({});
    console.log(`返回提示词数量: ${publicPrompts.length}`);
    if (publicPrompts.length > 0) {
      publicPrompts.forEach(prompt => {
        console.log(`  - ${prompt.title} (公开: ${prompt.isPublic}, 用户: ${(prompt as any).user.username})`);
      });
    } else {
      console.log('  ✅ 正确：未登录用户看不到任何私有提示词');
    }

    // 测试2: maxazure 用户登录（应该看到公开提示词 + 自己的所有提示词）
    console.log('\n2️⃣ 测试 maxazure 用户登录:');
    console.log('==========================================');
    const maxazurePrompts = await getPrompts({
      currentUserId: 21 // maxazure 的用户ID
    });
    console.log(`返回提示词数量: ${maxazurePrompts.length}`);
    maxazurePrompts.forEach(prompt => {
      const isOwn = (prompt as any).userId === 21;
      const access = isOwn ? '自己的' : '公开的';
      console.log(`  - ${prompt.title} (${access}, 公开: ${prompt.isPublic}, 用户: ${(prompt as any).user.username})`);
    });

    // 测试3: sarah 用户登录（应该看到公开提示词 + 自己的所有提示词）
    console.log('\n3️⃣ 测试 sarah 用户登录:');
    console.log('==========================================');
    const sarahPrompts = await getPrompts({
      currentUserId: 19 // sarah 的用户ID
    });
    console.log(`返回提示词数量: ${sarahPrompts.length}`);
    sarahPrompts.forEach(prompt => {
      const isOwn = (prompt as any).userId === 19;
      const access = isOwn ? '自己的' : '公开的';
      console.log(`  - ${prompt.title} (${access}, 公开: ${prompt.isPublic}, 用户: ${(prompt as any).user.username})`);
    });

    // 测试4: 添加一个公开提示词进行测试
    console.log('\n4️⃣ 将 sarah 的一个提示词设为公开并重新测试:');
    console.log('==========================================');
    
    // 使用直接SQL更新
    await sequelize.query(`
      UPDATE prompts 
      SET "isPublic" = true, "updatedAt" = NOW()
      WHERE id = 22
    `);
    
    console.log('✅ 已将 sarah 的"测试提示词"设为公开');

    // 重新测试未登录用户
    const publicPromptsAfter = await getPrompts({});
    console.log(`\n未登录用户现在能看到的提示词数量: ${publicPromptsAfter.length}`);
    publicPromptsAfter.forEach(prompt => {
      console.log(`  - ${prompt.title} (公开: ${prompt.isPublic}, 用户: ${(prompt as any).user.username})`);
    });

    // 重新测试 maxazure 用户
    const maxazurePromptsAfter = await getPrompts({
      currentUserId: 21
    });
    console.log(`\nmaxazure 用户现在能看到的提示词数量: ${maxazurePromptsAfter.length}`);
    maxazurePromptsAfter.forEach(prompt => {
      const isOwn = (prompt as any).userId === 21;
      const access = isOwn ? '自己的' : '公开的';
      console.log(`  - ${prompt.title} (${access}, 公开: ${prompt.isPublic}, 用户: ${(prompt as any).user.username})`);
    });

    console.log('\n✅ 测试完成！');
    console.log('\n📋 预期行为:');
    console.log('- 未登录用户：只看到公开提示词');
    console.log('- 已登录用户：看到所有公开提示词 + 自己的所有提示词（无论公开或私有）');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await clearDatabaseCache();
  }
};

testPromptLogic();