import request from 'supertest';
import { app } from '../../app';
import { User, Prompt } from '../../models';
import { sequelize } from '../../config/database';
import jwt from 'jsonwebtoken';

describe('Prompts API Permission Logic', () => {
  let testUsers: any[] = [];
  let authTokens: string[] = [];

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clean up
    await Prompt.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Create test users
    const alice = await User.create({
      username: 'alice',
      email: 'alice@test.com',
      password: 'password123'
    });

    const bob = await User.create({
      username: 'bob',
      email: 'bob@test.com', 
      password: 'password123'
    });

    testUsers = [alice, bob];

    // Generate JWT tokens
    const jwtSecret = process.env.JWT_SECRET || 'development_secret';
    authTokens = testUsers.map(user => 
      jwt.sign({ userId: user.id }, jwtSecret)
    );

    // Create test prompts
    await Prompt.create({
      title: 'Alice Public Prompt',
      content: 'Alice public content',
      description: 'Public by Alice',
      isPublic: true,
      userId: alice.id,
      version: 1
    });

    await Prompt.create({
      title: 'Alice Private Prompt',
      content: 'Alice private content', 
      description: 'Private by Alice',
      isPublic: false,
      userId: alice.id,
      version: 1
    });

    await Prompt.create({
      title: 'Bob Public Prompt',
      content: 'Bob public content',
      description: 'Public by Bob', 
      isPublic: true,
      userId: bob.id,
      version: 1
    });

    await Prompt.create({
      title: 'Bob Private Prompt',
      content: 'Bob private content',
      description: 'Private by Bob',
      isPublic: false, 
      userId: bob.id,
      version: 1
    });
  });

  afterEach(async () => {
    await Prompt.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/prompts', () => {
    it('should return only public prompts for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/prompts')
        .expect(200);

      expect(response.body.prompts).toHaveLength(2);
      
      const titles = response.body.prompts.map((p: any) => p.title).sort();
      expect(titles).toEqual(['Alice Public Prompt', 'Bob Public Prompt']);

      // All returned prompts should be public
      response.body.prompts.forEach((prompt: any) => {
        expect(prompt.isPublic).toBe(true);
      });
    });

    it('should return public prompts + own prompts for authenticated Alice', async () => {
      const [alice] = testUsers;
      const [aliceToken] = authTokens;

      const response = await request(app)
        .get('/api/prompts')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(response.body.prompts).toHaveLength(3);
      
      const titles = response.body.prompts.map((p: any) => p.title).sort();
      expect(titles).toEqual([
        'Alice Private Prompt',  // Alice's private
        'Alice Public Prompt',   // Alice's public
        'Bob Public Prompt'      // Bob's public
      ]);

      // Check that Alice can see her private prompt but not Bob's
      const alicePrivate = response.body.prompts.find((p: any) => p.title === 'Alice Private Prompt');
      expect(alicePrivate).toBeDefined();
      expect(alicePrivate.isPublic).toBe(false);
      expect(alicePrivate.userId).toBe(alice.id);

      // Should not include Bob's private prompt
      const bobPrivate = response.body.prompts.find((p: any) => p.title === 'Bob Private Prompt');
      expect(bobPrivate).toBeUndefined();
    });

    it('should return public prompts + own prompts for authenticated Bob', async () => {
      const [, bob] = testUsers;
      const [, bobToken] = authTokens;

      const response = await request(app)
        .get('/api/prompts')
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      expect(response.body.prompts).toHaveLength(3);
      
      const titles = response.body.prompts.map((p: any) => p.title).sort();
      expect(titles).toEqual([
        'Alice Public Prompt',   // Alice's public
        'Bob Private Prompt',    // Bob's private
        'Bob Public Prompt'      // Bob's public
      ]);

      // Bob should see his private prompt
      const bobPrivate = response.body.prompts.find((p: any) => p.title === 'Bob Private Prompt');
      expect(bobPrivate).toBeDefined();
      expect(bobPrivate.isPublic).toBe(false);
      expect(bobPrivate.userId).toBe(bob.id);

      // Should not include Alice's private prompt
      const alicePrivate = response.body.prompts.find((p: any) => p.title === 'Alice Private Prompt');
      expect(alicePrivate).toBeUndefined();
    });

    it('should handle invalid authentication gracefully', async () => {
      const response = await request(app)
        .get('/api/prompts')
        .set('Authorization', 'Bearer invalid-token')
        .expect(200);

      // Should behave like unauthenticated request
      expect(response.body.prompts).toHaveLength(2);
      
      const titles = response.body.prompts.map((p: any) => p.title).sort();
      expect(titles).toEqual(['Alice Public Prompt', 'Bob Public Prompt']);
    });

    it('should maintain permission logic with any query parameters', async () => {
      const [alice] = testUsers;
      const [aliceToken] = authTokens;

      // Test that permission logic works regardless of additional query parameters
      const response = await request(app)
        .get('/api/prompts?someParam=test')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      // Alice should see all public prompts + her own prompts
      expect(response.body.prompts).toHaveLength(3);
      
      // Verify permission logic is still enforced
      response.body.prompts.forEach((prompt: any) => {
        const isPublic = prompt.isPublic;
        const isOwn = prompt.userId === alice.id;
        expect(isPublic || isOwn).toBe(true);
      });
    });

    it('should return empty array when no prompts match permission criteria', async () => {
      // Make all prompts private
      await Prompt.update({ isPublic: false }, { where: {} });

      const response = await request(app)
        .get('/api/prompts')
        .expect(200);

      expect(response.body.prompts).toHaveLength(0);
    });
  });

  describe('Regression Test for Original Defect', () => {
    it('should allow logged-in users to see their private prompts on homepage', async () => {
      // This test specifically validates the fix for the original issue:
      // "我在任意页面 刷新后，都会跳到 登录页，即使我已经登录"
      // The real issue was that users couldn't see their own content on the homepage
      
      const [alice] = testUsers;
      const [aliceToken] = authTokens;

      // Make Alice's prompt private (simulate real-world scenario)
      await Prompt.update({ isPublic: false }, { where: { userId: alice.id } });

      const response = await request(app)
        .get('/api/prompts')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      // Alice should still see her own prompts even though they're private
      const alicePrompts = response.body.prompts.filter((p: any) => p.userId === alice.id);
      expect(alicePrompts).toHaveLength(2);
      
      alicePrompts.forEach((prompt: any) => {
        expect(prompt.isPublic).toBe(false);
        expect(prompt.userId).toBe(alice.id);
      });

      // This validates that the homepage won't show "暂无公开提示词" 
      // for users who have their own content
      expect(response.body.prompts.length).toBeGreaterThan(0);
    });
  });

  describe('Security and Privacy', () => {
    it('should never expose other users\' private prompts', async () => {
      const [alice, bob] = testUsers;
      const [aliceToken, bobToken] = authTokens;

      // Test Alice's view
      const aliceResponse = await request(app)
        .get('/api/prompts')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      const aliceView = aliceResponse.body.prompts;
      aliceView.forEach((prompt: any) => {
        if (!prompt.isPublic) {
          // If it's private, it must be Alice's
          expect(prompt.userId).toBe(alice.id);
        }
      });

      // Test Bob's view  
      const bobResponse = await request(app)
        .get('/api/prompts')
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      const bobView = bobResponse.body.prompts;
      bobView.forEach((prompt: any) => {
        if (!prompt.isPublic) {
          // If it's private, it must be Bob's
          expect(prompt.userId).toBe(bob.id);
        }
      });
    });

    it('should include user info but not sensitive data', async () => {
      const response = await request(app)
        .get('/api/prompts')
        .expect(200);

      response.body.prompts.forEach((prompt: any) => {
        expect(prompt.user).toBeDefined();
        expect(prompt.user.id).toBeDefined();
        expect(prompt.user.username).toBeDefined();
        expect(prompt.user.password).toBeUndefined();
        expect(prompt.user.email).toBeUndefined();
      });
    });
  });
});