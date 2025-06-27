import { sequelize } from '../config/database';
import { Category, CategoryScopeType } from '../models/Category';

/**
 * 创建或更新"未分类"分类脚本
 * 
 * 功能：
 * 1. 检查ID为1的分类是否存在
 * 2. 如果存在且不是"未分类"，则更新为"未分类"
 * 3. 如果不存在，则创建一个新的"未分类"分类
 * 4. 确保"未分类"是public类型，方便所有用户使用
 */

async function createUncategorizedCategory() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 查找ID为1的分类
    const existingCategory = await Category.findByPk(1);
    
    if (existingCategory) {
      console.log('找到ID为1的分类:', existingCategory.name);
      
      if (existingCategory.name !== '未分类') {
        // 更新现有分类为"未分类"
        await existingCategory.update({
          name: '未分类',
          description: '默认分类，用于未明确分类的提示词',
          scopeType: CategoryScopeType.PUBLIC,
          scopeId: undefined,
          color: '#6B7280', // 灰色，表示默认/中性
          isActive: true
        });
        
        console.log('✅ 成功将ID为1的分类更新为"未分类"');
        console.log('更新后的分类信息:', {
          id: existingCategory.id,
          name: existingCategory.name,
          description: existingCategory.description,
          scopeType: existingCategory.scopeType,
          color: existingCategory.color
        });
      } else {
        console.log('✅ ID为1的分类已经是"未分类"，无需更新');
      }
    } else {
      // 创建新的"未分类"分类
      // 注意：由于ID是自增的，我们需要手动设置ID为1
      // 这可能需要特殊处理
      console.log('未找到ID为1的分类，尝试创建新的"未分类"分类');
      
      // 先检查是否已经存在"未分类"分类
      const uncategorizedExists = await Category.findOne({
        where: { name: '未分类' }
      });
      
      if (uncategorizedExists) {
        console.log('✅ 已存在"未分类"分类，ID为:', uncategorizedExists.id);
      } else {
        // 创建新的"未分类"分类
        // 由于我们想要ID为1，需要使用原生SQL
        await sequelize.query(`
          INSERT INTO categories (id, name, description, scopeType, scopeId, createdBy, color, isActive, createdAt, updatedAt)
          VALUES (1, '未分类', '默认分类，用于未明确分类的提示词', 'public', NULL, 1, '#6B7280', 1, datetime('now'), datetime('now'))
        `);
        
        console.log('✅ 成功创建ID为1的"未分类"分类');
      }
    }

    // 验证创建结果
    const finalCategory = await Category.findByPk(1);
    if (finalCategory) {
      console.log('\n📋 最终的"未分类"分类信息:');
      console.log('- ID:', finalCategory.id);
      console.log('- 名称:', finalCategory.name);
      console.log('- 描述:', finalCategory.description);
      console.log('- 作用域:', finalCategory.scopeType);
      console.log('- 颜色:', finalCategory.color);
      console.log('- 创建者:', finalCategory.createdBy);
      console.log('- 激活状态:', finalCategory.isActive);
    }

    // 检查是否有提示词没有分类，并将其归类到"未分类"
    const { QueryTypes } = require('sequelize');
    const unCategorizedPrompts = await sequelize.query(`
      SELECT id, title FROM prompts 
      WHERE categoryId IS NULL OR categoryId NOT IN (SELECT id FROM categories WHERE isActive = 1)
    `, { type: QueryTypes.SELECT });

    if (unCategorizedPrompts.length > 0) {
      console.log(`\n🔄 发现${unCategorizedPrompts.length}个未分类的提示词，正在归类到"未分类"...`);
      
      await sequelize.query(`
        UPDATE prompts 
        SET categoryId = 1 
        WHERE categoryId IS NULL OR categoryId NOT IN (SELECT id FROM categories WHERE isActive = 1)
      `);
      
      console.log('✅ 已将所有未分类的提示词归类到"未分类"');
    } else {
      console.log('\n✅ 所有提示词都已正确分类');
    }

    console.log('\n🎉 "未分类"分类系统创建/更新完成');

  } catch (error) {
    console.error('❌ 创建"未分类"分类时发生错误:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 执行脚本
if (require.main === module) {
  createUncategorizedCategory()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

export { createUncategorizedCategory };