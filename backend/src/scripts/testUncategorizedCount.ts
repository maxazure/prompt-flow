#!/usr/bin/env npx tsx

/**
 * 测试未分类计数功能
 * 验证权限逻辑修复后，用户能正确看到未分类中的提示词数量
 */

import { sequelize } from '../config/database';
import { User, Prompt, Category } from '../models';
import { CategoryService } from '../services/categoryService';
import { ensureUncategorizedCategory } from '../services/uncategorizedService';

async function testUncategorizedCount() {
  console.log('🧪 开始测试未分类计数功能...\n');

  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 查找测试用户
    const testUser = await User.findOne({
      where: { email: 'maxazure@gmail.com' }
    });

    if (!testUser) {
      console.log('❌ 未找到测试用户 maxazure@gmail.com');
      return;
    }

    console.log(`✅ 找到测试用户: ${testUser.username} (ID: ${testUser.id})`);

    // 获取或创建未分类分类
    const uncategorizedCategory = await ensureUncategorizedCategory(testUser.id);
    console.log(`✅ 未分类分类 ID: ${uncategorizedCategory.id}`);

    // 检查用户的提示词
    const userPrompts = await Prompt.findAll({
      where: { userId: testUser.id },
      attributes: ['id', 'title', 'isPublic', 'categoryId']
    });

    console.log(`\n📋 用户提示词列表 (共 ${userPrompts.length} 个):`);
    userPrompts.forEach(prompt => {
      console.log(`  - ${prompt.title} (${prompt.isPublic ? '公开' : '私有'}, 分类ID: ${prompt.categoryId})`);
    });

    // 检查未分类的提示词
    const uncategorizedPrompts = userPrompts.filter(p => p.categoryId === uncategorizedCategory.id);
    console.log(`\n🗂️  未分类提示词 (${uncategorizedPrompts.length} 个):`);
    uncategorizedPrompts.forEach(prompt => {
      console.log(`  - ${prompt.title} (${prompt.isPublic ? '公开' : '私有'})`);
    });

    // 使用CategoryService获取分类列表（包含计数）
    const categoryService = new CategoryService();
    const categoriesWithCount = await categoryService.getUserVisibleCategories(testUser.id);
    
    console.log(`\n📊 分类计数结果:`);
    categoriesWithCount.forEach(category => {
      if (category.name === '未分类') {
        console.log(`  🎯 未分类: ${category.promptCount} 个提示词`);
        
        // 验证计数是否正确
        const expectedCount = uncategorizedPrompts.length;
        if (category.promptCount === expectedCount) {
          console.log(`  ✅ 计数正确！期望: ${expectedCount}, 实际: ${category.promptCount}`);
        } else {
          console.log(`  ❌ 计数错误！期望: ${expectedCount}, 实际: ${category.promptCount}`);
          
          // 详细调试信息
          console.log('\n🔍 调试信息:');
          console.log(`     数据库中的未分类提示词: ${uncategorizedPrompts.length}`);
          console.log(`     API返回的未分类计数: ${category.promptCount}`);
          console.log(`     分类类型: ${category.scopeType}`);
          console.log(`     分类作用域ID: ${category.scopeId}`);
        }
      } else {
        console.log(`  📁 ${category.name}: ${category.promptCount} 个提示词`);
      }
    });

    // 测试权限逻辑：检查是否遵循 "公开 + 自己的" 逻辑
    console.log(`\n🔐 权限逻辑验证:`);
    const allPrompts = await Prompt.findAll({
      where: { categoryId: uncategorizedCategory.id }
    });
    
    const publicPrompts = allPrompts.filter(p => p.isPublic);
    const userOwnPrompts = allPrompts.filter(p => p.userId === testUser.id);
    
    console.log(`     未分类中所有提示词: ${allPrompts.length}`);
    console.log(`     其中公开的: ${publicPrompts.length}`);
    console.log(`     其中用户自己的: ${userOwnPrompts.length}`);
    
    // 根据权限逻辑，用户应该看到的数量
    const visiblePromptIds = new Set([
      ...publicPrompts.map(p => p.id),
      ...userOwnPrompts.map(p => p.id)
    ]);
    const expectedVisibleCount = visiblePromptIds.size;
    
    console.log(`     用户应该看到的数量: ${expectedVisibleCount}`);

    const uncategorizedCategory2 = categoriesWithCount.find(c => c.name === '未分类');
    if (uncategorizedCategory2 && uncategorizedCategory2.promptCount === expectedVisibleCount) {
      console.log(`     ✅ 权限逻辑正确！`);
    } else {
      console.log(`     ❌ 权限逻辑有问题！`);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔒 数据库连接已关闭');
  }
}

// 运行测试
testUncategorizedCount().catch(console.error);