import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCategory } from '../context/CategoryContext';
import { useSearch } from '../context/SearchContext';
import { promptsAPI } from '../services/api';
import type { Prompt } from '../types';
import usePageTitle from '../hooks/usePageTitle';
import { ParameterizedPromptModal } from '../components/ParameterizedPromptModal';
import { Play, MoreHorizontal } from 'lucide-react';

const MyPrompts: React.FC = () => {
  usePageTitle('我的提示词');
  
  const { categories } = useCategory();
  const { searchTerm } = useSearch();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('updated'); // updated, created, title
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadUserPrompts();
  }, []);

  const loadUserPrompts = async () => {
    try {
      setLoading(true);
      const response = await promptsAPI.getMyPrompts();
      setPrompts(response.prompts);
    } catch (err: any) {
      setError('Failed to load your prompts');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort prompts (using global search)
  const filteredAndSortedPrompts = prompts
    .filter(prompt => {
      if (!searchTerm.trim()) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        prompt.title.toLowerCase().includes(searchLower) ||
        prompt.description?.toLowerCase().includes(searchLower) ||
        prompt.content?.toLowerCase().includes(searchLower) ||
        prompt.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'updated':
        default:
          return new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime();
      }
    });

  const handleUsePrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading your prompts...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-4">
      {/* Simplified Header - Only view mode and sort controls */}
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-4">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          >
            <option value="updated">最近更新</option>
            <option value="created">创建时间</option>
            <option value="title">标题 A-Z</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'compact' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              紧凑
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'detailed' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              详细
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadUserPrompts}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            重试
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAndSortedPrompts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">
            {prompts.length === 0 
              ? "还没有创建任何提示词" 
              : searchTerm 
                ? `没有找到包含 "${searchTerm}" 的提示词`
                : "没有找到符合条件的提示词"
            }
          </p>
          {prompts.length === 0 && (
            <Link
              to="/create"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              创建第一个提示词
            </Link>
          )}
        </div>
      )}

      {/* Prompts Grid */}
      {filteredAndSortedPrompts.length > 0 && (
        <>
          <div className={`grid gap-4 ${
            viewMode === 'compact' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
              : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
          }`}>
            {filteredAndSortedPrompts.map((prompt) => (
              <div 
                key={prompt.id} 
                className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all duration-200 group ${
                  viewMode === 'compact' ? 'p-4' : 'p-5'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className={`font-medium text-gray-900 line-clamp-2 flex-1 mr-2 ${
                    viewMode === 'compact' ? 'text-sm leading-tight' : 'text-base'
                  }`}>
                    {prompt.title}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-gray-500 ${viewMode === 'compact' ? 'text-xs' : 'text-xs'} bg-gray-100 px-1.5 py-0.5 rounded`}>
                      v{prompt.version}
                    </span>
                  </div>
                </div>

                {/* Description - Show in both modes but truncated in compact */}
                {prompt.description && (
                  <p className={`text-gray-600 mb-3 ${
                    viewMode === 'compact' 
                      ? 'text-xs line-clamp-2' 
                      : 'text-sm line-clamp-3'
                  }`}>
                    {prompt.description}
                  </p>
                )}

              {/* Category and Tags */}
              <div className="space-y-1.5 mb-3">
                {/* Category */}
                {(prompt.categoryId || prompt.category) && (
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      if (prompt.categoryId) {
                        const category = categories.find(cat => cat.id === prompt.categoryId);
                        return category ? (
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-xs text-gray-700 truncate max-w-24">
                              {category.name}
                            </span>
                          </div>
                        ) : null;
                      } else if (prompt.category) {
                        return (
                          <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">
                            {prompt.category}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                {/* Tags */}
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.slice(0, viewMode === 'compact' ? 2 : 3).map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {prompt.tags.length > (viewMode === 'compact' ? 2 : 3) && (
                      <span className="text-gray-400 text-xs">
                        +{prompt.tags.length - (viewMode === 'compact' ? 2 : 3)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Status and Date */}
              <div className={`flex items-center justify-between text-xs text-gray-500 mb-3 ${
                viewMode === 'compact' ? 'pb-2' : 'pb-3'
              } border-b border-gray-100`}>
                <span className={`font-medium px-1.5 py-0.5 rounded-full ${
                  prompt.isPublic 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {prompt.isPublic ? '🌍 公开' : '🔒 私有'}
                </span>
                <span>
                  {new Date(prompt.updatedAt || '').toLocaleDateString('zh-CN', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

                {/* Actions */}
                <div className={`flex gap-2 ${viewMode === 'compact' ? 'text-xs' : 'text-sm'}`}>
                  <button
                    onClick={() => handleUsePrompt(prompt)}
                    className="flex items-center justify-center gap-1.5 flex-1 bg-blue-600 text-white py-2 px-2 rounded hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Play size={viewMode === 'compact' ? 12 : 14} />
                    使用
                  </button>
                  <Link
                    to={`/prompts/${prompt.id}`}
                    className="flex-1 text-center bg-gray-100 text-gray-700 py-2 px-2 rounded hover:bg-gray-200 transition-colors font-medium"
                  >
                    查看
                  </Link>
                  <Link
                    to={`/prompts/${prompt.id}/edit`}
                    className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
                    title="编辑提示词"
                  >
                    <MoreHorizontal size={viewMode === 'compact' ? 14 : 16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Info - Moved to bottom */}
          <div className="flex items-center justify-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {searchTerm ? (
                <>
                  找到 <span className="font-medium text-gray-900">{filteredAndSortedPrompts.length}</span> 个包含 "{searchTerm}" 的提示词
                  {filteredAndSortedPrompts.length !== prompts.length && (
                    <span className="text-gray-400"> (共 {prompts.length} 个)</span>
                  )}
                </>
              ) : (
                <>
                  共 <span className="font-medium text-gray-900">{prompts.length}</span> 个提示词
                </>
              )}
            </p>
          </div>
        </>
      )}

      {/* Use Prompt Modal */}
      {selectedPrompt && (
        <ParameterizedPromptModal
          prompt={selectedPrompt}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onCopy={(content) => {
            console.log('复制内容:', content);
          }}
        />
      )}
    </div>
  );
};

export default MyPrompts;