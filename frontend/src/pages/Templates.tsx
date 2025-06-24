import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
  usage_count?: number;
  is_favorite?: boolean;
}

// Template presets data (same as in PromptEditor)
const templatePresets: TemplatePreset[] = [
  {
    id: 'website-generator',
    name: 'Website Generator',
    description: 'Generate a complete website structure with modern responsive design',
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
    tags: ['html', 'css', 'responsive', 'website'],
    usage_count: 245,
    is_favorite: false
  },
  {
    id: 'api-documentation',
    name: 'API Documentation',
    description: 'Generate comprehensive API documentation with examples and schemas',
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
    tags: ['api', 'documentation', 'rest', 'openapi'],
    usage_count: 189,
    is_favorite: true
  },
  {
    id: 'code-review',
    name: 'Code Review Template',
    description: 'Systematic code review checklist for quality assurance',
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
    tags: ['code-review', 'quality', 'security', 'testing'],
    usage_count: 156,
    is_favorite: false
  },
  {
    id: 'blog-post',
    name: 'Blog Post Generator',
    description: 'Create engaging blog content with SEO optimization',
    category: 'content',
    content: `Write an engaging blog post about {topic}:

**Article Structure:**
- Catchy headline that includes main keyword
- Introduction hook (question, statistic, or story)
- 3-5 main sections with subheadings
- Conclusion with call-to-action

**Content Requirements:**
- Target audience: {target_audience}
- Tone: {tone} (professional, casual, friendly, etc.)
- Word count: {word_count}
- Primary keyword: {primary_keyword}
- Secondary keywords: {secondary_keywords}

**SEO Optimization:**
- Include meta description (150-160 characters)
- Use header tags (H1, H2, H3) appropriately
- Internal and external linking opportunities
- Image alt text suggestions

**Engagement Elements:**
- Include relevant examples or case studies
- Add actionable tips or insights
- Use bullet points and numbered lists
- Include social proof when relevant

Please create compelling, informative content that provides real value to readers.`,
    tags: ['blog', 'content', 'seo', 'marketing'],
    usage_count: 312,
    is_favorite: true
  }
];

const Templates: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(templatePresets.map(t => t.category)))];

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('template-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Filter and sort templates
  const filteredTemplates = templatePresets
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.usage_count || 0) - (a.usage_count || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

  const handleUseTemplate = (template: TemplatePreset) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/templates', template: template.id } });
      return;
    }
    
    // Store selected template in localStorage for CreatePrompt page
    localStorage.setItem('selected-template', JSON.stringify(template));
    navigate('/create');
  };

  const toggleFavorite = (templateId: string) => {
    const newFavorites = favorites.includes(templateId)
      ? favorites.filter(id => id !== templateId)
      : [...favorites, templateId];
    
    setFavorites(newFavorites);
    localStorage.setItem('template-favorites', JSON.stringify(newFavorites));
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'web-development': '🌐',
      'documentation': '📚',
      'development': '💻',
      'content': '✍️',
      'all': '📋'
    };
    return icons[category] || '📝';
  };

  const getCategoryDisplayName = (category: string) => {
    const names: { [key: string]: string } = {
      'web-development': 'Web Development',
      'documentation': 'Documentation',
      'development': 'Development',
      'content': 'Content Creation',
      'all': 'All Categories'
    };
    return names[category] || category;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Template Library</h1>
        <p className="text-lg text-gray-600">
          Browse our collection of professional prompt templates to kickstart your projects
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Templates
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, description, or tags..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {getCategoryIcon(category)} {getCategoryDisplayName(category)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="popular">📈 Most Popular</option>
              <option value="name">🔤 Name (A-Z)</option>
              <option value="category">📂 Category</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          Showing {filteredTemplates.length} of {templatePresets.length} templates
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {template.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getCategoryIcon(template.category)} {getCategoryDisplayName(template.category)}
                    </span>
                    {template.usage_count && (
                      <span className="text-xs text-gray-500">
                        {template.usage_count} uses
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(template.id)}
                  className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${
                    favorites.includes(template.id) ? 'text-red-500' : 'text-gray-400'
                  }`}
                  title={favorites.includes(template.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  ❤️
                </button>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {template.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{template.tags.length - 3} more
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Use Template
                </button>
                <button
                  onClick={() => {
                    // Show template preview modal (future enhancement)
                    alert('Preview feature coming soon!');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Preview
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or browse different categories.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Can't find what you're looking for?
        </h3>
        <p className="text-gray-600 mb-4">
          Create your own custom prompt and share it with the community
        </p>
        <button
          onClick={() => navigate('/create')}
          className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Create Custom Prompt
        </button>
      </div>
    </div>
  );
};

export default Templates;