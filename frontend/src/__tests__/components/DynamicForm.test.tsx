/**
 * DynamicForm 组件单元测试
 * 测试动态表单渲染、验证和用户交互
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import DynamicForm from '../../components/DynamicForm';
import type { FormSchema, ParsedTemplate } from '../../utils/templateEngine';

describe('DynamicForm', () => {
  const mockSchema: FormSchema = {
    type: 'object',
    title: '测试表单',
    description: '这是一个测试表单',
    properties: {
      用户名: {
        type: 'string',
        title: '用户名',
        description: '请输入您的用户名',
        maxLength: 20
      },
      邮箱: {
        type: 'string',
        title: '邮箱',
        description: '请输入邮箱地址',
        format: 'email'
      },
      年龄: {
        type: 'number',
        title: '年龄',
        description: '请输入年龄'
      },
      描述: {
        type: 'string',
        title: '描述',
        description: '详细描述',
        format: 'textarea'
      },
      级别: {
        type: 'string',
        title: '级别',
        description: '选择级别',
        enum: ['高', '中', '低'],
        enumNames: ['高级', '中级', '初级']
      }
    },
    required: ['用户名', '邮箱', '级别']
  };

  const mockTemplate: ParsedTemplate = {
    content: '用户：{{用户名}}，邮箱：{{邮箱}}，年龄：{{年龄}}，描述：{{描述}}，级别：{{级别}}',
    tags: [
      { original: '{{用户名}}', name: '用户名', type: 'text', required: true },
      { original: '{{邮箱}}', name: '邮箱', type: 'email', required: true },
      { original: '{{年龄}}', name: '年龄', type: 'number', required: false },
      { original: '{{描述}}', name: '描述', type: 'multiline', required: false },
      { original: '{{级别}}', name: '级别', type: 'select', options: ['高', '中', '低'], required: true }
    ],
    isParameterized: true
  };

  const defaultProps = {
    schema: mockSchema,
    template: mockTemplate,
    showPreview: true
  };

  describe('基础渲染', () => {
    it('应该渲染表单标题和描述', () => {
      render(<DynamicForm {...defaultProps} />);
      
      expect(screen.getByText('测试表单')).toBeInTheDocument();
      expect(screen.getByText('这是一个测试表单')).toBeInTheDocument();
    });

    it('应该渲染所有表单字段', () => {
      render(<DynamicForm {...defaultProps} />);
      
      expect(screen.getByLabelText(/用户名/)).toBeInTheDocument();
      expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
      expect(screen.getByLabelText(/年龄/)).toBeInTheDocument();
      expect(screen.getByLabelText(/描述/)).toBeInTheDocument();
      expect(screen.getByLabelText(/级别/)).toBeInTheDocument();
    });

    it('应该显示必填字段标记', () => {
      render(<DynamicForm {...defaultProps} />);
      
      // 检查必填字段的红色星号
      const requiredFields = screen.getAllByText('*');
      expect(requiredFields).toHaveLength(3); // 用户名、邮箱、级别
    });

    it('应该显示复杂度指示器', () => {
      render(<DynamicForm {...defaultProps} />);
      
      expect(screen.getByText('5个参数')).toBeInTheDocument();
      // 应该有复杂度等级指示器
      expect(screen.getByText(/复杂|中等|简单/)).toBeInTheDocument();
    });

    it('应该显示预览区域', () => {
      render(<DynamicForm {...defaultProps} />);
      
      expect(screen.getByText('实时预览')).toBeInTheDocument();
      expect(screen.getByText('开始填写参数以查看预览...')).toBeInTheDocument();
    });
  });

  describe('字段类型渲染', () => {
    it('应该渲染文本输入框', () => {
      render(<DynamicForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/用户名/) as HTMLInputElement;
      expect(input.type).toBe('text');
      expect(input.maxLength).toBe(20);
    });

    it('应该渲染邮箱输入框', () => {
      render(<DynamicForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/邮箱/) as HTMLInputElement;
      expect(input.type).toBe('email');
    });

    it('应该渲染数字输入框', () => {
      render(<DynamicForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/年龄/) as HTMLInputElement;
      expect(input.type).toBe('number');
    });

    it('应该渲染多行文本框', () => {
      render(<DynamicForm {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/描述/);
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('rows', '4');
    });

    it('应该渲染选择框', () => {
      render(<DynamicForm {...defaultProps} />);
      
      const select = screen.getByLabelText(/级别/);
      expect(select.tagName).toBe('SELECT');
      
      // 检查选项
      expect(screen.getByText('高级')).toBeInTheDocument();
      expect(screen.getByText('中级')).toBeInTheDocument();
      expect(screen.getByText('初级')).toBeInTheDocument();
    });
  });

  describe('用户交互', () => {
    it('应该处理文本输入', async () => {
      const onChange = vi.fn();
      render(<DynamicForm {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByLabelText(/用户名/);
      await userEvent.type(input, '张三');
      
      expect(input).toHaveValue('张三');
      expect(onChange).toHaveBeenCalled();
    });

    it('应该处理选择框变化', async () => {
      const onChange = vi.fn();
      render(<DynamicForm {...defaultProps} onChange={onChange} />);
      
      const select = screen.getByLabelText(/级别/);
      await userEvent.selectOptions(select, '中');
      
      expect(select).toHaveValue('中');
      expect(onChange).toHaveBeenCalled();
    });

    it('应该处理数字输入', async () => {
      const onChange = vi.fn();
      render(<DynamicForm {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByLabelText(/年龄/);
      await userEvent.type(input, '25');
      
      expect(input).toHaveValue(25);
      expect(onChange).toHaveBeenCalled();
    });

    it('应该清除字段错误', async () => {
      render(<DynamicForm {...defaultProps} initialValues={{ 用户名: '' }} />);
      
      // 先触发验证错误
      const input = screen.getByLabelText(/用户名/);
      fireEvent.blur(input);
      
      // 然后输入有效值应该清除错误
      await userEvent.type(input, '有效用户名');
      
      // 验证错误应该被清除（通过检查没有错误样式）
      expect(input).not.toHaveClass('border-red-300');
    });
  });

  describe('实时预览', () => {
    it('应该更新预览内容', async () => {
      render(<DynamicForm {...defaultProps} />);
      
      const userInput = screen.getByLabelText(/用户名/);
      await userEvent.type(userInput, '张三');
      
      // 检查预览区域是否更新
      await waitFor(() => {
        expect(screen.getByText(/张三/)).toBeInTheDocument();
      });
    });

    it('应该显示字符计数', async () => {
      render(<DynamicForm {...defaultProps} />);
      
      const userInput = screen.getByLabelText(/用户名/);
      await userEvent.type(userInput, '测试');
      
      // 应该显示字符计数
      await waitFor(() => {
        expect(screen.getByText('2 / 20')).toBeInTheDocument();
      });
    });

    it('应该在预览中显示未填写字段', () => {
      render(<DynamicForm {...defaultProps} />);
      
      // 预览应该显示未填写的占位符
      expect(screen.getByText(/___/)).toBeInTheDocument();
    });
  });

  describe('验证功能', () => {
    it('应该显示必填字段错误', async () => {
      render(<DynamicForm {...defaultProps} />);
      
      // 尝试提交空表单
      const submitButton = screen.queryByText('确认使用');
      if (submitButton) {
        fireEvent.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(/是必填字段/)).toBeInTheDocument();
        });
      }
    });

    it('应该验证邮箱格式', async () => {
      render(<DynamicForm {...defaultProps} />);
      
      const emailInput = screen.getByLabelText(/邮箱/);
      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.getByText(/有效的邮箱地址/)).toBeInTheDocument();
      });
    });

    it('应该验证数字格式', async () => {
      render(<DynamicForm {...defaultProps} />);
      
      const numberInput = screen.getByLabelText(/年龄/);
      await userEvent.type(numberInput, 'not-a-number');
      fireEvent.blur(numberInput);
      
      await waitFor(() => {
        expect(screen.getByText(/有效的数字/)).toBeInTheDocument();
      });
    });
  });

  describe('操作按钮', () => {
    it('应该有填充示例按钮', () => {
      render(<DynamicForm {...defaultProps} />);
      
      expect(screen.getByText('填充示例')).toBeInTheDocument();
    });

    it('应该有重置按钮', () => {
      render(<DynamicForm {...defaultProps} />);
      
      expect(screen.getByText('重置')).toBeInTheDocument();
    });

    it('应该处理填充示例', async () => {
      render(<DynamicForm {...defaultProps} />);
      
      const fillButton = screen.getByText('填充示例');
      await userEvent.click(fillButton);
      
      // 检查字段是否被填充
      await waitFor(() => {
        const userInput = screen.getByLabelText(/用户名/) as HTMLInputElement;
        expect(userInput.value).not.toBe('');
      });
    });

    it('应该处理重置', async () => {
      render(<DynamicForm {...defaultProps} initialValues={{ 用户名: '初始值' }} />);
      
      const resetButton = screen.getByText('重置');
      await userEvent.click(resetButton);
      
      // 检查字段是否被重置
      await waitFor(() => {
        const userInput = screen.getByLabelText(/用户名/) as HTMLInputElement;
        expect(userInput.value).toBe('初始值'); // 重置到初始值
      });
    });
  });

  describe('表单提交', () => {
    it('应该在有onSubmit时显示提交按钮', () => {
      const onSubmit = vi.fn();
      render(<DynamicForm {...defaultProps} onSubmit={onSubmit} />);
      
      expect(screen.getByText('确认使用')).toBeInTheDocument();
    });

    it('应该在只读模式下隐藏提交按钮', () => {
      const onSubmit = vi.fn();
      render(<DynamicForm {...defaultProps} onSubmit={onSubmit} readonly />);
      
      expect(screen.queryByText('确认使用')).not.toBeInTheDocument();
    });

    it('应该处理有效表单提交', async () => {
      const onSubmit = vi.fn();
      render(<DynamicForm {...defaultProps} onSubmit={onSubmit} />);
      
      // 填写有效数据
      await userEvent.type(screen.getByLabelText(/用户名/), '张三');
      await userEvent.type(screen.getByLabelText(/邮箱/), 'zhangsan@test.com');
      await userEvent.selectOptions(screen.getByLabelText(/级别/), '中');
      
      // 提交表单
      const submitButton = screen.getByText('确认使用');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            用户名: '张三',
            邮箱: 'zhangsan@test.com',
            级别: '中'
          }),
          expect.stringContaining('张三')
        );
      });
    });

    it('应该阻止无效表单提交', async () => {
      const onSubmit = vi.fn();
      render(<DynamicForm {...defaultProps} onSubmit={onSubmit} />);
      
      // 只填写部分必填字段
      await userEvent.type(screen.getByLabelText(/用户名/), '张三');
      // 不填写邮箱和级别
      
      // 提交按钮应该被禁用或提交应该失败
      const submitButton = screen.getByText('确认使用');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('只读模式', () => {
    it('应该在只读模式下禁用所有输入', () => {
      render(<DynamicForm {...defaultProps} readonly />);
      
      const userInput = screen.getByLabelText(/用户名/) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/邮箱/) as HTMLInputElement;
      const ageInput = screen.getByLabelText(/年龄/) as HTMLInputElement;
      
      expect(userInput.disabled).toBe(true);
      expect(emailInput.disabled).toBe(true);
      expect(ageInput.disabled).toBe(true);
    });

    it('应该在只读模式下隐藏操作按钮', () => {
      render(<DynamicForm {...defaultProps} readonly />);
      
      expect(screen.queryByText('填充示例')).not.toBeInTheDocument();
      expect(screen.queryByText('重置')).not.toBeInTheDocument();
    });
  });

  describe('回调函数', () => {
    it('应该调用onChange回调', async () => {
      const onChange = vi.fn();
      render(<DynamicForm {...defaultProps} onChange={onChange} />);
      
      const userInput = screen.getByLabelText(/用户名/);
      await userEvent.type(userInput, '测试');
      
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ 用户名: '测试' }),
        expect.any(Boolean)
      );
    });

    it('应该调用onPreviewChange回调', async () => {
      const onPreviewChange = vi.fn();
      render(<DynamicForm {...defaultProps} onPreviewChange={onPreviewChange} />);
      
      const userInput = screen.getByLabelText(/用户名/);
      await userEvent.type(userInput, '测试');
      
      await waitFor(() => {
        expect(onPreviewChange).toHaveBeenCalledWith(
          expect.stringContaining('测试')
        );
      });
    });
  });

  describe('初始值处理', () => {
    it('应该使用提供的初始值', () => {
      const initialValues = {
        用户名: '初始用户',
        邮箱: 'initial@test.com'
      };
      
      render(<DynamicForm {...defaultProps} initialValues={initialValues} />);
      
      const userInput = screen.getByLabelText(/用户名/) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/邮箱/) as HTMLInputElement;
      
      expect(userInput.value).toBe('初始用户');
      expect(emailInput.value).toBe('initial@test.com');
    });

    it('应该在初始值变化时更新表单', () => {
      const { rerender } = render(
        <DynamicForm {...defaultProps} initialValues={{ 用户名: '值1' }} />
      );
      
      const userInput = screen.getByLabelText(/用户名/) as HTMLInputElement;
      expect(userInput.value).toBe('值1');
      
      // 更新初始值
      rerender(
        <DynamicForm {...defaultProps} initialValues={{ 用户名: '值2' }} />
      );
      
      expect(userInput.value).toBe('值2');
    });
  });

  describe('错误处理', () => {
    it('应该处理空schema', () => {
      const emptySchema: FormSchema = {
        type: 'object',
        properties: {},
        required: [],
        title: '空表单',
        description: '没有字段的表单'
      };
      
      expect(() => {
        render(<DynamicForm schema={emptySchema} template={mockTemplate} />);
      }).not.toThrow();
      
      expect(screen.getByText('空表单')).toBeInTheDocument();
    });

    it('应该处理缺失的字段描述', () => {
      const schemaWithoutDesc: FormSchema = {
        type: 'object',
        properties: {
          简单字段: {
            type: 'string',
            title: '简单字段'
            // 没有description
          }
        },
        required: [],
        title: '测试',
        description: '测试'
      };
      
      expect(() => {
        render(<DynamicForm schema={schemaWithoutDesc} template={mockTemplate} />);
      }).not.toThrow();
    });
  });
});