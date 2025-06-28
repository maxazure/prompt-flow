import axios from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Prompt,
  CreatePromptRequest,
  UpdatePromptRequest,
  PromptVersion,
  CreateVersionRequest,
  RevertVersionRequest,
  Team,
  CreateTeamRequest,
  UpdateTeamRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  PromptAnalysis,
  SimilarPrompt,
  PromptInsights,
  AnalyzeRequest,
  OptimizeRequest,
  SimilarPromptsRequest,
  CategorizeRequest,
  ValidateRequest,
  PromptValidation,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryStats,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectQueryOptions,
  ProjectStats,
} from '../types';

// 从环境变量获取 API 基础 URL，支持多种配置方式
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 在开发环境下打印配置信息
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    baseURL: API_BASE_URL,
    environment: import.meta.env.MODE,
  });
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 秒超时
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
};

// Prompts API
export const promptsAPI = {
  async getPrompts(params?: { category?: string; isTemplate?: boolean }): Promise<{ prompts: Prompt[] }> {
    const response = await api.get('/prompts', { params });
    return response.data;
  },

  async getMyPrompts(params?: { category?: string; isTemplate?: boolean }): Promise<{ prompts: Prompt[] }> {
    const response = await api.get('/prompts/my', { params });
    return response.data;
  },

  async getPrompt(id: number): Promise<{ prompt: Prompt }> {
    const response = await api.get(`/prompts/${id}`);
    return response.data;
  },

  async createPrompt(data: CreatePromptRequest): Promise<{ message: string; prompt: Prompt }> {
    const response = await api.post('/prompts', data);
    return response.data;
  },

  async updatePrompt(id: number, data: UpdatePromptRequest): Promise<{ message: string; prompt: Prompt }> {
    const response = await api.put(`/prompts/${id}`, data);
    return response.data;
  },

  async deletePrompt(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/prompts/${id}`);
    return response.data;
  },
};

// Version Control API
export const versionsAPI = {
  async getVersionHistory(promptId: number): Promise<{ versions: PromptVersion[] }> {
    const response = await api.get(`/prompts/${promptId}/versions`);
    return response.data;
  },

  async createVersion(promptId: number, data: CreateVersionRequest): Promise<PromptVersion> {
    const response = await api.post(`/prompts/${promptId}/versions`, data);
    return response.data;
  },

  async getVersion(promptId: number, version: number): Promise<PromptVersion> {
    const response = await api.get(`/prompts/${promptId}/versions/${version}`);
    return response.data;
  },

  async revertToVersion(promptId: number, version: number, data: RevertVersionRequest): Promise<Prompt> {
    const response = await api.post(`/prompts/${promptId}/revert/${version}`, data);
    return response.data;
  },
};

// Teams API
export const teamsAPI = {
  async getTeams(): Promise<{ teams: Team[] }> {
    const response = await api.get('/teams');
    return response.data;
  },

  async getTeam(id: number): Promise<{ team: Team }> {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  async createTeam(data: CreateTeamRequest): Promise<{ message: string; team: Team }> {
    const response = await api.post('/teams', data);
    return response.data;
  },

  async updateTeam(id: number, data: UpdateTeamRequest): Promise<{ message: string; team: Team }> {
    const response = await api.put(`/teams/${id}`, data);
    return response.data;
  },

  async deleteTeam(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },

  async inviteMember(
    teamId: number,
    data: InviteMemberRequest
  ): Promise<{ message: string; member: any }> {
    const response = await api.post(`/teams/${teamId}/members`, data);
    return response.data;
  },

  async updateMemberRole(
    teamId: number,
    memberId: number,
    data: UpdateMemberRoleRequest
  ): Promise<{ message: string; member: any }> {
    const response = await api.put(`/teams/${teamId}/members/${memberId}`, data);
    return response.data;
  },

  async removeMember(teamId: number, memberId: number): Promise<{ message: string }> {
    const response = await api.delete(`/teams/${teamId}/members/${memberId}`);
    return response.data;
  },
};

// Comments API
export const commentsAPI = {
  async getComments(promptId: number): Promise<{ comments: Comment[] }> {
    const response = await api.get(`/comments/prompt/${promptId}`);
    return response.data;
  },

  async createComment(data: CreateCommentRequest): Promise<{ message: string; comment: Comment }> {
    const response = await api.post('/comments', data);
    return response.data;
  },

  async updateComment(
    id: number,
    data: UpdateCommentRequest
  ): Promise<{ message: string; comment: Comment }> {
    const response = await api.put(`/comments/${id}`, data);
    return response.data;
  },

  async deleteComment(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  },

  async resolveComment(id: number): Promise<{ message: string; comment: Comment }> {
    const response = await api.put(`/comments/${id}/resolve`);
    return response.data;
  },
};

// AI Optimization API
export const aiAPI = {
  async analyzePrompt(data: AnalyzeRequest): Promise<{ success: boolean; data: PromptAnalysis }> {
    const response = await api.post('/ai/analyze', data);
    return response.data;
  },

  async optimizePrompt(data: OptimizeRequest): Promise<{ 
    success: boolean; 
    data: { original: string; optimized: string } 
  }> {
    const response = await api.post('/ai/optimize', data);
    return response.data;
  },

  async getSimilarPrompts(data: SimilarPromptsRequest): Promise<{ 
    success: boolean; 
    data: { similar: SimilarPrompt[]; categories: string[] } 
  }> {
    const response = await api.post('/ai/similar', data);
    return response.data;
  },

  async categorizePrompt(data: CategorizeRequest): Promise<{ 
    success: boolean; 
    data: { categories: string[]; suggested_category: string } 
  }> {
    const response = await api.post('/ai/categorize', data);
    return response.data;
  },

  async validatePrompt(data: ValidateRequest): Promise<{ 
    success: boolean; 
    data: PromptValidation 
  }> {
    const response = await api.post('/ai/validate', data);
    return response.data;
  },

  async analyzePromptById(promptId: number): Promise<{ 
    success: boolean; 
    data: { prompt: Prompt; analysis: PromptAnalysis } 
  }> {
    const response = await api.get(`/ai/prompts/${promptId}/analyze`);
    return response.data;
  },

  async getInsights(): Promise<{ success: boolean; data: PromptInsights }> {
    const response = await api.get('/ai/insights');
    return response.data;
  },
};

// =====================================================
// Categories API - Phase 4 Implementation
// =====================================================

export const categoriesAPI = {
  // 获取用户可见的所有分类
  async getCategories(params?: { 
    scope?: string; 
    search?: string; 
    onlyActive?: boolean 
  }): Promise<{ categories: Category[] }> {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  // 获取分类统计信息
  async getCategoryStats(): Promise<{ stats: CategoryStats }> {
    const response = await api.get('/categories/stats');
    return response.data;
  },

  // 获取特定分类详情
  async getCategory(id: number): Promise<{ category: Category }> {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  // 创建新分类
  async createCategory(data: CreateCategoryRequest): Promise<{ 
    message: string; 
    category: Category 
  }> {
    const response = await api.post('/categories', data);
    return response.data;
  },

  // 更新分类
  async updateCategory(
    id: number, 
    data: UpdateCategoryRequest
  ): Promise<{ 
    message: string; 
    category: Category 
  }> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  // 删除分类
  async deleteCategory(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  // 获取分类下的提示词聚合信息
  async getCategoryPrompts(params?: {
    categoryId?: number;
    categoryName?: string;
    scope?: string;
    page?: number;
    limit?: number;
  }): Promise<{ prompts: Prompt[]; total: number; category?: Category }> {
    const response = await api.get('/prompts/categories', { params });
    return response.data;
  },

  // 批量操作分类 (未来功能)
  async bulkUpdateCategories(operations: Array<{
    id: number;
    action: 'update' | 'delete';
    data?: UpdateCategoryRequest;
  }>): Promise<{ message: string; results: any[] }> {
    const response = await api.post('/categories/bulk', { operations });
    return response.data;
  },
};

// Projects API
export const projectsAPI = {
  // 获取用户的项目列表
  async getProjects(params?: ProjectQueryOptions): Promise<{
    success: boolean;
    data: Project[];
    total: number;
  }> {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  // 获取公开项目列表（无需认证）
  async getPublicProjects(params?: ProjectQueryOptions): Promise<{
    success: boolean;
    data: Project[];
    total: number;
  }> {
    const response = await api.get('/projects/public', { params });
    return response.data;
  },

  // 获取项目详情
  async getProject(id: number): Promise<{
    success: boolean;
    data: Project;
  }> {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // 创建新项目
  async createProject(data: CreateProjectRequest): Promise<{
    success: boolean;
    data: Project;
  }> {
    const response = await api.post('/projects', data);
    return response.data;
  },

  // 更新项目
  async updateProject(id: number, data: UpdateProjectRequest): Promise<{
    success: boolean;
    data: Project;
  }> {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  // 删除项目（软删除）
  async deleteProject(id: number): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  // 获取项目统计信息
  async getProjectStats(): Promise<{
    success: boolean;
    data: ProjectStats;
  }> {
    const response = await api.get('/projects/stats');
    return response.data;
  },

  // 获取项目中的提示词列表
  async getProjectPrompts(
    projectId: number,
    params?: { limit?: number; offset?: number }
  ): Promise<{
    success: boolean;
    data: Prompt[];
    total: number;
  }> {
    const response = await api.get(`/projects/${projectId}/prompts`, { params });
    return response.data;
  },

  // 向项目添加提示词
  async addPromptToProject(
    projectId: number, 
    promptData: {
      title: string;
      content: string;
      description?: string;
      showInCategory?: boolean;
    }
  ): Promise<{
    success: boolean;
    data: Prompt;
  }> {
    const response = await api.post(`/projects/${projectId}/prompts`, {
      ...promptData,
      projectId,
      isProjectPrompt: true,
    });
    return response.data;
  },

  // 从项目移除提示词
  async removePromptFromProject(
    projectId: number, 
    promptId: number
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.delete(`/projects/${projectId}/prompts/${promptId}`);
    return response.data;
  },

  // 生成项目提示词的组合内容（包含背景）
  async getCombinedPromptContent(
    projectId: number,
    promptId: number,
    options?: {
      includeBackground?: boolean;
      separator?: string;
    }
  ): Promise<{
    success: boolean;
    data: {
      content: string;
      background: string;
      combinedContent: string;
    };
  }> {
    const response = await api.get(`/projects/${projectId}/prompts/${promptId}/combined`, {
      params: options
    });
    return response.data;
  },

  // 复制项目提示词（自动包含背景）
  async copyProjectPrompt(
    projectId: number,
    promptId: number
  ): Promise<{
    success: boolean;
    data: {
      combinedContent: string;
    };
  }> {
    const response = await api.post(`/projects/${projectId}/prompts/${promptId}/copy`);
    return response.data;
  },
};

export default api;