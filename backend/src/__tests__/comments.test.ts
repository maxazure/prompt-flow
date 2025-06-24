import request from 'supertest';
import { app } from '../app';
import { initDatabase } from '../config/database';
import { User, Prompt, Comment } from '../models';

describe('Comments API', () => {
  let userToken: string;
  let user2Token: string;
  let userId: number;
  let user2Id: number;
  let promptId: number;

  beforeAll(async () => {
    await initDatabase();
  });

  beforeEach(async () => {
    // 清理数据库
    await Comment.destroy({ where: {}, force: true });
    await Prompt.destroy({ where: {}, force: true });
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

    // 创建测试提示词
    const promptResponse = await request(app)
      .post('/api/prompts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Test Prompt',
        content: 'This is a test prompt content',
        isPublic: true,
      });

    promptId = promptResponse.body.prompt.id;
  });

  describe('POST /api/comments', () => {
    it('should create a comment successfully', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          promptId,
          content: 'This is a test comment',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Comment created successfully');
      expect(response.body.comment.content).toBe('This is a test comment');
      expect(response.body.comment.userId).toBe(user2Id);
      expect(response.body.comment.promptId).toBe(promptId);
    });

    it('should create a reply to a comment', async () => {
      // 创建父评论
      const parentResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          promptId,
          content: 'This is a parent comment',
        });

      const parentId = parentResponse.body.comment.id;

      // 创建回复
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          promptId,
          content: 'This is a reply',
          parentId,
        });

      expect(response.status).toBe(201);
      expect(response.body.comment.content).toBe('This is a reply');
      expect(response.body.comment.parentId).toBe(parentId);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/comments')
        .send({
          promptId,
          content: 'This is a test comment',
        });

      expect(response.status).toBe(401);
    });

    it('should require prompt ID and content', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'This is a test comment',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Prompt ID and content are required');
    });

    it('should reject empty content', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          promptId,
          content: '   ',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Comment content cannot be empty');
    });

    it('should reject content longer than 1000 characters', async () => {
      const longContent = 'a'.repeat(1001);
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          promptId,
          content: longContent,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Comment content must be less than 1000 characters');
    });

    it('should reject comment on non-existent prompt', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          promptId: 9999,
          content: 'This is a test comment',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Prompt not found');
    });

    it('should reject comment on private prompt by non-owner', async () => {
      // 创建私有提示词
      const privatePromptResponse = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Private Prompt',
          content: 'This is a private prompt',
          isPublic: false,
        });

      const privatePromptId = privatePromptResponse.body.prompt.id;

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          promptId: privatePromptId,
          content: 'This is a test comment',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });

    it('should reject reply to non-existent comment', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          promptId,
          content: 'This is a reply',
          parentId: 9999,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Parent comment not found');
    });
  });

  describe('GET /api/comments/prompt/:promptId', () => {
    beforeEach(async () => {
      // 创建测试评论
      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          promptId,
          content: 'First comment',
        });

      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          promptId,
          content: 'Second comment',
        });
    });

    it('should get comments for public prompt', async () => {
      const response = await request(app)
        .get(`/api/comments/prompt/${promptId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(2);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/comments/prompt/${promptId}`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent prompt', async () => {
      const response = await request(app)
        .get('/api/comments/prompt/9999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Prompt not found');
    });

    it('should deny access to private prompt by non-owner', async () => {
      // 创建私有提示词
      const privatePromptResponse = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Private Prompt',
          content: 'This is a private prompt',
          isPublic: false,
        });

      const privatePromptId = privatePromptResponse.body.prompt.id;

      const response = await request(app)
        .get(`/api/comments/prompt/${privatePromptId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('PUT /api/comments/:id', () => {
    let commentId: number;

    beforeEach(async () => {
      const commentResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          promptId,
          content: 'Original comment',
        });
      commentId = commentResponse.body.comment.id;
    });

    it('should update comment by author', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'Updated comment',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Comment updated successfully');
      expect(response.body.comment.content).toBe('Updated comment');
    });

    it('should deny update by non-author', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          content: 'Updated comment',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });

    it('should require content', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Content is required');
    });

    it('should reject empty content', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: '   ',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Comment content cannot be empty');
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .put('/api/comments/9999')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'Updated comment',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Comment not found');
    });
  });

  describe('DELETE /api/comments/:id', () => {
    let commentId: number;

    beforeEach(async () => {
      const commentResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          promptId,
          content: 'Test comment',
        });
      commentId = commentResponse.body.comment.id;
    });

    it('should delete comment by author', async () => {
      const response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Comment deleted successfully');
    });

    it('should delete comment by prompt owner', async () => {
      const response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Comment deleted successfully');
    });

    it('should deny deletion by others', async () => {
      // 创建第三个用户
      const user3Response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'password123',
        });

      const user3Token = user3Response.body.token;

      const response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${user3Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .delete('/api/comments/9999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Comment not found');
    });
  });

  describe('PUT /api/comments/:id/resolve', () => {
    let commentId: number;

    beforeEach(async () => {
      const commentResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          promptId,
          content: 'Test comment',
        });
      commentId = commentResponse.body.comment.id;
    });

    it('should resolve comment by prompt owner', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}/resolve`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('resolved successfully');
      expect(response.body.isResolved).toBe(true);
    });

    it('should toggle resolve status', async () => {
      // 第一次标记为已解决
      await request(app)
        .put(`/api/comments/${commentId}/resolve`)
        .set('Authorization', `Bearer ${userToken}`);

      // 第二次取消解决状态
      const response = await request(app)
        .put(`/api/comments/${commentId}/resolve`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('reopened successfully');
      expect(response.body.isResolved).toBe(false);
    });

    it('should deny resolve by non-prompt-owner', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}/resolve`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Only prompt owner can resolve comments');
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .put('/api/comments/9999/resolve')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Comment not found');
    });
  });
});