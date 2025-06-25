import React, { useState } from 'react';
import { aiAPI } from '../services/api';
import type { PromptAnalysis, SimilarPrompt, PromptValidation } from '../types';

interface PromptOptimizerProps {
  content: string;
  onOptimized?: (optimizedContent: string) => void;
  className?: string;
}

const PromptOptimizer: React.FC<PromptOptimizerProps> = ({
  content,
  onOptimized,
  className = '',
}) => {
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null);
  const [validation, setValidation] = useState<PromptValidation | null>(null);
  const [optimizedContent, setOptimizedContent] = useState<string>('');
  const [similarPrompts, setSimilarPrompts] = useState<SimilarPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'validation' | 'suggestions' | 'similar' | 'optimized'>('analysis');
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  const analyzePrompt = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      const [analysisResult, validationResult, similarResult] = await Promise.all([
        aiAPI.analyzePrompt({ content }),
        aiAPI.validatePrompt({ content }),
        aiAPI.getSimilarPrompts({ content, limit: 5 }),
      ]);

      setAnalysis(analysisResult.data);
      setValidation(validationResult.data);
      setSimilarPrompts(similarResult.data.similar);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizePrompt = async () => {
    if (!analysis?.suggestions) return;

    const selectedSuggestionsArray = analysis.suggestions.filter((_, index) =>
      selectedSuggestions.has(index)
    );

    if (selectedSuggestionsArray.length === 0) {
      alert('请至少选择一个优化建议');
      return;
    }

    setLoading(true);
    try {
      const result = await aiAPI.optimizePrompt({
        content,
        suggestions: selectedSuggestionsArray,
      });

      setOptimizedContent(result.data.optimized);
      setActiveTab('optimized');
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const acceptOptimization = () => {
    if (optimizedContent && onOptimized) {
      onOptimized(optimizedContent);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">AI 提示词优化器</h3>
          <button
            onClick={analyzePrompt}
            disabled={loading || !content.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '分析中...' : '分析提示词'}
          </button>
        </div>

        {analysis && (
          <>
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'analysis', label: '分析结果' },
                  { id: 'validation', label: '有效性验证' },
                  { id: 'suggestions', label: '优化建议' },
                  { id: 'similar', label: '相似提示词' },
                  { id: 'optimized', label: '优化结果' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    {tab.id === 'validation' && validation && (
                      <span className={`ml-2 text-xs rounded-full px-2 py-0.5 ${
                        validation.isValid 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {validation.isValid ? '✓' : '✗'}
                      </span>
                    )}
                    {tab.id === 'suggestions' && analysis.suggestions.length > 0 && (
                      <span className="ml-2 bg-red-100 text-red-600 text-xs rounded-full px-2 py-0.5">
                        {analysis.suggestions.length}
                      </span>
                    )}
                    {tab.id === 'optimized' && optimizedContent && (
                      <span className="ml-2 bg-green-100 text-green-600 text-xs rounded-full px-2 py-0.5">
                        新
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-64">
              {activeTab === 'analysis' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
                        {analysis.score}
                      </div>
                      <div className="text-sm text-gray-600">综合评分</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {analysis.estimatedTokens}
                      </div>
                      <div className="text-sm text-gray-600">预估Token数</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {analysis.readabilityScore}
                      </div>
                      <div className="text-sm text-gray-600">可读性评分</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">优点</h4>
                      {analysis.strengths.length > 0 ? (
                        <ul className="space-y-1">
                          {analysis.strengths.map((strength, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start">
                              <span className="text-green-500 mr-2">✓</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">未发现明显优点</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-red-600 mb-2">需要改进</h4>
                      {analysis.weaknesses.length > 0 ? (
                        <ul className="space-y-1">
                          {analysis.weaknesses.map((weakness, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start">
                              <span className="text-red-500 mr-2">✗</span>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">未发现明显问题</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'validation' && (
                <div className="space-y-4">
                  {validation ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className={`text-2xl font-bold ${
                            validation.isValid ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {validation.isValid ? '✓ 有效' : '✗ 无效'}
                          </div>
                          <div className="text-sm text-gray-600">有效性状态</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className={`text-2xl font-bold ${getScoreColor(validation.score)}`}>
                            {validation.score}
                          </div>
                          <div className="text-sm text-gray-600">有效性评分</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-red-600 mb-2">发现的问题</h4>
                          {validation.issues.length > 0 ? (
                            <ul className="space-y-1">
                              {validation.issues.map((issue, index) => (
                                <li key={index} className="text-sm text-gray-700 flex items-start">
                                  <span className="text-red-500 mr-2">⚠</span>
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">未发现问题</p>
                          )}
                        </div>

                        <div>
                          <h4 className="font-medium text-blue-600 mb-2">改进建议</h4>
                          {validation.suggestions.length > 0 ? (
                            <ul className="space-y-1">
                              {validation.suggestions.map((suggestion, index) => (
                                <li key={index} className="text-sm text-gray-700 flex items-start">
                                  <span className="text-blue-500 mr-2">💡</span>
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">暂无建议</p>
                          )}
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg ${
                        validation.isValid 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            validation.isValid ? 'text-green-800' : 'text-red-800'
                          }`}>
                            验证结论:
                          </span>
                          <span className={`text-sm ${
                            validation.isValid ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {validation.isValid 
                              ? '该提示词结构合理，可以有效使用' 
                              : '该提示词存在问题，建议改进后使用'}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">验证数据未加载</p>
                  )}
                </div>
              )}

              {activeTab === 'suggestions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      优化建议 ({analysis.suggestions.length}个)
                    </h4>
                    {selectedSuggestions.size > 0 && (
                      <button
                        onClick={optimizePrompt}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading ? '优化中...' : `应用选中建议 (${selectedSuggestions.size})`}
                      </button>
                    )}
                  </div>

                  {analysis.suggestions.length > 0 ? (
                    <div className="space-y-3">
                      {analysis.suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedSuggestions.has(index)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleSuggestion(index)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedSuggestions.has(index)}
                                onChange={() => toggleSuggestion(index)}
                                className="text-blue-600"
                              />
                              <h5 className="font-medium text-gray-900">{suggestion.title}</h5>
                              <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(suggestion.impact)}`}>
                                {suggestion.impact === 'high' ? '高影响' : 
                                 suggestion.impact === 'medium' ? '中影响' : '低影响'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              置信度: {Math.round(suggestion.confidence * 100)}%
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{suggestion.description}</p>
                          {suggestion.suggestedText !== suggestion.originalText && (
                            <div className="text-xs bg-gray-100 p-2 rounded">
                              <strong>建议:</strong> {suggestion.suggestedText}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">暂无优化建议</p>
                  )}
                </div>
              )}

              {activeTab === 'similar' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">相似提示词</h4>
                  {similarPrompts.length > 0 ? (
                    <div className="space-y-3">
                      {similarPrompts.map((prompt, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{prompt.title}</h5>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              prompt.type === 'ai_suggestion' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {prompt.type === 'ai_suggestion' ? 'AI推荐' : '现有提示词'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{prompt.content}</p>
                          {prompt.category && (
                            <div className="mt-2">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {prompt.category}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">未找到相似提示词</p>
                  )}
                </div>
              )}

              {activeTab === 'optimized' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">优化结果</h4>
                    {optimizedContent && onOptimized && (
                      <button
                        onClick={acceptOptimization}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        使用优化版本
                      </button>
                    )}
                  </div>

                  {optimizedContent ? (
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">原始版本:</h5>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                          {content}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">优化版本:</h5>
                        <div className="p-3 bg-green-50 rounded-lg text-sm text-gray-700">
                          {optimizedContent}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">请先选择优化建议并生成优化版本</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {!analysis && !loading && content.trim() && (
          <div className="text-center py-8 text-gray-500">
            点击"分析提示词"按钮开始智能分析
          </div>
        )}

        {!content.trim() && (
          <div className="text-center py-8 text-gray-500">
            请输入提示词内容以开始分析
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptOptimizer;