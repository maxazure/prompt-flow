#!/usr/bin/env npx tsx

/**
 * 数据迁移脚本：移除公共分类系统
 * 
 * 1. 将分配到公共分类的提示词改为未分类
 * 2. 删除所有公共分类记录
 * 3. 清理相关数据
 */

import dotenv from 'dotenv';
import { sequelize } from '../config/database';
import { User, Category, Prompt } from '../models';
import { CategoryScopeType } from '../models/Category';
import { ensureUncategorizedCategory } from '../services/uncategorizedService';

// 确保加载环境变量
dotenv.config();

async function removePublicCategories() {
  try {
    console.log('🔄 开始移除公共分类系统...\n');

    // 确保数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 1. 查找所有公共分类
    console.log('\n📋 查找现有公共分类...');
    const publicCategories = await Category.findAll({
      where: {
        scopeType: 'public' // 使用字符串而不是枚举值，因为枚举已经被移除
      }
    });

    console.log(`找到 ${publicCategories.length} 个公共分类:`);
    publicCategories.forEach(category => {
      console.log(`  - ID: ${category.id}, 名称: "${category.name}", 创建者: ${category.createdBy}`);
    });

    if (publicCategories.length === 0) {
      console.log('✅ 没有找到公共分类，无需迁移');
      return;
    }

    // 2. 处理分配到公共分类的提示词
    console.log('\n📝 处理分配到公共分类的提示词...');
    
    for (const publicCategory of publicCategories) {
      // 查找分配到此公共分类的提示词
      const assignedPrompts = await Prompt.findAll({
        where: {
          categoryId: publicCategory.id
        },
        attributes: ['id', 'title', 'userId', 'categoryId'],
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }]
      });

      console.log(`\n分类 "${publicCategory.name}" (ID: ${publicCategory.id}) 包含 ${assignedPrompts.length} 个提示词:`);

      for (const prompt of assignedPrompts) {
        const user = prompt.user;
        if (!user) {
          console.log(`⚠️  提示词 "${prompt.title}" (ID: ${prompt.id}) 没有关联用户，跳过`);
          continue;
        }

        // 为提示词的作者创建或获取未分类分类
        const uncategorizedCategory = await ensureUncategorizedCategory(user.id);
        
        // 将提示词重新分配到用户的未分类分类
        await prompt.update({
          categoryId: uncategorizedCategory.id
        });

        console.log(`  ✅ 提示词 "${prompt.title}" 已移动到用户 ${user.username} 的未分类分类`);
      }
    }

    // 3. 删除所有公共分类
    console.log('\n🗑️  删除公共分类记录...');
    
    for (const publicCategory of publicCategories) {
      await publicCategory.destroy();
      console.log(`  ✅ 删除公共分类: "${publicCategory.name}" (ID: ${publicCategory.id})`);
    }

    // 4. 验证清理结果
    console.log('\n🔍 验证清理结果...');
    
    const remainingPublicCategories = await Category.findAll({
      where: {
        scopeType: 'public'
      }
    });

    if (remainingPublicCategories.length === 0) {
      console.log('✅ 所有公共分类已成功移除');
    } else {
      console.log(`⚠️  仍有 ${remainingPublicCategories.length} 个公共分类未删除`);
    }

    // 5. 统计当前分类数据
    console.log('\n📊 当前分类统计:');
    const personalCategories = await Category.count({
      where: { scopeType: CategoryScopeType.PERSONAL }
    });
    const teamCategories = await Category.count({
      where: { scopeType: CategoryScopeType.TEAM }
    });

    console.log(`  - 个人分类: ${personalCategories} 个`);
    console.log(`  - 团队分类: ${teamCategories} 个`);
    console.log(`  - 总计: ${personalCategories + teamCategories} 个`);

    console.log('\n🎉 公共分类系统移除完成！');
    console.log('\n📋 后续步骤:');
    console.log('1. 更新前端代码移除公共分类相关逻辑');
    console.log('2. 重构首页为基于标签的展示');
    console.log('3. 更新测试用例');

  } catch (error) {
    console.error('❌ 移除公共分类失败:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  removePublicCategories().catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

export { removePublicCategories };