import request from 'supertest';
import { app } from '../app';
import { initDatabase } from '../config/database';
import { User, Team, TeamMember, TeamRole } from '../models';

describe('Teams API', () => {
  let userToken: string;
  let user2Token: string;
  let userId: number;
  let user2Id: number;

  beforeAll(async () => {
    await initDatabase();
  });

  beforeEach(async () => {
    // 清理数据库
    await TeamMember.destroy({ where: {}, force: true });
    await Team.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // 创建测试用户
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    userToken = userResponse.body.token;
    userId = userResponse.body.user.id;

    const user2Response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
      });

    user2Token = user2Response.body.token;
    user2Id = user2Response.body.user.id;
  });

  describe('POST /api/teams', () => {
    it('should create a new team successfully', async () => {
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Team',
          description: 'A test team',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Team created successfully');
      expect(response.body.team.name).toBe('Test Team');
      expect(response.body.team.description).toBe('A test team');
      expect(response.body.team.ownerId).toBe(userId);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/teams')
        .send({
          name: 'Test Team',
        });

      expect(response.status).toBe(401);
    });

    it('should require team name', async () => {
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'A test team',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Team name is required');
    });

    it('should reject empty team name', async () => {
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: '   ',
          description: 'A test team',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Team name is required');
    });

    it('should reject team name longer than 100 characters', async () => {
      const longName = 'a'.repeat(101);
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: longName,
          description: 'A test team',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Team name must be less than 100 characters');
    });
  });

  describe('GET /api/teams', () => {
    it('should get user teams', async () => {
      // 创建团队
      await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Team',
          description: 'A test team',
        });

      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.teams).toHaveLength(1);
      expect(response.body.teams[0].name).toBe('Test Team');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/teams');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/teams/:id', () => {
    let teamId: number;

    beforeEach(async () => {
      const teamResponse = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Team',
          description: 'A test team',
        });
      teamId = teamResponse.body.team.id;
    });

    it('should get team details for member', async () => {
      const response = await request(app)
        .get(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.team.name).toBe('Test Team');
    });

    it('should deny access to non-members', async () => {
      const response = await request(app)
        .get(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });

    it('should return 404 for non-existent team', async () => {
      const response = await request(app)
        .get('/api/teams/9999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Team not found');
    });
  });

  describe('PUT /api/teams/:id', () => {
    let teamId: number;

    beforeEach(async () => {
      const teamResponse = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Team',
          description: 'A test team',
        });
      teamId = teamResponse.body.team.id;
    });

    it('should update team as owner', async () => {
      const response = await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Team',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Team updated successfully');
      expect(response.body.team.name).toBe('Updated Team');
      expect(response.body.team.description).toBe('Updated description');
    });

    it('should deny update for non-members', async () => {
      const response = await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Updated Team',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Team not found');
    });

    it('should validate team name', async () => {
      const response = await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Team name is required');
    });
  });

  describe('DELETE /api/teams/:id', () => {
    let teamId: number;

    beforeEach(async () => {
      const teamResponse = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Team',
          description: 'A test team',
        });
      teamId = teamResponse.body.team.id;
    });

    it('should delete team as owner', async () => {
      const response = await request(app)
        .delete(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Team deleted successfully');
    });

    it('should deny deletion for non-owners', async () => {
      // 邀请user2加入团队作为viewer
      await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'test2@example.com',
          role: TeamRole.VIEWER,
        });

      const response = await request(app)
        .delete(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Team not found or access denied');
    });
  });

  describe('POST /api/teams/:id/members', () => {
    let teamId: number;

    beforeEach(async () => {
      const teamResponse = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Team',
          description: 'A test team',
        });
      teamId = teamResponse.body.team.id;
    });

    it('should invite member as owner', async () => {
      const response = await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'test2@example.com',
          role: TeamRole.EDITOR,
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Member invited successfully');
    });

    it('should require email', async () => {
      const response = await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: TeamRole.EDITOR,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email is required');
    });

    it('should reject invalid role', async () => {
      const response = await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'test2@example.com',
          role: 'invalid_role',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid role');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'nonexistent@example.com',
          role: TeamRole.EDITOR,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should reject duplicate member', async () => {
      // 首次邀请
      await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'test2@example.com',
          role: TeamRole.EDITOR,
        });

      // 重复邀请
      const response = await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'test2@example.com',
          role: TeamRole.VIEWER,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User is already a team member');
    });

    it('should deny non-admin/owner invitations', async () => {
      // 先邀请user2作为viewer
      await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'test2@example.com',
          role: TeamRole.VIEWER,
        });

      // user2尝试邀请其他人（应该失败）
      const response = await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          email: 'test3@example.com',
          role: TeamRole.VIEWER,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });
});