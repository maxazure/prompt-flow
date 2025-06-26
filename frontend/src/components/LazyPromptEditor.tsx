import React, { Suspense, lazy } from 'react';
import type { CreatePromptRequest } from '../types';

interface PromptEditorProps {
  initialData?: Partial<CreatePromptRequest>;
  onSave: (data: CreatePromptRequest) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

// 懒加载 Monaco 编辑器组件
const PromptEditor = lazy(() => import('./PromptEditor'));

// 编辑器加载中的占位组件
const EditorLoadingPlaceholder: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Loading Editor...
        </h2>
      </div>
      
      <div className="p-6 space-y-6">
        {/* 表单字段占位符 */}
        <div className="space-y-4">
          <div>
            <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
          
          <div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-24 bg-gray-100 rounded"></div>
          </div>
          
          <div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
        </div>
        
        {/* 编辑器占位符 */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center" style={{ height: '400px' }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">Loading Monaco Editor...</p>
              <p className="text-gray-400 text-xs mt-1">This may take a moment</p>
            </div>
          </div>
        </div>
        
        {/* 按钮占位符 */}
        <div className="flex justify-end space-x-3">
          <div className="h-10 bg-gray-200 rounded w-20"></div>
          <div className="h-10 bg-blue-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  </div>
);

const LazyPromptEditor: React.FC<PromptEditorProps> = (props) => {
  return (
    <Suspense fallback={<EditorLoadingPlaceholder />}>
      <PromptEditor {...props} />
    </Suspense>
  );
};

export default LazyPromptEditor;