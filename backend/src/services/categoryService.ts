import { Category, CategoryScopeType } from '../models/Category';
import { User, Team, TeamMember, TeamRole, Prompt } from '../models';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { ensureUncategorizedCategory } from './uncategorizedService';

export interface CreateCategoryData {
  name: string;
  description?: string;
  scopeType: CategoryScopeType;
  scopeId?: number; // userId for personal, teamId for team
  color?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
}

export class CategoryService {
  async createCategory(data: CreateCategoryData, createdBy: number): Promise<Category> {
    const { name, description, scopeType, scopeId, color } = data;

    // 设置正确的 scopeId
    let finalScopeId: number | undefined;
    if (scopeType === CategoryScopeType.PERSONAL) {
      finalScopeId = createdBy; // 个人分类的 scopeId 是创建者的 userId
    } else if (scopeType === CategoryScopeType.TEAM) {
      if (!scopeId) {
        throw new Error('Team ID is required for team categories');
      }
      finalScopeId = scopeId;
      
      // 验证用户是否有权限在此团队创建分类
      const hasPermission = await this.canUserManageTeamCategories(createdBy, scopeId);
      if (!hasPermission) {
        throw new Error('User does not have permission to create team categories');
      }
    }

    // 检查重复名称
    await this.checkDuplicateName(name, scopeType, finalScopeId, createdBy);

    // 创建分类
    const category = await Category.create({
      name,
      description,
      scopeType,
      scopeId: finalScopeId,
      createdBy,
      color,
      isActive: true,
    });

    return category;
  }

  async getUserVisibleCategories(userId: number): Promise<Category[]> {
    // 确保用户有未分类分类
    await ensureUncategorizedCategory(userId);

    // 获取用户所属的团队ID列表
    const teamMemberships = await TeamMember.findAll({
      where: { 
        userId,
        isActive: true 
      },
      attributes: ['teamId'],
    });
    
    const teamIds = teamMemberships.map(tm => tm.teamId);

    // 构建查询条件：个人分类 + 团队分类
    const whereConditions: any[] = [
      // 个人分类（用户自己的）
      {
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: userId,
        isActive: true,
      },
    ];

    // 如果用户属于团队，添加团队分类条件
    if (teamIds.length > 0) {
      whereConditions.push({
        scopeType: CategoryScopeType.TEAM,
        scopeId: { [Op.in]: teamIds },
        isActive: true,
      });
    }

    const categories = await Category.findAll({
      where: {
        [Op.or]: whereConditions,
      },
      order: [
        // 未分类分类排在最前面
        [
          sequelize.literal(`CASE WHEN name = '未分类' THEN 0 ELSE 1 END`),
          'ASC'
        ],
        ['scopeType', 'ASC'], // personal < team
        ['name', 'ASC'],
      ],
    });

    // 为每个分类添加提示词计数
    const categoriesWithCount = await this.addPromptCountToCategories(categories, userId);
    
    return categoriesWithCount;
  }

  /**
   * 为分类列表添加提示词计数
   * @param categories 分类列表
   * @param userId 当前用户ID（用于权限过滤）
   * @returns 带有promptCount字段的分类列表
   */
  async addPromptCountToCategories(categories: Category[], userId: number): Promise<any[]> {
    const categoryIds = categories.map(cat => cat.id);
    
    if (categoryIds.length === 0) {
      return [];
    }

    try {
      // 优化的批量查询：根据分类类型进行不同的计数逻辑
      const personalCategoryIds = categories
        .filter(cat => cat.scopeType === CategoryScopeType.PERSONAL && cat.scopeId === userId)
        .map(cat => cat.id);
      
      const teamCategoryIds = categories
        .filter(cat => cat.scopeType === CategoryScopeType.TEAM)
        .map(cat => cat.id);

      // 创建分类ID到计数的映射
      const countMap = new Map<number, number>();

      // 个人分类：计算用户可见的提示词（公开的 + 自己的）
      if (personalCategoryIds.length > 0) {
        const personalCounts = await this.getPromptCountsForCategories(
          personalCategoryIds, 
          {
            [Op.or]: [
              { isPublic: true },    // 所有公开提示词
              { userId }             // 用户自己的提示词（包括私有）
            ]
          }
        );
        personalCounts.forEach((item: any) => {
          countMap.set(item.categoryId, parseInt(item.count) || 0);
        });
      }

      // 团队分类：计算用户可见的提示词（公开的 + 自己的）
      if (teamCategoryIds.length > 0) {
        const teamCounts = await this.getPromptCountsForCategories(
          teamCategoryIds, 
          { 
            [Op.or]: [
              { isPublic: true },    // 所有公开提示词
              { userId }             // 用户自己的提示词（包括私有）
            ]
          }
        );
        teamCounts.forEach((item: any) => {
          countMap.set(item.categoryId, parseInt(item.count) || 0);
        });
      }

      // 为每个分类添加promptCount字段
      return categories.map(category => ({
        ...category.toJSON(),
        promptCount: countMap.get(category.id) || 0
      }));

    } catch (error) {
      console.error('Error calculating prompt counts for categories:', error);
      // 发生错误时，返回计数为0的分类列表
      return categories.map(category => ({
        ...category.toJSON(),
        promptCount: 0
      }));
    }
  }

  /**
   * 为指定分类获取提示词计数的通用方法
   * @param categoryIds 分类ID列表
   * @param whereCondition 额外的查询条件
   * @returns 包含计数的结果
   */
  private async getPromptCountsForCategories(
    categoryIds: number[], 
    whereCondition: any
  ): Promise<any[]> {
    return await Prompt.findAll({
      attributes: [
        'categoryId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        categoryId: { [Op.in]: categoryIds },
        ...whereCondition
      },
      group: ['categoryId'],
      raw: true
    });
  }

  async getCategoryStats(): Promise<any> {
    const totalCategories = await Category.count({ where: { isActive: true } });
    const personalCategories = await Category.count({ 
      where: { 
        scopeType: CategoryScopeType.PERSONAL, 
        isActive: true 
      } 
    });
    const teamCategories = await Category.count({ 
      where: { 
        scopeType: CategoryScopeType.TEAM, 
        isActive: true 
      } 
    });

    return {
      total: totalCategories,
      personal: personalCategories,
      team: teamCategories,
    };
  }

  async updateCategory(
    categoryId: number, 
    data: UpdateCategoryData, 
    userId: number
  ): Promise<Category> {
    const category = await Category.findByPk(categoryId);
    if (!category || !category.isActive) {
      throw new Error('Category not found');
    }

    // 检查权限
    const hasPermission = await this.canUserManageCategory(userId, category);
    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    // 如果更新名称，检查重复
    if (data.name && data.name !== category.name) {
      await this.checkDuplicateName(data.name, category.scopeType, category.scopeId, userId, categoryId);
    }

    // 更新分类
    await category.update(data);
    
    return category;
  }

  async deleteCategory(categoryId: number, userId: number): Promise<void> {
    const category = await Category.findByPk(categoryId);
    if (!category || !category.isActive) {
      throw new Error('Category not found');
    }

    // 检查是否是未分类分类，不允许删除
    if (category.name === '未分类' && 
        category.scopeType === CategoryScopeType.PERSONAL && 
        category.scopeId === userId) {
      throw new Error('Cannot delete the default uncategorized category');
    }

    // 检查权限
    const hasPermission = await this.canUserManageCategory(userId, category);
    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    // 软删除（设置为不活跃）
    await category.update({ isActive: false });
  }

  async canUserUseCategory(userId: number, categoryId: number): Promise<boolean> {
    const category = await Category.findByPk(categoryId);
    if (!category || !category.isActive) {
      return false;
    }

    switch (category.scopeType) {
      case CategoryScopeType.PERSONAL:
        return category.scopeId === userId;
        
      case CategoryScopeType.TEAM:
        if (!category.scopeId) return false;
        return await this.isUserTeamMember(userId, category.scopeId);
        
      default:
        return false;
    }
  }

  async getCategoriesByIds(categoryIds: number[]): Promise<Category[]> {
    return await Category.findAll({
      where: {
        id: { [Op.in]: categoryIds },
        isActive: true,
      },
    });
  }

  // 私有辅助方法
  private async checkDuplicateName(
    name: string, 
    scopeType: CategoryScopeType, 
    scopeId: number | undefined, 
    userId: number,
    excludeId?: number
  ): Promise<void> {
    const whereCondition: any = {
      name,
      scopeType,
      isActive: true,
    };

    if (excludeId) {
      whereCondition.id = { [Op.ne]: excludeId };
    }

    if (scopeType === CategoryScopeType.PERSONAL) {
      whereCondition.scopeId = userId;
    } else if (scopeType === CategoryScopeType.TEAM) {
      whereCondition.scopeId = scopeId;
    }

    const existingCategory = await Category.findOne({
      where: whereCondition,
    });

    if (existingCategory) {
      throw new Error('Category name already exists in this scope');
    }
  }

  private async canUserManageCategory(userId: number, category: Category): Promise<boolean> {
    switch (category.scopeType) {
      case CategoryScopeType.PERSONAL:
        // 只有创建者可以管理个人分类
        return category.createdBy === userId;
        
      case CategoryScopeType.TEAM:
        // 团队分类：创建者或团队管理员可以管理
        if (category.createdBy === userId) return true;
        if (!category.scopeId) return false;
        return await this.canUserManageTeamCategories(userId, category.scopeId);
        
      default:
        return false;
    }
  }

  private async canUserManageTeamCategories(userId: number, teamId: number): Promise<boolean> {
    const membership = await TeamMember.findOne({
      where: {
        userId,
        teamId,
        isActive: true,
      },
    });

    if (!membership) return false;

    // EDITOR 及以上角色可以管理团队分类
    return membership.role === TeamRole.EDITOR || 
           membership.role === TeamRole.ADMIN || 
           membership.role === TeamRole.OWNER;
  }

  private async isUserTeamMember(userId: number, teamId: number): Promise<boolean> {
    const membership = await TeamMember.findOne({
      where: {
        userId,
        teamId,
        isActive: true,
      },
    });

    return !!membership;
  }
}