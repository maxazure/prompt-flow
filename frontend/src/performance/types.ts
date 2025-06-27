// Performance monitoring types and interfaces

export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

export interface RenderMetrics {
  componentName: string;
  renderTime: number;
  rerenderCount: number;
  propsChangeCount: number;
  timestamp: number;
}

export interface NetworkMetrics {
  url: string;
  method: string;
  duration: number;
  responseSize: number;
  status: number;
  timestamp: number;
}

export interface BundleAnalysis {
  totalSize: number;
  chunks: {
    name: string;
    size: number;
    gzipSize: number;
    modules: string[];
  }[];
  duplicates: {
    module: string;
    instances: number;
    totalSize: number;
  }[];
  largeDependencies: {
    name: string;
    size: number;
    percentage: number;
  }[];
}

export interface PerformanceReport {
  timestamp: number;
  url: string;
  userAgent: string;
  metrics: PerformanceMetrics;
  memoryUsage: MemoryMetrics[];
  renderMetrics: RenderMetrics[];
  networkMetrics: NetworkMetrics[];
  recommendations: string[];
  score: number;
}

export interface PerformanceConfig {
  enableMemoryMonitoring: boolean;
  enableRenderMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  memoryCheckInterval: number;
  renderThreshold: number;
  networkThreshold: number;
  reportingEndpoint?: string;
}

export interface ComponentPerformanceData {
  name: string;
  averageRenderTime: number;
  renderCount: number;
  slowestRender: number;
  fastestRender: number;
  memoryLeakWarnings: boolean;
  unnecessaryRerenders: number;
}

export interface MemoryLeakDetection {
  componentName: string;
  memoryGrowth: number;
  consecutiveGrowthCycles: number;
  isLeakSuspected: boolean;
  timestamp: number;
}

export interface InteractionMetrics {
  type: 'click' | 'scroll' | 'input' | 'navigation';
  element: string;
  duration: number;
  timestamp: number;
  isSlowInteraction: boolean;
}

export type PerformanceThreshold = {
  good: number;
  needsImprovement: number;
  poor: number;
};

export const PERFORMANCE_THRESHOLDS: Record<keyof PerformanceMetrics, PerformanceThreshold> = {
  loadTime: { good: 1000, needsImprovement: 3000, poor: 5000 },
  firstContentfulPaint: { good: 1800, needsImprovement: 3000, poor: 4000 },
  largestContentfulPaint: { good: 2500, needsImprovement: 4000, poor: 4000 },
  firstInputDelay: { good: 100, needsImprovement: 300, poor: 300 },
  cumulativeLayoutShift: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
  timeToInteractive: { good: 3800, needsImprovement: 7300, poor: 7300 },
  totalBlockingTime: { good: 200, needsImprovement: 600, poor: 600 }
};