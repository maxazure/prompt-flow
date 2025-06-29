import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { promptsAPI } from '../services/api';
import { useCategory } from '../context/CategoryContext';
import { useSearch } from '../context/SearchContext';
import type { Prompt } from '../types';
import usePageTitle from '../hooks/usePageTitle';
import ParameterizedPromptModal from '../components/ParameterizedPromptModal';
import TagFilter from '../components/TagFilter';
import { needsParameters } from '../utils/templateEngine';

const Home: React.FC = () => {
  usePageTitle('Home');
  const { categoryId } = useParams<{ categoryId?: string }>();
  const { selectedCategory, categories, selectCategory } = useCategory();
  const { searchTerm } = useSearch();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagFilter, setShowTagFilter] = useState(false);

  // 确定当前选中的分类ID (来自URL参数或CategoryContext)
  const currentCategoryId = categoryId || selectedCategory;

  // 同步URL参数与CategoryContext状态
  useEffect(() => {
    if (categoryId && categoryId !== selectedCategory) {
      selectCategory(categoryId);
    } else if (!categoryId && selectedCategory) {
      selectCategory(null);
    }
  }, [categoryId, selectedCategory, selectCategory]);

  useEffect(() => {
    loadPrompts();
  }, [currentCategoryId, searchTerm, selectedTags]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      let params: any = {};
      
      if (currentCategoryId) {
        // 使用分类ID查询
        params = { categoryId: currentCategoryId };
      }
      
      if (searchTerm && searchTerm.trim()) {
        // 添加搜索参数
        params = { ...params, search: searchTerm.trim() };
      }

      if (selectedTags.length > 0) {
        // 添加标签过滤参数
        params = { ...params, tags: selectedTags };
      }
      
      const response = await promptsAPI.getPrompts(params);
      setPrompts(response.prompts);
    } catch (err: any) {
      setError('Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  // 获取当前选中分类的信息
  const getCurrentCategoryInfo = () => {
    if (!currentCategoryId) {
      return { name: '所有分类', description: '显示所有公开提示词' };
    }
    
    const category = categories.find(cat => cat.id.toString() === currentCategoryId);
    return category 
      ? { name: category.name, description: category.description || '该分类下的提示词' }
      : { name: '未知分类', description: '分类不存在' };
  };

  const categoryInfo = getCurrentCategoryInfo();

  // 处理使用提示词
  const handleUsePrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsModalOpen(true);
  };

  // 处理快速复制
  const handleQuickCopy = async (prompt: Prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content || prompt.title);
      setCopySuccess(prompt.id.toString());
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = prompt.content || prompt.title;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(prompt.id.toString());
        setTimeout(() => setCopySuccess(null), 2000);
      } catch (fallbackErr) {
        console.error('降级复制也失败:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // 处理模态框复制
  const handleModalCopy = (_content: string) => {
    // 复制成功的反馈已在模态框内处理
    console.log('内容已复制到剪贴板');
  };

  // 处理保存为新提示词 (未来功能)
  const handleSaveAsNew = async (content: string, parameters: Record<string, any>) => {
    // TODO: 实现保存为新提示词的功能
    console.log('保存为新提示词:', { content, parameters });
    alert('保存功能开发中...');
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
  };

  return (
    <div className="w-full h-full">
      {/* 过滤栏 */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedTags.length > 0 
                ? `标签筛选结果` 
                : currentCategoryId 
                  ? categoryInfo.name 
                  : '所有提示词'
              }
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({prompts.length} 个提示词)
              </span>
            </h2>
            <button
              onClick={() => setShowTagFilter(!showTagFilter)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                showTagFilter 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showTagFilter ? '隐藏' : '显示'}标签筛选
            </button>
          </div>

          {/* 当前选中的标签显示 */}
          {selectedTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">已选标签:</span>
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                >
                  {tag}
                  <button
                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs text-gray-500 hover:text-gray-700 ml-2"
              >
                清除全部
              </button>
            </div>
          )}
        </div>

        {/* 标签过滤器 */}
        {showTagFilter && (
          <div className="px-4 py-3">
            <TagFilter
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              className="max-w-lg"
            />
          </div>
        )}
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
        <div className="flex items-center justify-center h-full min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedTags.length > 0 ? `没有找到包含标签 "${selectedTags.join(', ')}" 的提示词` :
               searchTerm ? `没有找到包含 "${searchTerm}" 的提示词` : 
               currentCategoryId ? `该分类下暂无公开提示词` : 
               '暂无公开提示词'}
            </h3>
            <p className="text-gray-500 mb-6">
              {selectedTags.length > 0 ? '尝试选择其他标签组合或清除标签筛选' :
               searchTerm ? '尝试调整搜索关键词' :
               currentCategoryId ? '切换到其他分类查看内容' :
               ''}
            </p>
            {!searchTerm && !currentCategoryId && (
              <div className="flex gap-3 justify-center">
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  加入社区
                </Link>
                <Link
                  to="/login"
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  登录
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 最大化卡片布局 - 更密集的网格排列 */
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {prompts.map((prompt) => (
            <div 
              key={prompt.id} 
              className="bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-200 group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 mr-2 leading-tight">
                  {prompt.title}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="bg-gray-100 text-gray-500 text-xs px-1 py-0.5 rounded text-xs">
                    v{prompt.version}
                  </span>
                </div>
              </div>
              
              {prompt.description && (
                <p className="text-gray-600 text-xs mb-2 line-clamp-2 leading-tight">
                  {prompt.description}
                </p>
              )}
              
              {/* 分类显示 - 集成新的分类系统 */}
              {prompt.categoryId && (
                <div className="mb-1.5">
                  {(() => {
                    const category = categories.find(cat => cat.id === prompt.categoryId);
                    return category ? (
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-xs font-medium text-gray-700 truncate">
                          {category.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {category.scopeType === 'personal' && '👤'}
                          {category.scopeType === 'team' && '👥'}  
                          {category.scopeType === 'public' && '🌍'}
                        </span>
                      </div>
                    ) : (
                      /* 兼容老的字符串分类 */
                      prompt.category && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-1.5 py-0.5 rounded">
                          {prompt.category}
                        </span>
                      )
                    );
                  })()}
                </div>
              )}
              
              {/* 标签显示 */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {prompt.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {prompt.tags.length > 2 && (
                    <span className="text-gray-400 text-xs">
                      +{prompt.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
              
              {/* 作者信息 */}
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2 pt-1.5 border-t border-gray-100">
                <span className="truncate mr-1">by {prompt.user?.username || '匿名'}</span>
                <span className="flex-shrink-0">
                  {(() => {
                    const dateStr = prompt.updatedAt || prompt.createdAt;
                    if (!dateStr) return '未知';
                    try {
                      return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
                    } catch {
                      return '未知';
                    }
                  })()}
                </span>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex gap-1.5">
                <Link
                  to={`/prompts/${prompt.id}`}
                  className="flex-1 text-center bg-blue-600 text-white py-1.5 px-2 rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                >
                  查看
                </Link>
                
                {/* 根据是否需要参数显示不同的按钮 */}
                {needsParameters(prompt.content) ? (
                  <button
                    onClick={() => handleUsePrompt(prompt)}
                    className="px-2 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium"
                    title="填写参数使用"
                  >
                    使用
                  </button>
                ) : (
                  <button
                    onClick={() => handleQuickCopy(prompt)}
                    className={`p-1.5 rounded-md transition-colors ${
                      copySuccess === prompt.id.toString()
                        ? 'text-green-600 bg-green-50'
                        : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title="快速复制"
                  >
                    {copySuccess === prompt.id.toString() ? (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 参数化提示词模态框 */}
      {selectedPrompt && (
        <ParameterizedPromptModal
          prompt={selectedPrompt}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onCopy={handleModalCopy}
          onSaveAsNew={handleSaveAsNew}
        />
      )}
    </div>
  );
};

export default Home;