import { sequelize } from '../config/database';
import { User, Prompt, Category, CategoryScopeType } from '../models';
import { getPromptsByCategory } from '../services/promptService';

describe('Prompt Service - Category Aggregation', () => {
  let testUser: User;
  let category1: Category;
  let category2: Category;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up data
    await Prompt.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
    });

    // Create test categories
    category1 = await Category.create({
      name: 'Web Development',
      description: 'Web development prompts',
      scopeType: CategoryScopeType.PERSONAL,
      scopeId: testUser.id,
      createdBy: testUser.id,
    });

    category2 = await Category.create({
      name: 'Data Analysis',
      description: 'Data analysis prompts',
      scopeType: CategoryScopeType.PERSONAL,
      scopeId: testUser.id,
      createdBy: testUser.id,
    });
  });

  describe('getPromptsByCategory', () => {
    it('should aggregate prompts by category with correct counts', async () => {
      // Create prompts with different categories
      await Prompt.create({
        title: 'Website Builder',
        content: 'Create a responsive website',
        categoryId: category1.id,
        userId: testUser.id,
        isPublic: true,
      });

      await Prompt.create({
        title: 'Landing Page',
        content: 'Create a landing page',
        categoryId: category1.id,
        userId: testUser.id,
        isPublic: true,
      });

      await Prompt.create({
        title: 'Data Analyzer',
        content: 'Analyze data patterns',
        categoryId: category2.id,
        userId: testUser.id,
        isPublic: true,
      });

      // Test aggregation
      const aggregation = await getPromptsByCategory();

      expect(aggregation).toHaveLength(2);
      
      const webDevCategory = aggregation.find(cat => cat.categoryName === 'Web Development');
      const dataCategory = aggregation.find(cat => cat.categoryName === 'Data Analysis');

      expect(webDevCategory).toBeDefined();
      expect(webDevCategory?.count).toBe(2);
      expect(webDevCategory?.categoryId).toBe(category1.id);
      expect(webDevCategory?.prompts).toHaveLength(2);

      expect(dataCategory).toBeDefined();
      expect(dataCategory?.count).toBe(1);
      expect(dataCategory?.categoryId).toBe(category2.id);
      expect(dataCategory?.prompts).toHaveLength(1);
    });

    it('should handle prompts with legacy string categories', async () => {
      // Create prompts with string categories (legacy format)
      await Prompt.create({
        title: 'Legacy Prompt 1',
        content: 'Old format prompt',
        category: 'programming',
        userId: testUser.id,
        isPublic: true,
      });

      await Prompt.create({
        title: 'Legacy Prompt 2',
        content: 'Another old format prompt',
        category: 'programming',
        userId: testUser.id,
        isPublic: true,
      });

      const aggregation = await getPromptsByCategory();

      expect(aggregation).toHaveLength(1);
      expect(aggregation[0].categoryName).toBe('programming');
      expect(aggregation[0].categoryId).toBeNull();
      expect(aggregation[0].count).toBe(2);
    });

    it('should handle mixed category formats (string and ID)', async () => {
      // Create prompts with both formats
      await Prompt.create({
        title: 'New Format Prompt',
        content: 'Prompt with categoryId',
        categoryId: category1.id,
        userId: testUser.id,
        isPublic: true,
      });

      await Prompt.create({
        title: 'Legacy Format Prompt',
        content: 'Prompt with string category',
        category: 'legacy-category',
        userId: testUser.id,
        isPublic: true,
      });

      const aggregation = await getPromptsByCategory();

      expect(aggregation).toHaveLength(2);
      
      const newFormatCategory = aggregation.find(cat => cat.categoryName === 'Web Development');
      const legacyCategory = aggregation.find(cat => cat.categoryName === 'legacy-category');

      expect(newFormatCategory).toBeDefined();
      expect(newFormatCategory?.categoryId).toBe(category1.id);
      expect(newFormatCategory?.count).toBe(1);

      expect(legacyCategory).toBeDefined();
      expect(legacyCategory?.categoryId).toBeNull();
      expect(legacyCategory?.count).toBe(1);
    });

    it('should handle uncategorized prompts', async () => {
      await Prompt.create({
        title: 'Uncategorized Prompt',
        content: 'Prompt without category',
        userId: testUser.id,
        isPublic: true,
      });

      const aggregation = await getPromptsByCategory();

      expect(aggregation).toHaveLength(1);
      expect(aggregation[0].categoryName).toBe('Uncategorized');
      expect(aggregation[0].categoryId).toBeNull();
      expect(aggregation[0].count).toBe(1);
    });

    it('should filter by user when userId is provided', async () => {
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'hashedpassword',
      });

      // Create prompts for different users
      await Prompt.create({
        title: 'User 1 Prompt',
        content: 'Prompt by user 1',
        categoryId: category1.id,
        userId: testUser.id,
        isPublic: true,
      });

      await Prompt.create({
        title: 'User 2 Prompt',
        content: 'Prompt by user 2',
        categoryId: category1.id,
        userId: anotherUser.id,
        isPublic: true,
      });

      const aggregation = await getPromptsByCategory({ userId: testUser.id });

      expect(aggregation).toHaveLength(1);
      expect(aggregation[0].count).toBe(1);
      expect(aggregation[0].prompts?.[0].title).toBe('User 1 Prompt');
    });

    it('should only include public prompts when no userId is provided', async () => {
      await Prompt.create({
        title: 'Public Prompt',
        content: 'Public prompt',
        categoryId: category1.id,
        userId: testUser.id,
        isPublic: true,
      });

      await Prompt.create({
        title: 'Private Prompt',
        content: 'Private prompt',
        categoryId: category1.id,
        userId: testUser.id,
        isPublic: false,
      });

      const aggregation = await getPromptsByCategory();

      expect(aggregation).toHaveLength(1);
      expect(aggregation[0].count).toBe(1);
      expect(aggregation[0].prompts?.[0].title).toBe('Public Prompt');
    });

    it('should exclude prompts from aggregation when includePrompts is false', async () => {
      await Prompt.create({
        title: 'Test Prompt',
        content: 'Test content',
        categoryId: category1.id,
        userId: testUser.id,
        isPublic: true,
      });

      const aggregation = await getPromptsByCategory({ includePrompts: false });

      expect(aggregation).toHaveLength(1);
      expect(aggregation[0].count).toBe(1);
      expect(aggregation[0].prompts).toHaveLength(0);
    });

    it('should sort categories alphabetically by name', async () => {
      await Prompt.create({
        title: 'Zebra Prompt',
        content: 'Last alphabetically',
        category: 'zebra-category',
        userId: testUser.id,
        isPublic: true,
      });

      await Prompt.create({
        title: 'Alpha Prompt',
        content: 'First alphabetically',
        category: 'alpha-category',
        userId: testUser.id,
        isPublic: true,
      });

      const aggregation = await getPromptsByCategory();

      expect(aggregation).toHaveLength(2);
      expect(aggregation[0].categoryName).toBe('alpha-category');
      expect(aggregation[1].categoryName).toBe('zebra-category');
    });

    it('should filter by public status when isPublic is provided', async () => {
      await Prompt.create({
        title: 'Test Prompt 1',
        content: 'Test content 1',
        categoryId: category1.id,
        userId: testUser.id,
        isPublic: true,
      });

      await Prompt.create({
        title: 'Test Prompt 2',
        content: 'Test content 2',
        categoryId: category1.id,
        userId: testUser.id,
        isPublic: true,
      });

      const allAggregation = await getPromptsByCategory({});
      const publicAggregation = await getPromptsByCategory({ isPublic: true });

      expect(allAggregation).toHaveLength(1);
      expect(allAggregation[0].count).toBe(2);

      expect(publicAggregation).toHaveLength(1);
      expect(publicAggregation[0].count).toBe(2);
      expect(publicAggregation[0].prompts).toHaveLength(2);
      const promptTitles = publicAggregation[0].prompts?.map(p => p.title);
      expect(promptTitles).toContain('Test Prompt 1');
      expect(promptTitles).toContain('Test Prompt 2');
    });
  });
});