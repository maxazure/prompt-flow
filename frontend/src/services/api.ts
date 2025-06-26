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

export default api;