import request from 'supertest';
import { app } from '../app';
import { sequelize } from '../config/database';
import { User } from '../models';

describe('AI Service Integration Tests', () => {
  let userToken: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await User.destroy({ where: {} });
    
    // Create test user and get token for each test
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'aiuser',
        email: 'ai@test.com',
        password: 'password123'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ai@test.com',
        password: 'password123'
      });

    userToken = loginResponse.body.token;
  });

  describe('POST /api/ai/analyze', () => {
    it('should analyze a prompt using AI', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: '写一个Python函数来计算阶乘'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data).toHaveProperty('strengths');
      expect(response.body.data).toHaveProperty('weaknesses');
      expect(response.body.data).toHaveProperty('suggestions');
      expect(response.body.data.score).toBeGreaterThanOrEqual(0);
      expect(response.body.data.score).toBeLessThanOrEqual(100);
    });

    it('should handle invalid content', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Content is required and must be a string');
    });

    it('should handle content that is too long', async () => {
      const longContent = 'a'.repeat(5001);
      
      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: longContent
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Content too long (max 5000 characters)');
    });
  });

  describe('POST /api/ai/validate', () => {
    it('should validate a prompt using AI', async () => {
      const response = await request(app)
        .post('/api/ai/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: '请创建一个响应式网页设计，包含导航栏、主要内容区域和页脚。使用现代CSS技术，确保在移动设备上良好显示。'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isValid');
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data).toHaveProperty('issues');
      expect(response.body.data).toHaveProperty('suggestions');
      expect(typeof response.body.data.isValid).toBe('boolean');
      expect(typeof response.body.data.score).toBe('number');
      expect(Array.isArray(response.body.data.issues)).toBe(true);
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
    });
  });

  describe('POST /api/ai/optimize', () => {
    it('should generate optimized version of a prompt', async () => {
      const suggestions = [
        {
          type: 'specificity',
          title: '增加详细信息',
          description: '添加更多具体要求',
          confidence: 0.8,
          impact: 'medium'
        }
      ];

      const response = await request(app)
        .post('/api/ai/optimize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: '写代码',
          suggestions
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('original');
      expect(response.body.data).toHaveProperty('optimized');
      expect(response.body.data.original).toBe('写代码');
      expect(typeof response.body.data.optimized).toBe('string');
    });
  });

  describe('POST /api/ai/categorize', () => {
    it('should categorize a prompt using AI', async () => {
      const response = await request(app)
        .post('/api/ai/categorize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: '创建一个React组件用于显示用户资料信息'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data).toHaveProperty('suggested_category');
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(typeof response.body.data.suggested_category).toBe('string');
    });
  });

  describe('Environment Configuration', () => {
    it('should work with or without OpenAI API key', async () => {
      // Test should pass whether OpenAI key is configured or not
      // Service should fallback to basic analysis when key is missing
      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: '测试提示词，包含足够的内容来进行基本分析。这个提示词应该能够通过基础分析功能。'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data.score).toBeGreaterThan(0);
    });
  });
});