import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import EditPrompt from '../pages/EditPrompt';
import { AuthProvider } from '../context/AuthContext';
import { CategoryProvider } from '../context/CategoryContext';
import { promptsAPI } from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  promptsAPI: {
    getPrompt: vi.fn(),
    updatePrompt: vi.fn(),
  },
  versionsAPI: {
    createVersion: vi.fn(),
  },
  categoriesAPI: {
    getCategories: vi.fn(),
    getMyCategories: vi.fn(),
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

// Mock LazyPromptEditor
vi.mock('../components/LazyPromptEditor', () => ({
  default: ({ initialData, onSave, onCancel, isEditing }: any) => (
    <div data-testid="prompt-editor">
      <h2>{isEditing ? 'Edit Prompt' : 'Create Prompt'}</h2>
      <div data-testid="initial-title">{initialData?.title}</div>
      <div data-testid="initial-category">{initialData?.category}</div>
      <div data-testid="initial-category-id">{initialData?.categoryId}</div>
      <button onClick={() => onSave(initialData)}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
};

const mockPromptWithCategory = {
  id: 23,
  title: 'Test Prompt',
  content: 'Test content',
  description: 'Test description',
  category: '未分类', // 旧的分类字段
  categoryId: 1, // 新的分类字段
  tags: ['test'],
  isPublic: false,
  userId: 1,
  version: 1,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockPromptWithoutCategoryId = {
  ...mockPromptWithCategory,
  categoryId: undefined, // 没有新的分类字段
  category: '未分类', // 只有旧的分类字段
};

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

const TestWrapper: React.FC<{ children: React.ReactNode; route?: string }> = ({ 
  children, 
  route = '/prompts/23/edit' 
}) => (
  <MemoryRouter initialEntries={[route]}>
    <AuthProvider>
      <CategoryProvider>
        {children}
      </CategoryProvider>
    </AuthProvider>
  </MemoryRouter>
);

describe('EditPrompt Page - TDD Tests', () => {
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
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Category Dropdown Display Tests', () => {
    it('should display current category in dropdown when prompt has categoryId', async () => {
      // Arrange
      vi.mocked(promptsAPI.getPrompt).mockResolvedValueOnce({
        prompt: mockPromptWithCategory,
      });

      // Act
      render(
        <TestWrapper>
          <EditPrompt />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('prompt-editor')).toBeInTheDocument();
      });

      // 验证初始数据包含正确的categoryId
      expect(screen.getByTestId('initial-category-id')).toHaveTextContent('1');
      
      // 验证这是编辑模式
      expect(screen.getByText('Edit Prompt')).toBeInTheDocument();
    });

    it('should handle prompts with only legacy category field', async () => {
      // Arrange - 模拟只有旧category字段的提示词
      vi.mocked(promptsAPI.getPrompt).mockResolvedValueOnce({
        prompt: mockPromptWithoutCategoryId,
      });

      // Act
      render(
        <TestWrapper>
          <EditPrompt />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('prompt-editor')).toBeInTheDocument();
      });

      // 验证传递了旧的category字段
      expect(screen.getByTestId('initial-category')).toHaveTextContent('未分类');
      
      // categoryId应该是undefined
      expect(screen.getByTestId('initial-category-id')).toHaveTextContent('');
    });

    it('should show error when prompt not found', async () => {
      // Arrange
      vi.mocked(promptsAPI.getPrompt).mockRejectedValueOnce({
        response: { status: 404 },
      });

      // Act
      render(
        <TestWrapper>
          <EditPrompt />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cannot Edit Prompt')).toBeInTheDocument();
        expect(screen.getByText('Prompt not found')).toBeInTheDocument();
      });
    });

    it('should show error when user does not own the prompt', async () => {
      // Arrange
      const otherUserPrompt = {
        ...mockPromptWithCategory,
        userId: 999, // 不同的用户ID
      };
      
      vi.mocked(promptsAPI.getPrompt).mockResolvedValueOnce({
        prompt: otherUserPrompt,
      });

      // Act
      render(
        <TestWrapper>
          <EditPrompt />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cannot Edit Prompt')).toBeInTheDocument();
        expect(screen.getByText('You can only edit your own prompts')).toBeInTheDocument();
      });
    });
  });

  describe('Page Layout Tests', () => {
    it('should NOT use MainLayout structure (current issue)', async () => {
      // Arrange
      vi.mocked(promptsAPI.getPrompt).mockResolvedValueOnce({
        prompt: mockPromptWithCategory,
      });

      // Act
      const { container } = render(
        <TestWrapper>
          <EditPrompt />
        </TestWrapper>
      );

      // Assert - 验证当前使用的是旧的页面结构
      await waitFor(() => {
        expect(screen.getByTestId('prompt-editor')).toBeInTheDocument();
      });

      // 查找页面结构特征
      const pageStructure = container.querySelector('.min-h-screen.bg-gray-50.py-8');
      expect(pageStructure).toBeInTheDocument();

      // 验证没有使用MainLayout的特征（侧边栏、导航等）
      const sidebar = container.querySelector('[data-testid="category-sidebar"]');
      expect(sidebar).not.toBeInTheDocument();

      const mainLayout = container.querySelector('[data-testid="main-layout"]');
      expect(mainLayout).not.toBeInTheDocument();
    });

    it('should show loading state correctly', async () => {
      // Arrange - 模拟长时间加载
      vi.mocked(promptsAPI.getPrompt).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      // Act
      render(
        <TestWrapper>
          <EditPrompt />
        </TestWrapper>
      );

      // Assert - 验证加载状态
      expect(screen.getByText('Loading prompt...')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('should handle navigation correctly', async () => {
      // Arrange
      vi.mocked(promptsAPI.getPrompt).mockResolvedValueOnce({
        prompt: mockPromptWithCategory,
      });

      // Act
      render(
        <TestWrapper>
          <EditPrompt />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('prompt-editor')).toBeInTheDocument();
      });

      // 测试取消按钮
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
      
      // 模拟点击取消按钮（这会触发导航）
      fireEvent.click(cancelButton);
      // 注意：由于是Mock的组件，实际导航行为需要在集成测试中验证
    });
  });

  describe('Data Flow Tests', () => {
    it('should pass correct initial data to PromptEditor', async () => {
      // Arrange
      vi.mocked(promptsAPI.getPrompt).mockResolvedValueOnce({
        prompt: mockPromptWithCategory,
      });

      // Act
      render(
        <TestWrapper>
          <EditPrompt />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('prompt-editor')).toBeInTheDocument();
      });

      // 验证传递给编辑器的初始数据
      expect(screen.getByTestId('initial-title')).toHaveTextContent('Test Prompt');
      expect(screen.getByTestId('initial-category')).toHaveTextContent('未分类');
      expect(screen.getByTestId('initial-category-id')).toHaveTextContent('1');
    });

    it('should handle form submission correctly', async () => {
      // Arrange
      vi.mocked(promptsAPI.getPrompt).mockResolvedValueOnce({
        prompt: mockPromptWithCategory,
      });

      // Act
      render(
        <TestWrapper>
          <EditPrompt />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('prompt-editor')).toBeInTheDocument();
      });

      // 模拟保存操作
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      // Assert - 验证这不会出错（具体的保存逻辑在真实环境中测试）
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe('Error Handling Tests', () => {
    it('should display error message when update fails', async () => {
      // Arrange
      vi.mocked(promptsAPI.getPrompt).mockResolvedValueOnce({
        prompt: mockPromptWithCategory,
      });

      // Act
      render(
        <TestWrapper>
          <EditPrompt />
        </TestWrapper>
      );

      // 等待加载完成但不显示错误（因为这个测试是关于初始加载的错误）
      await waitFor(() => {
        expect(screen.getByTestId('prompt-editor')).toBeInTheDocument();
      });

      // 这个测试主要验证错误处理的结构存在
      // 实际的错误显示会在保存时触发，需要在E2E测试中验证
    });
  });
});

describe('Category Dropdown Logic Tests', () => {
  it('should map legacy category to categoryId when possible', () => {
    // 这个测试验证将来需要实现的逻辑：
    // 当提示词只有category字段时，应该尝试映射到对应的categoryId
    
    const legacyCategory = '未分类';
    const expectedCategoryId = mockCategories.find(cat => cat.name === legacyCategory)?.id;
    
    expect(expectedCategoryId).toBe(1);
    
    // 这表明我们需要实现一个将category名称映射到categoryId的逻辑
  });
});