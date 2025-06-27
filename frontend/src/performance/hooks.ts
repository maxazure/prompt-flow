// Performance monitoring React hooks
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { getPerformanceMonitor } from './monitor';
import { MemoryMetrics, InteractionMetrics, RenderMetrics } from './types';
import { MetricsCalculator } from './metrics';

// Hook for monitoring component performance
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const monitor = getPerformanceMonitor();

  useEffect(() => {
    const startTime = performance.now();
    renderCount.current++;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      lastRenderTime.current = renderTime;

      // Record render metrics
      const renderMetric: RenderMetrics = {
        componentName,
        renderTime,
        rerenderCount: renderCount.current > 1 ? 1 : 0,
        propsChangeCount: 0, // Would need additional tracking
        timestamp: Date.now()
      };

      // Log slow renders
      if (renderTime > 16) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  });

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current
  };
};

// Hook for tracking memory usage
export const useMemoryTracker = (intervalMs: number = 5000) => {
  const [memoryMetrics, setMemoryMetrics] = useState<MemoryMetrics[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const monitor = getPerformanceMonitor();
    
    intervalRef.current = setInterval(() => {
      const metrics = monitor.getMemoryMetrics();
      setMemoryMetrics(prev => [...prev.slice(-9), ...metrics.slice(-1)]); // Keep last 10
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalMs]);

  const memoryTrend = useMemo(() => {
    if (memoryMetrics.length < 2) return null;
    return MetricsCalculator.analyzeMemoryTrend(memoryMetrics);
  }, [memoryMetrics]);

  return {
    memoryMetrics,
    memoryTrend,
    currentMemoryUsage: memoryMetrics[memoryMetrics.length - 1],
    formattedMemoryUsage: memoryMetrics[memoryMetrics.length - 1] 
      ? MetricsCalculator.formatBytes(memoryMetrics[memoryMetrics.length - 1].usedJSHeapSize)
      : '0 Bytes'
  };
};

// Hook for measuring interaction performance
export const useInteractionTracker = () => {
  const [interactions, setInteractions] = useState<InteractionMetrics[]>([]);
  const monitor = getPerformanceMonitor();

  const trackInteraction = useCallback((type: InteractionMetrics['type'], element: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const interaction: InteractionMetrics = {
        type,
        element,
        duration,
        timestamp: Date.now(),
        isSlowInteraction: duration > 100
      };
      
      setInteractions(prev => [...prev.slice(-19), interaction]); // Keep last 20
      
      if (interaction.isSlowInteraction) {
        console.warn(`Slow ${type} interaction on ${element}: ${duration.toFixed(2)}ms`);
      }
    };
  }, []);

  const averageInteractionTime = useMemo(() => {
    if (interactions.length === 0) return 0;
    return interactions.reduce((sum, i) => sum + i.duration, 0) / interactions.length;
  }, [interactions]);

  const slowInteractions = useMemo(() => {
    return interactions.filter(i => i.isSlowInteraction);
  }, [interactions]);

  return {
    interactions,
    trackInteraction,
    averageInteractionTime,
    slowInteractions,
    hasSlowInteractions: slowInteractions.length > 0
  };
};

// Hook for lazy loading with performance tracking
export const useLazyLoadWithPerformance = <T>(
  loadFunction: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadTime, setLoadTime] = useState<number>(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const result = await loadFunction();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setData(result);
      setLoadTime(duration);
      
      if (duration > 1000) {
        console.warn(`Slow lazy load detected: ${duration.toFixed(2)}ms`);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    load();
  }, dependencies);

  return {
    data,
    loading,
    error,
    loadTime,
    formattedLoadTime: MetricsCalculator.formatTime(loadTime),
    reload: load
  };
};

// Hook for debounced performance tracking
export const useDebouncedPerformanceTracker = (
  callback: () => void,
  delay: number = 300
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [executionCount, setExecutionCount] = useState<number>(0);

  const debouncedCallback = useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      const startTime = performance.now();
      
      try {
        await callback();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        setExecutionTime(duration);
        setExecutionCount(prev => prev + 1);
        
        if (duration > 100) {
          console.warn(`Slow debounced execution: ${duration.toFixed(2)}ms`);
        }
      } catch (error) {
        console.error('Debounced callback error:', error);
      }
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    debouncedCallback,
    executionTime,
    executionCount,
    formattedExecutionTime: MetricsCalculator.formatTime(executionTime)
  };
};

// Hook for virtual scrolling performance
export const useVirtualScrollPerformance = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [renderTime, setRenderTime] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startTime = performance.now();
    
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );
    
    const endTime = performance.now();
    setRenderTime(endTime - startTime);
    
    return { startIndex, endIndex, visibleCount: endIndex - startIndex + 1 };
  }, [scrollTop, itemHeight, containerHeight, itemCount]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleRange,
    totalHeight,
    offsetY,
    handleScroll,
    renderTime,
    formattedRenderTime: MetricsCalculator.formatTime(renderTime),
    isSlowRender: renderTime > 16 // 60fps budget
  };
};

// Hook for measuring component mount/unmount performance
export const useMountPerformance = (componentName: string) => {
  const mountTime = useRef<number>(0);
  const unmountTime = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      unmountTime.current = endTime - startTime;
      
      console.log(`Component ${componentName} lifecycle:`, {
        mountTime: mountTime.current,
        totalLifetime: unmountTime.current,
        formattedMountTime: MetricsCalculator.formatTime(mountTime.current),
        formattedLifetime: MetricsCalculator.formatTime(unmountTime.current)
      });
    };
  }, [componentName]);

  useEffect(() => {
    const endTime = performance.now();
    mountTime.current = endTime; // This is relative to when the effect runs
  }, []);

  return {
    mountTime: mountTime.current,
    formattedMountTime: MetricsCalculator.formatTime(mountTime.current)
  };
};

// Hook for bundle loading performance
export const useBundleLoadPerformance = () => {
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: { loading: boolean; loadTime: number; error?: Error }
  }>({});

  const trackBundleLoad = useCallback((bundleName: string, loadPromise: Promise<any>) => {
    const startTime = performance.now();
    
    setLoadingStates(prev => ({
      ...prev,
      [bundleName]: { loading: true, loadTime: 0 }
    }));

    return loadPromise
      .then(result => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        setLoadingStates(prev => ({
          ...prev,
          [bundleName]: { loading: false, loadTime }
        }));
        
        if (loadTime > 2000) {
          console.warn(`Slow bundle load: ${bundleName} took ${loadTime.toFixed(2)}ms`);
        }
        
        return result;
      })
      .catch(error => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        setLoadingStates(prev => ({
          ...prev,
          [bundleName]: { loading: false, loadTime, error }
        }));
        
        throw error;
      });
  }, []);

  return {
    loadingStates,
    trackBundleLoad,
    totalBundles: Object.keys(loadingStates).length,
    loadingBundles: Object.values(loadingStates).filter(state => state.loading).length,
    averageLoadTime: Object.values(loadingStates).length > 0
      ? Object.values(loadingStates).reduce((sum, state) => sum + state.loadTime, 0) / Object.values(loadingStates).length
      : 0
  };
};