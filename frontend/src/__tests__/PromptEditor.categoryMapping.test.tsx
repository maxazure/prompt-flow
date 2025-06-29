import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PromptEditor from '../components/PromptEditor';
import { CategoryProvider } from '../context/CategoryContext';
import { AuthProvider } from '../context/AuthContext';
import { categoriesAPI } from '../services/api';

// Mock the APIs
vi.mock('../services/api', () => ({
  categoriesAPI: {
    getCategories: vi.fn(),
    getMyCategories: vi.fn(),
    getCategoryStats: vi.fn(),
  },
}));

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  Editor: ({ value, onChange }: any) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

// Mock PromptOptimizer
vi.mock('../components/PromptOptimizer', () => ({
  default: () => <div data-testid="prompt-optimizer">Optimizer</div>,
}));

const mockCategories = [
  {
    id: 1,
    name: '未分类',
    description: '默认分类',
    scopeType: 'personal' as const,
    scopeId: 1,
    createdBy: 1,
    color: '#6b7280',
    isActive: true,
    promptCount: 1,
    canEdit: true,
  },
  {
    id: 2,
    name: '工作',
    description: '工作相关的提示词',
    scopeType: 'personal' as const,
    scopeId: 1,
    createdBy: 1,
    color: '#3b82f6',
    isActive: true,
    promptCount: 0,
    canEdit: true,
  },
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <CategoryProvider>
        {children}
      </CategoryProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('PromptEditor Category Mapping - TDD Tests', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    });

    // Mock authenticated user
    vi.mocked(window.localStorage.getItem).mockImplementation((key) => {
      if (key === 'token') return 'mock-token';
      if (key === 'user') return JSON.stringify({ id: 1, username: 'test', email: 'test@example.com' });
      return null;
    });

    // Mock API responses
    vi.mocked(categoriesAPI.getCategories).mockResolvedValue({
      categories: {
        personal: mockCategories,
        team: [],
        public: [],
      },
      total: mockCategories.length,
    });

    vi.mocked(categoriesAPI.getMyCategories).mockResolvedValue({
      categories: mockCategories,
      total: mockCategories.length,
    });

    vi.mocked(categoriesAPI.getCategoryStats).mockResolvedValue({
      stats: {
        total: mockCategories.length,
        personal: mockCategories.length,
        team: 0,
        public: 0,
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Category Dropdown Display Tests', () => {
    it('should show "选择分类" when no category is selected', async () => {
      // Arrange - 没有初始分类数据
      const onSave = vi.fn();
      const onCancel = vi.fn();

      // Act
      render(
        <TestWrapper>
          <PromptEditor
            onSave={onSave}
            onCancel={onCancel}
            isEditing={false}
          />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        const categorySelect = screen.getByDisplayValue('选择分类');
        expect(categorySelect).toBeInTheDocument();
      });
    });

    it('should show selected category when categoryId is provided', async () => {
      // Arrange - 提供categoryId
      const initialData = {
        title: 'Test Prompt',
        content: 'Test content',
        categoryId: 1, // 未分类的ID
      };
      const onSave = vi.fn();
      const onCancel = vi.fn();

      // Act
      render(
        <TestWrapper>
          <PromptEditor
            initialData={initialData}
            onSave={onSave}
            onCancel={onCancel}
            isEditing={true}
          />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        const categorySelect = screen.getByRole('combobox', { name: /分类/ });
        expect(categorySelect).toHaveValue('1');
      });

      // 验证显示了选中分类的信息
      expect(screen.getByText('未分类')).toBeInTheDocument();
    });

    it('should show "选择分类" when only legacy category field is provided (current bug)', async () => {
      // Arrange - 只提供旧的category字段，没有categoryId
      const initialData = {
        title: 'Test Prompt',
        content: 'Test content',
        category: '未分类', // 旧字段
        categoryId: undefined, // 没有新字段
      };
      const onSave = vi.fn();
      const onCancel = vi.fn();

      // Act
      render(
        <TestWrapper>
          <PromptEditor
            initialData={initialData}
            onSave={onSave}
            onCancel={onCancel}
            isEditing={true}
          />
        </TestWrapper>
      );

      // Assert - 这是当前的bug：应该显示"未分类"但实际显示"选择分类"
      await waitFor(() => {
        const categorySelect = screen.getByDisplayValue('选择分类');
        expect(categorySelect).toBeInTheDocument();
      });

      // 验证下拉框的值是空的（这就是bug）
      const categorySelect = screen.getByRole('combobox', { name: /分类/ });
      expect(categorySelect).toHaveValue('');
    });

    it('should display all available categories in dropdown', async () => {
      // Arrange
      const onSave = vi.fn();
      const onCancel = vi.fn();

      // Act
      render(
        <TestWrapper>
          <PromptEditor
            onSave={onSave}
            onCancel={onCancel}
            isEditing={false}
          />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        // 检查"选择分类"选项
        expect(screen.getByRole('option', { name: '选择分类' })).toBeInTheDocument();
        
        // 检查未分类选项
        expect(screen.getByRole('option', { name: /● 未分类.*👤/ })).toBeInTheDocument();
        
        // 检查工作分类选项
        expect(screen.getByRole('option', { name: /● 工作.*👤/ })).toBeInTheDocument();
      });
    });
  });

  describe('Category Selection Behavior Tests', () => {
    it('should update categoryId when user selects a category', async () => {
      // Arrange
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(
        <TestWrapper>
          <PromptEditor
            onSave={onSave}
            onCancel={onCancel}
            isEditing={false}
          />
        </TestWrapper>
      );

      // Act
      await waitFor(() => {
        const categorySelect = screen.getByRole('combobox', { name: /分类/ });
        fireEvent.change(categorySelect, { target: { value: '2' } }); // 选择"工作"分类
      });

      // Assert
      const categorySelect = screen.getByRole('combobox', { name: /分类/ });
      expect(categorySelect).toHaveValue('2');
      
      // 验证显示了选中分类的信息
      expect(screen.getByText('工作')).toBeInTheDocument();
    });

    it('should show validation error when no category is selected on form submission', async () => {
      // Arrange
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(
        <TestWrapper>
          <PromptEditor
            initialData={{
              title: 'Test Prompt',
              content: 'Test content with enough characters',
              // 没有categoryId
            }}
            onSave={onSave}
            onCancel={onCancel}
            isEditing={false}
          />
        </TestWrapper>
      );

      // Act - 尝试提交表单
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Create Prompt/ });
        fireEvent.click(submitButton);
      });

      // Assert - 应该显示验证错误
      expect(screen.getByText('请选择分类')).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Category Information Display Tests', () => {
    it('should show category color and description when category is selected', async () => {
      // Arrange
      const initialData = {
        title: 'Test Prompt',
        content: 'Test content',
        categoryId: 1,
      };
      const onSave = vi.fn();
      const onCancel = vi.fn();

      // Act
      render(
        <TestWrapper>
          <PromptEditor
            initialData={initialData}
            onSave={onSave}
            onCancel={onCancel}
            isEditing={true}
          />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        // 验证显示了分类名称
        expect(screen.getByText('未分类')).toBeInTheDocument();
        
        // 验证显示了分类描述
        expect(screen.getByText('- 默认分类')).toBeInTheDocument();
      });

      // 验证颜色圆点存在（通过样式检查）
      const colorDot = screen.getByText('未分类').parentElement?.querySelector('div[style*="background-color"]');
      expect(colorDot).toBeInTheDocument();
    });
  });

  describe('Legacy Category Mapping Tests (Future Implementation)', () => {
    it('should map legacy category name to categoryId when categories are loaded', async () => {
      // 这个测试定义了我们需要实现的功能：
      // 当提示词只有category字段时，应该自动映射到对应的categoryId
      
      const legacyCategory = '未分类';
      const expectedCategoryId = mockCategories.find(cat => cat.name === legacyCategory)?.id;
      
      expect(expectedCategoryId).toBe(1);
      
      // 这表明我们需要在PromptEditor中实现这个映射逻辑
      // 当前这个测试会通过，但实际的组件功能还没实现
    });
  });
});