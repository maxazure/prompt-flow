import { getPrompts, createPrompt } from '../../services/promptService';
import { User, Prompt } from '../../models';
import { sequelize } from '../../config/database';

describe('PromptService Permission Logic', () => {
  let testUsers: any[] = [];
  let testPrompts: any[] = [];

  beforeAll(async () => {
    // Ensure database is connected and synced
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clean up before each test
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

    const charlie = await User.create({
      username: 'charlie',
      email: 'charlie@test.com', 
      password: 'password123'
    });

    testUsers = [alice, bob, charlie];

    // Create test prompts with different visibility
    const alicePublicPrompt = await createPrompt(alice.id, {
      title: 'Alice Public Prompt',
      content: 'This is Alice\'s public prompt',
      description: 'Public prompt by Alice',
      isPublic: true
    });

    const alicePrivatePrompt = await createPrompt(alice.id, {
      title: 'Alice Private Prompt', 
      content: 'This is Alice\'s private prompt',
      description: 'Private prompt by Alice',
      isPublic: false
    });

    const bobPublicPrompt = await createPrompt(bob.id, {
      title: 'Bob Public Prompt',
      content: 'This is Bob\'s public prompt', 
      description: 'Public prompt by Bob',
      isPublic: true
    });

    const bobPrivatePrompt = await createPrompt(bob.id, {
      title: 'Bob Private Prompt',
      content: 'This is Bob\'s private prompt',
      description: 'Private prompt by Bob', 
      isPublic: false
    });

    const charliePrivatePrompt = await createPrompt(charlie.id, {
      title: 'Charlie Private Prompt',
      content: 'This is Charlie\'s private prompt',
      description: 'Private prompt by Charlie',
      isPublic: false
    });

    testPrompts = [
      alicePublicPrompt,
      alicePrivatePrompt, 
      bobPublicPrompt,
      bobPrivatePrompt,
      charliePrivatePrompt
    ];
  });

  afterEach(async () => {
    // Clean up after each test
    await Prompt.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Unauthenticated Access', () => {
    it('should only return public prompts when no user is specified', async () => {
      // Test the core defect: unauthenticated users should only see public prompts
      const prompts = await getPrompts({});

      expect(prompts).toHaveLength(2); // Only Alice's and Bob's public prompts
      
      const titles = prompts.map(p => p.title).sort();
      expect(titles).toEqual(['Alice Public Prompt', 'Bob Public Prompt']);
      
      // Verify all returned prompts are public
      prompts.forEach(prompt => {
        expect(prompt.isPublic).toBe(true);
      });
    });

    it('should return empty array when no public prompts exist', async () => {
      // Make all prompts private
      await Prompt.update({ isPublic: false }, { where: {} });

      const prompts = await getPrompts({});

      expect(prompts).toHaveLength(0);
    });
  });

  describe('Authenticated Access', () => {
    it('should return public prompts + own prompts for logged-in user', async () => {
      // Test the main fix: Alice should see all public prompts + her own private prompts
      const [alice] = testUsers;
      
      const prompts = await getPrompts({
        currentUserId: alice.id
      });

      expect(prompts).toHaveLength(3); // 2 public + 1 Alice's private
      
      const titles = prompts.map(p => p.title).sort();
      expect(titles).toEqual([
        'Alice Private Prompt',  // Alice's own private prompt
        'Alice Public Prompt',   // Alice's own public prompt  
        'Bob Public Prompt'      // Bob's public prompt
      ]);
    });

    it('should not expose other users\' private prompts', async () => {
      const [alice, bob] = testUsers;
      
      // Alice should not see Bob's private prompt
      const alicePrompts = await getPrompts({
        currentUserId: alice.id
      });

      const titles = alicePrompts.map(p => p.title);
      expect(titles).not.toContain('Bob Private Prompt');
      expect(titles).not.toContain('Charlie Private Prompt');
    });

    it('should work correctly for users with no prompts', async () => {
      const [, , charlie] = testUsers;
      
      // Charlie has only private prompts, should see public prompts + own private
      const prompts = await getPrompts({
        currentUserId: charlie.id
      });

      expect(prompts).toHaveLength(3); // 2 public + 1 Charlie's private
      
      const titles = prompts.map(p => p.title).sort();
      expect(titles).toEqual([
        'Alice Public Prompt',    // Public prompt
        'Bob Public Prompt',      // Public prompt
        'Charlie Private Prompt'  // Charlie's own private prompt
      ]);
    });

    it('should work correctly for user with only public prompts', async () => {
      // Create a user with only public prompts
      const diana = await User.create({
        username: 'diana',
        email: 'diana@test.com',
        password: 'password123'
      });

      await createPrompt(diana.id, {
        title: 'Diana Public Prompt',
        content: 'Diana\'s public content',
        isPublic: true
      });

      const prompts = await getPrompts({
        currentUserId: diana.id
      });

      expect(prompts).toHaveLength(3); // 2 existing public + 1 Diana's public
      
      const titles = prompts.map(p => p.title);
      expect(titles).toContain('Diana Public Prompt');
      expect(titles).toContain('Alice Public Prompt');
      expect(titles).toContain('Bob Public Prompt');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid currentUserId gracefully', async () => {
      const prompts = await getPrompts({
        currentUserId: 99999 // Non-existent user ID
      });

      // Should only return public prompts (same as unauthenticated)
      expect(prompts).toHaveLength(2);
      
      const titles = prompts.map(p => p.title).sort();
      expect(titles).toEqual(['Alice Public Prompt', 'Bob Public Prompt']);
    });

    it('should prioritize userId over currentUserId when both provided', async () => {
      const [alice, bob] = testUsers;
      
      // When userId is specified, it should get that user's prompts regardless of currentUserId
      const prompts = await getPrompts({
        userId: alice.id,        // Specific user query
        currentUserId: bob.id    // Should be ignored
      });

      // Should return Alice's prompts only (both public and private)
      expect(prompts).toHaveLength(2);
      
      const titles = prompts.map(p => p.title).sort();
      expect(titles).toEqual(['Alice Private Prompt', 'Alice Public Prompt']);
    });
  });

  describe('Regression Prevention', () => {
    it('should prevent the original defect: logged-in users seeing own content', async () => {
      // This test specifically prevents the original issue from returning
      const [alice] = testUsers;
      
      // Make all prompts private to simulate the original problem scenario
      await Prompt.update({ isPublic: false }, { where: {} });
      
      const prompts = await getPrompts({
        currentUserId: alice.id
      });

      // Alice should see both of her own prompts (now both private)
      expect(prompts).toHaveLength(2);
      
      // All should be Alice's own prompts
      prompts.forEach(prompt => {
        expect(prompt.userId).toBe(alice.id);
        expect(prompt.isPublic).toBe(false);
      });
      
      // Should include both her prompts
      const titles = prompts.map(p => p.title).sort();
      expect(titles).toEqual(['Alice Private Prompt', 'Alice Public Prompt']);
    });

    it('should maintain privacy: users cannot see others\' private content', async () => {
      const [alice, bob, charlie] = testUsers;
      
      // Test each user's access
      for (const user of [alice, bob, charlie]) {
        const prompts = await getPrompts({
          currentUserId: user.id
        });

        // Check that user only sees public prompts + their own prompts
        for (const prompt of prompts) {
          const isPublic = prompt.isPublic;
          const isOwn = prompt.userId === user.id;
          
          expect(isPublic || isOwn).toBe(true);
          
          if (!isPublic) {
            // If it's private, it must be the user's own
            expect(prompt.userId).toBe(user.id);
          }
        }
      }
    });
  });

  describe('Performance and Data Integrity', () => {
    it('should return prompts in correct order (updatedAt DESC)', async () => {
      const [alice] = testUsers;
      
      const prompts = await getPrompts({
        currentUserId: alice.id
      });

      // Verify ordering
      for (let i = 0; i < prompts.length - 1; i++) {
        const current = new Date(prompts[i].updatedAt);
        const next = new Date(prompts[i + 1].updatedAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it('should include user information in results', async () => {
      const prompts = await getPrompts({});

      prompts.forEach(prompt => {
        expect(prompt).toHaveProperty('user');
        const promptWithUser = prompt as any; // Type assertion for test
        expect(promptWithUser.user).toHaveProperty('id');
        expect(promptWithUser.user).toHaveProperty('username');
        
        // Security check: password should not be included
        expect(promptWithUser.user.password).toBeUndefined();
      });
    });
  });
});