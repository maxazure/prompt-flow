import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teamsAPI, promptsAPI } from '../services/api';
import type { Team, Prompt } from '../types';
import { useAuth } from '../context/AuthContext';


interface TeamDetailProps {
  className?: string;
}

const TeamDetail: React.FC<TeamDetailProps> = ({ className = '' }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [teamPrompts, setTeamPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'prompts' | 'members' | 'settings'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  useEffect(() => {
    if (id) {
      loadTeamDetail();
    }
  }, [id]);

  const loadTeamDetail = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await teamsAPI.getTeam(parseInt(id));
      if (response.team) {
        setTeam(response.team);
        setEditForm({
          name: response.team.name,
          description: response.team.description || '',
        });
        
        // Load team prompts (assuming there's a way to filter by team)
        // For now, we'll load user prompts as a placeholder
        const promptsResponse = await promptsAPI.getMyPrompts();
        setTeamPrompts(promptsResponse.prompts.slice(0, 10)); // Show first 10 as example
      }
    } catch (err) {
      console.error('Error loading team detail:', err);
      setError('Failed to load team details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!team || !id) return;
    
    try {
      const response = await teamsAPI.updateTeam(parseInt(id), editForm);
      if (response.team) {
        setTeam(response.team);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating team:', err);
      setError('Failed to update team. Please try again.');
    }
  };

  const handleDeleteTeam = async () => {
    if (!team || !id) return;
    
    if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      try {
        await teamsAPI.deleteTeam(parseInt(id));
        navigate('/teams');
      } catch (err) {
        console.error('Error deleting team:', err);
        setError('Failed to delete team. Please try again.');
      }
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!team || !id) return;
    
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await teamsAPI.removeMember(parseInt(id), memberId);
        loadTeamDetail(); // Reload to get updated member list
      } catch (err) {
        console.error('Error removing member:', err);
        setError('Failed to remove member. Please try again.');
      }
    }
  };

  const handleRoleChange = async (memberId: number, newRole: string) => {
    if (!team || !id) return;
    
    try {
      await teamsAPI.updateMemberRole(parseInt(id), memberId, { role: newRole as any });
      loadTeamDetail(); // Reload to get updated member list
    } catch (err) {
      console.error('Error updating member role:', err);
      setError('Failed to update member role. Please try again.');
    }
  };

  const canEdit = team && user && (team.ownerId === user.id || team.members?.some(m => m.userId === user.id && ['owner', 'admin'].includes(m.role)));
  const canDelete = team && user && team.ownerId === user.id;

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="animate-pulse p-6">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">⚠️ {error || 'Team not found'}</div>
          <button
            onClick={() => navigate('/teams')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            返回团队列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/teams')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← 返回
            </button>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="text-2xl font-bold border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              )}
              {isEditing ? (
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="text-gray-600 border border-gray-300 rounded px-2 py-1 w-full mt-1"
                  rows={2}
                />
              ) : (
                <p className="text-gray-600">{team.description || '暂无描述'}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {canEdit && (
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleUpdateTeam}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    编辑团队
                  </button>
                )}
              </>
            )}
            
            {canDelete && !isEditing && (
              <button
                onClick={handleDeleteTeam}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                删除团队
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {['overview', 'prompts', 'members', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'overview' && '📋 概览'}
              {tab === 'prompts' && '📝 提示词'}
              {tab === 'members' && '👥 成员'}
              {tab === 'settings' && '⚙️ 设置'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-blue-600 font-semibold">总成员数</div>
                <div className="text-2xl font-bold text-blue-800">
                  {(team.members?.length || 0) + 1}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-green-600 font-semibold">团队提示词</div>
                <div className="text-2xl font-bold text-green-800">
                  {teamPrompts.length}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-purple-600 font-semibold">创建时间</div>
                <div className="text-sm font-medium text-purple-800">
                  {new Date(team.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    团队创建于 {new Date(team.createdAt).toLocaleDateString()}
                  </div>
                  {team.members?.slice(0, 3).map((member, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      {member.user?.username || 'User'} 加入了团队
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prompts' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">团队提示词</h3>
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                创建提示词
              </button>
            </div>
            
            {teamPrompts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamPrompts.map((prompt) => (
                  <div key={prompt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="font-semibold text-gray-900 mb-2">{prompt.title}</h4>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{prompt.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{prompt.category}</span>
                      <span>{new Date(prompt.createdAt || '').toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">暂无团队提示词</div>
                <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">
                  创建第一个提示词
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">团队成员</h3>
              {canEdit && (
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  邀请成员
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {/* Team Owner */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                      {team.owner?.username?.[0]?.toUpperCase() || 'O'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{team.owner?.username || 'Owner'}</div>
                      <div className="text-sm text-gray-600">{team.owner?.email || ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium">
                      👑 所有者
                    </span>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              {team.members?.map((member, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold">
                        {(member.user?.username || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{member.user?.username || 'Unknown User'}</div>
                        <div className="text-sm text-gray-600">{member.user?.email || ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {canEdit ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="viewer">👁️ 查看者</option>
                          <option value="editor">✏️ 编辑者</option>
                          <option value="admin">🔧 管理员</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          member.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          member.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.role === 'admin' ? '🔧 管理员' :
                           member.role === 'editor' ? '✏️ 编辑者' : '👁️ 查看者'}
                        </span>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-500 hover:text-red-700 px-2 py-1"
                        >
                          移除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!team.members || team.members.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">暂无其他成员</div>
                  {canEdit && (
                    <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">
                      邀请第一个成员
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">团队设置</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    团队名称
                  </label>
                  <input
                    type="text"
                    value={team.name}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    团队描述
                  </label>
                  <textarea
                    value={team.description || ''}
                    disabled={!canEdit}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    可见性
                  </label>
                  <select
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                  >
                    <option value="private">🔒 私有团队</option>
                    <option value="public">🌐 公开团队</option>
                  </select>
                </div>
              </div>
            </div>

            {canDelete && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-red-600 mb-2">危险操作</h4>
                <p className="text-gray-600 mb-4">
                  删除团队将永久移除所有团队数据，包括成员关系和团队提示词。此操作无法撤销。
                </p>
                <button
                  onClick={handleDeleteTeam}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  删除团队
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;