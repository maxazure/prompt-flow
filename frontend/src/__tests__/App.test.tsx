import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock all API calls
vi.mock('../services/api', () => ({
  categoriesAPI: {
    getCategories: vi.fn().mockResolvedValue({
      categories: []
    }),
    getCategoryStats: vi.fn().mockResolvedValue({
      stats: {
        totalCategories: 0,
        personalCategories: 0,
        teamCategories: 0,
        publicCategories: 0,
        recentlyUsed: [],
        mostPopular: []
      }
    }),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn()
  },
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn()
  },
  promptsAPI: {
    getPrompts: vi.fn().mockResolvedValue({ prompts: [] }),
    createPrompt: vi.fn(),
    updatePrompt: vi.fn(),
    deletePrompt: vi.fn()
  },
  projectsAPI: {
    getProjects: vi.fn().mockResolvedValue({ success: true, data: [], total: 0 }),
    getProject: vi.fn().mockResolvedValue({ success: true, data: null }),
    createProject: vi.fn().mockResolvedValue({ success: true, data: {} }),
    updateProject: vi.fn().mockResolvedValue({ success: true, data: {} }),
    deleteProject: vi.fn().mockResolvedValue({ success: true }),
    getProjectPrompts: vi.fn().mockResolvedValue({ success: true, data: [] }),
    addPromptToProject: vi.fn().mockResolvedValue({ success: true, data: {} }),
    removePromptFromProject: vi.fn().mockResolvedValue({ success: true }),
    copyProjectPrompt: vi.fn().mockResolvedValue({ success: true, data: { combinedContent: '' } }),
    getProjectStats: vi.fn().mockResolvedValue({ 
      success: true, 
      data: { 
        totalProjects: 0, 
        personalProjects: 0, 
        teamProjects: 0, 
        publicProjects: 0 
      } 
    })
  }
}));

// Mock react-router-dom location to avoid navigation issues
const mockLocation = { pathname: '/', search: '', hash: '', state: null, key: 'test' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockLocation,
    useNavigate: () => vi.fn(),
  };
});

describe('App', () => {
  it('renders PromptFlow heading', () => {
    render(<App />);
    expect(screen.getByText('PromptFlow')).toBeInTheDocument();
  });
});