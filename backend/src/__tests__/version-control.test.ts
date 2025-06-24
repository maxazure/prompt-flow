import request from 'supertest';
import { app } from '../app';
import { sequelize } from '../config/database';
import { User, Prompt, PromptVersion } from '../models';

describe('Prompt Version Control API', () => {
  let authToken: string;
  let userId: number;
  let promptId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // Create test user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    
    userId = userResponse.body.user.id;
    
    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.token;
    
    // Create test prompt
    const promptResponse = await request(app)
      .post('/api/prompts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Prompt',
        content: 'Initial content',
        description: 'Test description',
        category: 'test',
        tags: ['test'],
        isPublic: true
      });
    
    promptId = promptResponse.body.prompt?.id || promptResponse.body.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/prompts/:id/versions', () => {
    it('should return version history for a prompt', async () => {
      const response = await request(app)
        .get(`/api/prompts/${promptId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('versions');
      expect(Array.isArray(response.body.versions)).toBe(true);
      expect(response.body.versions.length).toBeGreaterThan(0);
      expect(response.body.versions[0]).toHaveProperty('version', 1);
      expect(response.body.versions[0]).toHaveProperty('title', 'Test Prompt');
    });

    it('should return 404 for non-existent prompt', async () => {
      await request(app)
        .get('/api/prompts/99999/versions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/prompts/${promptId}/versions`)
        .expect(401);
    });
  });

  describe('POST /api/prompts/:id/versions', () => {
    it('should create a new version of a prompt', async () => {
      const response = await request(app)
        .post(`/api/prompts/${promptId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Test Prompt',
          content: 'Updated content',
          description: 'Updated description',
          changeLog: 'Updated title and content'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('version', 2);
      expect(response.body).toHaveProperty('title', 'Updated Test Prompt');
      expect(response.body).toHaveProperty('content', 'Updated content');
      expect(response.body).toHaveProperty('changeLog', 'Updated title and content');
    });

    it('should update the main prompt with new version', async () => {
      const response = await request(app)
        .get(`/api/prompts/${promptId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.prompt).toHaveProperty('version', 2);
      expect(response.body.prompt).toHaveProperty('title', 'Updated Test Prompt');
    });

    it('should require prompt ownership or public access', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'otheruser',
          email: 'other@example.com',
          password: 'password123'
        });

      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other@example.com',
          password: 'password123'
        });

      const otherToken = otherLoginResponse.body.token;

      await request(app)
        .post(`/api/prompts/${promptId}/versions`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Unauthorized Update',
          content: 'Should not work'
        })
        .expect(403);
    });
  });

  describe('GET /api/prompts/:id/versions/:version', () => {
    it('should return a specific version of a prompt', async () => {
      const response = await request(app)
        .get(`/api/prompts/${promptId}/versions/1`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('version', 1);
      expect(response.body).toHaveProperty('title', 'Test Prompt');
      expect(response.body).toHaveProperty('content', 'Initial content');
    });

    it('should return 404 for non-existent version', async () => {
      await request(app)
        .get(`/api/prompts/${promptId}/versions/99`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/prompts/:id/revert/:version', () => {
    it('should revert prompt to a previous version', async () => {
      const response = await request(app)
        .post(`/api/prompts/${promptId}/revert/1`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          changeLog: 'Reverted to version 1'
        })
        .expect(200);

      expect(response.body).toHaveProperty('version', 3);
      expect(response.body).toHaveProperty('title', 'Test Prompt');
      expect(response.body).toHaveProperty('content', 'Initial content');
    });

    it('should create a new version when reverting', async () => {
      const versionsResponse = await request(app)
        .get(`/api/prompts/${promptId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(versionsResponse.body.versions).toHaveLength(3);
      expect(versionsResponse.body.versions[0]).toHaveProperty('version', 3);
      expect(versionsResponse.body.versions[0]).toHaveProperty('changeLog', 'Reverted to version 1');
    });

    it('should require prompt ownership', async () => {
      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other@example.com',
          password: 'password123'
        });

      const otherToken = otherLoginResponse.body.token;

      await request(app)
        .post(`/api/prompts/${promptId}/revert/1`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          changeLog: 'Unauthorized revert'
        })
        .expect(403);
    });

    it('should return 404 for non-existent version to revert to', async () => {
      await request(app)
        .post(`/api/prompts/${promptId}/revert/99`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          changeLog: 'Should fail'
        })
        .expect(404);
    });
  });
});