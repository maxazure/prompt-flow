#!/usr/bin/env npx tsx

/**
 * 检查当前数据库连接配置
 */

import dotenv from 'dotenv';
import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

// 确保加载环境变量
dotenv.config();

async function checkDatabaseConnection() {
  console.log('🔍 检查数据库连接配置...\n');

  console.log('📋 环境变量:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  DATABASE_TYPE: ${process.env.DATABASE_TYPE}`);
  console.log(`  POSTGRES_HOST: ${process.env.POSTGRES_HOST}`);
  console.log(`  POSTGRES_DB: ${process.env.POSTGRES_DB}`);
  console.log(`  POSTGRES_USER: ${process.env.POSTGRES_USER}`);

  try {
    await sequelize.authenticate();
    console.log('\n✅ 数据库连接成功');

    // 检查数据库类型
    const dialect = sequelize.getDialect();
    console.log(`📊 数据库类型: ${dialect}`);

    // 获取数据库信息
    if (dialect === 'postgres') {
      const result = await sequelize.query('SELECT current_database() as db_name', { type: QueryTypes.SELECT });
      console.log(`📦 当前数据库: ${(result[0] as any).db_name}`);
      
      // 检查表
      const tables = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `, { type: QueryTypes.SELECT });
      
      console.log(`📋 数据库表 (${tables.length} 个):`);
      (tables as any[]).forEach(table => {
        console.log(`  - ${table.table_name}`);
      });

    } else if (dialect === 'sqlite') {
      console.log('📦 SQLite数据库');
      
      const tables = await sequelize.query(`
        SELECT name 
        FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
      `, { type: QueryTypes.SELECT });
      
      console.log(`📋 数据库表 (${tables.length} 个):`);
      (tables as any[]).forEach(table => {
        console.log(`  - ${(table as any).name}`);
      });
    }

    // 检查用户数据
    console.log('\n👤 用户数据:');
    const users = await sequelize.query('SELECT id, username, email FROM users ORDER BY id', { type: QueryTypes.SELECT });
    console.log(`找到 ${users.length} 个用户:`);
    (users as any[]).forEach(user => {
      console.log(`  - ID:${user.id} ${user.username} (${user.email})`);
    });

    // 检查提示词数据  
    console.log('\n📝 提示词数据:');
    const prompts = await sequelize.query('SELECT id, title, userId, categoryId, isPublic FROM prompts ORDER BY id LIMIT 10', { type: QueryTypes.SELECT });
    console.log(`找到 ${prompts.length} 个提示词 (显示前10个):`);
    (prompts as any[]).forEach(prompt => {
      console.log(`  - ID:${prompt.id} "${prompt.title}" (用户:${prompt.userId}, 分类:${prompt.categoryId}, 公开:${prompt.isPublic})`);
    });

  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔒 数据库连接已关闭');
  }
}

checkDatabaseConnection().catch(console.error);