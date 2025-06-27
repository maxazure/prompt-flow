/**
 * Test Runner Configuration for PromptFlow E2E Tests
 * 
 * Provides utilities for running e2e tests with proper setup and teardown,
 * test data management, and environment configuration.
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import { TestHelper } from './helpers/testHelpers';

// Extend base test with our custom fixtures
export const test = base.extend<{
  helper: TestHelper;
  authenticatedPage: Page;
  cleanupData: () => Promise<void>;
}>({
  // Test helper fixture
  helper: async ({ page }, use) => {
    const helper = new TestHelper(page);
    await helper.setup();
    await use(helper);
    await helper.teardown();
  },

  // Pre-authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    const helper = new TestHelper(page);
    await helper.setup();
    await helper.auth.login('regular');
    await use(page);
    await helper.teardown();
  },

  // Data cleanup fixture
  cleanupData: async ({ page }, use) => {
    const cleanup = async () => {
      // Add any specific cleanup logic here
      console.log('Cleaning up test data...');
      
      // Clear browser storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Clear cookies
      await page.context().clearCookies();
    };
    
    await use(cleanup);
    await cleanup();
  }
});

// Re-export expect for convenience
export { expect };

// Test configuration and utilities
export class TestConfig {
  static readonly DEFAULT_TIMEOUT = 30000;
  static readonly SLOW_TIMEOUT = 60000;
  static readonly API_TIMEOUT = 10000;
  
  static readonly VIEWPORTS = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 }
  };
  
  static readonly TEST_USERS = {
    admin: { email: 'e2e.admin@test.com', password: 'Test123!@#' },
    regular: { email: 'e2e.user@test.com', password: 'Test123!@#' }
  };
  
  static readonly API_ENDPOINTS = {
    BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:3001',
    FRONTEND_URL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'
  };
}

// Custom test tags for test organization
export const testTags = {
  SMOKE: '@smoke',
  REGRESSION: '@regression',
  CRITICAL: '@critical',
  CATEGORY: '@category',
  PROMPT: '@prompt',
  NAVIGATION: '@navigation',
  RESPONSIVE: '@responsive',
  SEARCH: '@search',
  PERFORMANCE: '@performance'
};

// Test data management utilities
export class TestDataManager {
  private page: Page;
  private helper: TestHelper;
  
  constructor(page: Page) {
    this.page = page;
    this.helper = new TestHelper(page);
  }
  
  async setupMinimalTestData() {
    // Create basic test categories
    const basicCategories = [
      { name: 'Test Development', description: 'Development testing category' },
      { name: 'Test Marketing', description: 'Marketing testing category' }
    ];
    
    for (const category of basicCategories) {
      await this.helper.category.createCategory(category.name, category.description);
    }
    
    // Create basic test prompts
    const basicPrompts = [
      {
        title: 'Test Prompt 1',
        content: 'Basic test prompt content',
        category: 'Test Development'
      },
      {
        title: 'Test Prompt 2', 
        content: 'Another test prompt for validation',
        category: 'Test Marketing'
      }
    ];
    
    for (const prompt of basicPrompts) {
      await this.helper.navigation.navigateTo('/create');
      await this.helper.prompt.createPrompt(
        prompt.title,
        prompt.content,
        undefined,
        prompt.category
      );
    }
  }
  
  async setupComprehensiveTestData() {
    // Create comprehensive test data for full feature testing
    const categories = [
      { name: 'Frontend Development', description: 'React, Vue, Angular projects', color: '#3B82F6' },
      { name: 'Backend Development', description: 'Node.js, Python, Java APIs', color: '#10B981' },
      { name: 'Data Science', description: 'ML, Analytics, Visualization', color: '#F59E0B' },
      { name: 'Marketing Content', description: 'Campaigns, Copy, Social Media', color: '#EF4444' },
      { name: 'Design Systems', description: 'UI/UX, Brand Guidelines', color: '#8B5CF6' }
    ];
    
    for (const category of categories) {
      await this.helper.category.createCategory(category.name, category.description, category.color);
    }
    
    const prompts = [
      {
        title: 'React Code Review Checklist',
        content: 'Comprehensive checklist for React code reviews including hooks, performance, and accessibility.',
        category: 'Frontend Development',
        tags: ['react', 'code-review', 'checklist'],
        isTemplate: true
      },
      {
        title: 'API Documentation Template',
        content: 'Standard template for REST API documentation with examples and error codes.',
        category: 'Backend Development', 
        tags: ['api', 'documentation', 'rest'],
        isTemplate: true
      },
      {
        title: 'Data Visualization Guidelines',
        content: 'Best practices for creating effective data visualizations and dashboards.',
        category: 'Data Science',
        tags: ['visualization', 'charts', 'dashboard'],
        isPublic: true
      },
      {
        title: 'Email Campaign Template',
        content: 'Professional email template with CTAs and responsive design.',
        category: 'Marketing Content',
        tags: ['email', 'campaign', 'template'],
        isTemplate: true,
        isPublic: true
      },
      {
        title: 'Design System Component Spec',
        content: 'Specification template for design system components.',
        category: 'Design Systems',
        tags: ['design-system', 'components', 'spec']
      }
    ];
    
    for (const prompt of prompts) {
      await this.helper.navigation.navigateTo('/create');
      await this.helper.prompt.createPrompt(
        prompt.title,
        prompt.content,
        undefined,
        prompt.category,
        prompt.tags
      );
      
      // Set template/public flags if needed
      if (prompt.isTemplate || prompt.isPublic) {
        await this.page.click('[data-testid="edit-prompt-button"]');
        
        if (prompt.isTemplate) {
          await this.page.check('[data-testid="prompt-is-template-checkbox"]');
        }
        
        if (prompt.isPublic) {
          await this.page.check('[data-testid="prompt-is-public-checkbox"]');
        }
        
        await this.page.click('[data-testid="prompt-submit-button"]');
      }
    }
  }
  
  async cleanupTestData() {
    // Clean up test data created during tests
    console.log('Cleaning up test data...');
    
    // This would typically call API endpoints to clean up
    // For now, just clear browser state
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private page: Page;
  private metrics: Map<string, number> = new Map();
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async startMonitoring() {
    // Start performance monitoring
    await this.page.evaluate(() => {
      performance.mark('test-start');
    });
  }
  
  async measurePageLoad(label: string) {
    const loadTime = await this.page.evaluate(() => {
      performance.mark('page-loaded');
      performance.measure('page-load', 'test-start', 'page-loaded');
      
      const measure = performance.getEntriesByName('page-load')[0];
      return measure.duration;
    });
    
    this.metrics.set(label, loadTime);
    console.log(`Page load time for ${label}: ${loadTime}ms`);
  }
  
  async measureOperation(label: string, operation: () => Promise<void>) {
    const startTime = Date.now();
    await operation();
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    this.metrics.set(label, duration);
    console.log(`Operation ${label} took: ${duration}ms`);
  }
  
  getMetrics(): Map<string, number> {
    return this.metrics;
  }
  
  assertPerformance(label: string, maxDuration: number) {
    const duration = this.metrics.get(label);
    if (duration === undefined) {
      throw new Error(`No performance metric found for ${label}`);
    }
    
    expect(duration).toBeLessThan(maxDuration);
  }
}

// Accessibility testing utilities
export class AccessibilityTester {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async checkColorContrast() {
    // Basic color contrast checking
    const contrastIssues = await this.page.evaluate(() => {
      const issues: string[] = [];
      const elements = document.querySelectorAll('*');
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        // Basic contrast checking (simplified)
        if (color && backgroundColor && color !== 'rgb(0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          // More sophisticated contrast checking would be implemented here
          // For now, just flag elements with very similar colors
          if (color === backgroundColor) {
            issues.push(`Low contrast detected on ${el.tagName}`);
          }
        }
      });
      
      return issues;
    });
    
    return contrastIssues;
  }
  
  async checkAriaLabels() {
    const ariaIssues = await this.page.evaluate(() => {
      const issues: string[] = [];
      
      // Check for interactive elements without proper labels
      const interactiveElements = document.querySelectorAll('button, input, select, textarea, a[href]');
      
      interactiveElements.forEach(el => {
        const hasAriaLabel = el.hasAttribute('aria-label');
        const hasAriaLabelledBy = el.hasAttribute('aria-labelledby');
        const hasTitle = el.hasAttribute('title');
        const hasTextContent = el.textContent?.trim();
        
        if (!hasAriaLabel && !hasAriaLabelledBy && !hasTitle && !hasTextContent) {
          issues.push(`Interactive element ${el.tagName} lacks accessible label`);
        }
      });
      
      return issues;
    });
    
    return ariaIssues;
  }
  
  async checkKeyboardNavigation() {
    // Test basic keyboard navigation
    const focusableElements = await this.page.$$('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])');
    
    const navigationIssues: string[] = [];
    
    for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
      try {
        await focusableElements[i].focus();
        const isFocused = await focusableElements[i].evaluate(el => document.activeElement === el);
        
        if (!isFocused) {
          navigationIssues.push(`Element ${i} cannot receive keyboard focus`);
        }
      } catch (error) {
        navigationIssues.push(`Error focusing element ${i}: ${error}`);
      }
    }
    
    return navigationIssues;
  }
}

// Export utilities for use in test files
export { TestDataManager, PerformanceMonitor, AccessibilityTester };

// Test suite metadata
export const testSuites = {
  smoke: {
    name: 'Smoke Tests',
    description: 'Critical path tests that must pass',
    timeout: TestConfig.DEFAULT_TIMEOUT
  },
  
  regression: {
    name: 'Regression Tests', 
    description: 'Comprehensive feature tests',
    timeout: TestConfig.SLOW_TIMEOUT
  },
  
  performance: {
    name: 'Performance Tests',
    description: 'Performance and load testing',
    timeout: TestConfig.SLOW_TIMEOUT
  },
  
  accessibility: {
    name: 'Accessibility Tests',
    description: 'A11y compliance testing',
    timeout: TestConfig.DEFAULT_TIMEOUT
  }
};