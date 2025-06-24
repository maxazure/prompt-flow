import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Templates from '../pages/Templates';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
const mockAuth = {
  isAuthenticated: false,
  user: null,
  token: null,
  login: vi.fn(),
  logout: vi.fn(),
};

const mockAuthenticatedAuth = {
  isAuthenticated: true,
  user: { id: 1, username: 'testuser', email: 'test@example.com' },
  token: 'fake-token',
  login: vi.fn(),
  logout: vi.fn(),
};

// Mock the entire AuthContext module
let currentAuth: any = mockAuth;
vi.mock('../context/AuthContext', () => ({
  useAuth: () => currentAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Templates Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    currentAuth = mockAuth; // Reset to unauthenticated state
  });

  it('renders the templates page with header and search', () => {
    renderWithRouter(<Templates />);
    
    expect(screen.getByText('Template Library')).toBeInTheDocument();
    expect(screen.getByText('Browse our collection of professional prompt templates to kickstart your projects')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name, description, or tags...')).toBeInTheDocument();
  });

  it('displays all template presets', () => {
    renderWithRouter(<Templates />);
    
    expect(screen.getByText('Website Generator')).toBeInTheDocument();
    expect(screen.getByText('API Documentation')).toBeInTheDocument();
    expect(screen.getByText('Code Review Template')).toBeInTheDocument();
    expect(screen.getByText('Blog Post Generator')).toBeInTheDocument();
  });

  it('shows category filters and sort options', () => {
    renderWithRouter(<Templates />);
    
    expect(screen.getByDisplayValue('📋 All Categories')).toBeInTheDocument();
    expect(screen.getByDisplayValue('📈 Most Popular')).toBeInTheDocument();
  });

  it('filters templates by search term', async () => {
    renderWithRouter(<Templates />);
    
    const searchInput = screen.getByPlaceholderText('Search by name, description, or tags...');
    fireEvent.change(searchInput, { target: { value: 'website' } });
    
    await waitFor(() => {
      expect(screen.getByText('Website Generator')).toBeInTheDocument();
      expect(screen.queryByText('API Documentation')).not.toBeInTheDocument();
    });
  });

  it('filters templates by category', async () => {
    renderWithRouter(<Templates />);
    
    const categorySelect = screen.getByDisplayValue('📋 All Categories');
    fireEvent.change(categorySelect, { target: { value: 'web-development' } });
    
    await waitFor(() => {
      expect(screen.getByText('Website Generator')).toBeInTheDocument();
      expect(screen.queryByText('Blog Post Generator')).not.toBeInTheDocument();
    });
  });

  it('redirects to login when unauthenticated user tries to use template', () => {
    renderWithRouter(<Templates />);
    
    const useTemplateButton = screen.getAllByText('Use Template')[0];
    fireEvent.click(useTemplateButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({
      state: expect.objectContaining({
        from: '/templates'
      })
    }));
  });

  it('navigates to create page when authenticated user uses template', () => {
    // Set authenticated state
    currentAuth = mockAuthenticatedAuth;
    
    renderWithRouter(<Templates />);
    
    const useTemplateButton = screen.getAllByText('Use Template')[0];
    fireEvent.click(useTemplateButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/create');
  });

  it('stores selected template in localStorage when using template', () => {
    // Set authenticated state
    currentAuth = mockAuthenticatedAuth;
    
    renderWithRouter(<Templates />);
    
    const useTemplateButton = screen.getAllByText('Use Template')[0];
    fireEvent.click(useTemplateButton);
    
    const storedTemplate = localStorage.getItem('selected-template');
    expect(storedTemplate).toBeTruthy();
    
    const template = JSON.parse(storedTemplate!);
    expect(template.name).toBe('Blog Post Generator'); // First template by popularity
  });

  it('toggles template favorites', async () => {
    renderWithRouter(<Templates />);
    
    const favoriteButtons = screen.getAllByTitle(/Add to favorites|Remove from favorites/);
    const firstFavoriteButton = favoriteButtons[0];
    
    fireEvent.click(firstFavoriteButton);
    
    await waitFor(() => {
      const savedFavorites = localStorage.getItem('template-favorites');
      expect(savedFavorites).toBeTruthy();
    });
  });

  it('shows empty state when no templates match filters', async () => {
    renderWithRouter(<Templates />);
    
    const searchInput = screen.getByPlaceholderText('Search by name, description, or tags...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No templates found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search criteria or browse different categories.')).toBeInTheDocument();
    });
  });

  it('clears filters when clear filters button is clicked', async () => {
    renderWithRouter(<Templates />);
    
    // Apply filters
    const searchInput = screen.getByPlaceholderText('Search by name, description, or tags...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No templates found')).toBeInTheDocument();
    });
    
    // Clear filters
    const clearButton = screen.getByText('Clear filters');
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('');
      expect(screen.getByText('Website Generator')).toBeInTheDocument();
    });
  });

  it('navigates to create page when clicking create custom prompt', () => {
    renderWithRouter(<Templates />);
    
    const createButton = screen.getByText('Create Custom Prompt');
    fireEvent.click(createButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/create');
  });

  it('shows preview alert when preview button is clicked', () => {
    // Mock window.alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    renderWithRouter(<Templates />);
    
    const previewButton = screen.getAllByText('Preview')[0];
    fireEvent.click(previewButton);
    
    expect(alertSpy).toHaveBeenCalledWith('Preview feature coming soon!');
    
    alertSpy.mockRestore();
  });

  it('displays usage counts for templates', () => {
    renderWithRouter(<Templates />);
    
    expect(screen.getByText('245 uses')).toBeInTheDocument();
    expect(screen.getByText('189 uses')).toBeInTheDocument();
  });

  it('sorts templates by name when name sort is selected', async () => {
    renderWithRouter(<Templates />);
    
    const sortSelect = screen.getByDisplayValue('📈 Most Popular');
    fireEvent.change(sortSelect, { target: { value: 'name' } });
    
    await waitFor(() => {
      const templateNames = screen.getAllByRole('heading', { level: 3 });
      expect(templateNames[0]).toHaveTextContent('API Documentation');
      expect(templateNames[1]).toHaveTextContent('Blog Post Generator');
    });
  });
});