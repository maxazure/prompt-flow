import React, { useState } from 'react';
import { useCategory } from '../context/CategoryContext';
import { useSearch } from '../context/SearchContext';
import { CategoryScope } from '../types';
import CategoryGroup from './CategoryGroup';
import SearchInput from './SearchInput';
import CreateCategoryButton from './CreateCategoryButton';
import { useNavigate } from 'react-router-dom';

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
  
  const { searchTerm, setSearchTerm, clearSearch } = useSearch();
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState(
    new Set(['personal', 'team', 'public'])
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

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
                <h1 className="text-xl font-bold text-gray-900">
                  PromptFlow
                </h1>
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

              {/* 提示词搜索框 */}
              <SearchInput
                value={searchTerm}
                onSearch={setSearchTerm}
                onClear={() => clearSearch()}
                placeholder="搜索提示词..."
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
              {/* 悬浮新增分类按钮 */}
              {!collapsed && (
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-3">
                  <button
                    className="w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-md
                               hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    title="新增分类"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    新增分类
                  </button>
                  
                  {/* 内联创建分类表单 */}
                  {showCreateForm && (
                    <div className="mt-3">
                      <CreateCategoryButton 
                        collapsed={false}
                        className="w-full"
                        onComplete={() => setShowCreateForm(false)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 分类分组 */}
              {Object.entries(groupConfig).map(([key, config]) => {
                const scopeCategories = categories.filter(cat => cat.scopeType === config.scope);
                const isExpanded = expandedGroups.has(key);
                
                return (
                  <CategoryGroup
                    key={key}
                    groupKey={key}
                    groupTitle={config.title}
                    groupIcon={config.icon}
                    categories={scopeCategories}
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

        {/* 底部操作区域 - 设置按钮 */}
        {!isMobile && (
          <div className="sidebar-footer border-t border-gray-200 p-4 space-y-2">
            {collapsed ? (
              <>
                {/* 项目管理按钮 - 折叠状态 */}
                <button
                  className="w-full p-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => navigate('/projects')}
                  title="项目管理"
                >
                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M8 1v6m8-6v6" />
                  </svg>
                </button>
                {/* 设置按钮 - 折叠状态 */}
                <button
                  className="w-full p-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors
                             focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={() => navigate('/settings')}
                  title="设置"
                >
                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                </button>
              </>
            ) : (
              <>
                {/* 项目管理按钮 - 展开状态 */}
                <button
                  className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-lg 
                             hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => navigate('/projects')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M8 1v6m8-6v6" />
                  </svg>
                  项目管理
                </button>
                {/* 设置按钮 - 展开状态 */}
                <button
                  className="w-full px-3 py-2 bg-gray-50 text-gray-700 rounded-lg 
                             hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={() => navigate('/settings')}
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                设置
              </button>
              </>
            )}
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