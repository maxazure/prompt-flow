# PromptFlow E2E Test Suite

This directory contains comprehensive end-to-end tests for the PromptFlow application using Playwright.

## Test Structure

### Core Test Files

- **`category-management.spec.ts`** - Category creation, editing, deletion, and management
- **`prompt-management.spec.ts`** - Prompt CRUD operations with category integration  
- **`navigation.spec.ts`** - Application routing and navigation between views
- **`sidebar-interactions.spec.ts`** - MainLayout sidebar and CategorySidebar functionality
- **`responsive-behavior.spec.ts`** - Mobile, tablet, and desktop responsive testing
- **`search-filter.spec.ts`** - Search and filtering functionality across the app

### Support Files

- **`helpers/testHelpers.ts`** - Reusable test helper classes and utilities
- **`fixtures/testData.ts`** - Test data fixtures and configuration
- **`fixtures/mockData.ts`** - Mock API responses for testing
- **`test-runner.ts`** - Test runner configuration and advanced utilities

## Test Coverage

### 1. Category Management (`category-management.spec.ts`)
- ✅ Category creation with different scopes (personal, team, public)
- ✅ Category editing (name, description, color)
- ✅ Category deletion with confirmation
- ✅ Category validation and error handling
- ✅ Category filtering and search
- ✅ Responsive category management
- ✅ Category permissions and access control

### 2. Prompt Management (`prompt-management.spec.ts`)
- ✅ Prompt creation with category assignment
- ✅ Prompt editing and updating categories
- ✅ Prompt detail view with full metadata
- ✅ Template creation and management
- ✅ Prompt filtering by category
- ✅ Prompt search by title, content, and tags
- ✅ Version management and history
- ✅ Public/private prompt settings
- ✅ Responsive prompt management

### 3. Navigation (`navigation.spec.ts`)
- ✅ Authentication-based routing
- ✅ Navigation between main views (Home, Dashboard, Create, etc.)
- ✅ Browser back/forward navigation
- ✅ Deep linking and URL state management
- ✅ Error handling (404, network errors)
- ✅ Loading states during navigation
- ✅ Page title updates
- ✅ Mobile navigation patterns

### 4. Sidebar Interactions (`sidebar-interactions.spec.ts`)
- ✅ MainLayout sidebar toggle functionality
- ✅ CategorySidebar interactions and category selection
- ✅ Category group expand/collapse
- ✅ Responsive sidebar behavior (mobile overlay, desktop persistent)
- ✅ Keyboard navigation and shortcuts
- ✅ Sidebar state persistence
- ✅ Search integration within sidebar

### 5. Responsive Behavior (`responsive-behavior.spec.ts`)
- ✅ Mobile viewport testing (375x667)
- ✅ Tablet viewport testing (768x1024)
- ✅ Desktop viewport testing (1920x1080)
- ✅ Layout adaptation across screen sizes
- ✅ Touch interactions on mobile
- ✅ Viewport transition handling
- ✅ Performance on different devices
- ✅ Accessibility across viewports

### 6. Search and Filter (`search-filter.spec.ts`)
- ✅ Basic search by title, content, and tags
- ✅ Category filtering and selection
- ✅ Combined search and filter operations
- ✅ Search result highlighting
- ✅ Advanced filtering options
- ✅ Search performance and UX
- ✅ Empty state handling
- ✅ Mobile search experience

## Running Tests

### Prerequisites
- Node.js 18+ installed
- PromptFlow frontend running on `localhost:5173`
- PromptFlow backend running on `localhost:3001`

### Commands

```bash
# Install dependencies
npm install

# Run all e2e tests
npm run test:e2e

# Run specific test file
npx playwright test category-management.spec.ts

# Run tests in headed mode (with browser UI)
npx playwright test --headed

# Run tests on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests on mobile viewport
npx playwright test --project="Mobile Chrome"

# Run tests with debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

### Environment Variables

```bash
# Frontend URL (default: http://localhost:5173)
PLAYWRIGHT_BASE_URL=http://localhost:5173

# Backend API URL (default: http://localhost:3001)
VITE_API_BASE_URL=http://localhost:3001

# Test environment
NODE_ENV=test
```

## Test Data Management

### Test Users
- **Admin User**: `e2e.admin@test.com` / `Test123!@#`
- **Regular User**: `e2e.user@test.com` / `Test123!@#`

### Test Categories
- E2E Development (Personal, Blue)
- E2E Marketing (Personal, Green)
- E2E Analytics (Personal, Orange)
- E2E Public (Public, Red)

### Test Data Cleanup
Tests automatically clean up created data after each test run. Manual cleanup can be triggered through the test helpers.

## Best Practices

### 1. Test Organization
- Each test file focuses on a specific feature area
- Tests are organized in logical describe blocks
- Use descriptive test names that explain the expected behavior

### 2. Test Data
- Use consistent test data across test files
- Clean up test data after each test
- Use unique identifiers to avoid conflicts

### 3. Page Objects and Helpers
- Use the TestHelper class for common operations
- Keep selectors centralized in testData.ts
- Use semantic test IDs (`data-testid`) in components

### 4. Assertions
- Use Playwright's built-in expect assertions
- Wait for elements to be visible before interacting
- Use meaningful error messages

### 5. Performance
- Use `page.waitForLoadState('networkidle')` for full page loads
- Implement proper timeouts for different operations
- Monitor test execution times

## Debugging Tests

### Visual Debugging
```bash
# Run with headed browser
npx playwright test --headed

# Run with debug mode (step through)
npx playwright test --debug

# Generate trace files
npx playwright test --trace on
```

### Screenshots and Videos
```bash
# Take screenshots on failure
npx playwright test --screenshot=only-on-failure

# Record videos
npx playwright test --video=retain-on-failure
```

### Playwright Inspector
```bash
# Open Playwright Inspector
npx playwright test --debug category-management.spec.ts
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npx playwright install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Maintenance

### Adding New Tests
1. Create new test file in appropriate category
2. Use existing helpers and patterns
3. Add test data to fixtures if needed
4. Update this README with new coverage

### Updating Selectors
1. Update selectors in `fixtures/testData.ts`
2. Ensure corresponding `data-testid` attributes exist in components
3. Test selector changes across all test files

### Performance Monitoring
- Monitor test execution times
- Profile slow tests and optimize
- Use performance utilities in test-runner.ts

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in playwright.config.ts
   - Add explicit waits for slow operations
   - Check if services are running

2. **Element not found**
   - Verify data-testid attributes exist
   - Check if elements are dynamically loaded
   - Use proper wait conditions

3. **Network errors**
   - Ensure backend services are running
   - Check API endpoint configuration
   - Verify test data setup

4. **Authentication issues**
   - Verify test user credentials
   - Check token handling in auth helpers
   - Ensure login flow works manually

### Getting Help
- Check Playwright documentation: https://playwright.dev/docs/
- Review test logs and trace files
- Use browser dev tools with --headed mode
- Reach out to the development team for application-specific issues