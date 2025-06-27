import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { promptsAPI, versionsAPI, aiAPI } from '../services/api';
import type { Prompt, PromptVersion, PromptAnalysis } from '../types';
import VersionHistory from '../components/VersionHistory';
import VersionDiff from '../components/VersionDiff';
import Comments from '../components/Comments';
import PromptOptimizer from '../components/PromptOptimizer';
import ParameterizedPromptModal from '../components/ParameterizedPromptModal';
import { useAuth } from '../context/AuthContext';
import { useCategory } from '../context/CategoryContext';
import usePageTitle from '../hooks/usePageTitle';
import { needsParameters } from '../utils/templateEngine';

const PromptDetail: React.FC = () => {
  usePageTitle('Prompt Details');
  
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getCategoryById } = useCategory();
  
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'versions' | 'comments' | 'optimize' | 'analyze'>('content');
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isParameterModalOpen, setIsParameterModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadPrompt(parseInt(id));
    }
  }, [id]);

  // 确保用户不能访问无权限的标签
  useEffect(() => {
    if (!prompt) return;
    
    // AI功能只对已登录用户可见
    if (!isAuthenticated && (activeTab === 'optimize' || activeTab === 'analyze')) {
      setActiveTab('content');
    }
    
    // Version History 和 Comments 需要公开提示词或已登录用户
    if (!prompt.isPublic && !isAuthenticated && (activeTab === 'versions' || activeTab === 'comments')) {
      setActiveTab('content');
    }
  }, [isAuthenticated, activeTab, prompt]);

  const loadPrompt = async (promptId: number) => {
    try {
      setLoading(true);
      const data = await promptsAPI.getPrompt(promptId);
      setPrompt(data.prompt);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load prompt');
    } finally {
      setLoading(false);
    }
  };

  const loadAIAnalysis = async () => {
    if (!prompt || !id) return;
    
    try {
      setAnalyzing(true);
      const response = await aiAPI.analyzePromptById(parseInt(id));
      if (response.success) {
        setAnalysis(response.data.analysis);
      }
    } catch (err) {
      console.error('Error loading AI analysis:', err);
      setError('Failed to load AI analysis. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleVersionSelect = (version: PromptVersion) => {
    setSelectedVersion(version);
    setShowDiff(true);
  };

  const handleCopyContent = async () => {
    if (!prompt?.content) return;
    
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // 2秒后隐藏成功提示
    } catch (err) {
      console.error('Failed to copy content:', err);
      // fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = prompt.content;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleRevert = async (version: number) => {
    if (!prompt || !user) return;
    
    try {
      setReverting(true);
      const changeLog = `Reverted to version ${version} via web interface`;
      await versionsAPI.revertToVersion(prompt.id, version, { changeLog });
      
      // Reload prompt to get updated data
      await loadPrompt(prompt.id);
      
      // Close diff if open
      setShowDiff(false);
      setSelectedVersion(null);
      
      // Switch to content tab to see changes
      setActiveTab('content');
      
      alert(`Successfully reverted to version ${version}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to revert version');
    } finally {
      setReverting(false);
    }
  };

  // 处理使用此提示词
  const handleUsePrompt = () => {
    setIsParameterModalOpen(true);
  };

  // 处理参数化模态框复制
  const handleParameterModalCopy = (_content: string) => {
    console.log('参数化内容已复制到剪贴板');
  };

  // 处理保存为新提示词 (未来功能)
  const handleSaveAsNew = async (content: string, parameters: Record<string, any>) => {
    console.log('保存为新提示词:', { content, parameters });
    alert('保存功能开发中...');
  };

  // 关闭参数化模态框
  const handleCloseParameterModal = () => {
    setIsParameterModalOpen(false);
  };

  const canEdit = prompt && user && prompt.userId === user.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">Loading prompt...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <h2 className="text-lg font-medium text-red-800 mb-2">Error Loading Prompt</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="px-6 py-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Prompt Not Found</h2>
          <p className="text-gray-600 mt-2">The prompt you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // 获取分类信息
  const getCategoryInfo = () => {
    if (prompt?.categoryId) {
      return getCategoryById(prompt.categoryId);
    }
    return null;
  };

  const categoryInfo = getCategoryInfo();

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
            <span className="text-gray-900 font-medium">提示词详情</span>
          </li>
          {prompt && (
            <>
              <li>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li>
                <span className="text-blue-600 font-medium truncate max-w-48">{prompt.title}</span>
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{prompt.title}</h1>
            
            {/* 分类信息显示 */}
            {categoryInfo && (
              <div className="flex items-center gap-3 mt-3 mb-2">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryInfo.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {categoryInfo.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {categoryInfo.scopeType === 'personal' && '👤 个人'}
                    {categoryInfo.scopeType === 'team' && '👥 团队'}
                    {categoryInfo.scopeType === 'public' && '🌍 公开'}
                  </span>
                </div>
                {categoryInfo.description && (
                  <span className="text-sm text-gray-600">
                    {categoryInfo.description}
                  </span>
                )}
              </div>
            )}
            
            {/* 兼容老的字符串分类 */}
            {!categoryInfo && prompt.category && (
              <div className="flex items-center gap-2 mt-3 mb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {prompt.category}
                </span>
                <span className="text-xs text-gray-500">(旧版分类)</span>
              </div>
            )}
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span>Version {prompt.version}</span>
              <span>•</span>
              <span>by {prompt.user?.username || 'Unknown'}</span>
              <span>•</span>
              <span>{new Date(prompt.updatedAt || '').toLocaleDateString()}</span>
              {prompt.isPublic && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Public
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 使用此提示词按钮 */}
            <button
              onClick={handleUsePrompt}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                needsParameters(prompt.content)
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              title={needsParameters(prompt.content) ? '填写参数使用此提示词' : '使用此提示词'}
            >
              {needsParameters(prompt.content) ? '使用此提示词' : '快速使用'}
            </button>
            
            {canEdit && (
              <button
                onClick={() => navigate(`/prompts/${prompt.id}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'content'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Content
          </button>
          {/* Version History - 公开提示词或已登录用户可见 */}
          {(prompt?.isPublic || isAuthenticated) && (
            <button
              onClick={() => setActiveTab('versions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'versions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Version History
            </button>
          )}
          {/* Comments - 公开提示词或已登录用户可见 */}
          {(prompt?.isPublic || isAuthenticated) && (
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Comments
            </button>
          )}
          {isAuthenticated && (
            <>
              <button
                onClick={() => setActiveTab('optimize')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'optimize'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                AI Optimization
              </button>
              <button
                onClick={() => {
                  setActiveTab('analyze');
                  if (!analysis && !analyzing) {
                    loadAIAnalysis();
                  }
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analyze'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 AI Analysis
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {prompt.description && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{prompt.description}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900">Content</h3>
              <button
                onClick={handleCopyContent}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md transition-colors ${
                  copySuccess
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                }`}
              >
                {copySuccess ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
                {prompt.content}
              </pre>
            </div>
          </div>

          {prompt.category && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Category</h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {prompt.category}
              </span>
            </div>
          )}

          {prompt.tags && prompt.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'versions' && (prompt?.isPublic || isAuthenticated) && (
        <div>
          <VersionHistory
            promptId={prompt.id}
            currentVersion={prompt.version}
            onVersionSelect={handleVersionSelect}
            onRevert={canEdit ? handleRevert : undefined}
          />
        </div>
      )}

      {activeTab === 'comments' && (prompt?.isPublic || isAuthenticated) && (
        <div>
          <Comments promptId={prompt.id} />
        </div>
      )}

      {activeTab === 'optimize' && isAuthenticated && (
        <div>
          <PromptOptimizer
            content={prompt.content}
            onOptimized={(optimizedContent) => {
              // Optionally, you could save the optimized version as a new version
              // or allow the user to copy it
              navigator.clipboard.writeText(optimizedContent);
              alert('优化内容已复制到剪贴板');
            }}
          />
        </div>
      )}

      {activeTab === 'analyze' && isAuthenticated && (
        <div className="space-y-6">
          {analyzing ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-lg">Analyzing prompt...</span>
            </div>
          ) : analysis ? (
            <div>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">📊 AI Analysis Report</h3>
                    <p className="mt-2 opacity-90">Deep analysis of your prompt quality and effectiveness</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{Math.round(analysis.score)}/100</div>
                    <div className="text-sm opacity-90">Overall Score</div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-blue-600 font-semibold">Quality Score</div>
                  <div className="text-2xl font-bold text-blue-800">{Math.round(analysis.score)}/100</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-green-600 font-semibold">Readability</div>
                  <div className="text-2xl font-bold text-green-800">{Math.round(analysis.readabilityScore)}/100</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-orange-600 font-semibold">Est. Tokens</div>
                  <div className="text-2xl font-bold text-orange-800">{analysis.estimatedTokens}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-purple-600 font-semibold">Suggestions</div>
                  <div className="text-2xl font-bold text-purple-800">{analysis.suggestions.length}</div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h4 className="text-lg font-semibold text-green-800 mb-4">✅ Strengths</h4>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span className="text-green-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                  <h4 className="text-lg font-semibold text-red-800 mb-4">⚠️ Areas for Improvement</h4>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span className="text-red-700">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Optimization Suggestions */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800">💡 Optimization Suggestions</h4>
                  <p className="text-gray-600 mt-1">AI-powered recommendations to improve your prompt</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                {suggestion.type === 'clarity' ? '💡 Clarity' :
                                 suggestion.type === 'specificity' ? '🎯 Specificity' :
                                 suggestion.type === 'structure' ? '🏗️ Structure' :
                                 suggestion.type === 'efficiency' ? '⚡ Efficiency' : '📝 Examples'}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                suggestion.impact === 'high' ? 'bg-red-100 text-red-700' :
                                suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {suggestion.impact === 'high' ? 'High Impact' :
                                 suggestion.impact === 'medium' ? 'Medium Impact' : 'Low Impact'}
                              </span>
                            </div>
                            <h5 className="font-semibold text-gray-900 mb-1">{suggestion.title}</h5>
                            <p className="text-gray-600 text-sm mb-3">{suggestion.description}</p>
                            
                            {suggestion.originalText && suggestion.suggestedText && (
                              <div className="bg-white border border-gray-200 rounded p-3">
                                <div className="mb-2">
                                  <div className="text-xs font-medium text-red-600 mb-1">Before:</div>
                                  <div className="text-sm text-gray-700 bg-red-50 p-2 rounded">
                                    {suggestion.originalText}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-green-600 mb-1">Suggested:</div>
                                  <div className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                                    {suggestion.suggestedText}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm text-gray-500">Confidence</div>
                            <div className="text-lg font-semibold text-blue-600">
                              {Math.round(suggestion.confidence * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={loadAIAnalysis}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  🔄 Re-analyze
                </button>
                <button
                  onClick={() => setActiveTab('optimize')}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  🚀 Optimize Prompt
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">No analysis available</div>
              <button
                onClick={loadAIAnalysis}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
              >
                📊 Analyze This Prompt
              </button>
            </div>
          )}
        </div>
      )}

      {/* Version Diff Modal */}
      {showDiff && selectedVersion && (
        <VersionDiff
          currentVersion={{
            id: 0, // This would be the current version ID in a real scenario
            promptId: prompt.id,
            version: prompt.version,
            title: prompt.title,
            content: prompt.content,
            description: prompt.description,
            category: prompt.category,
            tags: prompt.tags,
            userId: prompt.userId,
            createdAt: prompt.updatedAt || new Date().toISOString(),
            updatedAt: prompt.updatedAt || new Date().toISOString(),
            user: prompt.user
          }}
          selectedVersion={selectedVersion}
          onClose={() => setShowDiff(false)}
        />
      )}

      {/* Loading overlay when reverting */}
      {reverting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span>Reverting to selected version...</span>
          </div>
        </div>
      )}

      {/* 参数化提示词模态框 */}
      {prompt && (
        <ParameterizedPromptModal
          prompt={prompt}
          isOpen={isParameterModalOpen}
          onClose={handleCloseParameterModal}
          onCopy={handleParameterModalCopy}
          onSaveAsNew={handleSaveAsNew}
        />
      )}
    </div>
  );
};

export default PromptDetail;