import React from 'react';
import type { Category } from '../types';
import CategoryItem from './CategoryItem';

// =====================================================
// CategoryGroup Component - 分类分组显示组件
// =====================================================

interface CategoryGroupProps {
  groupKey: string;
  groupTitle: string;
  groupIcon: string;
  // scope: CategoryScope; // 暂时注释，后续可能用于权限控制
  categories: Category[];
  isExpanded: boolean;
  selectedCategory: string | null;
  collapsed?: boolean;
  onToggleExpand: (groupKey: string) => void;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

/**
 * CategoryGroup - 分类分组容器组件
 * 
 * 功能特性:
 * - 📂 分组标题和图标显示
 * - ⬇️⬆️ 展开/折叠交互逻辑
 * - 📋 分组内分类列表管理
 * - 📊 分组统计信息显示
 * - 🎨 选中状态和视觉反馈
 */
const CategoryGroup: React.FC<CategoryGroupProps> = ({
  groupKey,
  groupTitle,
  groupIcon,
  categories,
  isExpanded,
  selectedCategory,
  collapsed = false,
  onToggleExpand,
  onSelectCategory,
  className = '',
}) => {
  const handleToggleExpand = () => {
    onToggleExpand(groupKey);
  };

  const getTotalPrompts = () => {
    return categories.reduce((sum, cat) => sum + (cat.promptCount || 0), 0);
  };

  const getHeaderClassName = () => {
    const baseClasses = `
      w-full px-4 py-2 flex items-center justify-between 
      text-sm font-medium text-gray-700 hover:bg-gray-50
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
      ${className}
    `;
    
    return baseClasses;
  };

  const getExpandIconClassName = () => {
    return `
      w-4 h-4 transition-transform duration-200 ease-in-out
      ${isExpanded ? 'rotate-90' : 'rotate-0'}
    `;
  };

  // 如果没有分类且未折叠，则不显示
  if (categories.length === 0 && !collapsed) {
    return null;
  }

  if (collapsed) {
    // 折叠模式：只显示图标和分类点
    return (
      <div className={`mb-1 ${className}`}>
        {/* 分组图标 */}
        <div className="px-2 py-1 flex justify-center">
          <span 
            className="text-lg" 
            title={`${groupTitle} (${categories.length}个分类, ${getTotalPrompts()}个提示词)`}
          >
            {groupIcon}
          </span>
        </div>
        
        {/* 折叠模式下的分类列表 */}
        {categories.length > 0 && (
          <div className="space-y-1 px-1">
            {categories.map(category => (
              <CategoryItem
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id.toString()}
                collapsed={true}
                onSelect={onSelectCategory}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 完整模式
  return (
    <div className={`mb-1 ${className}`}>
      {/* 分组标题 */}
      <button
        onClick={handleToggleExpand}
        className={getHeaderClassName()}
        aria-expanded={isExpanded}
        aria-controls={`category-group-${groupKey}`}
        aria-label={`${groupTitle}分组，${categories.length}个分类，${isExpanded ? '已展开' : '已折叠'}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">{groupIcon}</span>
          <span>{groupTitle}</span>
          {categories.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              {categories.length}
            </span>
          )}
        </div>
        
        {categories.length > 0 && (
          <svg 
            className={getExpandIconClassName()}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        )}
      </button>

      {/* 分类列表 */}
      {isExpanded && categories.length > 0 && (
        <div 
          id={`category-group-${groupKey}`}
          className="space-y-1 px-2 pb-2 animate-slideDown"
        >
          {categories.map(category => (
            <CategoryItem
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id.toString()}
              collapsed={false}
              onSelect={onSelectCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryGroup;