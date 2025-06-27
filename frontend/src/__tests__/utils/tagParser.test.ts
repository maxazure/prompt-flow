/**
 * TagParser 单元测试
 * 测试标签解析、JSON Schema生成和参数验证功能
 */

import { describe, it, expect } from 'vitest';
import { TagParser, parseAndGenerateSchema } from '../../utils/tagParser';
import type { ParsedTemplate } from '../../utils/tagParser';

describe('TagParser', () => {
  describe('parseTemplate', () => {
    it('应该解析基础文本标签', () => {
      const content = '你好 {{用户名}}，欢迎使用 {{产品名称}}！';
      const result = TagParser.parseTemplate(content);

      expect(result.isParameterized).toBe(true);
      expect(result.tags).toHaveLength(2);
      expect(result.tags[0].name).toBe('用户名');
      expect(result.tags[0].type).toBe('text');
      expect(result.tags[1].name).toBe('产品名称');
    });

    it('应该解析带描述的标签', () => {
      const content = '请为 {{项目名称:项目的名称}} 创建文档';
      const result = TagParser.parseTemplate(content);

      expect(result.tags).toHaveLength(1);
      expect(result.tags[0].name).toBe('项目名称');
      expect(result.tags[0].description).toBe('项目的名称');
      expect(result.tags[0].type).toBe('text');
    });

    it('应该解析带示例的标签', () => {
      const content = '发送邮件到 {{邮箱地址:用户邮箱:example@domain.com}}';
      const result = TagParser.parseTemplate(content);

      expect(result.tags).toHaveLength(1);
      expect(result.tags[0].name).toBe('邮箱地址');
      expect(result.tags[0].description).toBe('用户邮箱');
      expect(result.tags[0].example).toBe('example@domain.com');
    });

    it('应该解析多行文本标签', () => {
      const content = '详细描述：{{详细信息:详细描述内容:多行文本示例:multiline}}';
      const result = TagParser.parseTemplate(content);

      expect(result.tags).toHaveLength(1);
      expect(result.tags[0].type).toBe('multiline');
    });

    it('应该解析数字类型标签', () => {
      const content = '数量：{{数量:请输入数量:100:number}}';
      const result = TagParser.parseTemplate(content);

      expect(result.tags).toHaveLength(1);
      expect(result.tags[0].type).toBe('number');
    });

    it('应该解析邮箱类型标签', () => {
      const content = '联系方式：{{邮箱:联系邮箱:test@example.com:email}}';
      const result = TagParser.parseTemplate(content);

      expect(result.tags).toHaveLength(1);
      expect(result.tags[0].type).toBe('email');
    });

    it('应该解析URL类型标签', () => {
      const content = '官网：{{网址:官方网站:https://example.com:url}}';
      const result = TagParser.parseTemplate(content);

      expect(result.tags).toHaveLength(1);
      expect(result.tags[0].type).toBe('url');
    });

    it('应该解析选择器标签', () => {
      const content = '选择级别：{{级别:优先级|高,中,低}}';
      const result = TagParser.parseTemplate(content);

      expect(result.tags).toHaveLength(1);
      expect(result.tags[0].name).toBe('级别');
      expect(result.tags[0].type).toBe('select');
      expect(result.tags[0].options).toEqual(['高', '中', '低']);
      expect(result.tags[0].defaultValue).toBe('高');
    });

    it('应该处理重复标签名（去重）', () => {
      const content = '{{用户名}} 和 {{用户名}} 是同一个人';
      const result = TagParser.parseTemplate(content);

      expect(result.tags).toHaveLength(1);
      expect(result.tags[0].name).toBe('用户名');
    });

    it('应该处理无参数的模板', () => {
      const content = '这是一个没有参数的普通文本';
      const result = TagParser.parseTemplate(content);

      expect(result.isParameterized).toBe(false);
      expect(result.tags).toHaveLength(0);
    });

    it('应该忽略无效的标签格式', () => {
      const content = '{{}} {{invalid@name}} {{}} {{正常标签}}';
      const result = TagParser.parseTemplate(content);

      expect(result.tags).toHaveLength(1);
      expect(result.tags[0].name).toBe('正常标签');
    });
  });

  describe('generateSchema', () => {
    it('应该生成正确的JSON Schema', () => {
      const template: ParsedTemplate = {
        content: '测试模板',
        tags: [
          {
            original: '{{用户名}}',
            name: '用户名',
            type: 'text',
            required: true
          },
          {
            original: '{{数量}}',
            name: '数量',
            type: 'number',
            required: true
          }
        ],
        isParameterized: true
      };

      const schema = TagParser.generateSchema(template, '测试表单');

      expect(schema.type).toBe('object');
      expect(schema.title).toBe('测试表单');
      expect(schema.required).toEqual(['用户名', '数量']);
      expect(schema.properties.用户名.type).toBe('string');
      expect(schema.properties.数量.type).toBe('number');
    });

    it('应该为选择器生成enum schema', () => {
      const template: ParsedTemplate = {
        content: '测试',
        tags: [
          {
            original: '{{级别}}',
            name: '级别',
            type: 'select',
            options: ['高', '中', '低'],
            required: true
          }
        ],
        isParameterized: true
      };

      const schema = TagParser.generateSchema(template);
      
      expect(schema.properties.级别.type).toBe('string');
      expect(schema.properties.级别.enum).toEqual(['高', '中', '低']);
    });
  });

  describe('applyParameters', () => {
    it('应该正确替换参数', () => {
      const template: ParsedTemplate = {
        content: '你好 {{用户名}}，今天是 {{日期}}',
        tags: [
          { original: '{{用户名}}', name: '用户名', type: 'text', required: true },
          { original: '{{日期}}', name: '日期', type: 'text', required: true }
        ],
        isParameterized: true
      };

      const parameters = {
        用户名: '张三',
        日期: '2025-06-27'
      };

      const result = TagParser.applyParameters(template, parameters);
      expect(result).toBe('你好 张三，今天是 2025-06-27');
    });

    it('应该处理重复出现的标签', () => {
      const template: ParsedTemplate = {
        content: '{{名字}} 说："我是 {{名字}}"',
        tags: [
          { original: '{{名字}}', name: '名字', type: 'text', required: true }
        ],
        isParameterized: true
      };

      const result = TagParser.applyParameters(template, { 名字: '李四' });
      expect(result).toBe('李四 说："我是 李四"');
    });

    it('应该处理特殊字符转义', () => {
      const template: ParsedTemplate = {
        content: '正则表达式：{{模式}}',
        tags: [
          { original: '{{模式}}', name: '模式', type: 'text', required: true }
        ],
        isParameterized: true
      };

      const result = TagParser.applyParameters(template, { 模式: '[.*+?^${}()|\\]' });
      expect(result).toBe('正则表达式：[.*+?^${}()|\\]');
    });
  });

  describe('validateParameters', () => {
    const template: ParsedTemplate = {
      content: '测试',
      tags: [
        { original: '{{用户名}}', name: '用户名', type: 'text', required: true },
        { original: '{{邮箱}}', name: '邮箱', type: 'email', required: true },
        { original: '{{年龄}}', name: '年龄', type: 'number', required: false },
        { original: '{{级别}}', name: '级别', type: 'select', options: ['高', '中', '低'], required: true }
      ],
      isParameterized: true
    };

    it('应该通过有效参数验证', () => {
      const parameters = {
        用户名: '张三',
        邮箱: 'zhangsan@example.com',
        年龄: '25',
        级别: '中'
      };

      const result = TagParser.validateParameters(template, parameters);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测必填字段缺失', () => {
      const parameters = {
        用户名: '张三'
        // 缺少邮箱和级别
      };

      const result = TagParser.validateParameters(template, parameters);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该验证邮箱格式', () => {
      const parameters = {
        用户名: '张三',
        邮箱: 'invalid-email',
        级别: '中'
      };

      const result = TagParser.validateParameters(template, parameters);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('有效的邮箱地址'))).toBe(true);
    });

    it('应该验证数字格式', () => {
      const parameters = {
        用户名: '张三',
        邮箱: 'test@example.com',
        年龄: 'not-a-number',
        级别: '中'
      };

      const result = TagParser.validateParameters(template, parameters);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('有效的数字'))).toBe(true);
    });

    it('应该验证选择器选项', () => {
      const parameters = {
        用户名: '张三',
        邮箱: 'test@example.com',
        级别: '超高' // 不在选项中
      };

      const result = TagParser.validateParameters(template, parameters);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('预设选项之一'))).toBe(true);
    });
  });

  describe('parseAndGenerateSchema 便捷函数', () => {
    it('应该同时解析和生成Schema', () => {
      const content = '请输入{{用户名:用户姓名:张三}}和{{邮箱:邮箱地址:test@example.com:email}}';
      
      const { template, schema } = parseAndGenerateSchema(content, '用户信息');

      expect(template.isParameterized).toBe(true);
      expect(template.tags).toHaveLength(2);
      expect(schema).not.toBeNull();
      expect(schema!.title).toBe('用户信息');
      expect(schema!.properties.用户名).toBeDefined();
      expect(schema!.properties.邮箱).toBeDefined();
    });

    it('应该处理非参数化内容', () => {
      const content = '这是普通文本，没有参数';
      
      const { template, schema } = parseAndGenerateSchema(content);

      expect(template.isParameterized).toBe(false);
      expect(schema).toBeNull();
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空内容', () => {
      const result = TagParser.parseTemplate('');
      expect(result.isParameterized).toBe(false);
      expect(result.tags).toHaveLength(0);
    });

    it('应该处理只有空格的标签', () => {
      const result = TagParser.parseTemplate('{{  }}');
      expect(result.tags).toHaveLength(0);
    });

    it('应该处理嵌套花括号', () => {
      const result = TagParser.parseTemplate('{{外层{{内层}}}}');
      // 应该只解析外层，内层被忽略
      expect(result.tags).toHaveLength(0);
    });

    it('应该处理超长变量名', () => {
      const longName = 'a'.repeat(100);
      const result = TagParser.parseTemplate(`{{${longName}}}`);
      expect(result.tags).toHaveLength(0); // 超过50字符限制
    });

    it('应该处理特殊字符变量名', () => {
      const result = TagParser.parseTemplate('{{变量-名称_123}} {{中文变量名}}');
      expect(result.tags).toHaveLength(1); // 只有中文变量名有效
      expect(result.tags[0].name).toBe('中文变量名');
    });
  });
});