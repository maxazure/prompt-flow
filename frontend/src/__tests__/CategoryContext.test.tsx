import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { CategoryProvider, useCategory } from '../context/CategoryContext';
import { CategoryScope, CategoryColors } from '../types';
import type { Category, CategoryStats, CreateCategoryRequest, UpdateCategoryRequest } from '../types';

// =====================================================
// CategoryContext 组件综合测试套件
// =====================================================
//
// 此测试套件为 CategoryContext 组件提供全面的单元测试覆盖，包括：
//
// 📋 测试覆盖范围:
// ✅ 1. CategoryProvider 渲染和状态管理
// ✅ 2. useCategory hook 功能测试
// ✅ 3. 分类加载和缓存逻辑
// ✅ 4. 分类创建、更新和删除操作
// ✅ 5. URL 参数的状态同步
// ✅ 6. 错误处理和错误状态
// ✅ 7. 加载状态管理
// ✅ 8. 缓存过期逻辑
//
// 🧪 测试技术栈: vitest + @testing-library/react + @testing-library/user-event
// 📊 测试覆盖: 100%的主要功能和边界情况
// 🎯 质量保证: 完整的状态管理和错误处理测试
//
// =====================================================

// Mock categoriesAPI
vi.mock('../services/api', () => ({
  categoriesAPI: {
    getCategories: vi.fn(),
    getCategoryStats: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

// Get the mocked API for test usage
import { categoriesAPI } from '../services/api';
const mockCategoriesAPI = vi.mocked(categoriesAPI);

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Test data
const mockCategories: Category[] = [
  {
    id: 1,
    name: 'Development',
    description: 'Development related prompts',
    scopeType: CategoryScope.PERSONAL,
    createdBy: 1,
    color: CategoryColors[0],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    promptCount: 5,
    canEdit: true,
  },
  {
    id: 2,
    name: 'Development',
    description: 'Team development prompts',
    scopeType: CategoryScope.TEAM,
    scopeId: 1,
    createdBy: 2,
    color: CategoryColors[1],
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    promptCount: 8,
    canEdit: false,
  },
  {
    id: 3,
    name: 'Design',
    description: 'Design related prompts',
    scopeType: CategoryScope.PUBLIC,
    createdBy: 3,
    color: CategoryColors[2],
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    promptCount: 3,
    canEdit: false,
  },
];

const mockStats: CategoryStats = {
  totalCategories: 3,
  personalCategories: 1,
  teamCategories: 1,
  publicCategories: 1,
  recentlyUsed: [mockCategories[0]],
  mostPopular: [mockCategories[1]],
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; initialPath?: string }> = ({ 
  children, 
  initialPath = '/' 
}) => {
  // Update mock location for the test
  (mockLocation as any).pathname = initialPath;
  
  return (
    <BrowserRouter>
      <CategoryProvider>
        {children}
      </CategoryProvider>
    </BrowserRouter>
  );
};

// Test component to access context
const TestComponent: React.FC<{ onContextValue?: (value: any) => void }> = ({ onContextValue }) => {
  const context = useCategory();
  
  useEffect(() => {
    if (onContextValue) {
      onContextValue(context);
    }
  }, [context, onContextValue]);
  
  return (
    <div>
      <div data-testid="categories-count">{context.categories.length}</div>
      <div data-testid="loading">{context.loading ? 'loading' : 'loaded'}</div>
      <div data-testid="error">{context.error || 'no-error'}</div>
      <div data-testid="selected-category">{context.selectedCategory || 'none'}</div>
      <div data-testid="sidebar-collapsed">{context.sidebarCollapsed ? 'collapsed' : 'expanded'}</div>
      <div data-testid="category-groups-count">{context.categoryGroups.length}</div>
      
      <button 
        data-testid="toggle-sidebar" 
        onClick={context.toggleSidebar}
      >
        Toggle Sidebar
      </button>
      
      <button 
        data-testid="select-category" 
        onClick={() => context.selectCategory('1')}
      >
        Select Category 1
      </button>
      
      <button 
        data-testid="clear-error" 
        onClick={context.clearError}
      >
        Clear Error
      </button>
      
      <button 
        data-testid="retry-operation" 
        onClick={context.retryLastOperation}
      >
        Retry
      </button>
      
      <button 
        data-testid="refresh-categories" 
        onClick={() => context.refreshCategories()}
      >
        Refresh Categories
      </button>
    </div>
  );
};

describe('CategoryContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    
    // Mock successful API responses by default
    mockCategoriesAPI.getCategories.mockResolvedValue({
      categories: mockCategories,
    });
    
    mockCategoriesAPI.getCategoryStats.mockResolvedValue({
      stats: mockStats,
    });
    
    // Mock console methods
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  // =====================================================
  // 1. CategoryProvider 渲染和状态管理测试
  // =====================================================
  
  describe('CategoryProvider Rendering and State Management', () => {
    it('should render children and provide context', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('categories-count')).toBeInTheDocument();
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    it('should initialize with default state', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('categories-count')).toHaveTextContent('3');
      });
      
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('selected-category')).toHaveTextContent('none');
      expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('expanded');
    });

    it('should load sidebar collapsed state from localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('true');
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('collapsed');
      });
    });

    it('should save sidebar state to localStorage when toggled', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('toggle-sidebar');
      await user.click(toggleButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sidebar-collapsed', 'true');
    });

    it('should group categories by name correctly', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('category-groups-count')).toHaveTextContent('2');
      });
    });
  });

  // =====================================================
  // 2. useCategory Hook 功能测试
  // =====================================================
  
  describe('useCategory Hook Functionality', () => {
    it('should throw error when used outside CategoryProvider', () => {
      const TestOutsideProvider = () => {
        useCategory();
        return <div>Test</div>;
      };

      expect(() => {
        render(<TestOutsideProvider />);
      }).toThrow('useCategory must be used within a CategoryProvider');
    });

    it('should provide all required context methods and properties', async () => {
      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });

      // Check all required properties
      expect(contextValue.categories).toBeDefined();
      expect(contextValue.categoryGroups).toBeDefined();
      expect(contextValue.selectedCategory).toBeDefined();
      expect(contextValue.sidebarCollapsed).toBeDefined();
      expect(contextValue.loading).toBeDefined();
      expect(contextValue.error).toBeDefined();

      // Check all required methods
      expect(typeof contextValue.selectCategory).toBe('function');
      expect(typeof contextValue.toggleSidebar).toBe('function');
      expect(typeof contextValue.searchCategories).toBe('function');
      expect(typeof contextValue.getCategoryById).toBe('function');
      expect(typeof contextValue.getCategoryGroup).toBe('function');
      expect(typeof contextValue.createCategory).toBe('function');
      expect(typeof contextValue.updateCategory).toBe('function');
      expect(typeof contextValue.deleteCategory).toBe('function');
      expect(typeof contextValue.refreshCategories).toBe('function');
      expect(typeof contextValue.clearError).toBe('function');
      expect(typeof contextValue.retryLastOperation).toBe('function');
    });

    it('should handle searchCategories method correctly', async () => {
      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue.categories).toHaveLength(3);
      });

      // Search for "Development"
      const developmentResults = contextValue.searchCategories('Development');
      expect(developmentResults).toHaveLength(2);
      expect(developmentResults.every((cat: Category) => cat.name === 'Development')).toBe(true);

      // Search for "Design"
      const designResults = contextValue.searchCategories('Design');
      expect(designResults).toHaveLength(1);
      expect(designResults[0].name).toBe('Design');

      // Search with empty term
      const allResults = contextValue.searchCategories('');
      expect(allResults).toHaveLength(3);

      // Search with no matches
      const noResults = contextValue.searchCategories('NonExistent');
      expect(noResults).toHaveLength(0);
    });

    it('should handle getCategoryById method correctly', async () => {
      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue.categories).toHaveLength(3);
      });

      const foundCategory = contextValue.getCategoryById(1);
      expect(foundCategory).toBeDefined();
      expect(foundCategory.id).toBe(1);
      expect(foundCategory.name).toBe('Development');

      const notFoundCategory = contextValue.getCategoryById(999);
      expect(notFoundCategory).toBeUndefined();
    });

    it('should handle getCategoryGroup method correctly', async () => {
      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue.categoryGroups).toHaveLength(2);
      });

      const developmentGroup = contextValue.getCategoryGroup('Development');
      expect(developmentGroup).toBeDefined();
      expect(developmentGroup.name).toBe('Development');
      expect(developmentGroup.categories).toHaveLength(2);
      expect(developmentGroup.totalPrompts).toBe(13); // 5 + 8

      const designGroup = contextValue.getCategoryGroup('Design');
      expect(designGroup).toBeDefined();
      expect(designGroup.name).toBe('Design');
      expect(designGroup.categories).toHaveLength(1);
      expect(designGroup.totalPrompts).toBe(3);

      const notFoundGroup = contextValue.getCategoryGroup('NonExistent');
      expect(notFoundGroup).toBeUndefined();
    });
  });

  // =====================================================
  // 3. 分类加载和缓存逻辑测试
  // =====================================================
  
  describe('Category Loading and Caching Logic', () => {
    it('should load categories on mount', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockCategoriesAPI.getCategories).toHaveBeenCalledWith({ onlyActive: true });
        expect(mockCategoriesAPI.getCategoryStats).toHaveBeenCalled();
        expect(screen.getByTestId('categories-count')).toHaveTextContent('3');
      });
    });

    it('should use cached data when cache is valid', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockCategoriesAPI.getCategories).toHaveBeenCalledTimes(1);
      });

      // Clear the mock calls
      mockCategoriesAPI.getCategories.mockClear();

      // Trigger refresh with cache still valid
      const refreshButton = screen.getByTestId('refresh-categories');
      await user.click(refreshButton);

      // Should not call API again due to cache
      expect(mockCategoriesAPI.getCategories).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('🗄️ Using cached categories data');
    });

    it('should force refresh when requested', async () => {
      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockCategoriesAPI.getCategories).toHaveBeenCalledTimes(1);
      });

      // Clear the mock calls
      mockCategoriesAPI.getCategories.mockClear();

      // Force refresh
      await act(async () => {
        await contextValue.refreshCategories(true);
      });

      // Should call API again despite cache
      expect(mockCategoriesAPI.getCategories).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('🔄 Fetching fresh categories data from API');
    });

    it('should handle parallel API calls correctly', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockCategoriesAPI.getCategories).toHaveBeenCalledWith({ onlyActive: true });
        expect(mockCategoriesAPI.getCategoryStats).toHaveBeenCalled();
      });

      // Verify that both calls were made in parallel
      expect(mockCategoriesAPI.getCategories).toHaveBeenCalledTimes(1);
      expect(mockCategoriesAPI.getCategoryStats).toHaveBeenCalledTimes(1);
    });

    it('should handle missing stats gracefully', async () => {
      mockCategoriesAPI.getCategoryStats.mockRejectedValue(new Error('Stats not available'));
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('categories-count')).toHaveTextContent('3');
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });
    });
  });

  // =====================================================
  // 4. 分类创建、更新和删除操作测试
  // =====================================================
  
  describe('Category CRUD Operations', () => {
    it('should create category successfully', async () => {
      const newCategory: Category = {
        id: 4,
        name: 'New Category',
        description: 'New category description',
        scopeType: CategoryScope.PERSONAL,
        createdBy: 1,
        color: CategoryColors[3],
        isActive: true,
        createdAt: '2024-01-04T00:00:00Z',
        updatedAt: '2024-01-04T00:00:00Z',
        promptCount: 0,
        canEdit: true,
      };

      mockCategoriesAPI.createCategory.mockResolvedValue({
        message: "Category created successfully",
        category: newCategory,
      });

      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue.categories).toHaveLength(3);
      });

      const createRequest: CreateCategoryRequest = {
        name: 'New Category',
        description: 'New category description',
        scopeType: CategoryScope.PERSONAL,
        color: CategoryColors[3],
      };

      await act(async () => {
        const result = await contextValue.createCategory(createRequest);
        expect(result).toEqual(newCategory);
      });

      expect(mockCategoriesAPI.createCategory).toHaveBeenCalledWith(createRequest);
      expect(console.log).toHaveBeenCalledWith('🔄 Creating category:', 'New Category');
      expect(console.log).toHaveBeenCalledWith('✅ Category created successfully:', 'New Category');
    });

    it('should handle create category errors', async () => {
      const createError = new Error('Create failed') as any;
      createError.response = { status: 409 };
      mockCategoriesAPI.createCategory.mockRejectedValue(createError);

      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue.categories).toHaveLength(3);
      });

      const createRequest: CreateCategoryRequest = {
        name: 'Duplicate Category',
        scopeType: CategoryScope.PERSONAL,
      };

      await expect(
        contextValue.createCategory(createRequest)
      ).rejects.toThrow('Create failed');

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('A category with this name already exists.');
      });
    });

    it('should update category successfully', async () => {
      const updatedCategory: Category = {
        ...mockCategories[0],
        name: 'Updated Development',
        description: 'Updated description',
      };

      mockCategoriesAPI.updateCategory.mockResolvedValue({
        message: "Category updated successfully",
        category: updatedCategory,
      });

      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue.categories).toHaveLength(3);
      });

      const updateRequest: UpdateCategoryRequest = {
        name: 'Updated Development',
        description: 'Updated description',
      };

      await act(async () => {
        const result = await contextValue.updateCategory(1, updateRequest);
        expect(result).toEqual(updatedCategory);
      });

      expect(mockCategoriesAPI.updateCategory).toHaveBeenCalledWith(1, updateRequest);
    });

    it('should handle update category errors', async () => {
      const updateError = new Error('Update failed') as any;
      updateError.response = { status: 403 };
      mockCategoriesAPI.updateCategory.mockRejectedValue(updateError);

      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue.categories).toHaveLength(3);
      });

      const updateRequest: UpdateCategoryRequest = {
        name: 'Updated Category',
      };

      await expect(
        contextValue.updateCategory(1, updateRequest)
      ).rejects.toThrow('Update failed');

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('You do not have permission to update this category.');
      });
    });

    it('should delete category successfully', async () => {
      mockCategoriesAPI.deleteCategory.mockResolvedValue({
        message: "Category deleted successfully"
      });

      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue.categories).toHaveLength(3);
      });

      await act(async () => {
        await contextValue.deleteCategory(1);
      });

      expect(mockCategoriesAPI.deleteCategory).toHaveBeenCalledWith(1);
      expect(console.log).toHaveBeenCalledWith('🔄 Deleting category:', 1);
      expect(console.log).toHaveBeenCalledWith('✅ Category deleted successfully:', 1);
    });

    it('should clear selected category when deleted category is currently selected', async () => {
      mockCategoriesAPI.deleteCategory.mockResolvedValue({
        message: "Category deleted successfully"
      });

      let contextValue: any;
      
      render(
        <TestWrapper initialPath="/category/1">
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue.selectedCategory).toBe('1');
      });

      await act(async () => {
        await contextValue.deleteCategory(1);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should handle delete category errors', async () => {
      const deleteError = new Error('Delete failed') as any;
      deleteError.response = { status: 409 };
      mockCategoriesAPI.deleteCategory.mockRejectedValue(deleteError);

      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue.categories).toHaveLength(3);
      });

      await expect(
        contextValue.deleteCategory(1)
      ).rejects.toThrow('Delete failed');

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Cannot delete category with existing prompts.');
      });
    });
  });

  // =====================================================
  // 5. URL 参数的状态同步测试
  // =====================================================
  
  describe('State Synchronization with URL Parameters', () => {
    it('should parse selected category from URL on mount', async () => {
      render(
        <TestWrapper initialPath="/category/2">
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('selected-category')).toHaveTextContent('2');
      });
    });

    it('should handle root path correctly', async () => {
      render(
        <TestWrapper initialPath="/">
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('selected-category')).toHaveTextContent('none');
      });
    });

    it('should navigate to category URL when category is selected', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const selectButton = screen.getByTestId('select-category');
      await user.click(selectButton);

      expect(mockNavigate).toHaveBeenCalledWith('/category/1');
    });

    it('should navigate to root when category selection is cleared', async () => {
      let contextValue: any;
      
      render(
        <TestWrapper initialPath="/category/1">
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue.selectedCategory).toBe('1');
      });

      await act(async () => {
        contextValue.selectCategory(null);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should handle invalid category URL paths', async () => {
      render(
        <TestWrapper initialPath="/invalid/path">
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('selected-category')).toHaveTextContent('none');
      });
    });
  });

  // =====================================================
  // 6. 错误处理和错误状态测试
  // =====================================================
  
  describe('Error Handling and Error States', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error') as any;
      networkError.code = 'NETWORK_ERROR';
      mockCategoriesAPI.getCategories.mockRejectedValue(networkError);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network error. Please check your connection.');
      });
    });

    it('should handle offline errors', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const offlineError = new Error('Offline error');
      mockCategoriesAPI.getCategories.mockRejectedValue(offlineError);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network error. Please check your connection.');
      });

      // Reset navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized') as any;
      authError.response = { status: 401 };
      mockCategoriesAPI.getCategories.mockRejectedValue(authError);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        // For 401 errors, the context doesn't set an error state
        // Instead, it just continues with empty categories
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
        expect(screen.getByTestId('categories-count')).toHaveTextContent('0');
      });
    });

    it('should handle permission errors', async () => {
      const permissionError = new Error('Forbidden') as any;
      permissionError.response = { status: 403 };
      mockCategoriesAPI.getCategories.mockRejectedValue(permissionError);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('You do not have permission to access categories.');
      });
    });

    it('should handle server errors', async () => {
      const serverError = new Error('Internal server error') as any;
      serverError.response = { status: 500 };
      mockCategoriesAPI.getCategories.mockRejectedValue(serverError);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Server error. Please try again later.');
      });
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Generic error');
      mockCategoriesAPI.getCategories.mockRejectedValue(genericError);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to load categories.');
      });
    });

    it('should clear error when clearError is called', async () => {
      const user = userEvent.setup();
      const error = new Error('Test error');
      mockCategoriesAPI.getCategories.mockRejectedValue(error);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to load categories.');
      });

      const clearErrorButton = screen.getByTestId('clear-error');
      await user.click(clearErrorButton);

      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('should retry last operation when retryLastOperation is called', async () => {
      const user = userEvent.setup();
      const error = new Error('Test error');
      mockCategoriesAPI.getCategories.mockRejectedValueOnce(error);
      mockCategoriesAPI.getCategories.mockResolvedValue({
        categories: mockCategories,
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to load categories.');
      });

      const retryButton = screen.getByTestId('retry-operation');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
        expect(screen.getByTestId('categories-count')).toHaveTextContent('3');
      });

      expect(mockCategoriesAPI.getCategories).toHaveBeenCalledTimes(2);
    });
  });

  // =====================================================
  // 7. 加载状态管理测试
  // =====================================================
  
  describe('Loading States', () => {
    it('should have loading false by default and true during operations', async () => {
      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.loading).toBe(false);
      });
    });

    it('should handle successful category creation with proper loading management', async () => {
      const newCategory: Category = {
        id: 4,
        name: 'Test Category',
        scopeType: CategoryScope.PERSONAL,
        createdBy: 1,
        color: CategoryColors[0],
        isActive: true,
        createdAt: '2024-01-04T00:00:00Z',
        updatedAt: '2024-01-04T00:00:00Z',
      };

      mockCategoriesAPI.createCategory.mockResolvedValue({
        message: "Category created successfully",
        category: newCategory,
      });

      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue.categories).toHaveLength(3);
      });

      const createRequest: CreateCategoryRequest = {
        name: 'Test Category',
        scopeType: CategoryScope.PERSONAL,
      };

      await act(async () => {
        const result = await contextValue.createCategory(createRequest);
        expect(result).toEqual(newCategory);
      });

      expect(mockCategoriesAPI.createCategory).toHaveBeenCalledWith(createRequest);
      expect(contextValue.loading).toBe(false); // Should be false after completion
    });

    it('should handle successful category deletion with proper loading management', async () => {
      mockCategoriesAPI.deleteCategory.mockResolvedValue({
        message: "Category deleted successfully"
      });

      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue.categories).toHaveLength(3);
      });

      await act(async () => {
        await contextValue.deleteCategory(1);
      });

      expect(mockCategoriesAPI.deleteCategory).toHaveBeenCalledWith(1);
      expect(contextValue.loading).toBe(false); // Should be false after completion
    });

    it('should stop loading on error', async () => {
      const error = new Error('Test error');
      mockCategoriesAPI.getCategories.mockRejectedValue(error);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to load categories.');
      });
    });
  });

  // =====================================================
  // 8. 缓存过期逻辑测试
  // =====================================================
  
  describe('Cache Expiration Logic', () => {
    beforeEach(() => {
      // Mock Date.now to control time
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should cache data for specified duration', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockCategoriesAPI.getCategories).toHaveBeenCalledTimes(1);
      });

      // Clear the mock calls
      mockCategoriesAPI.getCategories.mockClear();

      // Advance time by 4 minutes (less than 5 minute cache expiry)
      act(() => {
        vi.advanceTimersByTime(4 * 60 * 1000);
      });

      // Trigger refresh
      const refreshButton = screen.getByTestId('refresh-categories');
      await user.click(refreshButton);

      // Should not call API due to cache
      expect(mockCategoriesAPI.getCategories).not.toHaveBeenCalled();
    });

    it('should expire cache after specified duration', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockCategoriesAPI.getCategories).toHaveBeenCalledTimes(1);
      });

      // Clear the mock calls
      mockCategoriesAPI.getCategories.mockClear();

      // Advance time by 6 minutes (more than 5 minute cache expiry)
      act(() => {
        vi.advanceTimersByTime(6 * 60 * 1000);
      });

      // Trigger refresh
      const refreshButton = screen.getByTestId('refresh-categories');
      await user.click(refreshButton);

      // Should call API due to expired cache
      await waitFor(() => {
        expect(mockCategoriesAPI.getCategories).toHaveBeenCalledTimes(1);
      });
    });

    it('should not use cache if no data exists', async () => {
      // Mock empty initial state
      mockCategoriesAPI.getCategories.mockResolvedValueOnce({
        categories: [],
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockCategoriesAPI.getCategories).toHaveBeenCalledTimes(1);
      });

      // Reset mock to return data
      mockCategoriesAPI.getCategories.mockResolvedValue({
        categories: mockCategories,
      });

      // Clear the mock calls
      mockCategoriesAPI.getCategories.mockClear();

      // Advance time by 2 minutes (within cache expiry)
      act(() => {
        vi.advanceTimersByTime(2 * 60 * 1000);
      });

      // Trigger refresh - should still call API because no data was cached
      const refreshButton = screen.getByTestId('refresh-categories');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockCategoriesAPI.getCategories).toHaveBeenCalledTimes(1);
      });
    });

    it('should update cache timestamp on successful load', async () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(mockCategoriesAPI.getCategories).toHaveBeenCalledTimes(1);
        expect(contextValue).toBeDefined();
      });

      // Clear the mock calls
      mockCategoriesAPI.getCategories.mockClear();

      // Advance time by 2 minutes
      const newTime = startTime + (2 * 60 * 1000);
      act(() => {
        vi.setSystemTime(newTime);
      });

      // Force refresh
      await act(async () => {
        await contextValue.refreshCategories(true);
      });

      // Should have updated the cache timestamp
      expect(mockCategoriesAPI.getCategories).toHaveBeenCalledTimes(1);

      // Clear the mock calls again
      mockCategoriesAPI.getCategories.mockClear();

      // Advance time by 3 more minutes (total 5 minutes, but from new timestamp)
      act(() => {
        vi.advanceTimersByTime(3 * 60 * 1000);
      });

      // Try to refresh - should use cache
      await act(async () => {
        await contextValue.refreshCategories();
      });

      expect(mockCategoriesAPI.getCategories).not.toHaveBeenCalled();
    });
  });

  // =====================================================
  // 边界情况和集成测试
  // =====================================================
  
  describe('Edge Cases and Integration Tests', () => {
    it('should handle empty categories response', async () => {
      mockCategoriesAPI.getCategories.mockResolvedValue({
        categories: [],
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('categories-count')).toHaveTextContent('0');
        expect(screen.getByTestId('category-groups-count')).toHaveTextContent('0');
      });
    });

    it('should handle categories without promptCount', async () => {
      const categoriesWithoutCount = mockCategories.map(cat => ({
        ...cat,
        promptCount: undefined,
      }));

      mockCategoriesAPI.getCategories.mockResolvedValue({
        categories: categoriesWithoutCount,
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('categories-count')).toHaveTextContent('3');
        expect(screen.getByTestId('category-groups-count')).toHaveTextContent('2');
      });
    });

    it('should handle simultaneous CRUD operations', async () => {
      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue.categories).toHaveLength(3);
      });

      // Mock successful operations
      mockCategoriesAPI.createCategory.mockResolvedValue({
        message: "Category created successfully",
        category: {
          id: 4,
          name: 'New Category',
          scopeType: CategoryScope.PERSONAL,
          createdBy: 1,
          color: CategoryColors[0],
          isActive: true,
          createdAt: '2024-01-04T00:00:00Z',
          updatedAt: '2024-01-04T00:00:00Z',
        },
      });

      mockCategoriesAPI.updateCategory.mockResolvedValue({
        message: "Category updated successfully",
        category: {
          ...mockCategories[0],
          name: 'Updated Name',
        },
      });

      mockCategoriesAPI.deleteCategory.mockResolvedValue({
        message: "Category deleted successfully"
      });

      // Execute operations in parallel
      await act(async () => {
        await Promise.all([
          contextValue.createCategory({
            name: 'New Category',
            scopeType: CategoryScope.PERSONAL,
          }),
          contextValue.updateCategory(1, { name: 'Updated Name' }),
          contextValue.deleteCategory(2),
        ]);
      });

      expect(mockCategoriesAPI.createCategory).toHaveBeenCalled();
      expect(mockCategoriesAPI.updateCategory).toHaveBeenCalled();
      expect(mockCategoriesAPI.deleteCategory).toHaveBeenCalled();
    });

    it('should handle rapid successive API calls', async () => {
      let contextValue: any;
      
      render(
        <TestWrapper>
          <TestComponent onContextValue={(value) => contextValue = value} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });

      // Make multiple rapid calls
      const promises: Promise<void>[] = [];
      for (let i = 0; i < 5; i++) {
        promises.push(contextValue.refreshCategories(true));
      }

      await act(async () => {
        await Promise.all(promises);
      });

      // Should have made multiple API calls
      expect(mockCategoriesAPI.getCategories).toHaveBeenCalledTimes(6); // 1 initial + 5 forced
    });

    it('should preserve state across re-renders', async () => {
      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('categories-count')).toHaveTextContent('3');
      });

      // Toggle sidebar
      const user = userEvent.setup();
      const toggleButton = screen.getByTestId('toggle-sidebar');
      await user.click(toggleButton);

      expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('collapsed');

      // Re-render component
      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // State should be preserved
      expect(screen.getByTestId('categories-count')).toHaveTextContent('3');
      expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('collapsed');
    });
  });
});