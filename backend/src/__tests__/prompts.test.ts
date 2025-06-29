import request from 'supertest';
import { app } from '../app';
import { sequelize } from '../config/database';
import { User, Prompt } from '../models';
import jwt from 'jsonwebtoken';

describe('Prompts API', () => {
  let testUser: User;
  let authToken: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up data using raw SQL to avoid foreign key issues in SQLite
    await sequelize.query('PRAGMA foreign_keys = OFF', { raw: true });
    await sequelize.query('DELETE FROM prompts', { raw: true });
    await sequelize.query('DELETE FROM users', { raw: true });
    await sequelize.query('PRAGMA foreign_keys = ON', { raw: true });

    // Create test user
    testUser = await User.create({
      username: 'sarah',
      email: 'sarah@example.com',
      password: 'hashedpassword',
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'development_secret',
      { expiresIn: '7d' }
    );
  });

  describe('POST /api/prompts', () => {
    it('should create a new prompt successfully', async () => {
      const promptData = {
        title: 'Website Generator',
        content: 'Create a modern, responsive website for {company} with navigation, hero section, and contact form.',
        description: 'Template for generating professional websites',
        category: 'web-development',
        tags: ['html', 'css', 'responsive'],
        isTemplate: true,
      };

      const response = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(promptData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Prompt created successfully');
      expect(response.body).toHaveProperty('prompt');
      expect(response.body.prompt.title).toBe(promptData.title);
      expect(response.body.prompt.content).toBe(promptData.content);
      expect(response.body.prompt.userId).toBe(testUser.id);
      expect(response.body.prompt.version).toBe(1);
    });

    it('should fail when not authenticated', async () => {
      const promptData = {
        title: 'Test Prompt',
        content: 'Test content',
      };

      const response = await request(app)
        .post('/api/prompts')
        .send(promptData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should fail when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/prompts', () => {
    beforeEach(async () => {
      // Create test prompts
      await Prompt.create({
        title: 'Public Prompt',
        content: 'This is a public prompt',
        userId: testUser.id,
        isPublic: true,
      });

      await Prompt.create({
        title: 'Private Prompt',
        content: 'This is a private prompt',
        userId: testUser.id,
        isPublic: false,
      });

      // Create another user's prompt
      const anotherUser = await User.create({
        username: 'jack',
        email: 'jack@example.com',
        password: 'hashedpassword',
      });

      await Prompt.create({
        title: 'Another User Prompt',
        content: 'This belongs to another user',
        userId: anotherUser.id,
        isPublic: true,
      });
    });

    it('should get only public prompts when authenticated via main endpoint', async () => {
      const response = await request(app)
        .get('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('prompts');
      expect(response.body.prompts).toHaveLength(2); // Two public prompts
      expect(response.body.prompts.every((p: any) => p.isPublic === true)).toBe(true);
    });

    it('should get user own prompts when authenticated via /my endpoint', async () => {
      const response = await request(app)
        .get('/api/prompts/my')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('prompts');
      expect(response.body.prompts).toHaveLength(2);
      expect(response.body.prompts.every((p: any) => p.userId === testUser.id)).toBe(true);
    });

    it('should get only public prompts when not authenticated', async () => {
      const response = await request(app)
        .get('/api/prompts')
        .expect(200);

      expect(response.body).toHaveProperty('prompts');
      expect(response.body.prompts).toHaveLength(2); // Two public prompts
      expect(response.body.prompts.every((p: any) => p.isPublic === true)).toBe(true);
    });

    it('should filter prompts by category', async () => {
      await Prompt.create({
        title: 'Web Prompt',
        content: 'Web development prompt',
        userId: testUser.id,
        category: 'web-development',
        isPublic: true,
      });

      const response = await request(app)
        .get('/api/prompts?category=web-development')
        .expect(200);

      expect(response.body.prompts).toHaveLength(1);
      expect(response.body.prompts[0].category).toBe('web-development');
    });
  });

  describe('GET /api/prompts/:id', () => {
    let testPrompt: Prompt;

    beforeEach(async () => {
      testPrompt = await Prompt.create({
        title: 'Test Prompt',
        content: 'Test content',
        userId: testUser.id,
        isPublic: true,
      });
    });

    it('should get prompt by id', async () => {
      const response = await request(app)
        .get(`/api/prompts/${testPrompt.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('prompt');
      expect(response.body.prompt.id).toBe(testPrompt.id);
      expect(response.body.prompt.title).toBe(testPrompt.title);
    });

    it('should return 404 for non-existent prompt', async () => {
      const response = await request(app)
        .get('/api/prompts/999999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Prompt not found');
    });

    it('should deny access to private prompt of another user', async () => {
      await Prompt.update({ isPublic: false }, { where: { id: testPrompt.id } });

      const response = await request(app)
        .get(`/api/prompts/${testPrompt.id}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('PUT /api/prompts/:id', () => {
    let testPrompt: Prompt;

    beforeEach(async () => {
      testPrompt = await Prompt.create({
        title: 'Original Title',
        content: 'Original content',
        userId: testUser.id,
      });
    });

    it('should update prompt successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/prompts/${testPrompt.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Prompt updated successfully');
      expect(response.body.prompt.title).toBe(updateData.title);
      expect(response.body.prompt.content).toBe(updateData.content);
    });

    it('should deny update to another user prompt', async () => {
      const anotherUser = await User.create({
        username: 'jack',
        email: 'jack@example.com',
        password: 'hashedpassword',
      });

      const anotherUserToken = jwt.sign(
        { userId: anotherUser.id, email: anotherUser.email },
        process.env.JWT_SECRET || 'development_secret',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .put(`/api/prompts/${testPrompt.id}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('DELETE /api/prompts/:id', () => {
    let testPrompt: Prompt;

    beforeEach(async () => {
      testPrompt = await Prompt.create({
        title: 'To Delete',
        content: 'This will be deleted',
        userId: testUser.id,
      });
    });

    it('should delete prompt successfully', async () => {
      const response = await request(app)
        .delete(`/api/prompts/${testPrompt.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Prompt deleted successfully');

      // Verify deletion
      const deletedPrompt = await Prompt.findByPk(testPrompt.id);
      expect(deletedPrompt).toBeNull();
    });

    it('should deny delete to another user prompt', async () => {
      const anotherUser = await User.create({
        username: 'jack',
        email: 'jack@example.com',
        password: 'hashedpassword',
      });

      const anotherUserToken = jwt.sign(
        { userId: anotherUser.id, email: anotherUser.email },
        process.env.JWT_SECRET || 'development_secret',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .delete(`/api/prompts/${testPrompt.id}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });
});