import React, { useState, useEffect, useRef } from 'react';

// =====================================================
// SearchInput Component - 分类搜索输入组件
// =====================================================

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onSearch: (searchTerm: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * SearchInput - 带防抖和清除功能的搜索输入组件
 * 
 * 功能特性:
 * - 🔍 实时搜索with防抖优化
 * - ❌ 一键清除搜索内容
 * - ⌨️ 键盘快捷键支持 (Escape清除)
 * - 🎯 焦点状态管理
 * - 📱 无障碍设计支持
 */
const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = '搜索提示词...',
  value: controlledValue,
  onSearch,
  onClear,
  debounceMs = 300,
  disabled = false,
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 使用受控值或内部状态
  const searchValue = controlledValue !== undefined ? controlledValue : internalValue;

  // 防抖搜索处理
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(searchValue);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchValue, onSearch, debounceMs]);

  // 同步外部值变化
  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== internalValue) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue, internalValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    
    // 立即触发搜索回调（防抖在useEffect中处理）
  };

  const handleClear = () => {
    const newValue = '';
    
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    
    onClear?.();
    onSearch(''); // 立即触发清除搜索
    
    // 聚焦输入框
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
      e.preventDefault();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const getContainerClassName = () => {
    const baseClasses = `
      relative flex items-center transition-all duration-200 ease-in-out
      ${className}
    `;
    
    if (disabled) {
      return `${baseClasses} opacity-50 cursor-not-allowed`;
    }
    
    return baseClasses;
  };

  const getInputClassName = () => {
    const baseClasses = `
      w-full pl-9 pr-8 py-2 text-sm
      border rounded-lg transition-all duration-200 ease-in-out
      placeholder-gray-500 focus:outline-none
    `;
    
    if (disabled) {
      return `${baseClasses} bg-gray-100 border-gray-200 cursor-not-allowed`;
    }
    
    if (isFocused) {
      return `${baseClasses} bg-white border-blue-500 ring-2 ring-blue-500 ring-opacity-50 shadow-sm`;
    }
    
    return `${baseClasses} bg-white border-gray-300 hover:border-gray-400`;
  };

  const getIconClassName = () => {
    const baseClasses = 'absolute left-3 w-4 h-4 transition-colors duration-200';
    
    if (disabled) {
      return `${baseClasses} text-gray-300`;
    }
    
    if (isFocused || searchValue) {
      return `${baseClasses} text-blue-500`;
    }
    
    return `${baseClasses} text-gray-400`;
  };

  return (
    <div className={getContainerClassName()}>
      {/* 搜索图标 */}
      <svg 
        className={getIconClassName()}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
        />
      </svg>
      
      {/* 搜索输入框 */}
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={getInputClassName()}
        aria-label="搜索提示词"
        aria-describedby="search-help"
      />
      
      {/* 清除按钮 */}
      {searchValue && !disabled && (
        <button
          onClick={handleClear}
          className="absolute right-2 p-1 rounded-full hover:bg-gray-100 
                   transition-colors duration-200 focus:outline-none 
                   focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label="清除搜索"
          title="清除搜索 (Esc)"
        >
          <svg 
            className="w-3 h-3 text-gray-400 hover:text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      )}
      
      {/* 无障碍帮助文本 */}
      <div id="search-help" className="sr-only">
        输入关键词搜索提示词标题、描述和内容，按Escape键清除搜索内容
      </div>
    </div>
  );
};

export default SearchInput;