import React, { useState, useEffect } from 'react';
import { commentsAPI } from '../services/api';
import type { Comment, CreateCommentRequest, UpdateCommentRequest } from '../types';
import { useAuth } from '../context/AuthContext';

interface CommentsProps {
  promptId: number;
}

const Comments: React.FC<CommentsProps> = ({ promptId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    loadComments();
  }, [promptId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentsAPI.getComments(promptId);
      setComments(response.comments);
    } catch (err) {
      setError('Failed to load comments');
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const commentData: CreateCommentRequest = {
        promptId,
        content: newComment.trim(),
      };

      await commentsAPI.createComment(commentData);
      setNewComment('');
      loadComments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create comment');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyTo) return;

    try {
      const replyData: CreateCommentRequest = {
        promptId,
        content: replyText.trim(),
        parentId: replyTo,
      };

      await commentsAPI.createComment(replyData);
      setReplyText('');
      setReplyTo(null);
      loadComments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create reply');
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editText.trim()) return;

    try {
      const updateData: UpdateCommentRequest = {
        content: editText.trim(),
      };

      await commentsAPI.updateComment(commentId, updateData);
      setEditingComment(null);
      setEditText('');
      loadComments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsAPI.deleteComment(commentId);
      loadComments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  const handleResolveComment = async (commentId: number) => {
    try {
      await commentsAPI.resolveComment(commentId);
      loadComments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resolve comment');
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const canEdit = user && comment.userId === user.id;
    const canResolve = user && !comment.parentId; // Only top-level comments can be resolved

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} mb-4`}
      >
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-900">
                  {comment.user?.username || 'Unknown User'}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  {formatDate(comment.createdAt)}
                </span>
                {comment.isResolved && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Resolved
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {canResolve && !comment.isResolved && (
                <button
                  onClick={() => handleResolveComment(comment.id)}
                  className="text-green-600 hover:text-green-700 text-sm"
                >
                  Resolve
                </button>
              )}
              {canEdit && (
                <>
                  <button
                    onClick={() => startEdit(comment)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {editingComment === comment.id ? (
            <div className="space-y-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditComment(comment.id)}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-700 mb-3">{comment.content}</p>
              {!isReply && user && (
                <button
                  onClick={() => setReplyTo(comment.id)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm"
                >
                  Reply
                </button>
              )}
            </>
          )}

          {/* Reply Form */}
          {replyTo === comment.id && (
            <form onSubmit={handleReply} className="mt-4 space-y-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                required
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyText('');
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Reply
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Comments ({comments.length})
        </h3>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* New Comment Form - 只对已登录用户显示 */}
        {user ? (
          <form onSubmit={handleCreateComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
              rows={3}
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Post Comment
            </button>
          </div>
        </form>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
            <p className="text-gray-600">
              <span className="text-gray-500">Please </span>
              <span className="text-indigo-600 font-medium">log in</span>
              <span className="text-gray-500"> to post comments</span>
            </p>
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
        ) : (
          <div className="space-y-4">
            {comments
              .filter(comment => !comment.parentId) // Only show top-level comments
              .map(comment => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comments;