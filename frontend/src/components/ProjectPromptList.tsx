import React, { useState, useMemo, useCallback } from 'react';
import type { Prompt, Project } from '../types';
import ProjectPromptCard from './ProjectPromptCard';
import { TagParser } from '../utils/tagParser';

interface ProjectPromptListProps {
  prompts: Prompt[];
  project?: Project;
  loading?: boolean;
  onCopy: (prompt: Prompt, project?: Project) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onUse: (prompt: Prompt) => void;
  onCreateNew: () => void;
  onSearch?: (term: string) => void;
}

type FilterType = '全部' | '参数化' | '非参数化' | '分类可见' | '公开';
type SortType = 'updated' | 'created' | 'title';

const ProjectPromptList: React.FC<ProjectPromptListProps> = ({
  prompts,
  project,
  loading = false,
  onCopy,
  onEdit,
  onDelete,
  onUse,
  onCreateNew,
  onSearch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('全部');
  const [sortType] = useState<SortType>('updated');
  const [sortAsc, setSortAsc] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedPrompts, setSelectedPrompts] = useState<Set<number>>(new Set());

  // 搜索防抖
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  }, [onSearch]);

  // 过滤和排序提示词
  const filteredAndSortedPrompts = useMemo(() => {
    let filtered = prompts.filter(prompt => {
      // 跳过损坏的提示词数据
      if (!prompt || typeof prompt !== 'object') {
        return false;
      }
      // 基本搜索过滤
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesTitle = prompt.title?.toLowerCase().includes(searchLower);
        const matchesDescription = prompt.description?.toLowerCase().includes(searchLower);
        const matchesContent = prompt.content?.toLowerCase().includes(searchLower);
        
        if (!matchesTitle && !matchesDescription && !matchesContent) {
          return false;
        }
      }

      // 类型过滤
      if (filterType !== '全部') {
        const content = prompt.content || '';
        let isParameterized = false;
        
        try {
          const templateInfo = TagParser.parseTemplate(content);
          isParameterized = templateInfo.isParameterized;
        } catch (error) {
          // 忽略解析错误，将其视为非参数化
          isParameterized = false;
        }
        
        switch (filterType) {
          case '参数化':
            if (!isParameterized) return false;
            break;
          case '非参数化':
            if (isParameterized) return false;
            break;
          case '分类可见':
            if (!prompt.showInCategory) return false;
            break;
          case '公开':
            if (!prompt.isPublic) return false;
            break;
        }
      }

      return true;
    });

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortType) {
        case 'updated':
          comparison = new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime();
          break;
        case 'created':
          comparison = new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
      }
      
      return sortAsc ? -comparison : comparison;
    });

    return filtered;
  }, [prompts, searchTerm, filterType, sortType, sortAsc]);

  // 批量操作
  const handleBatchSelect = (promptId: number, selected: boolean) => {
    const newSelected = new Set(selectedPrompts);
    if (selected) {
      newSelected.add(promptId);
    } else {
      newSelected.delete(promptId);
    }
    setSelectedPrompts(newSelected);
  };

  const handleBatchSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedPrompts(new Set(filteredAndSortedPrompts.map(p => p.id)));
    } else {
      setSelectedPrompts(new Set());
    }
  };

  const handleBatchDelete = () => {
    selectedPrompts.forEach(promptId => {
      const prompt = prompts.find(p => p.id === promptId);
      if (prompt) {
        onDelete(prompt);
      }
    });
    setSelectedPrompts(new Set());
    setBatchMode(false);
  };

  const handleBatchCopy = () => {
    selectedPrompts.forEach(promptId => {
      const prompt = prompts.find(p => p.id === promptId);
      if (prompt) {
        onCopy(prompt, project);
      }
    });
  };

  // 响应式网格类
  const gridCols = typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3';

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div 
      className="space-y-6"
      role="region"
      aria-label="项目提示词列表"
    >
      {/* 头部工具栏 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">项目提示词</h2>
            <p className="text-gray-600 text-sm">{filteredAndSortedPrompts.length} 个提示词</p>
          </div>
          <button
            onClick={onCreateNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建提示词
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索提示词..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="全部">全部</option>
              <option value="参数化">参数化</option>
              <option value="非参数化">非参数化</option>
              <option value="分类可见">分类可见</option>
              <option value="公开">公开</option>
            </select>
            
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="排序方式"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${sortAsc ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <button
              onClick={() => setBatchMode(!batchMode)}
              className={`px-3 py-2 border rounded-lg transition-colors ${
                batchMode 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              批量操作
            </button>
          </div>
        </div>

        {/* 批量操作工具栏 */}
        {batchMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedPrompts.size === filteredAndSortedPrompts.length && filteredAndSortedPrompts.length > 0}
                    onChange={(e) => handleBatchSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">
                    全选 ({selectedPrompts.size} 已选择)
                  </span>
                </label>
              </div>
              
              {selectedPrompts.size > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleBatchCopy}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    批量复制
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    批量删除
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 提示词列表 */}
      {filteredAndSortedPrompts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">
            {prompts.length === 0 ? "项目中还没有提示词" : "没有匹配的提示词"}
          </p>
          {prompts.length === 0 && (
            <button
              onClick={onCreateNew}
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              创建第一个提示词
            </button>
          )}
        </div>
      ) : (
        <div 
          className={`grid gap-6 ${gridCols}`}
          data-testid="prompts-container"
        >
          {filteredAndSortedPrompts.map((prompt) => (
            <div key={prompt.id} className="relative">
              {batchMode && (
                <div className="absolute top-4 right-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedPrompts.has(prompt.id)}
                    onChange={(e) => handleBatchSelect(prompt.id, e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 bg-white shadow-sm"
                  />
                </div>
              )}
              <ProjectPromptCard
                prompt={prompt}
                project={project}
                onCopy={onCopy}
                onEdit={onEdit}
                onDelete={onDelete}
                onUse={onUse}
                className={batchMode ? 'pr-12' : ''}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectPromptList;