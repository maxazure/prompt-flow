#!/usr/bin/env npx tsx

/**
 * 调试CategoryService的getUserVisibleCategories方法
 */

import { sequelize } from '../config/database';
import { User, Category } from '../models';
import { CategoryService } from '../services/categoryService';

async function debugCategoryService() {
  console.log('🔍 调试CategoryService...\n');

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

    // 检查数据库中的分类
    console.log('\n📂 数据库中的所有分类:');
    const allCategories = await Category.findAll({
      where: { isActive: true },
      order: [['id', 'ASC']]
    });

    allCategories.forEach(cat => {
      console.log(`  - ID:${cat.id} ${cat.name} (${cat.scopeType}, scopeId:${cat.scopeId}, createdBy:${cat.createdBy})`);
    });

    // 检查用户的个人分类
    console.log('\n👤 用户的个人分类:');
    const userPersonalCategories = allCategories.filter(cat => 
      cat.scopeType === 'personal' && cat.scopeId === testUser.id
    );

    userPersonalCategories.forEach(cat => {
      console.log(`  - ${cat.name} (ID:${cat.id})`);
    });

    // 调用CategoryService方法
    console.log('\n🔧 调用CategoryService.getUserVisibleCategories...');
    const categoryService = new CategoryService();
    const visibleCategories = await categoryService.getUserVisibleCategories(testUser.id);

    console.log(`✅ 返回 ${visibleCategories.length} 个分类:`);
    visibleCategories.forEach(cat => {
      console.log(`  - ${cat.name} (ID:${cat.id}, count:${cat.promptCount}, scopeType:${cat.scopeType})`);
    });

    // 检查是否有未分类
    const uncategorized = visibleCategories.find(cat => cat.name === '未分类');
    if (uncategorized) {
      console.log('\n✅ 找到未分类分类:');
      console.log(`  - ID: ${uncategorized.id}`);
      console.log(`  - 计数: ${uncategorized.promptCount}`);
      console.log(`  - 作用域: ${uncategorized.scopeType} (${uncategorized.scopeId})`);
    } else {
      console.log('\n❌ 未找到未分类分类！');
    }

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔒 数据库连接已关闭');
  }
}

debugCategoryService().catch(console.error);