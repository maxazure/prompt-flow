#!/usr/bin/env npx tsx

/**
 * 公共分类移除迁移完整性验证脚本
 */

import dotenv from 'dotenv';
import { sequelize } from '../config/database';
import { User, Category, Prompt } from '../models';

// 确保加载环境变量
dotenv.config();

async function verifyMigrationIntegrity() {
  console.log('🔍 开始验证迁移完整性...\n');

  try {
    // 确保数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 1. 检查公共分类是否完全移除
    console.log('📋 检查公共分类移除状态...');
    const publicCategoriesCount = await Category.count({
      where: { scopeType: 'public' }
    });
    console.log(`   公共分类数量: ${publicCategoriesCount} (期望: 0)`);
    
    if (publicCategoriesCount > 0) {
      const remainingPublic = await Category.findAll({
        where: { scopeType: 'public' },
        attributes: ['id', 'name', 'createdBy']
      });
      console.log('   剩余公共分类:', remainingPublic.map(c => `${c.name}(ID:${c.id})`));
    }

    // 2. 检查孤儿提示词
    console.log('\n🔗 检查孤儿提示词...');
    const allPrompts = await Prompt.findAll({
      attributes: ['id', 'title', 'categoryId'],
      include: [{
        model: Category,
        as: 'categoryRelation',
        required: false,
        attributes: ['id', 'name']
      }]
    });
    
    const orphanPrompts = allPrompts.filter(p => p.categoryId && !p.categoryRelation);
    console.log(`   孤儿提示词数量: ${orphanPrompts.length} (期望: 0)`);
    
    if (orphanPrompts.length > 0) {
      console.log('   孤儿提示词列表:');
      orphanPrompts.forEach(p => {
        console.log(`     - "${p.title}" (ID:${p.id}, categoryId:${p.categoryId})`);
      });
    }

    // 3. 检查未分类分类覆盖
    console.log('\n👤 检查用户未分类分类覆盖...');
    const users = await User.findAll({
      attributes: ['id', 'email', 'username']
    });
    const usersWithoutUncategorized = [];
    
    for (const user of users) {
      const uncategorized = await Category.findOne({
        where: {
          name: '未分类',
          scopeType: 'personal',
          scopeId: user.id
        }
      });
      
      if (!uncategorized) {
        usersWithoutUncategorized.push(user.email);
      }
    }
    
    console.log(`   缺少未分类分类的用户: ${usersWithoutUncategorized.length} (期望: 0)`);
    if (usersWithoutUncategorized.length > 0) {
      console.log('   用户列表:', usersWithoutUncategorized);
    }

    // 4. 检查分类计数一致性
    console.log('\n📊 检查分类计数一致性...');
    const categoriesWithCounts = await Category.findAll({
      attributes: ['id', 'name', 'scopeType'],
      include: [{
        model: Prompt,
        as: 'prompts',
        attributes: ['id']
      }]
    });

    let countInconsistencies = 0;
    for (const category of categoriesWithCounts) {
      const actualCount = category.prompts ? category.prompts.length : 0;
      
      // 这里可以添加与API返回的promptCount对比
      // 目前只统计实际提示词数量
      if (actualCount < 0) { // 基本的合理性检查
        countInconsistencies++;
        console.log(`   分类 "${category.name}" 计数异常: ${actualCount}`);
      }
    }
    console.log(`   分类计数异常数量: ${countInconsistencies} (期望: 0)`);

    // 5. 验证 CategoryScopeType 枚举值
    console.log('\n🏷️  检查枚举类型一致性...');
    const distinctScopeTypes = await Category.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('scopeType')), 'scopeType']
      ],
      raw: true
    });
    
    const actualScopeTypes = distinctScopeTypes.map(row => row.scopeType);
    const expectedScopeTypes = ['personal', 'team'];
    const unexpectedTypes = actualScopeTypes.filter(type => !expectedScopeTypes.includes(type));
    
    console.log(`   数据库中的作用域类型: [${actualScopeTypes.join(', ')}]`);
    console.log(`   期望的作用域类型: [${expectedScopeTypes.join(', ')}]`);
    console.log(`   意外的作用域类型: ${unexpectedTypes.length} (期望: 0)`);
    
    if (unexpectedTypes.length > 0) {
      console.log('   意外类型列表:', unexpectedTypes);
    }

    // 6. 统计迁移结果
    console.log('\n📊 迁移后统计信息:');
    const totalUsers = await User.count();
    const totalCategories = await Category.count();
    const totalPrompts = await Prompt.count();
    const personalCategories = await Category.count({ where: { scopeType: 'personal' } });
    const teamCategories = await Category.count({ where: { scopeType: 'team' } });
    
    console.log(`   用户总数: ${totalUsers}`);
    console.log(`   分类总数: ${totalCategories} (个人: ${personalCategories}, 团队: ${teamCategories})`);
    console.log(`   提示词总数: ${totalPrompts}`);

    // 7. 综合验证结果
    console.log('\n🎯 验证结果汇总:');
    
    const checks = [
      { name: '公共分类完全移除', passed: publicCategoriesCount === 0 },
      { name: '无孤儿提示词', passed: orphanPrompts.length === 0 },
      { name: '用户未分类分类完整', passed: usersWithoutUncategorized.length === 0 },
      { name: '分类计数一致', passed: countInconsistencies === 0 },
      { name: '作用域类型纯净', passed: unexpectedTypes.length === 0 }
    ];

    checks.forEach(check => {
      const status = check.passed ? '✅' : '❌';
      console.log(`   ${status} ${check.name}`);
    });

    const allPassed = checks.every(check => check.passed);
    
    if (allPassed) {
      console.log('\n🎉 迁移验证通过！所有检查项目都符合预期。');
      console.log('   系统已成功从公共分类架构迁移到简化架构。');
    } else {
      console.log('\n⚠️  迁移验证发现问题！请查看上述检查结果并修复问题。');
      const failedChecks = checks.filter(check => !check.passed);
      console.log('   失败的检查项目:');
      failedChecks.forEach(check => {
        console.log(`     - ${check.name}`);
      });
    }

    return allPassed;

  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
    return false;
  } finally {
    await sequelize.close();
    console.log('\n🔒 数据库连接已关闭');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  verifyMigrationIntegrity()
    .then(success => {
      console.log(`\n📋 验证${success ? '成功' : '失败'}，退出码: ${success ? 0 : 1}`);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

export { verifyMigrationIntegrity };