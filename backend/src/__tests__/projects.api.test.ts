import request from 'supertest';
import { app } from '../app';
import { sequelize } from '../config/database';
import { User, Team, TeamMember, TeamRole, Project } from '../models';
import jwt from 'jsonwebtoken';

describe('Projects API', () => {
  let testUser1: User;
  let testUser2: User;
  let testTeam: Team;
  let authToken1: string;
  let authToken2: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // 清理数据
    await Project.destroy({ where: {} });
    await TeamMember.destroy({ where: {} });
    await Team.destroy({ where: {} });
    await User.destroy({ where: {} });

    // 创建测试用户
    testUser1 = await User.create({
      username: 'user1',
      email: 'user1@example.com',
      password: 'hashedpassword',
    });

    testUser2 = await User.create({
      username: 'user2',
      email: 'user2@example.com',
      password: 'hashedpassword',
    });

    // 创建测试团队
    testTeam = await Team.create({
      name: 'Test Team',
      description: 'Test team for API testing',
      ownerId: testUser1.id,
    });

    // 添加团队成员
    await TeamMember.create({
      teamId: testTeam.id,
      userId: testUser1.id,
      role: TeamRole.OWNER,
    });

    await TeamMember.create({
      teamId: testTeam.id,
      userId: testUser2.id,
      role: TeamRole.EDITOR,
    });

    // 生成 JWT token
    authToken1 = jwt.sign(
      { userId: testUser1.id, username: testUser1.username },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    authToken2 = jwt.sign(
      { userId: testUser2.id, username: testUser2.username },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/projects', () => {
    it('should create a personal project successfully', async () => {
      const projectData = {
        name: '电商网站开发',
        description: '构建现代化电商平台',
        background: '你是一个专业的电商网站开发专家，具有丰富的全栈开发经验。',
        isPublic: false,
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('电商网站开发');
      expect(response.body.data.description).toBe('构建现代化电商平台');
      expect(response.body.data.background).toBe('你是一个专业的电商网站开发专家，具有丰富的全栈开发经验。');
      expect(response.body.data.userId).toBe(testUser1.id);
      expect(response.body.data.teamId).toBeNull();
      expect(response.body.data.isPublic).toBe(false);
    });

    it('should create a team project successfully', async () => {
      const projectData = {
        name: 'AI助手开发',
        description: '团队协作开发AI助手',
        background: '我们是一个专业的AI开发团队，专注于构建智能助手系统。',
        teamId: testTeam.id,
        isPublic: true,
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(projectData)
        .expect(201);

      expect(response.body.data.name).toBe('AI助手开发');
      expect(response.body.data.teamId).toBe(testTeam.id);
      expect(response.body.data.isPublic).toBe(true);
    });

    it('should fail to create project without authentication', async () => {
      const projectData = {
        name: '未认证项目',
        background: '测试背景',
        isPublic: false,
      };

      await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(401);
    });

    it('should fail to create project without required fields', async () => {
      const projectData = {
        description: '缺少必填字段',
        isPublic: false,
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(projectData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to create team project without team membership', async () => {
      // 创建一个用户不属于的团队
      const otherTeam = await Team.create({
        name: 'Other Team',
        description: 'Team user1 is not a member of',
        ownerId: testUser2.id,
      });

      const projectData = {
        name: '无权限团队项目',
        background: '测试背景',
        teamId: otherTeam.id,
        isPublic: false,
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(projectData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // 创建测试项目
      await Project.create({
        name: '用户1私有项目',
        background: '背景1',
        userId: testUser1.id,
        isPublic: false,
      });

      await Project.create({
        name: '用户1公开项目',
        background: '背景2',
        userId: testUser1.id,
        isPublic: true,
      });

      await Project.create({
        name: '用户2私有项目',
        background: '背景3',
        userId: testUser2.id,
        isPublic: false,
      });

      await Project.create({
        name: '团队项目',
        background: '背景4',
        userId: testUser1.id,
        teamId: testTeam.id,
        isPublic: false,
      });
    });

    it('should get user projects (personal + team)', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // 2个个人项目 + 1个团队项目
      
      const projectNames = response.body.data.map((p: any) => p.name);
      expect(projectNames).toContain('用户1私有项目');
      expect(projectNames).toContain('用户1公开项目');
      expect(projectNames).toContain('团队项目');
    });

    it('should get public projects when accessing public endpoint', async () => {
      const response = await request(app)
        .get('/api/projects/public')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('用户1公开项目');
    });

    it('should filter projects by team', async () => {
      const response = await request(app)
        .get(`/api/projects?teamId=${testTeam.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('团队项目');
    });

    it('should search projects by name', async () => {
      const response = await request(app)
        .get('/api/projects?search=公开')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('用户1公开项目');
    });
  });

  describe('GET /api/projects/:id', () => {
    let testProject: Project;

    beforeEach(async () => {
      testProject = await Project.create({
        name: '测试项目详情',
        description: '详情测试',
        background: '详情背景',
        userId: testUser1.id,
        isPublic: false,
      });
    });

    it('should get project details for owner', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('测试项目详情');
      expect(response.body.data.background).toBe('详情背景');
    });

    it('should fail to get private project details for non-owner', async () => {
      await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403);
    });

    it('should get public project details for any user', async () => {
      await testProject.update({ isPublic: true });

      const response = await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('测试项目详情');
    });

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .get('/api/projects/99999')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);
    });
  });

  describe('PUT /api/projects/:id', () => {
    let testProject: Project;

    beforeEach(async () => {
      testProject = await Project.create({
        name: '可编辑项目',
        description: '原始描述',
        background: '原始背景',
        userId: testUser1.id,
        isPublic: false,
      });
    });

    it('should update project successfully by owner', async () => {
      const updateData = {
        name: '更新后的项目',
        description: '更新后的描述',
        background: '更新后的背景',
        isPublic: true,
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('更新后的项目');
      expect(response.body.data.description).toBe('更新后的描述');
      expect(response.body.data.background).toBe('更新后的背景');
      expect(response.body.data.isPublic).toBe(true);
    });

    it('should fail to update project by non-owner', async () => {
      const updateData = {
        name: '未授权更新',
        background: '未授权背景',
      };

      await request(app)
        .put(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(updateData)
        .expect(403);
    });

    it('should fail to update non-existent project', async () => {
      const updateData = {
        name: '不存在的项目',
        background: '背景',
      };

      await request(app)
        .put('/api/projects/99999')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let testProject: Project;

    beforeEach(async () => {
      testProject = await Project.create({
        name: '可删除项目',
        background: '删除测试背景',
        userId: testUser1.id,
        isPublic: false,
      });
    });

    it('should soft delete project successfully by owner', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // 验证项目被软删除（isActive = false）
      await testProject.reload();
      expect(testProject.isActive).toBe(false);
    });

    it('should fail to delete project by non-owner', async () => {
      await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403);
    });

    it('should fail to delete non-existent project', async () => {
      await request(app)
        .delete('/api/projects/99999')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);
    });
  });

  describe('Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      // 测试各个端点都需要认证
      await request(app).get('/api/projects').expect(401);
      await request(app).post('/api/projects').expect(401);
      await request(app).get('/api/projects/1').expect(401);
      await request(app).put('/api/projects/1').expect(401);
      await request(app).delete('/api/projects/1').expect(401);
    });
  });
});