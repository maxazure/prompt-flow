// Performance testing suite
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getPerformanceMonitor } from '../monitor';
import { MetricsCalculator } from '../metrics';
import { MemoryLeakDetector } from '../memoryLeakDetector';
import { NetworkOptimizer } from '../networkOptimizer';
import { BundleAnalyzer } from '../bundleAnalyzer';

describe('Performance Monitor', () => {
  let monitor: ReturnType<typeof getPerformanceMonitor>;

  beforeEach(() => {
    monitor = getPerformanceMonitor({
      enableMemoryMonitoring: true,
      enableNetworkMonitoring: true,
      enableRenderMonitoring: true,
      memoryCheckInterval: 1000
    });
  });

  afterEach(() => {
    monitor.dispose();
  });

  it('should collect performance metrics', () => {
    const metrics = monitor.getPerformanceMetrics();
    
    expect(metrics).toHaveProperty('loadTime');
    expect(metrics).toHaveProperty('firstContentfulPaint');
    expect(metrics).toHaveProperty('largestContentfulPaint');
    expect(metrics).toHaveProperty('firstInputDelay');
    expect(metrics).toHaveProperty('cumulativeLayoutShift');
    expect(metrics).toHaveProperty('timeToInteractive');
    expect(metrics).toHaveProperty('totalBlockingTime');
  });

  it('should track memory metrics', () => {
    const memoryMetrics = monitor.getMemoryMetrics();
    expect(Array.isArray(memoryMetrics)).toBe(true);
  });

  it('should track network metrics', () => {
    const networkMetrics = monitor.getNetworkMetrics();
    expect(Array.isArray(networkMetrics)).toBe(true);
  });
});

describe('MetricsCalculator', () => {
  it('should calculate Web Vitals score', () => {
    const mockMetrics = {
      loadTime: 1500,
      firstContentfulPaint: 1200,
      largestContentfulPaint: 2000,
      firstInputDelay: 80,
      cumulativeLayoutShift: 0.05,
      timeToInteractive: 3000,
      totalBlockingTime: 150
    };

    const score = MetricsCalculator.calculateWebVitalsScore(mockMetrics);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should analyze memory trends', () => {
    const mockMemoryMetrics = [
      { usedJSHeapSize: 10000000, totalJSHeapSize: 20000000, jsHeapSizeLimit: 100000000, timestamp: Date.now() - 5000 },
      { usedJSHeapSize: 12000000, totalJSHeapSize: 22000000, jsHeapSizeLimit: 100000000, timestamp: Date.now() - 4000 },
      { usedJSHeapSize: 14000000, totalJSHeapSize: 24000000, jsHeapSizeLimit: 100000000, timestamp: Date.now() - 3000 },
      { usedJSHeapSize: 16000000, totalJSHeapSize: 26000000, jsHeapSizeLimit: 100000000, timestamp: Date.now() - 2000 },
      { usedJSHeapSize: 18000000, totalJSHeapSize: 28000000, jsHeapSizeLimit: 100000000, timestamp: Date.now() - 1000 }
    ];

    const trend = MetricsCalculator.analyzeMemoryTrend(mockMemoryMetrics);
    expect(trend).toHaveProperty('trend');
    expect(trend).toHaveProperty('growthRate');
    expect(trend).toHaveProperty('averageUsage');
    expect(trend).toHaveProperty('peakUsage');
    expect(trend).toHaveProperty('recommendations');
    expect(trend.trend).toBe('growing');
  });

  it('should analyze network performance', () => {
    const mockNetworkMetrics = [
      { url: '/api/test1', method: 'GET', duration: 200, responseSize: 1024, status: 200, timestamp: Date.now() },
      { url: '/api/test2', method: 'POST', duration: 300, responseSize: 2048, status: 201, timestamp: Date.now() },
      { url: '/api/test3', method: 'GET', duration: 150, responseSize: 512, status: 200, timestamp: Date.now() },
      { url: '/api/test4', method: 'GET', duration: 2000, responseSize: 10240, status: 200, timestamp: Date.now() }, // Slow request
      { url: '/api/test5', method: 'GET', duration: 100, responseSize: 256, status: 500, timestamp: Date.now() } // Failed request
    ];

    const analysis = MetricsCalculator.analyzeNetworkPerformance(mockNetworkMetrics);
    expect(analysis).toHaveProperty('averageResponseTime');
    expect(analysis).toHaveProperty('slowestRequests');
    expect(analysis).toHaveProperty('totalDataTransferred');
    expect(analysis).toHaveProperty('failureRate');
    expect(analysis).toHaveProperty('recommendations');
    
    expect(analysis.slowestRequests.length).toBeGreaterThan(0);
    expect(analysis.failureRate).toBeGreaterThan(0);
  });

  it('should format bytes correctly', () => {
    expect(MetricsCalculator.formatBytes(0)).toBe('0 Bytes');
    expect(MetricsCalculator.formatBytes(1024)).toBe('1 KB');
    expect(MetricsCalculator.formatBytes(1048576)).toBe('1 MB');
    expect(MetricsCalculator.formatBytes(1073741824)).toBe('1 GB');
  });

  it('should format time correctly', () => {
    expect(MetricsCalculator.formatTime(500)).toBe('500ms');
    expect(MetricsCalculator.formatTime(1000)).toBe('1.00s');
    expect(MetricsCalculator.formatTime(1500)).toBe('1.50s');
  });
});

describe('MemoryLeakDetector', () => {
  let detector: MemoryLeakDetector;

  beforeEach(() => {
    detector = new MemoryLeakDetector();
  });

  afterEach(() => {
    detector.clearHistory();
  });

  it('should create memory leak test', async () => {
    const mockTest = {
      name: 'Test Component Leak',
      description: 'Tests for memory leaks in test component',
      component: 'TestComponent',
      iterations: 10,
      memoryThreshold: 5,
      setup: async () => {},
      action: async () => {},
      cleanup: async () => {}
    };

    const report = await detector.runMemoryLeakTest(mockTest);
    
    expect(report).toHaveProperty('testName');
    expect(report).toHaveProperty('component');
    expect(report).toHaveProperty('memoryGrowth');
    expect(report).toHaveProperty('memoryGrowthPercentage');
    expect(report).toHaveProperty('isLeakDetected');
    expect(report).toHaveProperty('severity');
    expect(report).toHaveProperty('recommendations');
    expect(report.testName).toBe(mockTest.name);
  });
});

describe('NetworkOptimizer', () => {
  let optimizer: NetworkOptimizer;

  beforeEach(() => {
    optimizer = new NetworkOptimizer();
  });

  afterEach(() => {
    optimizer.clearCache();
    optimizer.clearMetrics();
  });

  it('should run network optimization test', async () => {
    const mockTest = {
      name: 'API Response Test',
      description: 'Tests API response times',
      url: '/api/test',
      method: 'GET' as const,
      iterations: 5,
      expectedResponseTime: 200
    };

    const report = await optimizer.runNetworkOptimizationTest(mockTest);
    
    expect(report).toHaveProperty('testName');
    expect(report).toHaveProperty('url');
    expect(report).toHaveProperty('totalRequests');
    expect(report).toHaveProperty('successfulRequests');
    expect(report).toHaveProperty('averageResponseTime');
    expect(report).toHaveProperty('throughput');
    expect(report).toHaveProperty('recommendations');
    expect(report.testName).toBe(mockTest.name);
    expect(report.totalRequests).toBe(mockTest.iterations);
  });

  it('should track cache statistics', () => {
    const stats = optimizer.getCacheStats();
    
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('hitRate');
    expect(stats).toHaveProperty('entries');
    expect(Array.isArray(stats.entries)).toBe(true);
  });
});

describe('BundleAnalyzer', () => {
  it('should analyze bundle size', async () => {
    const analysis = await BundleAnalyzer.analyzeBundleSize();
    
    expect(analysis).toHaveProperty('totalSize');
    expect(analysis).toHaveProperty('chunks');
    expect(analysis).toHaveProperty('duplicates');
    expect(analysis).toHaveProperty('largeDependencies');
    expect(Array.isArray(analysis.chunks)).toBe(true);
    expect(Array.isArray(analysis.duplicates)).toBe(true);
    expect(Array.isArray(analysis.largeDependencies)).toBe(true);
  });

  it('should generate optimization recommendations', async () => {
    const mockAnalysis = {
      totalSize: 2 * 1024 * 1024, // 2MB
      chunks: [
        { name: 'vendor', size: 800 * 1024, gzipSize: 240 * 1024, modules: ['react', 'react-dom'] },
        { name: 'main', size: 500 * 1024, gzipSize: 150 * 1024, modules: ['app'] },
        { name: 'monaco', size: 700 * 1024, gzipSize: 210 * 1024, modules: ['monaco-editor'] }
      ],
      duplicates: [
        { module: 'lodash', instances: 2, totalSize: 100 * 1024 }
      ],
      largeDependencies: [
        { name: 'monaco-editor', size: 700 * 1024, percentage: 35 },
        { name: 'react-dom', size: 300 * 1024, percentage: 15 }
      ]
    };

    const recommendations = BundleAnalyzer.generateOptimizationRecommendations(mockAnalysis);
    
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.some(rec => rec.includes('Bundle size is large'))).toBe(true);
    expect(recommendations.some(rec => rec.includes('monaco'))).toBe(true);
  });

  it('should format analysis report', async () => {
    const mockAnalysis = {
      totalSize: 1024 * 1024, // 1MB
      chunks: [
        { name: 'main', size: 512 * 1024, gzipSize: 153 * 1024, modules: ['app'] }
      ],
      duplicates: [],
      largeDependencies: [
        { name: 'main', size: 512 * 1024, percentage: 50 }
      ]
    };

    const report = BundleAnalyzer.formatAnalysisReport(mockAnalysis);
    
    expect(typeof report).toBe('string');
    expect(report).toContain('Bundle Analysis Report');
    expect(report).toContain('Total Bundle Size');
    expect(report).toContain('Optimization Recommendations');
  });
});