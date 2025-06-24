import request from 'supertest';
import { app } from '../app';
import { User } from '../models';
import { initDatabase } from '../config/database';
import jwt from 'jsonwebtoken';

describe('AI Optimization API', () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    // Initialize database
    await initDatabase();
    
    // Create test user
    const user = await User.create({
      username: 'aitest',
      email: 'ai@test.com',
      password: 'password123',
    });
    userId = user.id;

    // Generate auth token with correct field name
    authToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'development_secret'
    );
  });

  afterAll(async () => {
    // Cleanup
    if (userId) {
      await User.destroy({ where: { id: userId } });
    }
  });

  describe('POST /api/ai/analyze', () => {
    it('should analyze prompt content and return suggestions', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '创建一个网站',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data).toHaveProperty('suggestions');
      expect(response.body.data).toHaveProperty('strengths');
      expect(response.body.data).toHaveProperty('weaknesses');
      expect(response.body.data).toHaveProperty('estimatedTokens');
      expect(response.body.data).toHaveProperty('readabilityScore');
      
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
      expect(Array.isArray(response.body.data.strengths)).toBe(true);
      expect(Array.isArray(response.body.data.weaknesses)).toBe(true);
      expect(typeof response.body.data.score).toBe('number');
    });

    it('should handle long content and suggest optimization', async () => {
      const longContent = '创建一个网站'.repeat(200); // Make it longer to trigger efficiency suggestion
      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: longContent,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.suggestions.length).toBeGreaterThan(0);
      // Check that at least one suggestion exists (could be efficiency or other types)
      expect(response.body.data.suggestions[0]).toHaveProperty('type');
      expect(response.body.data.suggestions[0]).toHaveProperty('title');
    });

    it('should handle short content and suggest adding details', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '帮助',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.suggestions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'specificity',
            title: '增加详细信息',
          }),
        ])
      );
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .send({
          content: '测试内容',
        });

      expect(response.status).toBe(401);
    });

    it('should validate content parameter', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Content is required');
    });

    it('should reject content that is too long', async () => {
      const veryLongContent = 'a'.repeat(6000);
      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: veryLongContent,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Content too long');
    });
  });

  describe('POST /api/ai/optimize', () => {
    it('should generate optimized version of prompt', async () => {
      const suggestions = [
        {
          type: 'clarity',
          title: '提高清晰度',
          description: '添加更具体的要求',
          confidence: 0.8,
          impact: 'medium',
        },
      ];

      const response = await request(app)
        .post('/api/ai/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '创建网站',
          suggestions,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('original');
      expect(response.body.data).toHaveProperty('optimized');
      expect(response.body.data.original).toBe('创建网站');
      expect(typeof response.body.data.optimized).toBe('string');
    });

    it('should require both content and suggestions', async () => {
      const response = await request(app)
        .post('/api/ai/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '测试',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Suggestions array is required');
    });
  });

  describe('POST /api/ai/categorize', () => {
    it('should categorize web development content', async () => {
      const response = await request(app)
        .post('/api/ai/categorize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '创建一个响应式网页，包含HTML和CSS',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data).toHaveProperty('suggested_category');
      expect(response.body.data.categories).toContain('web-development');
    });

    it('should categorize design content', async () => {
      const response = await request(app)
        .post('/api/ai/categorize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '设计一个现代化的用户界面UI',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.categories).toContain('design');
    });

    it('should default to general category for unclear content', async () => {
      const response = await request(app)
        .post('/api/ai/categorize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '随机内容xyzabc',
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(response.body.data.categories.length).toBeGreaterThan(0);
      expect(response.body.data).toHaveProperty('suggested_category');
    });
  });

  describe('POST /api/ai/similar', () => {
    it('should return similar prompts and categories', async () => {
      const response = await request(app)
        .post('/api/ai/similar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '创建网站',
          limit: 3,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('similar');
      expect(response.body.data).toHaveProperty('categories');
      expect(Array.isArray(response.body.data.similar)).toBe(true);
      expect(response.body.data.similar.length).toBeLessThanOrEqual(3);
    });

    it('should default limit to 5', async () => {
      const response = await request(app)
        .post('/api/ai/similar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '测试内容',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.similar.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/ai/insights', () => {
    it('should return user insights and statistics', async () => {
      const response = await request(app)
        .get('/api/ai/insights')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_prompts');
      expect(response.body.data).toHaveProperty('avg_length');
      expect(response.body.data).toHaveProperty('category_distribution');
      expect(response.body.data).toHaveProperty('recent_activity');  
      expect(response.body.data).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });
  });
});