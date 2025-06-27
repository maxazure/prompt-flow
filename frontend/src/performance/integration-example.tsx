// Example integration of performance monitoring in PromptFlow application
import React, { useEffect, useState } from 'react';
import { getPerformanceMonitor } from './monitor';
import { PerformanceProfiler, usePerformanceProfiler } from './profiler';
import { useMemoryTracker, usePerformanceMonitor, useInteractionTracker } from './hooks';
import { withPerformanceProfiler } from './reactProfiler';
import { generatePerformanceReport } from './reporter';

// Example: Enhanced App component with performance monitoring
export const PerformanceEnhancedApp: React.FC = () => {
  const { ProfilerComponent, toggleProfiler } = usePerformanceProfiler(
    process.env.NODE_ENV === 'development'
  );

  useEffect(() => {
    // Initialize performance monitoring on app start
    const monitor = getPerformanceMonitor({
      enableMemoryMonitoring: true,
      enableNetworkMonitoring: true,
      enableRenderMonitoring: true,
      memoryCheckInterval: 10000, // 10 seconds
      reportingEndpoint: process.env.VITE_PERFORMANCE_ENDPOINT
    });

    // Generate performance report every 5 minutes in production
    if (process.env.NODE_ENV === 'production') {
      const interval = setInterval(async () => {
        try {
          await generatePerformanceReport({
            destination: 'api',
            endpoint: process.env.VITE_PERFORMANCE_ENDPOINT
          });
        } catch (error) {
          console.warn('Failed to send performance report:', error);
        }
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }

    return () => monitor.dispose();
  }, []);

  return (
    <div className="app">
      {/* Your app content here */}
      <main>
        <h1>PromptFlow Application</h1>
        <p>Performance monitoring is active</p>
      </main>

      {/* Performance profiler - only visible in development or when toggled */}
      <ProfilerComponent />
    </div>
  );
};

// Example: Performance-monitored component
export const MonitoredPromptEditor: React.FC<{ content: string; onChange: (content: string) => void }> = ({ 
  content, 
  onChange 
}) => {
  const { renderCount, lastRenderTime } = usePerformanceMonitor('PromptEditor');
  const { trackInteraction } = useInteractionTracker();
  const [isSlowRender, setIsSlowRender] = useState(false);

  useEffect(() => {
    setIsSlowRender(lastRenderTime > 16); // 60fps budget
  }, [lastRenderTime]);

  const handleContentChange = (newContent: string) => {
    const endTracking = trackInteraction('input', 'prompt-editor');
    onChange(newContent);
    endTracking();
  };

  return (
    <div className="prompt-editor">
      {process.env.NODE_ENV === 'development' && (
        <div className="performance-info" style={{ 
          fontSize: '12px', 
          color: isSlowRender ? 'red' : 'gray',
          marginBottom: '8px'
        }}>
          Renders: {renderCount} | Last: {lastRenderTime.toFixed(2)}ms
          {isSlowRender && ' ⚠️ Slow render'}
        </div>
      )}
      
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        className="w-full h-40 p-4 border rounded"
        placeholder="Enter your prompt here..."
      />
    </div>
  );
};

// Example: Enhanced version with performance profiling
export const ProfiledPromptEditor = withPerformanceProfiler(
  MonitoredPromptEditor,
  'PromptEditor'
);

// Example: Memory-intensive component with monitoring
export const LargeDataTable: React.FC<{ data: any[] }> = ({ data }) => {
  const { memoryMetrics, memoryTrend, formattedMemoryUsage } = useMemoryTracker(5000);
  const { renderCount } = usePerformanceMonitor('LargeDataTable');

  // Warn if memory usage is high
  useEffect(() => {
    if (memoryTrend?.trend === 'growing' && memoryTrend.growthRate > 0.2) {
      console.warn('🚨 Memory leak detected in LargeDataTable', {
        trend: memoryTrend.trend,
        growthRate: `${(memoryTrend.growthRate * 100).toFixed(1)}%`,
        currentUsage: formattedMemoryUsage
      });
    }
  }, [memoryTrend, formattedMemoryUsage]);

  return (
    <div className="large-data-table">
      {process.env.NODE_ENV === 'development' && (
        <div className="memory-info" style={{ 
          fontSize: '12px', 
          color: 'gray',
          marginBottom: '8px'
        }}>
          Memory: {formattedMemoryUsage} | Renders: {renderCount}
          {memoryTrend?.trend === 'growing' && ` | ⚠️ Growing ${(memoryTrend.growthRate * 100).toFixed(1)}%`}
        </div>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Title</th>
            <th className="border p-2">Content</th>
            <th className="border p-2">Category</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id || index}>
              <td className="border p-2">{item.id}</td>
              <td className="border p-2">{item.title}</td>
              <td className="border p-2">{item.content?.substring(0, 100)}...</td>
              <td className="border p-2">{item.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Example: Network-intensive component with monitoring
export const NetworkMonitoredSearchResults: React.FC<{ query: string }> = ({ query }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;

    const searchPrompts = async () => {
      setLoading(true);
      setNetworkError(null);
      const startTime = performance.now();

      try {
        // This request will be automatically monitored by the performance monitor
        const response = await fetch(`/api/prompts/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Log slow searches
        if (duration > 1000) {
          console.warn(`🐌 Slow search detected: ${duration.toFixed(2)}ms for query "${query}"`);
        }

        setResults(data.results || []);
      } catch (error) {
        setNetworkError(error instanceof Error ? error.message : 'Search failed');
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchPrompts, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="search-results">
      {loading && <div className="text-gray-500">Searching...</div>}
      {networkError && (
        <div className="text-red-500 mb-4">
          Network Error: {networkError}
        </div>
      )}
      
      <div className="results">
        {results.map((result: any) => (
          <div key={result.id} className="border p-4 mb-2 rounded">
            <h3 className="font-bold">{result.title}</h3>
            <p className="text-gray-600">{result.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Example: Performance testing utilities for development
export const PerformanceTestingTools: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runPerformanceTests = async () => {
    setIsRunning(true);
    setTestResults(null);

    try {
      // Import test modules dynamically to avoid bundle bloat
      const [
        { runCriticalBenchmarks },
        { runMemoryLeakTests },
        { runNetworkOptimizationTests },
        { runLargeDatasetTests },
        { runBundleAnalysis }
      ] = await Promise.all([
        import('./benchmarks'),
        import('./memoryLeakDetector'),
        import('./networkOptimizer'),
        import('./largeDatasetTester'),
        import('./bundleAnalyzer')
      ]);

      console.log('🚀 Running comprehensive performance test suite...');

      const [benchmarks, memoryTests, networkTests, datasetTests, bundleAnalysis] = await Promise.all([
        runCriticalBenchmarks(),
        runMemoryLeakTests(),
        runNetworkOptimizationTests(),
        runLargeDatasetTests(),
        runBundleAnalysis()
      ]);

      setTestResults({
        benchmarks,
        memoryTests,
        networkTests,
        datasetTests,
        bundleAnalysis,
        timestamp: Date.now()
      });

      console.log('✅ Performance test suite completed');
    } catch (error) {
      console.error('❌ Performance test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = async () => {
    const { downloadPerformanceReport } = await import('./reporter');
    await downloadPerformanceReport('html');
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Don't show in production
  }

  return (
    <div className="performance-testing-tools p-4 border rounded bg-gray-50">
      <h3 className="text-lg font-bold mb-4">Performance Testing Tools</h3>
      
      <div className="space-x-4 mb-4">
        <button
          onClick={runPerformanceTests}
          disabled={isRunning}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {isRunning ? 'Running Tests...' : 'Run Performance Tests'}
        </button>
        
        <button
          onClick={downloadReport}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Download Report
        </button>
      </div>

      {testResults && (
        <div className="test-results">
          <h4 className="font-bold mb-2">Test Results:</h4>
          <div className="text-sm space-y-2">
            <div>
              <strong>Benchmarks:</strong> {testResults.benchmarks?.length || 0} tests
              {testResults.benchmarks && (
                <span className="ml-2 text-gray-600">
                  ({testResults.benchmarks.filter((b: any) => b.success).length} passed)
                </span>
              )}
            </div>
            
            <div>
              <strong>Memory Tests:</strong> {testResults.memoryTests?.length || 0} tests
              {testResults.memoryTests && (
                <span className="ml-2 text-gray-600">
                  ({testResults.memoryTests.filter((t: any) => t.isLeakDetected).length} leaks detected)
                </span>
              )}
            </div>
            
            <div>
              <strong>Network Tests:</strong> {testResults.networkTests?.length || 0} tests
              {testResults.networkTests && (
                <span className="ml-2 text-gray-600">
                  (avg: {(testResults.networkTests.reduce((sum: number, t: any) => sum + t.averageResponseTime, 0) / testResults.networkTests.length).toFixed(0)}ms)
                </span>
              )}
            </div>
            
            <div>
              <strong>Dataset Tests:</strong> {testResults.datasetTests?.length || 0} tests
              {testResults.datasetTests && (
                <span className="ml-2 text-gray-600">
                  ({testResults.datasetTests.filter((t: any) => t.performance === 'excellent').length} excellent)
                </span>
              )}
            </div>
            
            {testResults.bundleAnalysis && (
              <div>
                <strong>Bundle Size:</strong> {(testResults.bundleAnalysis.totalSize / (1024 * 1024)).toFixed(2)} MB
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Example usage in main App component:
/*
import { PerformanceEnhancedApp, PerformanceTestingTools } from './performance/integration-example';

function App() {
  return (
    <PerformanceEnhancedApp>
      <Routes>
        // Your routes here
      </Routes>
      
      {process.env.NODE_ENV === 'development' && <PerformanceTestingTools />}
    </PerformanceEnhancedApp>
  );
}
*/