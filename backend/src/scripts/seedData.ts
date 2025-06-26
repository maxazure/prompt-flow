import { sequelize } from '../config/database';
import { User } from '../models/User';
import { Prompt } from '../models/Prompt';
import { PromptVersion } from '../models/PromptVersion';
import { Team } from '../models/Team';
import { TeamMember, TeamRole } from '../models/TeamMember';
import bcrypt from 'bcryptjs';

async function seedData() {
  try {
    console.log('🌱 开始添加测试数据...');

    // 创建测试用户
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const users = await User.bulkCreate([
      {
        username: 'admin@example.com',
        email: 'admin@example.com',
        password: hashedPassword
      },
      {
        username: 'sarah@example.com',
        email: 'sarah@example.com',
        password: hashedPassword
      },
      {
        username: 'john@example.com',
        email: 'john@example.com',
        password: hashedPassword
      }
    ]);

    console.log('✅ 创建了 3 个测试用户');

    // 创建测试团队
    const teams = await Team.bulkCreate([
      {
        name: 'AI开发团队',
        description: '专注于AI提示词优化和开发',
        ownerId: users[0].id
      },
      {
        name: '前端设计团队',
        description: '负责用户界面设计和前端开发',
        ownerId: users[1].id
      }
    ]);

    console.log('✅ 创建了 2 个测试团队');

    // 添加团队成员
    await TeamMember.bulkCreate([
      {
        teamId: teams[0].id,
        userId: users[0].id,
        role: TeamRole.OWNER
      },
      {
        teamId: teams[0].id,
        userId: users[1].id,
        role: TeamRole.EDITOR
      },
      {
        teamId: teams[1].id,
        userId: users[1].id,
        role: TeamRole.OWNER
      },
      {
        teamId: teams[1].id,
        userId: users[2].id,
        role: TeamRole.EDITOR
      }
    ]);

    console.log('✅ 添加了团队成员关系');

    // 创建测试提示词
    const prompts = await Prompt.bulkCreate([
      {
        title: '网站代码生成器',
        content: '请生成一个响应式网站，包含以下要求：\n1. 现代化的设计风格\n2. 移动端适配\n3. 包含导航栏、主内容区和页脚\n4. 使用HTML5和CSS3\n5. 添加一些交互效果',
        description: '用于生成完整网站结构的AI提示词',
        category: 'web-development',
        tags: ['html', 'css', 'responsive', 'website'],
        userId: users[1].id,
        isPublic: true,
        teamId: teams[1].id
      },
      {
        title: 'React组件开发助手',
        content: '作为React开发专家，请帮我创建一个可复用的组件：\n\n要求：\n- 使用TypeScript\n- 包含完整的类型定义\n- 添加PropTypes验证\n- 包含基础样式\n- 支持自定义主题\n- 提供使用示例',
        description: '专门用于React组件开发的提示词模板',
        category: 'programming',
        tags: ['react', 'typescript', 'component', 'frontend'],
        userId: users[1].id,
        isPublic: true,
        teamId: teams[1].id
      },
      {
        title: 'API文档生成器',
        content: '请为以下API接口生成详细的文档：\n\n包含内容：\n1. 接口描述和用途\n2. 请求方法和URL\n3. 请求参数说明（类型、必填性、示例）\n4. 响应格式和状态码\n5. 错误处理说明\n6. 使用示例（curl和代码示例）\n7. 注意事项和最佳实践',
        description: 'RESTful API文档自动生成工具',
        category: 'documentation',
        tags: ['api', 'documentation', 'rest', 'swagger'],
        userId: users[0].id,
        isPublic: true,
        teamId: teams[0].id
      },
      {
        title: '代码审查助手',
        content: '作为资深代码审查专家，请对提供的代码进行全面审查：\n\n审查要点：\n1. 代码质量和可读性\n2. 性能优化建议\n3. 安全性检查\n4. 最佳实践遵循\n5. 潜在bug识别\n6. 重构建议\n7. 注释和文档完整性\n\n请提供具体的改进建议和示例代码。',
        description: '专业的代码质量审查工具',
        category: 'programming',
        tags: ['code-review', 'quality', 'best-practices', 'refactoring'],
        userId: users[0].id,
        isPublic: false,
        teamId: teams[0].id
      },
      {
        title: '数据分析报告生成器',
        content: '作为数据分析专家，请分析提供的数据并生成专业报告：\n\n分析内容：\n1. 数据概览和基本统计\n2. 趋势分析和模式识别\n3. 异常值检测\n4. 相关性分析\n5. 可视化建议\n6. 关键发现和洞察\n7. 业务建议和行动方案\n\n请用清晰的语言和图表说明分析结果。',
        description: '数据驱动的商业分析工具',
        category: 'data-analysis',
        tags: ['data', 'analysis', 'visualization', 'insights'],
        userId: users[2].id,
        isPublic: true
      },
      {
        title: '用户体验优化建议',
        content: '作为UX/UI设计专家，请分析网站/应用的用户体验：\n\n评估维度：\n1. 界面设计和视觉层次\n2. 交互流程和导航逻辑\n3. 响应式设计适配\n4. 加载性能和速度\n5. 可访问性和包容性设计\n6. 用户行为和路径分析\n7. 转化率优化建议\n\n请提供具体的改进方案和优先级排序。',
        description: '全面的用户体验分析和优化工具',
        category: 'design',
        tags: ['ux', 'ui', 'design', 'optimization', 'conversion'],
        userId: users[1].id,
        isPublic: true,
        teamId: teams[1].id
      }
    ]);

    console.log('✅ 创建了 6 个测试提示词');

    // 为部分提示词创建版本历史
    await PromptVersion.bulkCreate([
      {
        promptId: prompts[0].id,
        version: 1,
        title: '网站代码生成器',
        content: '请生成一个简单的网站，包含HTML和CSS。',
        description: '基础版本的网站生成器',
        category: 'web-development',
        tags: ['html', 'css'],
        userId: users[1].id,
        changeLog: '初始版本'
      },
      {
        promptId: prompts[0].id,
        version: 2,
        title: '网站代码生成器',
        content: '请生成一个响应式网站，包含以下要求：\n1. 现代化的设计风格\n2. 移动端适配\n3. 包含导航栏、主内容区和页脚\n4. 使用HTML5和CSS3\n5. 添加一些交互效果',
        description: '用于生成完整网站结构的AI提示词',
        category: 'web-development',
        tags: ['html', 'css', 'responsive', 'website'],
        userId: users[1].id,
        changeLog: '添加响应式设计和交互效果要求'
      },
      {
        promptId: prompts[1].id,
        version: 1,
        title: 'React组件开发助手',
        content: '请帮我创建一个React组件，使用TypeScript。',
        description: '基础的React组件开发助手',
        category: 'programming',
        tags: ['react', 'typescript'],
        userId: users[1].id,
        changeLog: '初始版本'
      },
      {
        promptId: prompts[2].id,
        version: 1,
        title: 'API文档生成器',
        content: '请为API接口生成文档，包含基本的请求和响应说明。',
        description: '基础的API文档生成工具',
        category: 'documentation',
        tags: ['api', 'documentation'],
        userId: users[0].id,
        changeLog: '初始版本'
      }
    ]);

    console.log('✅ 创建了版本历史记录');

    console.log('\n🎉 测试数据添加完成！');
    console.log('\n📋 测试账号信息：');
    console.log('管理员账号: admin@example.com / 123456');
    console.log('用户账号1: sarah@example.com / 123456');
    console.log('用户账号2: john@example.com / 123456');
    console.log('\n📊 数据统计：');
    console.log(`- 用户: ${users.length} 个`);
    console.log(`- 团队: ${teams.length} 个`);
    console.log(`- 提示词: ${prompts.length} 个`);
    console.log('- 版本历史: 4 个');

  } catch (error) {
    console.error('❌ 添加测试数据失败:', error);
  }
}

export { seedData };

// 如果直接运行此脚本
if (require.main === module) {
  seedData().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}