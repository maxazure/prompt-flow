import request from 'supertest';
import { app } from '../app';
import { sequelize } from '../config/database';
import { User, Team, TeamMember, TeamRole, Category, CategoryScopeType } from '../models';
import jwt from 'jsonwebtoken';

describe('Categories API', () => {
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
    await Category.destroy({ where: {} });
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

    // 生成认证token
    authToken1 = jwt.sign(
      { userId: testUser1.id, email: testUser1.email },
      process.env.JWT_SECRET || 'development_secret',
      { expiresIn: '7d' }
    );

    authToken2 = jwt.sign(
      { userId: testUser2.id, email: testUser2.email },
      process.env.JWT_SECRET || 'development_secret',
      { expiresIn: '7d' }
    );
  });

  describe('POST /api/categories', () => {
    it('should create a personal category successfully', async () => {
      const categoryData = {
        name: '网站建设',
        description: '个人网站开发相关',
        scopeType: CategoryScopeType.PERSONAL,
        color: '#FF5733',
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Category created successfully');
      expect(response.body.category.name).toBe('网站建设');
      expect(response.body.category.scopeType).toBe(CategoryScopeType.PERSONAL);
      expect(response.body.category.scopeId).toBe(testUser1.id);
    });

    it('should create a team category successfully', async () => {
      const categoryData = {
        name: '策划',
        description: '团队策划相关',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.category.name).toBe('策划');
      expect(response.body.category.scopeType).toBe(CategoryScopeType.TEAM);
      expect(response.body.category.scopeId).toBe(testTeam.id);
    });


    it('should fail when not authenticated', async () => {
      const categoryData = {
        name: '测试',
        scopeType: CategoryScopeType.PERSONAL,
      };

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData);

      expect(response.status).toBe(401);
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        // name is missing
        scopeType: CategoryScopeType.PERSONAL,
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should prevent duplicate personal category names', async () => {
      // 创建第一个分类
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          name: '论文',
          scopeType: CategoryScopeType.PERSONAL,
        });

      // 尝试创建重复的分类
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          name: '论文',
          scopeType: CategoryScopeType.PERSONAL,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });

    it('should validate team permissions for team categories', async () => {
      const outsideUser = await User.create({
        username: 'outsider',
        email: 'outsider@example.com',
        password: 'hashedpassword',
      });

      const outsideToken = jwt.sign(
        { userId: outsideUser.id, email: outsideUser.email },
        process.env.JWT_SECRET || 'development_secret',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${outsideToken}`)
        .send({
          name: '测试',
          scopeType: CategoryScopeType.TEAM,
          scopeId: testTeam.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('permission');
    });
  });

  describe('GET /api/categories', () => {
    beforeEach(async () => {
      // 创建测试分类
      await Category.create({
        name: '网站建设',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: testUser1.id,
        createdBy: testUser1.id,
      });

      await Category.create({
        name: '美食',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: testUser2.id,
        createdBy: testUser2.id,
      });

      await Category.create({
        name: '策划',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
        createdBy: testUser1.id,
      });

    });

    it('should return user visible categories grouped by scope', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.categories).toBeDefined();
      expect(response.body.categories.personal).toHaveLength(2); // 未分类 + 网站建设
      expect(response.body.categories.team).toHaveLength(1); // 策划
      expect(response.body.categories).not.toHaveProperty('public');
      expect(response.body.total).toBe(3);
    });

    it('should not return other user personal categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken1}`);

      const allCategoryNames = [
        ...response.body.categories.personal,
        ...response.body.categories.team,
      ].map((c: any) => c.name);

      expect(allCategoryNames).toContain('网站建设');
      expect(allCategoryNames).not.toContain('美食'); // user2's personal category
    });

    it('should return empty categories when not authenticated', async () => {
      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body.categories.personal).toEqual([]);
      expect(response.body.categories.team).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe('GET /api/categories/my', () => {
    beforeEach(async () => {
      await Category.create({
        name: '我的个人',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: testUser1.id,
        createdBy: testUser1.id,
      });

      await Category.create({
        name: '我创建的团队',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
        createdBy: testUser1.id,
      });

      await Category.create({
        name: '他人的团队',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
        createdBy: testUser2.id,
      });
    });

    it('should return all user visible categories', async () => {
      const response = await request(app)
        .get('/api/categories/my')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.categories).toHaveLength(4); // 未分类 + 我的个人 + 两个团队分类
      
      const categoryNames = response.body.categories.map((c: any) => c.name);
      expect(categoryNames).toContain('未分类'); // 自动创建的未分类
      expect(categoryNames).toContain('我的个人');
      expect(categoryNames).toContain('我创建的团队');
      expect(categoryNames).toContain('他人的团队'); // 现在包含所有团队分类
    });
  });

  describe('GET /api/categories/team/:teamId', () => {
    beforeEach(async () => {
      await Category.create({
        name: '团队策划',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
        createdBy: testUser1.id,
      });

      await Category.create({
        name: '团队开发',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
        createdBy: testUser2.id,
      });

      // 创建另一个团队的分类
      const otherTeam = await Team.create({
        name: 'Other Team',
        description: 'Other team',
        ownerId: testUser2.id,
      });

      await Category.create({
        name: '其他团队',
        scopeType: CategoryScopeType.TEAM,
        scopeId: otherTeam.id,
        createdBy: testUser2.id,
      });
    });

    it('should return categories for specific team', async () => {
      const response = await request(app)
        .get(`/api/categories/team/${testTeam.id}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.categories).toHaveLength(2);
      
      const categoryNames = response.body.categories.map((c: any) => c.name);
      expect(categoryNames).toContain('团队策划');
      expect(categoryNames).toContain('团队开发');
      expect(categoryNames).not.toContain('其他团队');
    });

    it('should handle invalid team ID', async () => {
      const response = await request(app)
        .get('/api/categories/team/invalid')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/categories/:id', () => {
    let personalCategory: Category;
    let teamCategory: Category;

    beforeEach(async () => {
      personalCategory = await Category.create({
        name: '原始名称',
        description: '原始描述',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: testUser1.id,
        createdBy: testUser1.id,
      });

      teamCategory = await Category.create({
        name: '团队分类',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
        createdBy: testUser1.id,
      });
    });

    it('should update personal category by owner', async () => {
      const updateData = {
        name: '更新名称',
        description: '更新描述',
        color: '#00FF00',
      };

      const response = await request(app)
        .put(`/api/categories/${personalCategory.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.category.name).toBe('更新名称');
      expect(response.body.category.description).toBe('更新描述');
      expect(response.body.category.color).toBe('#00FF00');
    });

    it('should prevent non-owner from updating personal category', async () => {
      const response = await request(app)
        .put(`/api/categories/${personalCategory.id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ name: '黑客更新' });

      expect(response.status).toBe(403);
    });

    it('should allow team editor to update team category', async () => {
      const response = await request(app)
        .put(`/api/categories/${teamCategory.id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ name: '团队更新' });

      expect(response.status).toBe(200);
      expect(response.body.category.name).toBe('团队更新');
    });

    it('should handle non-existent category', async () => {
      const response = await request(app)
        .put('/api/categories/99999')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ name: '测试' });

      expect(response.status).toBe(404);
    });

    it('should handle invalid category ID', async () => {
      const response = await request(app)
        .put('/api/categories/invalid')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ name: '测试' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    let personalCategory: Category;
    let teamCategory: Category;

    beforeEach(async () => {
      personalCategory = await Category.create({
        name: '待删除个人',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: testUser1.id,
        createdBy: testUser1.id,
      });

      teamCategory = await Category.create({
        name: '待删除团队',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
        createdBy: testUser1.id,
      });
    });

    it('should delete personal category by owner', async () => {
      const response = await request(app)
        .delete(`/api/categories/${personalCategory.id}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Category deleted successfully');

      // 验证软删除
      const deletedCategory = await Category.findByPk(personalCategory.id);
      expect(deletedCategory?.isActive).toBe(false);
    });

    it('should prevent non-owner from deleting personal category', async () => {
      const response = await request(app)
        .delete(`/api/categories/${personalCategory.id}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(403);
    });

    it('should allow team editor to delete team category', async () => {
      const response = await request(app)
        .delete(`/api/categories/${teamCategory.id}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/categories/:id/can-use', () => {
    let personalCategory: Category;
    let teamCategory: Category;
    let publicCategory: Category;

    beforeEach(async () => {
      personalCategory = await Category.create({
        name: '个人分类',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: testUser1.id,
        createdBy: testUser1.id,
      });

      teamCategory = await Category.create({
        name: '团队分类',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
        createdBy: testUser1.id,
      });

    });

    it('should allow user to use their own personal category', async () => {
      const response = await request(app)
        .get(`/api/categories/${personalCategory.id}/can-use`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.canUse).toBe(true);
    });

    it('should deny user access to other user personal category', async () => {
      const response = await request(app)
        .get(`/api/categories/${personalCategory.id}/can-use`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.canUse).toBe(false);
    });

    it('should allow team member to use team category', async () => {
      const response1 = await request(app)
        .get(`/api/categories/${teamCategory.id}/can-use`)
        .set('Authorization', `Bearer ${authToken1}`);

      const response2 = await request(app)
        .get(`/api/categories/${teamCategory.id}/can-use`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response1.status).toBe(200);
      expect(response1.body.canUse).toBe(true);
      expect(response2.status).toBe(200);
      expect(response2.body.canUse).toBe(true);
    });

    it('should allow anyone to use public category', async () => {
      const outsideUser = await User.create({
        username: 'outsider',
        email: 'outsider@example.com',
        password: 'hashedpassword',
      });

      const outsideToken = jwt.sign(
        { userId: outsideUser.id, email: outsideUser.email },
        process.env.JWT_SECRET || 'development_secret',
        { expiresIn: '7d' }
      );

    });
  });
});