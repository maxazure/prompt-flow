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