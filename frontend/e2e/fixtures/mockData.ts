/**
 * Mock data for API responses in e2e tests
 */

import type { Category, Prompt, User, AuthResponse, CategoryStats } from '../../src/types';

// Mock user data
export const mockUsers: User[] = [
  {
    id: 1,
    username: 'e2e_admin',
    email: 'e2e.admin@test.com',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    username: 'e2e_user',
    email: 'e2e.user@test.com',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

// Mock auth responses
export const mockAuthResponses: Record<string, AuthResponse> = {
  'e2e.admin@test.com': {
    message: 'Login successful',
    user: mockUsers[0],
    token: 'mock-admin-token-12345'
  },
  'e2e.user@test.com': {
    message: 'Login successful',
    user: mockUsers[1],
    token: 'mock-user-token-67890'
  }
};

// Mock categories
export const mockCategories: Category[] = [
  {
    id: 1,
    name: 'Development',
    description: 'Development related prompts',
    scopeType: 'personal',
    scopeId: null,
    createdBy: 1,
    color: '#3B82F6',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    promptCount: 5,
    canEdit: true,
    creator: { id: 1, username: 'e2e_admin' }
  },
  {
    id: 2,
    name: 'Marketing',
    description: 'Marketing content prompts',
    scopeType: 'personal',
    scopeId: null,
    createdBy: 1,
    color: '#10B981',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    promptCount: 3,
    canEdit: true,
    creator: { id: 1, username: 'e2e_admin' }
  },
  {
    id: 3,
    name: 'Analytics',
    description: 'Data analysis prompts',
    scopeType: 'personal',
    scopeId: null,
    createdBy: 2,
    color: '#F59E0B',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    promptCount: 2,
    canEdit: false,
    creator: { id: 2, username: 'e2e_user' }
  },
  {
    id: 4,
    name: 'Public Templates',
    description: 'Publicly shared templates',
    scopeType: 'public',
    scopeId: null,
    createdBy: 1,
    color: '#EF4444',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    promptCount: 8,
    canEdit: false,
    creator: { id: 1, username: 'e2e_admin' }
  }
];

// Mock prompts
export const mockPrompts: Prompt[] = [
  {
    id: 1,
    title: 'Code Review Prompt',
    content: 'Please review the following code and provide constructive feedback:\n\n{code}\n\nFocus on:\n- Code quality\n- Best practices\n- Potential bugs\n- Performance improvements',
    description: 'A comprehensive code review prompt for development teams',
    version: 1,
    isTemplate: false,
    categoryId: 1,
    tags: ['development', 'code-review', 'feedback'],
    userId: 1,
    isPublic: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    user: { id: 1, username: 'e2e_admin' },
    categoryInfo: mockCategories[0]
  },
  {
    id: 2,
    title: 'Marketing Copy Generator',
    content: 'Create compelling marketing copy for:\n\nProduct: {product_name}\nTarget Audience: {target_audience}\nKey Benefits: {benefits}\nTone: {tone}\n\nGenerate:\n1. Headline\n2. Product description\n3. Call-to-action',
    description: 'Template for generating marketing copy',
    version: 2,
    isTemplate: true,
    categoryId: 2,
    tags: ['marketing', 'copywriting', 'content'],
    userId: 1,
    isPublic: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    user: { id: 1, username: 'e2e_admin' },
    categoryInfo: mockCategories[1]
  },
  {
    id: 3,
    title: 'Data Analysis Request',
    content: 'Analyze the following dataset and provide insights:\n\nDataset: {dataset_description}\nObjective: {analysis_objective}\nMetrics: {key_metrics}\n\nPlease provide:\n- Summary statistics\n- Key findings\n- Recommendations\n- Visualizations needed',
    description: 'Standard template for data analysis requests',
    version: 1,
    isTemplate: true,
    categoryId: 3,
    tags: ['analytics', 'data', 'insights'],
    userId: 2,
    isPublic: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    user: { id: 2, username: 'e2e_user' },
    categoryInfo: mockCategories[2]
  },
  {
    id: 4,
    title: 'Bug Report Template',
    content: '## Bug Report\n\n**Summary:** Brief description of the bug\n\n**Steps to Reproduce:**\n1. Step one\n2. Step two\n3. Step three\n\n**Expected Behavior:** What should happen\n\n**Actual Behavior:** What actually happens\n\n**Environment:**\n- OS: \n- Browser: \n- Version: \n\n**Additional Information:** Any other relevant details',
    description: 'Standard template for reporting bugs',
    version: 1,
    isTemplate: true,
    categoryId: 1,
    tags: ['development', 'bug-report', 'template'],
    userId: 1,
    isPublic: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    user: { id: 1, username: 'e2e_admin' },
    categoryInfo: mockCategories[0]
  },
  {
    id: 5,
    title: 'Social Media Post Creator',
    content: 'Create engaging social media posts for {platform}:\n\n**Topic:** {topic}\n**Target Audience:** {audience}\n**Goal:** {goal}\n**Tone:** {tone}\n\n**Requirements:**\n- Character limit: {char_limit}\n- Include hashtags: {hashtag_count}\n- Call-to-action: {cta_type}\n\nGenerate multiple variations with different angles.',
    description: 'Template for creating social media content',
    version: 1,
    isTemplate: true,
    categoryId: 2,
    tags: ['marketing', 'social-media', 'content'],
    userId: 1,
    isPublic: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    user: { id: 1, username: 'e2e_admin' },
    categoryInfo: mockCategories[1]
  }
];

// Mock category stats
export const mockCategoryStats: CategoryStats = {
  totalCategories: 4,
  personalCategories: 3,
  teamCategories: 0,
  publicCategories: 1,
  recentlyUsed: [mockCategories[0], mockCategories[1]],
  mostPopular: [mockCategories[3], mockCategories[0]]
};

// API response helpers
export const createMockResponse = <T>(data: T, success = true) => ({
  data,
  success,
  message: success ? 'Success' : 'Error occurred',
  timestamp: new Date().toISOString()
});

// Mock API responses
export const mockApiResponses = {
  // Auth endpoints
  'POST /api/auth/login': (email: string) => {
    const authResponse = mockAuthResponses[email];
    if (authResponse) {
      return createMockResponse(authResponse);
    }
    return createMockResponse(null, false);
  },

  'POST /api/auth/register': (userData: any) => {
    const newUser: User = {
      id: Date.now(),
      username: userData.username,
      email: userData.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const authResponse: AuthResponse = {
      message: 'Registration successful',
      user: newUser,
      token: `mock-token-${Date.now()}`
    };
    return createMockResponse(authResponse);
  },

  // Categories endpoints
  'GET /api/categories': () => {
    return createMockResponse({ categories: mockCategories });
  },

  'POST /api/categories': (categoryData: any) => {
    const newCategory: Category = {
      id: Date.now(),
      name: categoryData.name,
      description: categoryData.description || '',
      scopeType: categoryData.scopeType || 'personal',
      scopeId: categoryData.scopeId || null,
      createdBy: 1,
      color: categoryData.color || '#3B82F6',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      promptCount: 0,
      canEdit: true,
      creator: { id: 1, username: 'e2e_admin' }
    };
    return createMockResponse({ category: newCategory });
  },

  'PUT /api/categories/:id': (id: number, updateData: any) => {
    const existingCategory = mockCategories.find(cat => cat.id === id);
    if (!existingCategory) {
      return createMockResponse(null, false);
    }
    
    const updatedCategory: Category = {
      ...existingCategory,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    return createMockResponse({ category: updatedCategory });
  },

  'DELETE /api/categories/:id': (id: number) => {
    const exists = mockCategories.find(cat => cat.id === id);
    if (exists) {
      return createMockResponse({ message: 'Category deleted successfully' });
    }
    return createMockResponse(null, false);
  },

  'GET /api/categories/stats': () => {
    return createMockResponse({ stats: mockCategoryStats });
  },

  // Prompts endpoints
  'GET /api/prompts': (params?: any) => {
    let filteredPrompts = [...mockPrompts];
    
    if (params?.category) {
      filteredPrompts = filteredPrompts.filter(prompt => 
        prompt.categoryId?.toString() === params.category
      );
    }
    
    if (params?.isTemplate !== undefined) {
      filteredPrompts = filteredPrompts.filter(prompt => 
        prompt.isTemplate === params.isTemplate
      );
    }
    
    return createMockResponse({ prompts: filteredPrompts });
  },

  'GET /api/prompts/my': (params?: any) => {
    let filteredPrompts = mockPrompts.filter(prompt => prompt.userId === 1);
    
    if (params?.category) {
      filteredPrompts = filteredPrompts.filter(prompt => 
        prompt.categoryId?.toString() === params.category
      );
    }
    
    return createMockResponse({ prompts: filteredPrompts });
  },

  'POST /api/prompts': (promptData: any) => {
    const newPrompt: Prompt = {
      id: Date.now(),
      title: promptData.title,
      content: promptData.content,
      description: promptData.description || '',
      version: 1,
      isTemplate: promptData.isTemplate || false,
      categoryId: promptData.categoryId || null,
      tags: promptData.tags || [],
      userId: 1,
      isPublic: promptData.isPublic || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: { id: 1, username: 'e2e_admin' }
    };
    
    if (newPrompt.categoryId) {
      newPrompt.categoryInfo = mockCategories.find(cat => cat.id === newPrompt.categoryId);
    }
    
    return createMockResponse({ prompt: newPrompt });
  },

  'GET /api/prompts/:id': (id: number) => {
    const prompt = mockPrompts.find(p => p.id === id);
    if (prompt) {
      return createMockResponse({ prompt });
    }
    return createMockResponse(null, false);
  }
};

// Mock error responses for testing error scenarios
export const mockErrorResponses = {
  unauthorized: {
    status: 401,
    data: { message: 'Unauthorized access' }
  },
  forbidden: {
    status: 403,
    data: { message: 'Forbidden' }
  },
  notFound: {
    status: 404,
    data: { message: 'Resource not found' }
  },
  conflict: {
    status: 409,
    data: { message: 'Resource already exists' }
  },
  serverError: {
    status: 500,
    data: { message: 'Internal server error' }
  },
  networkError: {
    status: 0,
    data: { message: 'Network error' }
  }
};