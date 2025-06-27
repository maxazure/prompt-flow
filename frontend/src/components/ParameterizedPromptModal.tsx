/**
 * 参数化提示词模态框组件
 * 集成DynamicForm，提供完整的参数填写和预览体验
 */

import React, { useState, useEffect } from 'react';
import type { Prompt } from '../types';
import { parseAndGenerateSchema } from '../utils/tagParser';
import DynamicForm from './DynamicForm';

export interface ParameterizedPromptModalProps {
  /** 提示词数据 */
  prompt: Prompt;
  /** 是否显示模态框 */
  isOpen: boolean;
  /** 关闭模态框回调 */
  onClose: () => void;
  /** 复制内容回调 */
  onCopy?: (content: string) => void;
  /** 保存为新提示词回调 */
  onSaveAsNew?: (content: string, parameters: Record<string, any>) => void;
  /** 发送到AI回调 */
  onSendToAI?: (content: string) => void;
}

export interface ActionButton {
  label: string;
  action: () => void;
  icon: React.ReactNode;
  variant: 'primary' | 'secondary' | 'success' | 'info';
  disabled?: boolean;
}

/**
 * 参数化提示词模态框
 */
export const ParameterizedPromptModal: React.FC<ParameterizedPromptModalProps> = ({
  prompt,
  isOpen,
  onClose,
  onCopy,
  onSaveAsNew,
  onSendToAI
}) => {
  const [currentValues, setCurrentValues] = useState<Record<string, any>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [renderedContent, setRenderedContent] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 解析提示词内容
  const { template, schema } = parseAndGenerateSchema(prompt.content, prompt.title);
  const isParameterized = template.isParameterized;

  // 重置状态
  const resetState = () => {
    setCurrentValues({});
    setIsFormValid(false);
    setRenderedContent('');
    setCopySuccess(false);
    setIsProcessing(false);
  };

  // 处理表单值变化
  const handleFormChange = (values: Record<string, any>, isValid: boolean) => {
    setCurrentValues(values);
    setIsFormValid(isValid);
  };

  // 处理预览内容变化
  const handlePreviewChange = (content: string) => {
    setRenderedContent(content);
  };

  // 复制到剪贴板
  const handleCopy = async () => {
    if (!renderedContent) return;

    try {
      await navigator.clipboard.writeText(renderedContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      onCopy?.(renderedContent);
    } catch (error) {
      console.error('复制失败:', error);
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = renderedContent;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        onCopy?.(renderedContent);
      } catch (fallbackError) {
        console.error('降级复制也失败:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  // 快速复制原始内容
  const handleQuickCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      onCopy?.(prompt.content);
    } catch (error) {
      console.error('快速复制失败:', error);
    }
  };

  // 保存为新提示词
  const handleSaveAsNew = async () => {
    if (!renderedContent || !isFormValid) return;

    setIsProcessing(true);
    try {
      await onSaveAsNew?.(renderedContent, currentValues);
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 发送到AI
  const handleSendToAI = async () => {
    if (!renderedContent) return;

    setIsProcessing(true);
    try {
      await onSendToAI?.(renderedContent);
    } catch (error) {
      console.error('发送到AI失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 操作按钮配置
  const actionButtons: ActionButton[] = [
    {
      label: copySuccess ? '已复制!' : '复制内容',
      action: handleCopy,
      icon: copySuccess ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      variant: copySuccess ? 'success' : 'primary',
      disabled: !renderedContent
    }
  ];

  // 如果支持保存为新提示词
  if (onSaveAsNew) {
    actionButtons.push({
      label: '保存为新提示词',
      action: handleSaveAsNew,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      variant: 'secondary',
      disabled: !isFormValid || isProcessing
    });
  }

  // 如果支持发送到AI
  if (onSendToAI) {
    actionButtons.push({
      label: '发送到AI',
      action: handleSendToAI,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      variant: 'info',
      disabled: !renderedContent || isProcessing
    });
  }

  // 模态框打开时重置状态
  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  // 如果模态框关闭，直接返回null
  if (!isOpen) {
    return null;
  }

  // 获取按钮样式
  const getButtonStyle = (variant: ActionButton['variant'], disabled?: boolean) => {
    const baseStyle = 'flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors';
    
    if (disabled) {
      return `${baseStyle} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }

    switch (variant) {
      case 'primary':
        return `${baseStyle} bg-blue-600 text-white hover:bg-blue-700`;
      case 'secondary':
        return `${baseStyle} bg-gray-600 text-white hover:bg-gray-700`;
      case 'success':
        return `${baseStyle} bg-green-600 text-white hover:bg-green-700`;
      case 'info':
        return `${baseStyle} bg-purple-600 text-white hover:bg-purple-700`;
      default:
        return `${baseStyle} bg-gray-600 text-white hover:bg-gray-700`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              使用提示词: {prompt.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isParameterized 
                ? `检测到 ${template.tags.length} 个参数，请填写后生成最终内容`
                : '该提示词无需参数，可直接使用'
              }
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-6">
          {isParameterized && schema ? (
            // 参数化模式 - 显示动态表单
            <DynamicForm
              schema={schema}
              template={template}
              showPreview={true}
              onChange={handleFormChange}
              onPreviewChange={handlePreviewChange}
              className="h-full"
            />
          ) : (
            // 非参数化模式 - 直接显示内容
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">提示词内容</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {prompt.content}
                  </pre>
                </div>
              </div>
              
              {/* 元信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">版本:</span>
                  <span className="ml-2 text-gray-600">v{prompt.version}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">作者:</span>
                  <span className="ml-2 text-gray-600">{prompt.user?.username || '未知'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex gap-2">
            {/* 快速复制按钮（仅在参数化模式下显示） */}
            {isParameterized && (
              <button
                onClick={handleQuickCopy}
                className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                快速复制原始内容
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {/* 取消按钮 */}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              取消
            </button>

            {/* 动态操作按钮 */}
            {actionButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.action}
                disabled={button.disabled}
                className={getButtonStyle(button.variant, button.disabled)}
              >
                {button.icon}
                {button.label}
              </button>
            ))}
          </div>
        </div>

        {/* 处理中的加载覆盖层 */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">处理中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParameterizedPromptModal;