import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamsAPI } from '../services/api';
import { TeamRole } from '../types';
import type { Team, CreateTeamRequest, InviteMemberRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCategory } from '../context/CategoryContext';
import usePageTitle from '../hooks/usePageTitle';

const Teams: React.FC = () => {
  usePageTitle('Teams');
  
  const { user } = useAuth();
  const { selectedCategory, categories } = useCategory();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [createTeamData, setCreateTeamData] = useState<CreateTeamRequest>({
    name: '',
    description: '',
  });
  const [inviteData, setInviteData] = useState<InviteMemberRequest>({
    email: '',
    role: TeamRole.VIEWER,
  });

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await teamsAPI.getTeams();
      setTeams(response.teams);
    } catch (err) {
      setError('Failed to load teams');
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await teamsAPI.createTeam(createTeamData);
      setTeams([...teams, response.team]);
      setShowCreateModal(false);
      setCreateTeamData({ name: '', description: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create team');
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      await teamsAPI.inviteMember(selectedTeam.id, inviteData);
      setShowInviteModal(false);
      setInviteData({ email: '', role: TeamRole.VIEWER });
      loadTeams(); // Reload to get updated member list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to invite member');
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      await teamsAPI.deleteTeam(teamId);
      setTeams(teams.filter(team => team.id !== teamId));
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete team');
    }
  };

  const handleRemoveMember = async (teamId: number, memberId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await teamsAPI.removeMember(teamId, memberId);
      loadTeams(); // Reload to get updated member list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const getRoleColor = (role: TeamRole) => {
    switch (role) {
      case TeamRole.OWNER:
        return 'bg-purple-100 text-purple-800';
      case TeamRole.ADMIN:
        return 'bg-blue-100 text-blue-800';
      case TeamRole.EDITOR:
        return 'bg-green-100 text-green-800';
      case TeamRole.VIEWER:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageTeam = (team: Team) => {
    if (!user) return false;
    return team.ownerId === user.id || team.members?.some(
      member => member.userId === user.id && 
      (member.role === TeamRole.OWNER || member.role === TeamRole.ADMIN)
    );
  };

  const canDeleteTeam = (team: Team) => {
    if (!user) return false;
    return team.ownerId === user.id;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // 获取当前选中分类的显示名称
  const getSelectedCategoryName = () => {
    if (!selectedCategory) return '所有团队';
    const category = categories.find(cat => cat.id.toString() === selectedCategory);
    return category ? category.name : '所有团队';
  };

  return (
    <div className="px-6 py-6">
      {/* 面包屑导航 */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <a href="/" className="hover:text-blue-600">首页</a>
          </li>
          <li>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <span className="text-gray-900 font-medium">团队</span>
          </li>
          {selectedCategory && (
            <>
              <li>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li>
                <span className="text-blue-600 font-medium">{getSelectedCategoryName()}</span>
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedCategory ? `${getSelectedCategoryName()} 团队` : '团队管理'}
          </h1>
          <p className="text-gray-600">
            {selectedCategory 
              ? `管理 ${getSelectedCategoryName()} 分类下的团队`
              : '管理您的团队和协作成员'
            }
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          创建团队
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Teams List */}
        <div className="xl:col-span-1">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">我的团队</h3>
              {teams.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-gray-500 mb-4">暂无团队</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    创建您的第一个团队
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {teams.map(team => (
                    <div
                      key={team.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTeam?.id === team.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTeam(team)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{team.name}</h4>
                          {team.description && (
                            <p className="text-sm text-gray-500 mt-1">{team.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {team.members?.length || 0} 成员
                          </p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Link
                            to={`/teams/${team.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            查看详情
                          </Link>
                          {canDeleteTeam(team) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTeam(team.id);
                              }}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Delete
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
        </div>

        {/* Team Details */}
        <div className="xl:col-span-2">
          {selectedTeam ? (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedTeam.name}</h3>
                    {selectedTeam.description && (
                      <p className="text-gray-500 mt-1">{selectedTeam.description}</p>
                    )}
                  </div>
                  {canManageTeam(selectedTeam) && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                    >
                      邀请成员
                    </button>
                  )}
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">团队成员</h4>
                  {selectedTeam.members && selectedTeam.members.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTeam.members.map(member => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {member.user?.username?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {member.user?.username || 'Unknown User'}
                              </p>
                              <p className="text-sm text-gray-500">{member.user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                              {member.role}
                            </span>
                            {canManageTeam(selectedTeam) && member.role !== TeamRole.OWNER && (
                              <button
                                onClick={() => handleRemoveMember(selectedTeam.id, member.id)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">👤</div>
                      <p className="text-gray-500">暂无成员</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:p-6 text-center py-16">
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">选择团队</h3>
                <p className="text-gray-500">从左侧列表中选择一个团队查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">创建新团队</h3>
            </div>
            <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  团队名称 *
                </label>
                <input
                  type="text"
                  value={createTeamData.name}
                  onChange={(e) => setCreateTeamData({ ...createTeamData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  团队描述
                </label>
                <textarea
                  value={createTeamData.description}
                  onChange={(e) => setCreateTeamData({ ...createTeamData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  创建团队
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">邀请成员</h3>
            </div>
            <form onSubmit={handleInviteMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱地址 *
                </label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  角色
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as TeamRole })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={TeamRole.VIEWER}>查看者</option>
                  <option value={TeamRole.EDITOR}>编辑者</option>
                  <option value={TeamRole.ADMIN}>管理员</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  发送邀请
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;