/**
 * 测试工具函数
 * 提供统一的测试环境配置和常用的测试辅助函数
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { CategoryProvider } from '../context/CategoryContext';
import { vi } from 'vitest';

// Mock AuthContext for all tests
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'testuser', email: 'test@example.com' },
    token: 'mock-token',
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true,
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

// Mock API services for consistent testing
vi.mock('../services/api', () => ({
  categoriesAPI: {
    getCategories: vi.fn().mockResolvedValue({ categories: [] }),
    getCategoryStats: vi.fn().mockResolvedValue({ 
      stats: { total: 0, personal: 0, team: 0 } 
    }),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
  promptsAPI: {
    getPrompts: vi.fn().mockResolvedValue({ prompts: [] }),
    getPrompt: vi.fn(),
    createPrompt: vi.fn(),
    updatePrompt: vi.fn(),
    deletePrompt: vi.fn(),
    getTags: vi.fn().mockResolvedValue({ tags: [] }),
  },
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// AllTheProviders component that wraps components with all necessary providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CategoryProvider>
          {children}
        </CategoryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Custom render function that includes providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Additional test utilities
export const renderWithProviders = customRender;

// Mock localStorage for tests
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Setup global mocks
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();
  
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
  
  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// Mock window.innerWidth for responsive tests
export const mockWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

// Common test data
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
};

export const mockCategory = {
  id: 1,
  name: 'Test Category',
  description: 'Test Description',
  scope: 'personal' as const,
  color: 'blue' as const,
  userId: 1,
  teamId: null,
  promptCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockPrompt = {
  id: 1,
  title: 'Test Prompt',
  content: 'Test Content',
  description: 'Test Description',
  category: 'test',
  categoryId: 1,
  tags: ['test'],
  userId: 1,
  isPublic: false,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Wait for async operations in tests
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));