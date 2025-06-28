/**
 * ProjectPromptList 组件单元测试
 * 测试项目提示词列表组件的渲染和交互功能
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ProjectPromptList from '../../components/ProjectPromptList';
import type { Prompt, Project } from '../../types';

describe('ProjectPromptList', () => {
  const mockProject: Project = {
    id: 1,
    name: '测试项目',
    description: '测试项目描述',
    background: '你是一个专业的AI助手，请帮助用户完成以下任务。',
    userId: 1,
    isPublic: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    promptCount: 3
  };

  const mockPrompts: Prompt[] = [
    {
      id: 1,
      title: '邮件助手',
      content: '请写一封{{邮件类型:邮件类型:商务邮件}}给{{收件人:收件人姓名:张先生}}',
      description: '智能邮件生成助手',
      version: 1,
      userId: 1,
      isPublic: false,
      projectId: 1,
      promptNumber: 'P1-001',
      isProjectPrompt: true,
      showInCategory: true,
      tags: ['邮件', '商务'],
      user: { id: 1, username: 'testuser' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      title: '文章标题生成器',
      content: '为{{主题:文章主题:科技发展}}生成吸引人的标题',
      description: '生成有吸引力的文章标题',
      version: 1,
      userId: 1,
      isPublic: true,
      projectId: 1,
      promptNumber: 'P1-002',
      isProjectPrompt: true,
      showInCategory: false,
      tags: ['写作', '标题'],
      user: { id: 1, username: 'testuser' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      title: '简单提示词',
      content: '这是一个没有参数的简单提示词',
      description: '简单描述',
      version: 1,
      userId: 2,
      isPublic: false,
      projectId: 1,
      promptNumber: 'P1-003',
      isProjectPrompt: true,
      showInCategory: true,
      user: { id: 2, username: 'otheruser' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const defaultProps = {
    prompts: mockPrompts,
    project: mockProject,
    loading: false,
    onCopy: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onUse: vi.fn(),
    onCreateNew: vi.fn()
  };

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <ProjectPromptList {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该渲染列表标题和统计信息', () => {
      renderComponent();
      
      expect(screen.getByText('项目提示词')).toBeInTheDocument();
      expect(screen.getByText('3 个提示词')).toBeInTheDocument();
    });

    it('应该渲染所有提示词卡片', () => {
      renderComponent();
      
      expect(screen.getByText('邮件助手')).toBeInTheDocument();
      expect(screen.getByText('文章标题生成器')).toBeInTheDocument();
      expect(screen.getByText('简单提示词')).toBeInTheDocument();
    });

    it('应该显示新建提示词按钮', () => {
      renderComponent();
      
      expect(screen.getByText('新建提示词')).toBeInTheDocument();
    });

    it('应该显示搜索框', () => {
      renderComponent();
      
      expect(screen.getByPlaceholderText('搜索提示词...')).toBeInTheDocument();
    });

    it('应该显示筛选选项', () => {
      renderComponent();
      
      expect(screen.getByDisplayValue('全部')).toBeInTheDocument();
    });
  });

  describe('加载状态', () => {
    it('应该显示加载指示器', () => {
      renderComponent({ loading: true });
      
      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('应该隐藏内容当加载时', () => {
      renderComponent({ loading: true });
      
      expect(screen.queryByText('邮件助手')).not.toBeInTheDocument();
    });
  });

  describe('空状态', () => {
    it('应该显示空状态当没有提示词时', () => {
      renderComponent({ prompts: [] });
      
      expect(screen.getByText('项目中还没有提示词')).toBeInTheDocument();
      expect(screen.getByText('创建第一个提示词')).toBeInTheDocument();
    });

    it('应该显示搜索为空的状态', async () => {
      renderComponent();
      
      // 输入一个不存在的搜索词
      const searchInput = screen.getByPlaceholderText('搜索提示词...');
      await userEvent.type(searchInput, '不存在的词');
      
      await waitFor(() => {
        expect(screen.getByText('没有匹配的提示词')).toBeInTheDocument();
      });
    });
  });

  describe('搜索功能', () => {
    it('应该过滤提示词根据标题', async () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('搜索提示词...');
      await userEvent.type(searchInput, '邮件');
      
      // 应该只显示包含"邮件"的提示词
      expect(screen.getByText('邮件助手')).toBeInTheDocument();
      expect(screen.queryByText('文章标题生成器')).not.toBeInTheDocument();
    });

    it('应该过滤提示词根据描述', async () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('搜索提示词...');
      await userEvent.type(searchInput, '智能');
      
      expect(screen.getByText('邮件助手')).toBeInTheDocument();
      expect(screen.queryByText('文章标题生成器')).not.toBeInTheDocument();
    });

    it('应该过滤提示词根据内容', async () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('搜索提示词...');
      await userEvent.type(searchInput, '收件人');
      
      expect(screen.getByText('邮件助手')).toBeInTheDocument();
      expect(screen.queryByText('文章标题生成器')).not.toBeInTheDocument();
    });

    it('应该清除搜索', async () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('搜索提示词...');
      await userEvent.type(searchInput, '邮件');
      
      // 清除搜索
      await userEvent.clear(searchInput);
      
      // 应该显示所有提示词
      expect(screen.getByText('邮件助手')).toBeInTheDocument();
      expect(screen.getByText('文章标题生成器')).toBeInTheDocument();
    });
  });

  describe('筛选功能', () => {
    it('应该筛选参数化提示词', async () => {
      renderComponent();
      
      const filterSelect = screen.getByDisplayValue('全部');
      await userEvent.selectOptions(filterSelect, '参数化');
      
      // 应该只显示参数化的提示词
      expect(screen.getByText('邮件助手')).toBeInTheDocument();
      expect(screen.getByText('文章标题生成器')).toBeInTheDocument();
      expect(screen.queryByText('简单提示词')).not.toBeInTheDocument();
    });

    it('应该筛选非参数化提示词', async () => {
      renderComponent();
      
      const filterSelect = screen.getByDisplayValue('全部');
      await userEvent.selectOptions(filterSelect, '非参数化');
      
      // 应该只显示非参数化的提示词
      expect(screen.queryByText('邮件助手')).not.toBeInTheDocument();
      expect(screen.queryByText('文章标题生成器')).not.toBeInTheDocument();
      expect(screen.getByText('简单提示词')).toBeInTheDocument();
    });

    it('应该筛选分类可见的提示词', async () => {
      renderComponent();
      
      const filterSelect = screen.getByDisplayValue('全部');
      await userEvent.selectOptions(filterSelect, '分类可见');
      
      // 应该只显示分类可见的提示词
      expect(screen.getByText('邮件助手')).toBeInTheDocument();
      expect(screen.queryByText('文章标题生成器')).not.toBeInTheDocument();
      expect(screen.getByText('简单提示词')).toBeInTheDocument();
    });

    it('应该筛选公开提示词', async () => {
      renderComponent();
      
      const filterSelect = screen.getByDisplayValue('全部');
      await userEvent.selectOptions(filterSelect, '公开');
      
      // 应该只显示公开的提示词
      expect(screen.queryByText('邮件助手')).not.toBeInTheDocument();
      expect(screen.getByText('文章标题生成器')).toBeInTheDocument();
      expect(screen.queryByText('简单提示词')).not.toBeInTheDocument();
    });
  });

  describe('排序功能', () => {
    it('应该按更新时间排序', () => {
      renderComponent();
      
      const cards = screen.getAllByRole('article');
      
      // 默认应该按更新时间倒序排列
      expect(cards).toHaveLength(3);
    });

    it('应该切换排序方式', async () => {
      renderComponent();
      
      const sortButton = screen.getByTitle('排序方式');
      await userEvent.click(sortButton);
      
      // 应该切换排序顺序
      await waitFor(() => {
        const cards = screen.getAllByRole('article');
        expect(cards).toHaveLength(3);
      });
    });
  });

  describe('批量操作', () => {
    it('应该显示选择模式开关', () => {
      renderComponent();
      
      expect(screen.getByText('批量操作')).toBeInTheDocument();
    });

    it('应该进入选择模式', async () => {
      renderComponent();
      
      const batchButton = screen.getByText('批量操作');
      await userEvent.click(batchButton);
      
      // 应该显示选择框
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });
    });

    it('应该选择和取消选择提示词', async () => {
      renderComponent();
      
      const batchButton = screen.getByText('批量操作');
      await userEvent.click(batchButton);
      
      await waitFor(async () => {
        const checkboxes = screen.getAllByRole('checkbox');
        await userEvent.click(checkboxes[0]);
        
        expect(checkboxes[0]).toBeChecked();
      });
    });

    it('应该显示批量操作按钮', async () => {
      renderComponent();
      
      const batchButton = screen.getByText('批量操作');
      await userEvent.click(batchButton);
      
      // 需要先选择一些项目，才会显示批量操作按钮
      await waitFor(async () => {
        const checkboxes = screen.getAllByRole('checkbox');
        const itemCheckbox = checkboxes.find(cb => cb.className.includes('w-5 h-5'));
        if (itemCheckbox) {
          await userEvent.click(itemCheckbox);
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('批量删除')).toBeInTheDocument();
        expect(screen.getByText('批量复制')).toBeInTheDocument();
      });
    });
  });

  describe('事件处理', () => {
    it('应该调用onCreateNew', async () => {
      const onCreateNew = vi.fn();
      renderComponent({ onCreateNew });
      
      const createButton = screen.getByText('新建提示词');
      await userEvent.click(createButton);
      
      expect(onCreateNew).toHaveBeenCalled();
    });

    it('应该传递卡片事件到父组件', async () => {
      const onUse = vi.fn();
      const onCopy = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      
      renderComponent({ onUse, onCopy, onEdit, onDelete });
      
      // 使用第一个提示词
      const useButtons = screen.getAllByTitle('使用提示词');
      await userEvent.click(useButtons[0]);
      
      expect(onUse).toHaveBeenCalledWith(mockPrompts[0]);
    });
  });

  describe('响应式设计', () => {
    it('应该在移动端显示单列布局', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });
      
      renderComponent();
      
      const container = screen.getByTestId('prompts-container');
      expect(container).toHaveClass('grid-cols-1');
    });

    it('应该在桌面端显示多列布局', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      
      renderComponent();
      
      const container = screen.getByTestId('prompts-container');
      expect(container).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('可访问性', () => {
    it('应该有正确的ARIA标签', () => {
      renderComponent();
      
      const list = screen.getByRole('region', { name: /项目提示词列表/ });
      expect(list).toBeInTheDocument();
    });

    it('应该支持键盘导航', async () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('搜索提示词...');
      searchInput.focus();
      
      await userEvent.keyboard('{Tab}');
      
      // 焦点应该移动到下一个可聚焦元素
      expect(document.activeElement).not.toBe(searchInput);
    });

    it('应该有正确的heading层级', () => {
      renderComponent();
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('项目提示词');
    });
  });

  describe('性能优化', () => {
    it('应该渲染大量提示词', () => {
      const manyPrompts = Array.from({ length: 100 }, (_, i) => ({
        ...mockPrompts[0],
        id: i + 1,
        title: `提示词 ${i + 1}`,
        promptNumber: `P1-${String(i + 1).padStart(3, '0')}`
      }));
      
      renderComponent({ prompts: manyPrompts });
      
      // 应该能够渲染大量提示词
      const cards = screen.getAllByRole('article');
      expect(cards.length).toBe(100);
    });

    it('应该处理搜索输入', async () => {
      const onSearch = vi.fn();
      renderComponent({ onSearch });
      
      const searchInput = screen.getByPlaceholderText('搜索提示词...');
      
      // 输入搜索内容
      await userEvent.type(searchInput, 'test');
      
      // 搜索回调应该被调用
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalled();
      });
    });
  });

  describe('错误处理', () => {
    it('应该处理损坏的提示词数据', () => {
      const corruptedPrompts = [
        { ...mockPrompts[0], title: null },
        { ...mockPrompts[1], content: undefined }
      ];
      
      renderComponent({ prompts: corruptedPrompts });
      
      // 应该仍然渲染，但跳过损坏的数据
      expect(screen.getByText('项目提示词')).toBeInTheDocument();
    });

    it('应该处理缺失的项目信息', () => {
      renderComponent({ project: undefined });
      
      // 应该仍然渲染提示词列表
      expect(screen.getByText('邮件助手')).toBeInTheDocument();
    });
  });
});