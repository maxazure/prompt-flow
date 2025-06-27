import express, { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { CategoryService } from '../services/categoryService';
import { CategoryScopeType } from '../models/Category';
import { validateCreateCategoryData, validateUpdateCategoryData } from '../utils/categoryValidation';

const router: Router = express.Router();
const categoryService = new CategoryService();

// GET /api/categories - 获取分类（支持已登录和未登录用户）
router.get('/', async (req, res) => {
  try {
    // 尝试获取用户ID（如果已登录）
    const authHeader = req.headers.authorization;
    let userId: number | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
        userId = decoded.id;
      } catch (error) {
        // Token无效，继续以未登录用户处理
      }
    }

    let categories;
    if (userId) {
      // 已登录用户：获取所有可见分类
      categories = await categoryService.getUserVisibleCategories(userId);
      
      const groupedCategories = {
        personal: categories.filter(c => c.scopeType === CategoryScopeType.PERSONAL && c.scopeId === userId),
        team: categories.filter(c => c.scopeType === CategoryScopeType.TEAM),
        public: categories.filter(c => c.scopeType === CategoryScopeType.PUBLIC),
      };

      res.json({
        categories: groupedCategories,
        total: categories.length,
      });
    } else {
      // 未登录用户：只返回公开分类
      const publicCategories = await categoryService.getPublicCategories();
      
      res.json({
        categories: {
          personal: [],
          team: [],
          public: publicCategories,
        },
        total: publicCategories.length,
      });
    }
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/categories/stats - 获取分类统计信息
router.get('/stats', async (req, res) => {
  try {
    const stats = await categoryService.getCategoryStats();
    res.json({ stats });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/categories/my - 获取用户创建的所有分类
router.get('/my', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const allCategories = await categoryService.getUserVisibleCategories(userId);
    
    // 过滤出用户创建的分类
    const myCategories = allCategories.filter(c => c.createdBy === userId);

    res.json({
      categories: myCategories,
      total: myCategories.length,
    });
  } catch (error) {
    console.error('Get my categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/categories/team/:teamId - 获取特定团队的分类
router.get('/team/:teamId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const teamId = parseInt(req.params.teamId);
    
    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const allCategories = await categoryService.getUserVisibleCategories(userId);
    const teamCategories = allCategories.filter(c => 
      c.scopeType === CategoryScopeType.TEAM && c.scopeId === teamId
    );

    res.json({
      categories: teamCategories,
      total: teamCategories.length,
    });
  } catch (error) {
    console.error('Get team categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories - 创建新分类
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // 验证请求数据
    const validationResult = validateCreateCategoryData(req.body);
    if (!validationResult.isValid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.errors 
      });
    }

    const categoryData = validationResult.data;
    const category = await categoryService.createCategory(categoryData, userId);

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists') || 
          error.message.includes('permission') ||
          error.message.includes('required')) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/categories/:id - 更新分类
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    // 验证请求数据
    const validationResult = validateUpdateCategoryData(req.body);
    if (!validationResult.isValid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.errors 
      });
    }

    const updateData = validationResult.data;
    const category = await categoryService.updateCategory(categoryId, updateData, userId);

    res.json({
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    console.error('Update category error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Category not found' });
      }
      if (error.message.includes('Permission denied') || 
          error.message.includes('already exists')) {
        return res.status(403).json({ error: error.message });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/categories/:id - 删除分类
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    await categoryService.deleteCategory(categoryId, userId);

    res.json({
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Category not found' });
      }
      if (error.message.includes('Permission denied')) {
        return res.status(403).json({ error: error.message });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/categories/:id/can-use - 检查用户是否可以使用指定分类
router.get('/:id/can-use', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const canUse = await categoryService.canUserUseCategory(userId, categoryId);

    res.json({
      canUse,
      categoryId,
      userId,
    });
  } catch (error) {
    console.error('Check category usage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;