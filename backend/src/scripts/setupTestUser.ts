#!/usr/bin/env npx tsx

/**
 * 设置测试用户和数据，用于测试未分类计数功能
 */

import { sequelize } from '../config/database';
import { User, Prompt } from '../models';
import { ensureUncategorizedCategory } from '../services/uncategorizedService';
import bcrypt from 'bcryptjs';

async function setupTestUser() {
  console.log('🔧 设置测试用户和数据...\n');

  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 创建或查找测试用户
    let testUser = await User.findOne({
      where: { email: 'maxazure@gmail.com' }
    });

    if (!testUser) {
      console.log('👤 创建测试用户...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser = await User.create({
        username: 'maxazure',
        email: 'maxazure@gmail.com',
        password: hashedPassword
      });
      console.log(`✅ 测试用户创建成功 (ID: ${testUser.id})`);
    } else {
      console.log(`✅ 找到现有测试用户 (ID: ${testUser.id})`);
    }

    // 获取或创建未分类分类
    const uncategorizedCategory = await ensureUncategorizedCategory(testUser.id);
    console.log(`✅ 未分类分类 ID: ${uncategorizedCategory.id}`);

    // 创建测试提示词
    console.log('\n📝 创建测试提示词...');

    // 删除现有的测试提示词
    await Prompt.destroy({
      where: { 
        userId: testUser.id,
        title: { 
          [require('sequelize').Op.like]: '测试提示词%' 
        }
      }
    });

    // 创建一个私有提示词（分配到未分类）
    const privatePrompt = await Prompt.create({
      title: '测试提示词-私有',
      content: '这是一个私有的测试提示词',
      description: '用于测试未分类计数的私有提示词',
      isPublic: false,
      userId: testUser.id,
      categoryId: uncategorizedCategory.id,
      version: 1
    });
    console.log(`✅ 创建私有提示词: ${privatePrompt.title}`);

    // 创建一个公开提示词（分配到未分类）
    const publicPrompt = await Prompt.create({
      title: '测试提示词-公开',
      content: '这是一个公开的测试提示词',
      description: '用于测试未分类计数的公开提示词',
      isPublic: true,
      userId: testUser.id,
      categoryId: uncategorizedCategory.id,
      version: 1
    });
    console.log(`✅ 创建公开提示词: ${publicPrompt.title}`);

    // 验证设置
    const userPrompts = await Prompt.findAll({
      where: { userId: testUser.id },
      attributes: ['id', 'title', 'isPublic', 'categoryId']
    });

    console.log(`\n📊 测试数据设置完成:`);
    console.log(`  用户: ${testUser.username} (${testUser.email})`);
    console.log(`  未分类ID: ${uncategorizedCategory.id}`);
    console.log(`  用户提示词数量: ${userPrompts.length}`);
    
    userPrompts.forEach(prompt => {
      console.log(`    - ${prompt.title} (${prompt.isPublic ? '公开' : '私有'})`);
    });

    console.log('\n✅ 测试用户和数据设置完成！');
    console.log('💡 现在可以运行 testUncategorizedCount.ts 来测试计数功能');

  } catch (error) {
    console.error('❌ 设置过程中发生错误:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔒 数据库连接已关闭');
  }
}

// 运行设置
setupTestUser().catch(console.error);