#!/usr/bin/env npx tsx

/**
 * 调试提示词分类关联问题
 */

import { sequelize } from '../config/database';
import { User, Prompt } from '../models';

async function debugPromptCategories() {
  console.log('🔍 调试提示词分类关联...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 查找测试用户
    const testUser = await User.findOne({
      where: { email: 'maxazure@gmail.com' }
    });

    if (!testUser) {
      console.log('❌ 未找到测试用户');
      return;
    }

    console.log(`✅ 找到测试用户: ${testUser.username} (ID: ${testUser.id})`);

    // 检查用户的所有提示词
    console.log('\n📝 用户的所有提示词:');
    const userPrompts = await Prompt.findAll({
      where: { userId: testUser.id },
      order: [['id', 'ASC']]
    });

    if (userPrompts.length === 0) {
      console.log('  用户没有提示词');
    } else {
      userPrompts.forEach(prompt => {
        console.log(`  - ID:${prompt.id} "${prompt.title}" (categoryId: ${prompt.categoryId}, isPublic: ${prompt.isPublic})`);
      });
    }

    // 检查categoryId为null的提示词
    const nullCategoryPrompts = userPrompts.filter(p => p.categoryId === null);
    console.log(`\n🔍 categoryId为null的提示词: ${nullCategoryPrompts.length} 个`);
    nullCategoryPrompts.forEach(prompt => {
      console.log(`  - "${prompt.title}" (应该分配到未分类分类)`);
    });

    // 检查分配到未分类分类(ID:17)的提示词
    const uncategorizedPrompts = userPrompts.filter(p => p.categoryId === 17);
    console.log(`\n📂 分配到未分类分类(ID:17)的提示词: ${uncategorizedPrompts.length} 个`);
    uncategorizedPrompts.forEach(prompt => {
      console.log(`  - "${prompt.title}"`);
    });

    // 总结问题
    console.log('\n🎯 问题分析:');
    if (nullCategoryPrompts.length > 0) {
      console.log(`  ❌ 发现问题：有 ${nullCategoryPrompts.length} 个提示词的categoryId为null`);
      console.log('  🔧 解决方案：需要将这些提示词分配到用户的未分类分类(ID:17)');
    }
    
    if (uncategorizedPrompts.length === 0 && userPrompts.length > 0) {
      console.log('  ❌ 未分类分类没有关联任何提示词，这就是计数为0的原因');
    }

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔒 数据库连接已关闭');
  }
}

debugPromptCategories().catch(console.error);