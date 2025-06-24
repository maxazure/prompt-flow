import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import PromptEditor from '../components/PromptEditor';

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

    const categorySelect = screen.getByDisplayValue('web-development');
    expect(categorySelect).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <PromptEditor 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    const submitButton = screen.getByText('Create Prompt');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Content is required')).toBeInTheDocument();
    });

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

    const submitButton = screen.getByText('Create Prompt');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith({
        title: 'Test Prompt',
        content: 'Test content for the prompt',
        description: '',
        category: '',
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
      category: 'web-development',
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
    expect(screen.getByDisplayValue('web-development')).toBeInTheDocument();
    expect(screen.getByText('existing')).toBeInTheDocument();
    expect(screen.getByText('tags')).toBeInTheDocument();
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