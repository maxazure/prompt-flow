// Performance reporting and analytics utilities
import type { 
  PerformanceReport, 
  PerformanceMetrics, 
  MemoryMetrics, 
  NetworkMetrics, 
  RenderMetrics 
} from './types';
import { MetricsCalculator } from './metrics';
import { getPerformanceMonitor } from './monitor';

export interface ReportConfig {
  includeMemoryMetrics: boolean;
  includeNetworkMetrics: boolean;
  includeRenderMetrics: boolean;
  timeframe: number; // hours
  format: 'json' | 'html' | 'csv';
  destination?: 'console' | 'download' | 'api';
  endpoint?: string;
}

export interface PerformanceTrend {
  metric: string;
  trend: 'improving' | 'stable' | 'declining';
  change: number; // percentage
  period: string;
}

export interface PerformanceAlert {
  type: 'warning' | 'error' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  resolved: boolean;
}

export class PerformanceReporter {
  private static instance: PerformanceReporter;
  private reports: PerformanceReport[] = [];
  private alerts: PerformanceAlert[] = [];
  private trends: PerformanceTrend[] = [];

  static getInstance(): PerformanceReporter {
    if (!PerformanceReporter.instance) {
      PerformanceReporter.instance = new PerformanceReporter();
    }
    return PerformanceReporter.instance;
  }

  async generateReport(config: Partial<ReportConfig> = {}): Promise<PerformanceReport> {
    const defaultConfig: ReportConfig = {
      includeMemoryMetrics: true,
      includeNetworkMetrics: true,
      includeRenderMetrics: true,
      timeframe: 24,
      format: 'json',
      destination: 'console'
    };

    const finalConfig = { ...defaultConfig, ...config };
    const monitor = getPerformanceMonitor();

    // Collect current metrics
    const performanceMetrics = monitor.getPerformanceMetrics();
    const memoryMetrics = finalConfig.includeMemoryMetrics ? monitor.getMemoryMetrics() : [];
    const networkMetrics = finalConfig.includeNetworkMetrics ? monitor.getNetworkMetrics() : [];
    const renderMetrics: RenderMetrics[] = []; // Would be collected from React profiler

    // Calculate performance score
    const score = MetricsCalculator.calculateWebVitalsScore(performanceMetrics);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      performanceMetrics,
      memoryMetrics,
      networkMetrics
    );

    const report: PerformanceReport = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: performanceMetrics,
      memoryUsage: memoryMetrics,
      renderMetrics,
      networkMetrics,
      recommendations,
      score
    };

    this.reports.push(report);
    
    // Keep only last 100 reports
    if (this.reports.length > 100) {
      this.reports = this.reports.slice(-100);
    }

    // Update trends
    this.updateTrends();

    // Check for alerts
    this.checkAlerts(report);

    // Output report based on destination
    await this.outputReport(report, finalConfig);

    return report;
  }

  private generateRecommendations(
    metrics: PerformanceMetrics,
    memoryMetrics: MemoryMetrics[],
    networkMetrics: NetworkMetrics[]
  ): string[] {
    const recommendations: string[] = [];

    // Web Vitals recommendations
    if (metrics.firstContentfulPaint > 1800) {
      recommendations.push('Optimize First Contentful Paint - consider server-side rendering or preloading critical resources');
    }

    if (metrics.largestContentfulPaint > 2500) {
      recommendations.push('Improve Largest Contentful Paint - optimize images and critical render path');
    }

    if (metrics.firstInputDelay > 100) {
      recommendations.push('Reduce First Input Delay - minimize JavaScript execution time');
    }

    if (metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('Fix Layout Shift issues - add size attributes to images and reserve space for ads');
    }

    // Memory recommendations
    if (memoryMetrics.length > 0) {
      const memoryTrend = MetricsCalculator.analyzeMemoryTrend(memoryMetrics);
      if (memoryTrend.trend === 'growing' && memoryTrend.growthRate > 0.1) {
        recommendations.push('Memory leak detected - review component cleanup and event listener removal');
      }

      const currentMemory = memoryMetrics[memoryMetrics.length - 1];
      if (currentMemory && currentMemory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
        recommendations.push('High memory usage - consider lazy loading and data pagination');
      }
    }

    // Network recommendations
    if (networkMetrics.length > 0) {
      const networkAnalysis = MetricsCalculator.analyzeNetworkPerformance(networkMetrics);
      recommendations.push(...networkAnalysis.recommendations);
    }

    // Bundle size recommendations
    const scripts = Array.from(document.scripts);
    const largeScripts = scripts.filter(script => 
      script.src && script.src.includes('.js')
    );
    
    if (largeScripts.length > 10) {
      recommendations.push('Consider code splitting - large number of JavaScript files detected');
    }

    return recommendations;
  }

  private updateTrends(): void {
    if (this.reports.length < 2) return;

    const recentReports = this.reports.slice(-10); // Last 10 reports
    const olderReports = this.reports.slice(-20, -10); // Previous 10 reports

    if (olderReports.length === 0) return;

    const calculateAverage = (reports: PerformanceReport[], metric: keyof PerformanceMetrics) => {
      return reports.reduce((sum, report) => sum + report.metrics[metric], 0) / reports.length;
    };

    const metrics: (keyof PerformanceMetrics)[] = [
      'firstContentfulPaint',
      'largestContentfulPaint',
      'firstInputDelay',
      'cumulativeLayoutShift'
    ];

    this.trends = metrics.map(metric => {
      const recentAvg = calculateAverage(recentReports, metric);
      const olderAvg = calculateAverage(olderReports, metric);
      const change = ((recentAvg - olderAvg) / olderAvg) * 100;

      let trend: 'improving' | 'stable' | 'declining';
      if (Math.abs(change) < 5) {
        trend = 'stable';
      } else if (change < 0) {
        trend = 'improving'; // Lower is better for these metrics
      } else {
        trend = 'declining';
      }

      return {
        metric,
        trend,
        change: Math.abs(change),
        period: 'last 10 reports'
      };
    });
  }

  private checkAlerts(report: PerformanceReport): void {
    const alerts: PerformanceAlert[] = [];

    // Define thresholds
    const thresholds = {
      firstContentfulPaint: 3000,
      largestContentfulPaint: 4000,
      firstInputDelay: 300,
      cumulativeLayoutShift: 0.25,
      memoryUsage: 100 * 1024 * 1024, // 100MB
      networkFailureRate: 0.05 // 5%
    };

    // Check performance metrics
    Object.entries(thresholds).forEach(([metric, threshold]) => {
      let value = 0;
      let shouldAlert = false;

      switch (metric) {
        case 'firstContentfulPaint':
          value = report.metrics.firstContentfulPaint;
          shouldAlert = value > threshold;
          break;
        case 'largestContentfulPaint':
          value = report.metrics.largestContentfulPaint;
          shouldAlert = value > threshold;
          break;
        case 'firstInputDelay':
          value = report.metrics.firstInputDelay;
          shouldAlert = value > threshold;
          break;
        case 'cumulativeLayoutShift':
          value = report.metrics.cumulativeLayoutShift;
          shouldAlert = value > threshold;
          break;
        case 'memoryUsage':
          if (report.memoryUsage.length > 0) {
            value = report.memoryUsage[report.memoryUsage.length - 1].usedJSHeapSize;
            shouldAlert = value > threshold;
          }
          break;
        case 'networkFailureRate':
          if (report.networkMetrics.length > 0) {
            const failedRequests = report.networkMetrics.filter(m => m.status >= 400).length;
            value = failedRequests / report.networkMetrics.length;
            shouldAlert = value > threshold;
          }
          break;
      }

      if (shouldAlert) {
        alerts.push({
          type: value > threshold * 1.5 ? 'error' : 'warning',
          metric,
          value,
          threshold,
          message: `${metric} (${this.formatMetricValue(metric, value)}) exceeds threshold (${this.formatMetricValue(metric, threshold)})`,
          timestamp: Date.now(),
          resolved: false
        });
      }
    });

    this.alerts.push(...alerts);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    // Log alerts
    alerts.forEach(alert => {
      const icon = alert.type === 'error' ? '🚨' : '⚠️';
      console.warn(`${icon} Performance Alert: ${alert.message}`);
    });
  }

  private formatMetricValue(metric: string, value: number): string {
    switch (metric) {
      case 'firstContentfulPaint':
      case 'largestContentfulPaint':
      case 'firstInputDelay':
        return MetricsCalculator.formatTime(value);
      case 'cumulativeLayoutShift':
        return value.toFixed(3);
      case 'memoryUsage':
        return MetricsCalculator.formatBytes(value);
      case 'networkFailureRate':
        return `${(value * 100).toFixed(1)}%`;
      default:
        return value.toString();
    }
  }

  private async outputReport(report: PerformanceReport, config: ReportConfig): Promise<void> {
    switch (config.destination) {
      case 'console':
        console.group('📊 Performance Report');
        console.log('Score:', report.score);
        console.log('Metrics:', report.metrics);
        console.log('Recommendations:', report.recommendations);
        console.groupEnd();
        break;

      case 'download':
        await this.downloadReport(report, config.format);
        break;

      case 'api':
        if (config.endpoint) {
          await this.sendReportToAPI(report, config.endpoint);
        }
        break;
    }
  }

  private async downloadReport(report: PerformanceReport, format: 'json' | 'html' | 'csv'): Promise<void> {
    let content: string;
    let mimeType: string;
    let filename: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(report, null, 2);
        mimeType = 'application/json';
        filename = `performance-report-${Date.now()}.json`;
        break;

      case 'html':
        content = this.generateHTMLReport(report);
        mimeType = 'text/html';
        filename = `performance-report-${Date.now()}.html`;
        break;

      case 'csv':
        content = this.generateCSVReport(report);
        mimeType = 'text/csv';
        filename = `performance-report-${Date.now()}.csv`;
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private generateHTMLReport(report: PerformanceReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Report - ${new Date(report.timestamp).toLocaleString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .score { font-size: 48px; font-weight: bold; color: ${report.score >= 90 ? '#4CAF50' : report.score >= 75 ? '#FF9800' : '#F44336'}; }
        .metric { margin: 10px 0; }
        .metric-label { font-weight: bold; }
        .recommendations { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .recommendation { margin: 10px 0; padding-left: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Report</h1>
        <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        <p>URL: ${report.url}</p>
        <div class="score">${Math.round(report.score)}</div>
    </div>

    <h2>Web Vitals</h2>
    <div class="metric">
        <span class="metric-label">First Contentful Paint:</span> ${MetricsCalculator.formatTime(report.metrics.firstContentfulPaint)}
    </div>
    <div class="metric">
        <span class="metric-label">Largest Contentful Paint:</span> ${MetricsCalculator.formatTime(report.metrics.largestContentfulPaint)}
    </div>
    <div class="metric">
        <span class="metric-label">First Input Delay:</span> ${MetricsCalculator.formatTime(report.metrics.firstInputDelay)}
    </div>
    <div class="metric">
        <span class="metric-label">Cumulative Layout Shift:</span> ${report.metrics.cumulativeLayoutShift.toFixed(3)}
    </div>

    <div class="recommendations">
        <h2>Recommendations</h2>
        ${report.recommendations.map(rec => `<div class="recommendation">• ${rec}</div>`).join('')}
    </div>

    ${report.memoryUsage.length > 0 ? `
    <h2>Memory Usage</h2>
    <table>
        <thead>
            <tr><th>Timestamp</th><th>Used Heap Size</th><th>Total Heap Size</th></tr>
        </thead>
        <tbody>
            ${report.memoryUsage.slice(-10).map(m => `
                <tr>
                    <td>${new Date(m.timestamp).toLocaleTimeString()}</td>
                    <td>${MetricsCalculator.formatBytes(m.usedJSHeapSize)}</td>
                    <td>${MetricsCalculator.formatBytes(m.totalJSHeapSize)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}

    ${report.networkMetrics.length > 0 ? `
    <h2>Network Requests (Last 10)</h2>
    <table>
        <thead>
            <tr><th>URL</th><th>Method</th><th>Duration</th><th>Status</th><th>Size</th></tr>
        </thead>
        <tbody>
            ${report.networkMetrics.slice(-10).map(n => `
                <tr>
                    <td>${n.url}</td>
                    <td>${n.method}</td>
                    <td>${MetricsCalculator.formatTime(n.duration)}</td>
                    <td>${n.status}</td>
                    <td>${MetricsCalculator.formatBytes(n.responseSize)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}
</body>
</html>
    `;
  }

  private generateCSVReport(report: PerformanceReport): string {
    const rows = [
      ['Metric', 'Value'],
      ['Timestamp', new Date(report.timestamp).toISOString()],
      ['Score', report.score.toString()],
      ['First Contentful Paint', report.metrics.firstContentfulPaint.toString()],
      ['Largest Contentful Paint', report.metrics.largestContentfulPaint.toString()],
      ['First Input Delay', report.metrics.firstInputDelay.toString()],
      ['Cumulative Layout Shift', report.metrics.cumulativeLayoutShift.toString()],
      ['URL', report.url],
      ...report.recommendations.map((rec, i) => [`Recommendation ${i + 1}`, rec])
    ];

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  private async sendReportToAPI(report: PerformanceReport, endpoint: string): Promise<void> {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.error('Failed to send performance report to API:', error);
    }
  }

  getReports(limit?: number): PerformanceReport[] {
    return limit ? this.reports.slice(-limit) : [...this.reports];
  }

  getAlerts(unresolved?: boolean): PerformanceAlert[] {
    const alerts = unresolved ? this.alerts.filter(a => !a.resolved) : [...this.alerts];
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  getTrends(): PerformanceTrend[] {
    return [...this.trends];
  }

  resolveAlert(alertIndex: number): void {
    if (this.alerts[alertIndex]) {
      this.alerts[alertIndex].resolved = true;
    }
  }

  clearReports(): void {
    this.reports = [];
  }

  clearAlerts(): void {
    this.alerts = [];
  }
}

// Utility functions
export const generatePerformanceReport = async (config?: Partial<ReportConfig>): Promise<PerformanceReport> => {
  const reporter = PerformanceReporter.getInstance();
  return reporter.generateReport(config);
};

export const downloadPerformanceReport = async (format: 'json' | 'html' | 'csv' = 'html'): Promise<void> => {
  await generatePerformanceReport({
    format,
    destination: 'download'
  });
};

export const getPerformanceTrends = (): PerformanceTrend[] => {
  const reporter = PerformanceReporter.getInstance();
  return reporter.getTrends();
};

export const getPerformanceAlerts = (unresolved?: boolean): PerformanceAlert[] => {
  const reporter = PerformanceReporter.getInstance();
  return reporter.getAlerts(unresolved);
};