export interface User {
  id: number;
  username: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Prompt {
  id: number;
  title: string;
  content: string;
  description?: string;
  version: number;
  isTemplate: boolean;
  category?: string;
  tags?: string[];
  userId: number;
  parentId?: number;
  isPublic: boolean;
  teamId?: number;
  createdAt?: string;
  updatedAt?: string;
  user?: Pick<User, 'id' | 'username'>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface CreatePromptRequest {
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  isTemplate?: boolean;
  isPublic?: boolean;
  teamId?: number;
}

export interface UpdatePromptRequest {
  title?: string;
  content?: string;
  description?: string;
  category?: string;
  tags?: string[];
  isTemplate?: boolean;
  isPublic?: boolean;
  teamId?: number;
}

export interface PromptVersion {
  id: number;
  promptId: number;
  version: number;
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  userId: number;
  changeLog?: string;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'username'>;
}

export interface CreateVersionRequest {
  title?: string;
  content?: string;
  description?: string;
  category?: string;
  tags?: string[];
  changeLog?: string;
}

export interface RevertVersionRequest {
  changeLog?: string;
}

// Team related types
export const TeamRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer'
} as const;

export type TeamRole = typeof TeamRole[keyof typeof TeamRole];

export interface Team {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: Pick<User, 'id' | 'username' | 'email'>;
  members?: TeamMember[];
}

export interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: TeamRole;
  joinedAt: string;
  user?: Pick<User, 'id' | 'username' | 'email'>;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

export interface InviteMemberRequest {
  email: string;
  role: TeamRole;
}

export interface UpdateMemberRoleRequest {
  role: TeamRole;
}

// Comment related types
export interface Comment {
  id: number;
  promptId: number;
  userId: number;
  content: string;
  parentId?: number;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'username'>;
  replies?: Comment[];
}

export interface CreateCommentRequest {
  promptId: number;
  content: string;
  parentId?: number;
}

export interface UpdateCommentRequest {
  content: string;
}

// AI Optimization related types
export interface OptimizationSuggestion {
  type: 'clarity' | 'specificity' | 'structure' | 'efficiency' | 'examples';
  title: string;
  description: string;
  originalText: string;
  suggestedText: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
}

export interface PromptAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: OptimizationSuggestion[];
  estimatedTokens: number;
  readabilityScore: number;
}

export interface SimilarPrompt {
  type: 'ai_suggestion' | 'existing_prompt';
  id?: number;
  title: string;
  content: string;
  category?: string;
}

export interface PromptInsights {
  total_prompts: number;
  avg_length: number;
  category_distribution: Record<string, number>;
  recent_activity: Array<{
    prompts_created: number;
    versions_created: number;
  }>;
  recommendations: OptimizationSuggestion[];
}

export interface AnalyzeRequest {
  content: string;
}

export interface OptimizeRequest {
  content: string;
  suggestions: OptimizationSuggestion[];
}

export interface SimilarPromptsRequest {
  content: string;
  limit?: number;
}

export interface CategorizeRequest {
  content: string;
}

