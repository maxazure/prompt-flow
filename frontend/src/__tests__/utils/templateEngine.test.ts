/**
 * TemplateEngine 单元测试
 * 测试模板渲染、参数处理和便捷函数
 */

import { describe, it, expect } from 'vitest';
import { TemplateEngine, renderTemplate, needsParameters, getDefaultParameters } from '../../utils/templateEngine';
import type { ParsedTemplate } from '../../utils/templateEngine';

describe('TemplateEngine', () => {
  const sampleTemplate: ParsedTemplate = {
    content: '你好 {{用户名}}，您的邮箱是 {{邮箱:邮箱地址:user@example.com:email}}，年龄 {{年龄:年龄:25:number}} 岁。',
    tags: [
      { original: '{{用户名}}', name: '用户名', type: 'text', required: true },
      { original: '{{邮箱:邮箱地址:user@example.com:email}}', name: '邮箱', type: 'email', required: true, description: '邮箱地址', example: 'user@example.com' },
      { original: '{{年龄:年龄:25:number}}', name: '年龄', type: 'number', required: false, description: '年龄', example: '25' }
    ],
    isParameterized: true
  };

  describe('render', () => {
    it('应该正确渲染完整参数', () => {
      const parameters = {
        用户名: '张三',
        邮箱: 'zhangsan@test.com',
        年龄: 30
      };

      const result = TemplateEngine.render(sampleTemplate, parameters);

      expect(result.content).toBe('你好 张三，您的邮箱是 zhangsan@test.com，年龄 30 岁。');
      expect(result.isComplete).toBe(true);
      expect(result.unfilledTags).toHaveLength(0);
    });

    it('应该处理部分参数缺失', () => {
      const parameters = {
        用户名: '李四'
        // 缺少邮箱和年龄
      };

      const result = TemplateEngine.render(sampleTemplate, parameters);

      expect(result.content).toContain('李四');
      expect(result.content).toContain('[未填写]');
      expect(result.isComplete).toBe(false);
      expect(result.unfilledTags).toEqual(['邮箱', '年龄']);
    });

    it('应该支持保留未填写标签选项', () => {
      const parameters = { 用户名: '王五' };
      const options = { keepUnfilledTags: true };

      const result = TemplateEngine.render(sampleTemplate, parameters, options);

      expect(result.content).toContain('王五');
      expect(result.content).toContain('{{邮箱:邮箱地址:user@example.com:email}}');
      expect(result.content).toContain('{{年龄:年龄:25:number}}');
    });

    it('应该支持自定义未填写占位符', () => {
      const parameters = { 用户名: '赵六' };
      const options = { unfilledPlaceholder: '【待填写】' };

      const result = TemplateEngine.render(sampleTemplate, parameters, options);

      expect(result.content).toContain('赵六');
      expect(result.content).toContain('【待填写】');
      expect(result.content).not.toContain('[未填写]');
    });

    it('应该支持HTML转义', () => {
      const template: ParsedTemplate = {
        content: '内容：{{内容}}',
        tags: [{ original: '{{内容}}', name: '内容', type: 'text', required: true }],
        isParameterized: true
      };

      const parameters = { 内容: '<script>alert("xss")</script>' };
      const options = { escapeHtml: true };

      const result = TemplateEngine.render(template, parameters, options);

      expect(result.content).not.toContain('<script>');
      expect(result.content).toContain('&lt;script&gt;');
    });
  });

  describe('renderPreview', () => {
    it('应该生成实时预览', () => {
      const parameters = { 用户名: '测试用户' };

      const result = TemplateEngine.renderPreview(sampleTemplate, parameters);

      expect(result.content).toContain('测试用户');
      expect(result.content).toContain('___'); // 未填写占位符
      expect(result.unfilledTags).toEqual(['邮箱', '年龄']);
    });
  });

  describe('renderSafe', () => {
    it('应该进行HTML转义的安全渲染', () => {
      const template: ParsedTemplate = {
        content: '用户输入：{{输入内容}}',
        tags: [{ original: '{{输入内容}}', name: '输入内容', type: 'text', required: true }],
        isParameterized: true
      };

      const parameters = { 输入内容: '<img src="x" onerror="alert(1)">' };

      const result = TemplateEngine.renderSafe(template, parameters);

      expect(result.content).toContain('&lt;img');
      expect(result.content).not.toContain('<img');
    });
  });

  describe('processValue', () => {
    it('应该处理多行文本', () => {
      const template: ParsedTemplate = {
        content: '描述：{{描述}}',
        tags: [{ original: '{{描述}}', name: '描述', type: 'multiline', required: true }],
        isParameterized: true
      };

      const parameters = { 描述: '第一行\n第二行\n第三行' };

      const result = TemplateEngine.render(template, parameters);

      expect(result.content).toContain('第一行\n第二行\n第三行');
    });

    it('应该处理URL自动补全', () => {
      const template: ParsedTemplate = {
        content: '网站：{{网址}}',
        tags: [{ original: '{{网址}}', name: '网址', type: 'url', required: true }],
        isParameterized: true
      };

      const parameters = { 网址: 'example.com' };

      const result = TemplateEngine.render(template, parameters);

      expect(result.content).toBe('网站：https://example.com');
    });

    it('应该处理数字格式化', () => {
      const template: ParsedTemplate = {
        content: '数量：{{数量}}',
        tags: [{ original: '{{数量}}', name: '数量', type: 'number', required: true }],
        isParameterized: true
      };

      const parameters = { 数量: 42.5 };

      const result = TemplateEngine.render(template, parameters);

      expect(result.content).toBe('数量：42.5');
    });
  });

  describe('generateParameterSummary', () => {
    it('应该生成参数摘要', () => {
      const parameters = {
        用户名: '张三',
        邮箱: 'zhangsan@test.com'
      };

      const summary = TemplateEngine.generateParameterSummary(sampleTemplate, parameters);

      expect(summary).toHaveLength(3);
      expect(summary[0]).toEqual({
        name: '用户名',
        value: '张三',
        description: undefined
      });
      expect(summary[1]).toEqual({
        name: '邮箱',
        value: 'zhangsan@test.com',
        description: '邮箱地址'
      });
      expect(summary[2]).toEqual({
        name: '年龄',
        value: '[未填写]',
        description: '年龄'
      });
    });
  });

  describe('validateAndRender', () => {
    it('应该验证并渲染有效参数', () => {
      const parameters = {
        用户名: '张三',
        邮箱: 'zhangsan@valid.com',
        年龄: 25
      };

      const result = TemplateEngine.validateAndRender(sampleTemplate, parameters);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.result).toBeDefined();
      expect(result.result!.isComplete).toBe(true);
    });

    it('应该拒绝无效参数', () => {
      const parameters = {
        用户名: '', // 必填字段为空
        邮箱: 'invalid-email',
        年龄: 'not-a-number'
      };

      const result = TemplateEngine.validateAndRender(sampleTemplate, parameters);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.result).toBeUndefined();
    });
  });

  describe('generateExampleParameters', () => {
    it('应该生成示例参数', () => {
      const examples = TemplateEngine.generateExampleParameters(sampleTemplate);

      expect(examples.用户名).toBe('示例用户名');
      expect(examples.邮箱).toBe('user@example.com'); // 来自example字段
      expect(examples.年龄).toBe('25'); // 来自example字段
    });

    it('应该为不同类型生成合适的示例', () => {
      const template: ParsedTemplate = {
        content: '',
        tags: [
          { original: '{{文本}}', name: '文本', type: 'text', required: true },
          { original: '{{多行}}', name: '多行', type: 'multiline', required: true },
          { original: '{{数字}}', name: '数字', type: 'number', required: true },
          { original: '{{邮箱}}', name: '邮箱', type: 'email', required: true },
          { original: '{{网址}}', name: '网址', type: 'url', required: true },
          { original: '{{日期}}', name: '日期', type: 'date', required: true },
          { original: '{{选择}}', name: '选择', type: 'select', options: ['A', 'B', 'C'], required: true }
        ],
        isParameterized: true
      };

      const examples = TemplateEngine.generateExampleParameters(template);

      expect(examples.文本).toBe('示例文本');
      expect(examples.多行).toContain('多行文本示例');
      expect(examples.数字).toBe(42);
      expect(examples.邮箱).toBe('example@domain.com');
      expect(examples.网址).toBe('https://example.com');
      expect(examples.日期).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(examples.选择).toBe('A');
    });
  });

  describe('calculateComplexity', () => {
    it('应该计算简单模板复杂度', () => {
      const simpleTemplate: ParsedTemplate = {
        content: '你好 {{用户名}}',
        tags: [{ original: '{{用户名}}', name: '用户名', type: 'text', required: true }],
        isParameterized: true
      };

      const complexity = TemplateEngine.calculateComplexity(simpleTemplate);

      expect(complexity.level).toBe('simple');
      expect(complexity.details.parameterCount).toBe(1);
      expect(complexity.details.hasSelectFields).toBe(false);
      expect(complexity.details.hasMultilineFields).toBe(false);
    });

    it('应该计算复杂模板复杂度', () => {
      const complexTemplate: ParsedTemplate = {
        content: '',
        tags: [
          { original: '{{a}}', name: 'a', type: 'text', required: true },
          { original: '{{b}}', name: 'b', type: 'multiline', required: true },
          { original: '{{c}}', name: 'c', type: 'select', options: ['1', '2'], required: true },
          { original: '{{d}}', name: 'd', type: 'email', required: true },
          { original: '{{e}}', name: 'e', type: 'number', required: true },
          { original: '{{f}}', name: 'f', type: 'text', required: true }
        ],
        isParameterized: true
      };

      const complexity = TemplateEngine.calculateComplexity(complexTemplate);

      expect(complexity.level).toBe('complex');
      expect(complexity.details.parameterCount).toBe(6);
      expect(complexity.details.hasSelectFields).toBe(true);
      expect(complexity.details.hasMultilineFields).toBe(true);
      expect(complexity.details.hasSpecialTypes).toBe(true);
    });
  });

  describe('便捷函数', () => {
    describe('renderTemplate', () => {
      it('应该快速渲染模板', () => {
        const content = '你好 {{用户名}}！';
        const parameters = { 用户名: '张三' };

        const result = renderTemplate(content, parameters);

        expect(result.content).toBe('你好 张三！');
        expect(result.isComplete).toBe(true);
      });
    });

    describe('needsParameters', () => {
      it('应该正确检测是否需要参数', () => {
        expect(needsParameters('你好 {{用户名}}')).toBe(true);
        expect(needsParameters('普通文本')).toBe(false);
        expect(needsParameters('')).toBe(false);
      });
    });

    describe('getDefaultParameters', () => {
      it('应该获取默认参数', () => {
        const content = '你好 {{用户名:姓名:张三}}，邮箱 {{邮箱:邮箱:test@example.com:email}}';
        const defaults = getDefaultParameters(content);

        expect(defaults.用户名).toBe('张三');
        expect(defaults.邮箱).toBe('test@example.com');
      });
    });
  });

  describe('错误处理', () => {
    it('应该处理空模板', () => {
      const emptyTemplate: ParsedTemplate = {
        content: '',
        tags: [],
        isParameterized: false
      };

      const result = TemplateEngine.render(emptyTemplate, {});

      expect(result.content).toBe('');
      expect(result.isComplete).toBe(true);
      expect(result.unfilledTags).toHaveLength(0);
    });

    it('应该处理undefined/null参数值', () => {
      const template: ParsedTemplate = {
        content: '值：{{值}}',
        tags: [{ original: '{{值}}', name: '值', type: 'text', required: true }],
        isParameterized: true
      };

      const result1 = TemplateEngine.render(template, { 值: undefined });
      const result2 = TemplateEngine.render(template, { 值: null });
      const result3 = TemplateEngine.render(template, { 值: '' });

      expect(result1.content).toContain('[未填写]');
      expect(result2.content).toContain('[未填写]');
      expect(result3.content).toContain('[未填写]');
    });

    it('应该处理特殊字符在正则表达式中的转义', () => {
      const template: ParsedTemplate = {
        content: '{{特殊[字符].*+?^${}()|\\}}',
        tags: [{ original: '{{特殊[字符].*+?^${}()|\\}}', name: '特殊[字符].*+?^${}()|\\', type: 'text', required: true }],
        isParameterized: true
      };

      // 这个测试主要确保不会因为正则表达式特殊字符导致错误
      expect(() => {
        TemplateEngine.render(template, { '特殊[字符].*+?^${}()|\\': '替换值' });
      }).not.toThrow();
    });
  });
});