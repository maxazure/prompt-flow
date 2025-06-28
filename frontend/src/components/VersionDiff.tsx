import type { PromptVersion } from '../types';

interface VersionDiffProps {
  currentVersion: PromptVersion;
  selectedVersion: PromptVersion;
  onClose: () => void;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

export const VersionDiff: React.FC<VersionDiffProps> = ({
  currentVersion,
  selectedVersion,
  onClose
}) => {
  const generateDiff = (oldContent: string, newContent: string): DiffLine[] => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diff: DiffLine[] = [];
    
    let i = 0, j = 0;
    
    while (i < oldLines.length || j < newLines.length) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[j] || '';
      
      if (i >= oldLines.length) {
        // Only new lines remaining
        diff.push({ type: 'added', content: newLine, lineNumber: j + 1 });
        j++;
      } else if (j >= newLines.length) {
        // Only old lines remaining
        diff.push({ type: 'removed', content: oldLine, lineNumber: i + 1 });
        i++;
      } else if (oldLine === newLine) {
        // Lines are the same
        diff.push({ type: 'unchanged', content: oldLine, lineNumber: j + 1 });
        i++;
        j++;
      } else {
        // Lines are different - show both
        diff.push({ type: 'removed', content: oldLine, lineNumber: i + 1 });
        diff.push({ type: 'added', content: newLine, lineNumber: j + 1 });
        i++;
        j++;
      }
    }
    
    return diff;
  };

  const contentDiff = generateDiff(selectedVersion.content, currentVersion.content);
  
  const getDiffLineClass = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-50 border-l-4 border-green-400';
      case 'removed':
        return 'bg-red-50 border-l-4 border-red-400';
      default:
        return 'bg-white';
    }
  };

  const getDiffLineIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <span className="text-green-600 font-mono">+</span>;
      case 'removed':
        return <span className="text-red-600 font-mono">-</span>;
      default:
        return <span className="text-gray-400 font-mono"> </span>;
    }
  };

  const hasChanges = contentDiff.some(line => line.type !== 'unchanged');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Version Comparison</h2>
            <p className="text-sm text-gray-600 mt-1">
              Comparing v{selectedVersion.version} with v{currentVersion.version} (current)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Version Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Version {selectedVersion.version} (Selected)
              </h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Title:</span> {selectedVersion.title}</p>
                <p><span className="font-medium">Created:</span> {new Date(selectedVersion.createdAt).toLocaleString()}</p>
                {selectedVersion.changeLog && (
                  <p><span className="font-medium">Changes:</span> {selectedVersion.changeLog}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Version {currentVersion.version} (Current)
              </h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Title:</span> {currentVersion.title}</p>
                <p><span className="font-medium">Created:</span> {new Date(currentVersion.createdAt).toLocaleString()}</p>
                {currentVersion.changeLog && (
                  <p><span className="font-medium">Changes:</span> {currentVersion.changeLog}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Diff */}
        <div className="flex-1 overflow-hidden">
          <div className="p-6">
            <h4 className="font-medium text-gray-900 mb-4">Content Changes</h4>
            
            {!hasChanges ? (
              <div className="text-center py-8 text-gray-500">
                <p>No content changes between these versions</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {contentDiff.map((line, index) => (
                    <div
                      key={index}
                      className={`${getDiffLineClass(line.type)} px-4 py-1 font-mono text-sm`}
                    >
                      <div className="flex items-start">
                        <span className="w-6 flex-shrink-0 text-center">
                          {getDiffLineIcon(line.type)}
                        </span>
                        <span className="w-12 flex-shrink-0 text-gray-400 text-right mr-4">
                          {line.lineNumber}
                        </span>
                        <span className="flex-1 whitespace-pre-wrap">
                          {line.content || ' '}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-200 border border-green-400 rounded mr-2"></div>
                <span>Added lines</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-200 border border-red-400 rounded mr-2"></div>
                <span>Removed lines</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionDiff;