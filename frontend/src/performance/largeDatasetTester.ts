// Large dataset performance testing utilities
import { MemoryMetrics, InteractionMetrics } from './types';
import { MetricsCalculator } from './metrics';

export interface DatasetTest {
  name: string;
  description: string;
  dataSize: number; // Number of items
  itemComplexity: 'simple' | 'medium' | 'complex';
  operations: DatasetOperation[];
  memoryThreshold: number; // MB
  timeThreshold: number; // ms
}

export interface DatasetOperation {
  type: 'render' | 'filter' | 'sort' | 'search' | 'paginate' | 'scroll';
  description: string;
  execute: (data: any[], container: HTMLElement) => Promise<OperationResult>;
}

export interface OperationResult {
  duration: number;
  memoryUsage: number;
  itemsProcessed: number;
  success: boolean;
  error?: string;
}

export interface DatasetTestResult {
  testName: string;
  dataSize: number;
  operationResults: Map<string, OperationResult>;
  totalTime: number;
  peakMemoryUsage: number;
  memoryGrowth: number;
  performance: 'excellent' | 'good' | 'poor' | 'critical';
  recommendations: string[];
  timestamp: number;
}

export class LargeDatasetTester {
  private memorySnapshots: MemoryMetrics[] = [];

  async runDatasetTest(test: DatasetTest): Promise<DatasetTestResult> {
    console.log(`📊 Running large dataset test: ${test.name} (${test.dataSize} items)`);
    
    const operationResults = new Map<string, OperationResult>();
    const testStartTime = performance.now();
    
    // Create test container
    const container = document.createElement('div');
    container.id = `dataset-test-${Date.now()}`;
    container.style.width = '800px';
    container.style.height = '600px';
    container.style.overflow = 'auto';
    container.style.position = 'absolute';
    container.style.left = '-9999px'; // Hide from view
    document.body.appendChild(container);

    try {
      // Generate test data
      const data = this.generateTestData(test.dataSize, test.itemComplexity);
      
      // Take initial memory snapshot
      await this.forceGarbageCollection();
      const initialMemory = this.captureMemorySnapshot();
      this.memorySnapshots = [initialMemory];
      
      // Run operations
      for (const operation of test.operations) {
        console.log(`  Running ${operation.type}...`);
        
        const result = await operation.execute(data, container);
        operationResults.set(operation.type, result);
        
        // Capture memory after each operation
        await this.forceGarbageCollection();
        const memorySnapshot = this.captureMemorySnapshot();
        this.memorySnapshots.push(memorySnapshot);
        
        // Brief pause between operations
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const testEndTime = performance.now();
      const totalTime = testEndTime - testStartTime;
      
      // Calculate metrics
      const peakMemoryUsage = Math.max(...this.memorySnapshots.map(m => m.usedJSHeapSize));
      const memoryGrowth = this.memorySnapshots[this.memorySnapshots.length - 1].usedJSHeapSize - initialMemory.usedJSHeapSize;
      
      const performance = this.evaluatePerformance(test, operationResults, totalTime, memoryGrowth);
      const recommendations = this.generateRecommendations(test, operationResults, performance);
      
      const result: DatasetTestResult = {
        testName: test.name,
        dataSize: test.dataSize,
        operationResults,
        totalTime,
        peakMemoryUsage,
        memoryGrowth,
        performance,
        recommendations,
        timestamp: Date.now()
      };
      
      const statusIcon = performance === 'excellent' ? '✅' : performance === 'good' ? '⚡' : performance === 'poor' ? '⚠️' : '❌';
      console.log(`${statusIcon} ${test.name}: ${performance} (${totalTime.toFixed(0)}ms, ${MetricsCalculator.formatBytes(memoryGrowth)} growth)`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Dataset test failed: ${test.name}`, error);
      throw error;
    } finally {
      // Cleanup
      document.body.removeChild(container);
      this.memorySnapshots = [];
    }
  }

  private generateTestData(size: number, complexity: 'simple' | 'medium' | 'complex'): any[] {
    const data = [];
    
    for (let i = 0; i < size; i++) {
      let item: any;
      
      switch (complexity) {
        case 'simple':
          item = {
            id: i,
            name: `Item ${i}`,
            value: Math.random() * 100
          };
          break;
          
        case 'medium':
          item = {
            id: i,
            name: `Item ${i}`,
            title: `Title for item ${i}`,
            description: `This is a description for item ${i}. `.repeat(3),
            category: `Category ${i % 10}`,
            tags: [`tag-${i % 5}`, `tag-${i % 7}`, `tag-${i % 3}`],
            value: Math.random() * 100,
            priority: Math.floor(Math.random() * 5) + 1,
            createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
          };
          break;
          
        case 'complex':
          item = {
            id: i,
            name: `Complex Item ${i}`,
            title: `Complex Title for item ${i}`,
            description: `This is a very detailed description for complex item ${i}. `.repeat(10),
            category: `Category ${i % 20}`,
            subcategory: `Subcategory ${i % 15}`,
            tags: Array.from({ length: 10 }, (_, j) => `tag-${(i + j) % 25}`),
            metadata: {
              author: `Author ${i % 50}`,
              version: `v${Math.floor(i / 100)}.${i % 100}`,
              size: Math.random() * 1000000,
              checksum: Math.random().toString(36).substr(2, 16),
              dependencies: Array.from({ length: 5 }, (_, j) => `dep-${(i + j) % 30}`)
            },
            content: `Content for item ${i}. `.repeat(20),
            value: Math.random() * 1000,
            priority: Math.floor(Math.random() * 10) + 1,
            status: ['active', 'inactive', 'pending', 'archived'][i % 4],
            createdAt: new Date(Date.now() - Math.random() * 100000000000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
            stats: {
              views: Math.floor(Math.random() * 10000),
              likes: Math.floor(Math.random() * 1000),
              downloads: Math.floor(Math.random() * 5000),
              rating: Math.random() * 5
            }
          };
          break;
      }
      
      data.push(item);
    }
    
    return data;
  }

  private captureMemorySnapshot(): MemoryMetrics {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory?.usedJSHeapSize || 0,
      totalJSHeapSize: memory?.totalJSHeapSize || 0,
      jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
      timestamp: Date.now()
    };
  }

  private async forceGarbageCollection(): Promise<void> {
    if ('gc' in window) {
      (window as any).gc();
    }
    
    // Create and destroy temporary objects to encourage GC
    const temp = new Array(1000).fill(0).map(() => ({ 
      data: new Array(100).fill(Math.random()) 
    }));
    temp.length = 0;
    
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private evaluatePerformance(
    test: DatasetTest,
    results: Map<string, OperationResult>,
    totalTime: number,
    memoryGrowth: number
  ): 'excellent' | 'good' | 'poor' | 'critical' {
    const memoryGrowthMB = memoryGrowth / (1024 * 1024);
    const avgOperationTime = Array.from(results.values()).reduce((sum, r) => sum + r.duration, 0) / results.size;
    
    // Critical thresholds
    if (memoryGrowthMB > test.memoryThreshold * 2 || totalTime > test.timeThreshold * 3) {
      return 'critical';
    }
    
    // Poor thresholds
    if (memoryGrowthMB > test.memoryThreshold || totalTime > test.timeThreshold * 2) {
      return 'poor';
    }
    
    // Good thresholds
    if (memoryGrowthMB > test.memoryThreshold * 0.5 || totalTime > test.timeThreshold) {
      return 'good';
    }
    
    return 'excellent';
  }

  private generateRecommendations(
    test: DatasetTest,
    results: Map<string, OperationResult>,
    performance: string
  ): string[] {
    const recommendations: string[] = [];
    
    if (performance === 'critical') {
      recommendations.push('CRITICAL: Performance is unacceptable for production use');
      recommendations.push('Implement virtualization for large lists immediately');
      recommendations.push('Consider server-side pagination and filtering');
    }
    
    if (performance === 'poor') {
      recommendations.push('WARNING: Performance issues detected');
      recommendations.push('Implement lazy loading or virtual scrolling');
      recommendations.push('Consider data pagination or infinite scroll');
    }
    
    // Operation-specific recommendations
    const renderResult = results.get('render');
    if (renderResult && renderResult.duration > 1000) {
      recommendations.push('Slow rendering detected - implement React.memo or virtualization');
    }
    
    const filterResult = results.get('filter');
    if (filterResult && filterResult.duration > 500) {
      recommendations.push('Slow filtering - implement debounced search or server-side filtering');
    }
    
    const sortResult = results.get('sort');
    if (sortResult && sortResult.duration > 300) {
      recommendations.push('Slow sorting - consider server-side sorting for large datasets');
    }
    
    const scrollResult = results.get('scroll');
    if (scrollResult && scrollResult.duration > 16) {
      recommendations.push('Scrolling performance issues - implement virtual scrolling');
    }
    
    // Memory-specific recommendations
    const memoryGrowth = this.memorySnapshots[this.memorySnapshots.length - 1].usedJSHeapSize - this.memorySnapshots[0].usedJSHeapSize;
    const memoryGrowthMB = memoryGrowth / (1024 * 1024);
    
    if (memoryGrowthMB > 50) {
      recommendations.push('High memory usage - implement data cleanup and object pooling');
    }
    
    if (performance === 'excellent') {
      recommendations.push('Performance is excellent for this dataset size');
    }
    
    return recommendations;
  }
}

// Pre-defined dataset operations
export const createDatasetOperations = (): DatasetOperation[] => {
  return [
    {
      type: 'render',
      description: 'Render all items in a list',
      execute: async (data: any[], container: HTMLElement): Promise<OperationResult> => {
        const startTime = performance.now();
        const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
        
        try {
          // Clear container
          container.innerHTML = '';
          
          // Create list container
          const listContainer = document.createElement('div');
          listContainer.className = 'dataset-list';
          
          // Render all items
          const fragment = document.createDocumentFragment();
          data.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'dataset-item';
            itemElement.innerHTML = `
              <div class="item-header">
                <h3>${item.name || item.title}</h3>
                <span class="item-id">#${item.id}</span>
              </div>
              <div class="item-content">
                <p>${item.description || 'No description'}</p>
                ${item.tags ? `<div class="tags">${item.tags.slice(0, 3).map((tag: string) => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
              </div>
            `;
            fragment.appendChild(itemElement);
          });
          
          listContainer.appendChild(fragment);
          container.appendChild(listContainer);
          
          // Force layout calculation
          container.offsetHeight;
          
          const endTime = performance.now();
          const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
          
          return {
            duration: endTime - startTime,
            memoryUsage: finalMemory - initialMemory,
            itemsProcessed: data.length,
            success: true
          };
        } catch (error) {
          const endTime = performance.now();
          return {
            duration: endTime - startTime,
            memoryUsage: 0,
            itemsProcessed: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    },

    {
      type: 'filter',
      description: 'Filter items by search term',
      execute: async (data: any[], container: HTMLElement): Promise<OperationResult> => {
        const startTime = performance.now();
        const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
        
        try {
          const searchTerm = 'Item 1'; // Filter for items containing "Item 1"
          const filteredData = data.filter(item => 
            (item.name && item.name.includes(searchTerm)) ||
            (item.title && item.title.includes(searchTerm)) ||
            (item.description && item.description.includes(searchTerm))
          );
          
          const endTime = performance.now();
          const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
          
          return {
            duration: endTime - startTime,
            memoryUsage: finalMemory - initialMemory,
            itemsProcessed: filteredData.length,
            success: true
          };
        } catch (error) {
          const endTime = performance.now();
          return {
            duration: endTime - startTime,
            memoryUsage: 0,
            itemsProcessed: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    },

    {
      type: 'sort',
      description: 'Sort items by multiple criteria',
      execute: async (data: any[], container: HTMLElement): Promise<OperationResult> => {
        const startTime = performance.now();
        const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
        
        try {
          // Create a copy to avoid mutating original data
          const sortedData = [...data].sort((a, b) => {
            // Sort by priority (descending), then by name (ascending)
            if (a.priority !== b.priority) {
              return (b.priority || 0) - (a.priority || 0);
            }
            return (a.name || '').localeCompare(b.name || '');
          });
          
          const endTime = performance.now();
          const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
          
          return {
            duration: endTime - startTime,
            memoryUsage: finalMemory - initialMemory,
            itemsProcessed: sortedData.length,
            success: true
          };
        } catch (error) {
          const endTime = performance.now();
          return {
            duration: endTime - startTime,
            memoryUsage: 0,
            itemsProcessed: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    },

    {
      type: 'search',
      description: 'Complex search with multiple criteria',
      execute: async (data: any[], container: HTMLElement): Promise<OperationResult> => {
        const startTime = performance.now();
        const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
        
        try {
          const searchResults = data.filter(item => {
            // Complex search criteria
            const nameMatch = item.name && item.name.toLowerCase().includes('item');
            const categoryMatch = item.category && item.category.includes('Category 1');
            const tagMatch = item.tags && item.tags.some((tag: string) => tag.includes('tag-1'));
            const valueMatch = item.value && item.value > 50;
            
            return nameMatch || categoryMatch || tagMatch || valueMatch;
          }).sort((a, b) => {
            // Sort by relevance (simplified scoring)
            const scoreA = (a.name?.includes('item') ? 1 : 0) + (a.value > 75 ? 1 : 0);
            const scoreB = (b.name?.includes('item') ? 1 : 0) + (b.value > 75 ? 1 : 0);
            return scoreB - scoreA;
          });
          
          const endTime = performance.now();
          const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
          
          return {
            duration: endTime - startTime,
            memoryUsage: finalMemory - initialMemory,
            itemsProcessed: searchResults.length,
            success: true
          };
        } catch (error) {
          const endTime = performance.now();
          return {
            duration: endTime - startTime,
            memoryUsage: 0,
            itemsProcessed: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    },

    {
      type: 'scroll',
      description: 'Simulate scrolling through large list',
      execute: async (data: any[], container: HTMLElement): Promise<OperationResult> => {
        const startTime = performance.now();
        const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
        
        try {
          // Create scrollable content
          container.innerHTML = '';
          const scrollContainer = document.createElement('div');
          scrollContainer.style.height = '600px';
          scrollContainer.style.overflowY = 'auto';
          
          const content = document.createElement('div');
          content.style.height = `${data.length * 50}px`; // 50px per item
          scrollContainer.appendChild(content);
          container.appendChild(scrollContainer);
          
          // Simulate scroll events
          const scrollSteps = 10;
          const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
          
          for (let i = 0; i < scrollSteps; i++) {
            const scrollTop = (scrollHeight / scrollSteps) * i;
            scrollContainer.scrollTop = scrollTop;
            
            // Trigger scroll event
            const scrollEvent = new Event('scroll');
            scrollContainer.dispatchEvent(scrollEvent);
            
            // Wait a bit to simulate real scrolling
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          const endTime = performance.now();
          const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
          
          return {
            duration: endTime - startTime,
            memoryUsage: finalMemory - initialMemory,
            itemsProcessed: scrollSteps,
            success: true
          };
        } catch (error) {
          const endTime = performance.now();
          return {
            duration: endTime - startTime,
            memoryUsage: 0,
            itemsProcessed: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }
  ];
};

// Pre-defined dataset tests
export const createLargeDatasetTests = (): DatasetTest[] => {
  const operations = createDatasetOperations();
  
  return [
    {
      name: 'Small Dataset Performance',
      description: 'Tests performance with 1,000 simple items',
      dataSize: 1000,
      itemComplexity: 'simple',
      operations: operations,
      memoryThreshold: 5, // 5MB
      timeThreshold: 1000 // 1 second
    },
    
    {
      name: 'Medium Dataset Performance',
      description: 'Tests performance with 5,000 medium complexity items',
      dataSize: 5000,
      itemComplexity: 'medium',
      operations: operations,
      memoryThreshold: 15, // 15MB
      timeThreshold: 3000 // 3 seconds
    },
    
    {
      name: 'Large Dataset Performance',
      description: 'Tests performance with 10,000 complex items',
      dataSize: 10000,
      itemComplexity: 'complex',
      operations: operations,
      memoryThreshold: 30, // 30MB
      timeThreshold: 5000 // 5 seconds
    },
    
    {
      name: 'Extreme Dataset Stress Test',
      description: 'Stress test with 50,000 complex items',
      dataSize: 50000,
      itemComplexity: 'complex',
      operations: operations.slice(0, 3), // Only run core operations for extreme test
      memoryThreshold: 100, // 100MB
      timeThreshold: 15000 // 15 seconds
    }
  ];
};

// Utility function to run all large dataset tests
export const runLargeDatasetTests = async (): Promise<DatasetTestResult[]> => {
  const tester = new LargeDatasetTester();
  const tests = createLargeDatasetTests();
  const results: DatasetTestResult[] = [];
  
  console.log('📊 Running Large Dataset Performance Tests');
  console.log('==========================================\n');
  
  for (const test of tests) {
    const result = await tester.runDatasetTest(test);
    results.push(result);
    
    // Longer pause between tests for memory cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate summary
  const criticalTests = results.filter(r => r.performance === 'critical').length;
  const poorTests = results.filter(r => r.performance === 'poor').length;
  const goodTests = results.filter(r => r.performance === 'good').length;
  const excellentTests = results.filter(r => r.performance === 'excellent').length;
  
  console.log(`\n📊 Large Dataset Test Summary:`);
  console.log(`Tests Run: ${results.length}`);
  console.log(`Excellent: ${excellentTests}, Good: ${goodTests}, Poor: ${poorTests}, Critical: ${criticalTests}`);
  
  return results;
};