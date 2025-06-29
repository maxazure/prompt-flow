import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import { User } from '../models/User';
import { Prompt } from '../models/Prompt';
import { Category, CategoryScopeType } from '../models/Category';

// =====================================================
// Test Data Insertion Script
// =====================================================

interface TestUser {
  username: string;
  email: string;
  password: string;
}

interface TestPrompt {
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  isPublic: boolean;
}

// 测试用户数据
const TEST_USERS: TestUser[] = [
  {
    username: 'alice_chen',
    email: 'alice.chen@example.com',
    password: 'password123',
  },
  {
    username: 'bob_wang',
    email: 'bob.wang@example.com',
    password: 'password123',
  },
  {
    username: 'carol_liu',
    email: 'carol.liu@example.com',
    password: 'password123',
  },
];

// 测试提示词数据模板
const PROMPT_TEMPLATES: Omit<TestPrompt, 'isPublic'>[] = [
  {
    title: '营销文案生成器',
    content: '请为 {product_name} 写一段吸引人的营销文案，突出 {key_feature} 这个特点，目标受众是 {target_audience}。',
    description: '帮助生成专业的营销文案，适用于各种产品推广',
    tags: ['营销', '文案', '推广'],
  },
  {
    title: '代码审查助手',
    content: '请审查以下 {language} 代码，重点关注：\n1. 代码质量和可读性\n2. 潜在的性能问题\n3. 安全漏洞\n4. 最佳实践建议\n\n代码：\n{code_content}',
    description: '专业的代码审查工具，提供全面的代码质量分析',
    tags: ['编程', '代码审查', '质量'],
  },
  {
    title: 'API文档生成器',
    content: '为以下API端点生成详细的文档：\n\n端点：{endpoint}\n方法：{method}\n参数：{parameters}\n\n请包含：\n- 功能描述\n- 请求示例\n- 响应示例\n- 错误码说明',
    description: '自动生成规范的API文档，提高开发效率',
    tags: ['API', '文档', '开发'],
  },
  {
    title: '学习计划制定师',
    content: '请为学习 {subject} 制定一个 {duration} 的学习计划。学习者的基础水平是 {level}，每天可用学习时间为 {daily_hours} 小时。请包含：\n1. 学习目标\n2. 阶段安排\n3. 学习资源推荐\n4. 评估方式',
    description: '个性化学习计划制定，帮助高效学习',
    tags: ['教育', '学习', '计划'],
  },
  {
    title: '邮件回复助手',
    content: '请帮我回复以下邮件，语气要 {tone}，回复要点包括：{key_points}\n\n原邮件内容：\n{original_email}\n\n请生成专业且得体的回复。',
    description: '智能邮件回复生成，提高沟通效率',
    tags: ['邮件', '沟通', '商务'],
  },
  {
    title: '产品需求分析师',
    content: '分析以下产品需求，并提供详细的分析报告：\n\n需求描述：{requirement}\n目标用户：{target_users}\n业务目标：{business_goals}\n\n请提供：\n1. 需求可行性分析\n2. 技术实现方案\n3. 风险评估\n4. 优先级建议',
    description: '专业的产品需求分析工具',
    tags: ['产品', '需求', '分析'],
  },
  {
    title: '创意头脑风暴器',
    content: '围绕主题 "{topic}" 进行创意头脑风暴，生成 {number} 个创新想法。考虑因素：\n- 目标：{objective}\n- 约束条件：{constraints}\n- 创新程度：{innovation_level}\n\n请提供多样化和可执行的创意方案。',
    description: '激发创意思维，生成多样化创新方案',
    tags: ['创意', '头脑风暴', '创新'],
  },
  {
    title: '数据分析报告生成器',
    content: '基于以下数据生成分析报告：\n\n数据集：{dataset_description}\n分析目标：{analysis_goal}\n关键指标：{key_metrics}\n\n请提供：\n1. 数据概览\n2. 趋势分析\n3. 异常检测\n4. 洞察和建议',
    description: '自动生成专业的数据分析报告',
    tags: ['数据分析', '报告', '洞察'],
  },
  {
    title: '会议纪要整理器',
    content: '请将以下会议记录整理成规范的会议纪要：\n\n会议主题：{meeting_topic}\n参与人员：{participants}\n会议时间：{meeting_time}\n\n原始记录：\n{raw_notes}\n\n请整理成包含议题、讨论要点、决议和行动项的格式。',
    description: '自动整理会议记录，生成规范纪要',
    tags: ['会议', '纪要', '整理'],
  },
  {
    title: 'SEO优化建议师',
    content: '为网站页面 "{page_title}" 提供SEO优化建议：\n\n当前内容：{current_content}\n目标关键词：{target_keywords}\n竞争对手：{competitors}\n\n请提供：\n1. 标题优化建议\n2. 内容结构调整\n3. 关键词布局\n4. 元数据优化',
    description: '专业的SEO优化建议工具',
    tags: ['SEO', '优化', '网站'],
  },
];

// 扩展提示词生成函数
function generateMorePrompts(): Omit<TestPrompt, 'isPublic'>[] {
  const additionalPrompts: Omit<TestPrompt, 'isPublic'>[] = [
    {
      title: 'React组件生成器',
      content: '生成一个React函数组件 {component_name}，功能要求：\n{functionality}\n\nProps接口：\n{props_interface}\n\n请包含TypeScript类型定义和基本样式。',
      description: '快速生成React组件代码',
      tags: ['React', '组件', 'TypeScript'],
    },
    {
      title: '社交媒体文案创作器',
      content: '为 {platform} 平台创作一条关于 {topic} 的社交媒体文案，风格：{style}，字数限制：{word_limit}，包含合适的话题标签。',
      description: '针对不同平台创作吸引人的社交媒体内容',
      tags: ['社交媒体', '文案', '营销'],
    },
    {
      title: '面试问题生成器',
      content: '为 {position} 职位生成 {number} 个面试问题，候选人经验水平：{experience_level}，重点考察：{focus_areas}。请包含技术问题和行为问题。',
      description: '生成专业的面试问题集',
      tags: ['面试', '招聘', 'HR'],
    },
    {
      title: '用户故事编写器',
      content: '为功能 "{feature_name}" 编写用户故事，用户角色：{user_role}，使用场景：{scenario}。\n\n格式：作为 {user_role}，我希望 {action}，以便 {benefit}。\n\n请包含验收标准。',
      description: '规范的用户故事编写工具',
      tags: ['用户故事', '产品', '敏捷'],
    },
    {
      title: 'SQL查询优化器',
      content: '优化以下SQL查询的性能：\n\n```sql\n{sql_query}\n```\n\n表结构：{table_schema}\n数据量：{data_volume}\n\n请提供优化建议和改进的查询语句。',
      description: 'SQL查询性能优化建议',
      tags: ['SQL', '优化', '数据库'],
    },
    {
      title: '技术架构评估师',
      content: '评估以下技术架构方案：\n\n项目规模：{project_scale}\n技术栈：{tech_stack}\n性能要求：{performance_requirements}\n团队规模：{team_size}\n\n请分析：\n1. 架构合理性\n2. 扩展性\n3. 维护成本\n4. 改进建议',
      description: '专业的技术架构评估工具',
      tags: ['架构', '技术', '评估'],
    },
    {
      title: '内容大纲生成器',
      content: '为主题 "{content_topic}" 生成详细的内容大纲：\n\n内容类型：{content_type}\n目标受众：{target_audience}\n预期长度：{expected_length}\n核心观点：{key_points}\n\n请提供层次化的大纲结构。',
      description: '生成结构化的内容创作大纲',
      tags: ['内容', '大纲', '写作'],
    },
    {
      title: '项目风险评估器',
      content: '评估项目 "{project_name}" 的潜在风险：\n\n项目类型：{project_type}\n时间周期：{timeline}\n团队配置：{team_configuration}\n技术复杂度：{technical_complexity}\n\n请识别风险因素并提供缓解策略。',
      description: '项目风险识别和管理工具',
      tags: ['项目管理', '风险', '评估'],
    },
    {
      title: '竞品分析报告生成器',
      content: '生成竞品分析报告：\n\n我方产品：{our_product}\n竞争对手：{competitors}\n分析维度：{analysis_dimensions}\n市场定位：{market_positioning}\n\n请提供详细的竞品对比分析。',
      description: '专业的竞品分析工具',
      tags: ['竞品分析', '市场', '产品'],
    },
    {
      title: '用户体验优化建议器',
      content: '为产品功能 "{feature_name}" 提供UX优化建议：\n\n当前用户痛点：{pain_points}\n使用场景：{use_cases}\n用户反馈：{user_feedback}\n业务目标：{business_goals}\n\n请提供具体的改进方案。',
      description: '用户体验优化专业建议',
      tags: ['UX', '用户体验', '优化'],
    },
    {
      title: '测试用例生成器',
      content: '为功能 "{feature_name}" 生成测试用例：\n\n功能描述：{feature_description}\n输入参数：{input_parameters}\n预期行为：{expected_behavior}\n边界条件：{boundary_conditions}\n\n请包含正常、异常和边界测试场景。',
      description: '自动生成全面的测试用例',
      tags: ['测试', '质量保证', 'QA'],
    },
    {
      title: '技术文档生成器',
      content: '为 {technology} 创建技术文档：\n\n文档类型：{doc_type}\n目标读者：{target_readers}\n技术特性：{technical_features}\n使用场景：{use_cases}\n\n请包含安装、配置、使用说明和示例。',
      description: '生成标准化的技术文档',
      tags: ['文档', '技术', '说明'],
    },
    {
      title: '性能分析报告器',
      content: '分析系统性能数据并生成报告：\n\n系统类型：{system_type}\n监控指标：{metrics}\n时间范围：{time_range}\n性能数据：{performance_data}\n\n请提供性能瓶颈分析和优化建议。',
      description: '系统性能分析和优化工具',
      tags: ['性能', '监控', '优化'],
    },
    {
      title: '品牌故事创作器',
      content: '为品牌 "{brand_name}" 创作品牌故事：\n\n品牌价值观：{brand_values}\n创始背景：{founding_story}\n目标客户：{target_customers}\n独特卖点：{unique_selling_points}\n\n请创作引人入胜的品牌叙事。',
      description: '专业的品牌故事创作工具',
      tags: ['品牌', '故事', '营销'],
    },
    {
      title: '客户服务回复模板生成器',
      content: '为客服场景 "{service_scenario}" 生成回复模板：\n\n问题类型：{issue_type}\n客户情绪：{customer_emotion}\n解决方案：{solution}\n服务态度：{service_tone}\n\n请提供专业且温暖的客服回复。',
      description: '客户服务标准回复模板',
      tags: ['客服', '模板', '沟通'],
    },
    {
      title: '移动应用功能规划器',
      content: '为移动应用 "{app_name}" 规划功能模块：\n\n应用类型：{app_type}\n目标用户：{target_users}\n核心需求：{core_needs}\n平台要求：{platform_requirements}\n\n请提供功能优先级和开发建议。',
      description: '移动应用功能规划工具',
      tags: ['移动应用', '功能', '规划'],
    },
    {
      title: '投资建议分析器',
      content: '分析投资机会 "{investment_opportunity}"：\n\n投资类型：{investment_type}\n风险偏好：{risk_preference}\n投资期限：{investment_horizon}\n市场状况：{market_conditions}\n\n请提供投资分析和建议。',
      description: '投资机会分析和建议工具',
      tags: ['投资', '分析', '金融'],
    },
    {
      title: '教学课程大纲设计器',
      content: '设计课程 "{course_title}" 的教学大纲：\n\n课程对象：{target_students}\n课程时长：{course_duration}\n学习目标：{learning_objectives}\n先修要求：{prerequisites}\n\n请提供详细的课程安排和教学计划。',
      description: '专业的教学课程设计工具',
      tags: ['教育', '课程', '教学'],
    },
    {
      title: '供应链优化建议器',
      content: '优化供应链环节 "{supply_chain_segment}"：\n\n当前问题：{current_issues}\n业务规模：{business_scale}\n成本结构：{cost_structure}\n质量要求：{quality_requirements}\n\n请提供优化策略和实施建议。',
      description: '供应链管理优化工具',
      tags: ['供应链', '优化', '管理'],
    },
    {
      title: '创业计划书生成器',
      content: '为创业项目 "{startup_idea}" 生成商业计划书章节：\n\n行业背景：{industry_background}\n市场规模：{market_size}\n商业模式：{business_model}\n团队背景：{team_background}\n\n请生成专业的商业计划内容。',
      description: '创业商业计划书写作助手',
      tags: ['创业', '商业计划', '融资'],
    },
  ];

  return additionalPrompts;
}

// 更多分类数据
const TEST_CATEGORIES = [
  { name: '编程开发', description: '编程、开发相关的提示词', color: '#3B82F6' },
  { name: '营销文案', description: '营销、文案创作类提示词', color: '#EF4444' },
  { name: '数据分析', description: '数据分析、报告生成类', color: '#10B981' },
  { name: '产品设计', description: '产品设计、用户体验类', color: '#8B5CF6' },
  { name: '项目管理', description: '项目管理、团队协作类', color: '#F59E0B' },
  { name: '学习教育', description: '教育、培训、学习类', color: '#06B6D4' },
  { name: '创意写作', description: '创意写作、内容创作类', color: '#EC4899' },
  { name: '商业分析', description: '商业策略、分析类', color: '#84CC16' },
];

/**
 * 加密密码
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * 随机选择数组中的元素
 */
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 随机选择多个元素
 */
function randomChoices<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * 插入测试用户
 */
async function insertTestUsers(): Promise<User[]> {
  console.log('🔄 插入测试用户...');
  
  const users: User[] = [];
  
  for (const userData of TEST_USERS) {
    try {
      // 检查用户是否已存在
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        console.log(`   ⚠️  用户 ${userData.username} 已存在，跳过`);
        users.push(existingUser);
        continue;
      }
      
      // 创建新用户
      const hashedPassword = await hashPassword(userData.password);
      const user = await User.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
      });
      
      users.push(user);
      console.log(`   ✅ 创建用户: ${userData.username} (${userData.email})`);
    } catch (error) {
      console.error(`   ❌ 创建用户 ${userData.username} 失败:`, error);
    }
  }
  
  return users;
}

/**
 * 插入测试分类
 */
async function insertTestCategories(users: User[]): Promise<Category[]> {
  console.log('🔄 插入测试分类...');
  
  const categories: Category[] = [];
  
  for (const categoryData of TEST_CATEGORIES) {
    try {
      // 检查分类是否已存在
      const existingCategory = await Category.findOne({
        where: { 
          name: categoryData.name,
          scopeType: CategoryScopeType.PUBLIC
        }
      });
      
      if (existingCategory) {
        console.log(`   ⚠️  分类 ${categoryData.name} 已存在，跳过`);
        categories.push(existingCategory);
        continue;
      }
      
      // 随机选择一个用户作为创建者
      const creator = randomChoice(users);
      
      const category = await Category.create({
        name: categoryData.name,
        description: categoryData.description,
        scopeType: CategoryScopeType.PUBLIC,
        createdBy: creator.id,
        color: categoryData.color,
        isActive: true,
      });
      
      categories.push(category);
      console.log(`   ✅ 创建分类: ${categoryData.name}`);
    } catch (error) {
      console.error(`   ❌ 创建分类 ${categoryData.name} 失败:`, error);
    }
  }
  
  return categories;
}

/**
 * 插入测试提示词
 */
async function insertTestPrompts(users: User[], categories: Category[]): Promise<void> {
  console.log('🔄 插入测试提示词...');
  
  // 合并所有提示词模板
  const allPromptTemplates = [
    ...PROMPT_TEMPLATES,
    ...generateMorePrompts()
  ];
  
  // 生成40个提示词
  const promptsToCreate = 40;
  let createdCount = 0;
  
  for (let i = 0; i < promptsToCreate; i++) {
    try {
      // 随机选择模板和变体
      const template = randomChoice(allPromptTemplates);
      const user = randomChoice(users);
      const category = randomChoice(categories);
      
      // 添加一些变体使提示词更多样化
      const variations = [
        '', ' - 专业版', ' - 简化版', ' - 进阶版', ' - 快速版'
      ];
      const titleVariation = Math.random() > 0.7 ? randomChoice(variations) : '';
      
      // 决定是否公开（80%概率公开）
      const isPublic = Math.random() < 0.8;
      
      const promptData: TestPrompt = {
        title: template.title + titleVariation,
        content: template.content,
        description: template.description,
        tags: template.tags,
        isPublic
      };
      
      // 检查是否已存在相同标题的提示词 (只选择必要的字段)
      const existingPrompt = await Prompt.findOne({
        where: { 
          title: promptData.title,
          userId: user.id 
        },
        attributes: ['id', 'title', 'userId'] // 只选择必要字段
      });
      
      if (existingPrompt) {
        console.log(`   ⚠️  提示词 "${promptData.title}" 已存在，跳过`);
        continue;
      }
      
      // 创建提示词
      const prompt = await Prompt.create({
        title: promptData.title,
        content: promptData.content,
        description: promptData.description,
        tags: promptData.tags,
        userId: user.id,
        categoryId: category.id,
        isPublic: promptData.isPublic,
        version: 1,
      });
      
      createdCount++;
      console.log(`   ✅ 创建提示词 ${createdCount}: "${promptData.title}" (作者: ${user.username}, 分类: ${category.name})`);
      
    } catch (error) {
      console.error(`   ❌ 创建第 ${i + 1} 个提示词失败:`, error);
    }
  }
  
  console.log(`📊 总共成功创建 ${createdCount} 个提示词`);
}

/**
 * 主执行函数
 */
async function main() {
  try {
    console.log('🚀 开始插入测试数据...\n');
    
    // 确保数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');
    
    // 1. 插入测试用户
    const users = await insertTestUsers();
    console.log(`📊 成功处理 ${users.length} 个用户\n`);
    
    if (users.length === 0) {
      throw new Error('没有可用的用户，无法继续');
    }
    
    // 2. 插入测试分类
    const categories = await insertTestCategories(users);
    console.log(`📊 成功处理 ${categories.length} 个分类\n`);
    
    if (categories.length === 0) {
      throw new Error('没有可用的分类，无法继续');
    }
    
    // 3. 插入测试提示词
    await insertTestPrompts(users, categories);
    
    console.log('\n🎉 测试数据插入完成！');
    console.log('\n📋 数据概览:');
    console.log(`   👥 用户数量: ${users.length}`);
    console.log(`   📁 分类数量: ${categories.length}`);
    console.log(`   📝 目标提示词数量: 40`);
    
    console.log('\n🔗 你可以通过以下方式登录测试:');
    users.forEach(user => {
      console.log(`   📧 ${user.email} (密码: password123)`);
    });
    
  } catch (error) {
    console.error('❌ 插入测试数据失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

export default main;