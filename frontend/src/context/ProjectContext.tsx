import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { projectsAPI } from '../services/api';
import type { 
  Project, 
  ProjectStats,
  CreateProjectRequest, 
  UpdateProjectRequest,
  ProjectQueryOptions
} from '../types';

// =====================================================
// ProjectContext State Management
// =====================================================

// Project Context Type
interface ProjectContextType {
  // Data state
  projects: Project[];
  selectedProject: Project | null;
  stats: ProjectStats | null;
  loading: boolean;
  error: string | null;
  
  // Operations
  loadProjects: (options?: ProjectQueryOptions) => Promise<void>;
  loadProject: (id: number) => Promise<Project | null>;
  createProject: (data: CreateProjectRequest) => Promise<Project | null>;
  updateProject: (id: number, data: UpdateProjectRequest) => Promise<Project | null>;
  deleteProject: (id: number) => Promise<boolean>;
  refreshStats: () => Promise<void>;
  
  // State management
  setSelectedProject: (project: Project | null) => void;
  clearError: () => void;
  retryLastOperation: () => void;
  
  // Search and filter
  searchProjects: (term: string) => Project[];
  filterProjectsByType: (type: 'all' | 'personal' | 'team' | 'public') => Project[];
}

// State interface for reducer
interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  stats: ProjectStats | null;
  loading: boolean;
  error: string | null;
  lastOperation: (() => Promise<void>) | null;
  lastFetchTime: number | null;
  cacheExpiryTime: number; // 5 minutes cache
}

// Action types for reducer
type ProjectAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_SELECTED_PROJECT'; payload: Project | null }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: { id: number; project: Project } }
  | { type: 'DELETE_PROJECT'; payload: number }
  | { type: 'SET_STATS'; payload: ProjectStats }
  | { type: 'SET_LAST_OPERATION'; payload: (() => Promise<void>) | null }
  | { type: 'SET_LAST_FETCH_TIME'; payload: number };

// Initial state
const initialState: ProjectState = {
  projects: [],
  selectedProject: null,
  stats: null,
  loading: false,
  error: null,
  lastOperation: null,
  lastFetchTime: null,
  cacheExpiryTime: 5 * 60 * 1000 // 5 minutes
};

// Reducer function
function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_PROJECTS':
      return { 
        ...state, 
        projects: action.payload, 
        loading: false, 
        error: null,
        lastFetchTime: Date.now()
      };
    
    case 'SET_SELECTED_PROJECT':
      return { ...state, selectedProject: action.payload };
    
    case 'ADD_PROJECT':
      return { 
        ...state, 
        projects: [action.payload, ...state.projects],
        error: null
      };
    
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload.project : project
        ),
        selectedProject: state.selectedProject?.id === action.payload.id 
          ? action.payload.project 
          : state.selectedProject,
        error: null
      };
    
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        selectedProject: state.selectedProject?.id === action.payload 
          ? null 
          : state.selectedProject,
        error: null
      };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    case 'SET_LAST_OPERATION':
      return { ...state, lastOperation: action.payload };
    
    case 'SET_LAST_FETCH_TIME':
      return { ...state, lastFetchTime: action.payload };
    
    default:
      return state;
  }
}

// Create context
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Provider component
export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Load projects with caching
  const loadProjects = useCallback(async (options?: ProjectQueryOptions) => {
    // Don't fetch projects for unauthenticated users
    if (!isAuthenticated) {
      console.log('🔒 Skipping project fetch - user not authenticated');
      return;
    }

    const now = Date.now();
    const cacheValid = state.lastFetchTime && 
                      (now - state.lastFetchTime) < state.cacheExpiryTime;
    
    if (cacheValid && !options) {
      return; // Use cached data
    }

    const operation = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await projectsAPI.getProjects(options);
        if (response.success) {
          dispatch({ type: 'SET_PROJECTS', payload: response.data });
        } else {
          dispatch({ type: 'SET_ERROR', payload: '加载项目失败' });
        }
      } catch (err: any) {
        console.error('Load projects error:', err);
        dispatch({ type: 'SET_ERROR', payload: err.message || '加载项目失败' });
      }
    };

    dispatch({ type: 'SET_LAST_OPERATION', payload: operation });
    await operation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Include isAuthenticated to prevent calls for unauthenticated users

  // Load single project
  const loadProject = useCallback(async (id: number): Promise<Project | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await projectsAPI.getProject(id);
      if (response.success) {
        dispatch({ type: 'SET_SELECTED_PROJECT', payload: response.data });
        dispatch({ type: 'SET_LOADING', payload: false });
        return response.data;
      } else {
        dispatch({ type: 'SET_ERROR', payload: '加载项目详情失败' });
        return null;
      }
    } catch (err: any) {
      console.error('Load project error:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || '加载项目详情失败' });
      return null;
    }
  }, []);

  // Create project
  const createProject = useCallback(async (data: CreateProjectRequest): Promise<Project | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await projectsAPI.createProject(data);
      if (response.success) {
        dispatch({ type: 'ADD_PROJECT', payload: response.data });
        dispatch({ type: 'SET_LOADING', payload: false });
        return response.data;
      } else {
        dispatch({ type: 'SET_ERROR', payload: '创建项目失败' });
        return null;
      }
    } catch (err: any) {
      console.error('Create project error:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || '创建项目失败' });
      return null;
    }
  }, []);

  // Update project
  const updateProject = useCallback(async (id: number, data: UpdateProjectRequest): Promise<Project | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await projectsAPI.updateProject(id, data);
      if (response.success) {
        dispatch({ type: 'UPDATE_PROJECT', payload: { id, project: response.data } });
        dispatch({ type: 'SET_LOADING', payload: false });
        return response.data;
      } else {
        dispatch({ type: 'SET_ERROR', payload: '更新项目失败' });
        return null;
      }
    } catch (err: any) {
      console.error('Update project error:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || '更新项目失败' });
      return null;
    }
  }, []);

  // Delete project
  const deleteProject = useCallback(async (id: number): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await projectsAPI.deleteProject(id);
      if (response.success) {
        dispatch({ type: 'DELETE_PROJECT', payload: id });
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: '删除项目失败' });
        return false;
      }
    } catch (err: any) {
      console.error('Delete project error:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || '删除项目失败' });
      return false;
    }
  }, []);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    // Don't fetch stats for unauthenticated users
    if (!isAuthenticated) {
      console.log('🔒 Skipping project stats fetch - user not authenticated');
      return;
    }

    try {
      const response = await projectsAPI.getProjectStats();
      if (response.success) {
        dispatch({ type: 'SET_STATS', payload: response.data });
      }
    } catch (err: any) {
      console.error('Load project stats error:', err);
    }
  }, [isAuthenticated]);

  // Set selected project
  const setSelectedProject = useCallback((project: Project | null) => {
    dispatch({ type: 'SET_SELECTED_PROJECT', payload: project });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Retry last operation
  const retryLastOperation = useCallback(async () => {
    if (state.lastOperation) {
      await state.lastOperation();
    }
  }, [state.lastOperation]);

  // Search projects
  const searchProjects = useCallback((term: string): Project[] => {
    if (!term.trim()) return state.projects;
    
    const searchTerm = term.toLowerCase();
    return state.projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm) ||
      project.description?.toLowerCase().includes(searchTerm) ||
      project.background.toLowerCase().includes(searchTerm)
    );
  }, [state.projects]);

  // Filter projects by type
  const filterProjectsByType = useCallback((type: 'all' | 'personal' | 'team' | 'public'): Project[] => {
    if (type === 'all') return state.projects;
    
    return state.projects.filter(project => {
      switch (type) {
        case 'personal':
          return !project.teamId && !project.isPublic;
        case 'team':
          return !!project.teamId;
        case 'public':
          return project.isPublic;
        default:
          return true;
      }
    });
  }, [state.projects]);

  // Auto-load projects on mount only for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated, loadProjects]);

  // Auto-refresh stats when projects change
  useEffect(() => {
    if (state.projects.length > 0) {
      refreshStats();
    }
  }, [state.projects.length, refreshStats]);

  // Context value
  const contextValue: ProjectContextType = {
    // State
    projects: state.projects,
    selectedProject: state.selectedProject,
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    
    // Operations
    loadProjects,
    loadProject,
    createProject,
    updateProject,
    deleteProject,
    refreshStats,
    
    // State management
    setSelectedProject,
    clearError,
    retryLastOperation,
    
    // Search and filter
    searchProjects,
    filterProjectsByType
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

// Custom hook to use project context
export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext;