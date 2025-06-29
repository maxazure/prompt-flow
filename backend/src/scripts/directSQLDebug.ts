#!/usr/bin/env npx tsx

/**
 * 直接使用SQL调试提示词分类问题
 */

import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

async function directSQLDebug() {
  console.log('🔍 直接SQL调试提示词分类问题...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 1. 检查prompts表结构
    console.log('\n📋 检查prompts表结构:');
    const promptsSchema = await sequelize.query(`PRAGMA table_info(prompts)`, { type: QueryTypes.SELECT });
    console.log('Prompts表字段:');
    (promptsSchema as any[]).forEach((column: any) => {
      console.log(`  - ${column.name} (${column.type})`);
    });

    // 2. 查找测试用户
    const users = await sequelize.query(`SELECT * FROM users WHERE email = 'maxazure@gmail.com'`, { 
      type: QueryTypes.SELECT 
    });

    if (users.length === 0) {
      console.log('❌ 未找到测试用户');
      return;
    }

    const testUser = users[0] as any;
    console.log(`\n✅ 找到测试用户: ${testUser.username} (ID: ${testUser.id})`);

    // 3. 检查用户的提示词
    console.log('\n📝 用户的提示词:');
    const userPrompts = await sequelize.query(`
      SELECT id, title, categoryId, isPublic 
      FROM prompts 
      WHERE userId = ${testUser.id}
      ORDER BY id ASC
    `, { type: QueryTypes.SELECT });

    if (userPrompts.length === 0) {
      console.log('  用户没有提示词');
    } else {
      (userPrompts as any[]).forEach(prompt => {
        console.log(`  - ID:${prompt.id} "${prompt.title}" (categoryId: ${prompt.categoryId}, isPublic: ${prompt.isPublic})`);
      });
    }

    // 4. 检查用户的未分类分类
    console.log('\n📂 用户的未分类分类:');
    const uncategorizedCats = await sequelize.query(`
      SELECT id, name, scopeType, scopeId, createdBy 
      FROM categories 
      WHERE name = '未分类' AND scopeType = 'personal' AND scopeId = ${testUser.id}
      ORDER BY id ASC
    `, { type: QueryTypes.SELECT });

    if (uncategorizedCats.length === 0) {
      console.log('  ❌ 用户没有未分类分类');
    } else {
      (uncategorizedCats as any[]).forEach(cat => {
        console.log(`  - ID:${cat.id} "${cat.name}" (scopeType: ${cat.scopeType}, scopeId: ${cat.scopeId})`);
      });
    }

    // 5. 检查分类ID为17的提示词
    if (uncategorizedCats.length > 0) {
      const uncategorizedId = (uncategorizedCats[0] as any).id;
      console.log(`\n🔍 检查分配到未分类分类(ID:${uncategorizedId})的提示词:`);
      
      const uncategorizedPrompts = await sequelize.query(`
        SELECT id, title, categoryId, isPublic, userId
        FROM prompts 
        WHERE categoryId = ${uncategorizedId}
        ORDER BY id ASC
      `, { type: QueryTypes.SELECT });

      if (uncategorizedPrompts.length === 0) {
        console.log('  ❌ 没有提示词分配到未分类分类');
      } else {
        (uncategorizedPrompts as any[]).forEach(prompt => {
          console.log(`  - ID:${prompt.id} "${prompt.title}" (userId: ${prompt.userId})`);
        });
      }

      // 6. 检查categoryId为null的提示词
      console.log('\n🔍 检查categoryId为null的提示词:');
      const nullCategoryPrompts = await sequelize.query(`
        SELECT id, title, categoryId, isPublic, userId
        FROM prompts 
        WHERE categoryId IS NULL AND userId = ${testUser.id}
        ORDER BY id ASC
      `, { type: QueryTypes.SELECT });

      if (nullCategoryPrompts.length === 0) {
        console.log('  ✅ 没有categoryId为null的提示词');
      } else {
        console.log(`  ❌ 发现 ${nullCategoryPrompts.length} 个categoryId为null的提示词:`);
        (nullCategoryPrompts as any[]).forEach(prompt => {
          console.log(`    - ID:${prompt.id} "${prompt.title}"`);
        });
      }

      // 7. 计算权限逻辑下用户应该看到的提示词数量
      console.log('\n🔐 权限逻辑测试 - 用户应该看到的未分类提示词:');
      const visiblePrompts = await sequelize.query(`
        SELECT id, title, categoryId, isPublic, userId
        FROM prompts 
        WHERE categoryId = ${uncategorizedId} 
          AND (isPublic = 1 OR userId = ${testUser.id})
        ORDER BY id ASC
      `, { type: QueryTypes.SELECT });

      console.log(`  应该看到 ${visiblePrompts.length} 个提示词:`);
      (visiblePrompts as any[]).forEach(prompt => {
        const reason = prompt.isPublic ? '公开' : '自己的';
        console.log(`    - "${prompt.title}" (${reason})`);
      });
    }

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔒 数据库连接已关闭');
  }
}

directSQLDebug().catch(console.error);