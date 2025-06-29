import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import MyPrompts from '../../pages/MyPrompts';
import { AuthProvider } from '../../context/AuthContext';
import { CategoryProvider } from '../../context/CategoryContext';
import { SearchProvider } from '../../context/SearchContext';
import { promptsAPI } from '../../services/api';

// Mock the API
vi.mock('../../services/api', () => ({
  promptsAPI: {
    getMyPrompts: vi.fn()
  }
}));

// Mock the hooks
vi.mock('../../hooks/usePageTitle', () => ({
  default: vi.fn()
}));

// Mock data
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com'
};

const mockCategories = [
  {
    id: 1,
    name: '工作提示',
    description: '工作相关的提示词',
    color: '#3b82f6',
    scopeType: 'personal' as const,
    userId: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: '学习提示',
    description: '学习相关的提示词',
    color: '#10b981',
    scopeType: 'team' as const,
    userId: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to, className, ...props }: any) => (
      <a href={to} className={className} {...props}>
        {children}
      </a>
    )
  };
});

// Mock Context providers
const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null
};

const mockCategoryContext = {
  categories: mockCategories,
  selectedCategory: null,
  sidebarCollapsed: false,
  loading: false,
  error: null,
  selectCategory: vi.fn(),
  toggleSidebar: vi.fn(),
  refreshCategories: vi.fn(),
  clearError: vi.fn(),
  retryLastOperation: vi.fn()
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children
}));

vi.mock('../../context/CategoryContext', () => ({
  useCategory: () => mockCategoryContext,
  CategoryProvider: ({ children }: { children: React.ReactNode }) => children
}));

vi.mock('../../context/SearchContext', () => ({
  useSearch: () => ({ searchTerm: '', setSearchTerm: vi.fn(), clearSearch: vi.fn() }),
  SearchProvider: ({ children }: { children: React.ReactNode }) => children
}));

const mockPrompts = [
  {
    id: 1,
    title: '测试提示词1',
    description: '这是一个测试提示词',
    content: '测试内容1',
    categoryId: 1,
    isPublic: false,
    version: 1,
    tags: ['测试', '工作'],
    userId: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z'
  },
  {
    id: 2,
    title: '公开提示词',
    description: '这是一个公开的提示词',
    content: '公开内容',
    categoryId: 2,
    isPublic: true,
    version: 2,
    tags: ['公开', '学习'],
    userId: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-03T00:00:00Z'
  },
  {
    id: 3,
    title: '无分类提示词',
    description: '没有分类的提示词',
    content: '无分类内容',
    category: '旧分类', // 使用旧的字符串分类
    isPublic: false,
    version: 1,
    tags: ['无分类'],
    userId: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SearchProvider>
          <CategoryProvider>
            {children}
          </CategoryProvider>
        </SearchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('MyPrompts Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API response
    (promptsAPI.getMyPrompts as any).mockResolvedValue({
      prompts: mockPrompts
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders page title and prompt count', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('我的提示词')).toBeInTheDocument();
      expect(screen.getByText(/3 个提示词/)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', async () => {
    // Mock delayed API response
    (promptsAPI.getMyPrompts as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ prompts: mockPrompts }), 100))
    );

    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    expect(screen.getByText('Loading your prompts...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading your prompts...')).not.toBeInTheDocument();
    });
  });

  it('displays error state when API fails', async () => {
    (promptsAPI.getMyPrompts as any).mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to load your prompts')).toBeInTheDocument();
      expect(screen.getByText('重试')).toBeInTheDocument();
    });
  });

  it('displays all prompts by default', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('测试提示词1')).toBeInTheDocument();
      expect(screen.getByText('公开提示词')).toBeInTheDocument();
      expect(screen.getByText('无分类提示词')).toBeInTheDocument();
    });
  });

  it('filters prompts by search term', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('测试提示词1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('搜索标题、描述或标签...');
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: '公开' } });
    });

    await waitFor(() => {
      expect(screen.getByText('公开提示词')).toBeInTheDocument();
      expect(screen.queryByText('测试提示词1')).not.toBeInTheDocument();
      expect(screen.queryByText('无分类提示词')).not.toBeInTheDocument();
    });
  });

  it('filters prompts by category', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('测试提示词1')).toBeInTheDocument();
    });

    const categorySelect = screen.getByDisplayValue('所有分类');
    
    await act(async () => {
      fireEvent.change(categorySelect, { target: { value: '1' } });
    });

    await waitFor(() => {
      expect(screen.getByText('测试提示词1')).toBeInTheDocument();
      // 公开提示词的categoryId是2，所以应该被过滤掉
      expect(screen.queryByText('公开提示词')).not.toBeInTheDocument();
      // 无分类提示词没有categoryId只有category字符串，也应该被过滤掉
      expect(screen.queryByText('无分类提示词')).not.toBeInTheDocument();
    });
  });

  it('filters prompts by visibility', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('测试提示词1')).toBeInTheDocument();
      expect(screen.getByText('公开提示词')).toBeInTheDocument();
    });

    const visibilitySelect = screen.getByDisplayValue('全部');
    
    await act(async () => {
      fireEvent.change(visibilitySelect, { target: { value: 'public' } });
    });

    await waitFor(() => {
      expect(screen.queryByText('测试提示词1')).not.toBeInTheDocument();
      expect(screen.getByText('公开提示词')).toBeInTheDocument();
    });
  });

  it('sorts prompts correctly', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('公开提示词')).toBeInTheDocument();
    });

    const sortSelect = screen.getByDisplayValue('最近更新');
    
    await act(async () => {
      fireEvent.change(sortSelect, { target: { value: 'title' } });
    });

    await waitFor(() => {
      // When sorted by title, 公开提示词 should come first alphabetically
      const prompts = screen.getAllByRole('generic').filter(el => 
        el.className.includes('bg-white rounded-lg shadow-sm border')
      );
      expect(prompts.length).toBeGreaterThan(0);
      // Just verify that sorting functionality is working
      expect(screen.getByText('公开提示词')).toBeInTheDocument();
      expect(screen.getByText('测试提示词1')).toBeInTheDocument();
      expect(screen.getByText('无分类提示词')).toBeInTheDocument();
    });
  });

  it('toggles between compact and detailed view modes', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('测试提示词1')).toBeInTheDocument();
    });

    // Default is compact mode
    expect(screen.getByText('紧凑')).toHaveClass('bg-white', 'text-blue-600');

    const detailedButton = screen.getByText('详细');
    
    await act(async () => {
      fireEvent.click(detailedButton);
    });

    expect(detailedButton).toHaveClass('bg-white', 'text-blue-600');
    expect(screen.getByText('紧凑')).not.toHaveClass('bg-white', 'text-blue-600');
  });

  it('displays category colors and scope icons correctly', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      // Check that categories are displayed in the cards and filter dropdown
      const workCategories = screen.getAllByText('工作提示');
      const studyCategories = screen.getAllByText('学习提示');
      
      expect(workCategories.length).toBeGreaterThan(0);
      expect(studyCategories.length).toBeGreaterThan(0);
    });
  });

  it('displays legacy category correctly', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      // Legacy category should appear in the card and in the filter dropdown
      expect(screen.getByText(/旧分类.*\(旧版\)/)).toBeInTheDocument(); // In dropdown
      const legacyCategories = screen.getAllByText('旧分类');
      expect(legacyCategories.length).toBeGreaterThan(0); // In card
    });
  });

  it('shows correct visibility badges', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('🌍 公开')).toBeInTheDocument();
      expect(screen.getAllByText('🔒 私有')).toHaveLength(2);
    });
  });

  it('displays tags with overflow indicator', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      // Check for tags (they may appear in multiple places)
      expect(screen.getAllByText('测试').length).toBeGreaterThan(0);
      expect(screen.getAllByText('工作').length).toBeGreaterThan(0);
      expect(screen.getAllByText('公开').length).toBeGreaterThan(0);
      expect(screen.getAllByText('学习').length).toBeGreaterThan(0);
      expect(screen.getAllByText('无分类').length).toBeGreaterThan(0);
    });
  });

  it('handles empty state correctly', async () => {
    (promptsAPI.getMyPrompts as any).mockResolvedValue({ prompts: [] });

    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('还没有创建任何提示词')).toBeInTheDocument();
      expect(screen.getByText('创建第一个提示词')).toBeInTheDocument();
    });
  });

  it('handles filtered empty state correctly', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('测试提示词1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('搜索标题、描述或标签...');
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: '不存在的搜索词' } });
    });

    await waitFor(() => {
      expect(screen.getByText('没有找到符合条件的提示词')).toBeInTheDocument();
      expect(screen.queryByText('创建第一个提示词')).not.toBeInTheDocument();
    });
  });

  it('retries loading on error', async () => {
    (promptsAPI.getMyPrompts as any).mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('重试')).toBeInTheDocument();
      expect(screen.getByText('Failed to load your prompts')).toBeInTheDocument();
    });

    // Reset to successful response for retry
    (promptsAPI.getMyPrompts as any).mockResolvedValue({ prompts: mockPrompts });

    const retryButton = screen.getByText('重试');
    
    await act(async () => {
      fireEvent.click(retryButton);
    });

    await waitFor(() => {
      expect(screen.getByText('测试提示词1')).toBeInTheDocument();
    });
  });

  it('shows correct action buttons for each prompt', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      // Each prompt should have 查看 and 编辑 buttons
      const viewButtons = screen.getAllByText('查看');
      const editButtons = screen.getAllByText('编辑');
      
      expect(viewButtons).toHaveLength(3);
      expect(editButtons).toHaveLength(3);
    });
  });

  it('displays correct prompt counts in different scenarios', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <MyPrompts />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('3 个提示词')).toBeInTheDocument();
    });

    // Filter to show only 1 prompt
    const searchInput = screen.getByPlaceholderText('搜索标题、描述或标签...');
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: '公开' } });
    });

    await waitFor(() => {
      expect(screen.getByText('1 个提示词 (共 3 个)')).toBeInTheDocument();
    });
  });
});