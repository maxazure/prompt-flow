import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Prompt, Project } from '../types';
import { TagParser } from '../utils/tagParser';

interface ProjectPromptCardProps {
  prompt: Prompt;
  project?: Project;
  onCopy: (prompt: Prompt, project?: Project) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onUse: (prompt: Prompt) => void;
  className?: string;
}

const ProjectPromptCard: React.FC<ProjectPromptCardProps> = ({
  prompt,
  project,
  onCopy,
  onEdit,
  onDelete,
  onUse,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 解析模板获取参数信息
  const content = prompt.content || '';
  let templateInfo;
  let isParameterized = false;
  let parameterCount = 0;
  
  try {
    templateInfo = TagParser.parseTemplate(content);
    isParameterized = templateInfo.isParameterized;
    parameterCount = templateInfo.tags.length;
  } catch (error) {
    // 处理解析错误，使用默认值
    templateInfo = { content, tags: [], isParameterized: false };
    isParameterized = false;
    parameterCount = 0;
  }
  
  // 内容截断逻辑
  const contentTooLong = content.length > 200;
  const displayContent = contentTooLong && !isExpanded 
    ? content.substring(0, 200) + '...'
    : content;

  const handleCardClick = (e: React.MouseEvent) => {
    // 避免在点击操作按钮时触发卡片点击
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onUse(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onUse(prompt);
    }
  };

  return (
    <article
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`提示词: ${prompt.title}${project ? ` - 项目: ${project.name}` : ''}`}
    >
      {/* 头部信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {prompt.title}
            </h3>
            
            {/* 编号标识 */}
            {prompt.promptNumber && (
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {prompt.promptNumber}
              </span>
            )}
            
            {/* 参数化标识 */}
            {isParameterized && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                参数化
              </span>
            )}
            
            {/* 分类可见标识 */}
            {prompt.showInCategory && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                分类可见
              </span>
            )}
            
            {/* 公开标识 */}
            {prompt.isPublic && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                公开
              </span>
            )}
          </div>
          
          {/* 项目信息 */}
          {project && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span>项目:</span>
              <Link 
                to={`/projects/${project.id}`}
                className="text-blue-600 hover:text-blue-800 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {project.name}
              </Link>
            </div>
          )}
          
          {/* 描述 */}
          {prompt.description && (
            <p className="text-gray-600 text-sm mb-3">
              {prompt.description}
            </p>
          )}
        </div>
        
        {/* 操作按钮组 */}
        <div className="flex items-center space-x-1 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUse(prompt);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="使用提示词"
            aria-label="使用提示词"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-8 4h8m2-10V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(prompt, project);
            }}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="复制（包含项目背景）"
            aria-label="复制提示词"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(prompt);
            }}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="编辑"
            aria-label="编辑提示词"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(prompt);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="删除"
            aria-label="删除提示词"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* 提示词内容 */}
      <div className="mb-3">
        <div className={`bg-gray-50 p-3 rounded text-sm text-gray-700 ${!isExpanded && contentTooLong ? 'line-clamp-3' : ''}`}>
          {displayContent}
        </div>
        
        {/* 展开/收起按钮 */}
        {contentTooLong && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            {isExpanded ? '收起' : '展开'}
          </button>
        )}
      </div>
      
      {/* 参数信息 */}
      {isParameterized && (
        <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
          <div className="flex items-center gap-1 text-blue-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            <span>{parameterCount}个参数</span>
          </div>
        </div>
      )}
      
      {/* 标签 */}
      {prompt.tags && prompt.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {prompt.tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {/* 底部信息 */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <span>版本 {prompt.version}</span>
          {prompt.user && (
            <span>作者: {prompt.user.username}</span>
          )}
        </div>
        <span>
          {prompt.updatedAt ? new Date(prompt.updatedAt).toLocaleDateString() : ''}
        </span>
      </div>
    </article>
  );
};

export default ProjectPromptCard;