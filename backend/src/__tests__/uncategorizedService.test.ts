import { sequelize } from '../config/database';
import { User, Category } from '../models';
import { 
  createUncategorizedCategory, 
  getUncategorizedCategory, 
  ensureUncategorizedCategory 
} from '../services/uncategorizedService';
import { CategoryScopeType } from '../models/Category';

describe('Uncategorized Category Service', () => {
  let testUser: User;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clean up before each test
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create a test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('createUncategorizedCategory', () => {
    it('should create an uncategorized category for a user', async () => {
      const category = await createUncategorizedCategory(testUser.id);

      expect(category).toBeDefined();
      expect(category.name).toBe('未分类');
      expect(category.description).toBe('默认分类，用于存放未分类的提示词');
      expect(category.scopeType).toBe(CategoryScopeType.PERSONAL);
      expect(category.scopeId).toBe(testUser.id);
      expect(category.createdBy).toBe(testUser.id);
      expect(category.color).toBe('#6b7280');
      expect(category.isActive).toBe(true);
    });

    it('should return existing uncategorized category if one already exists', async () => {
      // Create first category
      const category1 = await createUncategorizedCategory(testUser.id);
      
      // Try to create again
      const category2 = await createUncategorizedCategory(testUser.id);

      expect(category1.id).toBe(category2.id);
      expect(category1.name).toBe(category2.name);

      // Verify only one category exists in database
      const count = await Category.count({
        where: {
          name: '未分类',
          scopeType: CategoryScopeType.PERSONAL,
          scopeId: testUser.id
        }
      });
      expect(count).toBe(1);
    });

    it('should create separate uncategorized categories for different users', async () => {
      // Create second user
      const user2 = await User.create({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'hashedpassword'
      });

      const category1 = await createUncategorizedCategory(testUser.id);
      const category2 = await createUncategorizedCategory(user2.id);

      expect(category1.id).not.toBe(category2.id);
      expect(category1.scopeId).toBe(testUser.id);
      expect(category2.scopeId).toBe(user2.id);
      expect(category1.createdBy).toBe(testUser.id);
      expect(category2.createdBy).toBe(user2.id);
    });
  });

  describe('getUncategorizedCategory', () => {
    it('should return the uncategorized category for a user', async () => {
      // Create category first
      const createdCategory = await createUncategorizedCategory(testUser.id);
      
      // Get it back
      const retrievedCategory = await getUncategorizedCategory(testUser.id);

      expect(retrievedCategory).toBeDefined();
      expect(retrievedCategory!.id).toBe(createdCategory.id);
      expect(retrievedCategory!.name).toBe('未分类');
      expect(retrievedCategory!.scopeId).toBe(testUser.id);
    });

    it('should return null if no uncategorized category exists', async () => {
      const category = await getUncategorizedCategory(testUser.id);
      expect(category).toBeNull();
    });

    it('should not return uncategorized category from other users', async () => {
      // Create second user
      const user2 = await User.create({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'hashedpassword'
      });

      // Create category for user1
      await createUncategorizedCategory(testUser.id);
      
      // Try to get it for user2
      const category = await getUncategorizedCategory(user2.id);
      expect(category).toBeNull();
    });

    it('should not return inactive uncategorized categories', async () => {
      // Create category
      const category = await createUncategorizedCategory(testUser.id);
      
      // Deactivate it
      await category.update({ isActive: false });
      
      // Try to get it
      const retrievedCategory = await getUncategorizedCategory(testUser.id);
      expect(retrievedCategory).toBeNull();
    });
  });

  describe('ensureUncategorizedCategory', () => {
    it('should create uncategorized category if it does not exist', async () => {
      const category = await ensureUncategorizedCategory(testUser.id);

      expect(category).toBeDefined();
      expect(category.name).toBe('未分类');
      expect(category.scopeId).toBe(testUser.id);

      // Verify it was actually created in database
      const dbCategory = await Category.findByPk(category.id);
      expect(dbCategory).toBeDefined();
    });

    it('should return existing uncategorized category if it exists', async () => {
      // Create category first
      const createdCategory = await createUncategorizedCategory(testUser.id);
      
      // Ensure it exists (should return the same one)
      const ensuredCategory = await ensureUncategorizedCategory(testUser.id);

      expect(ensuredCategory.id).toBe(createdCategory.id);

      // Verify only one category exists in database
      const count = await Category.count({
        where: {
          name: '未分类',
          scopeType: CategoryScopeType.PERSONAL,
          scopeId: testUser.id
        }
      });
      expect(count).toBe(1);
    });
  });

  describe('Integration with Category Service', () => {
    it('should prevent deletion of uncategorized category', async () => {
      const { CategoryService } = await import('../services/categoryService');
      const categoryService = new CategoryService();

      // Create uncategorized category
      const category = await createUncategorizedCategory(testUser.id);

      // Try to delete it
      await expect(
        categoryService.deleteCategory(category.id, testUser.id)
      ).rejects.toThrow('Cannot delete the default uncategorized category');

      // Verify it still exists
      const stillExists = await Category.findByPk(category.id);
      expect(stillExists).toBeDefined();
      expect(stillExists!.isActive).toBe(true);
    });

    it('should allow deletion of non-uncategorized categories', async () => {
      const { CategoryService } = await import('../services/categoryService');
      const categoryService = new CategoryService();

      // Create a regular category
      const category = await Category.create({
        name: '工作分类',
        description: '工作相关的分类',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: testUser.id,
        createdBy: testUser.id,
        isActive: true
      });

      // Delete it (should work)
      await categoryService.deleteCategory(category.id, testUser.id);

      // Verify it was deleted (soft delete)
      const deletedCategory = await Category.findByPk(category.id);
      expect(deletedCategory).toBeDefined();
      expect(deletedCategory!.isActive).toBe(false);
    });
  });
});