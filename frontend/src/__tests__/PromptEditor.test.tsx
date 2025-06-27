import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PromptEditor from '../components/PromptEditor';
import { CategoryProvider } from '../context/CategoryContext';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  Editor: ({ onChange, value }: any) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder="Monaco Editor Mock"
    />
  ),
}));

// Mock the categories API
vi.mock('../services/api', () => ({
  categoriesAPI: {
    getCategories: vi.fn().mockImplementation(() => 
      Promise.resolve({
        categories: [
          {
            id: 1,
            name: 'Web Development',
            description: 'Web development related prompts',
            scopeType: 'personal',
            createdBy: 1,
            color: '#3B82F6',
            isActive: true,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            promptCount: 5,
            canEdit: true
          },
          {
            id: 2,
            name: 'Documentation',
            description: 'Documentation templates',
            scopeType: 'public',
            createdBy: 2,
            color: '#10B981',
            isActive: true,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            promptCount: 3,
            canEdit: false
          }
        ]
      })
    ),
    getCategoryStats: vi.fn().mockImplementation(() =>
      Promise.resolve({
        stats: {
          totalCategories: 2,
          personalCategories: 1,
          teamCategories: 0,
          publicCategories: 1,
          recentlyUsed: [],
          mostPopular: []
        }
      })
    ),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn()
  }
}));

// Mock useCategory hook directly to avoid CategoryProvider complexity
vi.mock('../context/CategoryContext', async () => {
  const actual = await vi.importActual('../context/CategoryContext');
  return {
    ...actual,
    useCategory: vi.fn(() => ({
      categories: [
        {
          id: 1,
          name: 'Web Development',
          description: 'Web development related prompts',
          scopeType: 'personal',
          createdBy: 1,
          color: '#3B82F6',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          promptCount: 5,
          canEdit: true
        },
        {
          id: 2,
          name: 'Documentation',
          description: 'Documentation templates',
          scopeType: 'public',
          createdBy: 2,
          color: '#10B981',
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          promptCount: 3,
          canEdit: false
        }
      ],
      refreshCategories: vi.fn(),
      loading: false,
      error: null
    }))
  };
});

// Simple test wrapper without CategoryProvider since we're mocking useCategory
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return children as React.ReactElement;
};

describe('PromptEditor', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the editor with all basic components', () => {
    render(
      <PromptEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    expect(screen.getByText('Create New Prompt')).toBeInTheDocument();
    expect(screen.getByText('Start with a Template')).toBeInTheDocument();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Prompt Content *')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('displays template presets', () => {
    render(
      <PromptEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    expect(screen.getByText('Website Generator')).toBeInTheDocument();
    expect(screen.getByText('API Documentation')).toBeInTheDocument();
    expect(screen.getByText('Code Review Template')).toBeInTheDocument();
    expect(screen.getByText('Blog Post Generator')).toBeInTheDocument();
  });

  it('allows selecting a template', async () => {
    render(
      <PromptEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    const websiteTemplate = screen.getByText('Website Generator');
    fireEvent.click(websiteTemplate);

    await waitFor(() => {
      const titleInput = screen.getByDisplayValue('Website Generator');
      expect(titleInput).toBeInTheDocument();
    });

    // Check that the template content is loaded
    const editor = screen.getByTestId('monaco-editor');
    expect(editor.value).toContain('Create a modern, responsive website');
  });

  it('validates required fields', async () => {
    render(
      <PromptEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    // Try to submit without filling required fields
    const submitButton = screen.getByText('Create Prompt');
    fireEvent.click(submitButton);

    // Since validation should prevent the onSave from being called
    await waitFor(() => {
      expect(mockOnSave).not.toHaveBeenCalled();
    }, { timeout: 1000 });

    // Check that the form hasn't been submitted due to validation
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('allows adding and removing tags', async () => {
    render(
      <PromptEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    const tagInput = screen.getByPlaceholderText('Add tags');
    const addButton = screen.getByText('Add');

    fireEvent.change(tagInput, { target: { value: 'test-tag' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('test-tag')).toBeInTheDocument();
    });

    const removeButton = screen.getByText('×');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('test-tag')).not.toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockSave = vi.fn().mockResolvedValue({});
    render(
      <PromptEditor 
        onSave={mockSave} 
        onCancel={mockOnCancel} 
      />
    );

    // Fill in required fields
    const titleInput = screen.getByPlaceholderText('Enter a descriptive title for your prompt');
    fireEvent.change(titleInput, { target: { value: 'Test Prompt' } });

    const editor = screen.getByTestId('monaco-editor');
    fireEvent.change(editor, { target: { value: 'Test content for the prompt' } });

    // Select a category
    const categorySelect = screen.getByDisplayValue('选择分类');
    fireEvent.change(categorySelect, { target: { value: '1' } });

    const submitButton = screen.getByText('Create Prompt');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith({
        title: 'Test Prompt',
        content: 'Test content for the prompt',
        description: '',
        category: undefined,
        categoryId: 1,
        tags: [],
        isTemplate: false,
        isPublic: false,
      });
    });
  });

  it('shows preview when toggled', async () => {
    render(
      <PromptEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    const previewButton = screen.getByText('Show Preview');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Hide Preview')).toBeInTheDocument();
    });
  });

  it('loads initial data when editing', () => {
    const initialData = {
      title: 'Existing Prompt',
      content: 'Existing content',
      description: 'Existing description',
      categoryId: 1,
      tags: ['existing', 'tags'],
      isTemplate: true,
      isPublic: true,
    };

    render(
      <PromptEditor 
        initialData={initialData}
        onSave={mockOnSave} 
        onCancel={mockOnCancel}
        isEditing={true}
      />
    );

    expect(screen.getByText('Edit Prompt')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Prompt')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
    
    // Check that tags are loaded
    expect(screen.getByText('existing')).toBeInTheDocument();
    expect(screen.getByText('tags')).toBeInTheDocument();
    
    // Check that it's in editing mode (button text changes)
    expect(screen.getByText('Update Prompt')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <PromptEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state when saving', () => {
    render(
      <PromptEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel}
        loading={true}
      />
    );

    const submitButton = screen.getByText('Create Prompt');
    expect(submitButton).toBeDisabled();
  });
});