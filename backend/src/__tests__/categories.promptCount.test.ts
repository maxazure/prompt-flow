import request from 'supertest';
import { app } from '../app';
import { sequelize } from '../config/database';
import { User, Category, Prompt } from '../models';
import { CategoryScopeType } from '../models/Category';
import jwt from 'jsonwebtoken';

describe('Categories Prompt Count', () => {
  let user: User;
  let token: string;
  let uncategorizedCategory: Category;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // 清理数据
    await Prompt.destroy({ where: {}, force: true });
    await Category.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // 创建测试用户
    user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    // 生成JWT token
    token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'development_secret',
      { expiresIn: '7d' }
    );

    // 创建未分类分类
    uncategorizedCategory = await Category.create({
      name: '未分类',
      description: '默认分类，用于存放未分类的提示词',
      scopeType: CategoryScopeType.PERSONAL,
      scopeId: user.id,
      createdBy: user.id,
      color: '#6b7280',
      isActive: true,
    });
  });

  describe('GET /api/categories - Prompt Count Validation', () => {
    it('should return correct prompt count for uncategorized category', async () => {
      // Arrange: 创建一个提示词分配给未分类分类
      const prompt = await Prompt.create({
        title: 'Test Prompt in Uncategorized',
        content: 'This is a test prompt in uncategorized category',
        description: 'Test description',
        userId: user.id,
        categoryId: uncategorizedCategory.id,
        isPublic: false,
        version: 1,
      });

      console.log('🧪 Created test prompt:', {
        id: prompt.id,
        title: prompt.title,
        categoryId: prompt.categoryId,
        userId: prompt.userId,
      });

      console.log('🧪 Uncategorized category:', {
        id: uncategorizedCategory.id,
        name: uncategorizedCategory.name,
        scopeType: uncategorizedCategory.scopeType,
        scopeId: uncategorizedCategory.scopeId,
      });

      // Act: 获取分类列表
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      console.log('🧪 API Response status:', response.status);
      console.log('🧪 API Response body:', JSON.stringify(response.body, null, 2));

      // Assert: 验证响应状态
      expect(response.status).toBe(200);

      // 找到未分类分类
      let uncategorizedFromAPI: any = null;
      
      if (Array.isArray(response.body.categories)) {
        // 如果返回的是数组格式
        uncategorizedFromAPI = response.body.categories.find(
          (cat: any) => cat.name === '未分类' && cat.scopeType === 'personal'
        );
      } else if (response.body.categories.personal) {
        // 如果返回的是分组格式
        uncategorizedFromAPI = response.body.categories.personal.find(
          (cat: any) => cat.name === '未分类'
        );
      }

      console.log('🧪 Found uncategorized category from API:', uncategorizedFromAPI);

      // 验证未分类分类存在
      expect(uncategorizedFromAPI).toBeTruthy();
      expect(uncategorizedFromAPI.id).toBe(uncategorizedCategory.id);

      // TDD: 期望未分类分类的提示词计数为1，但实际可能为0（这是我们要修复的bug）
      console.log('🧪 Expected promptCount: 1, Actual promptCount:', uncategorizedFromAPI.promptCount);
      
      // 这个测试应该失败，因为当前API没有正确计算promptCount
      expect(uncategorizedFromAPI.promptCount).toBe(1);
    });

    it('should return correct prompt count for category with multiple prompts', async () => {
      // Arrange: 创建多个提示词
      await Prompt.create({
        title: 'First Prompt',
        content: 'First content',
        userId: user.id,
        categoryId: uncategorizedCategory.id,
        isPublic: false,
        version: 1,
      });

      await Prompt.create({
        title: 'Second Prompt',
        content: 'Second content',
        userId: user.id,
        categoryId: uncategorizedCategory.id,
        isPublic: false,
        version: 1,
      });

      await Prompt.create({
        title: 'Third Prompt',
        content: 'Third content',
        userId: user.id,
        categoryId: uncategorizedCategory.id,
        isPublic: false,
        version: 1,
      });

      // Act: 获取分类列表
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);

      let uncategorizedFromAPI: any = null;
      if (Array.isArray(response.body.categories)) {
        uncategorizedFromAPI = response.body.categories.find(
          (cat: any) => cat.name === '未分类' && cat.scopeType === 'personal'
        );
      } else if (response.body.categories.personal) {
        uncategorizedFromAPI = response.body.categories.personal.find(
          (cat: any) => cat.name === '未分类'
        );
      }

      expect(uncategorizedFromAPI).toBeTruthy();
      expect(uncategorizedFromAPI.promptCount).toBe(3);
    });

    it('should return zero prompt count for empty category', async () => {
      // Arrange: 创建一个新的空分类
      const emptyCategory = await Category.create({
        name: '空分类',
        description: '这是一个空分类',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: user.id,
        createdBy: user.id,
        color: '#ff5733',
        isActive: true,
      });

      // Act: 获取分类列表
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);

      let emptyCategoryFromAPI: any = null;
      if (Array.isArray(response.body.categories)) {
        emptyCategoryFromAPI = response.body.categories.find(
          (cat: any) => cat.name === '空分类'
        );
      } else if (response.body.categories.personal) {
        emptyCategoryFromAPI = response.body.categories.personal.find(
          (cat: any) => cat.name === '空分类'
        );
      }

      expect(emptyCategoryFromAPI).toBeTruthy();
      expect(emptyCategoryFromAPI.promptCount).toBe(0);
    });

    it('should only count prompts that belong to the user for personal categories', async () => {
      // Arrange: 创建另一个用户和他的提示词
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123',
      });

      // 用户1的提示词
      await Prompt.create({
        title: 'User1 Prompt',
        content: 'User1 content',
        userId: user.id,
        categoryId: uncategorizedCategory.id,
        isPublic: false,
        version: 1,
      });

      // 用户2的提示词（不应该被计入用户1的分类计数）
      await Prompt.create({
        title: 'User2 Prompt',
        content: 'User2 content',
        userId: otherUser.id,
        categoryId: uncategorizedCategory.id, // 相同的分类ID（这在实际应用中不应该发生）
        isPublic: false,
        version: 1,
      });

      // Act: 获取用户1的分类列表
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);

      let uncategorizedFromAPI: any = null;
      if (Array.isArray(response.body.categories)) {
        uncategorizedFromAPI = response.body.categories.find(
          (cat: any) => cat.name === '未分类' && cat.scopeType === 'personal'
        );
      } else if (response.body.categories.personal) {
        uncategorizedFromAPI = response.body.categories.personal.find(
          (cat: any) => cat.name === '未分类'
        );
      }

      expect(uncategorizedFromAPI).toBeTruthy();
      // 只应该计算用户1的提示词，所以计数应该是1
      expect(uncategorizedFromAPI.promptCount).toBe(1);
    });
  });

  describe('Detailed Count Analysis', () => {
    it('should validate prompt count calculation logic', async () => {
      // 直接查询数据库验证提示词确实存在
      const prompt = await Prompt.create({
        title: 'Validation Prompt',
        content: 'Validation content',
        userId: user.id,
        categoryId: uncategorizedCategory.id,
        isPublic: false,
        version: 1,
      });

      // 直接查询数据库中的提示词数量
      const promptCountInDB = await Prompt.count({
        where: {
          categoryId: uncategorizedCategory.id,
          userId: user.id,
        },
      });

      console.log('🔍 Direct DB query - prompt count:', promptCountInDB);
      expect(promptCountInDB).toBe(1);

      // 再验证API返回的数据
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      console.log('🔍 API response categories type:', typeof response.body.categories);
      console.log('🔍 API response structure:', Object.keys(response.body));

      // 这里我们确认API确实没有返回正确的promptCount
      // 这个测试应该暴露出问题的根源
    });
  });
});