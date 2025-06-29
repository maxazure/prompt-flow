#!/usr/bin/env npx tsx

/**
 * 通过API添加测试数据脚本
 */

import axios from 'axios';

async function addTestDataViaAPI() {
  console.log('🌱 开始通过API添加测试数据...\n');

  try {
    const baseURL = 'http://localhost:3001';

    // 1. 注册测试用户
    console.log('👤 注册测试用户...');
    const testUsers = [
      { username: 'admin', email: 'admin@example.com', password: 'password123' },
      { username: 'sarah', email: 'sarah@example.com', password: 'password123' },
      { username: 'john', email: 'john@example.com', password: 'password123' },
      { username: 'alice', email: 'alice.chen@example.com', password: 'password123' },
      { username: 'bob', email: 'bob.wang@example.com', password: 'password123' },
      { username: 'carol', email: 'carol.liu@example.com', password: 'password123' }
    ];

    const userTokens: { [key: string]: string } = {};

    for (const user of testUsers) {
      try {
        // 尝试注册
        await axios.post(`${baseURL}/api/auth/register`, user);
        console.log(`✅ 注册用户: ${user.email}`);
      } catch (error: any) {
        if (error.response?.data?.error?.includes('already exists')) {
          console.log(`ℹ️  用户已存在: ${user.email}`);
        } else {
          console.log(`❌ 注册失败: ${user.email} - ${error.response?.data?.error || error.message}`);
        }
      }

      // 登录获取token
      try {
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
          email: user.email,
          password: user.password
        });
        userTokens[user.email] = loginResponse.data.token;
        console.log(`🔐 登录成功: ${user.email}`);
      } catch (error: any) {
        console.log(`❌ 登录失败: ${user.email} - ${error.response?.data?.error || error.message}`);
      }
    }

    // 2. 创建分类
    console.log('\n📁 创建公开分类...');
    const publicCategories = [
      { name: 'Web开发', description: '网站和Web应用开发相关提示词', color: '#3b82f6' },
      { name: '编程助手', description: '代码编写和程序开发辅助', color: '#10b981' },
      { name: '文档生成', description: '各类文档和说明书生成', color: '#f59e0b' },
      { name: '数据分析', description: '数据处理和分析相关', color: '#8b5cf6' },
      { name: 'UI/UX设计', description: '用户界面和体验设计', color: '#ec4899' }
    ];

    for (const category of publicCategories) {
      try {
        const token = userTokens['admin@example.com'];
        if (token) {
          await axios.post(`${baseURL}/api/categories`, {
            ...category,
            scopeType: 'public'
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log(`✅ 创建分类: ${category.name}`);
        }
      } catch (error: any) {
        if (error.response?.data?.error?.includes('already exists')) {
          console.log(`ℹ️  分类已存在: ${category.name}`);
        } else {
          console.log(`❌ 创建分类失败: ${category.name} - ${error.response?.data?.error || error.message}`);
        }
      }
    }

    // 3. 创建测试提示词
    console.log('\n📝 创建测试提示词...');
    const testPrompts = [
      {
        title: '网站代码生成器',
        content: '请生成一个响应式网站，包含以下要求：\n1. 现代化的设计风格\n2. 移动端适配\n3. 包含导航栏、主内容区和页脚\n4. 使用HTML5和CSS3\n5. 添加一些交互效果',
        description: '用于生成完整网站结构的AI提示词',
        tags: ['html', 'css', 'responsive', 'website'],
        isPublic: true,
        userEmail: 'sarah@example.com'
      },
      {
        title: 'React组件开发助手',
        content: '作为React开发专家，请帮我创建一个可复用的组件：\n\n要求：\n- 使用TypeScript\n- 包含完整的类型定义\n- 添加PropTypes验证\n- 包含基础样式\n- 支持自定义主题\n- 提供使用示例',
        description: '专门用于React组件开发的提示词模板',
        tags: ['react', 'typescript', 'component', 'frontend'],
        isPublic: true,
        userEmail: 'sarah@example.com'
      },
      {
        title: 'API文档生成器',
        content: '请为以下API接口生成详细的文档：\n\n包含内容：\n1. 接口描述和用途\n2. 请求方法和URL\n3. 请求参数说明（类型、必填性、示例）\n4. 响应格式和状态码\n5. 错误处理说明\n6. 使用示例（curl和代码示例）\n7. 注意事项和最佳实践',
        description: 'RESTful API文档自动生成工具',
        tags: ['api', 'documentation', 'rest', 'swagger'],
        isPublic: true,
        userEmail: 'admin@example.com'
      },
      {
        title: '代码审查助手',
        content: '作为资深代码审查专家，请对提供的代码进行全面审查：\n\n审查要点：\n1. 代码质量和可读性\n2. 性能优化建议\n3. 安全性检查\n4. 最佳实践遵循\n5. 潜在bug识别\n6. 重构建议\n7. 注释和文档完整性\n\n请提供具体的改进建议和示例代码。',
        description: '专业的代码质量审查工具',
        tags: ['code-review', 'quality', 'best-practices', 'refactoring'],
        isPublic: false, // 私有提示词
        userEmail: 'admin@example.com'
      },
      {
        title: '数据分析报告生成器',
        content: '作为数据分析专家，请分析提供的数据并生成专业报告：\n\n分析内容：\n1. 数据概览和基本统计\n2. 趋势分析和模式识别\n3. 异常值检测\n4. 相关性分析\n5. 可视化建议\n6. 关键发现和洞察\n7. 业务建议和行动方案\n\n请用清晰的语言和图表说明分析结果。',
        description: '数据驱动的商业分析工具',
        tags: ['data', 'analysis', 'visualization', 'insights'],
        isPublic: true,
        userEmail: 'john@example.com'
      },
      {
        title: '用户体验优化建议',
        content: '作为UX/UI设计专家，请分析网站/应用的用户体验：\n\n评估维度：\n1. 界面设计和视觉层次\n2. 交互流程和导航逻辑\n3. 响应式设计适配\n4. 加载性能和速度\n5. 可访问性和包容性设计\n6. 用户行为和路径分析\n7. 转化率优化建议\n\n请提供具体的改进方案和优先级排序。',
        description: '全面的用户体验分析和优化工具',
        tags: ['ux', 'ui', 'design', 'optimization', 'conversion'],
        isPublic: true,
        userEmail: 'sarah@example.com'
      },
      {
        title: 'Python数据处理脚本',
        content: '请编写一个Python脚本，用于处理CSV数据文件：\n\n功能要求：\n1. 读取CSV文件\n2. 数据清洗和预处理\n3. 缺失值处理\n4. 数据类型转换\n5. 基础统计分析\n6. 生成可视化图表\n7. 导出处理结果',
        description: 'Python数据处理自动化工具',
        tags: ['python', 'pandas', 'data-processing', 'csv'],
        isPublic: false, // 私有提示词
        userEmail: 'john@example.com'
      },
      {
        title: '移动应用UI设计指南',
        content: '为移动应用设计现代化的用户界面：\n\n设计要点：\n1. Material Design或iOS设计规范\n2. 色彩搭配和主题设计\n3. 图标和按钮设计\n4. 导航结构设计\n5. 响应式布局适配\n6. 无障碍设计考虑\n7. 用户操作反馈设计',
        description: '移动应用界面设计专业指南',
        tags: ['mobile', 'ui', 'design', 'ios', 'android'],
        isPublic: true,
        userEmail: 'alice.chen@example.com'
      }
    ];

    for (const prompt of testPrompts) {
      try {
        const token = userTokens[prompt.userEmail];
        if (token) {
          const promptData = {
            title: prompt.title,
            content: prompt.content,
            description: prompt.description,
            tags: prompt.tags,
            isPublic: prompt.isPublic
          };

          await axios.post(`${baseURL}/api/prompts`, promptData, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log(`✅ 创建提示词: ${prompt.title} (${prompt.userEmail})`);
        }
      } catch (error: any) {
        console.log(`❌ 创建提示词失败: ${prompt.title} - ${error.response?.data?.error || error.message}`);
      }
    }

    console.log('\n🎉 测试数据添加完成！');
    console.log('\n📋 测试账号信息：');
    console.log('管理员账号: admin@example.com / password123');
    console.log('用户账号1: sarah@example.com / password123');
    console.log('用户账号2: john@example.com / password123');
    console.log('用户账号3: alice.chen@example.com / password123');
    console.log('用户账号4: bob.wang@example.com / password123');
    console.log('用户账号5: carol.liu@example.com / password123');

  } catch (error: any) {
    console.error('❌ 添加测试数据失败:', error.response?.data || error.message);
  }
}

addTestDataViaAPI().catch(console.error);