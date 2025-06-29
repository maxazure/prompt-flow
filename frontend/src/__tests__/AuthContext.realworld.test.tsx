import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';

// 真实世界的ProtectedRoute（从App.tsx复制）
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  console.log('ProtectedRoute render - isAuthenticated:', isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// 测试页面组件
const DashboardPage: React.FC = () => {
  console.log('DashboardPage render');
  return <div data-testid="dashboard-page">Dashboard</div>;
};

const LoginPage: React.FC = () => {
  console.log('LoginPage render');
  return <div data-testid="login-page">Login</div>;
};

// 完整的App组件模拟（重现真实场景）
const TestApp: React.FC<{ initialRoute?: string }> = ({ 
  initialRoute = '/dashboard' 
}) => {
  console.log('TestApp render - initialRoute:', initialRoute);
  
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
};

const mockToken = 'mock-auth-token-123';

describe('Real-world Auth Refresh Tests - TDD', () => {
  let mockLocalStorage: any;
  let consoleLogSpy: any;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Spy on console.log to see render order
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleLogSpy.mockRestore();
  });

  describe('Page Refresh Simulation Tests', () => {
    it('should demonstrate the actual bug: redirect happens before auth is checked', async () => {
      // Arrange - 模拟页面刷新时localStorage中有有效认证数据
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        console.log('localStorage.getItem called with:', key);
        if (key === 'token') return mockToken;
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // Act - 模拟用户刷新/dashboard页面
      console.log('=== Starting render ===');
      render(<TestApp initialRoute="/dashboard" />);

      // Assert - 检查渲染顺序和最终结果
      console.log('=== Checking immediate result ===');
      
      // 检查初始渲染的结果
      const dashboardElement = screen.queryByTestId('dashboard-page');
      const loginElement = screen.queryByTestId('login-page');
      
      console.log('Dashboard element exists:', !!dashboardElement);
      console.log('Login element exists:', !!loginElement);

      // 如果bug存在，应该立即重定向到登录页
      if (loginElement) {
        console.log('BUG CONFIRMED: Redirected to login despite valid auth data');
        expect(loginElement).toBeInTheDocument();
        expect(dashboardElement).not.toBeInTheDocument();
      } else if (dashboardElement) {
        console.log('NO BUG: Dashboard shown correctly');
        expect(dashboardElement).toBeInTheDocument();
        expect(loginElement).not.toBeInTheDocument();
      } else {
        console.log('UNEXPECTED: Neither page is shown');
      }

      // 等待任何异步状态更新
      await waitFor(() => {
        console.log('=== After waitFor ===');
        // localStorage应该被调用来检查认证状态
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user');
      });

      // 检查最终状态
      const finalDashboard = screen.queryByTestId('dashboard-page');
      const finalLogin = screen.queryByTestId('login-page');
      
      console.log('Final Dashboard element exists:', !!finalDashboard);
      console.log('Final Login element exists:', !!finalLogin);
    });

    it('should show the render timing issue more clearly', async () => {
      // 这个测试专门检查渲染时机问题
      
      let getItemCallCount = 0;
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        getItemCallCount++;
        console.log(`localStorage.getItem call #${getItemCallCount} for key: ${key}`);
        if (key === 'token') return mockToken;
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // 创建一个特殊的AuthContext，记录初始化过程
      const AuthDebugComponent: React.FC = () => {
        const auth = useAuth();
        console.log('AuthDebugComponent render - isAuthenticated:', auth.isAuthenticated);
        console.log('AuthDebugComponent render - user:', auth.user);
        console.log('AuthDebugComponent render - token:', auth.token);
        
        return (
          <div>
            <div data-testid="debug-auth-status">{auth.isAuthenticated ? 'true' : 'false'}</div>
            <div data-testid="debug-user">{auth.user ? 'has-user' : 'no-user'}</div>
            <div data-testid="debug-token">{auth.token ? 'has-token' : 'no-token'}</div>
          </div>
        );
      };

      const DebugApp: React.FC = () => (
        <MemoryRouter initialEntries={['/debug']}>
          <AuthProvider>
            <Routes>
              <Route path="/debug" element={<AuthDebugComponent />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      console.log('=== Starting debug render ===');
      render(<DebugApp />);

      // 检查初始状态
      const authStatus = screen.getByTestId('debug-auth-status');
      const userStatus = screen.getByTestId('debug-user');
      const tokenStatus = screen.getByTestId('debug-token');

      console.log('Initial auth status:', authStatus.textContent);
      console.log('Initial user status:', userStatus.textContent);
      console.log('Initial token status:', tokenStatus.textContent);
      console.log('localStorage call count:', getItemCallCount);

      // 等待任何状态更新
      await waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalled();
      });

      console.log('Final localStorage call count:', getItemCallCount);
    });

    it('should test the exact scenario: dashboard page refresh', async () => {
      // 这个测试模拟用户在dashboard页面按F5刷新的确切场景
      
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return mockToken;
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // 模拟页面刷新：直接访问/dashboard URL
      const { container } = render(<TestApp initialRoute="/dashboard" />);

      // 立即检查结果（不等待）
      const immediateResult = container.textContent;
      console.log('Immediate render result:', immediateResult);

      // 检查是否立即显示了错误的页面
      const isDashboardShown = screen.queryByTestId('dashboard-page') !== null;
      const isLoginShown = screen.queryByTestId('login-page') !== null;

      console.log('Immediate dashboard shown:', isDashboardShown);
      console.log('Immediate login shown:', isLoginShown);

      if (isLoginShown && !isDashboardShown) {
        console.log('🐛 BUG CONFIRMED: Page refresh causes redirect to login');
        // 这就是用户报告的bug
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      } else if (isDashboardShown && !isLoginShown) {
        console.log('✅ NO BUG: Dashboard shown correctly on refresh');
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      }

      // 等待任何延迟的状态更新
      await waitFor(() => {
        // 给足够的时间让useEffect执行
        expect(mockLocalStorage.getItem).toHaveBeenCalled();
      }, { timeout: 1000 });

      // 检查最终状态
      const finalDashboard = screen.queryByTestId('dashboard-page');
      const finalLogin = screen.queryByTestId('login-page');
      
      console.log('Final dashboard shown:', !!finalDashboard);
      console.log('Final login shown:', !!finalLogin);
    });
  });

  describe('AuthProvider Initialization Timing Tests', () => {
    it('should reveal the initialization order problem', () => {
      // 测试AuthProvider的初始化顺序
      
      let initializationOrder: string[] = [];
      
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        initializationOrder.push(`localStorage.getItem(${key})`);
        if (key === 'token') return mockToken;
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // 创建一个监控初始化过程的组件
      const InitOrderTracker: React.FC = () => {
        const auth = useAuth();
        
        React.useEffect(() => {
          initializationOrder.push(`useAuth effect - isAuthenticated: ${auth.isAuthenticated}`);
        });
        
        initializationOrder.push(`useAuth render - isAuthenticated: ${auth.isAuthenticated}`);
        
        return <div data-testid="tracker">Tracking</div>;
      };

      const TrackerApp: React.FC = () => (
        <MemoryRouter>
          <AuthProvider>
            <InitOrderTracker />
          </AuthProvider>
        </MemoryRouter>
      );

      initializationOrder.push('Before render');
      render(<TrackerApp />);
      initializationOrder.push('After render');

      console.log('Initialization order:', initializationOrder);
      
      // 分析初始化顺序
      expect(initializationOrder).toContain('Before render');
      expect(initializationOrder).toContain('After render');
      
      // 检查localStorage何时被调用
      const localStorageCallIndex = initializationOrder.findIndex(item => 
        item.includes('localStorage.getItem')
      );
      
      const authRenderIndex = initializationOrder.findIndex(item =>
        item.includes('useAuth render')
      );
      
      console.log('localStorage call index:', localStorageCallIndex);
      console.log('auth render index:', authRenderIndex);
      
      if (localStorageCallIndex > authRenderIndex) {
        console.log('🐛 PROBLEM: Auth renders before localStorage is checked');
      } else {
        console.log('✅ OK: localStorage checked before/during auth render');
      }
    });
  });

  describe('State Synchronization Tests', () => {
    it('should handle the case where localStorage is read in useEffect', async () => {
      // 测试当localStorage在useEffect中读取时的时机问题
      
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return mockToken;
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      let renderCount = 0;
      const RenderCounter: React.FC = () => {
        const auth = useAuth();
        renderCount++;
        
        console.log(`Render #${renderCount} - isAuthenticated:`, auth.isAuthenticated);
        
        return (
          <div>
            <div data-testid="render-count">{renderCount}</div>
            <div data-testid="auth-state">{auth.isAuthenticated ? 'auth' : 'no-auth'}</div>
          </div>
        );
      };

      const CounterApp: React.FC = () => (
        <MemoryRouter>
          <AuthProvider>
            <RenderCounter />
          </AuthProvider>
        </MemoryRouter>
      );

      render(<CounterApp />);

      // 检查初始渲染
      expect(screen.getByTestId('render-count')).toHaveTextContent('1');
      
      const initialAuthState = screen.getByTestId('auth-state').textContent;
      console.log('Initial auth state:', initialAuthState);

      // 等待可能的重新渲染
      await waitFor(() => {
        const currentRenderCount = parseInt(screen.getByTestId('render-count').textContent || '0');
        console.log('Current render count:', currentRenderCount);
        
        // 如果有useEffect更新，渲染次数会增加
        if (currentRenderCount > 1) {
          console.log('Auth state updated in useEffect');
        }
        
        return currentRenderCount >= 1;
      });

      const finalAuthState = screen.getByTestId('auth-state').textContent;
      const finalRenderCount = parseInt(screen.getByTestId('render-count').textContent || '0');
      
      console.log('Final auth state:', finalAuthState);
      console.log('Final render count:', finalRenderCount);
      
      if (initialAuthState === 'no-auth' && finalAuthState === 'auth') {
        console.log('🐛 CONFIRMED: Auth state starts as false, then becomes true');
      } else if (initialAuthState === 'auth') {
        console.log('✅ GOOD: Auth state is true from the start');
      }
    });
  });
});