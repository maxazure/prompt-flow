import React, { useState, useEffect } from 'react';
import { promptsAPI } from '../services/api';

interface Tag {
  name: string;
  count: number;
}

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
  maxDisplayTags?: number;
}

const TagFilter: React.FC<TagFilterProps> = ({
  selectedTags,
  onTagsChange,
  className = '',
  maxDisplayTags = 20,
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await promptsAPI.getTags();
      setTags(response.tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayTags = showAll ? filteredTags : filteredTags.slice(0, maxDisplayTags);
  const hasMoreTags = filteredTags.length > maxDisplayTags;

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter(tag => tag !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">加载标签中...</span>
        </div>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className={`${className}`}>
        <p className="text-sm text-gray-500 py-4">暂无可用标签</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          标签筛选 
          {selectedTags.length > 0 && (
            <span className="ml-1 text-xs text-blue-600">({selectedTags.length} 个已选)</span>
          )}
        </h3>
        {selectedTags.length > 0 && (
          <button
            onClick={clearAllTags}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            清除全部
          </button>
        )}
      </div>

      {/* Search */}
      {tags.length > 10 && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="搜索标签..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg">
          <div className="flex flex-wrap gap-1">
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
              >
                {tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags list */}
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {displayTags.map(tag => {
          const isSelected = selectedTags.includes(tag.name);
          return (
            <button
              key={tag.name}
              onClick={() => toggleTag(tag.name)}
              className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded transition-colors ${
                isSelected
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
              }`}
            >
              <span className="truncate">{tag.name}</span>
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                isSelected ? 'bg-blue-200' : 'bg-gray-200'
              }`}>
                {tag.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Show more/less button */}
      {hasMoreTags && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-2 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showAll ? '收起' : `显示更多 (+${filteredTags.length - maxDisplayTags})`}
        </button>
      )}

      {/* No results */}
      {searchTerm && filteredTags.length === 0 && (
        <p className="text-xs text-gray-500 py-2 text-center">
          没有找到包含 "{searchTerm}" 的标签
        </p>
      )}
    </div>
  );
};

export default TagFilter;