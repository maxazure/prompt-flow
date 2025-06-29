/**
 * Context依赖关系测试 - TDD方式
 * 
 * 测试各个Context之间的依赖关系，确保测试环境正确配置
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { CategoryProvider, useCategory } from '../context/CategoryContext';
import { AuthProvider } from '../context/AuthContext';

// Mock APIs
vi.mock('../services/api', () => ({
  categoriesAPI: {
    getCategories: vi.fn().mockResolvedValue({ categories: [] }),
    getCategoryStats: vi.fn().mockResolvedValue({ stats: { total: 0, personal: 0, team: 0 } }),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

// Mock AuthContext properly
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'testuser', email: 'test@example.com' },
    token: 'mock-token',
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true,
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const TestComponent = () => {
  const category = useCategory();
  return <div data-testid="test-component">Context works: {category ? 'Yes' : 'No'}</div>;
};

describe('Context Dependencies - TDD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CategoryContext依赖关系', () => {
    it('应该在没有AuthProvider时抛出错误（当前问题）', () => {
      // TDD: 这个测试应该揭示当前的问题
      expect(() => {
        render(
          <BrowserRouter>
            <CategoryProvider>
              <TestComponent />
            </CategoryProvider>
          </BrowserRouter>
        );
      }).toThrow(); // 应该抛出useAuth错误
    });

    it('应该在有AuthProvider时正常工作', () => {
      // TDD: 这是我们期望的正确行为
      expect(() => {
        render(
          <BrowserRouter>
            <AuthProvider>
              <CategoryProvider>
                <TestComponent />
              </CategoryProvider>
            </AuthProvider>
          </BrowserRouter>
        );
      }).not.toThrow();
    });

    it('应该正确提供CategoryContext', () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <CategoryProvider>
              <TestComponent />
            </CategoryProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Context works: Yes')).toBeInTheDocument();
    });
  });

  describe('Provider嵌套顺序', () => {
    it('应该按正确顺序嵌套Providers', () => {
      // TDD: 确保Provider的嵌套顺序正确
      // Router -> Auth -> Category
      
      const CorrectProviderStructure = ({ children }: { children: React.ReactNode }) => (
        <BrowserRouter>
          <AuthProvider>
            <CategoryProvider>
              {children}
            </CategoryProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      expect(() => {
        render(
          <CorrectProviderStructure>
            <TestComponent />
          </CorrectProviderStructure>
        );
      }).not.toThrow();
    });

    it('应该在错误的嵌套顺序下失败', () => {
      // TDD: 错误的顺序应该失败
      // Category -> Auth -> Router (错误顺序)
      
      expect(() => {
        render(
          <CategoryProvider>
            <AuthProvider>
              <BrowserRouter>
                <TestComponent />
              </BrowserRouter>
            </AuthProvider>
          </CategoryProvider>
        );
      }).toThrow();
    });
  });

  describe('测试工具函数', () => {
    it('应该提供正确配置的测试渲染器', () => {
      // TDD: 创建一个可重用的测试渲染器
      const renderWithProviders = (ui: React.ReactElement) => {
        return render(
          <BrowserRouter>
            <AuthProvider>
              <CategoryProvider>
                {ui}
              </CategoryProvider>
            </AuthProvider>
          </BrowserRouter>
        );
      };

      const { getByTestId } = renderWithProviders(<TestComponent />);
      expect(getByTestId('test-component')).toBeInTheDocument();
    });
  });
});