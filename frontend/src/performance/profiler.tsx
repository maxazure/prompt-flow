// Performance profiler component for real-time monitoring
import React, { useState, useEffect, useCallback } from 'react';
import { getPerformanceMonitor } from './monitor';
import { MetricsCalculator } from './metrics';
import { useMemoryTracker, useInteractionTracker } from './hooks';
import { runCriticalBenchmarks } from './benchmarks';
import { runMemoryLeakTests } from './memoryLeakDetector';
import { runNetworkOptimizationTests } from './networkOptimizer';
import { runRerenderTests } from './reactProfiler';
import { runLargeDatasetTests } from './largeDatasetTester';

interface PerformanceProfilerProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
}

export const PerformanceProfiler: React.FC<PerformanceProfilerProps> = ({
  visible = false,
  position = 'bottom-right',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(visible);
  const [activeTab, setActiveTab] = useState<'overview' | 'memory' | 'network' | 'tests'>('overview');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const { memoryMetrics, memoryTrend, formattedMemoryUsage } = useMemoryTracker(2000);
  const { interactions, averageInteractionTime, slowInteractions } = useInteractionTracker();

  const [webVitals, setWebVitals] = useState({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    score: 0
  });

  useEffect(() => {
    const monitor = getPerformanceMonitor();
    const metrics = monitor.getPerformanceMetrics();
    const score = MetricsCalculator.calculateWebVitalsScore(metrics);
    
    setWebVitals({
      fcp: metrics.firstContentfulPaint,
      lcp: metrics.largestContentfulPaint,
      fid: metrics.firstInputDelay,
      cls: metrics.cumulativeLayoutShift,
      score
    });
  }, []);

  const runAllTests = useCallback(async () => {
    setIsRunningTests(true);
    setTestResults(null);
    
    try {
      console.log('🚀 Running comprehensive performance test suite...');
      
      const results = await Promise.all([
        runCriticalBenchmarks(),
        runMemoryLeakTests(),
        runNetworkOptimizationTests(),
        runRerenderTests(),
        runLargeDatasetTests()
      ]);

      setTestResults({
        benchmarks: results[0],
        memoryLeaks: results[1],
        networkOptimization: results[2],
        rerenderTests: results[3],
        datasetTests: results[4],
        timestamp: Date.now()
      });
      
      console.log('✅ Performance test suite completed');
    } catch (error) {
      console.error('❌ Performance test suite failed:', error);
    } finally {
      setIsRunningTests(false);
    }
  }, []);

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      fontFamily: 'monospace',
      fontSize: '12px'
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'bottom-right':
      default:
        return { ...baseStyles, bottom: '20px', right: '20px' };
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#4CAF50';
    if (score >= 75) return '#FF9800';
    return '#F44336';
  };

  if (!isOpen) {
    return (
      <div
        style={{
          ...getPositionStyles(),
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backgroundColor: getScoreColor(webVitals.score)
        }}
        onClick={() => setIsOpen(true)}
        title="Open Performance Profiler"
      >
        <span style={{ color: 'white', fontWeight: 'bold' }}>
          {Math.round(webVitals.score)}
        </span>
      </div>
    );
  }

  const renderOverviewTab = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>Performance Overview</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Web Vitals Score:</span>
          <span style={{ color: getScoreColor(webVitals.score), fontWeight: 'bold' }}>
            {Math.round(webVitals.score)}
          </span>
        </div>
        
        <div style={{ fontSize: '10px', color: '#666' }}>
          <div>FCP: {MetricsCalculator.formatTime(webVitals.fcp)}</div>
          <div>LCP: {MetricsCalculator.formatTime(webVitals.lcp)}</div>
          <div>FID: {MetricsCalculator.formatTime(webVitals.fid)}</div>
          <div>CLS: {webVitals.cls.toFixed(3)}</div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Memory Usage:</span>
          <span>{formattedMemoryUsage}</span>
        </div>
        {memoryTrend && (
          <div style={{ fontSize: '10px', color: '#666' }}>
            Trend: {memoryTrend.trend} ({(memoryTrend.growthRate * 100).toFixed(1)}%)
          </div>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Avg Interaction:</span>
          <span>{MetricsCalculator.formatTime(averageInteractionTime)}</span>
        </div>
        {slowInteractions.length > 0 && (
          <div style={{ fontSize: '10px', color: '#f44336' }}>
            {slowInteractions.length} slow interactions
          </div>
        )}
      </div>

      <button
        onClick={runAllTests}
        disabled={isRunningTests}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: isRunningTests ? '#ccc' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isRunningTests ? 'not-allowed' : 'pointer'
        }}
      >
        {isRunningTests ? 'Running Tests...' : 'Run Full Test Suite'}
      </button>
    </div>
  );

  const renderMemoryTab = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>Memory Monitoring</h3>
      
      {memoryMetrics.length > 0 && (
        <div>
          <div style={{ marginBottom: '8px' }}>
            <div>Current: {MetricsCalculator.formatBytes(memoryMetrics[memoryMetrics.length - 1].usedJSHeapSize)}</div>
            <div>Peak: {MetricsCalculator.formatBytes(Math.max(...memoryMetrics.map(m => m.usedJSHeapSize)))}</div>
          </div>
          
          {memoryTrend && (
            <div style={{ fontSize: '10px', color: '#666' }}>
              <div>Growth Rate: {(memoryTrend.growthRate * 100).toFixed(1)}%</div>
              <div>Trend: {memoryTrend.trend}</div>
              {memoryTrend.recommendations.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Recommendations:</strong>
                  {memoryTrend.recommendations.slice(0, 2).map((rec, i) => (
                    <div key={i} style={{ fontSize: '9px', marginTop: '2px' }}>• {rec}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderTestResults = () => {
    if (!testResults) return null;

    const { benchmarks, memoryLeaks, networkOptimization, rerenderTests, datasetTests } = testResults;
    
    return (
      <div style={{ padding: '16px', maxHeight: '300px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>Test Results</h3>
        
        <div style={{ marginBottom: '12px' }}>
          <strong>Benchmarks ({benchmarks.length}):</strong>
          <div style={{ fontSize: '10px', color: '#666' }}>
            Success: {benchmarks.filter((b: any) => b.success).length}/{benchmarks.length}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <strong>Memory Leaks ({memoryLeaks.length}):</strong>
          <div style={{ fontSize: '10px', color: '#666' }}>
            Leaks: {memoryLeaks.filter((l: any) => l.isLeakDetected).length}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <strong>Network Tests ({networkOptimization.length}):</strong>
          <div style={{ fontSize: '10px', color: '#666' }}>
            Avg Response: {(networkOptimization.reduce((sum: number, r: any) => sum + r.averageResponseTime, 0) / networkOptimization.length).toFixed(0)}ms
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <strong>Re-render Tests ({rerenderTests.length}):</strong>
          <div style={{ fontSize: '10px', color: '#666' }}>
            Avg Efficiency: {(rerenderTests.reduce((sum: number, r: any) => sum + r.rerenderEfficiency, 0) / rerenderTests.length).toFixed(1)}%
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <strong>Dataset Tests ({datasetTests.length}):</strong>
          <div style={{ fontSize: '10px', color: '#666' }}>
            Excellent: {datasetTests.filter((d: any) => d.performance === 'excellent').length}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ ...getPositionStyles(), width: compact ? '300px' : '400px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '1px solid #eee'
      }}>
        <span style={{ fontWeight: 'bold', color: '#333' }}>Performance</span>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
        {['overview', 'memory', 'tests'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              backgroundColor: activeTab === tab ? '#f0f0f0' : 'transparent',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ minHeight: '200px', maxHeight: '400px', overflowY: 'auto' }}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'memory' && renderMemoryTab()}
        {activeTab === 'tests' && renderTestResults()}
      </div>
    </div>
  );
};

// Hook to easily add performance profiler to any component
export const usePerformanceProfiler = (enabled: boolean = false) => {
  const [isVisible, setIsVisible] = useState(enabled);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P to toggle profiler
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return {
    ProfilerComponent: () => <PerformanceProfiler visible={isVisible} />,
    toggleProfiler: () => setIsVisible(prev => !prev),
    isVisible
  };
};