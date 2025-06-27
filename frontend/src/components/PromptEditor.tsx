import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import PromptOptimizer from './PromptOptimizer';
import { useCategory } from '../context/CategoryContext';
import type { CreatePromptRequest } from '../types';

interface PromptEditorProps {
  initialData?: Partial<CreatePromptRequest>;
  onSave: (data: CreatePromptRequest) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
}

const templatePresets: TemplatePreset[] = [
  {
    id: 'website-generator',
    name: 'Website Generator',
    description: 'Generate a complete website structure',
    category: 'web-development',
    content: `Create a modern, responsive website for {company_name} with the following requirements:

**Website Structure:**
- Header with navigation menu
- Hero section with call-to-action
- About section
- Services/Products section  
- Contact form
- Footer with social links

**Technical Requirements:**
- Responsive design (mobile-first)
- Modern CSS/HTML5
- SEO optimized
- Fast loading times

**Content Guidelines:**
- Brand colors: {brand_colors}
- Target audience: {target_audience}
- Key message: {key_message}

Please provide complete HTML, CSS, and basic JavaScript code.`,
    tags: ['html', 'css', 'responsive', 'website']
  },
  {
    id: 'api-documentation',
    name: 'API Documentation',
    description: 'Generate comprehensive API documentation',
    category: 'documentation',
    content: `Generate comprehensive API documentation for {api_name}:

**Overview:**
- API purpose and functionality
- Base URL: {base_url}
- Authentication method: {auth_method}
- Rate limiting: {rate_limit}

**Endpoints:**
For each endpoint, include:
- HTTP method and path
- Description and purpose
- Request parameters (required/optional)
- Request body schema
- Response format and status codes
- Example requests and responses
- Error handling

**Authentication:**
- Describe authentication flow
- Include example headers
- Token refresh process

**SDKs and Libraries:**
- Available client libraries
- Installation instructions
- Basic usage examples

Please format as clear, developer-friendly documentation.`,
    tags: ['api', 'documentation', 'rest', 'openapi']
  },
  {
    id: 'code-review',
    name: 'Code Review Template',
    description: 'Systematic code review checklist',
    category: 'development',
    content: `Perform a comprehensive code review for the following {language} code:

**Code Quality Checklist:**
- [ ] Code follows established style guidelines
- [ ] Functions are properly named and documented
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Proper error handling implemented
- [ ] Security considerations addressed

**Performance Review:**
- [ ] Algorithms are efficient
- [ ] Database queries optimized
- [ ] Memory usage reasonable
- [ ] No obvious bottlenecks

**Testing & Maintainability:**
- [ ] Code is testable
- [ ] Unit tests present and comprehensive
- [ ] Code is readable and maintainable
- [ ] Dependencies are minimal and justified

**Security Review:**
- [ ] Input validation implemented
- [ ] No hardcoded secrets
- [ ] Proper authentication/authorization
- [ ] SQL injection protection

Please review this code and provide detailed feedback:

{code_snippet}`,
    tags: ['code-review', 'quality', 'security', 'testing']
  },
  {
    id: 'blog-post',
    name: 'Blog Post Generator',
    description: 'Create engaging blog content',
    category: 'content',
    content: `Write a comprehensive blog post about {topic}:

**Article Structure:**
- Compelling headline (60 characters max)
- Hook opening paragraph
- 3-5 main sections with subheadings
- Conclusion with call-to-action
- Meta description (150 characters)

**Content Requirements:**
- Target audience: {target_audience}
- Tone: {tone} (professional/casual/technical)
- Word count: {word_count}
- Include relevant examples
- Add actionable insights

**SEO Optimization:**
- Primary keyword: {primary_keyword}
- Secondary keywords: {secondary_keywords}
- Include internal and external links
- Optimize for featured snippets

**Engagement Elements:**
- Add relevant images/charts suggestions
- Include quotable statements
- Create discussion questions
- Suggest social media snippets

Please create engaging, valuable content that ranks well and drives engagement.`,
    tags: ['blog', 'content', 'seo', 'marketing']
  }
];

const PromptEditor: React.FC<PromptEditorProps> = ({
  initialData,
  onSave,
  onCancel,
  isEditing = false,
  loading = false
}) => {
  const { categories, refreshCategories } = useCategory();
  const [formData, setFormData] = useState<CreatePromptRequest>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    description: initialData?.description || '',
    category: initialData?.category || '',        // 向后兼容
    categoryId: initialData?.categoryId || undefined,  // 新字段
    tags: initialData?.tags || [],
    isTemplate: initialData?.isTemplate || false,
    isPublic: initialData?.isPublic || false,
  });

  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const editorRef = useRef<any>(null);

  // 加载分类数据
  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    // Auto-save to localStorage
    const autoSave = setTimeout(() => {
      if (formData.title || formData.content) {
        localStorage.setItem('prompt-editor-draft', JSON.stringify(formData));
      }
    }, 2000);

    return () => clearTimeout(autoSave);
  }, [formData]);

  useEffect(() => {
    // Load draft from localStorage on mount
    const draft = localStorage.getItem('prompt-editor-draft');
    if (draft && !initialData) {
      try {
        const savedData = JSON.parse(draft);
        setFormData(savedData);
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [initialData]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure Monaco editor
    monaco.languages.register({ id: 'prompt' });
    monaco.languages.setMonarchTokensProvider('prompt', {
      tokenizer: {
        root: [
          [/\{[^}]*\}/, 'variable'],
          [/\*\*[^*]*\*\*/, 'strong'],
          [/\*[^*]*\*/, 'emphasis'],
          [/^#.*/, 'header'],
          [/^-.*/, 'list'],
          [/^[0-9]+\..*/, 'list'],
        ]
      }
    });

    monaco.editor.defineTheme('promptTheme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'variable', foreground: '0066CC', fontStyle: 'bold' },
        { token: 'strong', fontStyle: 'bold' },
        { token: 'emphasis', fontStyle: 'italic' },
        { token: 'header', foreground: '8B5CF6', fontStyle: 'bold' },
        { token: 'list', foreground: '059669' },
      ],
      colors: {
        'editor.background': '#FAFAFA',
        'editor.lineHighlightBackground': '#F3F4F6',
      }
    });

    monaco.editor.setTheme('promptTheme');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    // 验证分类选择 (必填)
    if (!formData.categoryId) {
      newErrors.category = '请选择分类';
    }

    if (formData.tags && formData.tags.length > 10) {
      newErrors.tags = 'Maximum 10 tags allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      // Clear draft on successful save
      localStorage.removeItem('prompt-editor-draft');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templatePresets.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.name,
        content: template.content,
        description: template.description,
        category: template.category,
        tags: template.tags,
        isTemplate: true,
      }));
      setSelectedTemplate(templateId);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };

  const renderPreview = () => {
    if (!showPreview) return null;

    return (
      <div className="border-l-4 border-blue-500 bg-blue-50 p-6 rounded-r-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">{formData.title || 'Untitled Prompt'}</h4>
            {formData.description && (
              <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded border">
              {formData.content || 'No content yet...'}
            </pre>
          </div>
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto" onKeyDown={handleKeyPress}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Prompt' : 'Create New Prompt'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditing ? 'Update your prompt' : 'Create a new prompt with our advanced editor'}
        </p>
      </div>

      {/* Template Selector */}
      {!isEditing && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Start with a Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templatePresets.map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className={`p-4 text-left border rounded-lg hover:border-blue-500 transition-colors ${
                  selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <h3 className="font-medium text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.tags.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`grid ${showPreview ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
          {/* Editor Section */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter a descriptive title for your prompt"
                  />
                  {errors.title && (
                    <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Describe what this prompt does and how to use it"
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      分类 *
                    </label>
                    <select
                      value={formData.categoryId || ''}
                      onChange={(e) => {
                        const categoryId = e.target.value ? parseInt(e.target.value) : undefined;
                        setFormData(prev => ({ 
                          ...prev, 
                          categoryId,
                          category: undefined // 清除旧的category字段
                        }));
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">选择分类</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          ● {category.name}
                          {category.scopeType === 'personal' && ' 👤'}
                          {category.scopeType === 'team' && ' 👥'}
                          {category.scopeType === 'public' && ' 🌍'}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-600 text-sm mt-1">{errors.category}</p>
                    )}
                    
                    {/* 显示选中分类的信息 */}
                    {formData.categoryId && (() => {
                      const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
                      return selectedCategory ? (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: selectedCategory.color }}
                          />
                          <span>{selectedCategory.name}</span>
                          {selectedCategory.description && (
                            <span className="text-gray-500">- {selectedCategory.description}</span>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add tags"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map(tag => (
                          <span
                            key={tag}
                            className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {errors.tags && (
                      <p className="text-red-600 text-sm mt-1">{errors.tags}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Prompt Content *</h2>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  <span className="text-sm text-gray-500">
                    Ctrl/Cmd + Enter to save
                  </span>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Editor
                  height="400px"
                  language="prompt"
                  theme="promptTheme"
                  value={formData.content}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value || '' }))}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    fontSize: 14,
                    lineHeight: 1.6,
                    padding: { top: 16, bottom: 16 },
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    folding: true,
                    bracketPairColorization: { enabled: true },
                  }}
                />
              </div>
              {errors.content && (
                <p className="text-red-600 text-sm mt-2">{errors.content}</p>
              )}
              
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Tip:</strong> Use {'{variable_name}'} for placeholders in your prompt.</p>
                <p>You can use **bold** and *italic* formatting. Use # for headers and - for lists.</p>
              </div>
            </div>

            {/* AI Optimization */}
            {formData.content && (
              <PromptOptimizer
                content={formData.content}
                onOptimized={(optimizedContent) => {
                  setFormData(prev => ({ ...prev, content: optimizedContent }));
                }}
              />
            )}

            {/* Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isTemplate}
                      onChange={(e) => setFormData(prev => ({ ...prev, isTemplate: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Mark as Template</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Make Public</span>
                  </label>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>• Templates can be used by others as starting points</p>
                  <p>• Public prompts are visible to all users</p>
                  <p>• Private prompts are only visible to you</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {renderPreview()}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-600">
            Auto-saved as draft every 2 seconds
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isEditing ? 'Update Prompt' : 'Create Prompt'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PromptEditor;