import React, { useState, useRef, useEffect } from 'react';
import { CategoryColors } from '../types';

// =====================================================
// ColorPicker Component - 分类颜色选择器
// =====================================================

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * ColorPicker - 分类颜色选择器组件
 * 
 * 功能特性:
 * - 🎨 预设颜色选择
 * - 🖱️ 点击展开/收起
 * - ✅ 选中状态显示
 * - 🎯 自定义颜色输入
 * - 📱 响应式设计
 */
const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const pickerRef = useRef<HTMLDivElement>(null);

  // 关闭颜色选择器当点击外部时
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 更新自定义颜色值
  useEffect(() => {
    setCustomColor(value);
  }, [value]);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  const togglePicker = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {/* 颜色预览按钮 */}
      <button
        type="button"
        onClick={togglePicker}
        disabled={disabled}
        className={`
          w-8 h-8 rounded-full border-2 border-gray-300 
          transition-all duration-200 ease-in-out
          ${disabled 
            ? 'cursor-not-allowed opacity-50' 
            : 'cursor-pointer hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          }
          ${isOpen ? 'ring-2 ring-blue-500' : ''}
        `}
        style={{ backgroundColor: value }}
        title={`选择颜色 (当前: ${value})`}
        aria-label="打开颜色选择器"
      >
        <span className="sr-only">选择颜色</span>
      </button>

      {/* 颜色选择器面板 */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-[200px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 预设颜色网格 */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              预设颜色
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CategoryColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`
                    w-8 h-8 rounded-full border-2 transition-all duration-200
                    hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${value === color 
                      ? 'border-gray-600 ring-2 ring-blue-500 scale-110' 
                      : 'border-gray-300'
                    }
                  `}
                  style={{ backgroundColor: color }}
                  title={`选择颜色 ${color}`}
                  aria-label={`选择颜色 ${color}`}
                >
                  {value === color && (
                    <svg 
                      className="w-4 h-4 text-white mx-auto" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 自定义颜色输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              自定义颜色
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                title="选择自定义颜色"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  // 验证颜色格式再应用
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    onChange(e.target.value);
                  }
                }}
                placeholder="#000000"
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                pattern="^#[0-9A-Fa-f]{6}$"
                title="输入十六进制颜色值 (例如: #FF0000)"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;