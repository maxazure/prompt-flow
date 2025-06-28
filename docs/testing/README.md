# 🧪 Testing Documentation

Comprehensive testing strategy and documentation for PromptFlow. Our testing approach ensures high code quality, reliability, and maintainability.

## 🎯 Testing Philosophy

PromptFlow follows a **Test-Driven Development (TDD)** approach with comprehensive test coverage:

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test API endpoints and service interactions
- **End-to-End Tests**: Test complete user workflows and scenarios
- **Performance Tests**: Ensure system performance under load

## 📊 Current Test Status

| Test Type | Count | Coverage | Status |
|-----------|-------|----------|--------|
| **Unit Tests** | 185+ | 95%+ | ✅ Passing |
| **Integration Tests** | 95+ | 100% | ✅ Passing |
| **E2E Tests** | 6 suites | All workflows | ✅ Passing |
| **Performance Tests** | 14 tests | Core features | ✅ Passing |

## 📋 Testing Categories

### 🔬 [Unit Testing](./unit-tests.md)
- **Frontend**: React component testing with Vitest + Testing Library
- **Backend**: Service and utility function testing with Jest
- **Coverage**: 95%+ code coverage maintained

### 🔗 [Integration Testing](./integration-tests.md)
- **API Testing**: Complete REST API endpoint testing
- **Database Testing**: Data persistence and relationships
- **Service Integration**: Cross-service communication testing

### 🎭 [End-to-End Testing](./e2e-tests.md)
- **User Workflows**: Complete user journey testing
- **Browser Testing**: Cross-browser compatibility
- **Responsive Testing**: Mobile and desktop scenarios

### ⚡ [Performance Testing](./performance.md)
- **Load Testing**: System performance under stress
- **Memory Testing**: Memory leak detection
- **Bundle Analysis**: Frontend optimization metrics

## 🛠️ Testing Tools

### Frontend Testing Stack
```bash
# Test runners and frameworks
vitest           # Fast unit test runner
@testing-library/react  # React component testing
@testing-library/user-event  # User interaction simulation
playwright       # E2E testing framework
jsdom           # DOM environment for testing
```

### Backend Testing Stack
```bash
# Test frameworks
jest            # Node.js testing framework
supertest       # HTTP assertion testing
@types/jest     # TypeScript support for Jest
```

## 🚀 Running Tests

### Quick Test Commands

```bash
# Run all tests
pnpm test

# Frontend tests
cd frontend
pnpm test                    # Unit tests
pnpm run test:e2e           # E2E tests
pnpm run test:coverage      # Coverage report
pnpm run perf:all          # Performance tests

# Backend tests
cd backend
pnpm test                    # Unit and integration tests
pnpm run test:watch         # Watch mode
```

### Detailed Test Execution

```bash
# Unit tests with coverage
pnpm run test:coverage

# E2E tests with UI
pnpm run test:e2e -- --ui

# Performance benchmarks
pnpm run perf:benchmark

# Memory leak detection
pnpm run perf:memory

# Network optimization tests
pnpm run perf:network
```

## 📈 Test Reports

### Coverage Reports
- **HTML Report**: `frontend/coverage/index.html`
- **JSON Report**: `frontend/coverage/coverage-final.json`
- **Console Output**: Real-time coverage during test runs

### E2E Test Reports
- **Playwright Report**: `frontend/playwright-report/index.html`
- **Test Results**: `frontend/test-results/`
- **Screenshots**: Automatically captured on failures

### Performance Reports
- **Bundle Analysis**: `frontend/performance-reports/`
- **Benchmark Results**: Console output with metrics
- **Memory Analysis**: Detailed memory usage reports

## 🔧 Test Configuration

### Frontend Test Config (vitest.config.ts)
```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['**/*.test.{ts,tsx}', '**/node_modules/**']
    }
  }
});
```

### Backend Test Config (jest.config.js)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.test.{ts,js}'
  ]
};
```

## 📝 Writing Tests

### Component Test Example
```typescript
// CategorySidebar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySidebar } from '../CategorySidebar';

describe('CategorySidebar', () => {
  it('should render categories with correct count', () => {
    render(<CategorySidebar categories={mockCategories} />);
    
    expect(screen.getByText('Personal (5)')).toBeInTheDocument();
    expect(screen.getByText('Team (3)')).toBeInTheDocument();
  });

  it('should handle category selection', () => {
    const onSelect = vi.fn();
    render(<CategorySidebar onCategorySelect={onSelect} />);
    
    fireEvent.click(screen.getByText('Design'));
    expect(onSelect).toHaveBeenCalledWith('design');
  });
});
```

### API Test Example
```typescript
// prompts.test.ts
import request from 'supertest';
import { app } from '../app';

describe('Prompts API', () => {
  it('should create a new prompt', async () => {
    const response = await request(app)
      .post('/api/prompts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Prompt',
        content: 'Test content',
        categoryId: 1
      });

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe('Test Prompt');
  });
});
```

## 🎯 Testing Best Practices

### General Principles
- **Arrange, Act, Assert**: Structure tests clearly
- **Descriptive Names**: Test names should explain what they verify
- **Isolated Tests**: Each test should be independent
- **Mock External Dependencies**: Use mocks for APIs, databases, etc.

### Frontend Testing
- **Test User Interactions**: Focus on what users actually do
- **Test Accessibility**: Ensure components are accessible
- **Test Error States**: Verify error handling and display
- **Mock Context Providers**: Isolate component testing

### Backend Testing
- **Test API Contracts**: Verify request/response formats
- **Test Error Handling**: Cover all error scenarios
- **Test Database Operations**: Verify data persistence
- **Test Authentication**: Ensure security measures work

## 🔍 Debugging Tests

### Common Issues and Solutions

**Tests timing out:**
```bash
# Increase timeout for async operations
await waitFor(() => {
  expect(screen.getByText('Loading...')).not.toBeInTheDocument();
}, { timeout: 5000 });
```

**Mock not working:**
```typescript
// Ensure mocks are properly cleared
beforeEach(() => {
  vi.clearAllMocks();
});
```

**E2E tests failing:**
```bash
# Run in headed mode to see browser
npx playwright test --headed

# Debug specific test
npx playwright test --debug category-management.spec.ts
```

## 📊 Continuous Integration

### GitHub Actions Integration
Tests run automatically on:
- **Pull Requests**: All test suites
- **Main Branch**: Full test suite + deployment tests
- **Nightly**: Performance regression testing

### Test Pipeline
1. **Lint Check**: Code style and quality
2. **Unit Tests**: Frontend and backend
3. **Integration Tests**: API and database
4. **E2E Tests**: User workflows
5. **Performance Tests**: Load and memory
6. **Security Tests**: Vulnerability scanning

## 🎯 Test Metrics and Goals

### Current Metrics
- **Unit Test Coverage**: 95%+
- **API Test Coverage**: 100%
- **E2E Test Coverage**: All critical paths
- **Performance Baseline**: <200ms API response

### Quality Gates
- ✅ All tests must pass
- ✅ Coverage must be >90%
- ✅ No security vulnerabilities
- ✅ Performance within acceptable limits

## 📚 Additional Resources

- **[Testing Strategy Document](./strategy.md)** - Detailed testing approach
- **[Mock Data Guide](./mock-data.md)** - Creating and managing test data
- **[CI/CD Testing](../deployment/ci-cd.md)** - Automated testing in pipelines
- **[Performance Benchmarks](./benchmarks.md)** - Performance testing standards