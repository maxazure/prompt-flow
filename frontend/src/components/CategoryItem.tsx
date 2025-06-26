import React from 'react';
import type { Category } from '../types';

// =====================================================
// CategoryItem Component - 单个分类项显示组件
// =====================================================

interface CategoryItemProps {
  category: Category;
  isSelected: boolean;
  collapsed?: boolean;
  onSelect: (categoryId: string) => void;
  className?: string;
}

/**
 * CategoryItem - 分类列表中的单个分类项组件
 * 
 * 功能特性:
 * - 🎨 颜色标识圆点显示
 * - 📊 提示词数量统计 badge
 * - 🔒 权限状态图标 (只读/可编辑)
 * - ⭐ 选中状态高亮 + 左边框
 * - 📱 响应式设计支持折叠模式
 */
const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  isSelected,
  collapsed = false,
  onSelect,
  className = '',
}) => {
  const handleClick = () => {
    onSelect(category.id.toString());
  };

  const getItemClassName = () => {
    const baseClasses = `
      w-full px-3 py-2 text-left rounded-lg transition-all duration-200 ease-in-out
      hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
      ${className}
    `;
    
    if (isSelected) {
      return `${baseClasses} bg-blue-50 text-blue-700 border-l-4 border-blue-500 shadow-sm`;
    }
    
    return `${baseClasses} text-gray-700 hover:bg-gray-50 border-l-4 border-transparent`;
  };

  const getBadgeClassName = () => {
    const baseClasses = 'px-2 py-0.5 text-xs rounded-full font-medium transition-colors';
    
    if (isSelected) {
      return `${baseClasses} bg-blue-100 text-blue-700`;
    }
    
    return `${baseClasses} bg-gray-100 text-gray-600`;
  };

  if (collapsed) {
    // 折叠模式：只显示颜色点和选中状态
    return (
      <button
        onClick={handleClick}
        className={`
          w-full p-2 rounded-lg transition-all duration-200 ease-in-out
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
          ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}
          ${className}
        `}
        title={`${category.name} (${category.promptCount || 0})`}
        aria-label={`分类: ${category.name}, ${category.promptCount || 0}个提示词`}
      >
        <div className="flex justify-center">
          <div 
            className={`
              w-4 h-4 rounded-full flex-shrink-0 transition-transform duration-200
              ${isSelected ? 'scale-110 shadow-md' : 'scale-100'}
            `}
            style={{ backgroundColor: category.color }}
          />
        </div>
      </button>
    );
  }

  // 完整模式：显示所有信息
  return (
    <button
      onClick={handleClick}
      className={getItemClassName()}
      aria-label={`分类: ${category.name}, ${category.promptCount || 0}个提示词${!category.canEdit ? ', 只读' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* 颜色标识 */}
        <div 
          className={`
            w-3 h-3 rounded-full flex-shrink-0 transition-transform duration-200
            ${isSelected ? 'scale-110 shadow-sm' : 'scale-100'}
          `}
          style={{ backgroundColor: category.color }}
          aria-hidden="true"
        />
        
        {/* 分类名称 */}
        <span className="flex-1 truncate text-sm font-medium">
          {category.name}
        </span>
        
        {/* 提示词数量 */}
        <span 
          className={getBadgeClassName()}
          aria-label={`${category.promptCount || 0}个提示词`}
        >
          {category.promptCount || 0}
        </span>
        
        {/* 权限状态图标 */}
        {!category.canEdit && (
          <svg 
            className="w-3 h-3 text-gray-400 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-label="只读权限"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
        )}
      </div>
    </button>
  );
};

export default CategoryItem;