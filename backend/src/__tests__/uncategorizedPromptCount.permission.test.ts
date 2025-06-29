import request from 'supertest';
import { app } from '../app';
import { sequelize } from '../config/database';
import { User, Category, Prompt } from '../models';
import { CategoryScopeType } from '../models/Category';
import jwt from 'jsonwebtoken';

describe('Uncategorized Category Prompt Count - Permission Logic', () => {
  let user1: User;
  let user2: User;
  let token1: string;
  let token2: string;
  let uncategorizedCategory1: Category;
  let uncategorizedCategory2: Category;

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

    // 创建两个测试用户
    user1 = await User.create({
      username: 'user1',
      email: 'user1@example.com',
      password: 'password123',
    });

    user2 = await User.create({
      username: 'user2',
      email: 'user2@example.com',
      password: 'password123',
    });

    // 生成JWT tokens
    const jwtSecret = process.env.JWT_SECRET || 'development_secret';
    token1 = jwt.sign(
      { userId: user1.id, email: user1.email },
      jwtSecret,
      { expiresIn: '7d' }
    );
    token2 = jwt.sign(
      { userId: user2.id, email: user2.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // 创建各自的未分类分类
    uncategorizedCategory1 = await Category.create({
      name: '未分类',
      description: '默认分类，用于存放未分类的提示词',
      scopeType: CategoryScopeType.PERSONAL,
      scopeId: user1.id,
      createdBy: user1.id,
      color: '#6b7280',
      isActive: true,
    });

    uncategorizedCategory2 = await Category.create({
      name: '未分类',
      description: '默认分类，用于存放未分类的提示词',
      scopeType: CategoryScopeType.PERSONAL,
      scopeId: user2.id,
      createdBy: user2.id,
      color: '#6b7280',
      isActive: true,
    });
  });

  describe('Privacy Protection in Uncategorized Prompt Count', () => {
    it('should only count user1 own prompts in their uncategorized category', async () => {
      // 为user1创建私有提示词
      await Prompt.create({
        title: 'User1 Private Prompt',
        content: 'This is user1 private content',
        description: 'Private by user1',
        userId: user1.id,
        categoryId: uncategorizedCategory1.id,
        isPublic: false,
        version: 1,
      });

      // 为user1创建公开提示词
      await Prompt.create({
        title: 'User1 Public Prompt',
        content: 'This is user1 public content',
        description: 'Public by user1',
        userId: user1.id,
        categoryId: uncategorizedCategory1.id,
        isPublic: true,
        version: 1,
      });

      // 为user2在相同分类ID创建提示词（这在实际应用中不应该发生，但测试边界情况）
      await Prompt.create({
        title: 'User2 Prompt in Wrong Category',
        content: 'This is user2 content in user1 category',
        description: 'This should not be counted for user1',
        userId: user2.id,
        categoryId: uncategorizedCategory1.id, // 错误地放在user1的分类中
        isPublic: false,
        version: 1,
      });

      // 获取user1的分类列表
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);

      const user1UncategorizedFromAPI = response.body.categories.personal.find(
        (cat: any) => cat.name === '未分类'
      );

      expect(user1UncategorizedFromAPI).toBeTruthy();
      
      // 关键测试：user1应该只看到自己的2个提示词，不应该看到user2的提示词
      // 这测试了修复后的权限逻辑：只统计 (isPublic=true OR userId=currentUser) 的提示词
      expect(user1UncategorizedFromAPI.promptCount).toBe(2);
    });

    it('should apply correct permission logic for user2 as well', async () => {
      // 为user2创建提示词
      await Prompt.create({
        title: 'User2 Private Prompt',
        content: 'This is user2 private content',
        description: 'Private by user2',
        userId: user2.id,
        categoryId: uncategorizedCategory2.id,
        isPublic: false,
        version: 1,
      });

      // 为user1创建公开提示词（在user1的分类中）
      await Prompt.create({
        title: 'User1 Public Prompt',
        content: 'This is user1 public content',
        description: 'Public by user1',
        userId: user1.id,
        categoryId: uncategorizedCategory1.id,
        isPublic: true,
        version: 1,
      });

      // 获取user2的分类列表
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(200);

      const user2UncategorizedFromAPI = response.body.categories.personal.find(
        (cat: any) => cat.name === '未分类'
      );

      expect(user2UncategorizedFromAPI).toBeTruthy();
      
      // user2应该只看到自己的1个私有提示词
      // 不应该看到user1的公开提示词，因为那个提示词不在user2的分类中
      expect(user2UncategorizedFromAPI.promptCount).toBe(1);
    });

    it('should correctly handle mixed public and private prompts visibility', async () => {
      // 创建各种组合的测试数据
      
      // user1的公开提示词
      await Prompt.create({
        title: 'User1 Public in Uncategorized',
        content: 'Public content',
        userId: user1.id,
        categoryId: uncategorizedCategory1.id,
        isPublic: true,
        version: 1,
      });

      // user1的私有提示词
      await Prompt.create({
        title: 'User1 Private in Uncategorized',
        content: 'Private content',
        userId: user1.id,
        categoryId: uncategorizedCategory1.id,
        isPublic: false,
        version: 1,
      });

      // user2的公开提示词
      await Prompt.create({
        title: 'User2 Public in Uncategorized',
        content: 'Public content',
        userId: user2.id,
        categoryId: uncategorizedCategory2.id,
        isPublic: true,
        version: 1,
      });

      // user2的私有提示词
      await Prompt.create({
        title: 'User2 Private in Uncategorized',
        content: 'Private content',
        userId: user2.id,
        categoryId: uncategorizedCategory2.id,
        isPublic: false,
        version: 1,
      });

      // 测试user1视角
      const user1Response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token1}`);

      const user1UncategorizedFromAPI = user1Response.body.categories.personal.find(
        (cat: any) => cat.name === '未分类'
      );

      // user1应该看到自己的2个提示词（1公开+1私有）
      expect(user1UncategorizedFromAPI.promptCount).toBe(2);

      // 测试user2视角
      const user2Response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token2}`);

      const user2UncategorizedFromAPI = user2Response.body.categories.personal.find(
        (cat: any) => cat.name === '未分类'
      );

      // user2应该看到自己的2个提示词（1公开+1私有）
      expect(user2UncategorizedFromAPI.promptCount).toBe(2);
    });
  });

  describe('Cross-Category Permission Logic', () => {
    it('should not count prompts from different users even if they somehow end up in wrong category', async () => {
      // 这个测试模拟了一个数据完整性问题：
      // 如果由于某种原因，user2的提示词错误地被分配到了user1的分类中
      
      // user1的正常提示词
      await Prompt.create({
        title: 'User1 Normal Prompt',
        content: 'Normal content',
        userId: user1.id,
        categoryId: uncategorizedCategory1.id,
        isPublic: false,
        version: 1,
      });

      // 模拟数据错误：user2的提示词被错误地分配到user1的分类
      await Prompt.create({
        title: 'User2 Misplaced Prompt',
        content: 'This should not be counted for user1',
        userId: user2.id,
        categoryId: uncategorizedCategory1.id, // 错误的分类ID
        isPublic: false,
        version: 1,
      });

      // 获取user1的分类列表
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token1}`);

      const user1UncategorizedFromAPI = response.body.categories.personal.find(
        (cat: any) => cat.name === '未分类'
      );

      // 修复后的逻辑：即使user2的提示词在user1的分类中，
      // 由于权限检查 (isPublic=true OR userId=user1.id)，
      // user2的私有提示词不应该被计入user1的计数
      expect(user1UncategorizedFromAPI.promptCount).toBe(1);
    });

    it('should handle public prompts correctly across different categories', async () => {
      // user1的公开提示词
      await Prompt.create({
        title: 'User1 Public Prompt',
        content: 'Public content by user1',
        userId: user1.id,
        categoryId: uncategorizedCategory1.id,
        isPublic: true,
        version: 1,
      });

      // user2的公开提示词（错误地分配到user1的分类）
      await Prompt.create({
        title: 'User2 Public Prompt Misplaced',
        content: 'Public content by user2',
        userId: user2.id,
        categoryId: uncategorizedCategory1.id, // 错误的分类ID
        isPublic: true,
        version: 1,
      });

      // 获取user1的分类列表
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token1}`);

      const user1UncategorizedFromAPI = response.body.categories.personal.find(
        (cat: any) => cat.name === '未分类'
      );

      // 由于权限逻辑是 (isPublic=true OR userId=user1.id)，
      // 两个提示词都应该被计入：
      // - user1的公开提示词（userId=user1.id）
      // - user2的公开提示词（isPublic=true）
      expect(user1UncategorizedFromAPI.promptCount).toBe(2);
    });
  });

  describe('Regression Prevention Tests', () => {
    it('should never show empty categories due to permission filtering', async () => {
      // 这个测试确保修复不会导致用户看不到自己的内容
      
      // 创建user1的私有提示词
      await Prompt.create({
        title: 'User1 Only Private Prompt',
        content: 'This is completely private',
        userId: user1.id,
        categoryId: uncategorizedCategory1.id,
        isPublic: false,
        version: 1,
      });

      // 获取user1的分类列表
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token1}`);

      const user1UncategorizedFromAPI = response.body.categories.personal.find(
        (cat: any) => cat.name === '未分类'
      );

      // 即使提示词是私有的，用户也应该能看到自己的内容
      expect(user1UncategorizedFromAPI.promptCount).toBe(1);
    });

    it('should maintain consistent count calculation across multiple API calls', async () => {
      // 创建测试数据
      await Prompt.create({
        title: 'Consistent Test Prompt',
        content: 'Content for consistency test',
        userId: user1.id,
        categoryId: uncategorizedCategory1.id,
        isPublic: false,
        version: 1,
      });

      // 多次调用API，确保结果一致
      const response1 = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token1}`);

      const response2 = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token1}`);

      const count1 = response1.body.categories.personal.find(
        (cat: any) => cat.name === '未分类'
      ).promptCount;

      const count2 = response2.body.categories.personal.find(
        (cat: any) => cat.name === '未分类'
      ).promptCount;

      expect(count1).toBe(count2);
      expect(count1).toBe(1);
    });
  });
});