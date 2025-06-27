// Memory leak detection and monitoring utilities
import { MemoryMetrics, MemoryLeakDetection, ComponentPerformanceData } from './types';

export interface MemoryLeakTest {
  name: string;
  description: string;
  component: string;
  iterations: number;
  setup: () => Promise<void>;
  action: () => Promise<void>;
  cleanup: () => Promise<void>;
  memoryThreshold: number; // MB
}

export interface MemoryLeakReport {
  testName: string;
  component: string;
  memoryGrowth: number;
  memoryGrowthPercentage: number;
  iterations: number;
  isLeakDetected: boolean;
  severity: 'low' | 'medium' | 'high';
  memorySnapshots: MemoryMetrics[];
  recommendations: string[];
  timestamp: number;
}

export class MemoryLeakDetector {
  private memorySnapshots: MemoryMetrics[] = [];
  private leakDetections: MemoryLeakDetection[] = [];
  private componentTracking: Map<string, ComponentPerformanceData> = new Map();

  async runMemoryLeakTest(test: MemoryLeakTest): Promise<MemoryLeakReport> {
    console.log(`🔍 Running memory leak test: ${test.name}`);
    
    const snapshots: MemoryMetrics[] = [];
    
    try {
      // Initial memory snapshot
      await this.forceGarbageCollection();
      const initialMemory = this.captureMemorySnapshot();
      snapshots.push(initialMemory);
      
      // Setup
      await test.setup();
      
      // Run iterations
      for (let i = 0; i < test.iterations; i++) {
        await test.action();
        
        // Capture memory every 10 iterations or on last iteration
        if (i % 10 === 0 || i === test.iterations - 1) {
          await this.forceGarbageCollection();
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait for GC
          const snapshot = this.captureMemorySnapshot();
          snapshots.push(snapshot);
        }
        
        // Small delay to allow for natural cleanup
        if (i % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      // Cleanup
      await test.cleanup();
      
      // Final memory snapshot after cleanup
      await this.forceGarbageCollection();
      const finalMemory = this.captureMemorySnapshot();
      snapshots.push(finalMemory);
      
      // Analyze results
      const report = this.analyzeMemoryGrowth(test, snapshots);
      
      const status = report.isLeakDetected ? '❌ LEAK DETECTED' : '✅ NO LEAK';
      console.log(`${status} ${test.name}: ${report.memoryGrowthPercentage.toFixed(1)}% growth`);
      
      return report;
      
    } catch (error) {
      console.error(`❌ Memory leak test failed: ${test.name}`, error);
      
      return {
        testName: test.name,
        component: test.component,
        memoryGrowth: 0,
        memoryGrowthPercentage: 0,
        iterations: test.iterations,
        isLeakDetected: false,
        severity: 'low',
        memorySnapshots: snapshots,
        recommendations: ['Test failed to complete - check test implementation'],
        timestamp: Date.now()
      };
    }
  }

  private captureMemorySnapshot(): MemoryMetrics {
    const memory = (performance as any).memory;
    if (!memory) {
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        timestamp: Date.now()
      };
    }
    
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now()
    };
  }

  private async forceGarbageCollection(): Promise<void> {
    // Force garbage collection if available (Chrome DevTools)
    if ('gc' in window) {
      (window as any).gc();
    }
    
    // Alternative: create and destroy objects to encourage GC
    const temp = new Array(1000).fill(0).map(() => ({ data: new Array(100).fill(0) }));
    temp.length = 0;
    
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private analyzeMemoryGrowth(test: MemoryLeakTest, snapshots: MemoryMetrics[]): MemoryLeakReport {
    if (snapshots.length < 2) {
      return {
        testName: test.name,
        component: test.component,
        memoryGrowth: 0,
        memoryGrowthPercentage: 0,
        iterations: test.iterations,
        isLeakDetected: false,
        severity: 'low',
        memorySnapshots: snapshots,
        recommendations: ['Insufficient memory snapshots for analysis'],
        timestamp: Date.now()
      };
    }

    const initialMemory = snapshots[0].usedJSHeapSize;
    const finalMemory = snapshots[snapshots.length - 1].usedJSHeapSize;
    const memoryGrowth = finalMemory - initialMemory;
    const memoryGrowthPercentage = (memoryGrowth / initialMemory) * 100;
    
    // Determine severity
    let severity: 'low' | 'medium' | 'high' = 'low';
    let isLeakDetected = false;
    
    const growthMB = memoryGrowth / (1024 * 1024);
    
    if (memoryGrowthPercentage > 50 || growthMB > test.memoryThreshold) {
      severity = 'high';
      isLeakDetected = true;
    } else if (memoryGrowthPercentage > 25 || growthMB > test.memoryThreshold / 2) {
      severity = 'medium';
      isLeakDetected = true;
    } else if (memoryGrowthPercentage > 10) {
      severity = 'low';
      isLeakDetected = true;
    }

    const recommendations = this.generateRecommendations(test, memoryGrowthPercentage, growthMB, snapshots);

    return {
      testName: test.name,
      component: test.component,
      memoryGrowth,
      memoryGrowthPercentage,
      iterations: test.iterations,
      isLeakDetected,
      severity,
      memorySnapshots: snapshots,
      recommendations,
      timestamp: Date.now()
    };
  }

  private generateRecommendations(
    test: MemoryLeakTest,
    growthPercentage: number,
    growthMB: number,
    snapshots: MemoryMetrics[]
  ): string[] {
    const recommendations: string[] = [];

    if (growthPercentage > 50) {
      recommendations.push('CRITICAL: Significant memory leak detected');
      recommendations.push('Check for event listeners that are not being removed');
      recommendations.push('Verify that useEffect cleanup functions are implemented');
      recommendations.push('Look for circular references or cached data not being cleared');
    } else if (growthPercentage > 25) {
      recommendations.push('WARNING: Moderate memory growth detected');
      recommendations.push('Review component cleanup in componentWillUnmount or useEffect cleanup');
      recommendations.push('Check for unnecessary data retention in global state');
    } else if (growthPercentage > 10) {
      recommendations.push('INFO: Minor memory growth detected');
      recommendations.push('Monitor this component for potential optimization opportunities');
    } else {
      recommendations.push('Memory usage appears stable');
    }

    // Analyze memory pattern
    const isGrowthConsistent = this.isConsistentGrowth(snapshots);
    if (isGrowthConsistent && growthPercentage > 5) {
      recommendations.push('Consistent memory growth pattern detected - likely a leak');
      recommendations.push('Use React DevTools Profiler to identify the source');
    }

    // Component-specific recommendations
    if (test.component.toLowerCase().includes('monaco')) {
      recommendations.push('Monaco Editor: Ensure editor instances are properly disposed');
      recommendations.push('Check that models and decorations are being cleaned up');
    }

    if (test.component.toLowerCase().includes('list') || test.component.toLowerCase().includes('table')) {
      recommendations.push('List/Table: Consider implementing virtualization for large datasets');
      recommendations.push('Ensure old list items are being properly unmounted');
    }

    return recommendations;
  }

  private isConsistentGrowth(snapshots: MemoryMetrics[]): boolean {
    if (snapshots.length < 3) return false;
    
    let growthCount = 0;
    for (let i = 1; i < snapshots.length; i++) {
      if (snapshots[i].usedJSHeapSize > snapshots[i - 1].usedJSHeapSize) {
        growthCount++;
      }
    }
    
    return growthCount / (snapshots.length - 1) > 0.7; // 70% of snapshots show growth
  }

  startContinuousMonitoring(intervalMs: number = 5000): () => void {
    const interval = setInterval(() => {
      const snapshot = this.captureMemorySnapshot();
      this.memorySnapshots.push(snapshot);
      
      // Keep only last 100 snapshots
      if (this.memorySnapshots.length > 100) {
        this.memorySnapshots = this.memorySnapshots.slice(-100);
      }
      
      this.checkForLeaks(snapshot);
    }, intervalMs);

    return () => clearInterval(interval);
  }

  private checkForLeaks(currentSnapshot: MemoryMetrics): void {
    if (this.memorySnapshots.length < 5) return;

    const recentSnapshots = this.memorySnapshots.slice(-5);
    const isGrowing = this.isConsistentGrowth(recentSnapshots);
    
    if (isGrowing) {
      const firstSnapshot = recentSnapshots[0];
      const growthPercentage = ((currentSnapshot.usedJSHeapSize - firstSnapshot.usedJSHeapSize) / firstSnapshot.usedJSHeapSize) * 100;
      
      if (growthPercentage > 20) { // 20% growth over 5 snapshots
        const leak: MemoryLeakDetection = {
          componentName: 'Unknown',
          memoryGrowth: currentSnapshot.usedJSHeapSize - firstSnapshot.usedJSHeapSize,
          consecutiveGrowthCycles: 5,
          isLeakSuspected: true,
          timestamp: Date.now()
        };
        
        this.leakDetections.push(leak);
        console.warn('🚨 Potential memory leak detected during continuous monitoring', leak);
      }
    }
  }

  getLeakDetections(): MemoryLeakDetection[] {
    return [...this.leakDetections];
  }

  getMemorySnapshots(): MemoryMetrics[] {
    return [...this.memorySnapshots];
  }

  clearHistory(): void {
    this.memorySnapshots = [];
    this.leakDetections = [];
    this.componentTracking.clear();
  }
}

// Pre-defined memory leak tests for common components
export const createMemoryLeakTests = (): MemoryLeakTest[] => {
  return [
    {
      name: 'Component Mount/Unmount Cycle',
      description: 'Tests for memory leaks during component lifecycle',
      component: 'Generic Component',
      iterations: 100,
      memoryThreshold: 5, // 5MB
      setup: async () => {
        // Setup test container
        const container = document.createElement('div');
        container.id = 'memory-leak-test-container';
        document.body.appendChild(container);
      },
      action: async () => {
        // Simulate component mount/unmount
        const container = document.getElementById('memory-leak-test-container');
        if (container) {
          // Create and mount component simulation
          const component = document.createElement('div');
          component.className = 'test-component';
          component.innerHTML = '<p>Test Component Content</p>';
          container.appendChild(component);
          
          // Add event listener (potential leak source)
          const handleClick = () => console.log('clicked');
          component.addEventListener('click', handleClick);
          
          // Simulate component work
          await new Promise(resolve => setTimeout(resolve, 1));
          
          // Unmount (but forget to remove event listener - simulating leak)
          component.removeEventListener('click', handleClick);
          container.removeChild(component);
        }
      },
      cleanup: async () => {
        const container = document.getElementById('memory-leak-test-container');
        if (container) {
          document.body.removeChild(container);
        }
      }
    },

    {
      name: 'Monaco Editor Lifecycle',
      description: 'Tests Monaco Editor for memory leaks',
      component: 'Monaco Editor',
      iterations: 20,
      memoryThreshold: 10, // 10MB
      setup: async () => {
        const container = document.createElement('div');
        container.id = 'monaco-memory-test';
        container.style.width = '800px';
        container.style.height = '400px';
        document.body.appendChild(container);
      },
      action: async () => {
        const container = document.getElementById('monaco-memory-test');
        if (container) {
          // Simulate Monaco Editor creation and disposal
          const editorElement = document.createElement('div');
          editorElement.className = 'monaco-editor-instance';
          editorElement.style.width = '100%';
          editorElement.style.height = '100%';
          container.appendChild(editorElement);
          
          // Simulate editor initialization time
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // Simulate editor disposal
          container.removeChild(editorElement);
        }
      },
      cleanup: async () => {
        const container = document.getElementById('monaco-memory-test');
        if (container) {
          document.body.removeChild(container);
        }
      }
    },

    {
      name: 'Large Dataset Rendering',
      description: 'Tests memory usage with large datasets',
      component: 'Data List',
      iterations: 50,
      memoryThreshold: 15, // 15MB
      setup: async () => {
        const container = document.createElement('div');
        container.id = 'large-dataset-test';
        document.body.appendChild(container);
      },
      action: async () => {
        const container = document.getElementById('large-dataset-test');
        if (container) {
          // Create large dataset
          const items = new Array(1000).fill(0).map((_, i) => ({
            id: i,
            title: `Item ${i}`,
            content: `Content for item ${i}`.repeat(10),
            metadata: { timestamp: Date.now(), tags: ['tag1', 'tag2', 'tag3'] }
          }));
          
          // Render items
          const fragment = document.createDocumentFragment();
          items.forEach(item => {
            const element = document.createElement('div');
            element.className = 'data-item';
            element.innerHTML = `
              <h3>${item.title}</h3>
              <p>${item.content}</p>
              <div class="metadata">${JSON.stringify(item.metadata)}</div>
            `;
            fragment.appendChild(element);
          });
          
          container.appendChild(fragment);
          
          // Force layout calculation
          container.offsetHeight;
          
          // Clear the container
          container.innerHTML = '';
        }
      },
      cleanup: async () => {
        const container = document.getElementById('large-dataset-test');
        if (container) {
          document.body.removeChild(container);
        }
      }
    },

    {
      name: 'Event Listener Cleanup',
      description: 'Tests for event listener memory leaks',
      component: 'Event Handlers',
      iterations: 200,
      memoryThreshold: 3, // 3MB
      setup: async () => {
        const container = document.createElement('div');
        container.id = 'event-listener-test';
        document.body.appendChild(container);
      },
      action: async () => {
        const container = document.getElementById('event-listener-test');
        if (container) {
          const button = document.createElement('button');
          button.textContent = 'Test Button';
          
          // Add multiple event listeners
          const handlers = [
            () => console.log('click 1'),
            () => console.log('click 2'),
            () => console.log('click 3')
          ];
          
          handlers.forEach(handler => {
            button.addEventListener('click', handler);
          });
          
          container.appendChild(button);
          
          // Simulate some interaction
          button.click();
          
          // Properly clean up event listeners
          handlers.forEach(handler => {
            button.removeEventListener('click', handler);
          });
          
          container.removeChild(button);
        }
      },
      cleanup: async () => {
        const container = document.getElementById('event-listener-test');
        if (container) {
          document.body.removeChild(container);
        }
      }
    }
  ];
};

// Utility function to run all memory leak tests
export const runMemoryLeakTests = async (): Promise<MemoryLeakReport[]> => {
  const detector = new MemoryLeakDetector();
  const tests = createMemoryLeakTests();
  const reports: MemoryLeakReport[] = [];
  
  console.log('🧪 Running Memory Leak Detection Tests');
  console.log('=====================================\n');
  
  for (const test of tests) {
    const report = await detector.runMemoryLeakTest(test);
    reports.push(report);
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate summary report
  const leaksDetected = reports.filter(r => r.isLeakDetected).length;
  console.log(`\n📊 Memory Leak Test Summary:`);
  console.log(`Tests Run: ${reports.length}`);
  console.log(`Leaks Detected: ${leaksDetected}`);
  console.log(`Success Rate: ${((reports.length - leaksDetected) / reports.length * 100).toFixed(1)}%`);
  
  return reports;
};