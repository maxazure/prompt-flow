import React, { useState } from 'react';
import { useCategory } from '../context/CategoryContext';
import { CategoryScope } from '../types';

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
    error 
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

  // 筛选分类组 (暂未使用，后续会用于搜索功能)
  // const filteredGroups = categoryGroups.filter(group => 
  //   searchTerm === '' || 
  //   group.name.toLowerCase().includes(searchTerm.toLowerCase())
  // );

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
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索分类..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           text-sm placeholder-gray-500"
                />
                <svg 
                  className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
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
            <div className="p-4 text-center text-red-500 text-sm">
              {error}
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
                const groupCategories = categories.filter(cat => cat.scopeType === config.scope);
                const isExpanded = expandedGroups.has(key);
                
                if (groupCategories.length === 0 && !collapsed) return null;

                return (
                  <div key={key} className="mb-1">
                    {/* 分组标题 */}
                    <button
                      onClick={() => toggleGroup(key)}
                      className="w-full px-4 py-2 flex items-center justify-between 
                               text-sm font-medium text-gray-700 hover:bg-gray-50
                               transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{config.icon}</span>
                        {!collapsed && <span>{config.title}</span>}
                      </div>
                      {!collapsed && groupCategories.length > 0 && (
                        <svg 
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>

                    {/* 分类列表 */}
                    {!collapsed && isExpanded && (
                      <div className="space-y-1 px-2 pb-2">
                        {groupCategories.map(category => (
                          <button
                            key={category.id}
                            onClick={() => selectCategory(category.id.toString())}
                            className={`
                              w-full px-3 py-2 text-left rounded-lg transition-colors
                              ${selectedCategory === category.id.toString()
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                                : 'text-gray-700 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              {/* 颜色标识 */}
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: category.color }}
                              />
                              
                              {/* 分类名称 */}
                              <span className="flex-1 truncate text-sm">
                                {category.name}
                              </span>
                              
                              {/* 提示词数量 */}
                              <span className={`
                                px-2 py-0.5 text-xs rounded-full
                                ${selectedCategory === category.id.toString()
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                                }
                              `}>
                                {category.promptCount || 0}
                              </span>
                              
                              {/* 权限状态 */}
                              {!category.canEdit && (
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* 底部操作区域 */}
        {!collapsed && (
          <div className="sidebar-footer border-t border-gray-200 p-4">
            <button className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-lg 
                             hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              创建新分类
            </button>
          </div>
        )}

        {/* 折叠状态下的操作按钮 */}
        {collapsed && !isMobile && (
          <div className="sidebar-footer border-t border-gray-200 p-2">
            <button 
              className="w-full p-2 text-blue-600 rounded hover:bg-blue-50 transition-colors"
              title="创建新分类"
            >
              <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
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
      `}</style>
    </>
  );
};

export default CategorySidebar;