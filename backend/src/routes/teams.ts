import express from 'express';
import { Op } from 'sequelize';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { Team, TeamMember, TeamRole, User } from '../models';

const router = express.Router();

// 获取用户的团队列表
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    
    const teams = await Team.findAll({
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: TeamMember,
          as: 'members',
          where: { userId, isActive: true },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email'],
            },
          ],
        },
      ],
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
    });

    res.json({ teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 创建新团队
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user?.id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Team name must be less than 100 characters' });
    }

    // 创建团队
    const team = await Team.create({
      name: name.trim(),
      description: description?.trim() || '',
      ownerId: userId!,
    });

    // 将创建者添加为团队成员（owner角色）
    await TeamMember.create({
      teamId: team.id,
      userId: userId!,
      role: TeamRole.OWNER,
    });

    // 获取完整的团队信息
    const createdTeam = await Team.findByPk(team.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: TeamMember,
          as: 'members',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email'],
            },
          ],
        },
      ],
    });

    res.status(201).json({ message: 'Team created successfully', team: createdTeam });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取单个团队详情
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const userId = req.user?.id;

    const team = await Team.findOne({
      where: { id: teamId, isActive: true },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: TeamMember,
          as: 'members',
          where: { isActive: true },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email'],
            },
          ],
        },
      ],
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // 检查用户是否是团队成员
    const membership = (team as any).members?.find((member: any) => member.userId === userId);
    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ team });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新团队信息
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { name, description } = req.body;

    const team = await Team.findOne({
      where: { id: teamId, isActive: true },
      include: [
        {
          model: TeamMember,
          as: 'members',
          where: { userId, isActive: true },
        },
      ],
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // 检查用户权限（只有 owner 和 admin 可以更新团队信息）
    const membership = (team as any).members?.[0];
    if (!membership || ![TeamRole.OWNER, TeamRole.ADMIN].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // 验证输入
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Team name is required' });
      }
      if (name.length > 100) {
        return res.status(400).json({ error: 'Team name must be less than 100 characters' });
      }
    }

    // 更新团队
    await team.update({
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || '' }),
    });

    // 获取更新后的团队信息
    const updatedTeam = await Team.findByPk(teamId, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: TeamMember,
          as: 'members',
          where: { isActive: true },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email'],
            },
          ],
        },
      ],
    });

    res.json({ message: 'Team updated successfully', team: updatedTeam });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 删除团队
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const userId = req.user?.id;

    const team = await Team.findOne({
      where: { id: teamId, isActive: true, ownerId: userId },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found or access denied' });
    }

    // 软删除团队和所有成员
    await team.update({ isActive: false });
    await TeamMember.update(
      { isActive: false },
      { where: { teamId } }
    );

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 邀请成员加入团队
router.post('/:id/members', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { email, role = TeamRole.VIEWER } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!Object.values(TeamRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // 检查团队是否存在以及用户权限
    const team = await Team.findOne({
      where: { id: teamId, isActive: true },
      include: [
        {
          model: TeamMember,
          as: 'members',
          where: { userId, isActive: true },
        },
      ],
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // 检查权限（只有 owner 和 admin 可以邀请成员）
    const membership = (team as any).members?.[0];
    if (!membership || ![TeamRole.OWNER, TeamRole.ADMIN].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // 查找要邀请的用户
    const inviteUser = await User.findOne({ where: { email } });
    if (!inviteUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 检查用户是否已经是团队成员
    const existingMember = await TeamMember.findOne({
      where: { teamId, userId: inviteUser.id, isActive: true },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a team member' });
    }

    // 添加成员
    await TeamMember.create({
      teamId,
      userId: inviteUser.id,
      role,
    });

    res.status(201).json({ message: 'Member invited successfully' });
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新成员角色
router.put('/:id/members/:memberId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    const userId = req.user?.id;
    const { role } = req.body;

    if (!Object.values(TeamRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // 检查执行者权限
    const executorMembership = await TeamMember.findOne({
      where: { teamId, userId, isActive: true },
    });

    if (!executorMembership || ![TeamRole.OWNER, TeamRole.ADMIN].includes(executorMembership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // 检查目标成员
    const targetMembership = await TeamMember.findOne({
      where: { teamId, userId: memberId, isActive: true },
    });

    if (!targetMembership) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // 不允许移除 owner 角色
    if (targetMembership.role === TeamRole.OWNER && role !== TeamRole.OWNER) {
      return res.status(400).json({ error: 'Cannot change owner role' });
    }

    // 只有 owner 可以设置 owner 角色
    if (role === TeamRole.OWNER && executorMembership.role !== TeamRole.OWNER) {
      return res.status(403).json({ error: 'Only owner can assign owner role' });
    }

    await targetMembership.update({ role });

    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 移除团队成员
router.delete('/:id/members/:memberId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    const userId = req.user?.id;

    // 检查执行者权限
    const executorMembership = await TeamMember.findOne({
      where: { teamId, userId, isActive: true },
    });

    if (!executorMembership) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // 检查目标成员
    const targetMembership = await TeamMember.findOne({
      where: { teamId, userId: memberId, isActive: true },
    });

    if (!targetMembership) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // 权限检查：admin 和 owner 可以移除成员，但不能移除 owner
    const canRemove = 
      [TeamRole.OWNER, TeamRole.ADMIN].includes(executorMembership.role) ||
      userId === memberId; // 用户可以离开团队

    if (!canRemove) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // 不允许移除 owner
    if (targetMembership.role === TeamRole.OWNER && userId !== memberId) {
      return res.status(400).json({ error: 'Cannot remove team owner' });
    }

    await targetMembership.update({ isActive: false });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;