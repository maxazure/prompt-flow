import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCategory } from '../context/CategoryContext';

// =====================================================
// TopNavigation Component - 固定顶部导航栏
// =====================================================

interface TopNavigationProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * TopNavigation - 右侧内容区域的固定顶部导航栏
 * 
 * 功能特性:
 * - 🔗 网站主要栏目导航
 * - 🍞 面包屑导航显示
 * - 👤 用户信息和登出功能
 * - 📱 响应式设计
 * - 🎯 当前页面高亮显示
 */
const TopNavigation: React.FC<TopNavigationProps> = ({ className = '', style }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { categories } = useCategory();
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId } = useParams<{ categoryId?: string }>();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const navigationItems = [
    { name: '首页', path: '/', icon: '🏠' },
    ...(isAuthenticated ? [
      { name: '仪表盘', path: '/dashboard', icon: '📊' },
      { name: '我的提示词', path: '/my-prompts', icon: '📝' },
      { name: '新建提示词', path: '/create', icon: '➕' },
      { name: '项目管理', path: '/projects', icon: '📁' },
      { name: '团队', path: '/teams', icon: '👥' },
      { name: '分析', path: '/insights', icon: '📈' },
    ] : []),
  ];

  // 生成面包屑导航
  const getBreadcrumbs = () => {
    const breadcrumbs = [];
    
    // 根据当前路径生成面包屑
    if (location.pathname === '/') {
      if (categoryId) {
        // 如果在首页但有分类参数
        const category = categories.find(cat => cat.id.toString() === categoryId);
        breadcrumbs.push({ name: '首页', path: '/' });
        if (category) {
          breadcrumbs.push({ name: category.name, path: `/category/${categoryId}` });
        }
      }
    } else if (location.pathname.startsWith('/category/')) {
      const category = categories.find(cat => cat.id.toString() === categoryId);
      breadcrumbs.push({ name: '首页', path: '/' });
      if (category) {
        breadcrumbs.push({ name: category.name, path: `/category/${categoryId}` });
      }
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav 
      className={`
        fixed top-0 right-0 z-50
        bg-white border-b border-gray-200 shadow-sm
        transition-all duration-300 ease-in-out
        ${className}
      `}
      style={style}
    >
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* 左侧：主导航菜单 + 面包屑 */}
          <div className="flex items-center space-x-4">
            {/* 主导航菜单 */}
            <div className="flex items-center space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="px-3 py-2 text-sm font-medium rounded-lg transition-colors
                           hover:bg-gray-100 hover:text-blue-600
                           text-gray-700"
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
            
            {/* 面包屑导航 */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 border-l border-gray-200 pl-4">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.path}>
                    {index > 0 && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                    <Link
                      to={crumb.path}
                      className={`hover:text-blue-600 transition-colors ${
                        index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}
                    >
                      {crumb.name}
                    </Link>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：用户信息 */}
          <div className="flex items-center space-x-3">
            
            {isAuthenticated ? (
              /* 已登录状态 */
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg
                           hover:bg-gray-100 transition-colors text-sm"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-gray-700 font-medium">{user?.username}</span>
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 用户下拉菜单 */}
                {userMenuOpen && (
                  <>
                    {/* 遮罩层 */}
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    
                    {/* 下拉菜单 */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg 
                                  border border-gray-200 py-1 z-20">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="mr-2">📊</span>
                        我的仪表板
                      </Link>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <span className="mr-2">🚪</span>
                        退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* 未登录状态 */
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 
                           hover:text-blue-600 transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white 
                           rounded-lg hover:bg-blue-700 transition-colors"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;