/**
 * 移动端响应式设计测试
 * 测试所有组件在不同屏幕尺寸下的响应式行为
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import MainLayout from '../../components/MainLayout';
import CategorySidebar from '../../components/CategorySidebar';
import ProjectPromptList from '../../components/ProjectPromptList';
import { CategoryProvider } from '../../context/CategoryContext';
import { ProjectProvider } from '../../context/ProjectContext';
import { SearchProvider } from '../../context/SearchContext';
import { AuthProvider } from '../../context/AuthContext';
import type { Project, Prompt } from '../../types';

// Mock window.innerWidth and window.outerHeight
const mockWindowSize = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // 触发resize事件
  window.dispatchEvent(new Event('resize'));
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <SearchProvider>
        <CategoryProvider>
          <ProjectProvider>
            {children}
          </ProjectProvider>
        </CategoryProvider>
      </SearchProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('移动端响应式设计', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    // 保存原始窗口尺寸
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    
    // 清除所有mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 恢复原始窗口尺寸
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  describe('断点检测', () => {
    it('应该正确检测移动端尺寸', () => {
      mockWindowSize(400);
      
      render(
        <TestWrapper>
          <MainLayout>
            <div>测试内容</div>
          </MainLayout>
        </TestWrapper>
      );
      
      // 移动端应该显示汉堡菜单
      expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
    });

    it('应该正确检测平板尺寸', () => {
      mockWindowSize(800);
      
      render(
        <TestWrapper>
          <MainLayout>
            <div>测试内容</div>
          </MainLayout>
        </TestWrapper>
      );
      
      // 平板尺寸应该有不同的布局
      const mainContent = document.querySelector('.main-content');
      expect(mainContent).toBeInTheDocument();
    });

    it('应该正确检测桌面端尺寸', () => {
      mockWindowSize(1200);
      
      render(
        <TestWrapper>
          <MainLayout>
            <div>测试内容</div>
          </MainLayout>
        </TestWrapper>
      );
      
      // 桌面端不应该显示汉堡菜单
      expect(screen.queryByLabelText('Toggle menu')).not.toBeInTheDocument();
    });
  });

  describe('MainLayout 响应式', () => {
    it('移动端应该显示移动端头部', () => {
      mockWindowSize(400);
      
      render(
        <TestWrapper>
          <MainLayout>
            <div>测试内容</div>
          </MainLayout>
        </TestWrapper>
      );
      
      expect(screen.getByText('PromptFlow')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
    });

    it('移动端侧边栏应该覆盖全屏', async () => {
      mockWindowSize(400);
      
      render(
        <TestWrapper>
          <MainLayout>
            <div>测试内容</div>
          </MainLayout>
        </TestWrapper>
      );
      
      // 点击汉堡菜单
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton);
      
      // 应该显示遮罩层
      await waitFor(() => {
        const overlay = document.querySelector('.bg-black.bg-opacity-50');
        expect(overlay).toBeInTheDocument();
      });
    });

    it('桌面端不应该显示移动端头部', () => {
      mockWindowSize(1200);
      
      render(
        <TestWrapper>
          <MainLayout>
            <div>测试内容</div>
          </MainLayout>
        </TestWrapper>
      );
      
      expect(screen.queryByLabelText('Toggle menu')).not.toBeInTheDocument();
    });

    it('窗口大小变化时应该更新布局', async () => {
      render(
        <TestWrapper>
          <MainLayout>
            <div>测试内容</div>
          </MainLayout>
        </TestWrapper>
      );
      
      // 初始桌面尺寸
      mockWindowSize(1200);
      await waitFor(() => {
        expect(screen.queryByLabelText('Toggle menu')).not.toBeInTheDocument();
      });
      
      // 切换到移动端尺寸
      mockWindowSize(400);
      await waitFor(() => {
        expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
      });
    });
  });

  describe('CategorySidebar 响应式', () => {
    it('移动端侧边栏应该可以切换显示/隐藏', async () => {
      mockWindowSize(400);
      
      render(
        <TestWrapper>
          <CategorySidebar 
            collapsed={false}
            isMobile={true}
            isTablet={false}
            onToggle={vi.fn()}
          />
        </TestWrapper>
      );
      
      // 移动端侧边栏应该存在
      const sidebar = document.querySelector('.category-sidebar');
      expect(sidebar).toBeInTheDocument();
    });

    it('桌面端侧边栏应该固定显示', () => {
      mockWindowSize(1200);
      
      render(
        <TestWrapper>
          <CategorySidebar 
            collapsed={false}
            isMobile={false}
            isTablet={false}
            onToggle={vi.fn()}
          />
        </TestWrapper>
      );
      
      const sidebar = document.querySelector('.category-sidebar');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('ProjectPromptList 响应式', () => {
    const mockProject: Project = {
      id: 1,
      name: '测试项目',
      description: '测试项目描述',
      background: '测试背景',
      userId: 1,
      isPublic: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      promptCount: 3
    };

    const mockPrompts: Prompt[] = [
      {
        id: 1,
        title: '测试提示词1',
        content: '测试内容1',
        description: '测试描述1',
        version: 1,
        userId: 1,
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        title: '测试提示词2',
        content: '测试内容2',
        description: '测试描述2',
        version: 1,
        userId: 1,
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        title: '测试提示词3',
        content: '测试内容3',
        description: '测试描述3',
        version: 1,
        userId: 1,
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    it('移动端应该显示单列布局', () => {
      mockWindowSize(400);
      
      render(
        <TestWrapper>
          <ProjectPromptList
            prompts={mockPrompts}
            project={mockProject}
            onCopy={vi.fn()}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            onUse={vi.fn()}
            onCreateNew={vi.fn()}
          />
        </TestWrapper>
      );
      
      const container = screen.getByTestId('prompts-container');
      expect(container).toHaveClass('grid-cols-1');
    });

    it('桌面端应该显示多列布局', () => {
      mockWindowSize(1200);
      
      render(
        <TestWrapper>
          <ProjectPromptList
            prompts={mockPrompts}
            project={mockProject}
            onCopy={vi.fn()}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            onUse={vi.fn()}
            onCreateNew={vi.fn()}
          />
        </TestWrapper>
      );
      
      const container = screen.getByTestId('prompts-container');
      expect(container).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('移动端搜索和筛选应该堆叠显示', () => {
      mockWindowSize(400);
      
      render(
        <TestWrapper>
          <ProjectPromptList
            prompts={mockPrompts}
            project={mockProject}
            onCopy={vi.fn()}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            onUse={vi.fn()}
            onCreateNew={vi.fn()}
          />
        </TestWrapper>
      );
      
      const searchContainer = document.querySelector('.flex.flex-col.lg\\:flex-row');
      expect(searchContainer).toBeInTheDocument();
    });
  });

  describe('触摸交互优化', () => {
    it('移动端按钮应该有合适的触摸目标大小', () => {
      mockWindowSize(400);
      
      render(
        <TestWrapper>
          <MainLayout>
            <div>测试内容</div>
          </MainLayout>
        </TestWrapper>
      );
      
      const menuButton = screen.getByLabelText('Toggle menu');
      
      // 按钮应该有足够的padding来满足44px最小触摸目标
      expect(menuButton).toHaveClass('p-2');
    });

    it('卡片在移动端应该有适当的间距', () => {
      mockWindowSize(400);
      
      const mockPrompts: Prompt[] = [{
        id: 1,
        title: '测试提示词',
        content: '测试内容',
        description: '测试描述',
        version: 1,
        userId: 1,
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];
      
      render(
        <TestWrapper>
          <ProjectPromptList
            prompts={mockPrompts}
            onCopy={vi.fn()}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            onUse={vi.fn()}
            onCreateNew={vi.fn()}
          />
        </TestWrapper>
      );
      
      const container = screen.getByTestId('prompts-container');
      expect(container).toHaveClass('gap-6');
    });
  });

  describe('字体和间距缩放', () => {
    it('移动端应该有适当的内边距', () => {
      mockWindowSize(400);
      
      render(
        <TestWrapper>
          <MainLayout>
            <div>测试内容</div>
          </MainLayout>
        </TestWrapper>
      );
      
      // 检查移动端内容容器的padding
      const styles = document.querySelectorAll('style');
      const responsiveStyle = Array.from(styles).find(style => 
        style.textContent?.includes('responsive-container')
      );
      expect(responsiveStyle?.textContent).toContain('padding: 1rem');
    });

    it('桌面端应该有更大的内边距', () => {
      mockWindowSize(1200);
      
      render(
        <TestWrapper>
          <MainLayout>
            <div>测试内容</div>
          </MainLayout>
        </TestWrapper>
      );
      
      // 检查桌面端内容容器的padding
      const styles = document.querySelectorAll('style');
      const responsiveStyle = Array.from(styles).find(style => 
        style.textContent?.includes('responsive-container')
      );
      expect(responsiveStyle?.textContent).toContain('padding: 2rem');
    });
  });

  describe('滚动和导航优化', () => {
    it('移动端应该有自定义滚动条样式', () => {
      mockWindowSize(400);
      
      render(
        <TestWrapper>
          <MainLayout>
            <div>测试内容</div>
          </MainLayout>
        </TestWrapper>
      );
      
      const style = document.querySelector('style');
      expect(style?.textContent).toContain('webkit-scrollbar');
    });

    it('移动端内容应该可以垂直滚动', () => {
      mockWindowSize(400);
      
      render(
        <TestWrapper>
          <MainLayout>
            <div style={{ height: '2000px' }}>长内容</div>
          </MainLayout>
        </TestWrapper>
      );
      
      const contentContainer = document.querySelector('.content-container');
      expect(contentContainer).toHaveClass('overflow-y-auto');
    });
  });

  describe('性能优化', () => {
    it('应该使用CSS transform优化动画性能', () => {
      render(
        <TestWrapper>
          <MainLayout>
            <div>测试内容</div>
          </MainLayout>
        </TestWrapper>
      );
      
      const styles = document.querySelectorAll('style');
      const hasWillChange = Array.from(styles).some(style => 
        style.textContent?.includes('will-change')
      );
      expect(hasWillChange).toBe(true);
    });

    it('过渡动画应该使用硬件加速', () => {
      render(
        <TestWrapper>
          <MainLayout>
            <div>测试内容</div>
          </MainLayout>
        </TestWrapper>
      );
      
      const mainContent = document.querySelector('.main-content');
      expect(mainContent).toHaveClass('transition-all', 'duration-300', 'ease-in-out');
    });
  });
});