import { Category, CategoryScopeType } from '../models/Category';
import { User, Team, TeamMember, TeamRole } from '../models';
import { Op } from 'sequelize';

export interface CreateCategoryData {
  name: string;
  description?: string;
  scopeType: CategoryScopeType;
  scopeId?: number; // userId for personal, teamId for team, undefined for public
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
    } else if (scopeType === CategoryScopeType.PUBLIC) {
      finalScopeId = undefined; // 公开分类不需要 scopeId
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
    // 获取用户所属的团队ID列表
    const teamMemberships = await TeamMember.findAll({
      where: { 
        userId,
        isActive: true 
      },
      attributes: ['teamId'],
    });
    
    const teamIds = teamMemberships.map(tm => tm.teamId);

    // 构建查询条件：个人分类 + 团队分类 + 公开分类
    const whereConditions: any[] = [
      // 个人分类（用户自己的）
      {
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: userId,
        isActive: true,
      },
      // 公开分类
      {
        scopeType: CategoryScopeType.PUBLIC,
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
        ['scopeType', 'ASC'], // personal < team < public
        ['name', 'ASC'],
      ],
    });

    return categories;
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
        
      case CategoryScopeType.PUBLIC:
        return true;
        
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
    // 对于 PUBLIC 类型，不需要 scopeId 条件

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
        
      case CategoryScopeType.PUBLIC:
        // 公开分类：只有创建者或系统管理员可以管理（暂时只允许创建者）
        return category.createdBy === userId;
        
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