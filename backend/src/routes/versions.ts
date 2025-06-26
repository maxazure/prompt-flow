import express, { Router } from 'express';
import { Request, Response } from 'express';
import { Prompt, PromptVersion, User } from '../models';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// GET /api/prompts/:id/versions - Get version history
router.get('/prompts/:id/versions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const promptId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    if (isNaN(promptId)) {
      return res.status(400).json({ error: 'Invalid prompt ID' });
    }

    // Check if prompt exists and user has access
    const prompt = await Prompt.findByPk(promptId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }]
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Check access permissions
    if (!prompt.isPublic && prompt.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all versions
    const versions = await PromptVersion.findAll({
      where: { promptId },
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
      order: [['version', 'DESC']]
    });

    res.json({ versions });
  } catch (error) {
    console.error('Error fetching prompt versions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/prompts/:id/versions - Create new version
router.post('/prompts/:id/versions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const promptId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    if (isNaN(promptId)) {
      return res.status(400).json({ error: 'Invalid prompt ID' });
    }
    const { title, content, description, category, tags, changeLog } = req.body;

    // Check if prompt exists and user has permission
    const prompt = await Prompt.findByPk(promptId);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Only owner can create new versions
    if (prompt.userId !== userId) {
      return res.status(403).json({ error: 'Only prompt owner can create new versions' });
    }

    // Get current version number
    const latestVersion = await PromptVersion.findOne({
      where: { promptId },
      order: [['version', 'DESC']]
    });

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    // Create version record
    const promptVersion = await PromptVersion.create({
      promptId,
      version: nextVersion,
      title: title || prompt.title,
      content: content || prompt.content,
      description: description || prompt.description,
      category: category || prompt.category,
      tags: tags || prompt.tags,
      userId,
      changeLog
    });

    // Update main prompt with new version
    await prompt.update({
      title: title || prompt.title,
      content: content || prompt.content,
      description: description || prompt.description,
      category: category || prompt.category,
      tags: tags || prompt.tags,
      version: nextVersion
    });

    // Return the created version with user info
    const createdVersion = await PromptVersion.findByPk(promptVersion.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }]
    });

    res.status(201).json(createdVersion);
  } catch (error) {
    console.error('Error creating prompt version:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/prompts/:id/versions/:version - Get specific version
router.get('/prompts/:id/versions/:version', authenticateToken, async (req: Request, res: Response) => {
  try {
    const promptId = parseInt(req.params.id);
    const version = parseInt(req.params.version);
    const userId = (req as any).user.id;

    if (isNaN(promptId) || isNaN(version)) {
      return res.status(400).json({ error: 'Invalid prompt ID or version' });
    }

    // Check if prompt exists and user has access
    const prompt = await Prompt.findByPk(promptId);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    if (!prompt.isPublic && prompt.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get specific version
    const promptVersion = await PromptVersion.findOne({
      where: { promptId, version },
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }]
    });

    if (!promptVersion) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json(promptVersion);
  } catch (error) {
    console.error('Error fetching prompt version:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/prompts/:id/revert/:version - Revert to specific version
router.post('/prompts/:id/revert/:version', authenticateToken, async (req: Request, res: Response) => {
  try {
    const promptId = parseInt(req.params.id);
    const revertToVersion = parseInt(req.params.version);
    const userId = (req as any).user.id;

    if (isNaN(promptId) || isNaN(revertToVersion)) {
      return res.status(400).json({ error: 'Invalid prompt ID or version' });
    }
    const { changeLog } = req.body;

    // Check if prompt exists and user has permission
    const prompt = await Prompt.findByPk(promptId);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    if (prompt.userId !== userId) {
      return res.status(403).json({ error: 'Only prompt owner can revert versions' });
    }

    // Get the version to revert to
    const targetVersion = await PromptVersion.findOne({
      where: { promptId, version: revertToVersion }
    });

    if (!targetVersion) {
      return res.status(404).json({ error: 'Target version not found' });
    }

    // Get next version number
    const latestVersion = await PromptVersion.findOne({
      where: { promptId },
      order: [['version', 'DESC']]
    });

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    // Create new version record with reverted content
    const newVersion = await PromptVersion.create({
      promptId,
      version: nextVersion,
      title: targetVersion.title,
      content: targetVersion.content,
      description: targetVersion.description,
      category: targetVersion.category,
      tags: targetVersion.tags,
      userId,
      changeLog: changeLog || `Reverted to version ${revertToVersion}`
    });

    // Update main prompt
    await prompt.update({
      title: targetVersion.title,
      content: targetVersion.content,
      description: targetVersion.description,
      category: targetVersion.category,
      tags: targetVersion.tags,
      version: nextVersion
    });

    // Return updated prompt
    const updatedPrompt = await Prompt.findByPk(promptId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }]
    });

    res.json(updatedPrompt);
  } catch (error) {
    console.error('Error reverting prompt version:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;