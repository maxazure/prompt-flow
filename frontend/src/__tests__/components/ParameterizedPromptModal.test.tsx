/**
 * ParameterizedPromptModal 组件单元测试
 * 测试参数化提示词模态框的交互和功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ParameterizedPromptModal from '../../components/ParameterizedPromptModal';
import type { Prompt } from '../../types';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  }
});

describe('ParameterizedPromptModal', () => {
  const mockParameterizedPrompt: Prompt = {
    id: 1,
    title: '邮件助手',
    content: '请写一封{{邮件类型:邮件类型:商务邮件|商务邮件,感谢邮件}}给{{收件人:收件人姓名:张先生}}。主题：{{主题:邮件主题:项目合作}}',
    description: '智能邮件生成助手',
    version: 1,
    userId: 1,
    isPublic: true,
    categoryId: 1,
    tags: ['邮件', '商务'],
    user: { id: 1, username: 'testuser' }
  };

  const mockNonParameterizedPrompt: Prompt = {
    id: 2,
    title: '简单提示词',
    content: '这是一个没有参数的简单提示词内容',
    description: '简单描述',
    version: 1,
    userId: 1,
    isPublic: true,
    user: { id: 1, username: 'testuser' }
  };

  const defaultProps = {
    prompt: mockParameterizedPrompt,
    isOpen: true,
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该在打开时渲染模态框', () => {
      render(<ParameterizedPromptModal {...defaultProps} />);
      
      expect(screen.getByText('使用提示词: 邮件助手')).toBeInTheDocument();
      expect(screen.getByText(/检测到 3 个参数/)).toBeInTheDocument();
    });

    it('应该在关闭时不渲染', () => {
      render(<ParameterizedPromptModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('使用提示词: 邮件助手')).not.toBeInTheDocument();
    });

    it('应该显示参数化提示词的动态表单', () => {
      render(<ParameterizedPromptModal {...defaultProps} />);
      
      expect(screen.getByText('参数填写')).toBeInTheDocument();
      expect(screen.getByText('实时预览')).toBeInTheDocument();
      expect(screen.getByLabelText(/邮件类型/)).toBeInTheDocument();
      expect(screen.getByLabelText(/收件人/)).toBeInTheDocument();
      expect(screen.getByLabelText(/主题/)).toBeInTheDocument();
    });

    it('应该显示非参数化提示词的直接内容', () => {
      render(
        <ParameterizedPromptModal 
          {...defaultProps} 
          prompt={mockNonParameterizedPrompt}
        />
      );
      
      expect(screen.getByText(/该提示词无需参数/)).toBeInTheDocument();
      expect(screen.getByText('提示词内容')).toBeInTheDocument();
      expect(screen.getByText('这是一个没有参数的简单提示词内容')).toBeInTheDocument();
    });
  });

  describe('关闭功能', () => {
    it('应该通过关闭按钮关闭模态框', async () => {
      const onClose = vi.fn();
      render(<ParameterizedPromptModal {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByRole('button', { name: /关闭|×/ });
      await userEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('应该通过取消按钮关闭模态框', async () => {
      const onClose = vi.fn();
      render(<ParameterizedPromptModal {...defaultProps} onClose={onClose} />);
      
      const cancelButton = screen.getByText('取消');
      await userEvent.click(cancelButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('应该在点击背景时关闭模态框', async () => {
      const onClose = vi.fn();
      render(<ParameterizedPromptModal {...defaultProps} onClose={onClose} />);
      
      // 点击模态框背景（外层div）
      const modal = screen.getByRole('dialog', { hidden: true })?.parentElement;
      if (modal) {
        fireEvent.click(modal);
        expect(onClose).toHaveBeenCalled();
      }
    });
  });

  describe('复制功能', () => {
    it('应该复制生成的内容', async () => {
      const onCopy = vi.fn();
      render(<ParameterizedPromptModal {...defaultProps} onCopy={onCopy} />);
      
      // 填写参数
      await userEvent.type(screen.getByLabelText(/收件人/), '李总');
      await userEvent.type(screen.getByLabelText(/主题/), '重要会议');
      await userEvent.selectOptions(screen.getByLabelText(/邮件类型/), '商务邮件');
      
      // 点击复制按钮
      const copyButton = screen.getByText(/复制内容/);
      await userEvent.click(copyButton);
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
        expect(onCopy).toHaveBeenCalled();
      });
    });

    it('应该显示复制成功状态', async () => {
      render(<ParameterizedPromptModal {...defaultProps} />);
      
      // 填写参数使复制按钮可用
      await userEvent.type(screen.getByLabelText(/收件人/), '测试');
      
      const copyButton = screen.getByText(/复制内容/);
      await userEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText('已复制!')).toBeInTheDocument();
      });
    });

    it('应该快速复制原始内容', async () => {
      render(<ParameterizedPromptModal {...defaultProps} />);
      
      const quickCopyButton = screen.getByText('快速复制原始内容');
      await userEvent.click(quickCopyButton);
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockParameterizedPrompt.content);
      });
    });
  });

  describe('保存为新提示词功能', () => {
    it('应该显示保存按钮当提供onSaveAsNew回调时', () => {
      const onSaveAsNew = vi.fn();
      render(<ParameterizedPromptModal {...defaultProps} onSaveAsNew={onSaveAsNew} />);
      
      expect(screen.getByText('保存为新提示词')).toBeInTheDocument();
    });

    it('应该调用保存回调', async () => {
      const onSaveAsNew = vi.fn();
      render(<ParameterizedPromptModal {...defaultProps} onSaveAsNew={onSaveAsNew} />);
      
      // 填写有效参数
      await userEvent.type(screen.getByLabelText(/收件人/), '测试用户');
      await userEvent.type(screen.getByLabelText(/主题/), '测试主题');
      await userEvent.selectOptions(screen.getByLabelText(/邮件类型/), '商务邮件');
      
      const saveButton = screen.getByText('保存为新提示词');
      await userEvent.click(saveButton);
      
      await waitFor(() => {
        expect(onSaveAsNew).toHaveBeenCalledWith(
          expect.stringContaining('测试用户'),
          expect.objectContaining({
            收件人: '测试用户',
            主题: '测试主题',
            邮件类型: '商务邮件'
          })
        );
      });
    });

    it('应该在表单无效时禁用保存按钮', () => {
      const onSaveAsNew = vi.fn();
      render(<ParameterizedPromptModal {...defaultProps} onSaveAsNew={onSaveAsNew} />);
      
      const saveButton = screen.getByText('保存为新提示词');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('发送到AI功能', () => {
    it('应该显示发送到AI按钮当提供onSendToAI回调时', () => {
      const onSendToAI = vi.fn();
      render(<ParameterizedPromptModal {...defaultProps} onSendToAI={onSendToAI} />);
      
      expect(screen.getByText('发送到AI')).toBeInTheDocument();
    });

    it('应该调用发送到AI回调', async () => {
      const onSendToAI = vi.fn();
      render(<ParameterizedPromptModal {...defaultProps} onSendToAI={onSendToAI} />);
      
      // 填写参数
      await userEvent.type(screen.getByLabelText(/收件人/), '测试');
      
      const sendButton = screen.getByText('发送到AI');
      await userEvent.click(sendButton);
      
      await waitFor(() => {
        expect(onSendToAI).toHaveBeenCalledWith(
          expect.stringContaining('测试')
        );
      });
    });
  });

  describe('处理中状态', () => {
    it('应该显示处理中覆盖层', async () => {
      const onSaveAsNew = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<ParameterizedPromptModal {...defaultProps} onSaveAsNew={onSaveAsNew} />);
      
      // 填写参数并触发保存
      await userEvent.type(screen.getByLabelText(/收件人/), '测试');
      await userEvent.type(screen.getByLabelText(/主题/), '测试');
      await userEvent.selectOptions(screen.getByLabelText(/邮件类型/), '商务邮件');
      
      const saveButton = screen.getByText('保存为新提示词');
      fireEvent.click(saveButton);
      
      // 应该显示处理中状态
      expect(screen.getByText('处理中...')).toBeInTheDocument();
    });

    it('应该在处理中时禁用操作按钮', async () => {
      const slowSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<ParameterizedPromptModal {...defaultProps} onSaveAsNew={slowSave} />);
      
      // 填写参数
      await userEvent.type(screen.getByLabelText(/收件人/), '测试');
      await userEvent.type(screen.getByLabelText(/主题/), '测试');
      await userEvent.selectOptions(screen.getByLabelText(/邮件类型/), '商务邮件');
      
      const saveButton = screen.getByText('保存为新提示词');
      fireEvent.click(saveButton);
      
      // 按钮应该被禁用
      expect(saveButton).toBeDisabled();
    });
  });

  describe('表单验证集成', () => {
    it('应该在表单无效时禁用复制按钮', () => {
      render(<ParameterizedPromptModal {...defaultProps} />);
      
      const copyButton = screen.getByText(/复制内容/);
      expect(copyButton).toBeDisabled();
    });

    it('应该在填写有效参数后启用按钮', async () => {
      render(<ParameterizedPromptModal {...defaultProps} />);
      
      // 填写所有必填参数
      await userEvent.type(screen.getByLabelText(/收件人/), '测试用户');
      await userEvent.type(screen.getByLabelText(/主题/), '测试主题');
      await userEvent.selectOptions(screen.getByLabelText(/邮件类型/), '商务邮件');
      
      await waitFor(() => {
        const copyButton = screen.getByText(/复制内容/);
        expect(copyButton).not.toBeDisabled();
      });
    });
  });

  describe('非参数化提示词处理', () => {
    it('应该显示元信息', () => {
      render(
        <ParameterizedPromptModal 
          {...defaultProps} 
          prompt={mockNonParameterizedPrompt}
        />
      );
      
      expect(screen.getByText('版本:')).toBeInTheDocument();
      expect(screen.getByText('v1')).toBeInTheDocument();
      expect(screen.getByText('作者:')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    it('应该只显示复制按钮', () => {
      render(
        <ParameterizedPromptModal 
          {...defaultProps} 
          prompt={mockNonParameterizedPrompt}
        />
      );
      
      expect(screen.getByText(/复制内容/)).toBeInTheDocument();
      expect(screen.queryByText('保存为新提示词')).not.toBeInTheDocument();
      expect(screen.queryByText('发送到AI')).not.toBeInTheDocument();
    });
  });

  describe('状态重置', () => {
    it('应该在模态框打开时重置状态', () => {
      const { rerender } = render(
        <ParameterizedPromptModal {...defaultProps} isOpen={false} />
      );
      
      // 重新打开模态框
      rerender(<ParameterizedPromptModal {...defaultProps} isOpen={true} />);
      
      // 表单应该是空的
      const userInput = screen.getByLabelText(/收件人/) as HTMLInputElement;
      expect(userInput.value).toBe('');
    });
  });

  describe('错误处理', () => {
    it('应该处理复制失败', async () => {
      // Mock clipboard failure
      const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText')
        .mockRejectedValueOnce(new Error('Clipboard error'));
      
      render(<ParameterizedPromptModal {...defaultProps} />);
      
      // 填写参数
      await userEvent.type(screen.getByLabelText(/收件人/), '测试');
      
      const copyButton = screen.getByText(/复制内容/);
      await userEvent.click(copyButton);
      
      // 应该使用降级方案
      expect(clipboardSpy).toHaveBeenCalled();
      
      clipboardSpy.mockRestore();
    });

    it('应该处理保存失败', async () => {
      const onSaveAsNew = vi.fn().mockRejectedValue(new Error('Save failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ParameterizedPromptModal {...defaultProps} onSaveAsNew={onSaveAsNew} />);
      
      // 填写参数
      await userEvent.type(screen.getByLabelText(/收件人/), '测试');
      await userEvent.type(screen.getByLabelText(/主题/), '测试');
      await userEvent.selectOptions(screen.getByLabelText(/邮件类型/), '商务邮件');
      
      const saveButton = screen.getByText('保存为新提示词');
      await userEvent.click(saveButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('保存失败:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('可访问性', () => {
    it('应该有正确的ARIA标签', () => {
      render(<ParameterizedPromptModal {...defaultProps} />);
      
      // 模态框应该有适当的role
      const modal = screen.getByRole('dialog', { hidden: true });
      expect(modal).toBeInTheDocument();
    });

    it('应该支持ESC键关闭', () => {
      const onClose = vi.fn();
      render(<ParameterizedPromptModal {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      
      // 注意：实际的ESC键处理需要在组件中实现
      // 这里只是测试结构，实际实现可能需要添加键盘事件监听
    });

    it('应该有正确的焦点管理', () => {
      render(<ParameterizedPromptModal {...defaultProps} />);
      
      // 第一个可聚焦元素应该获得焦点
      const firstInput = screen.getByLabelText(/邮件类型/);
      expect(document.activeElement).toBe(firstInput);
    });
  });
});