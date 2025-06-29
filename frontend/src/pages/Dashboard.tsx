import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCategory } from '../context/CategoryContext';
import { promptsAPI } from '../services/api';
import type { Prompt } from '../types';
import usePageTitle from '../hooks/usePageTitle';

interface DashboardStats {
  totalPrompts: number;
  privatePrompts: number;
  publicPrompts: number;
  totalVersions: number;
  totalCategories: number;
  personalCategories: number;
  teamCategories: number;
  publicCategories: number;
}

const Dashboard: React.FC = () => {
  usePageTitle('Dashboard');
  
  const { user } = useAuth();
  const { categories, refreshCategories } = useCategory();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPrompts: 0,
    privatePrompts: 0,
    publicPrompts: 0,
    totalVersions: 0,
    totalCategories: 0,
    personalCategories: 0,
    teamCategories: 0,
    publicCategories: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserPrompts();
    refreshCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove refreshCategories dependency to prevent infinite loop

  // 重新计算统计数据当categories或prompts改变时
  useEffect(() => {
    if (prompts.length > 0 || categories.length > 0) {
      calculateStats(prompts);
    }
  }, [prompts, categories]);

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

  const calculateStats = (userPrompts: Prompt[]) => {
    // 分类统计
    const totalCategories = categories.length;
    const personalCategories = categories.filter(cat => cat.scopeType === 'personal').length;
    const teamCategories = categories.filter(cat => cat.scopeType === 'team').length;
    const publicCategories = categories.filter(cat => cat.scopeType === 'public').length;

    const stats: DashboardStats = {
      totalPrompts: userPrompts.length,
      privatePrompts: userPrompts.filter(p => !p.isPublic).length,
      publicPrompts: userPrompts.filter(p => p.isPublic).length,
      totalVersions: userPrompts.reduce((sum, p) => sum + (p.version || 1), 0),
      totalCategories,
      personalCategories,
      teamCategories,
      publicCategories
    };
    setStats(stats);
  };


  const recentPrompts = prompts
    .sort((a, b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              欢迎回来，{user?.username}!
            </h1>
            <p className="text-gray-600 mt-2">
              概览您的提示词统计和系统使用情况
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/my-prompts"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              我的提示词
            </Link>
            <Link
              to="/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              新建提示词
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总提示词数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPrompts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 13-3 3-3-3" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">公开提示词</p>
              <p className="text-2xl font-bold text-gray-900">{stats.publicPrompts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">私有提示词</p>
              <p className="text-2xl font-bold text-gray-900">{stats.privatePrompts}</p>
            </div>
          </div>
        </div>


        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总版本数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVersions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">分类统计</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">总分类数</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalCategories}</p>
              </div>
              <div className="p-2 bg-blue-200 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">👤 个人分类</p>
                <p className="text-2xl font-bold text-green-900">{stats.personalCategories}</p>
              </div>
              <div className="p-2 bg-green-200 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">👥 团队分类</p>
                <p className="text-2xl font-bold text-purple-900">{stats.teamCategories}</p>
              </div>
              <div className="p-2 bg-purple-200 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">🌍 公开分类</p>
                <p className="text-2xl font-bold text-orange-900">{stats.publicCategories}</p>
              </div>
              <div className="p-2 bg-orange-200 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/create"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">新建提示词</p>
              <p className="text-xs text-gray-600">创建新的提示词</p>
            </div>
          </Link>

          <Link
            to="/my-prompts"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">我的提示词</p>
              <p className="text-xs text-gray-600">管理所有提示词</p>
            </div>
          </Link>

          <Link
            to="/projects"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">项目管理</p>
              <p className="text-xs text-gray-600">管理项目和团队</p>
            </div>
          </Link>

          <button
            onClick={loadUserPrompts}
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">刷新数据</p>
              <p className="text-xs text-gray-600">更新仪表盘数据</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      {recentPrompts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">最近活动</h2>
          <div className="space-y-4">
            {recentPrompts.map((prompt) => (
              <div key={prompt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-900">{prompt.title}</p>
                    <p className="text-sm text-gray-600">
                      更新于 {new Date(prompt.updatedAt || '').toLocaleDateString('zh-CN')} • v{prompt.version}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/prompts/${prompt.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  查看
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;