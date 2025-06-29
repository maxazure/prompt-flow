#!/usr/bin/env npx tsx

/**
 * 通过API测试未分类计数功能
 */

import axios from 'axios';

async function testAPICount() {
  console.log('🧪 通过API测试未分类计数功能...\n');

  try {
    const baseURL = 'http://localhost:3001';

    // 1. 尝试登录获取token
    console.log('🔐 尝试登录...');
    try {
      const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
        email: 'maxazure@gmail.com',
        password: 'password123'
      });

      const token = loginResponse.data.token;
      console.log('✅ 登录成功，获得token');

      // 2. 获取用户的分类列表
      console.log('\n📂 获取分类列表...');
      const categoriesResponse = await axios.get(`${baseURL}/api/categories`, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });

      const categories = categoriesResponse.data;
      console.log('✅ 分类API响应:', JSON.stringify(categories, null, 2));

      // 查找未分类
      let uncategorizedCount = 0;
      let foundUncategorized = false;

      if (categories.categories && categories.categories.personal) {
        const uncategorized = categories.categories.personal.find((cat: any) => cat.name === '未分类');
        if (uncategorized) {
          uncategorizedCount = uncategorized.promptCount;
          foundUncategorized = true;
          console.log(`🎯 找到未分类分类：${uncategorized.promptCount} 个提示词`);
        }
      }

      if (!foundUncategorized) {
        console.log('❌ 未找到未分类分类');
      }

      // 3. 获取用户的提示词列表进行对比
      console.log('\n📝 获取用户提示词...');
      const promptsResponse = await axios.get(`${baseURL}/api/prompts/my`, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });

      const prompts = promptsResponse.data.prompts || [];
      console.log(`✅ 用户有 ${prompts.length} 个提示词`);

      prompts.forEach((prompt: any, index: number) => {
        console.log(`  ${index + 1}. ${prompt.title} (${prompt.isPublic ? '公开' : '私有'}, 分类ID: ${prompt.categoryId})`);
      });

      // 4. 总结测试结果
      console.log('\n📊 测试结果总结:');
      console.log(`  - 分类API显示未分类计数: ${uncategorizedCount}`);
      console.log(`  - 用户实际提示词数量: ${prompts.length}`);
      
      if (foundUncategorized && uncategorizedCount > 0) {
        console.log('  ✅ 未分类计数显示正常！');
      } else if (foundUncategorized && uncategorizedCount === 0 && prompts.length > 0) {
        console.log('  ❌ 发现回归问题：未分类计数为0但用户有提示词！');
        console.log('  🔍 这正是我们要修复的问题');
      } else if (!foundUncategorized) {
        console.log('  ⚠️  未找到未分类分类');
      } else {
        console.log('  ℹ️  未分类计数为0，用户确实没有提示词');
      }

    } catch (loginError: any) {
      console.log('❌ 登录失败:', loginError.response?.data || loginError.message);
      
      // 尝试未认证的请求
      console.log('\n📂 尝试未认证的分类请求...');
      try {
        const publicCategoriesResponse = await axios.get(`${baseURL}/api/categories`);
        console.log('✅ 公开分类API响应:', JSON.stringify(publicCategoriesResponse.data, null, 2));
      } catch (error: any) {
        console.log('❌ 公开分类请求失败:', error.response?.data || error.message);
      }
    }

  } catch (error: any) {
    console.error('❌ 测试过程中发生错误:', error.response?.data || error.message);
  }
}

// 运行测试
testAPICount().catch(console.error);