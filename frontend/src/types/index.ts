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
  category?: string; // 保留向后兼容
  categoryId?: number; // 新的分类关联
  projectId?: number; // 项目关联
  promptNumber?: string; // 项目内编号
  isProjectPrompt?: boolean; // 是否为项目提示词
  showInCategory?: boolean; // 是否在分类中显示
  tags?: string[];
  userId: number;
  parentId?: number;
  isPublic: boolean;
  teamId?: number;
  createdAt?: string;
  updatedAt?: string;
  user?: Pick<User, 'id' | 'username'>;
  categoryInfo?: Category; // 分类详细信息
  projectInfo?: Project; // 项目详细信息
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
  category?: string;        // 保持向后兼容
  categoryId?: number;      // 新的分类ID字段
  tags?: string[];
  isPublic?: boolean;
  teamId?: number;
}

export interface UpdatePromptRequest {
  title?: string;
  content?: string;
  description?: string;
  category?: string;        // 保持向后兼容
  categoryId?: number;      // 新的分类ID字段
  tags?: string[];
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

export interface ValidateRequest {
  content: string;
}

export interface PromptValidation {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

// =====================================================
// Category Management Types - Phase 4 Implementation
// =====================================================

// 分类作用域枚举
export const CategoryScope = {
  PERSONAL: 'personal',
  TEAM: 'team', 
  PUBLIC: 'public'
} as const;

export type CategoryScope = typeof CategoryScope[keyof typeof CategoryScope];

// 分类颜色预设
export const CategoryColors = [
  '#3B82F6', // 蓝色
  '#10B981', // 绿色  
  '#F59E0B', // 橙色
  '#EF4444', // 红色
  '#8B5CF6', // 紫色
  '#06B6D4', // 青色
  '#84CC16', // 青绿色
  '#F97316', // 深橙色
] as const;

export type CategoryColor = typeof CategoryColors[number];

// 分类核心数据接口
export interface Category {
  id: number;
  name: string;
  description?: string;
  scopeType: CategoryScope;
  scopeId?: number; // team ID for team scope, null for personal/public
  createdBy: number;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // 扩展信息
  promptCount?: number; // 该分类下的提示词数量
  canEdit?: boolean; // 当前用户是否可编辑该分类
  creator?: Pick<User, 'id' | 'username'>; // 创建者信息
  team?: Pick<Team, 'id' | 'name'>; // 团队信息 (team scope)
}

// 分类聚合信息 - 用于前端显示
export interface CategoryGroup {
  name: string; // 分类名称
  categories: Category[]; // 同名分类的所有实例
  totalPrompts: number; // 总提示词数量
  scopes: CategoryScope[]; // 包含的作用域
  canCreate: boolean; // 是否可以在此分类下创建新实例
}

// 分类创建请求
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  scopeType: CategoryScope;
  scopeId?: number; // team ID for team categories
  color?: string;
}

// 分类更新请求  
export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

// 分类统计信息
export interface CategoryStats {
  totalCategories: number;
  personalCategories: number;
  teamCategories: number;
  publicCategories: number;
  recentlyUsed: Category[];
  mostPopular: Category[];
}

// CategoryContext 状态接口
export interface CategoryContextType {
  // 数据状态
  categories: Category[];
  categoryGroups: CategoryGroup[];
  selectedCategory: string | null; // category ID or "all"
  sidebarCollapsed: boolean;
  
  // 加载状态
  loading: boolean;
  error: string | null;
  
  // 操作方法
  selectCategory: (categoryId: string | null) => void;
  toggleSidebar: () => void;
  searchCategories: (term: string) => Category[];
  getCategoryById: (id: number) => Category | undefined;
  getCategoryGroup: (name: string) => CategoryGroup | undefined;
  
  // CRUD 操作
  createCategory: (data: CreateCategoryRequest) => Promise<Category>;
  updateCategory: (id: number, data: UpdateCategoryRequest) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  refreshCategories: (forceRefresh?: boolean) => Promise<void>;
  
  // 错误处理
  clearError: () => void;
  retryLastOperation: () => void;
}

// 分类筛选选项
export interface CategoryFilter {
  scope?: CategoryScope;
  searchTerm?: string;
  onlyEditable?: boolean;
  onlyActive?: boolean;
}

// 分类选择器组件属性
export interface CategorySelectorProps {
  value?: number | null;
  onChange: (categoryId: number | null) => void;
  placeholder?: string;
  allowCreate?: boolean;
  filter?: CategoryFilter;
  disabled?: boolean;
  className?: string;
}

// 侧边栏相关类型
export interface SidebarState {
  collapsed: boolean;
  width: number;
  expandedGroups: Set<string>;
}

// 响应式断点
export const Breakpoints = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1440
} as const;

export type BreakpointKey = keyof typeof Breakpoints;

// =====================================================
// Project Management Types - 项目管理功能
// =====================================================

// 项目核心数据接口
export interface Project {
  id: number;
  name: string;
  description?: string;
  background: string; // 项目背景，用作系统级提示词
  userId: number; // 项目创建者
  teamId?: number; // 可选的团队归属
  isPublic: boolean; // 是否公开
  isActive: boolean; // 是否激活
  createdAt: string;
  updatedAt: string;
  
  // 扩展信息
  promptCount?: number; // 项目中的提示词数量
  user?: Pick<User, 'id' | 'username'>; // 创建者信息
  team?: Pick<Team, 'id' | 'name'>; // 团队信息 
  prompts?: Prompt[]; // 项目中的提示词列表
}

// 项目创建请求
export interface CreateProjectRequest {
  name: string;
  description?: string;
  background: string;
  teamId?: number;
  isPublic?: boolean;
}

// 项目更新请求
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  background?: string;
  isPublic?: boolean;
}

// 项目查询选项
export interface ProjectQueryOptions {
  teamId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

// 项目统计信息
export interface ProjectStats {
  totalProjects: number;
  personalProjects: number;
  teamProjects: number;
  publicProjects: number;
  recentProjects: Project[];
  mostActiveProjects: Project[];
}

// 项目提示词创建请求
export interface CreateProjectPromptRequest extends CreatePromptRequest {
  projectId: number;
  promptNumber?: string;
  showInCategory?: boolean;
}

// 项目提示词更新请求
export interface UpdateProjectPromptRequest extends UpdatePromptRequest {
  showInCategory?: boolean;
}

// 项目背景合并配置
export interface ProjectPromptCombineOptions {
  includeBackground: boolean; // 是否包含项目背景
  separator?: string; // 分隔符，默认为 "---"
  format?: 'simple' | 'detailed'; // 合并格式
}

// 项目复制配置
export interface ProjectCopyOptions {
  combineWithBackground: boolean;
  copyToClipboard: boolean;
  showPreview: boolean;
}

