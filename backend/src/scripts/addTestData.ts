#!/usr/bin/env npx tsx

/**
 * 智能添加测试数据脚本
 * 检查现有数据，只添加缺失的测试数据
 */

import dotenv from 'dotenv';
import { sequelize } from '../config/database';
import { User } from '../models/User';
import { Prompt } from '../models/Prompt';
import { PromptVersion } from '../models/PromptVersion';
import { Team } from '../models/Team';
import { TeamMember, TeamRole } from '../models/TeamMember';
import { Category, CategoryScopeType } from '../models/Category';
import bcrypt from 'bcryptjs';

// 确保加载环境变量
dotenv.config();

async function addTestData() {
  try {
    console.log('🌱 开始智能添加测试数据...\n');

    // 确保数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查并创建测试用户
    console.log('\n👤 检查测试用户...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const testUsers = [
      { username: 'admin@example.com', email: 'admin@example.com' },
      { username: 'sarah@example.com', email: 'sarah@example.com' },
      { username: 'john@example.com', email: 'john@example.com' },
      { username: 'alice_chen', email: 'alice.chen@example.com' },
      { username: 'bob_wang', email: 'bob.wang@example.com' },
      { username: 'carol_liu', email: 'carol.liu@example.com' }
    ];

    const users: User[] = [];
    for (const userData of testUsers) {
      let user = await User.findOne({ where: { email: userData.email } });
      if (!user) {
        user = await User.create({
          username: userData.username,
          email: userData.email,
          password: hashedPassword
        });
        console.log(`✅ 创建用户: ${userData.email}`);
      } else {
        console.log(`ℹ️  用户已存在: ${userData.email}`);
      }
      users.push(user);
    }

    // 检查并创建测试团队
    console.log('\n👥 检查测试团队...');
    const teamData = [
      { name: 'AI开发团队', description: '专注于AI提示词优化和开发', ownerId: users[0].id },
      { name: '前端设计团队', description: '负责用户界面设计和前端开发', ownerId: users[1].id },
      { name: '数据科学团队', description: '数据分析和机器学习研究', ownerId: users[2].id }
    ];

    const teams: Team[] = [];
    for (const teamInfo of teamData) {
      let team = await Team.findOne({ where: { name: teamInfo.name } });
      if (!team) {
        team = await Team.create(teamInfo);
        console.log(`✅ 创建团队: ${teamInfo.name}`);
      } else {
        console.log(`ℹ️  团队已存在: ${teamInfo.name}`);
      }
      teams.push(team);
    }

    // 检查并添加团队成员
    console.log('\n🤝 检查团队成员关系...');
    const memberRelations = [
      { teamId: teams[0].id, userId: users[0].id, role: TeamRole.OWNER },
      { teamId: teams[0].id, userId: users[1].id, role: TeamRole.EDITOR },
      { teamId: teams[0].id, userId: users[3].id, role: TeamRole.VIEWER },
      { teamId: teams[1].id, userId: users[1].id, role: TeamRole.OWNER },
      { teamId: teams[1].id, userId: users[2].id, role: TeamRole.EDITOR },
      { teamId: teams[1].id, userId: users[4].id, role: TeamRole.VIEWER },
      { teamId: teams[2].id, userId: users[2].id, role: TeamRole.OWNER },
      { teamId: teams[2].id, userId: users[3].id, role: TeamRole.EDITOR },
      { teamId: teams[2].id, userId: users[5].id, role: TeamRole.VIEWER }
    ];

    for (const relation of memberRelations) {
      const existing = await TeamMember.findOne({
        where: { teamId: relation.teamId, userId: relation.userId }
      });
      if (!existing) {
        await TeamMember.create(relation);
        console.log(`✅ 添加团队成员关系: 用户${relation.userId} -> 团队${relation.teamId}`);
      }
    }

    // 检查并创建测试分类
    console.log('\n📁 检查测试分类...');
    const categoryData = [
      { name: 'Web开发', description: '网站和Web应用开发相关提示词', scopeType: CategoryScopeType.PUBLIC, scopeId: null, createdBy: users[0].id, color: '#3b82f6' },
      { name: '编程助手', description: '代码编写和程序开发辅助', scopeType: CategoryScopeType.PUBLIC, scopeId: null, createdBy: users[1].id, color: '#10b981' },
      { name: '文档生成', description: '各类文档和说明书生成', scopeType: CategoryScopeType.PUBLIC, scopeId: null, createdBy: users[0].id, color: '#f59e0b' },
      { name: '数据分析', description: '数据处理和分析相关', scopeType: CategoryScopeType.PUBLIC, scopeId: null, createdBy: users[2].id, color: '#8b5cf6' },
      { name: 'UI/UX设计', description: '用户界面和体验设计', scopeType: CategoryScopeType.PUBLIC, scopeId: null, createdBy: users[1].id, color: '#ec4899' },
      // 团队分类
      { name: 'AI团队专用', description: 'AI开发团队内部使用的提示词', scopeType: CategoryScopeType.TEAM, scopeId: teams[0].id, createdBy: users[0].id, color: '#6366f1' },
      { name: '前端团队专用', description: '前端设计团队内部使用的提示词', scopeType: CategoryScopeType.TEAM, scopeId: teams[1].id, createdBy: users[1].id, color: '#14b8a6' },
      { name: '数据团队专用', description: '数据科学团队内部使用的提示词', scopeType: CategoryScopeType.TEAM, scopeId: teams[2].id, createdBy: users[2].id, color: '#f97316' }
    ];

    const categories: Category[] = [];
    for (const catData of categoryData) {
      let category = await Category.findOne({
        where: {
          name: catData.name,
          scopeType: catData.scopeType,
          scopeId: catData.scopeId
        }
      });
      if (!category) {
        category = await Category.create(catData);
        console.log(`✅ 创建分类: ${catData.name} (${catData.scopeType})`);
      } else {
        console.log(`ℹ️  分类已存在: ${catData.name}`);
      }
      categories.push(category);
    }

    // 检查并创建测试提示词
    console.log('\n📝 检查测试提示词...');
    const promptData = [
      {
        title: '网站代码生成器',
        content: '请生成一个响应式网站，包含以下要求：\n1. 现代化的设计风格\n2. 移动端适配\n3. 包含导航栏、主内容区和页脚\n4. 使用HTML5和CSS3\n5. 添加一些交互效果',
        description: '用于生成完整网站结构的AI提示词',
        categoryId: categories[0].id, // Web开发
        tags: ['html', 'css', 'responsive', 'website'],
        userId: users[1].id,
        isPublic: true,
        teamId: teams[1].id
      },
      {
        title: 'React组件开发助手',
        content: '作为React开发专家，请帮我创建一个可复用的组件：\n\n要求：\n- 使用TypeScript\n- 包含完整的类型定义\n- 添加PropTypes验证\n- 包含基础样式\n- 支持自定义主题\n- 提供使用示例',
        description: '专门用于React组件开发的提示词模板',
        categoryId: categories[1].id, // 编程助手
        tags: ['react', 'typescript', 'component', 'frontend'],
        userId: users[1].id,
        isPublic: true,
        teamId: teams[1].id
      },
      {
        title: 'API文档生成器',
        content: '请为以下API接口生成详细的文档：\n\n包含内容：\n1. 接口描述和用途\n2. 请求方法和URL\n3. 请求参数说明（类型、必填性、示例）\n4. 响应格式和状态码\n5. 错误处理说明\n6. 使用示例（curl和代码示例）\n7. 注意事项和最佳实践',
        description: 'RESTful API文档自动生成工具',
        categoryId: categories[2].id, // 文档生成
        tags: ['api', 'documentation', 'rest', 'swagger'],
        userId: users[0].id,
        isPublic: true,
        teamId: teams[0].id
      },
      {
        title: '代码审查助手',
        content: '作为资深代码审查专家，请对提供的代码进行全面审查：\n\n审查要点：\n1. 代码质量和可读性\n2. 性能优化建议\n3. 安全性检查\n4. 最佳实践遵循\n5. 潜在bug识别\n6. 重构建议\n7. 注释和文档完整性\n\n请提供具体的改进建议和示例代码。',
        description: '专业的代码质量审查工具',
        categoryId: categories[1].id, // 编程助手
        tags: ['code-review', 'quality', 'best-practices', 'refactoring'],
        userId: users[0].id,
        isPublic: false, // 私有提示词
        teamId: teams[0].id
      },
      {
        title: '数据分析报告生成器',
        content: '作为数据分析专家，请分析提供的数据并生成专业报告：\n\n分析内容：\n1. 数据概览和基本统计\n2. 趋势分析和模式识别\n3. 异常值检测\n4. 相关性分析\n5. 可视化建议\n6. 关键发现和洞察\n7. 业务建议和行动方案\n\n请用清晰的语言和图表说明分析结果。',
        description: '数据驱动的商业分析工具',
        categoryId: categories[3].id, // 数据分析
        tags: ['data', 'analysis', 'visualization', 'insights'],
        userId: users[2].id,
        isPublic: true
      },
      {
        title: '用户体验优化建议',
        content: '作为UX/UI设计专家，请分析网站/应用的用户体验：\n\n评估维度：\n1. 界面设计和视觉层次\n2. 交互流程和导航逻辑\n3. 响应式设计适配\n4. 加载性能和速度\n5. 可访问性和包容性设计\n6. 用户行为和路径分析\n7. 转化率优化建议\n\n请提供具体的改进方案和优先级排序。',
        description: '全面的用户体验分析和优化工具',
        categoryId: categories[4].id, // UI/UX设计
        tags: ['ux', 'ui', 'design', 'optimization', 'conversion'],
        userId: users[1].id,
        isPublic: true,
        teamId: teams[1].id
      },
      {
        title: 'Python数据处理脚本',
        content: '请编写一个Python脚本，用于处理CSV数据文件：\n\n功能要求：\n1. 读取CSV文件\n2. 数据清洗和预处理\n3. 缺失值处理\n4. 数据类型转换\n5. 基础统计分析\n6. 生成可视化图表\n7. 导出处理结果',
        description: 'Python数据处理自动化工具',
        categoryId: categories[3].id, // 数据分析
        tags: ['python', 'pandas', 'data-processing', 'csv'],
        userId: users[2].id,
        isPublic: false, // 私有提示词
        teamId: teams[2].id
      },
      {
        title: 'AI团队内部工具',
        content: '团队专用的AI开发工具提示词，包含模型训练、评估和部署的完整流程。',
        description: 'AI开发团队内部使用的专业工具',
        categoryId: categories[5].id, // AI团队专用
        tags: ['ai', 'machine-learning', 'team-internal'],
        userId: users[0].id,
        isPublic: false,
        teamId: teams[0].id
      },
      {
        title: '前端组件库文档',
        content: '为前端组件库生成完整的使用文档和API说明。',
        description: '前端团队组件库文档生成器',
        categoryId: categories[6].id, // 前端团队专用
        tags: ['frontend', 'component-library', 'documentation'],
        userId: users[1].id,
        isPublic: false,
        teamId: teams[1].id
      },
      {
        title: '机器学习模型评估',
        content: '对机器学习模型进行全面的性能评估和分析。',
        description: '数据科学团队模型评估工具',
        categoryId: categories[7].id, // 数据团队专用
        tags: ['machine-learning', 'model-evaluation', 'data-science'],
        userId: users[2].id,
        isPublic: false,
        teamId: teams[2].id
      }
    ];

    const prompts: Prompt[] = [];
    for (const promptInfo of promptData) {
      let prompt = await Prompt.findOne({ where: { title: promptInfo.title } });
      if (!prompt) {
        prompt = await Prompt.create({
          ...promptInfo,
          version: 1
        });
        console.log(`✅ 创建提示词: ${promptInfo.title}`);
      } else {
        console.log(`ℹ️  提示词已存在: ${promptInfo.title}`);
      }
      prompts.push(prompt);
    }

    console.log('\n🎉 测试数据添加完成！');
    console.log('\n📋 测试账号信息：');
    console.log('管理员账号: admin@example.com / 123456');
    console.log('用户账号1: sarah@example.com / 123456');
    console.log('用户账号2: john@example.com / 123456');
    console.log('用户账号3: alice.chen@example.com / 123456');
    console.log('用户账号4: bob.wang@example.com / 123456');
    console.log('用户账号5: carol.liu@example.com / 123456');
    console.log('\n📊 数据统计：');
    console.log(`- 用户: ${users.length} 个`);
    console.log(`- 团队: ${teams.length} 个`);
    console.log(`- 分类: ${categories.length} 个`);
    console.log(`- 提示词: ${prompts.length} 个`);

  } catch (error) {
    console.error('❌ 添加测试数据失败:', error);
  } finally {
    await sequelize.close();
  }
}

addTestData().catch(console.error);