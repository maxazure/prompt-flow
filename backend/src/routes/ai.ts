import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';
import { Prompt } from '../models';

const router = express.Router();

// Analyze prompt quality and get optimization suggestions
router.post('/analyze', authenticateToken, async (req: AuthenticatedRequest, res) => {
  console.log(`🧠 AI Analysis Request from user ${req.user?.id}:`);
  console.log(`   📝 Content length: ${req.body.content?.length || 0} characters`);
  console.log(`   🔤 Content preview: "${req.body.content?.substring(0, 100)}..."`);
  
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: 'Content is required and must be a string',
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        error: 'Content too long (max 5000 characters)',
      });
    }

    const startTime = Date.now();
    const analysis = await aiService.analyzePrompt(content);
    const duration = Date.now() - startTime;

    console.log(`   ✅ Analysis completed in ${duration}ms`);
    console.log(`   📊 Score: ${analysis.score}, Suggestions: ${analysis.suggestions.length}`);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze prompt',
    });
  }
});

// Generate optimized version of a prompt
router.post('/optimize', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { content, suggestions } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: 'Content is required and must be a string',
      });
    }

    if (!suggestions || !Array.isArray(suggestions)) {
      return res.status(400).json({
        error: 'Suggestions array is required',
      });
    }

    const optimizedContent = await aiService.generateOptimizedVersion(
      content,
      suggestions
    );

    res.json({
      success: true,
      data: {
        original: content,
        optimized: optimizedContent,
      },
    });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({
      error: 'Failed to optimize prompt',
    });
  }
});

// Get similar prompts based on content
router.post('/similar', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { content, limit = 5 } = req.body;
    const userId = req.user?.id;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: 'Content is required and must be a string',
      });
    }

    // Get AI-suggested similar prompts
    const aiSimilar = await aiService.getSimilarPrompts(content, Math.floor(limit / 2));

    // Get actual similar prompts from database (simple approach)
    const categories = await aiService.categorizePrompt(content);
    const dbPrompts = await Prompt.findAll({
      where: {
        isPublic: true,
      },
      attributes: ['id', 'title', 'content', 'category'],
      limit: Math.ceil(limit / 2),
      order: [['createdAt', 'DESC']],
    });

    const similarPrompts = [
      ...aiSimilar.map(content => ({
        type: 'ai_suggestion',
        content,
        title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      })),
      ...dbPrompts.map(prompt => ({
        type: 'existing_prompt',
        id: prompt.id,
        title: prompt.title,
        content: prompt.content.substring(0, 200) + (prompt.content.length > 200 ? '...' : ''),
        category: prompt.category,
      })),
    ];

    res.json({
      success: true,
      data: {
        similar: similarPrompts.slice(0, limit),
        categories,
      },
    });
  } catch (error) {
    console.error('Similar prompts error:', error);
    res.status(500).json({
      error: 'Failed to find similar prompts',
    });
  }
});

// Auto-categorize a prompt
router.post('/categorize', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: 'Content is required and must be a string',
      });
    }

    const categories = await aiService.categorizePrompt(content);

    res.json({
      success: true,
      data: {
        categories,
        suggested_category: categories[0] || 'general',
      },
    });
  } catch (error) {
    console.error('Categorization error:', error);
    res.status(500).json({
      error: 'Failed to categorize prompt',
    });
  }
});

// Analyze a specific prompt by ID
router.get('/prompts/:id/analyze', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const prompt = await Prompt.findOne({
      where: {
        id,
        [require('sequelize').Op.or]: [
          { userId },
          { isPublic: true },
        ],
      },
    });

    if (!prompt) {
      return res.status(404).json({
        error: 'Prompt not found or access denied',
      });
    }

    const analysis = await aiService.analyzePrompt(prompt.content);

    res.json({
      success: true,
      data: {
        prompt: {
          id: prompt.id,
          title: prompt.title,
          content: prompt.content,
        },
        analysis,
      },
    });
  } catch (error) {
    console.error('Prompt analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze prompt',
    });
  }
});

// Validate prompt effectiveness
router.post('/validate', authenticateToken, async (req: AuthenticatedRequest, res) => {
  console.log(`✅ AI Validation Request from user ${req.user?.id}:`);
  console.log(`   📝 Content length: ${req.body.content?.length || 0} characters`);
  
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: 'Content is required and must be a string',
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        error: 'Content too long (max 5000 characters)',
      });
    }

    const startTime = Date.now();
    const validation = await aiService.validatePrompt(content);
    const duration = Date.now() - startTime;

    console.log(`   ✅ Validation completed in ${duration}ms`);
    console.log(`   📊 Valid: ${validation.isValid}, Score: ${validation.score}, Issues: ${validation.issues.length}`);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: 'Failed to validate prompt',
    });
  }
});

// Get usage statistics and insights
router.get('/insights', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;

    // Get user's prompts for analysis
    const userPrompts = await Prompt.findAll({
      where: { userId },
      attributes: ['content', 'category', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const categoryDistribution: Record<string, number> = {};

    // Calculate category distribution
    userPrompts.forEach(prompt => {
      const category = prompt.category || 'uncategorized';
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });

    const insights = {
      total_prompts: userPrompts.length,
      avg_length: userPrompts.length > 0 
        ? Math.round(userPrompts.reduce((sum, p) => sum + p.content.length, 0) / userPrompts.length)
        : 0,
      category_distribution: categoryDistribution,
      recent_activity: userPrompts.slice(0, 10).map(p => ({
        length: p.content.length,
        category: p.category,
        created: p.createdAt,
      })),
      recommendations: [
        '尝试使用更具体的描述来提高提示词效果',
        '添加示例可以帮助AI更好地理解需求',
        '保持提示词简洁明了，避免冗余信息',
      ],
    };

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      error: 'Failed to generate insights',
    });
  }
});

export default router;