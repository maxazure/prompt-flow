import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { projectsAPI } from '../services/api';
import type { Project, Prompt } from '../types';
import usePageTitle from '../hooks/usePageTitle';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { loadProject, updateProject } = useProject();
  const [project, setProject] = useState<Project | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [createPromptData, setCreatePromptData] = useState({
    title: '',
    content: '',
    description: '',
    showInCategory: false
  });
  const [editProjectData, setEditProjectData] = useState({
    name: '',
    description: '',
    background: '',
    isPublic: false
  });

  usePageTitle(project ? `项目: ${project.name}` : '项目详情');

  useEffect(() => {
    if (id) {
      loadProjectData();
      loadProjectPrompts();
    }
  }, [id]);

  useEffect(() => {
    if (project) {
      setEditProjectData({
        name: project.name,
        description: project.description || '',
        background: project.background,
        isPublic: project.isPublic
      });
    }
  }, [project]);

  const loadProjectData = async () => {
    const projectData = await loadProject(Number(id));
    if (projectData) {
      setProject(projectData);
    } else {
      setError('加载项目失败');
    }
  };

  const loadProjectPrompts = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getProjectPrompts(Number(id));
      if (response.success) {
        setPrompts(response.data);
      }
    } catch (err: any) {
      setError('加载项目提示词失败');
      console.error('Load project prompts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createPromptData.title.trim() || !createPromptData.content.trim()) {
      return;
    }

    try {
      const response = await projectsAPI.addPromptToProject(Number(id), {
        title: createPromptData.title.trim(),
        content: createPromptData.content.trim(),
        description: createPromptData.description.trim() || undefined,
        showInCategory: createPromptData.showInCategory
      });

      if (response.success) {
        setShowCreatePrompt(false);
        setCreatePromptData({ title: '', content: '', description: '', showInCategory: false });
        await loadProjectPrompts();
      }
    } catch (err: any) {
      setError('创建提示词失败');
      console.error('Create prompt error:', err);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProjectData.name.trim() || !editProjectData.background.trim()) {
      return;
    }

    const updatedProject = await updateProject(Number(id), {
      name: editProjectData.name.trim(),
      description: editProjectData.description.trim() || undefined,
      background: editProjectData.background.trim(),
      isPublic: editProjectData.isPublic
    });

    if (updatedProject) {
      setShowEditProject(false);
      setProject(updatedProject);
    } else {
      setError('更新项目失败');
    }
  };

  const handleCopyPrompt = async (prompt: Prompt) => {
    if (!project) return;

    try {
      const response = await projectsAPI.copyProjectPrompt(project.id, prompt.id);
      if (response.success) {
        // Copy to clipboard
        await navigator.clipboard.writeText(response.data.combinedContent);
        // Show success message (you might want to add a toast notification)
        alert('提示词已复制到剪贴板！');
      }
    } catch (err: any) {
      console.error('Copy prompt error:', err);
      alert('复制失败');
    }
  };

  const handleDeletePrompt = async (promptId: number) => {
    if (!project || !confirm('确定要删除这个提示词吗？')) return;

    try {
      await projectsAPI.removePromptFromProject(project.id, promptId);
      await loadProjectPrompts();
    } catch (err: any) {
      setError('删除提示词失败');
      console.error('Delete prompt error:', err);
    }
  };

  const filteredPrompts = prompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProjectTypeInfo = () => {
    if (!project) return { label: '', color: '' };
    if (project.isPublic) return { label: '公开项目', color: 'bg-green-100 text-green-800' };
    if (project.teamId) return { label: '团队项目', color: 'bg-purple-100 text-purple-800' };
    return { label: '个人项目', color: 'bg-blue-100 text-blue-800' };
  };

  if (loading && !project) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">加载项目中...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">项目不存在或无权访问</p>
        <Link
          to="/projects"
          className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          返回项目列表
        </Link>
      </div>
    );
  }

  const typeInfo = getProjectTypeInfo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
            </div>
            {project.description && (
              <p className="text-gray-600 mb-4">{project.description}</p>
            )}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-sm text-gray-700">
                <span className="font-medium">项目背景:</span> {project.background}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 ml-6">
            {project.userId === user?.id && (
              <button
                onClick={() => setShowEditProject(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                编辑项目
              </button>
            )}
            <button
              onClick={() => setShowCreatePrompt(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建提示词
            </button>
          </div>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">提示词总数</p>
              <p className="text-2xl font-bold text-gray-900">{prompts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">分类可见</p>
              <p className="text-2xl font-bold text-gray-900">
                {prompts.filter(p => p.showInCategory).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">最后更新</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(project.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Prompt Modal */}
      {showCreatePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">新建项目提示词</h2>
              <button
                onClick={() => setShowCreatePrompt(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreatePrompt} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  提示词标题 *
                </label>
                <input
                  type="text"
                  value={createPromptData.title}
                  onChange={(e) => setCreatePromptData({ ...createPromptData, title: e.target.value })}
                  placeholder="输入提示词标题"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  提示词内容 *
                </label>
                <textarea
                  value={createPromptData.content}
                  onChange={(e) => setCreatePromptData({ ...createPromptData, content: e.target.value })}
                  placeholder="输入提示词内容"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={createPromptData.description}
                  onChange={(e) => setCreatePromptData({ ...createPromptData, description: e.target.value })}
                  placeholder="描述这个提示词的用途"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showInCategory"
                  checked={createPromptData.showInCategory}
                  onChange={(e) => setCreatePromptData({ ...createPromptData, showInCategory: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showInCategory" className="ml-2 block text-sm text-gray-700">
                  在分类中显示（同时可以通过分类筛选找到）
                </label>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  📝 <strong>提示：</strong>创建后会自动分配编号（如 P{project.id}-001），复制时会自动包含项目背景。
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreatePrompt(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  创建提示词
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">编辑项目</h2>
              <button
                onClick={() => setShowEditProject(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  项目名称 *
                </label>
                <input
                  type="text"
                  value={editProjectData.name}
                  onChange={(e) => setEditProjectData({ ...editProjectData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  项目描述
                </label>
                <textarea
                  value={editProjectData.description}
                  onChange={(e) => setEditProjectData({ ...editProjectData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  项目背景 *
                </label>
                <textarea
                  value={editProjectData.background}
                  onChange={(e) => setEditProjectData({ ...editProjectData, background: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsPublic"
                  checked={editProjectData.isPublic}
                  onChange={(e) => setEditProjectData({ ...editProjectData, isPublic: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="editIsPublic" className="ml-2 block text-sm text-gray-700">
                  公开项目
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditProject(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  保存更改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prompts Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">项目提示词</h2>
          <div className="text-sm text-gray-600">
            {filteredPrompts.length} of {prompts.length} 提示词
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="搜索提示词..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Prompts List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">
              {prompts.length === 0 ? "项目中还没有提示词" : "没有匹配的提示词"}
            </p>
            {prompts.length === 0 && (
              <button
                onClick={() => setShowCreatePrompt(true)}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                创建第一个提示词
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrompts.map((prompt) => (
              <div key={prompt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{prompt.title}</h3>
                      {prompt.promptNumber && (
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {prompt.promptNumber}
                        </span>
                      )}
                      {prompt.showInCategory && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          分类可见
                        </span>
                      )}
                    </div>
                    
                    {prompt.description && (
                      <p className="text-gray-600 text-sm mb-3">{prompt.description}</p>
                    )}
                    
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 line-clamp-3">
                      {prompt.content}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                      <span>版本 {prompt.version}</span>
                      <span>{new Date(prompt.updatedAt || '').toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleCopyPrompt(prompt)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      title="复制（包含项目背景）"
                    >
                      复制
                    </button>
                    <Link
                      to={`/prompts/${prompt.id}`}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      查看
                    </Link>
                    {prompt.userId === user?.id && (
                      <button
                        onClick={() => handleDeletePrompt(prompt.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                        title="从项目中移除"
                      >
                        移除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;