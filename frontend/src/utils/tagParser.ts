/**
 * 提示词标签解析器
 * 支持多种标签格式的解析和JSON Schema生成
 */

export interface ParsedTag {
  /** 原始标签文本 */
  original: string;
  /** 变量名 */
  name: string;
  /** 描述信息 */
  description?: string;
  /** 示例值 */
  example?: string;
  /** 字段类型 */
  type: 'text' | 'multiline' | 'number' | 'email' | 'url' | 'select' | 'date';
  /** 选择项 (仅用于select类型) */
  options?: string[];
  /** 是否必填 */
  required?: boolean;
  /** 默认值 */
  defaultValue?: string;
}

export interface ParsedTemplate {
  /** 原始模板内容 */
  content: string;
  /** 解析出的标签列表 */
  tags: ParsedTag[];
  /** 是否为参数化模板 */
  isParameterized: boolean;
}

export interface FormSchema {
  type: 'object';
  properties: Record<string, any>;
  required: string[];
  title: string;
  description: string;
}

/**
 * 标签解析器类
 */
export class TagParser {
  /** 标签正则表达式 - 匹配 {{...}} 格式 */
  private static readonly TAG_REGEX = /\{\{([^}]+)\}\}/g;

  /**
   * 解析提示词模板中的标签
   */
  static parseTemplate(content: string): ParsedTemplate {
    const tags: ParsedTag[] = [];
    const matches = Array.from(content.matchAll(this.TAG_REGEX));

    for (const match of matches) {
      const tag = this.parseTag(match[0], match[1]);
      if (tag) {
        // 避免重复标签
        const existing = tags.find(t => t.name === tag.name);
        if (!existing) {
          tags.push(tag);
        }
      }
    }

    return {
      content,
      tags,
      isParameterized: tags.length > 0
    };
  }

  /**
   * 解析单个标签
   */
  private static parseTag(original: string, tagContent: string): ParsedTag | null {
    try {
      // 去除首尾空格
      tagContent = tagContent.trim();
      
      // 检查是否是选择器格式: 变量名|选项1,选项2,选项3
      if (tagContent.includes('|')) {
        return this.parseSelectTag(original, tagContent);
      }

      // 检查是否是完整格式: 变量名:描述:示例:类型
      // 使用更智能的分割，避免URL中的冒号影响
      const parts = this.smartSplit(tagContent, ':');
      const name = parts[0]?.trim();
      
      if (!name || !this.isValidVariableName(name)) {
        return null;
      }

      const description = parts[1]?.trim();
      const example = parts[2]?.trim();
      const typeOrDefault = parts[3]?.trim();

      // 确定字段类型
      const type = this.determineFieldType(typeOrDefault);
      
      return {
        original,
        name,
        description: description || undefined,
        example: example || undefined,
        type,
        required: true, // 默认必填
        defaultValue: undefined
      };

    } catch (error) {
      console.warn('Failed to parse tag:', original, error);
      return null;
    }
  }

  /**
   * 解析选择器标签
   */
  private static parseSelectTag(original: string, tagContent: string): ParsedTag | null {
    const [nameAndDesc, optionsStr] = tagContent.split('|');
    const parts = nameAndDesc.split(':');
    const name = parts[0]?.trim();
    const description = parts[1]?.trim();

    if (!name || !this.isValidVariableName(name) || !optionsStr) {
      return null;
    }

    const options = optionsStr.split(',').map(opt => opt.trim()).filter(Boolean);
    
    if (options.length === 0) {
      return null;
    }

    return {
      original,
      name,
      description: description || undefined,
      type: 'select',
      options,
      required: true,
      defaultValue: options[0] // 第一个选项作为默认值
    };
  }

  /**
   * 确定字段类型
   */
  private static determineFieldType(typeStr?: string): ParsedTag['type'] {
    if (!typeStr) return 'text';

    const lowerType = typeStr.toLowerCase();
    
    switch (lowerType) {
      case 'multiline':
      case 'textarea':
        return 'multiline';
      case 'number':
      case 'num':
        return 'number';
      case 'email':
      case 'mail':
        return 'email';
      case 'url':
      case 'link':
        return 'url';
      case 'date':
        return 'date';
      default:
        return 'text';
    }
  }

  /**
   * 智能分割字符串，避免URL等特殊内容中的分隔符影响
   */
  private static smartSplit(text: string, separator: string): string[] {
    const parts = text.split(separator);
    
    // 如果分割后超过4部分，可能存在URL等包含分隔符的内容
    if (parts.length > 4) {
      // 重新组合：变量名:描述:示例:类型
      // 将中间的部分合并为示例部分
      return [
        parts[0], // 变量名
        parts[1], // 描述
        parts.slice(2, -1).join(separator), // 示例（合并中间部分）
        parts[parts.length - 1] // 类型
      ];
    }
    
    return parts;
  }

  /**
   * 验证变量名是否合法
   */
  private static isValidVariableName(name: string): boolean {
    // 变量名应该是字母、数字、下划线、中文字符组成，且不能以数字开头
    const regex = /^[\u4e00-\u9fa5a-zA-Z_][\u4e00-\u9fa5a-zA-Z0-9_]*$/;
    return regex.test(name) && name.length <= 50;
  }

  /**
   * 生成JSON Schema
   */
  static generateSchema(template: ParsedTemplate, title?: string): FormSchema {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const tag of template.tags) {
      properties[tag.name] = this.tagToSchemaProperty(tag);
      
      if (tag.required) {
        required.push(tag.name);
      }
    }

    return {
      type: 'object',
      properties,
      required,
      title: title || '参数填写',
      description: `请填写以下 ${template.tags.length} 个参数来生成最终内容`
    };
  }

  /**
   * 将标签转换为JSON Schema属性
   */
  private static tagToSchemaProperty(tag: ParsedTag): any {
    const base = {
      title: tag.name,
      description: tag.description,
      default: tag.defaultValue
    };

    // 如果有示例，添加到描述中
    if (tag.example) {
      base.description = base.description 
        ? `${base.description} (例如: ${tag.example})`
        : `例如: ${tag.example}`;
    }

    switch (tag.type) {
      case 'text':
        return {
          ...base,
          type: 'string',
          maxLength: 500
        };

      case 'multiline':
        return {
          ...base,
          type: 'string',
          format: 'textarea',
          maxLength: 2000
        };

      case 'number':
        return {
          ...base,
          type: 'number'
        };

      case 'email':
        return {
          ...base,
          type: 'string',
          format: 'email'
        };

      case 'url':
        return {
          ...base,
          type: 'string',
          format: 'url'
        };

      case 'date':
        return {
          ...base,
          type: 'string',
          format: 'date'
        };

      case 'select':
        return {
          ...base,
          type: 'string',
          enum: tag.options,
          enumNames: tag.options // 用于显示友好的选项名称
        };

      default:
        return {
          ...base,
          type: 'string'
        };
    }
  }

  /**
   * 应用参数到模板中
   */
  static applyParameters(template: ParsedTemplate, parameters: Record<string, any>): string {
    let result = template.content;

    for (const tag of template.tags) {
      const value = parameters[tag.name];
      if (value !== undefined && value !== null) {
        // 将值转换为字符串
        const stringValue = String(value);
        // 替换所有出现的标签
        result = result.replace(new RegExp(tag.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), stringValue);
      }
    }

    return result;
  }

  /**
   * 验证参数
   */
  static validateParameters(template: ParsedTemplate, parameters: Record<string, any>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    for (const tag of template.tags) {
      const value = parameters[tag.name];

      // 检查必填字段
      if (tag.required && (value === undefined || value === null || value === '')) {
        errors.push(`${tag.name} 是必填字段`);
        continue;
      }

      // 如果字段有值，进行类型验证
      if (value !== undefined && value !== null && value !== '') {
        const error = this.validateFieldValue(tag, value);
        if (error) {
          errors.push(error);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证字段值
   */
  private static validateFieldValue(tag: ParsedTag, value: any): string | null {
    const stringValue = String(value);

    switch (tag.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(stringValue)) {
          return `${tag.name} 必须是有效的邮箱地址`;
        }
        break;

      case 'url':
        try {
          new URL(stringValue);
        } catch {
          return `${tag.name} 必须是有效的URL`;
        }
        break;

      case 'number':
        if (isNaN(Number(value))) {
          return `${tag.name} 必须是有效的数字`;
        }
        break;

      case 'select':
        if (tag.options && !tag.options.includes(stringValue)) {
          return `${tag.name} 必须是预设选项之一`;
        }
        break;

      case 'text':
      case 'multiline':
        if (stringValue.length > (tag.type === 'multiline' ? 2000 : 500)) {
          return `${tag.name} 内容过长`;
        }
        break;
    }

    return null;
  }
}

/**
 * 便捷方法：解析并生成Schema
 */
export function parseAndGenerateSchema(content: string, title?: string): {
  template: ParsedTemplate;
  schema: FormSchema | null;
} {
  const template = TagParser.parseTemplate(content);
  const schema = template.isParameterized ? TagParser.generateSchema(template, title) : null;
  
  return { template, schema };
}