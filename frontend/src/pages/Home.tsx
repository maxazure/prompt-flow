import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { promptsAPI } from '../services/api';
import { useCategory } from '../context/CategoryContext';
import type { Prompt } from '../types';
import usePageTitle from '../hooks/usePageTitle';

const Home: React.FC = () => {
  usePageTitle('Home');
  const { categoryId } = useParams<{ categoryId?: string }>();
  const { selectedCategory, categories, selectCategory } = useCategory();
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
  }, [currentCategoryId]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      let params: any = {};
      
      if (currentCategoryId) {
        // 使用分类ID查询
        params = { categoryId: currentCategoryId };
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
    <div className="max-w-7xl mx-auto">
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

      {/* 页面标题和描述 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentCategoryId ? categoryInfo.name : 'PromptFlow'}
            </h1>
            <p className="text-lg text-gray-600">
              {currentCategoryId 
                ? categoryInfo.description 
                : '发现和分享高质量的AI提示词，与团队协作创建更好的提示词'
              }
            </p>
          </div>
          
          {/* 统计信息 */}
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {prompts.length}
            </div>
            <div className="text-sm text-gray-500">
              个提示词
            </div>
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
        /* 优化的提示词网格布局 - 响应式3-4列 */
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {prompts.map((prompt) => (
            <div 
              key={prompt.id} 
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-200"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                  {prompt.title}
                </h3>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {prompt.isTemplate && (
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                      模板
                    </span>
                  )}
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    v{prompt.version}
                  </span>
                </div>
              </div>
              
              {prompt.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {prompt.description}
                </p>
              )}
              
              {/* 分类显示 - 集成新的分类系统 */}
              {prompt.categoryId && (
                <div className="mb-3">
                  {(() => {
                    const category = categories.find(cat => cat.id === prompt.categoryId);
                    return category ? (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-xs font-medium text-gray-700">
                          {category.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {category.scopeType === 'personal' && '👤'}
                          {category.scopeType === 'team' && '👥'}  
                          {category.scopeType === 'public' && '🌍'}
                        </span>
                      </div>
                    ) : (
                      /* 兼容老的字符串分类 */
                      prompt.category && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          {prompt.category}
                        </span>
                      )
                    );
                  })()}
                </div>
              )}
              
              {/* 标签显示 */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {prompt.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                  {prompt.tags.length > 2 && (
                    <span className="text-gray-400 text-xs px-1">
                      +{prompt.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
              
              {/* 作者信息 */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pt-2 border-t border-gray-100">
                <span>by {prompt.user?.username || '匿名'}</span>
                <span>
                  {(() => {
                    const dateStr = prompt.updatedAt || prompt.createdAt;
                    if (!dateStr) return '未知时间';
                    try {
                      return new Date(dateStr).toLocaleDateString();
                    } catch {
                      return '未知时间';
                    }
                  })()}
                </span>
              </div>
              
              {/* 查看按钮 */}
              <Link
                to={`/prompts/${prompt.id}`}
                className="block w-full text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium"
              >
                查看详情
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;