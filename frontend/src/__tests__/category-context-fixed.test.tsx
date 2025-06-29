/**
 * 修复后的CategoryContext测试 - TDD方式
 * 
 * 使用正确的test-utils来修复CategoryContext测试问题
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { render } from '../test/test-utils'; // 使用我们的自定义render
import { CategoryProvider, useCategory } from '../context/CategoryContext';

// Test component to use CategoryContext
const TestCategoryComponent = () => {
  const categoryContext = useCategory();
  
  useEffect(() => {
    // 触发categories加载
    categoryContext.refreshCategories();
  }, []);

  return (
    <div>
      <div data-testid="loading-state">
        Loading: {categoryContext.loading ? 'true' : 'false'}
      </div>
      <div data-testid="categories-count">
        Categories: {categoryContext.categories.length}
      </div>
      <div data-testid="error-state">
        Error: {categoryContext.error || 'none'}
      </div>
      <button 
        data-testid="toggle-sidebar" 
        onClick={categoryContext.toggleSidebar}
      >
        Toggle Sidebar
      </button>
      <div data-testid="sidebar-collapsed">
        Sidebar Collapsed: {categoryContext.sidebarCollapsed ? 'true' : 'false'}
      </div>
    </div>
  );
};

describe('Fixed CategoryContext - TDD', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本功能测试', () => {
    it('应该正确渲染和提供Context', async () => {
      // TDD: 测试基本的Context提供功能
      render(<TestCategoryComponent />);

      // 验证组件正确渲染
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByTestId('categories-count')).toBeInTheDocument();
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-collapsed')).toBeInTheDocument();
    });

    it('应该有正确的初始状态', () => {
      render(<TestCategoryComponent />);

      // 验证初始状态
      expect(screen.getByTestId('categories-count')).toHaveTextContent('Categories: 0');
      expect(screen.getByTestId('error-state')).toHaveTextContent('Error: none');
      expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('Sidebar Collapsed: false');
    });

    it('应该能够切换侧边栏状态', async () => {
      render(<TestCategoryComponent />);

      const toggleButton = screen.getByTestId('toggle-sidebar');
      
      // 初始状态
      expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('Sidebar Collapsed: false');
      
      // 点击切换
      await user.click(toggleButton);
      
      // 验证状态变化
      await waitFor(() => {
        expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('Sidebar Collapsed: true');
      });
    });
  });

  describe('API集成测试', () => {
    it('应该在mount时触发categories加载', async () => {
      const { categoriesAPI } = await import('../services/api');
      
      render(<TestCategoryComponent />);

      // 验证API调用
      await waitFor(() => {
        expect(categoriesAPI.getCategories).toHaveBeenCalled();
        expect(categoriesAPI.getCategoryStats).toHaveBeenCalled();
      });
    });

    it('应该处理加载状态', async () => {
      render(<TestCategoryComponent />);

      // 初始可能会有短暂的加载状态
      const loadingElement = screen.getByTestId('loading-state');
      expect(loadingElement).toBeInTheDocument();
      
      // 等待加载完成
      await waitFor(() => {
        expect(loadingElement).toHaveTextContent('Loading: false');
      });
    });
  });

  describe('错误处理测试', () => {
    it('应该正确处理API错误', async () => {
      // Mock API错误
      const { categoriesAPI } = await import('../services/api');
      vi.mocked(categoriesAPI.getCategories).mockRejectedValueOnce(
        new Error('API Error')
      );

      render(<TestCategoryComponent />);

      // 等待错误状态
      await waitFor(() => {
        const errorElement = screen.getByTestId('error-state');
        expect(errorElement).toHaveTextContent('Error: 无法加载分类数据');
      }, { timeout: 3000 });
    });
  });

  describe('Provider嵌套测试', () => {
    it('应该在正确的Provider结构中工作', () => {
      // TDD: 验证我们的test-utils正确配置了所有必需的Providers
      expect(() => {
        render(<TestCategoryComponent />);
      }).not.toThrow();

      // 验证AuthProvider mock正常工作
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    });
  });

  describe('Context方法测试', () => {
    it('应该提供所有必需的Context方法', () => {
      const TestMethodsComponent = () => {
        const context = useCategory();
        
        return (
          <div>
            <div data-testid="has-select-category">
              {typeof context.selectCategory === 'function' ? 'true' : 'false'}
            </div>
            <div data-testid="has-toggle-sidebar">
              {typeof context.toggleSidebar === 'function' ? 'true' : 'false'}
            </div>
            <div data-testid="has-refresh-categories">
              {typeof context.refreshCategories === 'function' ? 'true' : 'false'}
            </div>
            <div data-testid="has-create-category">
              {typeof context.createCategory === 'function' ? 'true' : 'false'}
            </div>
          </div>
        );
      };

      render(<TestMethodsComponent />);

      expect(screen.getByTestId('has-select-category')).toHaveTextContent('true');
      expect(screen.getByTestId('has-toggle-sidebar')).toHaveTextContent('true');
      expect(screen.getByTestId('has-refresh-categories')).toHaveTextContent('true');
      expect(screen.getByTestId('has-create-category')).toHaveTextContent('true');
    });
  });
});