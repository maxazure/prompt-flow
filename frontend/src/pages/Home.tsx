import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { promptsAPI } from '../services/api';
import type { Prompt } from '../types';
import usePageTitle from '../hooks/usePageTitle';

const Home: React.FC = () => {
  usePageTitle('Home');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadPrompts();
  }, [selectedCategory]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const params = selectedCategory ? { category: selectedCategory } : {};
      const response = await promptsAPI.getPrompts(params);
      setPrompts(response.prompts);
    } catch (err: any) {
      setError('Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(prompts.map(p => p.category).filter(Boolean))];

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to PromptFlow
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Discover and share high-quality prompts for AI models. 
          Collaborate with Sarah's team and the community to build better prompts.
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Public Prompts</h2>
          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prompts...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadPrompts}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No public prompts found.</p>
          <Link
            to="/register"
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Join to Create Prompts
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {prompt.title}
                </h3>
                {prompt.isTemplate && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    Template
                  </span>
                )}
              </div>
              
              {prompt.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {prompt.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>by {prompt.user?.username}</span>
                <span>v{prompt.version}</span>
              </div>
              
              {prompt.category && (
                <div className="mb-3">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {prompt.category}
                  </span>
                </div>
              )}
              
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {prompt.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {prompt.tags.length > 3 && (
                    <span className="text-gray-500 text-xs">
                      +{prompt.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
              
              <Link
                to={`/prompts/${prompt.id}`}
                className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                View Prompt
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;