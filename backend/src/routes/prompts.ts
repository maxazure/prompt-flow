import express, { Router } from 'express';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import {
  createPrompt,
  getPrompts,
  getPromptById,
  updatePrompt,
  deletePrompt,
} from '../services/promptService';
import { PromptVersion } from '../models';
import { validateCreatePromptData, validateUpdatePromptData } from '../utils/promptValidation';

const router: Router = express.Router();

// GET /api/prompts/my - Get user's own prompts (both public and private)
router.get('/my', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { category, isTemplate } = req.query;
    
    const options = {
      userId: req.user!.id,
      category: category as string,
      isTemplate: isTemplate === 'true' ? true : undefined,
    };

    const prompts = await getPrompts(options);

    res.json({ prompts });
  } catch (error) {
    console.error('Get user prompts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/prompts - Get public prompts  
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { category, isTemplate } = req.query;
    
    const options = {
      category: category as string,
      isTemplate: isTemplate === 'true' ? true : undefined,
    };

    const prompts = await getPrompts(options);

    res.json({ prompts });
  } catch (error) {
    console.error('Get prompts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/prompts - Create new prompt
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Validate input data
    const validationErrors = validateCreatePromptData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }

    // Create prompt
    const prompt = await createPrompt(req.user!.id, req.body);

    res.status(201).json({
      message: 'Prompt created successfully',
      prompt,
    });
  } catch (error) {
    console.error('Create prompt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/prompts/:id - Get prompt by ID
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const promptId = parseInt(req.params.id);
    if (isNaN(promptId)) {
      return res.status(400).json({ error: 'Invalid prompt ID' });
    }

    const prompt = await getPromptById(promptId, req.user?.id);

    res.json({ prompt });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Prompt not found') {
        return res.status(404).json({ error: 'Prompt not found' });
      }
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    console.error('Get prompt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/prompts/:id - Update prompt
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const promptId = parseInt(req.params.id);
    if (isNaN(promptId)) {
      return res.status(400).json({ error: 'Invalid prompt ID' });
    }

    // Validate input data
    const validationErrors = validateUpdatePromptData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }

    // Update prompt
    const prompt = await updatePrompt(promptId, req.user!.id, req.body);

    res.json({
      message: 'Prompt updated successfully',
      prompt,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Prompt not found') {
        return res.status(404).json({ error: 'Prompt not found' });
      }
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    console.error('Update prompt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/prompts/:id - Delete prompt
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const promptId = parseInt(req.params.id);
    if (isNaN(promptId)) {
      return res.status(400).json({ error: 'Invalid prompt ID' });
    }

    // Delete prompt
    await deletePrompt(promptId, req.user!.id);

    res.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Prompt not found') {
        return res.status(404).json({ error: 'Prompt not found' });
      }
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    console.error('Delete prompt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;