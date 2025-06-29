import React, { useEffect, useState } from 'react';
import { useCategory } from '../context/CategoryContext';
import CategorySidebar from './CategorySidebar';
import TopNavigation from './TopNavigation';
import ResponsiveEnhancements from './ResponsiveEnhancements';
import { Breakpoints } from '../types';

// =====================================================
// MainLayout Component - Phase 4 Core Layout
// =====================================================

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// 主布局组件 - 左侧分类右侧内容的双栏设计
const MainLayout: React.FC<MainLayoutProps> = ({ children, className = '' }) => {
  const { sidebarCollapsed, toggleSidebar } = useCategory();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // 检测屏幕尺寸变化
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < Breakpoints.MOBILE);
      setIsTablet(width >= Breakpoints.MOBILE && width < Breakpoints.TABLET);
    };

    // 初始检查
    checkScreenSize();

    // 监听窗口大小变化
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 移动端自动折叠侧边栏
  useEffect(() => {
    if (isMobile && !sidebarCollapsed) {
      // 在移动端默认折叠侧边栏，但不调用toggleSidebar避免保存状态
    }
  }, [isMobile, sidebarCollapsed]);

  // 计算侧边栏宽度
  const getSidebarWidth = () => {
    if (isMobile) {
      return sidebarCollapsed ? '0px' : '100vw'; // 移动端全屏或隐藏
    }
    return sidebarCollapsed ? '60px' : '280px'; // 桌面端固定宽度
  };

  // 计算主内容区域样式
  const getMainContentStyle = () => {
    const sidebarWidth = getSidebarWidth();
    
    if (isMobile) {
      return {
        width: '100vw',
        marginLeft: '0px',
      };
    }
    
    return {
      width: `calc(100vw - ${sidebarWidth})`,
      marginLeft: sidebarWidth,
    };
  };

  return (
    <div className="main-layout h-screen bg-gray-50 overflow-hidden">
      {/* 侧边栏 */}
      <CategorySidebar 
        collapsed={sidebarCollapsed}
        isMobile={isMobile}
        isTablet={isTablet}
        onToggle={toggleSidebar}
      />

      {/* 顶部导航栏 - 仅在非移动端显示 */}
      {!isMobile && (
        <TopNavigation 
          className="left-0"
          style={{
            left: getSidebarWidth(),
            width: `calc(100vw - ${getSidebarWidth()})`,
          }}
        />
      )}

      {/* 移动端遮罩层 */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* 主内容区域 */}
      <main 
        className={`
          main-content
          transition-all duration-300 ease-in-out
          ${isMobile ? 'relative' : 'fixed right-0'}
          h-full
          overflow-hidden
          ${className}
        `}
        style={{
          ...getMainContentStyle(),
          top: isMobile ? '0' : '64px', // 为顶部导航栏留出空间
          height: isMobile ? '100%' : 'calc(100vh - 64px)',
        }}
      >
        {/* 内容容器 */}
        <div className="content-container h-full overflow-y-auto">
          {/* 移动端顶部工具栏 */}
          {isMobile && (
            <div className="mobile-header bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                <svg 
                  className="w-5 h-5 text-gray-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                </svg>
              </button>
              
              <h1 className="text-lg font-semibold text-gray-900">
                PromptFlow
              </h1>
              
              <div className="w-9"></div> {/* 平衡布局 */}
            </div>
          )}

          {/* 主要内容 */}
          <div className="main-content-inner responsive-container">
            {children}
          </div>
        </div>
      </main>

      {/* 响应式增强组件 */}
      <ResponsiveEnhancements isMobile={isMobile} isTablet={isTablet} />
      
      {/* 全局样式注入 */}
      <style>{`
        .main-layout {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .main-content {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .content-container {
          background: transparent;
        }

        .main-content-inner {
          min-height: calc(100vh - ${isMobile ? '64px' : '0px'});
          /* 响应式padding通过媒体查询控制，避免内联样式覆盖 */
        }

        /* 自定义滚动条样式 */
        .content-container::-webkit-scrollbar {
          width: 6px;
        }

        .content-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .content-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .content-container::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.8);
        }

        /* 响应式断点处理 - 减少padding以最大化内容区域 */
        @media (max-width: ${Breakpoints.MOBILE}px) {
          .main-content-inner {
            padding: 0.75rem;
          }
        }

        @media (min-width: ${Breakpoints.MOBILE}px) and (max-width: ${Breakpoints.TABLET}px) {
          .main-content-inner {
            padding: 1rem;
          }
        }

        @media (min-width: ${Breakpoints.DESKTOP}px) {
          .main-content-inner {
            padding: 1.25rem;
          }
        }

        /* 优化动画性能 */
        .main-content {
          will-change: width, margin-left;
        }
        
        .main-content-inner {
          will-change: transform;
        }

        /* 确保内容不被侧边栏遮挡 */
        .main-content-inner {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

export default MainLayout;