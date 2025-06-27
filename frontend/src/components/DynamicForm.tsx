/**
 * 动态表单组件
 * 基于JSON Schema渲染表单，支持多种字段类型和实时验证
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TemplateEngine } from '../utils/templateEngine';
import type { FormSchema, ParsedTemplate } from '../utils/templateEngine';
import { TagParser } from '../utils/tagParser';

export interface DynamicFormProps {
  /** JSON Schema */
  schema: FormSchema;
  /** 解析后的模板 */
  template: ParsedTemplate;
  /** 初始值 */
  initialValues?: Record<string, any>;
  /** 是否显示预览 */
  showPreview?: boolean;
  /** 表单值变化回调 */
  onChange?: (values: Record<string, any>, isValid: boolean) => void;
  /** 预览内容变化回调 */
  onPreviewChange?: (content: string) => void;
  /** 表单提交回调 */
  onSubmit?: (values: Record<string, any>, renderedContent: string) => void;
  /** 是否只读模式 */
  readonly?: boolean;
  /** 自定义类名 */
  className?: string;
}

export interface FieldError {
  field: string;
  message: string;
}

/**
 * 单个字段组件
 */
interface FormFieldProps {
  name: string;
  schema: any;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  readonly?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  schema,
  value,
  onChange,
  error,
  readonly = false
}) => {
  const fieldId = `field-${name}`;
  const hasError = !!error;

  // 渲染不同类型的输入框
  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      name,
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        let newValue = e.target.value;
        
        // 数字类型转换
        if (schema.type === 'number') {
          newValue = newValue === '' ? '' : Number(newValue).toString();
        }
        
        onChange(newValue);
      },
      disabled: readonly,
      className: `w-full px-3 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        hasError 
          ? 'border-red-300 bg-red-50' 
          : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500'
      } ${readonly ? 'bg-gray-50 cursor-not-allowed' : ''}`
    };

    // 选择框
    if (schema.enum && schema.enumNames) {
      return (
        <select {...commonProps}>
          <option value="">请选择...</option>
          {schema.enum.map((option: string, index: number) => (
            <option key={option} value={option}>
              {schema.enumNames[index] || option}
            </option>
          ))}
        </select>
      );
    }

    // 多行文本
    if (schema.format === 'textarea') {
      return (
        <textarea
          {...commonProps}
          rows={4}
          placeholder={schema.description || `请输入${schema.title}`}
          maxLength={schema.maxLength}
        />
      );
    }

    // 根据类型和格式确定input类型
    let inputType = 'text';
    let placeholder = schema.description || `请输入${schema.title}`;

    switch (schema.type) {
      case 'number':
        inputType = 'number';
        break;
    }

    switch (schema.format) {
      case 'email':
        inputType = 'email';
        placeholder = '请输入邮箱地址';
        break;
      case 'url':
        inputType = 'url';
        placeholder = '请输入网址';
        break;
      case 'date':
        inputType = 'date';
        break;
    }

    return (
      <input
        {...commonProps}
        type={inputType}
        placeholder={placeholder}
        maxLength={schema.maxLength}
      />
    );
  };

  return (
    <div className="mb-4">
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {schema.title}
        {schema.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {renderInput()}
      
      {/* 描述文本 */}
      {schema.description && (
        <p className="mt-1 text-xs text-gray-500">
          {schema.description}
        </p>
      )}
      
      {/* 错误信息 */}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {/* 字符计数 */}
      {schema.maxLength && value && (
        <p className="mt-1 text-xs text-gray-400 text-right">
          {String(value).length} / {schema.maxLength}
        </p>
      )}
    </div>
  );
};

/**
 * 动态表单主组件
 */
export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  template,
  initialValues = {},
  showPreview = true,
  onChange,
  onPreviewChange,
  onSubmit,
  readonly = false,
  className = ''
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 验证表单
  const validateForm = useCallback((formValues: Record<string, any>) => {
    const validation = TagParser.validateParameters(template, formValues);
    const newErrors: Record<string, string> = {};

    // 转换验证错误格式
    for (const error of validation.errors) {
      // 提取字段名 (假设错误消息格式为 "字段名 是必填字段")
      const fieldMatch = error.match(/^(.+?)\s/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        newErrors[fieldName] = error;
      }
    }

    setErrors(newErrors);
    return validation.isValid;
  }, [template]);

  // 更新预览内容
  const updatePreview = useCallback((formValues: Record<string, any>) => {
    const result = TemplateEngine.renderPreview(template, formValues);
    setPreviewContent(result.content);
    onPreviewChange?.(result.content);
  }, [template, onPreviewChange]);

  // 处理字段值变化
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    const newValues = { ...values, [fieldName]: value };
    setValues(newValues);

    // 清除该字段的错误
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // 实时验证和预览更新
    const isValid = validateForm(newValues);
    updatePreview(newValues);
    
    // 通知父组件
    onChange?.(newValues, isValid);
  }, [values, errors, validateForm, updatePreview, onChange]);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (readonly) return;

    setIsSubmitting(true);
    
    try {
      // 验证表单
      const isValid = validateForm(values);
      
      if (!isValid) {
        return;
      }

      // 渲染最终内容
      const result = TemplateEngine.renderSafe(template, values);
      
      // 调用提交回调
      await onSubmit?.(values, result.content);
      
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    setValues(initialValues);
    setErrors({});
    updatePreview(initialValues);
  };

  // 填充示例数据
  const handleFillExample = () => {
    const exampleValues = TemplateEngine.generateExampleParameters(template);
    setValues(exampleValues);
    validateForm(exampleValues);
    updatePreview(exampleValues);
  };

  // 初始化时更新预览
  useEffect(() => {
    updatePreview(values);
  }, []);

  // 当initialValues变化时更新表单
  useEffect(() => {
    setValues(initialValues);
    updatePreview(initialValues);
  }, [initialValues, updatePreview]);

  const hasErrors = Object.keys(errors).length > 0;
  const complexity = TemplateEngine.calculateComplexity(template);

  return (
    <div className={`dynamic-form ${className}`}>
      {/* 表单头部 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {schema.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {schema.description}
            </p>
          </div>
          
          {/* 复杂度指示器 */}
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              complexity.level === 'simple' ? 'bg-green-100 text-green-700' :
              complexity.level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {complexity.level === 'simple' ? '简单' :
               complexity.level === 'medium' ? '中等' : '复杂'}
            </div>
            <span className="text-xs text-gray-500">
              {template.tags.length}个参数
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        {!readonly && (
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleFillExample}
              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              填充示例
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              重置
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 表单区域 */}
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-700 mb-3">参数填写</h4>
          
          <form onSubmit={handleSubmit} className="space-y-1">
            {Object.entries(schema.properties).map(([fieldName, fieldSchema]) => (
              <FormField
                key={fieldName}
                name={fieldName}
                schema={fieldSchema}
                value={values[fieldName]}
                onChange={(value) => handleFieldChange(fieldName, value)}
                error={errors[fieldName]}
                readonly={readonly}
              />
            ))}

            {/* 提交按钮 */}
            {!readonly && onSubmit && (
              <div className="pt-4 border-t">
                <button
                  type="submit"
                  disabled={hasErrors || isSubmitting}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    hasErrors || isSubmitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  {isSubmitting ? '处理中...' : '确认使用'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* 预览区域 */}
        {showPreview && (
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-gray-700 mb-3">实时预览</h4>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[200px]">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                {previewContent || '开始填写参数以查看预览...'}
              </pre>
            </div>

            {/* 预览状态 */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {previewContent ? '预览已更新' : '等待参数输入'}
              </span>
              <span>
                字符数: {previewContent.length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicForm;