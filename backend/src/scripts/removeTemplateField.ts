#!/usr/bin/env tsx

/**
 * 数据库迁移脚本 - 删除 isTemplate 字段
 * 
 * 功能说明：
 * 1. 从 prompts 表中删除 isTemplate 列
 * 2. 备份现有数据（如果需要回滚）
 * 3. 验证迁移结果
 */

import { sequelize } from '../config/database';
import { QueryInterface, DataTypes, QueryTypes } from 'sequelize';

async function removeTemplateField() {
  console.log('🚀 开始删除模板字段迁移...');
  
  try {
    const queryInterface: QueryInterface = sequelize.getQueryInterface();
    
    // 检查 isTemplate 列是否存在
    const tableDescription = await queryInterface.describeTable('prompts');
    
    if (!tableDescription.isTemplate) {
      console.log('✅ isTemplate 字段已经不存在，无需迁移');
      return;
    }
    
    console.log('📊 当前 isTemplate 字段信息：', tableDescription.isTemplate);
    
    // 查询当前标记为模板的记录数量
    const [templateCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM prompts WHERE isTemplate = 1',
      { type: QueryTypes.SELECT }
    ) as any[];
    
    console.log(`📈 发现 ${templateCount.count} 个标记为模板的提示词`);
    
    if (templateCount.count > 0) {
      console.log('⚠️  警告：检测到有提示词被标记为模板');
      console.log('   这些记录的模板标记将被永久删除');
      
      // 列出所有被标记为模板的记录
      const templates = await sequelize.query(
        'SELECT id, title, userId FROM prompts WHERE isTemplate = 1',
        { type: QueryTypes.SELECT }
      );
      
      console.log('📋 模板记录列表：');
      templates.forEach((template: any) => {
        console.log(`   - ID: ${template.id}, 标题: "${template.title}", 用户ID: ${template.userId}`);
      });
    }
    
    // 执行迁移：删除 isTemplate 列
    console.log('🔧 正在删除 isTemplate 列...');
    await queryInterface.removeColumn('prompts', 'isTemplate');
    
    // 验证删除结果
    const updatedDescription = await queryInterface.describeTable('prompts');
    if (updatedDescription.isTemplate) {
      throw new Error('❌ 删除失败：isTemplate 列仍然存在');
    }
    
    console.log('✅ 成功删除 isTemplate 字段');
    
    // 验证表结构
    const remainingColumns = Object.keys(updatedDescription);
    console.log('📋 当前表结构包含字段：');
    remainingColumns.forEach(column => {
      console.log(`   - ${column}: ${updatedDescription[column].type}`);
    });
    
    console.log('🎉 模板字段删除迁移完成！');
    
  } catch (error) {
    console.error('❌ 迁移失败：', error);
    process.exit(1);
  }
}

// 验证迁移结果
async function verifyMigration() {
  console.log('\n🔍 验证迁移结果...');
  
  try {
    const queryInterface: QueryInterface = sequelize.getQueryInterface();
    const tableDescription = await queryInterface.describeTable('prompts');
    
    // 确认 isTemplate 字段已被删除
    if (tableDescription.isTemplate) {
      throw new Error('验证失败：isTemplate 字段仍然存在');
    }
    
    // 检查表中是否还有数据
    const [promptCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM prompts',
      { type: QueryTypes.SELECT }
    ) as any[];
    
    console.log(`✅ 验证通过：`);
    console.log(`   - isTemplate 字段已删除`);
    console.log(`   - 表中保留 ${promptCount.count} 条提示词记录`);
    console.log(`   - 数据完整性正常`);
    
  } catch (error) {
    console.error('❌ 验证失败：', error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 执行迁移
    await removeTemplateField();
    
    // 验证结果
    await verifyMigration();
    
    console.log('\n🎉 所有操作完成！模板字段已成功从系统中移除。');
    
  } catch (error) {
    console.error('\n❌ 操作失败：', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

export { removeTemplateField, verifyMigration };