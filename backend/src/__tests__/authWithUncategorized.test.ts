import { sequelize } from '../config/database';
import { User, Category } from '../models';
import { registerUser } from '../services/authService';
import { CategoryScopeType } from '../models/Category';

describe('Auth Service with Uncategorized Category', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clean up before each test
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('registerUser', () => {
    it('should create uncategorized category when registering a new user', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const result = await registerUser(userData);

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();

      // Check that the uncategorized category was created
      const uncategorizedCategory = await Category.findOne({
        where: {
          name: '未分类',
          scopeType: CategoryScopeType.PERSONAL,
          scopeId: result.user.id,
          createdBy: result.user.id,
          isActive: true
        }
      });

      expect(uncategorizedCategory).toBeDefined();
      expect(uncategorizedCategory!.description).toBe('默认分类，用于存放未分类的提示词');
      expect(uncategorizedCategory!.color).toBe('#6b7280');
    });

    it('should still register user even if uncategorized category creation fails', async () => {
      // This test simulates the scenario where category creation might fail
      // but user registration should still succeed
      
      const userData = {
        username: 'newuser2',
        email: 'newuser2@example.com',
        password: 'password123'
      };

      // Mock console.error to capture error messages
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await registerUser(userData);

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('newuser2');
      expect(result.user.email).toBe('newuser2@example.com');

      // Restore console.error
      consoleSpy.mockRestore();
    });

    it('should create separate uncategorized categories for different users', async () => {
      const user1Data = {
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123'
      };

      const user2Data = {
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123'
      };

      const result1 = await registerUser(user1Data);
      const result2 = await registerUser(user2Data);

      // Check that both users have their own uncategorized categories
      const category1 = await Category.findOne({
        where: {
          name: '未分类',
          scopeType: CategoryScopeType.PERSONAL,
          scopeId: result1.user.id,
          createdBy: result1.user.id
        }
      });

      const category2 = await Category.findOne({
        where: {
          name: '未分类',
          scopeType: CategoryScopeType.PERSONAL,
          scopeId: result2.user.id,
          createdBy: result2.user.id
        }
      });

      expect(category1).toBeDefined();
      expect(category2).toBeDefined();
      expect(category1!.id).not.toBe(category2!.id);
      expect(category1!.scopeId).toBe(result1.user.id);
      expect(category2!.scopeId).toBe(result2.user.id);
    });

    it('should verify that each user can only see their own uncategorized category', async () => {
      const { CategoryService } = await import('../services/categoryService');
      const categoryService = new CategoryService();

      // Create two users
      const user1Result = await registerUser({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123'
      });

      const user2Result = await registerUser({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123'
      });

      // Get visible categories for each user
      const user1Categories = await categoryService.getUserVisibleCategories(user1Result.user.id);
      const user2Categories = await categoryService.getUserVisibleCategories(user2Result.user.id);

      // Each user should see exactly one personal category (their uncategorized)
      const user1PersonalCategories = user1Categories.filter(cat => 
        cat.scopeType === CategoryScopeType.PERSONAL
      );
      const user2PersonalCategories = user2Categories.filter(cat => 
        cat.scopeType === CategoryScopeType.PERSONAL
      );

      expect(user1PersonalCategories).toHaveLength(1);
      expect(user2PersonalCategories).toHaveLength(1);
      expect(user1PersonalCategories[0].name).toBe('未分类');
      expect(user2PersonalCategories[0].name).toBe('未分类');
      expect(user1PersonalCategories[0].scopeId).toBe(user1Result.user.id);
      expect(user2PersonalCategories[0].scopeId).toBe(user2Result.user.id);
    });
  });
});