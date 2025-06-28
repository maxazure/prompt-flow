/**
 * 移动端响应式增强组件
 * 提供额外的移动端优化样式和功能
 */

import { Breakpoints } from '../types';

interface ResponsiveEnhancementsProps {
  isMobile: boolean;
  isTablet: boolean;
}

const ResponsiveEnhancements: React.FC<ResponsiveEnhancementsProps> = ({ 
  isMobile, 
  isTablet 
}) => {
  return (
    <style>{`
      /* 移动端响应式增强样式 */
      .responsive-container {
        padding: ${isMobile ? '1rem' : isTablet ? '1.25rem' : '2rem'};
      }
      
      /* 触摸优化 */
      @media (hover: none) {
        .touch-optimized {
          min-height: 44px;
          min-width: 44px;
        }
        
        button, .btn {
          padding: 12px 16px;
          border-radius: 8px;
        }
      }
      
      /* 移动端字体缩放 */
      @media (max-width: ${Breakpoints.MOBILE}px) {
        .responsive-text {
          font-size: 14px;
          line-height: 1.5;
        }
        
        .responsive-heading {
          font-size: 18px;
          margin-bottom: 12px;
        }
        
        .responsive-card {
          padding: 16px;
          margin-bottom: 12px;
          border-radius: 8px;
        }
        
        .responsive-grid {
          grid-template-columns: 1fr;
          gap: 12px;
        }
      }
      
      /* 平板端优化 */
      @media (min-width: ${Breakpoints.MOBILE}px) and (max-width: ${Breakpoints.TABLET}px) {
        .responsive-text {
          font-size: 15px;
          line-height: 1.6;
        }
        
        .responsive-heading {
          font-size: 20px;
          margin-bottom: 16px;
        }
        
        .responsive-card {
          padding: 20px;
          margin-bottom: 16px;
          border-radius: 10px;
        }
        
        .responsive-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
      }
      
      /* 桌面端优化 */
      @media (min-width: ${Breakpoints.DESKTOP}px) {
        .responsive-text {
          font-size: 16px;
          line-height: 1.6;
        }
        
        .responsive-heading {
          font-size: 24px;
          margin-bottom: 20px;
        }
        
        .responsive-card {
          padding: 24px;
          margin-bottom: 20px;
          border-radius: 12px;
        }
        
        .responsive-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
      }
      
      /* 性能优化 */
      .responsive-animated {
        will-change: transform, opacity;
        transform: translateZ(0);
        backface-visibility: hidden;
      }
      
      /* 可访问性增强 */
      @media (prefers-reduced-motion: reduce) {
        .responsive-animated {
          animation: none;
          transition: none;
        }
      }
      
      /* 高DPI屏幕优化 */
      @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
        .responsive-icon {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
      }
      
      /* 暗色模式支持 */
      @media (prefers-color-scheme: dark) {
        .responsive-card {
          background-color: #1f2937;
          border-color: #374151;
          color: #f9fafb;
        }
      }
      
      /* 横屏模式优化 */
      @media (max-height: 500px) and (orientation: landscape) {
        .responsive-mobile-header {
          height: 48px;
          padding: 8px 16px;
        }
        
        .responsive-container {
          padding-top: 8px;
          padding-bottom: 8px;
        }
      }
      
      /* Focus管理 */
      .responsive-focus-trap {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* 滚动优化 */
      .responsive-scroll {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
      
      /* 防止缩放 */
      .responsive-no-zoom {
        touch-action: manipulation;
      }
      
      /* 列表优化 */
      .responsive-list-item {
        padding: ${isMobile ? '12px 16px' : '16px 20px'};
        border-bottom: 1px solid #e5e7eb;
        transition: background-color 0.2s ease;
      }
      
      .responsive-list-item:hover {
        background-color: ${isMobile ? 'transparent' : '#f9fafb'};
      }
      
      .responsive-list-item:active {
        background-color: #f3f4f6;
      }
      
      /* 表单优化 */
      .responsive-input {
        font-size: ${isMobile ? '16px' : '14px'}; /* 防止iOS缩放 */
        padding: ${isMobile ? '12px 16px' : '10px 14px'};
        border-radius: ${isMobile ? '8px' : '6px'};
      }
      
      /* 按钮优化 */
      .responsive-button {
        min-height: ${isMobile ? '44px' : '36px'};
        padding: ${isMobile ? '12px 20px' : '8px 16px'};
        font-size: ${isMobile ? '16px' : '14px'};
        border-radius: ${isMobile ? '8px' : '6px'};
      }
      
      /* 模态框优化 */
      @media (max-width: ${Breakpoints.MOBILE}px) {
        .responsive-modal {
          width: 100vw;
          height: 100vh;
          border-radius: 0;
          margin: 0;
        }
      }
      
      /* 侧边栏优化 */
      .responsive-sidebar {
        width: ${isMobile ? '100vw' : isTablet ? '300px' : '280px'};
        transform: ${isMobile ? 'translateX(-100%)' : 'translateX(0)'};
        transition: transform 0.3s ease-in-out;
      }
      
      .responsive-sidebar.open {
        transform: translateX(0);
      }
      
      /* 网格自适应 */
      .responsive-auto-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(${isMobile ? '250px' : '300px'}, 1fr));
        gap: ${isMobile ? '16px' : '20px'};
      }
      
      /* 分隔线优化 */
      .responsive-divider {
        margin: ${isMobile ? '16px 0' : '24px 0'};
        border-color: #e5e7eb;
      }
      
      /* 间距工具类 */
      .responsive-spacing-xs { margin: ${isMobile ? '8px' : '12px'}; }
      .responsive-spacing-sm { margin: ${isMobile ? '12px' : '16px'}; }
      .responsive-spacing-md { margin: ${isMobile ? '16px' : '24px'}; }
      .responsive-spacing-lg { margin: ${isMobile ? '24px' : '32px'}; }
      .responsive-spacing-xl { margin: ${isMobile ? '32px' : '48px'}; }
    `}</style>
  );
};

export default ResponsiveEnhancements;