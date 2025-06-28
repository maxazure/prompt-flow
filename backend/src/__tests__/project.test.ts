import { sequelize } from '../config/database';
import { Project } from '../models/Project';
import { User, Team } from '../models';

describe('Project Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Project.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Team.destroy({ where: {} });
  });

  describe('Project Creation', () => {
    let testUser: User;
    let testTeam: Team;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      testTeam = await Team.create({
        name: 'Test Team',
        description: 'A test team',
        ownerId: testUser.id,
      });
    });

    it('should create a personal project successfully', async () => {
      const projectData = {
        name: '电商网站开发',
        description: '构建现代化电商平台',
        background: '你是一个专业的电商网站开发专家，具有丰富的全栈开发经验。',
        userId: testUser.id,
        isPublic: false,
      };

      const project = await Project.create(projectData);

      expect(project.id).toBeDefined();
      expect(project.name).toBe('电商网站开发');
      expect(project.description).toBe('构建现代化电商平台');
      expect(project.background).toBe('你是一个专业的电商网站开发专家，具有丰富的全栈开发经验。');
      expect(project.userId).toBe(testUser.id);
      expect(project.teamId).toBeUndefined();
      expect(project.isPublic).toBe(false);
      expect(project.isActive).toBe(true);
    });

    it('should create a team project successfully', async () => {
      const projectData = {
        name: 'AI助手开发',
        description: '团队协作开发AI助手',
        background: '我们是一个专业的AI开发团队，专注于构建智能助手系统。',
        userId: testUser.id,
        teamId: testTeam.id,
        isPublic: true,
      };

      const project = await Project.create(projectData);

      expect(project.name).toBe('AI助手开发');
      expect(project.teamId).toBe(testTeam.id);
      expect(project.isPublic).toBe(true);
    });

    it('should require name field', async () => {
      const projectData = {
        description: '缺少名称的项目',
        background: '测试背景',
        userId: testUser.id,
        isPublic: false,
      };

      await expect(Project.create(projectData as any)).rejects.toThrow();
    });

    it('should require background field', async () => {
      const projectData = {
        name: '缺少背景的项目',
        description: '测试描述',
        userId: testUser.id,
        isPublic: false,
      };

      await expect(Project.create(projectData as any)).rejects.toThrow();
    });

    it('should require userId field', async () => {
      const projectData = {
        name: '缺少用户的项目',
        description: '测试描述',
        background: '测试背景',
        isPublic: false,
      };

      await expect(Project.create(projectData as any)).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const projectData = {
        name: '默认值测试项目',
        background: '测试背景',
        userId: testUser.id,
      };

      const project = await Project.create(projectData);

      expect(project.isPublic).toBe(false); // 默认私有
      expect(project.isActive).toBe(true); // 默认激活
      expect(project.description).toBeUndefined(); // 可选字段默认为undefined
      expect(project.teamId).toBeUndefined(); // 可选字段默认为undefined
    });
  });

  describe('Project Validation', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      });
    });

    it('should limit name length to 200 characters', async () => {
      const longName = 'a'.repeat(201);
      const projectData = {
        name: longName,
        background: '测试背景',
        userId: testUser.id,
        isPublic: false,
      };

      await expect(Project.create(projectData)).rejects.toThrow();
    });

    it('should accept name with exactly 200 characters', async () => {
      const exactLengthName = 'a'.repeat(200);
      const projectData = {
        name: exactLengthName,
        background: '测试背景',
        userId: testUser.id,
        isPublic: false,
      };

      const project = await Project.create(projectData);
      expect(project.name).toBe(exactLengthName);
    });

    it('should accept long background text', async () => {
      const longBackground = '你是一个专业的开发专家。'.repeat(100);
      const projectData = {
        name: '长背景项目',
        background: longBackground,
        userId: testUser.id,
        isPublic: false,
      };

      const project = await Project.create(projectData);
      expect(project.background).toBe(longBackground);
    });
  });

  describe('Project Queries', () => {
    let testUser: User;
    let testTeam: Team;
    let otherUser: User;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'hashedpassword',
      });

      testTeam = await Team.create({
        name: 'Test Team',
        description: 'A test team',
        ownerId: testUser.id,
      });
    });

    it('should find projects by userId', async () => {
      await Project.create({
        name: '用户项目1',
        background: '背景1',
        userId: testUser.id,
        isPublic: false,
      });

      await Project.create({
        name: '用户项目2',
        background: '背景2',
        userId: testUser.id,
        isPublic: true,
      });

      await Project.create({
        name: '其他用户项目',
        background: '背景3',
        userId: otherUser.id,
        isPublic: false,
      });

      const userProjects = await Project.findAll({
        where: { userId: testUser.id }
      });

      expect(userProjects).toHaveLength(2);
      expect(userProjects.map(p => p.name)).toContain('用户项目1');
      expect(userProjects.map(p => p.name)).toContain('用户项目2');
    });

    it('should find public projects', async () => {
      await Project.create({
        name: '私有项目',
        background: '背景1',
        userId: testUser.id,
        isPublic: false,
      });

      await Project.create({
        name: '公开项目',
        background: '背景2',
        userId: testUser.id,
        isPublic: true,
      });

      const publicProjects = await Project.findAll({
        where: { isPublic: true }
      });

      expect(publicProjects).toHaveLength(1);
      expect(publicProjects[0].name).toBe('公开项目');
    });

    it('should find team projects', async () => {
      await Project.create({
        name: '个人项目',
        background: '背景1',
        userId: testUser.id,
        isPublic: false,
      });

      await Project.create({
        name: '团队项目',
        background: '背景2',
        userId: testUser.id,
        teamId: testTeam.id,
        isPublic: false,
      });

      const teamProjects = await Project.findAll({
        where: { teamId: testTeam.id }
      });

      expect(teamProjects).toHaveLength(1);
      expect(teamProjects[0].name).toBe('团队项目');
    });

    it('should only find active projects by default', async () => {
      const activeProject = await Project.create({
        name: '激活项目',
        background: '背景1',
        userId: testUser.id,
        isPublic: false,
      });

      // 手动设置为非激活状态
      await activeProject.update({ isActive: false });

      await Project.create({
        name: '另一个激活项目',
        background: '背景2',
        userId: testUser.id,
        isPublic: false,
      });

      const activeProjects = await Project.findAll({
        where: { isActive: true }
      });

      expect(activeProjects).toHaveLength(1);
      expect(activeProjects[0].name).toBe('另一个激活项目');
    });
  });

  describe('Project Updates', () => {
    let testUser: User;
    let project: Project;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      project = await Project.create({
        name: '测试项目',
        description: '原始描述',
        background: '原始背景',
        userId: testUser.id,
        isPublic: false,
      });
    });

    it('should update project successfully', async () => {
      await project.update({
        name: '更新后的项目',
        description: '更新后的描述',
        background: '更新后的背景',
        isPublic: true,
      });

      await project.reload();

      expect(project.name).toBe('更新后的项目');
      expect(project.description).toBe('更新后的描述');
      expect(project.background).toBe('更新后的背景');
      expect(project.isPublic).toBe(true);
    });

    it('should soft delete project by setting isActive to false', async () => {
      await project.update({ isActive: false });
      await project.reload();

      expect(project.isActive).toBe(false);
    });
  });
});