#!/usr/bin/env npx tsx

/**
 * 迁移categoryId为null的提示词到用户的未分类分类
 */

import axios from 'axios';

async function migrateNullCategoryPrompts() {
  console.log('🔄 迁移categoryId为null的提示词...\n');

  try {
    const baseURL = 'http://localhost:3001';

    // 1. 登录获取token
    console.log('🔐 登录...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'maxazure@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ 登录成功');

    // 2. 获取用户的提示词
    console.log('\n📝 获取用户提示词...');
    const promptsResponse = await axios.get(`${baseURL}/api/prompts/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const prompts = promptsResponse.data.prompts || [];
    console.log(`找到 ${prompts.length} 个提示词`);

    // 3. 查找categoryId为null的提示词
    const nullCategoryPrompts = prompts.filter((p: any) => p.categoryId === null);
    console.log(`其中 ${nullCategoryPrompts.length} 个提示词的categoryId为null:`);
    
    nullCategoryPrompts.forEach((prompt: any) => {
      console.log(`  - ID:${prompt.id} "${prompt.title}"`);
    });

    if (nullCategoryPrompts.length === 0) {
      console.log('✅ 没有需要迁移的提示词');
      return;
    }

    // 4. 触发分类API以确保创建未分类分类
    console.log('\n📂 触发分类创建...');
    const categoriesResponse = await axios.get(`${baseURL}/api/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const categories = categoriesResponse.data.categories;
    console.log('✅ 分类API调用完成');

    // 5. 检查未分类分类是否存在
    const uncategorizedCategory = categories.personal?.find((cat: any) => cat.name === '未分类');
    
    if (!uncategorizedCategory) {
      console.log('❌ 未分类分类仍然不存在，无法继续迁移');
      return;
    }

    console.log(`✅ 找到未分类分类 (ID: ${uncategorizedCategory.id})`);

    // 6. 迁移提示词
    console.log('\n🔄 开始迁移提示词...');
    
    for (const prompt of nullCategoryPrompts) {
      try {
        console.log(`📝 迁移提示词: "${prompt.title}"`);
        
        const updateResponse = await axios.put(`${baseURL}/api/prompts/${prompt.id}`, {
          title: prompt.title,
          content: prompt.content,
          description: prompt.description,
          categoryId: uncategorizedCategory.id,
          isPublic: prompt.isPublic,
          tags: prompt.tags || []
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log(`  ✅ 成功迁移到分类 ${uncategorizedCategory.id}`);
        
      } catch (error: any) {
        console.log(`  ❌ 迁移失败: ${error.response?.data?.error || error.message}`);
      }
    }

    // 7. 验证迁移结果
    console.log('\n🔍 验证迁移结果...');
    
    const updatedCategoriesResponse = await axios.get(`${baseURL}/api/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const updatedCategories = updatedCategoriesResponse.data.categories;
    const updatedUncategorized = updatedCategories.personal?.find((cat: any) => cat.name === '未分类');
    
    if (updatedUncategorized) {
      console.log(`✅ 迁移完成！未分类分类现在有 ${updatedUncategorized.promptCount} 个提示词`);
    } else {
      console.log('❌ 迁移后仍然没有找到未分类分类');
    }

  } catch (error: any) {
    console.error('❌ 迁移过程中发生错误:', error.response?.data || error.message);
  }
}

migrateNullCategoryPrompts().catch(console.error);