import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CategoryProvider } from './context/CategoryContext';
import { SearchProvider } from './context/SearchContext';
import { ProjectProvider } from './context/ProjectContext';
import Layout from './components/Layout';
import MainLayout from './components/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PromptDetail from './pages/PromptDetail';
import Dashboard from './pages/Dashboard';
import MyPrompts from './pages/MyPrompts';
import CreatePrompt from './pages/CreatePrompt';
import EditPrompt from './pages/EditPrompt';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Insights from './pages/Insights';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // 在认证状态加载期间显示loading，防止错误的重定向
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// 使用新布局的页面列表 (分类系统集成页面)
const MAIN_LAYOUT_PAGES = ['/', '/dashboard', '/my-prompts', '/category', '/teams', '/insights', '/prompts', '/projects', '/create'];

// 布局选择组件
const LayoutSelector: React.FC<{ children: React.ReactNode; path: string }> = ({ 
  children, 
  path 
}) => {
  // 检查是否应该使用新的MainLayout
  const shouldUseMainLayout = MAIN_LAYOUT_PAGES.some(page => 
    path === page || path.startsWith(page + '/')
  );

  if (shouldUseMainLayout) {
    return <MainLayout>{children}</MainLayout>;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <SearchProvider>
          <CategoryProvider>
            <ProjectProvider>
          <Routes>
            {/* 使用新MainLayout的页面 */}
            <Route 
              path="/" 
              element={
                <LayoutSelector path="/">
                  <Home />
                </LayoutSelector>
              } 
            />
            <Route 
              path="/category/:categoryId" 
              element={
                <LayoutSelector path="/category">
                  <Home />
                </LayoutSelector>
              } 
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <LayoutSelector path="/dashboard">
                    <Dashboard />
                  </LayoutSelector>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-prompts"
              element={
                <ProtectedRoute>
                  <LayoutSelector path="/my-prompts">
                    <MyPrompts />
                  </LayoutSelector>
                </ProtectedRoute>
              }
            />

            {/* 使用传统Layout的页面 */}
            <Route 
              path="/login" 
              element={<Login />} 
            />
            <Route 
              path="/register" 
              element={<Register />} 
            />
            <Route 
              path="/prompts/:id" 
              element={
                <LayoutSelector path="/prompts">
                  <PromptDetail />
                </LayoutSelector>
              } 
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <LayoutSelector path="/create">
                    <CreatePrompt />
                  </LayoutSelector>
                </ProtectedRoute>
              }
            />
            <Route
              path="/prompts/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EditPrompt />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <LayoutSelector path="/teams">
                    <Teams />
                  </LayoutSelector>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TeamDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedRoute>
                  <LayoutSelector path="/insights">
                    <Insights />
                  </LayoutSelector>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <LayoutSelector path="/projects">
                    <Projects />
                  </LayoutSelector>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <LayoutSelector path="/projects">
                    <ProjectDetail />
                  </LayoutSelector>
                </ProtectedRoute>
              }
            />
          </Routes>
            </ProjectProvider>
          </CategoryProvider>
        </SearchProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
