import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { promptsAPI } from '../services/api';
import { useCategory } from '../context/CategoryContext';
import { useSearch } from '../context/SearchContext';
import type { Prompt } from '../types';
import usePageTitle from '../hooks/usePageTitle';

const Home: React.FC = () => {
  usePageTitle('Home');
  const { categoryId } = useParams<{ categoryId?: string }>();
  const { selectedCategory, categories, selectCategory } = useCategory();
  const { searchTerm } = useSearch();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, [currentCategoryId, searchTerm]);

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

  return (
    <div className="max-w-7xl mx-auto pt-6">
      {/* 面包屑导航 */}
      <nav className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            首页
          </Link>
          {currentCategoryId && (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-medium">{categoryInfo.name}</span>
            </>
          )}
        </div>
      </nav>


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
        /* 优化的提示词网格布局 - 更紧凑的响应式布局 */
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {prompts.map((prompt) => (
            <div 
              key={prompt.id} 
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-medium text-gray-900 line-clamp-2 flex-1 mr-2 leading-snug">
                  {prompt.title}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">
                    v{prompt.version}
                  </span>
                </div>
              </div>
              
              {prompt.description && (
                <p className="text-gray-600 text-xs mb-3 line-clamp-2 leading-relaxed">
                  {prompt.description}
                </p>
              )}
              
              {/* 分类显示 - 集成新的分类系统 */}
              {prompt.categoryId && (
                <div className="mb-2">
                  {(() => {
                    const category = categories.find(cat => cat.id === prompt.categoryId);
                    return category ? (
                      <div className="flex items-center gap-1.5">
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
                <div className="flex flex-wrap gap-1 mb-2">
                  {prompt.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded text-xs"
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
              <div className="flex items-center justify-between text-xs text-gray-400 mb-3 pt-2 border-t border-gray-100">
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
              
              {/* 查看按钮和复制按钮 */}
              <div className="flex gap-2">
                <Link
                  to={`/prompts/${prompt.id}`}
                  className="flex-1 text-center bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                >
                  查看详情
                </Link>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(prompt.content || prompt.title);
                    // TODO: 添加复制成功提示
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
                  title="复制内容"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;