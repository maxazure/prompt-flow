// Performance metrics calculation and analysis utilities
import { 
  PerformanceMetrics, 
  MemoryMetrics, 
  NetworkMetrics, 
  PERFORMANCE_THRESHOLDS,
  PerformanceThreshold 
} from './types';

export class MetricsCalculator {
  
  static calculateWebVitalsScore(metrics: PerformanceMetrics): number {
    const scores = {
      fcp: this.getMetricScore(metrics.firstContentfulPaint, PERFORMANCE_THRESHOLDS.firstContentfulPaint),
      lcp: this.getMetricScore(metrics.largestContentfulPaint, PERFORMANCE_THRESHOLDS.largestContentfulPaint),
      fid: this.getMetricScore(metrics.firstInputDelay, PERFORMANCE_THRESHOLDS.firstInputDelay),
      cls: this.getMetricScore(metrics.cumulativeLayoutShift, PERFORMANCE_THRESHOLDS.cumulativeLayoutShift),
      tti: this.getMetricScore(metrics.timeToInteractive, PERFORMANCE_THRESHOLDS.timeToInteractive),
      tbt: this.getMetricScore(metrics.totalBlockingTime, PERFORMANCE_THRESHOLDS.totalBlockingTime)
    };

    // Weighted average based on Core Web Vitals importance
    const weights = {
      fcp: 0.1,
      lcp: 0.25, // Core Web Vital
      fid: 0.25, // Core Web Vital
      cls: 0.25, // Core Web Vital
      tti: 0.1,
      tbt: 0.05
    };

    return Object.entries(scores).reduce((total, [metric, score]) => {
      return total + (score * weights[metric as keyof typeof weights]);
    }, 0);
  }

  private static getMetricScore(value: number, threshold: PerformanceThreshold): number {
    if (value <= threshold.good) return 100;
    if (value <= threshold.needsImprovement) {
      const range = threshold.needsImprovement - threshold.good;
      const position = value - threshold.good;
      return 100 - (position / range) * 25; // 100 to 75
    }
    if (value <= threshold.poor) {
      const range = threshold.poor - threshold.needsImprovement;
      const position = value - threshold.needsImprovement;
      return 75 - (position / range) * 25; // 75 to 50
    }
    return Math.max(0, 50 - ((value - threshold.poor) / threshold.poor) * 50); // Below 50
  }

  static analyzeMemoryTrend(memoryMetrics: MemoryMetrics[]): {
    trend: 'stable' | 'growing' | 'declining';
    growthRate: number;
    averageUsage: number;
    peakUsage: number;
    recommendations: string[];
  } {
    if (memoryMetrics.length < 2) {
      return {
        trend: 'stable',
        growthRate: 0,
        averageUsage: 0,
        peakUsage: 0,
        recommendations: ['Need more data points for analysis']
      };
    }

    const usages = memoryMetrics.map(m => m.usedJSHeapSize);
    const averageUsage = usages.reduce((sum, usage) => sum + usage, 0) / usages.length;
    const peakUsage = Math.max(...usages);
    
    const firstHalf = usages.slice(0, Math.floor(usages.length / 2));
    const secondHalf = usages.slice(Math.floor(usages.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, usage) => sum + usage, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, usage) => sum + usage, 0) / secondHalf.length;
    
    const growthRate = (secondAvg - firstAvg) / firstAvg;
    
    let trend: 'stable' | 'growing' | 'declining';
    if (Math.abs(growthRate) < 0.05) {
      trend = 'stable';
    } else if (growthRate > 0) {
      trend = 'growing';
    } else {
      trend = 'declining';
    }

    const recommendations: string[] = [];
    
    if (trend === 'growing' && growthRate > 0.1) {
      recommendations.push('Significant memory growth detected - check for memory leaks');
      recommendations.push('Review component cleanup in useEffect hooks');
      recommendations.push('Ensure event listeners are properly removed');
    }
    
    if (peakUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push('High memory usage detected - consider lazy loading');
      recommendations.push('Optimize large data structures and caching');
    }

    if (trend === 'stable' && averageUsage < 10 * 1024 * 1024) { // 10MB
      recommendations.push('Memory usage is optimal');
    }

    return {
      trend,
      growthRate,
      averageUsage,
      peakUsage,
      recommendations
    };
  }

  static analyzeNetworkPerformance(networkMetrics: NetworkMetrics[]): {
    averageResponseTime: number;
    slowestRequests: NetworkMetrics[];
    totalDataTransferred: number;
    failureRate: number;
    recommendations: string[];
  } {
    if (networkMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        slowestRequests: [],
        totalDataTransferred: 0,
        failureRate: 0,
        recommendations: ['No network requests to analyze']
      };
    }

    const averageResponseTime = networkMetrics.reduce((sum, metric) => sum + metric.duration, 0) / networkMetrics.length;
    const slowestRequests = networkMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
    
    const totalDataTransferred = networkMetrics.reduce((sum, metric) => sum + metric.responseSize, 0);
    const failedRequests = networkMetrics.filter(metric => metric.status >= 400 || metric.status === 0);
    const failureRate = failedRequests.length / networkMetrics.length;

    const recommendations: string[] = [];

    if (averageResponseTime > 1000) {
      recommendations.push('Average response time is high - consider API optimization');
      recommendations.push('Implement request caching where appropriate');
    }

    if (totalDataTransferred > 1024 * 1024) { // 1MB
      recommendations.push('High data transfer detected - consider response compression');
      recommendations.push('Implement pagination for large datasets');
    }

    if (failureRate > 0.05) { // 5% failure rate
      recommendations.push('High failure rate detected - implement retry logic');
      recommendations.push('Add better error handling for network requests');
    }

    const duplicateUrls = this.findDuplicateRequests(networkMetrics);
    if (duplicateUrls.length > 0) {
      recommendations.push('Duplicate requests detected - implement request deduplication');
      recommendations.push(`Duplicate URLs: ${duplicateUrls.join(', ')}`);
    }

    return {
      averageResponseTime,
      slowestRequests,
      totalDataTransferred,
      failureRate,
      recommendations
    };
  }

  private static findDuplicateRequests(networkMetrics: NetworkMetrics[]): string[] {
    const urlCounts = networkMetrics.reduce((acc, metric) => {
      acc[metric.url] = (acc[metric.url] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(urlCounts)
      .filter(([, count]) => count > 1)
      .map(([url]) => url);
  }

  static calculateResourceEfficiency(metrics: PerformanceMetrics): {
    efficiency: number;
    bottlenecks: string[];
    optimizations: string[];
  } {
    const bottlenecks: string[] = [];
    const optimizations: string[] = [];

    // Check for render blocking
    if (metrics.firstContentfulPaint > 2000) {
      bottlenecks.push('Slow First Contentful Paint');
      optimizations.push('Optimize critical rendering path');
      optimizations.push('Minimize render-blocking CSS and JavaScript');
    }

    // Check for layout stability
    if (metrics.cumulativeLayoutShift > 0.1) {
      bottlenecks.push('Layout instability');
      optimizations.push('Add size attributes to images and videos');
      optimizations.push('Reserve space for dynamic content');
    }

    // Check for interactivity delays
    if (metrics.firstInputDelay > 100) {
      bottlenecks.push('Poor input responsiveness');
      optimizations.push('Break up long tasks');
      optimizations.push('Use web workers for heavy computations');
    }

    // Calculate efficiency score
    const metrics_scores = [
      this.getMetricScore(metrics.firstContentfulPaint, PERFORMANCE_THRESHOLDS.firstContentfulPaint),
      this.getMetricScore(metrics.largestContentfulPaint, PERFORMANCE_THRESHOLDS.largestContentfulPaint),
      this.getMetricScore(metrics.firstInputDelay, PERFORMANCE_THRESHOLDS.firstInputDelay),
      this.getMetricScore(metrics.cumulativeLayoutShift, PERFORMANCE_THRESHOLDS.cumulativeLayoutShift)
    ];

    const efficiency = metrics_scores.reduce((sum, score) => sum + score, 0) / metrics_scores.length;

    return {
      efficiency,
      bottlenecks,
      optimizations
    };
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static formatTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${Math.round(milliseconds)}ms`;
    }
    return `${(milliseconds / 1000).toFixed(2)}s`;
  }
}