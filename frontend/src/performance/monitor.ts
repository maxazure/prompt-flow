// Core performance monitoring utilities
import { 
  PerformanceMetrics, 
  MemoryMetrics, 
  NetworkMetrics, 
  PerformanceConfig,
  InteractionMetrics 
} from './types';

class PerformanceMonitor {
  private config: PerformanceConfig;
  private memoryMetrics: MemoryMetrics[] = [];
  private networkMetrics: NetworkMetrics[] = [];
  private interactionMetrics: InteractionMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private memoryCheckInterval?: NodeJS.Timeout;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableMemoryMonitoring: true,
      enableRenderMonitoring: true,
      enableNetworkMonitoring: true,
      memoryCheckInterval: 5000,
      renderThreshold: 16,
      networkThreshold: 1000,
      ...config
    };

    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      this.setupWebVitalsObservers();
      
      if (this.config.enableMemoryMonitoring) {
        this.startMemoryMonitoring();
      }

      if (this.config.enableNetworkMonitoring) {
        this.monitorNetworkRequests();
      }

      this.setupInteractionMonitoring();
    }
  }

  private setupWebVitalsObservers() {
    // First Contentful Paint (FCP)
    this.createObserver('paint', (entries) => {
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.reportMetric('FCP', fcpEntry.startTime);
      }
    });

    // Largest Contentful Paint (LCP)
    this.createObserver('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.reportMetric('LCP', lastEntry.startTime);
    });

    // First Input Delay (FID)
    this.createObserver('first-input', (entries) => {
      const lastEntry = entries[entries.length - 1];
      const fid = lastEntry.processingStart - lastEntry.startTime;
      this.reportMetric('FID', fid);
    });

    // Cumulative Layout Shift (CLS)
    this.createObserver('layout-shift', (entries) => {
      let clsValue = 0;
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.reportMetric('CLS', clsValue);
    });

    // Long Tasks (for Total Blocking Time)
    this.createObserver('longtask', (entries) => {
      for (const entry of entries) {
        const blockingTime = Math.max(0, entry.duration - 50);
        this.reportMetric('TBT_TASK', blockingTime);
      }
    });
  }

  private createObserver(entryType: string, callback: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ entryTypes: [entryType] });
      this.observers.push(observer);
    } catch (e) {
      console.warn(`PerformanceObserver for ${entryType} not supported`);
    }
  }

  private startMemoryMonitoring() {
    if ('memory' in performance) {
      this.memoryCheckInterval = setInterval(() => {
        const memory = (performance as any).memory;
        const memoryMetric: MemoryMetrics = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          timestamp: Date.now()
        };
        this.memoryMetrics.push(memoryMetric);
        
        // Keep only last 100 measurements
        if (this.memoryMetrics.length > 100) {
          this.memoryMetrics = this.memoryMetrics.slice(-100);
        }

        this.checkMemoryLeaks(memoryMetric);
      }, this.config.memoryCheckInterval);
    }
  }

  private checkMemoryLeaks(currentMemory: MemoryMetrics) {
    if (this.memoryMetrics.length < 5) return;

    const recentMetrics = this.memoryMetrics.slice(-5);
    const isGrowingConsistently = recentMetrics.every((metric, index) => {
      if (index === 0) return true;
      return metric.usedJSHeapSize > recentMetrics[index - 1].usedJSHeapSize;
    });

    if (isGrowingConsistently) {
      const growthRate = (currentMemory.usedJSHeapSize - recentMetrics[0].usedJSHeapSize) / recentMetrics[0].usedJSHeapSize;
      if (growthRate > 0.1) { // 10% growth
        console.warn('Potential memory leak detected:', {
          growthRate: `${(growthRate * 100).toFixed(2)}%`,
          currentUsage: `${(currentMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
        });
      }
    }
  }

  private monitorNetworkRequests() {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        const networkMetric: NetworkMetrics = {
          url,
          method: args[1]?.method || 'GET',
          duration: endTime - startTime,
          responseSize: parseInt(response.headers.get('content-length') || '0'),
          status: response.status,
          timestamp: Date.now()
        };
        
        this.networkMetrics.push(networkMetric);
        
        if (networkMetric.duration > this.config.networkThreshold) {
          console.warn('Slow network request detected:', networkMetric);
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        this.networkMetrics.push({
          url,
          method: args[1]?.method || 'GET',
          duration: endTime - startTime,
          responseSize: 0,
          status: 0,
          timestamp: Date.now()
        });
        throw error;
      }
    };
  }

  private setupInteractionMonitoring() {
    const measureInteraction = (type: InteractionMetrics['type'], element: string) => {
      const startTime = performance.now();
      
      requestAnimationFrame(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const interaction: InteractionMetrics = {
          type,
          element,
          duration,
          timestamp: Date.now(),
          isSlowInteraction: duration > 100
        };
        
        this.interactionMetrics.push(interaction);
        
        if (interaction.isSlowInteraction) {
          console.warn('Slow interaction detected:', interaction);
        }
      });
    };

    // Monitor clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const element = target.tagName + (target.className ? `.${target.className.split(' ')[0]}` : '');
      measureInteraction('click', element);
    });

    // Monitor inputs
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLElement;
      const element = target.tagName + (target.getAttribute('name') ? `[name="${target.getAttribute('name')}"]` : '');
      measureInteraction('input', element);
    });
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    const lcp = performance.getEntriesByType('largest-contentful-paint').slice(-1)[0]?.startTime || 0;

    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      firstInputDelay: 0, // Will be updated by observer
      cumulativeLayoutShift: 0, // Will be updated by observer
      timeToInteractive: navigation ? navigation.domInteractive - navigation.navigationStart : 0,
      totalBlockingTime: 0 // Will be calculated from long tasks
    };
  }

  public getMemoryMetrics(): MemoryMetrics[] {
    return [...this.memoryMetrics];
  }

  public getNetworkMetrics(): NetworkMetrics[] {
    return [...this.networkMetrics];
  }

  public getInteractionMetrics(): InteractionMetrics[] {
    return [...this.interactionMetrics];
  }

  private reportMetric(name: string, value: number) {
    // Custom event for metric reporting
    window.dispatchEvent(new CustomEvent('performance-metric', {
      detail: { name, value, timestamp: Date.now() }
    }));
  }

  public dispose() {
    this.observers.forEach(observer => observer.disconnect());
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (config?: Partial<PerformanceConfig>): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor(config);
  }
  return performanceMonitor;
};

export { PerformanceMonitor };