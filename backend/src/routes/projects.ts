import express, { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ProjectService } from '../services/projectService';
import { validateCreateProjectData, validateUpdateProjectData } from '../utils/projectValidation';

const router: Router = express.Router();
const projectService = new ProjectService();

// GET /api/projects/public - 获取公开项目（无需认证）
router.get('/public', async (req, res) => {
  try {
    const { search, limit = 20, offset = 0 } = req.query;
    
    const projects = await projectService.getPublicProjects({
      search: search as string,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });

    res.json({
      success: true,
      data: projects.projects,
      total: projects.total,
    });
  } catch (error) {
    console.error('Get public projects error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// GET /api/projects - 获取用户的项目（需要认证）
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { teamId, search, limit = 20, offset = 0 } = req.query;

    const projects = await projectService.getUserProjects(userId, {
      teamId: teamId ? parseInt(teamId as string, 10) : undefined,
      search: search as string,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });

    res.json({
      success: true,
      data: projects.projects,
      total: projects.total,
    });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// POST /api/projects - 创建新项目
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const projectData = req.body;

    // 验证输入数据
    const validation = validateCreateProjectData(projectData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    // 如果是团队项目，验证用户是否为团队成员
    if (projectData.teamId) {
      const hasTeamAccess = await projectService.checkTeamAccess(userId, projectData.teamId);
      if (!hasTeamAccess) {
        return res.status(403).json({
          success: false,
          error: 'You are not a member of this team',
        });
      }
    }

    const project = await projectService.createProject({
      ...projectData,
      userId,
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// GET /api/projects/:id - 获取项目详情
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const projectId = parseInt(req.params.id, 10);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    const project = await projectService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // 检查访问权限
    const hasAccess = await projectService.checkProjectAccess(userId, project);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// PUT /api/projects/:id - 更新项目
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const projectId = parseInt(req.params.id, 10);
    const updateData = req.body;

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    // 验证输入数据
    const validation = validateUpdateProjectData(updateData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const project = await projectService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // 检查编辑权限（只有项目创建者可以编辑）
    if (project.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can edit this project',
      });
    }

    const updatedProject = await projectService.updateProject(projectId, updateData);

    res.json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// DELETE /api/projects/:id - 删除项目（软删除）
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const projectId = parseInt(req.params.id, 10);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    const project = await projectService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // 检查删除权限（只有项目创建者可以删除）
    if (project.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can delete this project',
      });
    }

    await projectService.deleteProject(projectId);

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;