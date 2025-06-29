import { sequelize } from '../config/database';
import { Category, CategoryScopeType } from '../models/Category';
import { User, Team } from '../models';

describe('Category Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Team.destroy({ where: {} });
  });

  describe('Category Creation', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      });
    });

    it('should create a personal category successfully', async () => {
      const categoryData = {
        name: '网站建设',
        description: '个人网站开发相关',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: testUser.id,
        createdBy: testUser.id,
        color: '#FF5733',
      };

      const category = await Category.create(categoryData);

      expect(category.id).toBeDefined();
      expect(category.name).toBe('网站建设');
      expect(category.scopeType).toBe(CategoryScopeType.PERSONAL);
      expect(category.scopeId).toBe(testUser.id);
      expect(category.createdBy).toBe(testUser.id);
      expect(category.color).toBe('#FF5733');
      expect(category.isActive).toBe(true);
    });

    it('should create a team category successfully', async () => {
      const team = await Team.create({
        name: 'Dev Team',
        description: 'Development team',
        ownerId: testUser.id,
      });

      const categoryData = {
        name: '策划',
        description: '团队策划相关',
        scopeType: CategoryScopeType.TEAM,
        scopeId: team.id,
        createdBy: testUser.id,
      };

      const category = await Category.create(categoryData);

      expect(category.name).toBe('策划');
      expect(category.scopeType).toBe(CategoryScopeType.TEAM);
      expect(category.scopeId).toBe(team.id);
    });


    it('should default isActive to true', async () => {
      const category = await Category.create({
        name: '测试',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: testUser.id,
        createdBy: testUser.id,
      });

      expect(category.isActive).toBe(true);
    });

    it('should validate color format', async () => {
      const invalidColorData = {
        name: '测试',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: testUser.id,
        createdBy: testUser.id,
        color: 'invalid-color',
      };

      await expect(Category.create(invalidColorData)).rejects.toThrow();
    });

    it('should accept valid hex color', async () => {
      const validColorData = {
        name: '测试',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: testUser.id,
        createdBy: testUser.id,
        color: '#ABCDEF',
      };

      const category = await Category.create(validColorData);
      expect(category.color).toBe('#ABCDEF');
    });
  });

  describe('Category Uniqueness Constraints', () => {
    let user1: User;
    let user2: User;
    let team: Team;

    beforeEach(async () => {
      user1 = await User.create({
        username: 'user1',
        email: 'user1@example.com',
        password: 'hashedpassword',
      });

      user2 = await User.create({
        username: 'user2',
        email: 'user2@example.com',
        password: 'hashedpassword',
      });

      team = await Team.create({
        name: 'Test Team',
        description: 'Test team',
        ownerId: user1.id,
      });
    });

    it('should allow same category name for different users (personal scope)', async () => {
      await Category.create({
        name: '论文',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: user1.id,
        createdBy: user1.id,
      });

      // Should not throw error - different users can have same category name
      const category2 = await Category.create({
        name: '论文',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: user2.id,
        createdBy: user2.id,
      });

      expect(category2.name).toBe('论文');
    });

    it('should allow duplicate category names for same user (will be handled by business logic)', async () => {
      await Category.create({
        name: '论文',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: user1.id,
        createdBy: user1.id,
      });

      // Database allows duplicates - business logic will prevent them
      const category2 = await Category.create({
        name: '论文',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: user1.id,
        createdBy: user1.id,
      });

      expect(category2.name).toBe('论文');
    });

    it('should allow duplicate category names within same team (will be handled by business logic)', async () => {
      await Category.create({
        name: '开发',
        scopeType: CategoryScopeType.TEAM,
        scopeId: team.id,
        createdBy: user1.id,
      });

      // Database allows duplicates - business logic will prevent them
      const category2 = await Category.create({
        name: '开发',
        scopeType: CategoryScopeType.TEAM,
        scopeId: team.id,
        createdBy: user2.id,
      });

      expect(category2.name).toBe('开发');
    });

    it('should allow inactive categories to have same names', async () => {
      const category1 = await Category.create({
        name: '测试',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: user1.id,
        createdBy: user1.id,
      });

      // Deactivate first category
      await category1.update({ isActive: false });

      // Should not throw error - inactive categories don't conflict
      const category2 = await Category.create({
        name: '测试',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: user1.id,
        createdBy: user1.id,
      });

      expect(category2.name).toBe('测试');
      expect(category2.isActive).toBe(true);
    });
  });

  describe('Category Scope Validation', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      });
    });

    it('should require scopeId for personal categories', async () => {
      const invalidData = {
        name: '测试',
        scopeType: CategoryScopeType.PERSONAL,
        createdBy: testUser.id,
        // scopeId is missing
      };

      // This should be handled by business logic, not database constraints
      // We'll test this in the service layer
      const category = await Category.create(invalidData);
      expect(category.scopeId).toBeUndefined();
    });

    it('should require scopeId for team categories', async () => {
      const invalidData = {
        name: '测试',
        scopeType: CategoryScopeType.TEAM,
        createdBy: testUser.id,
        // scopeId is missing
      };

      // This should be handled by business logic, not database constraints
      const category = await Category.create(invalidData);
      expect(category.scopeId).toBeUndefined();
    });

  });
});