import { sequelize } from '../config/database';
import { Project, Prompt, User, Team, TeamMember, TeamRole } from '../models';

describe('Project-Prompt Integration', () => {
  let testUser: User;
  let testProject: Project;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // 清理数据
    await Prompt.destroy({ where: {} });
    await Project.destroy({ where: {} });
    await User.destroy({ where: {} });

    // 创建测试用户
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
    });

    // 创建测试项目
    testProject = await Project.create({
      name: '电商网站开发',
      description: '构建现代化电商平台',
      background: '你是一个专业的电商网站开发专家，具有丰富的全栈开发经验。',
      userId: testUser.id,
      isPublic: false,
    });
  });

  describe('Project Prompt Creation', () => {
    it('should create project prompt with correct associations', async () => {
      const promptData = {
        title: '首页设计',
        content: '设计一个现代化的电商首页',
        description: '电商网站首页设计提示词',
        projectId: testProject.id,
        promptNumber: 'P1-001',
        isProjectPrompt: true,
        showInCategory: false,
        userId: testUser.id,
        isPublic: false,
      };

      const prompt = await Prompt.create(promptData);

      expect(prompt.projectId).toBe(testProject.id);
      expect(prompt.promptNumber).toBe('P1-001');
      expect(prompt.isProjectPrompt).toBe(true);
      expect(prompt.showInCategory).toBe(false);
    });

    it('should generate project prompt with number sequence', async () => {
      // 创建第一个项目提示词
      const prompt1 = await Prompt.create({
        title: '首页设计',
        content: '设计一个现代化的电商首页',
        projectId: testProject.id,
        promptNumber: 'P1-001',
        isProjectPrompt: true,
        userId: testUser.id,
        isPublic: false,
      });

      // 创建第二个项目提示词
      const prompt2 = await Prompt.create({
        title: '产品页设计',
        content: '设计产品详情页面',
        projectId: testProject.id,
        promptNumber: 'P1-002',
        isProjectPrompt: true,
        userId: testUser.id,
        isPublic: false,
      });

      expect(prompt1.promptNumber).toBe('P1-001');
      expect(prompt2.promptNumber).toBe('P1-002');
    });

    it('should allow project prompt to also have category', async () => {
      const prompt = await Prompt.create({
        title: '首页设计',
        content: '设计一个现代化的电商首页',
        category: 'web-development',
        projectId: testProject.id,
        promptNumber: 'P1-001',
        isProjectPrompt: true,
        showInCategory: true, // 可以同时在分类中显示
        userId: testUser.id,
        isPublic: false,
      });

      expect(prompt.category).toBe('web-development');
      expect(prompt.projectId).toBe(testProject.id);
      expect(prompt.showInCategory).toBe(true);
    });
  });

  describe('Project-Prompt Queries', () => {
    beforeEach(async () => {
      // 创建项目提示词
      await Prompt.create({
        title: '项目提示词1',
        content: '项目提示词内容1',
        projectId: testProject.id,
        promptNumber: 'P1-001',
        isProjectPrompt: true,
        showInCategory: false,
        userId: testUser.id,
        isPublic: false,
      });

      await Prompt.create({
        title: '项目提示词2',
        content: '项目提示词内容2',
        projectId: testProject.id,
        promptNumber: 'P1-002',
        isProjectPrompt: true,
        showInCategory: true, // 这个在分类中显示
        userId: testUser.id,
        isPublic: false,
      });

      // 创建普通提示词
      await Prompt.create({
        title: '普通提示词',
        content: '普通提示词内容',
        category: 'general',
        isProjectPrompt: false,
        userId: testUser.id,
        isPublic: false,
      });
    });

    it('should find project prompts by projectId', async () => {
      const projectPrompts = await Prompt.findAll({
        where: { 
          projectId: testProject.id,
          isProjectPrompt: true 
        },
        order: [['promptNumber', 'ASC']]
      });

      expect(projectPrompts).toHaveLength(2);
      expect(projectPrompts[0].promptNumber).toBe('P1-001');
      expect(projectPrompts[1].promptNumber).toBe('P1-002');
    });

    it('should filter prompts by showInCategory flag', async () => {
      // 只显示在分类中的提示词
      const categoryPrompts = await Prompt.findAll({
        where: { 
          showInCategory: true 
        }
      });

      expect(categoryPrompts).toHaveLength(2); // 一个项目提示词 + 一个普通提示词

      // 不显示在分类中的提示词
      const hiddenPrompts = await Prompt.findAll({
        where: { 
          showInCategory: false 
        }
      });

      expect(hiddenPrompts).toHaveLength(1);
      expect(hiddenPrompts[0].promptNumber).toBe('P1-001');
    });

    it('should include project information when querying prompts', async () => {
      const promptsWithProject = await Prompt.findAll({
        where: { 
          projectId: testProject.id 
        },
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name', 'background']
          }
        ]
      });

      expect(promptsWithProject).toHaveLength(2);
      expect((promptsWithProject[0] as any).project).toBeDefined();
      expect((promptsWithProject[0] as any).project.name).toBe('电商网站开发');
      expect((promptsWithProject[0] as any).project.background).toBe('你是一个专业的电商网站开发专家，具有丰富的全栈开发经验。');
    });
  });

  describe('Project Statistics', () => {
    beforeEach(async () => {
      // 创建多个项目提示词
      for (let i = 1; i <= 5; i++) {
        await Prompt.create({
          title: `项目提示词${i}`,
          content: `项目提示词内容${i}`,
          projectId: testProject.id,
          promptNumber: `P1-${i.toString().padStart(3, '0')}`,
          isProjectPrompt: true,
          userId: testUser.id,
          isPublic: false,
        });
      }
    });

    it('should count prompts in project', async () => {
      const promptCount = await Prompt.count({
        where: { 
          projectId: testProject.id,
          isProjectPrompt: true 
        }
      });

      expect(promptCount).toBe(5);
    });

    it('should include prompt count when querying project', async () => {
      const projectWithPrompts = await Project.findOne({
        where: { id: testProject.id },
        include: [
          {
            model: Prompt,
            as: 'prompts',
            attributes: ['id', 'title', 'promptNumber']
          }
        ]
      });

      expect(projectWithPrompts).toBeDefined();
      expect((projectWithPrompts as any)!.prompts).toHaveLength(5);
      expect((projectWithPrompts as any)!.prompts[0].promptNumber).toMatch(/^P1-\d{3}$/);
    });
  });

  describe('Project Background Integration', () => {
    it('should generate combined prompt content with project background', async () => {
      const prompt = await Prompt.create({
        title: '产品页设计',
        content: '设计一个产品详情页面，包含图片展示、价格信息和购买按钮。',
        projectId: testProject.id,
        promptNumber: 'P1-001',
        isProjectPrompt: true,
        userId: testUser.id,
        isPublic: false,
      });

      // 模拟生成组合内容（这个逻辑应该在服务层）
      const project = await Project.findByPk(testProject.id);
      const combinedContent = `${project!.background}\n\n---\n\n${prompt.content}`;

      expect(combinedContent).toContain('你是一个专业的电商网站开发专家');
      expect(combinedContent).toContain('设计一个产品详情页面');
      expect(combinedContent).toContain('---'); // 分隔符
    });
  });

  describe('Project and Category Coexistence', () => {
    it('should support prompts that belong to both project and category', async () => {
      const prompt = await Prompt.create({
        title: '响应式设计',
        content: '创建响应式的电商页面布局',
        category: 'web-development',
        projectId: testProject.id,
        promptNumber: 'P1-001',
        isProjectPrompt: true,
        showInCategory: true, // 同时在分类中显示
        userId: testUser.id,
        isPublic: false,
      });

      // 可以通过分类查询到
      const categoryPrompts = await Prompt.findAll({
        where: { 
          category: 'web-development',
          showInCategory: true 
        }
      });

      // 也可以通过项目查询到
      const projectPrompts = await Prompt.findAll({
        where: { 
          projectId: testProject.id,
          isProjectPrompt: true 
        }
      });

      expect(categoryPrompts).toHaveLength(1);
      expect(projectPrompts).toHaveLength(1);
      expect(categoryPrompts[0].id).toBe(prompt.id);
      expect(projectPrompts[0].id).toBe(prompt.id);
    });
  });
});