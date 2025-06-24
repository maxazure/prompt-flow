import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { aiAPI } from '../services/api';
import type { PromptInsights } from '../types';

interface InsightsDashboardProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ className = '' }) => {
  const [insights, setInsights] = useState<PromptInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await aiAPI.getInsights();
      if (response.success) {
        setInsights(response.data);
      } else {
        setError('Failed to load insights');
      }
    } catch (err) {
      console.error('Error loading insights:', err);
      setError('Failed to load insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">⚠️ {error}</div>
          <button
            onClick={loadInsights}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-gray-500">暂无数据</div>
      </div>
    );
  }

  // Prepare chart data
  const categoryData = Object.entries(insights.category_distribution).map(([category, count]) => ({
    category: category || '未分类',
    count,
  }));

  const activityData = insights.recent_activity.map((activity, index) => ({
    day: `${index + 1}天前`,
    prompts: activity.prompts_created,
    versions: activity.versions_created,
  }));

  const recommendationsByType = insights.recommendations.reduce((acc, rec) => {
    acc[rec.type] = (acc[rec.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recommendationData = Object.entries(recommendationsByType).map(([type, count]) => ({
    type: type === 'clarity' ? '清晰度' : 
          type === 'specificity' ? '具体性' :
          type === 'structure' ? '结构性' :
          type === 'efficiency' ? '效率' : '示例',
    count,
  }));

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">📊 AI 洞察仪表板</h2>
          <button
            onClick={loadInsights}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            🔄 刷新数据
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div className="text-sm opacity-90">总提示词数</div>
            <div className="text-2xl font-bold">{insights.total_prompts}</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <div className="text-sm opacity-90">平均长度</div>
            <div className="text-2xl font-bold">{Math.round(insights.avg_length)}</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <div className="text-sm opacity-90">分类数量</div>
            <div className="text-2xl font-bold">{categoryData.length}</div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
            <div className="text-sm opacity-90">待优化建议</div>
            <div className="text-2xl font-bold">{insights.recommendations.length}</div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Distribution */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📂 分类分布</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }: any) => `${category} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📈 近期活动</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="prompts"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="创建提示词"
                />
                <Area
                  type="monotone"
                  dataKey="versions"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="创建版本"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Optimization Recommendations */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🎯 优化建议类型</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={recommendationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Bar Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 分类统计</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">💡 智能优化建议</h3>
          <div className="space-y-3">
            {insights.recommendations.slice(0, 5).map((recommendation, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {recommendation.type === 'clarity' ? '💡 清晰度' : 
                         recommendation.type === 'specificity' ? '🎯 具体性' :
                         recommendation.type === 'structure' ? '🏗️ 结构性' :
                         recommendation.type === 'efficiency' ? '⚡ 效率' : '📝 示例'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        recommendation.impact === 'high' ? 'bg-red-100 text-red-700' :
                        recommendation.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {recommendation.impact === 'high' ? '高影响' :
                         recommendation.impact === 'medium' ? '中影响' : '低影响'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{recommendation.title}</h4>
                    <p className="text-gray-600 text-sm">{recommendation.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm text-gray-500">置信度</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {Math.round(recommendation.confidence * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {insights.recommendations.length > 5 && (
            <div className="text-center mt-4">
              <span className="text-sm text-gray-500">
                还有 {insights.recommendations.length - 5} 条建议...
              </span>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
            <div className="text-indigo-600 font-semibold">📚 内容质量</div>
            <div className="text-2xl font-bold text-indigo-800">
              {insights.total_prompts > 0 ? '良好' : '待改进'}
            </div>
            <div className="text-sm text-indigo-600 mt-1">
              基于 {insights.total_prompts} 个提示词分析
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
            <div className="text-emerald-600 font-semibold">🎯 分类覆盖</div>
            <div className="text-2xl font-bold text-emerald-800">
              {categoryData.length > 5 ? '丰富' : categoryData.length > 2 ? '适中' : '有限'}
            </div>
            <div className="text-sm text-emerald-600 mt-1">
              涵盖 {categoryData.length} 个分类
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
            <div className="text-amber-600 font-semibold">⚡ 优化潜力</div>
            <div className="text-2xl font-bold text-amber-800">
              {insights.recommendations.length > 10 ? '高' : 
               insights.recommendations.length > 5 ? '中' : '低'}
            </div>
            <div className="text-sm text-amber-600 mt-1">
              {insights.recommendations.length} 项待优化
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsDashboard;