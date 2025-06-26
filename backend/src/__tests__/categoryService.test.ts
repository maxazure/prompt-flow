import { sequelize } from '../config/database';
import { Category, CategoryScopeType } from '../models/Category';
import { User, Team, TeamMember, TeamRole } from '../models';
import { CategoryService } from '../services/categoryService';

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let testUser1: User;
  let testUser2: User;
  let testTeam: Team;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    categoryService = new CategoryService();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // 清理数据
    await Category.destroy({ where: {} });
    await TeamMember.destroy({ where: {} });
    await Team.destroy({ where: {} });
    await User.destroy({ where: {} });

    // 创建测试用户
    testUser1 = await User.create({
      username: 'user1',
      email: 'user1@example.com',
      password: 'hashedpassword',
    });

    testUser2 = await User.create({
      username: 'user2',
      email: 'user2@example.com',
      password: 'hashedpassword',
    });

    // 创建测试团队
    testTeam = await Team.create({
      name: 'Test Team',
      description: 'Test team for category testing',
      ownerId: testUser1.id,
    });

    // 添加团队成员
    await TeamMember.create({
      teamId: testTeam.id,
      userId: testUser1.id,
      role: TeamRole.OWNER,
    });

    await TeamMember.create({
      teamId: testTeam.id,
      userId: testUser2.id,
      role: TeamRole.EDITOR,
    });
  });

  describe('createCategory', () => {
    it('should create a personal category successfully', async () => {
      const categoryData = {
        name: '网站建设',
        description: '个人网站开发相关',
        scopeType: CategoryScopeType.PERSONAL,
        color: '#FF5733',
      };

      const category = await categoryService.createCategory(categoryData, testUser1.id);

      expect(category.name).toBe('网站建设');
      expect(category.scopeType).toBe(CategoryScopeType.PERSONAL);
      expect(category.scopeId).toBe(testUser1.id);
      expect(category.createdBy).toBe(testUser1.id);
      expect(category.color).toBe('#FF5733');
    });

    it('should create a team category successfully', async () => {
      const categoryData = {
        name: '策划',
        description: '团队策划相关',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
      };

      const category = await categoryService.createCategory(categoryData, testUser1.id);

      expect(category.name).toBe('策划');
      expect(category.scopeType).toBe(CategoryScopeType.TEAM);
      expect(category.scopeId).toBe(testTeam.id);
      expect(category.createdBy).toBe(testUser1.id);
    });

    it('should create a public category successfully', async () => {
      const categoryData = {
        name: '编程',
        description: '公开编程分类',
        scopeType: CategoryScopeType.PUBLIC,
      };

      const category = await categoryService.createCategory(categoryData, testUser1.id);

      expect(category.name).toBe('编程');
      expect(category.scopeType).toBe(CategoryScopeType.PUBLIC);
      expect(category.scopeId).toBeUndefined();
      expect(category.createdBy).toBe(testUser1.id);
    });

    it('should prevent duplicate personal category names for same user', async () => {
      await categoryService.createCategory({
        name: '论文',
        scopeType: CategoryScopeType.PERSONAL,
      }, testUser1.id);

      await expect(
        categoryService.createCategory({
          name: '论文',
          scopeType: CategoryScopeType.PERSONAL,
        }, testUser1.id)
      ).rejects.toThrow('Category name already exists in this scope');
    });

    it('should prevent duplicate team category names for same team', async () => {
      await categoryService.createCategory({
        name: '开发',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
      }, testUser1.id);

      await expect(
        categoryService.createCategory({
          name: '开发',
          scopeType: CategoryScopeType.TEAM,
          scopeId: testTeam.id,
        }, testUser2.id)
      ).rejects.toThrow('Category name already exists in this scope');
    });

    it('should allow same category name for different users (personal scope)', async () => {
      await categoryService.createCategory({
        name: '论文',
        scopeType: CategoryScopeType.PERSONAL,
      }, testUser1.id);

      const category2 = await categoryService.createCategory({
        name: '论文',
        scopeType: CategoryScopeType.PERSONAL,
      }, testUser2.id);

      expect(category2.name).toBe('论文');
      expect(category2.scopeId).toBe(testUser2.id);
    });

    it('should validate team permissions for team categories', async () => {
      const nonMemberUser = await User.create({
        username: 'nonmember',
        email: 'nonmember@example.com',
        password: 'hashedpassword',
      });

      await expect(
        categoryService.createCategory({
          name: '测试',
          scopeType: CategoryScopeType.TEAM,
          scopeId: testTeam.id,
        }, nonMemberUser.id)
      ).rejects.toThrow('User does not have permission to create team categories');
    });
  });

  describe('getUserVisibleCategories', () => {
    beforeEach(async () => {
      // 创建各种类型的分类用于测试
      await categoryService.createCategory({
        name: '网站建设',
        scopeType: CategoryScopeType.PERSONAL,
      }, testUser1.id);

      await categoryService.createCategory({
        name: '论文',
        scopeType: CategoryScopeType.PERSONAL,
      }, testUser1.id);

      await categoryService.createCategory({
        name: '美食',
        scopeType: CategoryScopeType.PERSONAL,
      }, testUser2.id);

      await categoryService.createCategory({
        name: '策划',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
      }, testUser1.id);

      await categoryService.createCategory({
        name: '开发',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
      }, testUser2.id);

      await categoryService.createCategory({
        name: '编程',
        scopeType: CategoryScopeType.PUBLIC,
      }, testUser1.id);
    });

    it('should return user personal, team, and public categories', async () => {
      const categories = await categoryService.getUserVisibleCategories(testUser1.id);

      const categoryNames = categories.map(c => c.name);
      expect(categoryNames).toContain('网站建设'); // user1 personal
      expect(categoryNames).toContain('论文'); // user1 personal
      expect(categoryNames).toContain('策划'); // team category
      expect(categoryNames).toContain('开发'); // team category
      expect(categoryNames).toContain('编程'); // public category
      expect(categoryNames).not.toContain('美食'); // user2 personal, not visible to user1
    });

    it('should return categories grouped by scope type', async () => {
      const categories = await categoryService.getUserVisibleCategories(testUser1.id);

      const personalCategories = categories.filter(c => 
        c.scopeType === CategoryScopeType.PERSONAL && c.scopeId === testUser1.id
      );
      const teamCategories = categories.filter(c => 
        c.scopeType === CategoryScopeType.TEAM
      );
      const publicCategories = categories.filter(c => 
        c.scopeType === CategoryScopeType.PUBLIC
      );

      expect(personalCategories).toHaveLength(2); // 网站建设, 论文
      expect(teamCategories).toHaveLength(2); // 策划, 开发
      expect(publicCategories).toHaveLength(1); // 编程
    });

    it('should handle user with no team memberships', async () => {
      const soloUser = await User.create({
        username: 'solo',
        email: 'solo@example.com',
        password: 'hashedpassword',
      });

      await categoryService.createCategory({
        name: '独立工作',
        scopeType: CategoryScopeType.PERSONAL,
      }, soloUser.id);

      const categories = await categoryService.getUserVisibleCategories(soloUser.id);

      const categoryNames = categories.map(c => c.name);
      expect(categoryNames).toContain('独立工作'); // personal
      expect(categoryNames).toContain('编程'); // public
      expect(categoryNames).not.toContain('策划'); // team category, not accessible
    });
  });

  describe('updateCategory', () => {
    let personalCategory: Category;
    let teamCategory: Category;

    beforeEach(async () => {
      personalCategory = await categoryService.createCategory({
        name: '原始名称',
        description: '原始描述',
        scopeType: CategoryScopeType.PERSONAL,
      }, testUser1.id);

      teamCategory = await categoryService.createCategory({
        name: '团队分类',
        description: '团队描述',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
      }, testUser1.id);
    });

    it('should update personal category by owner', async () => {
      const updatedCategory = await categoryService.updateCategory(
        personalCategory.id,
        {
          name: '更新名称',
          description: '更新描述',
          color: '#00FF00',
        },
        testUser1.id
      );

      expect(updatedCategory.name).toBe('更新名称');
      expect(updatedCategory.description).toBe('更新描述');
      expect(updatedCategory.color).toBe('#00FF00');
    });

    it('should prevent non-owner from updating personal category', async () => {
      await expect(
        categoryService.updateCategory(
          personalCategory.id,
          { name: '黑客更新' },
          testUser2.id
        )
      ).rejects.toThrow('Permission denied');
    });

    it('should allow team admin to update team category', async () => {
      const updatedCategory = await categoryService.updateCategory(
        teamCategory.id,
        { name: '团队更新' },
        testUser2.id // EDITOR role
      );

      expect(updatedCategory.name).toBe('团队更新');
    });

    it('should prevent duplicate names in same scope', async () => {
      await categoryService.createCategory({
        name: '已存在',
        scopeType: CategoryScopeType.PERSONAL,
      }, testUser1.id);

      await expect(
        categoryService.updateCategory(
          personalCategory.id,
          { name: '已存在' },
          testUser1.id
        )
      ).rejects.toThrow('Category name already exists in this scope');
    });
  });

  describe('deleteCategory', () => {
    let personalCategory: Category;
    let teamCategory: Category;

    beforeEach(async () => {
      personalCategory = await categoryService.createCategory({
        name: '待删除个人',
        scopeType: CategoryScopeType.PERSONAL,
      }, testUser1.id);

      teamCategory = await categoryService.createCategory({
        name: '待删除团队',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
      }, testUser1.id);
    });

    it('should delete personal category by owner', async () => {
      await categoryService.deleteCategory(personalCategory.id, testUser1.id);

      const deletedCategory = await Category.findByPk(personalCategory.id);
      expect(deletedCategory?.isActive).toBe(false);
    });

    it('should prevent non-owner from deleting personal category', async () => {
      await expect(
        categoryService.deleteCategory(personalCategory.id, testUser2.id)
      ).rejects.toThrow('Permission denied');
    });

    it('should allow team admin to delete team category', async () => {
      await categoryService.deleteCategory(teamCategory.id, testUser2.id);

      const deletedCategory = await Category.findByPk(teamCategory.id);
      expect(deletedCategory?.isActive).toBe(false);
    });
  });

  describe('canUserUseCategory', () => {
    let personalCategory: Category;
    let teamCategory: Category;
    let publicCategory: Category;

    beforeEach(async () => {
      personalCategory = await categoryService.createCategory({
        name: '个人分类',
        scopeType: CategoryScopeType.PERSONAL,
      }, testUser1.id);

      teamCategory = await categoryService.createCategory({
        name: '团队分类',
        scopeType: CategoryScopeType.TEAM,
        scopeId: testTeam.id,
      }, testUser1.id);

      publicCategory = await categoryService.createCategory({
        name: '公开分类',
        scopeType: CategoryScopeType.PUBLIC,
      }, testUser1.id);
    });

    it('should allow user to use their own personal category', async () => {
      const canUse = await categoryService.canUserUseCategory(testUser1.id, personalCategory.id);
      expect(canUse).toBe(true);
    });

    it('should deny user access to other user personal category', async () => {
      const canUse = await categoryService.canUserUseCategory(testUser2.id, personalCategory.id);
      expect(canUse).toBe(false);
    });

    it('should allow team member to use team category', async () => {
      const canUse1 = await categoryService.canUserUseCategory(testUser1.id, teamCategory.id);
      const canUse2 = await categoryService.canUserUseCategory(testUser2.id, teamCategory.id);
      
      expect(canUse1).toBe(true);
      expect(canUse2).toBe(true);
    });

    it('should allow anyone to use public category', async () => {
      const outsideUser = await User.create({
        username: 'outsider',
        email: 'outsider@example.com',
        password: 'hashedpassword',
      });

      const canUse = await categoryService.canUserUseCategory(outsideUser.id, publicCategory.id);
      expect(canUse).toBe(true);
    });
  });
});