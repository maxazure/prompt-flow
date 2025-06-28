import { useNavigate } from 'react-router-dom';
import { useCategory } from '../context/CategoryContext';

// =====================================================
// CreatePromptButton Component - 新建提示词按钮
// =====================================================

/**
 * CreatePromptButton - 右上角新建提示词按钮组件
 * 
 * 功能特性:
 * - 🎯 基于左侧选中分类创建提示词
 * - 📝 未选中分类时默认放入"未分类"(ID: 1)
 * - 🎨 优雅的按钮设计和交互效果
 * - 📱 响应式设计
 */
const CreatePromptButton: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCategory } = useCategory();

  const handleCreatePrompt = () => {
    // 构建创建提示词的URL参数
    const params = new URLSearchParams();
    
    // 如果有选中的分类，使用选中的分类；否则使用默认的"未分类"(ID: 1)
    const targetCategoryId = selectedCategory || '1';
    params.set('categoryId', targetCategoryId);
    
    // 导航到创建页面并传递分类参数
    navigate(`/create?${params.toString()}`);
  };

  return (
    <button
      onClick={handleCreatePrompt}
      className="inline-flex items-center gap-2 px-4 py-2 
                 bg-gradient-to-r from-blue-600 to-blue-700 
                 text-white text-sm font-medium rounded-lg
                 hover:from-blue-700 hover:to-blue-800 
                 active:from-blue-800 active:to-blue-900
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 transition-all duration-200 ease-in-out
                 shadow-sm hover:shadow-md
                 transform hover:scale-105 active:scale-95"
      title={selectedCategory 
        ? `在选中分类中创建新提示词` 
        : `在未分类中创建新提示词`
      }
    >
      <svg 
        className="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 4v16m8-8H4" 
        />
      </svg>
      <span className="hidden sm:inline">新建提示词</span>
      <span className="sm:hidden">新建</span>
    </button>
  );
};

export default CreatePromptButton;