import React from 'react';
import InsightsDashboard from '../components/InsightsDashboard';
import { useAuth } from '../context/AuthContext';
import { useCategory } from '../context/CategoryContext';
import usePageTitle from '../hooks/usePageTitle';

const Insights: React.FC = () => {
  usePageTitle('Insights');
  
  const { user } = useAuth();
  const { selectedCategory, categories } = useCategory();

  // 获取当前选中分类的显示名称
  const getSelectedCategoryName = () => {
    if (!selectedCategory) return '所有分类';
    const category = categories.find(cat => cat.id.toString() === selectedCategory);
    return category ? category.name : '所有分类';
  };

  if (!user) {
    return (
      <div className="px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">需要登录</h2>
          <p className="text-gray-600">您需要登录才能查看个人洞察分析。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      {/* 面包屑导航 */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <a href="/" className="hover:text-blue-600">首页</a>
          </li>
          <li>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <span className="text-gray-900 font-medium">分析</span>
          </li>
          {selectedCategory && (
            <>
              <li>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li>
                <span className="text-blue-600 font-medium">{getSelectedCategoryName()}</span>
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {selectedCategory ? `${getSelectedCategoryName()} 分析` : 'AI 洞察分析'}
        </h1>
        <p className="text-gray-600">
          {selectedCategory 
            ? `深入了解 ${getSelectedCategoryName()} 分类下的提示词使用模式和优化建议`
            : '深入了解您的提示词使用模式，获取个性化的优化建议'
          }
        </p>
      </div>

      {/* Main Dashboard */}
      <InsightsDashboard />

      {/* Additional Information */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 如何使用洞察分析</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>查看您的提示词分类分布，了解创作重点</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>关注近期活动趋势，保持创作节奏</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>采用 AI 优化建议，提升提示词质量</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>定期检查分析报告，优化创作策略</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 优化建议说明</h3>
            <div className="space-y-3 text-gray-600">
              <div className="flex items-center">
                <span className="text-blue-500 bg-blue-100 px-2 py-1 rounded text-xs mr-3">💡 清晰度</span>
                <span className="text-sm">提高表达的清晰性和理解性</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 bg-green-100 px-2 py-1 rounded text-xs mr-3">🎯 具体性</span>
                <span className="text-sm">增加更具体的细节和要求</span>
              </div>
              <div className="flex items-center">
                <span className="text-purple-500 bg-purple-100 px-2 py-1 rounded text-xs mr-3">🏗️ 结构性</span>
                <span className="text-sm">改善内容组织和逻辑结构</span>
              </div>
              <div className="flex items-center">
                <span className="text-orange-500 bg-orange-100 px-2 py-1 rounded text-xs mr-3">⚡ 效率</span>
                <span className="text-sm">提升执行效率和响应速度</span>
              </div>
              <div className="flex items-center">
                <span className="text-pink-500 bg-pink-100 px-2 py-1 rounded text-xs mr-3">📝 示例</span>
                <span className="text-sm">添加具体示例增强理解</span>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Insights;