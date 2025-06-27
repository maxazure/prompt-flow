/**
 * Test data fixtures for e2e tests
 */

import type { Category, Prompt, User, CreateCategoryRequest, CreatePromptRequest } from '../../src/types';

// Test user data
export const testUsers = {
  admin: {
    username: 'e2e_admin',
    email: 'e2e.admin@test.com',
    password: 'Test123!@#'
  },
  regular: {
    username: 'e2e_user',
    email: 'e2e.user@test.com', 
    password: 'Test123!@#'
  }
};

// Test category data
export const testCategories: CreateCategoryRequest[] = [
  {
    name: 'E2E Development',
    description: 'Development related prompts for e2e testing',
    scopeType: 'personal',
    color: '#3B82F6'
  },
  {
    name: 'E2E Marketing',
    description: 'Marketing content prompts for e2e testing',
    scopeType: 'personal', 
    color: '#10B981'
  },
  {
    name: 'E2E Analytics',
    description: 'Data analysis prompts for e2e testing',
    scopeType: 'personal',
    color: '#F59E0B'
  },
  {
    name: 'E2E Public',
    description: 'Public shared prompts for e2e testing',
    scopeType: 'public',
    color: '#EF4444'
  }
];

// Test prompt data
export const testPrompts: CreatePromptRequest[] = [
  {
    title: 'E2E Code Review Prompt',
    content: 'Please review the following code and provide constructive feedback:\n\n{code}\n\nFocus on:\n- Code quality\n- Best practices\n- Potential bugs\n- Performance improvements',
    description: 'A comprehensive code review prompt for development teams',
    tags: ['development', 'code-review', 'feedback'],
    isTemplate: false,
    isPublic: false
  },
  {
    title: 'E2E Marketing Copy Generator',
    content: 'Create compelling marketing copy for:\n\nProduct: {product_name}\nTarget Audience: {target_audience}\nKey Benefits: {benefits}\nTone: {tone}\n\nGenerate:\n1. Headline\n2. Product description\n3. Call-to-action',
    description: 'Template for generating marketing copy',
    tags: ['marketing', 'copywriting', 'content'],
    isTemplate: true,
    isPublic: true
  },
  {
    title: 'E2E Data Analysis Request',
    content: 'Analyze the following dataset and provide insights:\n\nDataset: {dataset_description}\nObjective: {analysis_objective}\nMetrics: {key_metrics}\n\nPlease provide:\n- Summary statistics\n- Key findings\n- Recommendations\n- Visualizations needed',
    description: 'Standard template for data analysis requests',
    tags: ['analytics', 'data', 'insights'],
    isTemplate: true,
    isPublic: false
  }
];

// Test search and filter scenarios
export const searchScenarios = [
  {
    term: 'development',
    expectedResults: ['E2E Development', 'E2E Code Review Prompt']
  },
  {
    term: 'marketing',
    expectedResults: ['E2E Marketing', 'E2E Marketing Copy Generator']
  },
  {
    term: 'template',
    expectedResults: ['E2E Marketing Copy Generator', 'E2E Data Analysis Request']
  },
  {
    term: 'nonexistent',
    expectedResults: []
  }
];

// Mobile and desktop viewport configurations
export const viewports = {
  mobile: {
    width: 375,
    height: 667,
    name: 'iPhone SE'
  },
  tablet: {
    width: 768,
    height: 1024,
    name: 'iPad'
  },
  desktop: {
    width: 1920,
    height: 1080,
    name: 'Desktop'
  },
  ultrawide: {
    width: 2560,
    height: 1440,
    name: 'Ultrawide'
  }
};

// Navigation paths for testing
export const navigationPaths = {
  home: '/',
  dashboard: '/dashboard',
  createPrompt: '/create',
  templates: '/templates',
  login: '/login',
  register: '/register'
};

// Expected page titles
export const pageTitles = {
  home: 'PromptFlow - AI Prompt Management Platform',
  dashboard: 'Dashboard - PromptFlow',
  createPrompt: 'Create Prompt - PromptFlow',
  templates: 'Templates - PromptFlow',
  login: 'Login - PromptFlow',
  register: 'Register - PromptFlow'
};

// CSS selectors for common elements
export const selectors = {
  // Navigation
  sidebar: '[data-testid="category-sidebar"]',
  sidebarToggle: '[data-testid="sidebar-toggle"]',
  mainContent: '[data-testid="main-content"]',
  
  // Category management
  categoryList: '[data-testid="category-list"]',
  categoryItem: '[data-testid="category-item"]',
  createCategoryButton: '[data-testid="create-category-button"]',
  categoryForm: '[data-testid="category-form"]',
  categoryNameInput: '[data-testid="category-name-input"]',
  categoryDescriptionInput: '[data-testid="category-description-input"]',
  categoryColorPicker: '[data-testid="category-color-picker"]',
  categorySubmitButton: '[data-testid="category-submit-button"]',
  categoryCancelButton: '[data-testid="category-cancel-button"]',
  categoryDeleteButton: '[data-testid="category-delete-button"]',
  categoryEditButton: '[data-testid="category-edit-button"]',
  
  // Prompt management
  promptList: '[data-testid="prompt-list"]',
  promptItem: '[data-testid="prompt-item"]',
  promptTitle: '[data-testid="prompt-title"]',
  promptContent: '[data-testid="prompt-content"]',
  createPromptButton: '[data-testid="create-prompt-button"]',
  promptForm: '[data-testid="prompt-form"]',
  promptTitleInput: '[data-testid="prompt-title-input"]',
  promptContentInput: '[data-testid="prompt-content-input"]',
  promptDescriptionInput: '[data-testid="prompt-description-input"]',
  promptCategorySelect: '[data-testid="prompt-category-select"]',
  promptTagsInput: '[data-testid="prompt-tags-input"]',
  promptSubmitButton: '[data-testid="prompt-submit-button"]',
  
  // Search and filter
  searchInput: '[data-testid="search-input"]',
  filterButton: '[data-testid="filter-button"]',
  filterDropdown: '[data-testid="filter-dropdown"]',
  clearFiltersButton: '[data-testid="clear-filters-button"]',
  
  // Common UI elements
  loadingSpinner: '[data-testid="loading-spinner"]',
  errorMessage: '[data-testid="error-message"]',
  successMessage: '[data-testid="success-message"]',
  confirmDialog: '[data-testid="confirm-dialog"]',
  confirmYesButton: '[data-testid="confirm-yes-button"]',
  confirmNoButton: '[data-testid="confirm-no-button"]',
  
  // Authentication
  loginForm: '[data-testid="login-form"]',
  emailInput: '[data-testid="email-input"]',
  passwordInput: '[data-testid="password-input"]',
  loginButton: '[data-testid="login-button"]',
  logoutButton: '[data-testid="logout-button"]'
};

// API endpoints for mocking
export const apiEndpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register'
  },
  categories: {
    list: '/api/categories',
    create: '/api/categories',
    update: (id: number) => `/api/categories/${id}`,
    delete: (id: number) => `/api/categories/${id}`,
    stats: '/api/categories/stats'
  },
  prompts: {
    list: '/api/prompts',
    my: '/api/prompts/my',
    create: '/api/prompts',
    update: (id: number) => `/api/prompts/${id}`,
    delete: (id: number) => `/api/prompts/${id}`,
    detail: (id: number) => `/api/prompts/${id}`
  }
};

// Test timeout configurations
export const timeouts = {
  short: 5000,   // 5 seconds
  medium: 15000, // 15 seconds
  long: 30000,   // 30 seconds
  api: 10000     // 10 seconds for API calls
};