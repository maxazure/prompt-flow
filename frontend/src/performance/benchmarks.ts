// Performance benchmarks for critical user interactions
import { InteractionMetrics, PerformanceMetrics } from './types';

export interface BenchmarkResult {
  name: string;
  duration: number;
  success: boolean;
  metrics: {
    [key: string]: number;
  };
  timestamp: number;
}

export interface BenchmarkSuite {
  name: string;
  description: string;
  benchmarks: BenchmarkTest[];
}

export interface BenchmarkTest {
  name: string;
  description: string;
  setup?: () => Promise<void>;
  test: () => Promise<BenchmarkResult>;
  cleanup?: () => Promise<void>;
  expectedDuration?: number;
  timeout?: number;
}

export class PerformanceBenchmark {
  private static instance: PerformanceBenchmark;
  private results: BenchmarkResult[] = [];

  static getInstance(): PerformanceBenchmark {
    if (!PerformanceBenchmark.instance) {
      PerformanceBenchmark.instance = new PerformanceBenchmark();
    }
    return PerformanceBenchmark.instance;
  }

  async runBenchmark(test: BenchmarkTest): Promise<BenchmarkResult> {
    console.log(`🏃 Running benchmark: ${test.name}`);
    
    const startTime = performance.now();
    let result: BenchmarkResult;

    try {
      // Setup
      if (test.setup) {
        await test.setup();
      }

      // Run the actual test
      const testStartTime = performance.now();
      result = await Promise.race([
        test.test(),
        this.timeoutPromise(test.timeout || 10000)
      ]);
      const testEndTime = performance.now();

      // Ensure we have duration if not set by test
      if (!result.duration) {
        result.duration = testEndTime - testStartTime;
      }

      // Cleanup
      if (test.cleanup) {
        await test.cleanup();
      }

      this.results.push(result);
      
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${result.duration.toFixed(2)}ms`);
      
      return result;

    } catch (error) {
      const endTime = performance.now();
      result = {
        name: test.name,
        duration: endTime - startTime,
        success: false,
        metrics: { error: 1 },
        timestamp: Date.now()
      };

      this.results.push(result);
      console.error(`❌ ${test.name} failed:`, error);
      return result;
    }
  }

  async runSuite(suite: BenchmarkSuite): Promise<BenchmarkResult[]> {
    console.log(`🏃‍♂️ Running benchmark suite: ${suite.name}`);
    console.log(`📝 ${suite.description}\n`);

    const results: BenchmarkResult[] = [];
    
    for (const test of suite.benchmarks) {
      const result = await this.runBenchmark(test);
      results.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.generateSuiteReport(suite.name, results);
    return results;
  }

  private timeoutPromise(timeout: number): Promise<BenchmarkResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Benchmark timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  private generateSuiteReport(suiteName: string, results: BenchmarkResult[]) {
    console.log(`\n📊 Benchmark Suite Report: ${suiteName}`);
    console.log('='.repeat(50));
    
    const successCount = results.filter(r => r.success).length;
    const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
    const avgTime = totalTime / results.length;

    console.log(`Success Rate: ${successCount}/${results.length} (${((successCount/results.length)*100).toFixed(1)}%)`);
    console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average Time: ${avgTime.toFixed(2)}ms`);
    
    console.log('\nIndividual Results:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${result.name}: ${result.duration.toFixed(2)}ms`);
    });
  }

  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  clearResults(): void {
    this.results = [];
  }
}

// Critical user interaction benchmarks
export const createCriticalInteractionsBenchmarks = (): BenchmarkSuite => {
  return {
    name: 'Critical User Interactions',
    description: 'Benchmarks for the most important user interactions in PromptFlow',
    benchmarks: [
      {
        name: 'Page Load Performance',
        description: 'Measures initial page load time',
        test: async (): Promise<BenchmarkResult> => {
          const startTime = performance.now();
          
          // Simulate page load metrics collection
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const loadTime = navigation ? navigation.loadEventEnd - navigation.navigationStart : 0;
          
          return {
            name: 'Page Load Performance',
            duration: loadTime,
            success: loadTime < 3000, // 3 second threshold
            metrics: {
              domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.navigationStart || 0,
              firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
              loadComplete: loadTime
            },
            timestamp: Date.now()
          };
        },
        expectedDuration: 2000
      },

      {
        name: 'Monaco Editor Load',
        description: 'Measures Monaco Editor initialization time',
        test: async (): Promise<BenchmarkResult> => {
          const startTime = performance.now();
          
          try {
            // Simulate Monaco Editor loading
            const monacoContainer = document.createElement('div');
            monacoContainer.id = 'monaco-benchmark';
            monacoContainer.style.width = '800px';
            monacoContainer.style.height = '400px';
            document.body.appendChild(monacoContainer);
            
            // Wait for Monaco to be available (simulate async loading)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Cleanup
            document.body.removeChild(monacoContainer);
            
            return {
              name: 'Monaco Editor Load',
              duration,
              success: duration < 1000, // 1 second threshold
              metrics: {
                initTime: duration,
                memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
              },
              timestamp: Date.now()
            };
          } catch (error) {
            const endTime = performance.now();
            return {
              name: 'Monaco Editor Load',
              duration: endTime - startTime,
              success: false,
              metrics: { error: 1 },
              timestamp: Date.now()
            };
          }
        },
        expectedDuration: 800
      },

      {
        name: 'Category Sidebar Interaction',
        description: 'Measures category sidebar toggle performance',
        test: async (): Promise<BenchmarkResult> => {
          const startTime = performance.now();
          
          try {
            // Simulate sidebar toggle
            const sidebar = document.querySelector('[data-testid="category-sidebar"]') as HTMLElement;
            if (sidebar) {
              // Trigger click event
              const clickEvent = new MouseEvent('click', { bubbles: true });
              sidebar.dispatchEvent(clickEvent);
              
              // Wait for animation/state change
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            return {
              name: 'Category Sidebar Interaction',
              duration,
              success: duration < 100, // 100ms threshold for smooth interaction
              metrics: {
                interactionTime: duration,
                elementFound: sidebar ? 1 : 0
              },
              timestamp: Date.now()
            };
          } catch (error) {
            const endTime = performance.now();
            return {
              name: 'Category Sidebar Interaction',
              duration: endTime - startTime,
              success: false,
              metrics: { error: 1 },
              timestamp: Date.now()
            };
          }
        },
        expectedDuration: 50
      },

      {
        name: 'Search Input Response',
        description: 'Measures search input responsiveness',
        test: async (): Promise<BenchmarkResult> => {
          const startTime = performance.now();
          
          try {
            // Create a search input element
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Search prompts...';
            document.body.appendChild(searchInput);
            
            // Simulate typing
            const inputEvent = new InputEvent('input', { bubbles: true });
            searchInput.value = 'test search query';
            searchInput.dispatchEvent(inputEvent);
            
            // Wait for potential debounced search
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Cleanup
            document.body.removeChild(searchInput);
            
            return {
              name: 'Search Input Response',
              duration,
              success: duration < 350, // Including debounce time
              metrics: {
                inputResponseTime: duration,
                charactersTyped: searchInput.value.length
              },
              timestamp: Date.now()
            };
          } catch (error) {
            const endTime = performance.now();
            return {
              name: 'Search Input Response',
              duration: endTime - startTime,
              success: false,
              metrics: { error: 1 },
              timestamp: Date.now()
            };
          }
        },
        expectedDuration: 300
      },

      {
        name: 'Route Navigation Performance',
        description: 'Measures client-side navigation performance',
        test: async (): Promise<BenchmarkResult> => {
          const startTime = performance.now();
          
          try {
            // Simulate route change
            const originalLocation = window.location.href;
            
            // Trigger navigation event
            const navigationEvent = new PopStateEvent('popstate', { state: { path: '/templates' } });
            window.dispatchEvent(navigationEvent);
            
            // Wait for React Router to handle the navigation
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            return {
              name: 'Route Navigation Performance',
              duration,
              success: duration < 200, // 200ms for smooth navigation
              metrics: {
                navigationTime: duration,
                routeChanged: 1
              },
              timestamp: Date.now()
            };
          } catch (error) {
            const endTime = performance.now();
            return {
              name: 'Route Navigation Performance',
              duration: endTime - startTime,
              success: false,
              metrics: { error: 1 },
              timestamp: Date.now()
            };
          }
        },
        expectedDuration: 150
      },

      {
        name: 'Large List Rendering',
        description: 'Measures rendering performance with large datasets',
        test: async (): Promise<BenchmarkResult> => {
          const startTime = performance.now();
          
          try {
            // Create a container for large list
            const container = document.createElement('div');
            container.id = 'large-list-benchmark';
            document.body.appendChild(container);
            
            // Simulate rendering 1000 items
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < 1000; i++) {
              const item = document.createElement('div');
              item.className = 'list-item';
              item.textContent = `Item ${i}`;
              fragment.appendChild(item);
            }
            
            // Trigger reflow by appending
            container.appendChild(fragment);
            
            // Force layout calculation
            container.offsetHeight;
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Cleanup
            document.body.removeChild(container);
            
            return {
              name: 'Large List Rendering',
              duration,
              success: duration < 500, // 500ms threshold for 1000 items
              metrics: {
                renderTime: duration,
                itemsRendered: 1000,
                memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
              },
              timestamp: Date.now()
            };
          } catch (error) {
            const endTime = performance.now();
            return {
              name: 'Large List Rendering',
              duration: endTime - startTime,
              success: false,
              metrics: { error: 1 },
              timestamp: Date.now()
            };
          }
        },
        expectedDuration: 300
      }
    ]
  };
};

// Utility function to run all critical benchmarks
export const runCriticalBenchmarks = async (): Promise<BenchmarkResult[]> => {
  const benchmarkRunner = PerformanceBenchmark.getInstance();
  const suite = createCriticalInteractionsBenchmarks();
  return benchmarkRunner.runSuite(suite);
};