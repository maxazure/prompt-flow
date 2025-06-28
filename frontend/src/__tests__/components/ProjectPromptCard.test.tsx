/**
 * ProjectPromptCard 组件单元测试
 * 测试项目提示词卡片组件的交互和功能
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ProjectPromptCard from '../../components/ProjectPromptCard';
import type { Prompt, Project } from '../../types';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  }
});

describe('ProjectPromptCard', () => {
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
    promptCount: 5
  };

  const mockPrompt: Prompt = {
    id: 1,
    title: '测试提示词',
    content: '请帮我写一封{{邮件类型:邮件类型:商务邮件}}给{{收件人:收件人姓名:张先生}}',
    description: '这是一个测试提示词',
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
  };

  const defaultProps = {
    prompt: mockPrompt,
    project: mockProject,
    onCopy: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onUse: vi.fn()
  };

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <ProjectPromptCard {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该渲染提示词基本信息', () => {
      renderComponent();
      
      expect(screen.getByText('测试提示词')).toBeInTheDocument();
      expect(screen.getByText('这是一个测试提示词')).toBeInTheDocument();
      expect(screen.getByText('P1-001')).toBeInTheDocument();
    });

    it('应该显示提示词内容', () => {
      renderComponent();
      
      expect(screen.getByText(/请帮我写一封/)).toBeInTheDocument();
    });

    it('应该显示项目标识', () => {
      renderComponent();
      
      expect(screen.getByText(/项目:/)).toBeInTheDocument();
      expect(screen.getByText('测试项目')).toBeInTheDocument();
    });

    it('应该显示分类可见状态', () => {
      renderComponent();
      
      expect(screen.getByText('分类可见')).toBeInTheDocument();
    });

    it('应该隐藏分类标识当showInCategory为false时', () => {
      const prompt = { ...mockPrompt, showInCategory: false };
      renderComponent({ prompt });
      
      expect(screen.queryByText('分类可见')).not.toBeInTheDocument();
    });

    it('应该显示标签', () => {
      renderComponent();
      
      expect(screen.getByText('邮件')).toBeInTheDocument();
      expect(screen.getByText('商务')).toBeInTheDocument();
    });

    it('应该显示版本信息', () => {
      renderComponent();
      
      expect(screen.getByText('版本 1')).toBeInTheDocument();
    });
  });

  describe('操作按钮', () => {
    it('应该显示所有操作按钮', () => {
      renderComponent();
      
      expect(screen.getByTitle('使用提示词')).toBeInTheDocument();
      expect(screen.getByTitle('复制（包含项目背景）')).toBeInTheDocument();
      expect(screen.getByTitle('编辑')).toBeInTheDocument();
      expect(screen.getByTitle('删除')).toBeInTheDocument();
    });

    it('应该调用onUse回调', async () => {
      const onUse = vi.fn();
      renderComponent({ onUse });
      
      const useButton = screen.getByTitle('使用提示词');
      await userEvent.click(useButton);
      
      expect(onUse).toHaveBeenCalledWith(mockPrompt);
    });

    it('应该调用onCopy回调', async () => {
      const onCopy = vi.fn();
      renderComponent({ onCopy });
      
      const copyButton = screen.getByTitle('复制（包含项目背景）');
      await userEvent.click(copyButton);
      
      expect(onCopy).toHaveBeenCalledWith(mockPrompt, mockProject);
    });

    it('应该调用onEdit回调', async () => {
      const onEdit = vi.fn();
      renderComponent({ onEdit });
      
      const editButton = screen.getByTitle('编辑');
      await userEvent.click(editButton);
      
      expect(onEdit).toHaveBeenCalledWith(mockPrompt);
    });

    it('应该调用onDelete回调', async () => {
      const onDelete = vi.fn();
      renderComponent({ onDelete });
      
      const deleteButton = screen.getByTitle('删除');
      await userEvent.click(deleteButton);
      
      expect(onDelete).toHaveBeenCalledWith(mockPrompt);
    });
  });

  describe('参数化检测', () => {
    it('应该显示参数化标识', () => {
      renderComponent();
      
      expect(screen.getByText('参数化')).toBeInTheDocument();
    });

    it('应该隐藏参数化标识当提示词不含参数时', () => {
      const prompt = { ...mockPrompt, content: '这是一个普通的提示词' };
      renderComponent({ prompt });
      
      expect(screen.queryByText('参数化')).not.toBeInTheDocument();
    });

    it('应该显示参数数量', () => {
      renderComponent();
      
      // 这个提示词包含2个参数: 邮件类型 和 收件人
      expect(screen.getByText('2个参数')).toBeInTheDocument();
    });
  });

  describe('卡片样式', () => {
    it('应该有正确的CSS类', () => {
      const { container } = renderComponent();
      
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'border', 'p-4');
    });

    it('应该有悬停效果', () => {
      const { container } = renderComponent();
      
      const card = container.firstChild;
      expect(card).toHaveClass('hover:shadow-md', 'transition-shadow');
    });

    it('应该响应点击事件', async () => {
      const onUse = vi.fn();
      const { container } = renderComponent({ onUse });
      
      const card = container.firstChild as HTMLElement;
      await userEvent.click(card);
      
      // 点击卡片应该触发使用功能
      expect(onUse).toHaveBeenCalledWith(mockPrompt);
    });
  });

  describe('可访问性', () => {
    it('应该有正确的ARIA标签', () => {
      renderComponent();
      
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
      
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('测试提示词'));
    });

    it('应该支持键盘导航', async () => {
      const onUse = vi.fn();
      renderComponent({ onUse });
      
      const card = screen.getByRole('article');
      card.focus();
      
      await userEvent.keyboard('{Enter}');
      expect(onUse).toHaveBeenCalledWith(mockPrompt);
    });

    it('操作按钮应该有正确的ARIA标签', () => {
      renderComponent();
      
      expect(screen.getByLabelText('使用提示词')).toBeInTheDocument();
      expect(screen.getByLabelText('复制提示词')).toBeInTheDocument();
      expect(screen.getByLabelText('编辑提示词')).toBeInTheDocument();
      expect(screen.getByLabelText('删除提示词')).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    it('应该处理缺失的项目信息', () => {
      const prompt = { ...mockPrompt, projectId: undefined };
      renderComponent({ prompt, project: undefined });
      
      expect(screen.queryByText(/项目:/)).not.toBeInTheDocument();
    });

    it('应该处理缺失的描述', () => {
      const prompt = { ...mockPrompt, description: undefined };
      renderComponent({ prompt });
      
      // 应该仍然正常渲染
      expect(screen.getByText('测试提示词')).toBeInTheDocument();
    });

    it('应该处理缺失的标签', () => {
      const prompt = { ...mockPrompt, tags: undefined };
      renderComponent({ prompt });
      
      // 应该仍然正常渲染
      expect(screen.getByText('测试提示词')).toBeInTheDocument();
    });

    it('应该处理复制失败', async () => {
      // Mock clipboard failure
      const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText')
        .mockRejectedValueOnce(new Error('Clipboard error'));
      
      const onCopy = vi.fn();
      renderComponent({ onCopy });
      
      const copyButton = screen.getByTitle('复制（包含项目背景）');
      await userEvent.click(copyButton);
      
      expect(onCopy).toHaveBeenCalled();
      clipboardSpy.mockRestore();
    });
  });

  describe('状态指示', () => {
    it('应该显示更新时间', () => {
      renderComponent();
      
      const date = new Date(mockPrompt.updatedAt!).toLocaleDateString();
      expect(screen.getByText(date)).toBeInTheDocument();
    });

    it('应该显示作者信息', () => {
      renderComponent();
      
      expect(screen.getByText('作者: testuser')).toBeInTheDocument();
    });

    it('应该显示公开状态', () => {
      const prompt = { ...mockPrompt, isPublic: true };
      renderComponent({ prompt });
      
      expect(screen.getByText('公开')).toBeInTheDocument();
    });
  });

  describe('内容截断', () => {
    it('应该截断过长的内容', () => {
      const longContent = '这是一个很长的提示词内容，'.repeat(50);
      const prompt = { ...mockPrompt, content: longContent };
      renderComponent({ prompt });
      
      // 应该有截断样式
      const contentElement = screen.getByText(longContent.substring(0, 200) + '...', { exact: false });
      expect(contentElement).toHaveClass('line-clamp-3');
    });

    it('应该显示完整内容按钮', () => {
      const longContent = '这是一个很长的提示词内容，'.repeat(50);
      const prompt = { ...mockPrompt, content: longContent };
      renderComponent({ prompt });
      
      expect(screen.getByText('展开')).toBeInTheDocument();
    });

    it('应该切换展开/收起状态', async () => {
      const longContent = '这是一个很长的提示词内容，'.repeat(50);
      const prompt = { ...mockPrompt, content: longContent };
      renderComponent({ prompt });
      
      const expandButton = screen.getByText('展开');
      await userEvent.click(expandButton);
      
      expect(screen.getByText('收起')).toBeInTheDocument();
    });
  });
});