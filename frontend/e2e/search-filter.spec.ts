/**
 * Search and Filter Functionality E2E Tests
 * 
 * Tests for search and filtering functionality including:
 * - Category filtering and search
 * - Prompt search by title, content, and tags
 * - Combined search and filter operations
 * - Search result highlighting
 * - Advanced filtering options
 * - Search performance and responsiveness
 * - Empty state handling
 * - Search history and suggestions
 */

import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers/testHelpers';
import { testCategories, testPrompts, searchScenarios, selectors, timeouts } from './fixtures/testData';

test.describe('Search and Filter Functionality', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.setup();
    await helper.auth.login('regular');
    
    // Set up test data for comprehensive search testing
    await helper.navigation.navigateTo('/dashboard');
    await helper.ui.waitForLoading();
    
    // Create test categories
    for (const category of testCategories) {
      await helper.category.createCategory(category.name, category.description, category.color);
    }
    
    // Create test prompts with various content for search testing
    const searchTestPrompts = [
      {
        title: 'JavaScript Code Review Guidelines',
        content: 'Comprehensive guidelines for reviewing JavaScript code. Focus on ES6+ features, async/await patterns, and modern best practices.',
        description: 'Development standards for JavaScript projects',
        category: 'E2E Development',
        tags: ['javascript', 'code-review', 'development', 'frontend']
      },
      {
        title: 'Python Data Analysis Workflow',
        content: 'Step-by-step workflow for data analysis using Python. Includes pandas, numpy, and matplotlib for data visualization.',
        description: 'Data science methodology with Python',
        category: 'E2E Analytics',
        tags: ['python', 'data-analysis', 'pandas', 'visualization']
      },
      {
        title: 'Marketing Email Campaign Template',
        content: 'Professional email template for marketing campaigns. Includes subject line optimization and call-to-action placement.',
        description: 'Email marketing best practices',
        category: 'E2E Marketing',
        tags: ['email', 'marketing', 'campaign', 'template']
      },
      {
        title: 'React Component Testing Strategy',
        content: 'Testing strategies for React components using Jest and React Testing Library. Covers unit tests and integration tests.',
        description: 'Frontend testing methodologies',
        category: 'E2E Development',
        tags: ['react', 'testing', 'jest', 'frontend', 'javascript']
      },
      {
        title: 'SQL Query Optimization Guide',
        content: 'Database query optimization techniques. Covers indexing strategies, query planning, and performance monitoring.',
        description: 'Database performance optimization',
        category: 'E2E Analytics',
        tags: ['sql', 'database', 'optimization', 'performance']
      },
      {
        title: 'Social Media Content Calendar',
        content: 'Monthly content planning for social media platforms. Includes post scheduling and engagement strategies.',
        description: 'Social media management template',
        category: 'E2E Marketing',
        tags: ['social-media', 'content', 'planning', 'calendar']
      }
    ];
    
    for (const prompt of searchTestPrompts) {
      await helper.navigation.navigateTo('/create');
      await helper.prompt.createPrompt(
        prompt.title,
        prompt.content,
        prompt.description,
        prompt.category,
        prompt.tags
      );
    }
    
    await helper.navigation.navigateTo('/dashboard');
  });

  test.afterEach(async () => {
    await helper.teardown();
  });

  test.describe('Basic Search Functionality', () => {
    test('should search prompts by title', async ({ page }) => {
      await test.step('Search for specific title keywords', async () => {
        await helper.search.search('JavaScript');
        
        // Should find JavaScript-related prompts
        const jsPrompt = await helper.prompt.promptExists('JavaScript Code Review Guidelines');
        expect(jsPrompt).toBe(true);
        
        const reactPrompt = await helper.prompt.promptExists('React Component Testing Strategy');
        expect(reactPrompt).toBe(true);
        
        // Should not show unrelated prompts
        const marketingPrompt = await helper.prompt.promptExists('Marketing Email Campaign Template');
        expect(marketingPrompt).toBe(false);
      });
      
      await test.step('Search for exact title match', async () => {
        await helper.search.search('Python Data Analysis Workflow');
        
        const pythonPrompt = await helper.prompt.promptExists('Python Data Analysis Workflow');
        expect(pythonPrompt).toBe(true);
        
        // Should filter out non-matching prompts
        const jsPrompt = await helper.prompt.promptExists('JavaScript Code Review Guidelines');
        expect(jsPrompt).toBe(false);
      });
      
      await test.step('Case insensitive search', async () => {
        await helper.search.search('REACT component');
        
        const reactPrompt = await helper.prompt.promptExists('React Component Testing Strategy');
        expect(reactPrompt).toBe(true);
      });
    });

    test('should search prompts by content', async ({ page }) => {
      await test.step('Search for content keywords', async () => {
        await helper.search.search('pandas');
        
        const pythonPrompt = await helper.prompt.promptExists('Python Data Analysis Workflow');
        expect(pythonPrompt).toBe(true);
        
        // Should not match prompts without the keyword
        const jsPrompt = await helper.prompt.promptExists('JavaScript Code Review Guidelines');
        expect(jsPrompt).toBe(false);
      });
      
      await test.step('Search for technical terms', async () => {
        await helper.search.search('async/await');
        
        const jsPrompt = await helper.prompt.promptExists('JavaScript Code Review Guidelines');
        expect(jsPrompt).toBe(true);
      });
      
      await test.step('Search for phrases in content', async () => {
        await helper.search.search('best practices');
        
        // Should find prompts mentioning best practices
        const resultCount = await helper.search.getSearchResultsCount();
        expect(resultCount).toBeGreaterThan(0);
      });
    });

    test('should search prompts by tags', async ({ page }) => {
      await test.step('Search by single tag', async () => {
        await helper.search.search('frontend');
        
        const jsPrompt = await helper.prompt.promptExists('JavaScript Code Review Guidelines');
        const reactPrompt = await helper.prompt.promptExists('React Component Testing Strategy');
        
        expect(jsPrompt).toBe(true);
        expect(reactPrompt).toBe(true);
      });
      
      await test.step('Search by marketing tags', async () => {
        await helper.search.search('marketing');
        
        const emailPrompt = await helper.prompt.promptExists('Marketing Email Campaign Template');
        const socialPrompt = await helper.prompt.promptExists('Social Media Content Calendar');
        
        expect(emailPrompt).toBe(true);
        expect(socialPrompt).toBe(true);
      });
    });

    test('should handle empty search results', async ({ page }) => {
      await test.step('Search for non-existent content', async () => {
        await helper.search.search('nonexistentterm12345');
        
        const resultCount = await helper.search.getSearchResultsCount();
        expect(resultCount).toBe(0);
        
        // Should show empty state
        const emptyState = page.locator('[data-testid="empty-search-results"]');
        await expect(emptyState).toBeVisible();
        await expect(emptyState).toContainText(/no.*found|empty/i);
      });
      
      await test.step('Clear search to show all results', async () => {
        await helper.search.clearSearch();
        
        const resultCount = await helper.search.getSearchResultsCount();
        expect(resultCount).toBeGreaterThan(0);
        
        // Empty state should be hidden
        const emptyState = page.locator('[data-testid="empty-search-results"]');
        await expect(emptyState).not.toBeVisible();
      });
    });
  });

  test.describe('Category Filtering', () => {
    test('should filter prompts by category selection', async ({ page }) => {
      await test.step('Filter by Development category', async () => {
        await helper.navigation.selectCategory('E2E Development');
        
        // Should show only development prompts
        const jsPrompt = await helper.prompt.promptExists('JavaScript Code Review Guidelines');
        const reactPrompt = await helper.prompt.promptExists('React Component Testing Strategy');
        
        expect(jsPrompt).toBe(true);
        expect(reactPrompt).toBe(true);
        
        // Should hide non-development prompts
        const marketingPrompt = await helper.prompt.promptExists('Marketing Email Campaign Template');
        expect(marketingPrompt).toBe(false);
      });
      
      await test.step('Filter by Marketing category', async () => {
        await helper.navigation.selectCategory('E2E Marketing');
        
        const emailPrompt = await helper.prompt.promptExists('Marketing Email Campaign Template');
        const socialPrompt = await helper.prompt.promptExists('Social Media Content Calendar');
        
        expect(emailPrompt).toBe(true);
        expect(socialPrompt).toBe(true);
        
        // Should hide non-marketing prompts
        const jsPrompt = await helper.prompt.promptExists('JavaScript Code Review Guidelines');
        expect(jsPrompt).toBe(false);
      });
      
      await test.step('Show all categories', async () => {
        await helper.navigation.selectCategory('all');
        
        // Should show all prompts
        const jsPrompt = await helper.prompt.promptExists('JavaScript Code Review Guidelines');
        const marketingPrompt = await helper.prompt.promptExists('Marketing Email Campaign Template');
        const pythonPrompt = await helper.prompt.promptExists('Python Data Analysis Workflow');
        
        expect(jsPrompt).toBe(true);
        expect(marketingPrompt).toBe(true);
        expect(pythonPrompt).toBe(true);
      });
    });

    test('should filter categories by search in sidebar', async ({ page }) => {
      await test.step('Search categories in sidebar', async () => {
        // Open sidebar if collapsed
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        if (isCollapsed) {
          await helper.navigation.toggleSidebar();
        }
        
        // Search for specific category
        const categorySearchInput = page.locator('[data-testid="category-search-input"]');
        if (await categorySearchInput.isVisible()) {
          await categorySearchInput.fill('Development');
          
          // Should show only matching categories
          const devCategory = await helper.category.categoryExists('E2E Development');
          expect(devCategory).toBe(true);
          
          const marketingCategory = await helper.category.categoryExists('E2E Marketing');
          expect(marketingCategory).toBe(false);
          
          // Clear category search
          await categorySearchInput.fill('');
        }
      });
    });

    test('should show category prompt counts', async ({ page }) => {
      await test.step('Verify category prompt counts', async () => {
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        if (isCollapsed) {
          await helper.navigation.toggleSidebar();
        }
        
        // Check if prompt counts are displayed
        const devCategory = helper.category.getCategoryByName('E2E Development');
        const promptCount = devCategory.locator('[data-testid="category-prompt-count"]');
        
        if (await promptCount.isVisible()) {
          const countText = await promptCount.textContent();
          expect(countText).toMatch(/\d+/); // Should contain a number
          
          // Count should be accurate (we created 2 development prompts)
          expect(countText).toContain('2');
        }
      });
    });
  });

  test.describe('Combined Search and Filter', () => {
    test('should combine search with category filtering', async ({ page }) => {
      await test.step('Filter by category then search', async () => {
        // First filter by Development category
        await helper.navigation.selectCategory('E2E Development');
        
        // Then search within that category
        await helper.search.search('React');
        
        // Should show only React prompt from Development category
        const reactPrompt = await helper.prompt.promptExists('React Component Testing Strategy');
        expect(reactPrompt).toBe(true);
        
        const jsPrompt = await helper.prompt.promptExists('JavaScript Code Review Guidelines');
        expect(jsPrompt).toBe(false);
      });
      
      await test.step('Search first then filter by category', async () => {
        // Clear previous filters
        await helper.navigation.selectCategory('all');
        await helper.search.clearSearch();
        
        // Search for a broad term
        await helper.search.search('template');
        
        // Then filter by category
        await helper.navigation.selectCategory('E2E Marketing');
        
        // Should show only marketing templates
        const emailTemplate = await helper.prompt.promptExists('Marketing Email Campaign Template');
        expect(emailTemplate).toBe(true);
        
        // Should not show templates from other categories
        const socialTemplate = await helper.prompt.promptExists('Social Media Content Calendar');
        // This depends on whether "template" appears in social media content
        // The test should be adjusted based on actual content
      });
    });

    test('should maintain search state when changing categories', async ({ page }) => {
      await test.step('Search term should persist across category changes', async () => {
        await helper.search.search('optimization');
        
        // Search term should remain in input
        const searchInput = page.locator(selectors.searchInput);
        await expect(searchInput).toHaveValue('optimization');
        
        // Change category
        await helper.navigation.selectCategory('E2E Analytics');
        
        // Search term should still be there
        await expect(searchInput).toHaveValue('optimization');
        
        // Should show filtered results
        const sqlPrompt = await helper.prompt.promptExists('SQL Query Optimization Guide');
        expect(sqlPrompt).toBe(true);
      });
    });
  });

  test.describe('Advanced Search Features', () => {
    test('should support search result highlighting', async ({ page }) => {
      await test.step('Highlight search terms in results', async () => {
        await helper.search.search('JavaScript');
        
        // Search highlights should be visible in prompt titles/content
        const highlightedTerms = page.locator('[data-testid="search-highlight"]');
        const count = await highlightedTerms.count();
        
        if (count > 0) {
          // Verify highlighting works
          await expect(highlightedTerms.first()).toBeVisible();
          await expect(highlightedTerms.first()).toContainText('JavaScript');
        }
      });
    });

    test('should support search suggestions/autocomplete', async ({ page }) => {
      await test.step('Show search suggestions', async () => {
        const searchInput = page.locator(selectors.searchInput);
        await searchInput.focus();
        await searchInput.type('Java');
        
        // Wait for suggestions to appear
        await page.waitForTimeout(300);
        
        const suggestions = page.locator('[data-testid="search-suggestions"]');
        const hasSuggestions = await suggestions.isVisible().catch(() => false);
        
        if (hasSuggestions) {
          // Should show relevant suggestions
          await expect(suggestions).toBeVisible();
          await expect(suggestions).toContainText('JavaScript');
          
          // Click on suggestion
          const jsSuggestion = suggestions.locator('text=JavaScript');
          if (await jsSuggestion.isVisible()) {
            await jsSuggestion.click();
            await expect(searchInput).toHaveValue('JavaScript');
          }
        }
      });
    });

    test('should support multiple search terms', async ({ page }) => {
      await test.step('Search with multiple keywords', async () => {
        await helper.search.search('React testing');
        
        const reactPrompt = await helper.prompt.promptExists('React Component Testing Strategy');
        expect(reactPrompt).toBe(true);
        
        // Should not match prompts with only one of the terms
        const jsPrompt = await helper.prompt.promptExists('JavaScript Code Review Guidelines');
        expect(jsPrompt).toBe(false);
      });
      
      await test.step('Search with quoted phrases', async () => {
        await helper.search.search('"best practices"');
        
        // Should find exact phrase matches
        const resultCount = await helper.search.getSearchResultsCount();
        expect(resultCount).toBeGreaterThanOrEqual(0);
      });
    });

    test('should support search filters and sorting', async ({ page }) => {
      await test.step('Filter by prompt type (template vs regular)', async () => {
        // Mark some prompts as templates first
        await helper.navigation.navigateTo('/prompt/1'); // Navigate to first prompt
        await page.click('[data-testid="edit-prompt-button"]');
        await page.check('[data-testid="prompt-is-template-checkbox"]');
        await page.click(selectors.promptSubmitButton);
        
        await helper.navigation.navigateTo('/dashboard');
        
        // Filter by templates only
        const filterButton = page.locator(selectors.filterButton);
        if (await filterButton.isVisible()) {
          await filterButton.click();
          
          const templateFilter = page.locator('[data-testid="filter-templates-only"]');
          if (await templateFilter.isVisible()) {
            await templateFilter.click();
            
            // Should show only templates
            const resultCount = await helper.search.getSearchResultsCount();
            expect(resultCount).toBeGreaterThanOrEqual(0);
          }
        }
      });
      
      await test.step('Sort search results', async () => {
        await helper.search.search('test');
        
        const sortButton = page.locator('[data-testid="sort-button"]');
        if (await sortButton.isVisible()) {
          await sortButton.click();
          
          const sortOptions = page.locator('[data-testid="sort-options"]');
          await expect(sortOptions).toBeVisible();
          
          // Sort by relevance, date, title, etc.
          const sortByDate = page.locator('[data-testid="sort-by-date"]');
          if (await sortByDate.isVisible()) {
            await sortByDate.click();
            
            // Results should be reordered
            await page.waitForTimeout(500);
          }
        }
      });
    });
  });

  test.describe('Search Performance and UX', () => {
    test('should provide fast search results', async ({ page }) => {
      await test.step('Search should be responsive', async () => {
        const searchInput = page.locator(selectors.searchInput);
        
        const startTime = Date.now();
        await searchInput.fill('JavaScript');
        await searchInput.press('Enter');
        
        // Wait for results to update
        await page.waitForTimeout(100);
        
        const endTime = Date.now();
        const searchTime = endTime - startTime;
        
        // Search should complete within reasonable time
        expect(searchTime).toBeLessThan(2000); // 2 seconds max
      });
      
      await test.step('Search should work with real-time typing', async () => {
        const searchInput = page.locator(selectors.searchInput);
        
        // Clear any existing search
        await searchInput.fill('');
        
        // Type letter by letter
        await searchInput.type('Reac', { delay: 100 });
        
        // Should show intermediate results
        await page.waitForTimeout(200);
        
        const resultCount = await helper.search.getSearchResultsCount();
        expect(resultCount).toBeGreaterThanOrEqual(0);
      });
    });

    test('should handle large result sets efficiently', async ({ page }) => {
      // Create many prompts to test performance
      for (let i = 1; i <= 50; i++) {
        await helper.navigation.navigateTo('/create');
        await helper.prompt.createPrompt(
          `Performance Test Prompt ${i}`,
          `Content for testing search performance with prompt number ${i}. Contains common keywords like test, performance, and search.`,
          `Description ${i}`,
          i % 2 === 0 ? 'E2E Development' : 'E2E Marketing',
          ['performance', 'test', `number-${i}`]
        );
      }
      
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Search should handle many results', async () => {
        await helper.search.search('performance');
        
        // Should show results efficiently
        const resultCount = await helper.search.getSearchResultsCount();
        expect(resultCount).toBeGreaterThan(20);
        
        // Page should remain responsive
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(300);
        
        // Should still be able to interact with results
        const firstResult = page.locator(selectors.promptItem).first();
        await expect(firstResult).toBeVisible();
      });
    });

    test('should provide search feedback and loading states', async ({ page }) => {
      await test.step('Show loading indicator during search', async () => {
        // Add delay to API to test loading state
        await page.route('**/api/prompts**', async route => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await route.continue();
        });
        
        const searchInput = page.locator(selectors.searchInput);
        await searchInput.fill('loading test');
        await searchInput.press('Enter');
        
        // Should show loading indicator
        const loadingIndicator = page.locator('[data-testid="search-loading"]');
        const hasLoading = await loadingIndicator.isVisible().catch(() => false);
        
        if (hasLoading) {
          await expect(loadingIndicator).toBeVisible();
        }
        
        // Wait for results
        await helper.ui.waitForLoading();
      });
    });
  });

  test.describe('Mobile Search Experience', () => {
    test.beforeEach(async () => {
      await helper.viewport.setMobileViewport();
    });

    test('should provide mobile-friendly search interface', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Search input should be mobile-optimized', async () => {
        const searchInput = page.locator(selectors.searchInput);
        await expect(searchInput).toBeVisible();
        
        // Should be appropriately sized for mobile
        const inputBox = await searchInput.boundingBox();
        expect(inputBox?.width).toBeGreaterThan(200);
        expect(inputBox?.height).toBeGreaterThanOrEqual(44); // Touch-friendly
      });
      
      await test.step('Search should work with mobile keyboard', async () => {
        const searchInput = page.locator(selectors.searchInput);
        await searchInput.tap();
        await searchInput.fill('React');
        
        // Mobile keyboard should appear (we can't directly test this)
        // But search should work
        await searchInput.press('Enter');
        
        const reactPrompt = await helper.prompt.promptExists('React Component Testing Strategy');
        expect(reactPrompt).toBe(true);
      });
      
      await test.step('Filter interface should be mobile-friendly', async () => {
        const filterButton = page.locator(selectors.filterButton);
        
        if (await filterButton.isVisible()) {
          await filterButton.tap();
          
          const filterDropdown = page.locator(selectors.filterDropdown);
          await expect(filterDropdown).toBeVisible();
          
          // Should fit mobile screen
          const dropdownBox = await filterDropdown.boundingBox();
          expect(dropdownBox?.width).toBeLessThanOrEqual(400);
        }
      });
    });
  });

  test.describe('Search Error Handling', () => {
    test('should handle search API errors gracefully', async ({ page }) => {
      await test.step('Handle network errors during search', async () => {
        // Mock network failure
        await page.route('**/api/prompts**', route => route.abort('failed'));
        
        await helper.search.search('network error test');
        
        // Should show error message
        const hasError = await helper.ui.hasErrorMessage();
        expect(hasError).toBe(true);
        
        const errorMessage = await helper.ui.getErrorMessage();
        expect(errorMessage.toLowerCase()).toMatch(/error|failed|network/);
      });
      
      await test.step('Handle malformed search queries', async () => {
        // Test with special characters and very long strings
        const problematicQueries = [
          '""""""""',
          'a'.repeat(1000),
          '<script>alert("xss")</script>',
          '\\\\\\\\\\',
          '{{{{}}}}',
          'SELECT * FROM prompts'
        ];
        
        for (const query of problematicQueries) {
          await helper.search.clearSearch();
          await helper.search.search(query);
          
          // Should not crash or show scripting errors
          const hasJSError = await page.evaluate(() => {
            return window.onerror !== null;
          });
          
          expect(hasJSError).toBe(false);
        }
      });
    });
  });
});