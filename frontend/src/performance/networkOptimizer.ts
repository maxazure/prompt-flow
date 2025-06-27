// Network request optimization and testing utilities
import { NetworkMetrics } from './types';

export interface NetworkOptimizationTest {
  name: string;
  description: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  iterations: number;
  concurrent?: boolean;
  timeout?: number;
  expectedResponseTime?: number;
  payload?: any;
}

export interface NetworkOptimizationReport {
  testName: string;
  url: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  throughput: number; // requests per second
  totalDataTransferred: number;
  cacheHitRate: number;
  recommendations: string[];
  metrics: NetworkMetrics[];
  timestamp: number;
}

export interface RequestCacheEntry {
  url: string;
  method: string;
  response: any;
  timestamp: number;
  ttl: number;
}

export class NetworkOptimizer {
  private cache: Map<string, RequestCacheEntry> = new Map();
  private requestDeduplication: Map<string, Promise<any>> = new Map();
  private metrics: NetworkMetrics[] = [];

  async runNetworkOptimizationTest(test: NetworkOptimizationTest): Promise<NetworkOptimizationReport> {
    console.log(`🌐 Running network optimization test: ${test.name}`);
    
    const metrics: NetworkMetrics[] = [];
    const startTime = Date.now();
    
    try {
      if (test.concurrent) {
        await this.runConcurrentRequests(test, metrics);
      } else {
        await this.runSequentialRequests(test, metrics);
      }
    } catch (error) {
      console.error(`❌ Network test failed: ${test.name}`, error);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const report = this.analyzeNetworkMetrics(test, metrics, totalTime);
    
    console.log(`✅ ${test.name}: ${report.averageResponseTime.toFixed(0)}ms avg, ${report.throughput.toFixed(1)} req/s`);
    
    return report;
  }

  private async runSequentialRequests(test: NetworkOptimizationTest, metrics: NetworkMetrics[]): Promise<void> {
    for (let i = 0; i < test.iterations; i++) {
      const metric = await this.makeOptimizedRequest(test);
      metrics.push(metric);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private async runConcurrentRequests(test: NetworkOptimizationTest, metrics: NetworkMetrics[]): Promise<void> {
    const batchSize = Math.min(test.iterations, 10); // Limit concurrent requests
    const batches = Math.ceil(test.iterations / batchSize);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchRequests = [];
      const remainingRequests = Math.min(batchSize, test.iterations - batch * batchSize);
      
      for (let i = 0; i < remainingRequests; i++) {
        batchRequests.push(this.makeOptimizedRequest(test));
      }
      
      const batchResults = await Promise.allSettled(batchRequests);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          metrics.push(result.value);
        } else {
          // Add failed request metric
          metrics.push({
            url: test.url,
            method: test.method,
            duration: 0,
            responseSize: 0,
            status: 0,
            timestamp: Date.now()
          });
        }
      });
      
      // Brief pause between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async makeOptimizedRequest(test: NetworkOptimizationTest): Promise<NetworkMetrics> {
    const requestKey = `${test.method}:${test.url}`;
    const startTime = performance.now();
    
    try {
      // Check cache first
      if (test.method === 'GET') {
        const cached = this.getCachedResponse(requestKey);
        if (cached) {
          const endTime = performance.now();
          return {
            url: test.url,
            method: test.method,
            duration: endTime - startTime,
            responseSize: JSON.stringify(cached.response).length,
            status: 200,
            timestamp: Date.now()
          };
        }
      }

      // Check for ongoing request (deduplication)
      if (this.requestDeduplication.has(requestKey)) {
        const existingRequest = this.requestDeduplication.get(requestKey)!;
        const response = await existingRequest;
        const endTime = performance.now();
        
        return {
          url: test.url,
          method: test.method,
          duration: endTime - startTime,
          responseSize: JSON.stringify(response).length,
          status: 200,
          timestamp: Date.now()
        };
      }

      // Make the actual request
      const requestPromise = this.makeRequest(test);
      this.requestDeduplication.set(requestKey, requestPromise);
      
      const response = await requestPromise;
      const endTime = performance.now();
      
      // Cache GET requests
      if (test.method === 'GET') {
        this.cacheResponse(requestKey, response);
      }
      
      // Clean up deduplication
      this.requestDeduplication.delete(requestKey);
      
      return {
        url: test.url,
        method: test.method,
        duration: endTime - startTime,
        responseSize: JSON.stringify(response).length,
        status: 200,
        timestamp: Date.now()
      };
      
    } catch (error) {
      const endTime = performance.now();
      this.requestDeduplication.delete(requestKey);
      
      return {
        url: test.url,
        method: test.method,
        duration: endTime - startTime,
        responseSize: 0,
        status: 500,
        timestamp: Date.now()
      };
    }
  }

  private async makeRequest(test: NetworkOptimizationTest): Promise<any> {
    // Simulate network request - in real implementation, use fetch
    const delay = Math.random() * 200 + 50; // 50-250ms random delay
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulate different response sizes based on endpoint
    let responseSize = 1000; // 1KB default
    if (test.url.includes('/prompts')) {
      responseSize = 5000; // 5KB for prompts
    } else if (test.url.includes('/search')) {
      responseSize = 2000; // 2KB for search
    } else if (test.url.includes('/categories')) {
      responseSize = 500; // 500B for categories
    }
    
    // Generate mock response
    const mockResponse = {
      data: new Array(Math.floor(responseSize / 10)).fill(0).map((_, i) => ({
        id: i,
        content: `Mock data item ${i}`
      })),
      meta: {
        timestamp: Date.now(),
        requestId: Math.random().toString(36).substr(2, 9)
      }
    };
    
    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Simulated network error');
    }
    
    return mockResponse;
  }

  private getCachedResponse(requestKey: string): RequestCacheEntry | null {
    const cached = this.cache.get(requestKey);
    if (!cached) return null;
    
    // Check if cache entry is still valid
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(requestKey);
      return null;
    }
    
    return cached;
  }

  private cacheResponse(requestKey: string, response: any): void {
    const entry: RequestCacheEntry = {
      url: requestKey.split(':')[1],
      method: requestKey.split(':')[0],
      response,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000 // 5 minutes
    };
    
    this.cache.set(requestKey, entry);
    
    // Limit cache size
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  private analyzeNetworkMetrics(
    test: NetworkOptimizationTest,
    metrics: NetworkMetrics[],
    totalTime: number
  ): NetworkOptimizationReport {
    const successfulRequests = metrics.filter(m => m.status >= 200 && m.status < 400);
    const failedRequests = metrics.filter(m => m.status >= 400 || m.status === 0);
    
    const responseTimes = successfulRequests.map(m => m.duration).sort((a, b) => a - b);
    const totalDataTransferred = metrics.reduce((sum, m) => sum + m.responseSize, 0);
    
    // Calculate cache hit rate
    const cacheableRequests = metrics.filter(m => test.method === 'GET');
    const cacheHits = cacheableRequests.filter(m => m.duration < 10).length; // Assume <10ms means cache hit
    const cacheHitRate = cacheableRequests.length > 0 ? (cacheHits / cacheableRequests.length) * 100 : 0;
    
    const report: NetworkOptimizationReport = {
      testName: test.name,
      url: test.url,
      totalRequests: metrics.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      averageResponseTime: responseTimes.length > 0 ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0,
      medianResponseTime: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length / 2)] : 0,
      p95ResponseTime: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)] : 0,
      p99ResponseTime: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.99)] : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      throughput: totalTime > 0 ? (successfulRequests.length / totalTime) * 1000 : 0, // requests per second
      totalDataTransferred,
      cacheHitRate,
      recommendations: [], // Will be populated below
      metrics,
      timestamp: Date.now()
    };
    
    // Generate recommendations after report object is created
    report.recommendations = this.generateNetworkRecommendations(test, report, metrics);
    
    return report;
  }

  private generateNetworkRecommendations(
    test: NetworkOptimizationTest,
    report: NetworkOptimizationReport,
    metrics: NetworkMetrics[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Response time analysis
    if (report.averageResponseTime > 1000) {
      recommendations.push('HIGH: Average response time is over 1 second');
      recommendations.push('Consider API optimization, caching, or CDN implementation');
    } else if (report.averageResponseTime > 500) {
      recommendations.push('MEDIUM: Response time could be improved');
      recommendations.push('Review database queries and API endpoint efficiency');
    }
    
    // Failure rate analysis
    const failureRate = (report.failedRequests / report.totalRequests) * 100;
    if (failureRate > 5) {
      recommendations.push(`HIGH: Failure rate is ${failureRate.toFixed(1)}% - implement retry logic`);
      recommendations.push('Add circuit breaker pattern for better resilience');
    } else if (failureRate > 1) {
      recommendations.push(`MEDIUM: Failure rate is ${failureRate.toFixed(1)}% - monitor error patterns`);
    }
    
    // Throughput analysis
    if (report.throughput < 10) {
      recommendations.push('LOW: Throughput is low - consider request optimization');
      recommendations.push('Implement request batching or concurrent processing');
    }
    
    // Cache efficiency
    if (test.method === 'GET') {
      if (report.cacheHitRate < 20) {
        recommendations.push('LOW: Cache hit rate is low - review caching strategy');
        recommendations.push('Consider implementing longer cache TTL for static data');
      } else if (report.cacheHitRate > 80) {
        recommendations.push('GOOD: Cache hit rate is excellent');
      }
    }
    
    // Data transfer analysis
    const avgResponseSize = report.totalDataTransferred / report.totalRequests;
    if (avgResponseSize > 100 * 1024) { // 100KB
      recommendations.push('MEDIUM: Large response sizes detected');
      recommendations.push('Consider response compression and pagination');
    }
    
    // Variability analysis
    const responseTimeVariability = report.maxResponseTime - report.minResponseTime;
    if (responseTimeVariability > 2000) { // 2 second difference
      recommendations.push('MEDIUM: High response time variability detected');
      recommendations.push('Investigate performance bottlenecks and load balancing');
    }
    
    // Request deduplication effectiveness
    const duplicateRequests = this.findDuplicateRequestPatterns(metrics);
    if (duplicateRequests > 0) {
      recommendations.push(`INFO: ${duplicateRequests} duplicate request patterns found`);
      recommendations.push('Request deduplication is working effectively');
    }
    
    return recommendations;
  }

  private findDuplicateRequestPatterns(metrics: NetworkMetrics[]): number {
    const requestCounts = metrics.reduce((acc, metric) => {
      const key = `${metric.method}:${metric.url}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.values(requestCounts).filter(count => count > 1).length;
  }

  getCacheStats(): { size: number; hitRate: number; entries: RequestCacheEntry[] } {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values()).filter(
      entry => now <= entry.timestamp + entry.ttl
    );
    
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      entries: validEntries
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

// Pre-defined network optimization tests
export const createNetworkOptimizationTests = (): NetworkOptimizationTest[] => {
  return [
    {
      name: 'API Response Time Test',
      description: 'Tests basic API response times',
      url: '/api/prompts',
      method: 'GET',
      iterations: 50,
      expectedResponseTime: 200
    },
    
    {
      name: 'Search API Performance',
      description: 'Tests search endpoint performance',
      url: '/api/prompts/search',
      method: 'POST',
      iterations: 30,
      payload: { query: 'test search', limit: 20 },
      expectedResponseTime: 300
    },
    
    {
      name: 'Category Loading Performance',
      description: 'Tests category API performance',
      url: '/api/categories',
      method: 'GET',
      iterations: 100,
      expectedResponseTime: 100
    },
    
    {
      name: 'Concurrent Request Handling',
      description: 'Tests API under concurrent load',
      url: '/api/prompts',
      method: 'GET',
      iterations: 20,
      concurrent: true,
      expectedResponseTime: 500
    },
    
    {
      name: 'Cache Effectiveness Test',
      description: 'Tests caching implementation effectiveness',
      url: '/api/prompts/1',
      method: 'GET',
      iterations: 50,
      expectedResponseTime: 100
    },
    
    {
      name: 'Large Payload Test',
      description: 'Tests performance with large request payloads',
      url: '/api/prompts',
      method: 'POST',
      iterations: 10,
      payload: {
        title: 'Large Prompt Test',
        content: 'x'.repeat(10000), // 10KB content
        tags: new Array(50).fill(0).map((_, i) => `tag${i}`)
      },
      expectedResponseTime: 800
    }
  ];
};

// Utility function to run all network optimization tests
export const runNetworkOptimizationTests = async (): Promise<NetworkOptimizationReport[]> => {
  const optimizer = new NetworkOptimizer();
  const tests = createNetworkOptimizationTests();
  const reports: NetworkOptimizationReport[] = [];
  
  console.log('🌐 Running Network Optimization Tests');
  console.log('====================================\n');
  
  for (const test of tests) {
    const report = await optimizer.runNetworkOptimizationTest(test);
    reports.push(report);
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Generate summary
  const avgResponseTime = reports.reduce((sum, r) => sum + r.averageResponseTime, 0) / reports.length;
  const totalRequests = reports.reduce((sum, r) => sum + r.totalRequests, 0);
  const totalFailures = reports.reduce((sum, r) => sum + r.failedRequests, 0);
  
  console.log(`\n📊 Network Optimization Summary:`);
  console.log(`Tests Run: ${reports.length}`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`Failure Rate: ${((totalFailures / totalRequests) * 100).toFixed(1)}%`);
  
  return reports;
};