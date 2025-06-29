import React, { useState, useRef, useEffect } from 'react';
import { useCategory } from '../context/CategoryContext';
import ColorPicker from './ColorPicker';
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
  const { updateCategory, deleteCategory } = useCategory();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editDescription, setEditDescription] = useState(category.description || '');
  const [editColor, setEditColor] = useState(category.color);
  const menuRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!isEditing) {
      onSelect(category.id.toString());
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 始终显示右键菜单，包含权限信息
    setShowMenu(true);
  };

  // 检查是否是未分类分类
  const isUncategorized = () => {
    return category.name === '未分类' && category.scopeType === 'personal';
  };

  // 获取权限信息
  const getPermissionInfo = () => {
    const scopeIcons = {
      personal: '👤',
      team: '👥', 
      public: '🌍'
    };

    const scopeNames = {
      personal: '个人',
      team: '团队',
      public: '公开'
    };

    return {
      icon: scopeIcons[category.scopeType] || '❓',
      name: scopeNames[category.scopeType] || '未知',
      canEdit: category.canEdit,
      isOwner: category.creator?.id ? true : false
    };
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
    setTimeout(() => editRef.current?.focus(), 0);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await updateCategory(category.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        color: editColor,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditName(category.name);
    setEditDescription(category.description || '');
    setEditColor(category.color);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    // 防止删除未分类分类
    if (category.name === '未分类' && category.scopeType === 'personal') {
      alert('不能删除默认的未分类分类');
      setShowMenu(false);
      return;
    }

    if (window.confirm(`确定要删除分类 "${category.name}" 吗？`)) {
      try {
        await deleteCategory(category.id);
      } catch (error) {
        console.error('Failed to delete category:', error);
        if (error instanceof Error && error.message.includes('Cannot delete the default uncategorized category')) {
          alert('不能删除默认的未分类分类');
        }
      }
    }
    setShowMenu(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

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
      <div className="relative">
        <button
          onClick={handleClick}
          onContextMenu={handleRightClick}
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
        
        {/* Context Menu */}
        {showMenu && category.canEdit && (
          <div 
            ref={menuRef}
            className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px]"
          >
            <button
              onClick={handleEdit}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              编辑
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              删除
            </button>
          </div>
        )}
      </div>
    );
  }

  // 完整模式：显示所有信息
  return (
    <div className="relative">
      {isEditing ? (
        // 编辑模式
        <form onSubmit={handleSaveEdit} className="p-3 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            {/* 分类名称 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                分类名称
              </label>
              <input
                ref={editRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入分类名称"
                required
              />
            </div>

            {/* 分类描述 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                描述 (可选)
              </label>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入分类描述"
              />
            </div>

            {/* 颜色选择 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                颜色标识
              </label>
              <div className="flex items-center gap-2">
                <ColorPicker 
                  value={editColor}
                  onChange={setEditColor}
                />
                <span className="text-xs text-gray-500">
                  点击选择分类颜色
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                保存
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                取消
              </button>
            </div>
          </div>
        </form>
      ) : (
        // 显示模式
        <button
          onClick={handleClick}
          onContextMenu={handleRightClick}
          className={`${getItemClassName()} group`}
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
            
            {/* 分类名称和权限信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="truncate text-sm font-medium">
                  {category.name}
                </span>
                {isUncategorized() && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded" title="默认分类">
                    默认
                  </span>
                )}
                <span className="text-xs flex-shrink-0" title={`${getPermissionInfo().name}分类`}>
                  {getPermissionInfo().icon}
                </span>
              </div>
              {category.description && (
                <div className="text-xs text-gray-500 truncate mt-0.5">
                  {category.description}
                </div>
              )}
            </div>
            
            {/* 提示词数量 */}
            <span 
              className={getBadgeClassName()}
              aria-label={`${category.promptCount || 0}个提示词`}
            >
              {category.promptCount || 0}
            </span>
            
            {/* 权限状态图标 */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {!category.canEdit && (
                <div title="只读权限">
                  <svg 
                    className="w-3 h-3 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                    />
                  </svg>
                </div>
              )}
              
              {category.canEdit && (
                <div title="可编辑">
                  <svg 
                    className="w-3 h-3 text-green-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                    />
                  </svg>
                </div>
              )}
            </div>
            
            {/* 编辑指示器 */}
            {category.canEdit && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </div>
            )}
          </div>
        </button>
      )}
      
      {/* Context Menu */}
      {showMenu && !isEditing && (
        <div 
          ref={menuRef}
          className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
        >
          {/* 分类信息 */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>{getPermissionInfo().icon}</span>
              <span>{getPermissionInfo().name}分类</span>
              {category.creator?.username && (
                <span className="text-gray-400">
                  by {category.creator.username}
                </span>
              )}
            </div>
          </div>

          {/* 编辑操作 - 仅可编辑时显示 */}
          {category.canEdit && (
            <>
              <button
                onClick={handleEdit}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                编辑分类
              </button>
              {!isUncategorized() && (
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  删除分类
                </button>
              )}
              {isUncategorized() && (
                <div className="px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  默认分类，无法删除
                </div>
              )}
            </>
          )}

          {/* 只读提示 */}
          {!category.canEdit && (
            <div className="px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              只读权限，无法编辑
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryItem;