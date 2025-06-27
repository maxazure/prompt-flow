# PromptFlow Performance Testing Suite

This comprehensive performance testing suite provides tools and utilities for monitoring, measuring, and optimizing the performance of the PromptFlow application.

## Features

### 🚀 Performance Monitoring
- **Real-time Web Vitals tracking** (FCP, LCP, FID, CLS)
- **Memory usage monitoring** with leak detection
- **Network request optimization** and caching
- **React component render profiling**
- **Large dataset performance testing**

### 📊 Bundle Analysis
- **Bundle size analysis** with chunk breakdown
- **Dependency optimization** recommendations
- **Code splitting effectiveness** evaluation
- **Monaco Editor optimization** suggestions

### 🧪 Automated Testing
- **Critical user interaction benchmarks**
- **Memory leak detection tests**
- **Network optimization tests**
- **React re-render efficiency tests**
- **Large dataset performance tests**

### 📈 Reporting & Analytics
- **Performance trend analysis**
- **Alert system** for performance degradation
- **Downloadable reports** (HTML, JSON, CSV)
- **API integration** for monitoring services

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Performance Tests

```bash
# Run all performance tests
npm run perf:all

# Run individual test suites
npm run perf:benchmark    # Critical interaction benchmarks
npm run perf:memory      # Memory leak detection
npm run perf:network     # Network optimization tests
npm run perf:react       # React component performance
npm run perf:dataset     # Large dataset tests

# Analyze bundle size
npm run perf:analyze

# Generate performance report
npm run perf:report
```

### 3. Enable Real-time Monitoring

Add the performance profiler to your application:

```tsx
import { PerformanceProfiler, usePerformanceProfiler } from './src/performance';

function App() {
  const { ProfilerComponent } = usePerformanceProfiler(true);

  return (
    <div>
      {/* Your app content */}
      <ProfilerComponent />
    </div>
  );
}
```

### 4. Monitor Components

Wrap components with performance monitoring:

```tsx
import { withPerformanceProfiler, usePerformanceMonitor } from './src/performance';

// Option 1: HOC wrapper
const MonitoredComponent = withPerformanceProfiler(MyComponent, 'MyComponent');

// Option 2: Hook-based monitoring
function MyComponent() {
  const { renderCount, lastRenderTime } = usePerformanceMonitor('MyComponent');
  
  return <div>Renders: {renderCount}, Last: {lastRenderTime}ms</div>;
}
```

## Performance Testing

### Critical User Interactions

Tests the most important user flows:

- Page load performance
- Monaco Editor initialization
- Category sidebar interactions
- Search input responsiveness
- Route navigation performance
- Large list rendering

```bash
npm run perf:benchmark
```

### Memory Leak Detection

Identifies potential memory leaks in components:

- Component mount/unmount cycles
- Monaco Editor lifecycle
- Large dataset rendering
- Event listener cleanup

```bash
npm run perf:memory
```

### Network Optimization

Optimizes API requests and data transfer:

- Request caching and deduplication
- Response time analysis
- Failure rate monitoring
- Data transfer optimization

```bash
npm run perf:network
```

### React Component Performance

Analyzes React-specific performance issues:

- Re-render optimization
- Props change detection
- Memoization effectiveness
- Component profiling

```bash
npm run perf:react
```

### Large Dataset Performance

Tests performance with large amounts of data:

- Rendering performance
- Filtering and sorting
- Search functionality
- Scrolling performance
- Memory usage patterns

```bash
npm run perf:dataset
```

## Bundle Analysis

Analyze and optimize bundle size:

```bash
# Generate bundle analysis report
npm run perf:analyze

# View report
open performance-reports/latest-bundle-analysis.html
```

The bundle analyzer provides:

- **Total bundle size** breakdown
- **Largest dependencies** identification
- **Duplicate modules** detection
- **Optimization recommendations**
- **Monaco Editor** specific suggestions

## Performance Hooks

### useMemoryTracker

Monitor memory usage in real-time:

```tsx
import { useMemoryTracker } from './src/performance/hooks';

function MyComponent() {
  const { 
    memoryMetrics, 
    memoryTrend, 
    formattedMemoryUsage 
  } = useMemoryTracker(5000); // Check every 5 seconds

  return (
    <div>
      Memory: {formattedMemoryUsage}
      {memoryTrend?.trend === 'growing' && (
        <span className="text-red-500">⚠️ Memory leak detected</span>
      )}
    </div>
  );
}
```

### useInteractionTracker

Track user interaction performance:

```tsx
import { useInteractionTracker } from './src/performance/hooks';

function InteractiveComponent() {
  const { trackInteraction, slowInteractions } = useInteractionTracker();

  const handleClick = () => {
    const endTracking = trackInteraction('click', 'my-button');
    // Perform action
    endTracking();
  };

  return (
    <div>
      <button onClick={handleClick}>Click me</button>
      {slowInteractions.length > 0 && (
        <div className="text-yellow-500">
          {slowInteractions.length} slow interactions detected
        </div>
      )}
    </div>
  );
}
```

### useLazyLoadWithPerformance

Monitor lazy loading performance:

```tsx
import { useLazyLoadWithPerformance } from './src/performance/hooks';

function LazyComponent() {
  const { 
    data, 
    loading, 
    loadTime, 
    formattedLoadTime 
  } = useLazyLoadWithPerformance(
    () => import('./HeavyComponent'),
    []
  );

  return (
    <div>
      {loading ? 'Loading...' : `Loaded in ${formattedLoadTime}`}
      {data && <data.default />}
    </div>
  );
}
```

## Performance Profiler

The built-in performance profiler provides real-time monitoring:

### Features
- **Web Vitals score** with live updates
- **Memory usage** tracking and trends
- **Interaction performance** monitoring
- **Test suite runner** with results
- **Keyboard shortcut** (Ctrl/Cmd + Shift + P)

### Usage

```tsx
import { PerformanceProfiler } from './src/performance/profiler';

// Always visible
<PerformanceProfiler visible={true} position="bottom-right" />

// Toggle with keyboard shortcut
const { ProfilerComponent } = usePerformanceProfiler();
<ProfilerComponent />
```

## Reporting & Analytics

### Generate Reports

```tsx
import { generatePerformanceReport, downloadPerformanceReport } from './src/performance/reporter';

// Generate in-memory report
const report = await generatePerformanceReport({
  includeMemoryMetrics: true,
  includeNetworkMetrics: true,
  timeframe: 24, // hours
  format: 'json'
});

// Download HTML report
await downloadPerformanceReport('html');

// Send to API
await generatePerformanceReport({
  destination: 'api',
  endpoint: '/api/performance-reports'
});
```

### Performance Alerts

The system automatically detects performance issues:

```tsx
import { getPerformanceAlerts } from './src/performance/reporter';

const alerts = getPerformanceAlerts(true); // Only unresolved
alerts.forEach(alert => {
  console.warn(`Performance Alert: ${alert.message}`);
});
```

## Configuration

### Environment Variables

```env
# Performance monitoring endpoint
VITE_PERFORMANCE_ENDPOINT=https://api.example.com/performance

# Enable performance profiler in production
VITE_ENABLE_PROFILER=false
```

### Performance Thresholds

Customize performance thresholds in `src/performance/types.ts`:

```typescript
export const PERFORMANCE_THRESHOLDS = {
  firstContentfulPaint: { good: 1800, needsImprovement: 3000, poor: 4000 },
  largestContentfulPaint: { good: 2500, needsImprovement: 4000, poor: 4000 },
  // ... other thresholds
};
```

## Best Practices

### 1. Component Optimization

```tsx
// Use React.memo for expensive components
const OptimizedComponent = React.memo(({ data }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data);
  }, [data]);

  return <div>{processedData}</div>;
});

// Profile with performance monitoring
const ProfiledComponent = withPerformanceProfiler(OptimizedComponent, 'MyComponent');
```

### 2. Memory Management

```tsx
function ComponentWithCleanup() {
  useEffect(() => {
    const subscription = eventEmitter.subscribe(handleEvent);
    
    // Always clean up
    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
```

### 3. Network Optimization

```tsx
// Use request deduplication and caching
const { data } = useLazyLoadWithPerformance(
  () => fetch('/api/data').then(r => r.json()),
  [id] // Only refetch when id changes
);
```

### 4. Bundle Optimization

- Use dynamic imports for code splitting
- Implement lazy loading for heavy components
- Optimize Monaco Editor usage
- Monitor bundle size regularly

## Troubleshooting

### Common Performance Issues

1. **High Memory Usage**
   - Check for memory leaks with `npm run perf:memory`
   - Review component cleanup in useEffect
   - Monitor large data structures

2. **Slow Rendering**
   - Use React Profiler to identify slow components
   - Implement memoization and optimization
   - Consider virtualization for large lists

3. **Network Issues**
   - Run network tests with `npm run perf:network`
   - Implement request caching
   - Add retry logic for failed requests

4. **Large Bundle Size**
   - Analyze bundle with `npm run perf:analyze`
   - Implement code splitting
   - Optimize dependencies

### Performance Debugging

1. Enable the performance profiler: `Ctrl/Cmd + Shift + P`
2. Monitor the "Memory" tab for leaks
3. Check "Tests" tab for automated test results
4. Review console warnings for slow operations

## Contributing

When adding new features:

1. **Add performance monitoring** to new components
2. **Write performance tests** for critical functionality
3. **Monitor bundle impact** of new dependencies
4. **Update performance documentation**

Example test structure:

```typescript
// src/components/__tests__/MyComponent.perf.test.ts
import { renderWithPerformanceMonitoring } from '../test-utils';

describe('MyComponent Performance', () => {
  it('should render within performance budget', async () => {
    const { result } = await renderWithPerformanceMonitoring(<MyComponent />);
    expect(result.renderTime).toBeLessThan(16); // 60fps budget
  });
});
```

## Resources

- [Web Vitals Documentation](https://web.dev/vitals/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Bundle Analysis Best Practices](https://webpack.js.org/guides/bundle-analysis/)
- [Memory Leak Detection](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API)