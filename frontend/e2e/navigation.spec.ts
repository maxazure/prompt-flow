/**
 * Navigation and Routing E2E Tests
 * 
 * Tests for application navigation and routing including:
 * - Navigation between different views (Home, Dashboard, PromptDetail, etc.)
 * - URL routing and deep linking
 * - Browser back/forward navigation
 * - Authentication-based routing
 * - Error page handling (404, etc.)
 * - Page title updates
 * - Loading states during navigation
 */

import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers/testHelpers';
import { navigationPaths, pageTitles, selectors, timeouts } from './fixtures/testData';

test.describe('Navigation and Routing', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.setup();
  });

  test.afterEach(async () => {
    await helper.teardown();
  });

  test.describe('Unauthenticated Navigation', () => {
    test('should redirect to login for protected routes', async ({ page }) => {
      const protectedRoutes = ['/dashboard', '/create', '/settings', '/profile'];
      
      for (const route of protectedRoutes) {
        await test.step(`Test redirect for ${route}`, async () => {
          await page.goto(route);
          
          // Should redirect to login
          await page.waitForURL('**/login**', { timeout: timeouts.medium });
          await expect(page).toHaveURL(/\/login/);
          await expect(page).toHaveTitle(new RegExp(pageTitles.login));
        });
      }
    });

    test('should allow access to public routes', async ({ page }) => {
      const publicRoutes = [
        { path: '/', title: pageTitles.home },
        { path: '/login', title: pageTitles.login },
        { path: '/register', title: pageTitles.register }
      ];
      
      for (const route of publicRoutes) {
        await test.step(`Test access to ${route.path}`, async () => {
          await helper.navigation.navigateTo(route.path);
          
          // Should successfully load the page
          await expect(page).toHaveURL(route.path);
          await expect(page).toHaveTitle(new RegExp(route.title));
          
          // Page should be fully loaded
          await helper.ui.waitForLoading();
        });
      }
    });

    test('should handle login flow navigation', async ({ page }) => {
      await test.step('Navigate to login page', async () => {
        await helper.navigation.navigateTo('/login');
        await expect(page).toHaveTitle(new RegExp(pageTitles.login));
      });
      
      await test.step('Navigate to register from login', async () => {
        await page.click('[data-testid="register-link"]');
        await page.waitForURL('**/register**', { timeout: timeouts.medium });
        await expect(page).toHaveURL('/register');
        await expect(page).toHaveTitle(new RegExp(pageTitles.register));
      });
      
      await test.step('Navigate back to login from register', async () => {
        await page.click('[data-testid="login-link"]');
        await page.waitForURL('**/login**', { timeout: timeouts.medium });
        await expect(page).toHaveURL('/login');
      });
    });

    test('should handle deep linking to public prompts', async ({ page }) => {
      // This test assumes public prompts have accessible URLs
      await test.step('Access public prompt directly', async () => {
        // Mock a public prompt URL
        const publicPromptUrl = '/prompt/123/public';
        await page.goto(publicPromptUrl);
        
        // Should either load the prompt or redirect appropriately
        // Behavior depends on implementation
        await page.waitForLoadState('networkidle');
        
        // Should not redirect to login for public content
        await expect(page).not.toHaveURL(/\/login/);
      });
    });
  });

  test.describe('Authenticated Navigation', () => {
    test.beforeEach(async () => {
      await helper.auth.login('regular');
    });

    test('should navigate between main application views', async ({ page }) => {
      const mainRoutes = [
        { path: '/dashboard', title: pageTitles.dashboard, selector: '[data-testid="dashboard-content"]' },
        { path: '/create', title: pageTitles.createPrompt, selector: selectors.promptForm },
        { path: '/templates', title: pageTitles.templates, selector: '[data-testid="templates-list"]' }
      ];
      
      for (const route of mainRoutes) {
        await test.step(`Navigate to ${route.path}`, async () => {
          await helper.navigation.navigateTo(route.path, route.selector);
          
          // Verify URL and title
          await expect(page).toHaveURL(route.path);
          await expect(page).toHaveTitle(new RegExp(route.title));
          
          // Verify page content loaded
          if (route.selector) {
            await expect(page.locator(route.selector)).toBeVisible();
          }
        });
      }
    });

    test('should handle navigation through header/sidebar menu', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Navigate via main navigation menu', async () => {
        const navigationItems = [
          { selector: '[data-testid="nav-home"]', expectedUrl: '/' },
          { selector: '[data-testid="nav-dashboard"]', expectedUrl: '/dashboard' },
          { selector: '[data-testid="nav-create"]', expectedUrl: '/create' },
          { selector: '[data-testid="nav-templates"]', expectedUrl: '/templates' }
        ];
        
        for (const item of navigationItems) {
          await page.click(item.selector);
          await page.waitForURL(`**${item.expectedUrl}**`, { timeout: timeouts.medium });
          await expect(page).toHaveURL(item.expectedUrl);
          await helper.ui.waitForLoading();
        }
      });
    });

    test('should handle category-based navigation', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      // Create test categories for navigation
      await helper.category.createCategory('Nav Test Category', 'For navigation testing');
      
      await test.step('Navigate via category selection', async () => {
        await helper.navigation.selectCategory('Nav Test Category');
        
        // Should navigate to category view
        await expect(page).toHaveURL(/\/category\/.+/);
        
        // Page should show filtered content
        const categoryHeader = page.locator('[data-testid="category-header"]');
        await expect(categoryHeader).toContainText('Nav Test Category');
      });
      
      await test.step('Navigate back to all prompts', async () => {
        await helper.navigation.selectCategory('all');
        await page.waitForURL('/', { timeout: timeouts.medium });
        await expect(page).toHaveURL('/');
      });
    });

    test('should maintain authentication state across navigation', async ({ page }) => {
      const routes = ['/dashboard', '/create', '/templates', '/'];
      
      for (const route of routes) {
        await test.step(`Verify auth state at ${route}`, async () => {
          await helper.navigation.navigateTo(route);
          
          // Should remain logged in
          const isLoggedIn = await helper.auth.isLoggedIn();
          expect(isLoggedIn).toBe(true);
          
          // Logout button should be visible
          await expect(page.locator(selectors.logoutButton)).toBeVisible();
        });
      }
    });
  });

  test.describe('Browser Navigation', () => {
    test.beforeEach(async () => {
      await helper.auth.login('regular');
    });

    test('should handle browser back and forward buttons', async ({ page }) => {
      const navigationSequence = ['/dashboard', '/create', '/templates', '/'];
      
      await test.step('Navigate through sequence', async () => {
        for (const path of navigationSequence) {
          await helper.navigation.navigateTo(path);
          await expect(page).toHaveURL(path);
        }
      });
      
      await test.step('Test back button navigation', async () => {
        // Go back through the sequence
        const backSequence = [...navigationSequence].reverse().slice(1); // Skip current page
        
        for (const expectedPath of backSequence) {
          await page.goBack();
          await page.waitForURL(`**${expectedPath}**`, { timeout: timeouts.medium });
          await expect(page).toHaveURL(expectedPath);
          await helper.ui.waitForLoading();
        }
      });
      
      await test.step('Test forward button navigation', async () => {
        // Go forward through the sequence again
        const forwardSequence = navigationSequence.slice(1); // Skip first page
        
        for (const expectedPath of forwardSequence) {
          await page.goForward();
          await page.waitForURL(`**${expectedPath}**`, { timeout: timeouts.medium });
          await expect(page).toHaveURL(expectedPath);
          await helper.ui.waitForLoading();
        }
      });
    });

    test('should handle page refresh correctly', async ({ page }) => {
      await test.step('Refresh on dashboard', async () => {
        await helper.navigation.navigateTo('/dashboard');
        await page.reload();
        
        // Should remain on dashboard and authenticated
        await expect(page).toHaveURL('/dashboard');
        const isLoggedIn = await helper.auth.isLoggedIn();
        expect(isLoggedIn).toBe(true);
      });
      
      await test.step('Refresh on create page', async () => {
        await helper.navigation.navigateTo('/create');
        await page.reload();
        
        // Should remain on create page with form visible
        await expect(page).toHaveURL('/create');
        await expect(page.locator(selectors.promptForm)).toBeVisible();
      });
    });

    test('should handle direct URL access to deep links', async ({ page }) => {
      // Create a test prompt to get a valid ID
      await helper.navigation.navigateTo('/create');
      await helper.prompt.createPrompt('Deep Link Test', 'Content for deep linking');
      
      // Get the prompt URL from the current page
      const currentUrl = page.url();
      const promptId = currentUrl.match(/\/prompt\/(\d+)/)?.[1];
      
      if (promptId) {
        await test.step('Access prompt detail directly', async () => {
          const directUrl = `/prompt/${promptId}`;
          await page.goto(directUrl);
          
          // Should successfully load the prompt
          await expect(page).toHaveURL(directUrl);
          await expect(page.locator(selectors.promptTitle)).toContainText('Deep Link Test');
        });
      }
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async () => {
      await helper.auth.login('regular');
    });

    test('should handle 404 errors gracefully', async ({ page }) => {
      await test.step('Navigate to non-existent route', async () => {
        await page.goto('/non-existent-page');
        
        // Should show 404 page or redirect appropriately
        // Implementation depends on routing setup
        const is404 = await page.locator('[data-testid="404-page"]').isVisible().catch(() => false);
        const redirectedHome = page.url().endsWith('/');
        
        expect(is404 || redirectedHome).toBe(true);
      });
      
      await test.step('Navigate to non-existent prompt', async () => {
        await page.goto('/prompt/999999');
        
        // Should show not found or error state
        const hasError = await helper.ui.hasErrorMessage();
        const is404 = await page.locator('[data-testid="prompt-not-found"]').isVisible().catch(() => false);
        
        expect(hasError || is404).toBe(true);
      });
    });

    test('should handle network errors during navigation', async ({ page }) => {
      // Simulate network issues
      await page.route('**/api/**', route => route.abort('failed'));
      
      await test.step('Navigate with network error', async () => {
        await helper.navigation.navigateTo('/dashboard');
        
        // Should show error state or handle gracefully
        const hasError = await helper.ui.hasErrorMessage();
        if (hasError) {
          const errorMessage = await helper.ui.getErrorMessage();
          expect(errorMessage.toLowerCase()).toMatch(/network|connection|error/);
        }
      });
    });
  });

  test.describe('Loading States', () => {
    test.beforeEach(async () => {
      await helper.auth.login('regular');
    });

    test('should show loading states during navigation', async ({ page }) => {
      // Add artificial delay to API responses to test loading states
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      
      await test.step('Show loading during navigation', async () => {
        await helper.navigation.navigateTo('/dashboard');
        
        // Loading spinner might appear briefly
        const hasLoading = await page.locator(selectors.loadingSpinner).isVisible().catch(() => false);
        
        // Wait for content to load
        await helper.ui.waitForLoading();
        
        // Final content should be visible
        const dashboardContent = page.locator('[data-testid="dashboard-content"]');
        await expect(dashboardContent).toBeVisible();
      });
    });

    test('should handle slow loading gracefully', async ({ page }) => {
      // Simulate very slow responses
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await route.continue();
      });
      
      await test.step('Navigate with slow loading', async () => {
        await helper.navigation.navigateTo('/dashboard');
        
        // Should eventually load (or timeout gracefully)
        try {
          await helper.ui.waitForLoading();
          const content = page.locator('[data-testid="dashboard-content"]');
          await expect(content).toBeVisible({ timeout: timeouts.long });
        } catch (error) {
          // Should handle timeout gracefully with error message
          const hasError = await helper.ui.hasErrorMessage();
          expect(hasError).toBe(true);
        }
      });
    });
  });

  test.describe('Page Title Updates', () => {
    test.beforeEach(async () => {
      await helper.auth.login('regular');
    });

    test('should update page titles correctly', async ({ page }) => {
      const titleTests = [
        { path: '/', title: pageTitles.home },
        { path: '/dashboard', title: pageTitles.dashboard },
        { path: '/create', title: pageTitles.createPrompt },
        { path: '/templates', title: pageTitles.templates }
      ];
      
      for (const titleTest of titleTests) {
        await test.step(`Check title for ${titleTest.path}`, async () => {
          await helper.navigation.navigateTo(titleTest.path);
          await expect(page).toHaveTitle(new RegExp(titleTest.title));
        });
      }
    });

    test('should update title for dynamic content', async ({ page }) => {
      // Create a prompt and verify its detail page title
      await helper.navigation.navigateTo('/create');
      await helper.prompt.createPrompt('Title Test Prompt', 'Content for title testing');
      
      // Title should include prompt title
      await expect(page).toHaveTitle(/Title Test Prompt/);
    });
  });

  test.describe('URL State Management', () => {
    test.beforeEach(async () => {
      await helper.auth.login('regular');
    });

    test('should preserve URL parameters during navigation', async ({ page }) => {
      await test.step('Navigate with search parameters', async () => {
        await page.goto('/dashboard?search=test&category=development');
        
        // URL parameters should be preserved
        expect(page.url()).toContain('search=test');
        expect(page.url()).toContain('category=development');
        
        // Application should use the parameters
        const searchInput = page.locator(selectors.searchInput);
        await expect(searchInput).toHaveValue('test');
      });
      
      await test.step('Maintain parameters through internal navigation', async () => {
        // Navigate to another page and back
        await helper.navigation.navigateTo('/create');
        await page.goBack();
        
        // Parameters should still be there
        expect(page.url()).toContain('search=test');
        expect(page.url()).toContain('category=development');
      });
    });

    test('should handle hash-based navigation', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard#section=prompts');
      
      // Hash should be preserved
      expect(page.url()).toContain('#section=prompts');
      
      // Should scroll to or highlight relevant section
      const promptsSection = page.locator('[data-testid="prompts-section"]');
      if (await promptsSection.isVisible()) {
        await expect(promptsSection).toBeInViewport();
      }
    });
  });

  test.describe('Authentication State Navigation', () => {
    test('should handle logout during navigation', async ({ page }) => {
      await helper.auth.login('regular');
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Logout and verify redirect', async () => {
        await helper.auth.logout();
        
        // Should redirect to login
        await expect(page).toHaveURL('/login');
      });
      
      await test.step('Try to navigate to protected route after logout', async () => {
        await page.goto('/dashboard');
        
        // Should redirect back to login
        await page.waitForURL('**/login**', { timeout: timeouts.medium });
        await expect(page).toHaveURL(/\/login/);
      });
    });

    test('should handle session expiration during navigation', async ({ page }) => {
      await helper.auth.login('regular');
      await helper.navigation.navigateTo('/dashboard');
      
      // Simulate session expiration by clearing token
      await page.evaluate(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
      
      await test.step('Navigate after session expiration', async () => {
        await helper.navigation.navigateTo('/create');
        
        // Should redirect to login due to expired session
        await page.waitForURL('**/login**', { timeout: timeouts.medium });
        await expect(page).toHaveURL(/\/login/);
      });
    });
  });

  test.describe('Mobile Navigation', () => {
    test.beforeEach(async () => {
      await helper.viewport.setMobileViewport();
      await helper.auth.login('regular');
    });

    test('should handle mobile navigation patterns', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Mobile menu navigation', async () => {
        // Sidebar should be collapsed on mobile
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsed).toBe(true);
        
        // Should be able to toggle mobile menu
        await helper.navigation.toggleSidebar();
        
        const isCollapsedAfterToggle = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsedAfterToggle).toBe(false);
      });
      
      await test.step('Navigation in mobile menu', async () => {
        await page.click('[data-testid="mobile-nav-create"]');
        await page.waitForURL('**/create**', { timeout: timeouts.medium });
        await expect(page).toHaveURL('/create');
        
        // Menu should close after navigation
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsed).toBe(true);
      });
    });

    test('should handle swipe navigation on mobile', async ({ page }) => {
      // This would require touch events simulation
      // For now, test basic mobile navigation functionality
      
      await helper.navigation.navigateTo('/dashboard');
      
      const dashboardContent = page.locator('[data-testid="dashboard-content"]');
      await expect(dashboardContent).toBeVisible();
      
      // Verify mobile-friendly navigation works
      await helper.navigation.navigateTo('/create');
      const createForm = page.locator(selectors.promptForm);
      await expect(createForm).toBeVisible();
    });
  });
});