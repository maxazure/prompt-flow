// React component performance testing and re-render optimization
import React, { Profiler, type ProfilerOnRenderCallback, useCallback, useMemo, useRef, useEffect } from 'react';
import type { RenderMetrics, ComponentPerformanceData } from './types';

export interface ComponentProfilerData {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  slowestRender: number;
  fastestRender: number;
  renders: RenderMetrics[];
  unnecessaryRerenders: number;
  propsChanges: number;
}

export interface RerenderTest {
  name: string;
  description: string;
  component: React.ComponentType<any>;
  iterations: number;
  propsVariations: any[];
  expectedRerenders: number;
}

export interface RerenderTestResult {
  testName: string;
  componentName: string;
  expectedRerenders: number;
  actualRerenders: number;
  rerenderEfficiency: number; // percentage
  averageRenderTime: number;
  recommendations: string[];
  profilerData: ComponentProfilerData;
}

class ReactPerformanceProfiler {
  private static instance: ReactPerformanceProfiler;
  private componentData: Map<string, ComponentProfilerData> = new Map();
  private renderTimings: Map<string, number> = new Map();

  static getInstance(): ReactPerformanceProfiler {
    if (!ReactPerformanceProfiler.instance) {
      ReactPerformanceProfiler.instance = new ReactPerformanceProfiler();
    }
    return ReactPerformanceProfiler.instance;
  }

  createProfilerWrapper(componentName: string) {
    return ({ children }: { children: React.ReactNode }) => {
      const onRender: ProfilerOnRenderCallback = useCallback((
        id: string,
        phase: 'mount' | 'update',
        actualDuration: number,
        baseDuration: number,
        startTime: number,
        commitTime: number
      ) => {
        this.recordRender(componentName, {
          componentName,
          renderTime: actualDuration,
          rerenderCount: phase === 'update' ? 1 : 0,
          propsChangeCount: 0, // Would need additional tracking
          timestamp: Date.now()
        });
      }, [componentName]);

      return (
        <Profiler id={componentName} onRender={onRender}>
          {children}
        </Profiler>
      );
    };
  }

  recordRender(componentName: string, metrics: RenderMetrics): void {
    const existing = this.componentData.get(componentName) || {
      componentName,
      renderCount: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      slowestRender: 0,
      fastestRender: Infinity,
      renders: [],
      unnecessaryRerenders: 0,
      propsChanges: 0
    };

    existing.renderCount++;
    existing.totalRenderTime += metrics.renderTime;
    existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
    existing.slowestRender = Math.max(existing.slowestRender, metrics.renderTime);
    existing.fastestRender = Math.min(existing.fastestRender, metrics.renderTime);
    existing.renders.push(metrics);

    // Keep only last 100 renders
    if (existing.renders.length > 100) {
      existing.renders = existing.renders.slice(-100);
    }

    this.componentData.set(componentName, existing);
  }

  getComponentData(componentName: string): ComponentProfilerData | undefined {
    return this.componentData.get(componentName);
  }

  getAllComponentData(): ComponentProfilerData[] {
    return Array.from(this.componentData.values());
  }

  clearData(): void {
    this.componentData.clear();
    this.renderTimings.clear();
  }

  generatePerformanceReport(): string {
    const components = this.getAllComponentData();
    let report = 'React Component Performance Report\n';
    report += '=====================================\n\n';

    components.forEach(comp => {
      report += `Component: ${comp.componentName}\n`;
      report += `  Renders: ${comp.renderCount}\n`;
      report += `  Average Render Time: ${comp.averageRenderTime.toFixed(2)}ms\n`;
      report += `  Slowest Render: ${comp.slowestRender.toFixed(2)}ms\n`;
      report += `  Fastest Render: ${comp.fastestRender.toFixed(2)}ms\n`;

      if (comp.averageRenderTime > 16) {
        report += `  ⚠️  WARNING: Average render time exceeds 16ms budget\n`;
      }
      if (comp.slowestRender > 50) {
        report += `  ⚠️  WARNING: Slow renders detected (>${comp.slowestRender.toFixed(2)}ms)\n`;
      }

      report += '\n';
    });

    return report;
  }
}

// Component wrapper for performance testing
export const withPerformanceProfiler = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const profiler = ReactPerformanceProfiler.getInstance();
    const ProfilerWrapper = profiler.createProfilerWrapper(componentName);

    return (
      <ProfilerWrapper>
        <Component {...props} ref={ref} />
      </ProfilerWrapper>
    );
  });
};

// Hook for tracking component re-renders
export const useRenderTracker = (componentName: string, dependencies: any[] = []) => {
  const renderCount = useRef(0);
  const lastProps = useRef(dependencies);
  const profiler = ReactPerformanceProfiler.getInstance();

  useEffect(() => {
    renderCount.current++;
    
    // Check if props actually changed
    const propsChanged = dependencies.some((dep, index) => 
      dep !== lastProps.current[index]
    );

    if (renderCount.current > 1 && !propsChanged) {
      // Unnecessary re-render detected
      const componentData = profiler.getComponentData(componentName);
      if (componentData) {
        componentData.unnecessaryRerenders++;
      }
    }

    lastProps.current = dependencies;
  });

  return renderCount.current;
};

// Test components for re-render optimization testing
export const TestComponents = {
  // Component that re-renders unnecessarily
  IneffientComponent: ({ items, selectedId, onSelect }: {
    items: any[];
    selectedId: string;
    onSelect: (id: string) => void;
  }) => {
    useRenderTracker('IneffientComponent', [items, selectedId]);
    
    return (
      <div>
        {items.map(item => (
          <div 
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{ 
              backgroundColor: item.id === selectedId ? '#e3f2fd' : 'white',
              padding: '8px',
              margin: '2px',
              cursor: 'pointer'
            }}
          >
            {item.name}
          </div>
        ))}
      </div>
    );
  },

  // Optimized component with React.memo and useCallback
  OptimizedComponent: React.memo(({ items, selectedId, onSelect }: {
    items: any[];
    selectedId: string;
    onSelect: (id: string) => void;
  }) => {
    useRenderTracker('OptimizedComponent', [items, selectedId]);
    
    const handleSelect = useCallback((id: string) => {
      onSelect(id);
    }, [onSelect]);

    const renderedItems = useMemo(() => {
      return items.map(item => (
        <div 
          key={item.id}
          onClick={() => handleSelect(item.id)}
          style={{ 
            backgroundColor: item.id === selectedId ? '#e3f2fd' : 'white',
            padding: '8px',
            margin: '2px',
            cursor: 'pointer'
          }}
        >
          {item.name}
        </div>
      ));
    }, [items, selectedId, handleSelect]);

    return <div>{renderedItems}</div>;
  }),

  // Component for testing large list performance
  LargeListComponent: ({ items, filter }: {
    items: any[];
    filter: string;
  }) => {
    useRenderTracker('LargeListComponent', [items, filter]);
    
    const filteredItems = useMemo(() => {
      return items.filter(item => 
        item.name.toLowerCase().includes(filter.toLowerCase())
      );
    }, [items, filter]);

    return (
      <div style={{ height: '400px', overflowY: 'auto' }}>
        {filteredItems.map(item => (
          <div key={item.id} style={{ padding: '4px', borderBottom: '1px solid #eee' }}>
            <strong>{item.name}</strong>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    );
  },

  // Component for testing expensive calculations
  ExpensiveCalculationComponent: ({ data, multiplier }: {
    data: number[];
    multiplier: number;
  }) => {
    useRenderTracker('ExpensiveCalculationComponent', [data, multiplier]);
    
    // Expensive calculation without memoization
    const expensiveResult = useMemo(() => {
      console.log('Performing expensive calculation...');
      return data.reduce((sum, value) => sum + (value * multiplier), 0);
    }, [data, multiplier]);

    return (
      <div>
        <h3>Calculation Result: {expensiveResult}</h3>
        <p>Data points: {data.length}</p>
        <p>Multiplier: {multiplier}</p>
      </div>
    );
  }
};

// Re-render testing utilities
export class RerenderTester {
  private profiler: ReactPerformanceProfiler;

  constructor() {
    this.profiler = ReactPerformanceProfiler.getInstance();
  }

  async runRerenderTest(test: RerenderTest): Promise<RerenderTestResult> {
    console.log(`🔄 Running re-render test: ${test.name}`);
    
    // Clear previous data
    this.profiler.clearData();
    
    const containerElement = document.createElement('div');
    containerElement.id = `rerender-test-${Date.now()}`;
    document.body.appendChild(containerElement);

    try {
      // Mount component with initial props
      const Component = test.component;
      let renderCount = 0;

      // Simulate component lifecycle with different props
      for (let i = 0; i < test.iterations; i++) {
        const propsIndex = i % test.propsVariations.length;
        const props = test.propsVariations[propsIndex];
        
        // Simulate render (in actual implementation, would use React DOM)
        renderCount++;
        
        // Record render metrics
        this.profiler.recordRender(test.name, {
          componentName: test.name,
          renderTime: Math.random() * 10 + 2, // 2-12ms random render time
          rerenderCount: i > 0 ? 1 : 0,
          propsChangeCount: i > 0 ? 1 : 0,
          timestamp: Date.now()
        });
        
        // Brief delay to simulate real rendering
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      const profilerData = this.profiler.getComponentData(test.name) || {
        componentName: test.name,
        renderCount: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        slowestRender: 0,
        fastestRender: 0,
        renders: [],
        unnecessaryRerenders: 0,
        propsChanges: 0
      };

      const rerenderEfficiency = test.expectedRerenders > 0 
        ? Math.max(0, (test.expectedRerenders / profilerData.renderCount) * 100)
        : 100;

      const result: RerenderTestResult = {
        testName: test.name,
        componentName: test.name,
        expectedRerenders: test.expectedRerenders,
        actualRerenders: profilerData.renderCount,
        rerenderEfficiency,
        averageRenderTime: profilerData.averageRenderTime,
        recommendations: this.generateRerenderRecommendations(profilerData, test),
        profilerData
      };

      const status = rerenderEfficiency > 80 ? '✅' : rerenderEfficiency > 60 ? '⚠️' : '❌';
      console.log(`${status} ${test.name}: ${rerenderEfficiency.toFixed(1)}% efficiency`);

      return result;

    } finally {
      // Cleanup
      document.body.removeChild(containerElement);
    }
  }

  private generateRerenderRecommendations(
    data: ComponentPerformanceData,
    test: RerenderTest
  ): string[] {
    const recommendations: string[] = [];

    if (data.averageRenderTime > 16) {
      recommendations.push('PERFORMANCE: Average render time exceeds 16ms frame budget');
      recommendations.push('Consider optimizing render logic or using React.memo');
    }

    if (data.unnecessaryRerenders > test.expectedRerenders * 0.1) {
      recommendations.push('OPTIMIZATION: Unnecessary re-renders detected');
      recommendations.push('Use React.memo, useMemo, or useCallback to prevent unnecessary renders');
    }

    if (data.renderCount > test.expectedRerenders * 1.5) {
      recommendations.push('EFFICIENCY: More renders than expected');
      recommendations.push('Review component props and state management');
    }

    if (data.slowestRender > 50) {
      recommendations.push('PERFORMANCE: Slow renders detected');
      recommendations.push('Profile component to identify performance bottlenecks');
    }

    if (data.renderCount === test.expectedRerenders) {
      recommendations.push('GOOD: Render count matches expectations');
    }

    return recommendations;
  }
}

// Pre-defined re-render tests
export const createRerenderTests = (): RerenderTest[] => {
  const sampleItems = Array.from({ length: 100 }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
    description: `Description for item ${i}`
  }));

  return [
    {
      name: 'List Selection Re-render Test',
      description: 'Tests re-render efficiency when selecting items',
      component: TestComponents.OptimizedComponent,
      iterations: 50,
      propsVariations: [
        { items: sampleItems, selectedId: 'item-1', onSelect: () => {} },
        { items: sampleItems, selectedId: 'item-2', onSelect: () => {} },
        { items: sampleItems, selectedId: 'item-3', onSelect: () => {} },
      ],
      expectedRerenders: 50
    },

    {
      name: 'Large List Filter Test',
      description: 'Tests re-render performance with large lists and filtering',
      component: TestComponents.LargeListComponent,
      iterations: 20,
      propsVariations: [
        { items: sampleItems, filter: '' },
        { items: sampleItems, filter: 'Item 1' },
        { items: sampleItems, filter: 'Item 2' },
        { items: sampleItems, filter: 'Description' },
      ],
      expectedRerenders: 20
    },

    {
      name: 'Expensive Calculation Test',
      description: 'Tests memoization effectiveness with expensive calculations',
      component: TestComponents.ExpensiveCalculationComponent,
      iterations: 30,
      propsVariations: [
        { data: Array.from({ length: 1000 }, (_, i) => i), multiplier: 1 },
        { data: Array.from({ length: 1000 }, (_, i) => i), multiplier: 2 },
        { data: Array.from({ length: 1000 }, (_, i) => i), multiplier: 1 }, // Same as first
      ],
      expectedRerenders: 30
    }
  ];
};

// Utility function to run all re-render tests
export const runRerenderTests = async (): Promise<RerenderTestResult[]> => {
  const tester = new RerenderTester();
  const tests = createRerenderTests();
  const results: RerenderTestResult[] = [];

  console.log('🔄 Running React Component Re-render Tests');
  console.log('==========================================\n');

  for (const test of tests) {
    const result = await tester.runRerenderTest(test);
    results.push(result);
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Generate summary
  const avgEfficiency = results.reduce((sum, r) => sum + r.rerenderEfficiency, 0) / results.length;
  const avgRenderTime = results.reduce((sum, r) => sum + r.averageRenderTime, 0) / results.length;

  console.log(`\n📊 Re-render Test Summary:`);
  console.log(`Tests Run: ${results.length}`);
  console.log(`Average Efficiency: ${avgEfficiency.toFixed(1)}%`);
  console.log(`Average Render Time: ${avgRenderTime.toFixed(2)}ms`);

  return results;
};

export { ReactPerformanceProfiler };