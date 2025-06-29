import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/MainLayout';
import LazyPromptEditor from '../components/LazyPromptEditor';
import { promptsAPI, versionsAPI } from '../services/api';
import type { CreatePromptRequest, Prompt } from '../types';
import usePageTitle from '../hooks/usePageTitle';

const EditPrompt: React.FC = () => {
  usePageTitle('Edit Prompt');
  
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState<Prompt | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load prompt data
  useEffect(() => {
    const loadPrompt = async () => {
      if (!id || !isAuthenticated) return;

      try {
        setLoading(true);
        setError('');
        
        const response = await promptsAPI.getPrompt(parseInt(id));
        const promptData = response.prompt;
        
        // Check if user owns this prompt
        if (promptData.userId !== user?.id) {
          setError('You can only edit your own prompts');
          return;
        }
        
        setPrompt(promptData);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Prompt not found');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to edit this prompt');
        } else {
          setError('Failed to load prompt');
        }
      } finally {
        setLoading(false);
      }
    };

    loadPrompt();
  }, [id, isAuthenticated, user?.id]);

  const handleSave = async (data: CreatePromptRequest) => {
    if (!id || !prompt) return;

    try {
      setSaveLoading(true);
      setError('');
      
      // Check if content has actually changed
      const hasContentChanged = 
        data.title !== prompt.title ||
        data.content !== prompt.content ||
        data.description !== prompt.description ||
        data.category !== prompt.category ||
        JSON.stringify(data.tags) !== JSON.stringify(prompt.tags) ||
        data.isPublic !== prompt.isPublic;

      if (hasContentChanged) {
        // Create a new version with the changes
        await versionsAPI.createVersion(parseInt(id), {
          title: data.title,
          content: data.content,
          description: data.description,
          category: data.category,
          tags: data.tags,
          changeLog: 'Updated via editor'
        });
      } else {
        // If only metadata changed, update directly
        await promptsAPI.updatePrompt(parseInt(id), data);
      }
      
      // Navigate back to prompt detail
      navigate(`/prompts/${id}`, {
        state: { message: 'Prompt updated successfully!' }
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update prompt');
      throw err; // Re-throw to let PromptEditor handle it
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/prompts/${id}`);
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading prompt...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error && !prompt) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-red-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Cannot Edit Prompt</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!prompt) {
    return null;
  }

  return (
    <MainLayout>
      <div className="py-6">
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error updating prompt</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <LazyPromptEditor
          initialData={{
            title: prompt.title,
            content: prompt.content,
            description: prompt.description || '',
            category: prompt.category || '',
            categoryId: prompt.categoryId,
            tags: prompt.tags || [],
            isPublic: prompt.isPublic,
          }}
          onSave={handleSave}
          onCancel={handleCancel}
          isEditing={true}
          loading={saveLoading}
        />
      </div>
    </MainLayout>
  );
};

export default EditPrompt;