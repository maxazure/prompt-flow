import React, { useState, useEffect } from 'react';
import { versionsAPI } from '../services/api';
import type { PromptVersion } from '../types';

interface VersionHistoryProps {
  promptId: number;
  currentVersion: number;
  onVersionSelect?: (version: PromptVersion) => void;
  onRevert?: (version: number) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  promptId,
  currentVersion,
  onVersionSelect,
  onRevert
}) => {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);

  useEffect(() => {
    loadVersions();
  }, [promptId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await versionsAPI.getVersionHistory(promptId);
      setVersions(data.versions);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionClick = async (version: PromptVersion) => {
    setSelectedVersion(version);
    onVersionSelect?.(version);
  };

  const handleRevert = async (version: number) => {
    if (window.confirm(`Are you sure you want to revert to version ${version}?`)) {
      onRevert?.(version);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading version history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={loadVersions}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Version History</h3>
        <span className="text-sm text-gray-500">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {versions.map((version) => (
          <div
            key={version.id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              version.version === currentVersion
                ? 'border-blue-500 bg-blue-50'
                : selectedVersion?.id === version.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleVersionClick(version)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  v{version.version}
                </span>
                {version.version === currentVersion && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Current
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {formatDate(version.createdAt)}
                </span>
                {version.version !== currentVersion && onRevert && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRevert(version.version);
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Revert
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2">
              <h4 className="font-medium text-gray-900">{version.title}</h4>
              {version.changeLog && (
                <p className="text-sm text-gray-600 mt-1">{version.changeLog}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                by {version.user?.username || 'Unknown'}
              </p>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              <p className="truncate">
                {version.content.length > 100
                  ? `${version.content.substring(0, 100)}...`
                  : version.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {versions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No version history found</p>
        </div>
      )}
    </div>
  );
};

export default VersionHistory;