import express, { Router } from 'express';
import { Op } from 'sequelize';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { Comment, User, Prompt } from '../models';

const router: Router = express.Router();

// 获取提示词的评论列表
router.get('/prompt/:promptId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const promptId = parseInt(req.params.promptId);
    const userId = req.user?.id;

    // 检查提示词是否存在和权限
    const prompt = await Prompt.findByPk(promptId);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // 检查访问权限
    if (!prompt.isPublic && prompt.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 获取评论（包括回复）
    const comments = await Comment.findAll({
      where: { 
        promptId,
        parentId: null as any // 只获取顶级评论
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
        },
        {
          model: Comment,
          as: 'replies',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC'], [{ model: Comment, as: 'replies' }, 'createdAt', 'ASC']],
    });

    res.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 创建新评论
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { promptId, content, parentId } = req.body;
    const userId = req.user?.id;

    if (!promptId || !content) {
      return res.status(400).json({ error: 'Prompt ID and content are required' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Comment content must be less than 1000 characters' });
    }

    // 检查提示词是否存在和权限
    const prompt = await Prompt.findByPk(promptId);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    if (!prompt.isPublic && prompt.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 如果是回复，检查父评论是否存在
    if (parentId) {
      const parentComment = await Comment.findOne({
        where: { id: parentId, promptId },
      });
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
    }

    // 创建评论
    const comment = await Comment.create({
      promptId,
      userId: userId!,
      content: content.trim(),
      parentId: parentId || null,
    });

    // 获取完整的评论信息
    const createdComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
        },
      ],
    });

    res.status(201).json({ message: 'Comment created successfully', comment: createdComment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新评论
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Comment content must be less than 1000 characters' });
    }

    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // 只有评论作者可以编辑
    if (comment.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await comment.update({ content: content.trim() });

    // 获取更新后的评论信息
    const updatedComment = await Comment.findByPk(commentId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
        },
      ],
    });

    res.json({ message: 'Comment updated successfully', comment: updatedComment });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 删除评论
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = req.user?.id;

    const comment = await Comment.findByPk(commentId, {
      include: [
        {
          model: Prompt,
          as: 'prompt',
        },
      ],
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // 只有评论作者或提示词所有者可以删除评论
    const prompt = (comment as any).prompt;
    if (comment.userId !== userId && prompt.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 删除评论及其所有回复
    await Comment.destroy({
      where: { parentId: commentId },
    });
    await comment.destroy();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 标记评论为已解决
router.put('/:id/resolve', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = req.user?.id;

    const comment = await Comment.findByPk(commentId, {
      include: [
        {
          model: Prompt,
          as: 'prompt',
        },
      ],
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // 只有提示词所有者可以标记评论为已解决
    const prompt = (comment as any).prompt;
    if (prompt.userId !== userId) {
      return res.status(403).json({ error: 'Only prompt owner can resolve comments' });
    }

    await comment.update({ isResolved: !comment.isResolved });

    res.json({ 
      message: `Comment ${comment.isResolved ? 'resolved' : 'reopened'} successfully`,
      isResolved: comment.isResolved 
    });
  } catch (error) {
    console.error('Error resolving comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;