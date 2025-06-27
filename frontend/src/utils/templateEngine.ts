/**
 * 模板引擎
 * 负责参数替换、预览生成和模板处理
 */

import { TagParser } from './tagParser';
import type { ParsedTemplate, ParsedTag, FormSchema } from './tagParser';

// 重新导出常用类型
export type { ParsedTemplate, ParsedTag, FormSchema };

export interface TemplateRenderOptions {
  /** 是否保留未填写的标签 */
  keepUnfilledTags?: boolean;
  /** 未填写标签的占位符 */
  unfilledPlaceholder?: string;
  /** 是否进行HTML转义 */
  escapeHtml?: boolean;
}

export interface RenderResult {
  /** 渲染后的内容 */
  content: string;
  /** 未填写的标签列表 */
  unfilledTags: string[];
  /** 是否完整填写 */
  isComplete: boolean;
  /** 渲染时间戳 */
  timestamp: number;
}

/**
 * 模板引擎类
 */
export class TemplateEngine {
  /**
   * 渲染模板
   */
  static render(
    template: ParsedTemplate,
    parameters: Record<string, any>,
    options: TemplateRenderOptions = {}
  ): RenderResult {
    const {
      keepUnfilledTags = false,
      unfilledPlaceholder = '[未填写]',
      escapeHtml = false
    } = options;

    let content = template.content;
    const unfilledTags: string[] = [];

    // 按照标签出现的顺序进行替换
    for (const tag of template.tags) {
      const value = parameters[tag.name];
      
      if (value !== undefined && value !== null && value !== '') {
        // 处理值
        let processedValue = this.processValue(value, tag, escapeHtml);
        
        // 替换所有出现的标签
        content = content.replace(new RegExp(tag.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), processedValue);
      } else {
        // 处理未填写的标签
        unfilledTags.push(tag.name);
        
        if (!keepUnfilledTags) {
          content = content.replace(new RegExp(tag.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), unfilledPlaceholder);
        }
      }
    }

    return {
      content,
      unfilledTags,
      isComplete: unfilledTags.length === 0,
      timestamp: Date.now()
    };
  }

  /**
   * 实时预览渲染（用于表单填写时的实时预览）
   */
  static renderPreview(
    template: ParsedTemplate,
    parameters: Record<string, any>
  ): RenderResult {
    return this.render(template, parameters, {
      keepUnfilledTags: false,
      unfilledPlaceholder: '___',
      escapeHtml: false
    });
  }

  /**
   * 安全渲染（用于最终输出，进行HTML转义）
   */
  static renderSafe(
    template: ParsedTemplate,
    parameters: Record<string, any>
  ): RenderResult {
    return this.render(template, parameters, {
      keepUnfilledTags: false,
      unfilledPlaceholder: '[未填写]',
      escapeHtml: true
    });
  }

  /**
   * 处理参数值
   */
  private static processValue(value: any, tag: ParsedTag, escapeHtml: boolean): string {
    let stringValue = String(value);

    // 类型特定的处理
    switch (tag.type) {
      case 'multiline':
        // 保留换行符
        stringValue = stringValue.replace(/\n/g, '\n');
        break;
        
      case 'email':
        // 邮箱不需要特殊处理
        break;
        
      case 'url':
        // 确保URL格式正确
        if (!stringValue.startsWith('http://') && !stringValue.startsWith('https://')) {
          stringValue = 'https://' + stringValue;
        }
        break;
        
      case 'number':
        // 数字格式化
        const num = Number(value);
        if (!isNaN(num)) {
          stringValue = num.toString();
        }
        break;
    }

    // HTML转义
    if (escapeHtml) {
      stringValue = this.escapeHtml(stringValue);
    }

    return stringValue;
  }

  /**
   * HTML转义
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 生成参数摘要
   */
  static generateParameterSummary(
    template: ParsedTemplate,
    parameters: Record<string, any>
  ): Array<{ name: string; value: string; description?: string }> {
    return template.tags.map(tag => ({
      name: tag.name,
      value: parameters[tag.name] || '[未填写]',
      description: tag.description
    }));
  }

  /**
   * 检查模板是否需要参数
   */
  static requiresParameters(content: string): boolean {
    const template = TagParser.parseTemplate(content);
    return template.isParameterized;
  }

  /**
   * 获取模板参数数量
   */
  static getParameterCount(content: string): number {
    const template = TagParser.parseTemplate(content);
    return template.tags.length;
  }

  /**
   * 验证并渲染模板
   */
  static validateAndRender(
    template: ParsedTemplate,
    parameters: Record<string, any>
  ): {
    isValid: boolean;
    errors: string[];
    result?: RenderResult;
  } {
    // 验证参数
    const validation = TagParser.validateParameters(template, parameters);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        errors: validation.errors
      };
    }

    // 渲染模板
    const result = this.render(template, parameters);
    
    return {
      isValid: true,
      errors: [],
      result
    };
  }

  /**
   * 生成示例参数
   */
  static generateExampleParameters(template: ParsedTemplate): Record<string, any> {
    const examples: Record<string, any> = {};

    for (const tag of template.tags) {
      if (tag.example) {
        examples[tag.name] = tag.example;
      } else if (tag.defaultValue) {
        examples[tag.name] = tag.defaultValue;
      } else {
        // 根据类型生成示例值
        examples[tag.name] = this.generateExampleValue(tag);
      }
    }

    return examples;
  }

  /**
   * 根据标签类型生成示例值
   */
  private static generateExampleValue(tag: ParsedTag): any {
    switch (tag.type) {
      case 'text':
        return `示例${tag.name}`;
      case 'multiline':
        return `这是一个\n多行文本示例\n用于${tag.name}字段`;
      case 'number':
        return 42;
      case 'email':
        return 'example@domain.com';
      case 'url':
        return 'https://example.com';
      case 'date':
        return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      case 'select':
        return tag.options?.[0] || '选项1';
      default:
        return `示例${tag.name}`;
    }
  }

  /**
   * 计算模板复杂度评分
   */
  static calculateComplexity(template: ParsedTemplate): {
    score: number;
    level: 'simple' | 'medium' | 'complex';
    details: {
      parameterCount: number;
      hasSelectFields: boolean;
      hasMultilineFields: boolean;
      hasSpecialTypes: boolean;
    };
  } {
    const details = {
      parameterCount: template.tags.length,
      hasSelectFields: template.tags.some(tag => tag.type === 'select'),
      hasMultilineFields: template.tags.some(tag => tag.type === 'multiline'),
      hasSpecialTypes: template.tags.some(tag => 
        ['email', 'url', 'date', 'number'].includes(tag.type)
      )
    };

    let score = 0;
    
    // 基础分数 - 参数数量
    score += details.parameterCount * 10;
    
    // 复杂字段加分
    if (details.hasSelectFields) score += 5;
    if (details.hasMultilineFields) score += 8;
    if (details.hasSpecialTypes) score += 3;

    // 确定复杂度等级
    let level: 'simple' | 'medium' | 'complex';
    if (score <= 20) {
      level = 'simple';
    } else if (score <= 50) {
      level = 'medium';
    } else {
      level = 'complex';
    }

    return { score, level, details };
  }
}

/**
 * 便捷函数：快速渲染模板
 */
export function renderTemplate(
  content: string,
  parameters: Record<string, any>
): RenderResult {
  const template = TagParser.parseTemplate(content);
  return TemplateEngine.render(template, parameters);
}

/**
 * 便捷函数：检查内容是否需要参数
 */
export function needsParameters(content: string): boolean {
  return TemplateEngine.requiresParameters(content);
}

/**
 * 便捷函数：生成参数表单的默认值
 */
export function getDefaultParameters(content: string): Record<string, any> {
  const template = TagParser.parseTemplate(content);
  return TemplateEngine.generateExampleParameters(template);
}