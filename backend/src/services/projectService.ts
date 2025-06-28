import { Op } from 'sequelize';
import { Project, User, Team, TeamMember } from '../models';

interface CreateProjectData {
  name: string;
  description?: string;
  background: string;
  userId: number;
  teamId?: number;
  isPublic?: boolean;
}

interface UpdateProjectData {
  name?: string;
  description?: string;
  background?: string;
  isPublic?: boolean;
}

interface ProjectQueryOptions {
  teamId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export class ProjectService {
  
  async createProject(data: CreateProjectData): Promise<Project> {
    const project = await Project.create({
      name: data.name,
      description: data.description,
      background: data.background,
      userId: data.userId,
      teamId: data.teamId,
      isPublic: data.isPublic || false,
    });

    return project;
  }

  async getProjectById(id: number): Promise<Project | null> {
    return await Project.findOne({
      where: { 
        id,
        isActive: true 
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
        },
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name'],
        }
      ]
    });
  }

  async getUserProjects(userId: number, options: ProjectQueryOptions = {}) {
    const { teamId, search, limit = 20, offset = 0 } = options;

    // 获取用户所属的团队ID列表
    const userTeamMemberships = await TeamMember.findAll({
      where: { userId },
      attributes: ['teamId']
    });
    const userTeamIds = userTeamMemberships.map(tm => tm.teamId);

    // 构建查询条件
    const whereConditions: any = {
      isActive: true,
      [Op.or]: [
        { userId }, // 用户自己的项目
        { teamId: { [Op.in]: userTeamIds } } // 用户所属团队的项目
      ]
    };

    // 如果指定了teamId，只返回该团队的项目
    if (teamId !== undefined) {
      whereConditions[Op.or] = [
        { teamId }
      ];
      // 验证用户是否有权限访问该团队项目
      if (!userTeamIds.includes(teamId)) {
        return { projects: [], total: 0 };
      }
    }

    // 如果有搜索条件
    if (search) {
      whereConditions.name = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: projects } = await Project.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
        },
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name'],
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: limit,
      offset: offset,
    });

    return {
      projects,
      total: count,
    };
  }

  async getPublicProjects(options: ProjectQueryOptions = {}) {
    const { search, limit = 20, offset = 0 } = options;

    const whereConditions: any = {
      isActive: true,
      isPublic: true,
    };

    // 如果有搜索条件
    if (search) {
      whereConditions.name = {
        [Op.like]: `%${search}%`
      };
    }

    const { count, rows: projects } = await Project.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
        },
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name'],
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: limit,
      offset: offset,
    });

    return {
      projects,
      total: count,
    };
  }

  async updateProject(id: number, data: UpdateProjectData): Promise<Project | null> {
    const project = await Project.findOne({
      where: { id, isActive: true }
    });

    if (!project) {
      return null;
    }

    await project.update(data);
    await project.reload({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
        },
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name'],
        }
      ]
    });

    return project;
  }

  async deleteProject(id: number): Promise<boolean> {
    const project = await Project.findOne({
      where: { id, isActive: true }
    });

    if (!project) {
      return false;
    }

    // 软删除
    await project.update({ isActive: false });
    return true;
  }

  async checkProjectAccess(userId: number, project: Project): Promise<boolean> {
    // 公开项目任何人都可以访问
    if (project.isPublic) {
      return true;
    }

    // 项目创建者可以访问
    if (project.userId === userId) {
      return true;
    }

    // 如果是团队项目，检查用户是否为团队成员
    if (project.teamId) {
      const teamMember = await TeamMember.findOne({
        where: {
          teamId: project.teamId,
          userId: userId,
        }
      });
      return !!teamMember;
    }

    return false;
  }

  async checkTeamAccess(userId: number, teamId: number): Promise<boolean> {
    const teamMember = await TeamMember.findOne({
      where: {
        teamId: teamId,
        userId: userId,
      }
    });
    return !!teamMember;
  }

  async getProjectStats(projectId: number) {
    const project = await this.getProjectById(projectId);
    if (!project) {
      return null;
    }

    // TODO: 添加项目相关的统计信息
    // 例如：项目中的提示词数量、最近更新时间等
    // 这将在后续实现项目与提示词的关联后完成

    return {
      projectId,
      promptCount: 0, // 待实现
      lastUpdated: project.updatedAt,
    };
  }

  /**
   * 生成项目背景与提示词的合并内容
   */
  generateProjectPromptContent(projectBackground: string, promptContent: string): string {
    return `${projectBackground}\n\n---\n\n${promptContent}`;
  }

  /**
   * 为项目中的提示词生成编号
   * 格式：P{projectId}-{序号}
   */
  generatePromptNumber(projectId: number, sequence: number): string {
    return `P${projectId}-${sequence.toString().padStart(3, '0')}`;
  }
}