import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LazyPromptEditor from '../components/LazyPromptEditor';
import { promptsAPI } from '../services/api';
import type { CreatePromptRequest } from '../types';
import usePageTitle from '../hooks/usePageTitle';

const CreatePrompt: React.FC = () => {
  usePageTitle('Create Prompt');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialData, setInitialData] = useState<Partial<CreatePromptRequest> | undefined>();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // 处理URL参数
  useEffect(() => {
    // 从URL参数获取categoryId
    const categoryIdParam = searchParams.get('categoryId');
    const categoryId = categoryIdParam ? parseInt(categoryIdParam) : undefined;
    
    if (categoryId) {
      // 设置默认数据
      setInitialData({
        categoryId: categoryId,
        isPublic: false
      });
    }
  }, [searchParams]);

  const handleSave = async (data: CreatePromptRequest) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await promptsAPI.createPrompt(data);
      
      // Navigate to the created prompt
      navigate(`/prompts/${response.prompt.id}`, {
        state: { message: 'Prompt created successfully!' }
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create prompt');
      throw err; // Re-throw to let PromptEditor handle it
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Ask for confirmation if there's unsaved content
    const draft = localStorage.getItem('prompt-editor-draft');
    if (draft) {
      const hasContent = JSON.parse(draft);
      if (hasContent.title || hasContent.content) {
        const confirmLeave = window.confirm(
          'You have unsaved changes. Are you sure you want to leave?'
        );
        if (!confirmLeave) return;
      }
    }
    
    // Clear draft and navigate back
    localStorage.removeItem('prompt-editor-draft');
    navigate('/dashboard');
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error creating prompt</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <LazyPromptEditor
        onSave={handleSave}
        onCancel={handleCancel}
        loading={loading}
        initialData={initialData}
      />
    </div>
  );
};

export default CreatePrompt;