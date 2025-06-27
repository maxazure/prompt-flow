import React, { useState } from 'react';
import { useCategory } from '../context/CategoryContext';
import { CategoryScope } from '../types';
import CategoryGroup from './CategoryGroup';
import SearchInput from './SearchInput';
import CreateCategoryButton from './CreateCategoryButton';

// =====================================================
// CategorySidebar Component - Phase 4 Core Navigation
// =====================================================

interface CategorySidebarProps {
  collapsed: boolean;
  isMobile: boolean;
  isTablet: boolean;
  onToggle: () => void;
}

// 分类侧边栏组件 - 左侧导航核心
const CategorySidebar: React.FC<CategorySidebarProps> = ({
  collapsed,
  isMobile,
  isTablet,
  onToggle,
}) => {
  const { 
    categories, 
    selectedCategory, 
    selectCategory, 
    loading,
    error,
    clearError,
    retryLastOperation 
  } = useCategory();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(
    new Set(['personal', 'team', 'public'])
  );

  // 切换分组展开状态
  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  // 根据搜索词过滤分类
  const filterCategories = (categoryList: typeof categories) => {
    if (!searchTerm.trim()) {
      return categoryList;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    return categoryList.filter(category =>
      category.name.toLowerCase().includes(lowerSearchTerm) ||
      category.description?.toLowerCase().includes(lowerSearchTerm)
    );
  };

  // 分组图标和标题映射
  const groupConfig = {
    personal: { icon: '👤', title: '个人分类', scope: CategoryScope.PERSONAL },
    team: { icon: '👥', title: '团队分类', scope: CategoryScope.TEAM },
    public: { icon: '🌍', title: '公开分类', scope: CategoryScope.PUBLIC },
  };

  // 侧边栏样式
  const sidebarStyle = {
    width: isMobile 
      ? (collapsed ? '0px' : '100vw') 
      : (collapsed ? '60px' : (isTablet ? '240px' : '280px')),
    transform: isMobile && collapsed ? 'translateX(-100%)' : 'translateX(0)',
  };

  return (
    <>
      <aside 
        className={`
          category-sidebar
          fixed top-0 left-0 h-full
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          z-50
          ${isMobile ? 'shadow-xl' : 'shadow-sm'}
          flex flex-col
        `}
        style={sidebarStyle}
      >
        {/* 顶部区域 */}
        <div className="sidebar-header border-b border-gray-200 p-4">
          {!collapsed && (
            <>
              {/* Logo和标题 */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  分类管理
                </h2>
                {!isMobile && (
                  <button
                    onClick={onToggle}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    title="折叠侧边栏"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* 搜索框 */}
              <SearchInput
                value={searchTerm}
                onSearch={setSearchTerm}
                onClear={() => setSearchTerm('')}
                placeholder="搜索分类..."
                debounceMs={300}
              />
            </>
          )}

          {/* 折叠状态的简化视图 */}
          {collapsed && !isMobile && (
            <button
              onClick={onToggle}
              className="w-full p-2 rounded hover:bg-gray-100 transition-colors"
              title="展开侧边栏"
            >
              <svg className="w-5 h-5 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* 分类列表区域 */}
        <div className="sidebar-content flex-1 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">加载中...</p>
            </div>
          )}

          {error && (
            <div className="p-4 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-red-700 text-sm">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-red-400 hover:text-red-600 p-1"
                    title="关闭错误提示"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={retryLastOperation}
                  className="mt-2 text-red-600 text-xs underline hover:text-red-800"
                >
                  重试
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* 全部分类选项 */}
              <div className="p-2">
                <button
                  onClick={() => selectCategory(null)}
                  className={`
                    w-full px-3 py-2 text-left rounded-lg transition-colors
                    ${selectedCategory === null 
                      ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">📚</span>
                    {!collapsed && (
                      <>
                        <span className="font-medium">全部分类</span>
                        <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {categories.length}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* 分类分组 */}
              {Object.entries(groupConfig).map(([key, config]) => {
                const scopeCategories = categories.filter(cat => cat.scopeType === config.scope);
                const filteredCategories = filterCategories(scopeCategories);
                const isExpanded = expandedGroups.has(key);
                
                return (
                  <CategoryGroup
                    key={key}
                    groupKey={key}
                    groupTitle={config.title}
                    groupIcon={config.icon}
                    categories={filteredCategories}
                    isExpanded={isExpanded}
                    selectedCategory={selectedCategory}
                    collapsed={collapsed}
                    onToggleExpand={toggleGroup}
                    onSelectCategory={selectCategory}
                  />
                );
              })}
            </>
          )}
        </div>

        {/* 底部操作区域 */}
        {!isMobile && (
          <div className="sidebar-footer border-t border-gray-200 p-4">
            <CreateCategoryButton 
              collapsed={collapsed}
              className="w-full"
            />
          </div>
        )}
      </aside>

      {/* 样式优化 */}
      <style>{`
        .category-sidebar {
          backdrop-filter: blur(10px);
        }

        .sidebar-content::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-content::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 2px;
        }

        .sidebar-content::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }

        /* 分类展开动画 */
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.2s ease-out forwards;
        }

        /* 悬停状态增强 */
        .category-item-hover {
          transform: translateX(2px);
          transition: transform 0.15s ease-out;
        }

        /* 选中状态增强 */
        .category-item-selected {
          box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </>
  );
};

export default CategorySidebar;