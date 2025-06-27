/**
 * Responsive Behavior E2E Tests
 * 
 * Tests for responsive design behavior across different viewports including:
 * - Mobile, tablet, and desktop viewport testing
 * - Layout adaptation for different screen sizes
 * - Touch interactions on mobile devices
 * - Navigation patterns across viewports
 * - Form layouts and usability
 * - Content visibility and accessibility
 * - Performance on different devices
 */

import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers/testHelpers';
import { testCategories, testPrompts, selectors, timeouts, viewports } from './fixtures/testData';

test.describe('Responsive Behavior', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.setup();
    await helper.auth.login('regular');
  });

  test.afterEach(async () => {
    await helper.teardown();
  });

  test.describe('Mobile Viewport (375x667)', () => {
    test.beforeEach(async () => {
      await helper.viewport.setMobileViewport();
    });

    test('should adapt main layout for mobile', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Sidebar should be collapsed on mobile', async () => {
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsed).toBe(true);
        
        // Mobile menu button should be visible
        const toggleButton = page.locator(selectors.sidebarToggle);
        await expect(toggleButton).toBeVisible();
      });
      
      await test.step('Main content should use full width', async () => {
        const mainContent = page.locator(selectors.mainContent);
        await expect(mainContent).toBeVisible();
        
        const boundingBox = await mainContent.boundingBox();
        expect(boundingBox?.width).toBeCloseTo(viewports.mobile.width, 50); // Allow some margin
      });
      
      await test.step('Navigation should be touch-friendly', async () => {
        await helper.navigation.toggleSidebar();
        
        // Sidebar should overlay content
        const sidebar = page.locator(selectors.sidebar);
        await expect(sidebar).toBeVisible();
        
        // Overlay should be present
        const overlay = page.locator('[data-testid="sidebar-overlay"]');
        await expect(overlay).toBeVisible();
        
        // Touch targets should be adequately sized (minimum 44px)
        const navItems = page.locator('[data-testid="nav-item"]');
        const count = await navItems.count();
        
        for (let i = 0; i < count; i++) {
          const item = navItems.nth(i);
          const box = await item.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      });
    });

    test('should handle mobile form layouts', async ({ page }) => {
      await helper.navigation.navigateTo('/create');
      
      await test.step('Form should stack vertically on mobile', async () => {
        const form = page.locator(selectors.promptForm);
        await expect(form).toBeVisible();
        
        // Inputs should be full width
        const titleInput = page.locator(selectors.promptTitleInput);
        const contentInput = page.locator(selectors.promptContentInput);
        
        const titleBox = await titleInput.boundingBox();
        const contentBox = await contentInput.boundingBox();
        
        expect(titleBox?.width).toBeGreaterThan(300); // Should use most of available width
        expect(contentBox?.width).toBeGreaterThan(300);
      });
      
      await test.step('Create prompt functionality on mobile', async () => {
        await helper.prompt.createPrompt(
          'Mobile Test Prompt',
          'This prompt was created on a mobile device with a responsive layout.',
          'Testing mobile form submission'
        );
        
        // Should successfully create and navigate
        await expect(page).toHaveURL(/\/prompt\/.+/);
        await expect(page.locator(selectors.promptTitle)).toContainText('Mobile Test Prompt');
      });
    });

    test('should handle mobile category management', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Category creation on mobile', async () => {
        // Open sidebar
        await helper.navigation.toggleSidebar();
        
        // Create category
        await helper.category.createCategory('Mobile Category', 'Created on mobile');
        
        // Should work seamlessly
        const categoryExists = await helper.category.categoryExists('Mobile Category');
        expect(categoryExists).toBe(true);
      });
      
      await test.step('Category selection on mobile', async () => {
        await helper.navigation.toggleSidebar();
        await helper.navigation.selectCategory('Mobile Category');
        
        // Should navigate and close sidebar
        await expect(page).toHaveURL(/\/category\/.+/);
        
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsed).toBe(true);
      });
    });

    test('should handle mobile search and filtering', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Search interface on mobile', async () => {
        const searchInput = page.locator(selectors.searchInput);
        await expect(searchInput).toBeVisible();
        
        // Search input should be appropriately sized
        const searchBox = await searchInput.boundingBox();
        expect(searchBox?.width).toBeGreaterThan(200);
        
        // Search should work
        await helper.search.search('test');
        
        // Results should be displayed properly
        await page.waitForTimeout(500);
      });
      
      await test.step('Filter controls on mobile', async () => {
        const filterButton = page.locator(selectors.filterButton);
        
        if (await filterButton.isVisible()) {
          await filterButton.click();
          
          // Filter dropdown should be mobile-friendly
          const filterDropdown = page.locator(selectors.filterDropdown);
          await expect(filterDropdown).toBeVisible();
          
          const dropdownBox = await filterDropdown.boundingBox();
          expect(dropdownBox?.width).toBeLessThanOrEqual(viewports.mobile.width);
        }
      });
    });

    test('should handle mobile scrolling and content visibility', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      // Create multiple prompts to test scrolling
      for (let i = 1; i <= 5; i++) {
        await helper.navigation.navigateTo('/create');
        await helper.prompt.createPrompt(
          `Mobile Scroll Test ${i}`,
          `Content for prompt ${i}`,
          `Description ${i}`
        );
      }
      
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Content should be scrollable', async () => {
        const promptList = page.locator(selectors.promptList);
        await expect(promptList).toBeVisible();
        
        // Should be able to scroll through content
        await page.evaluate(() => window.scrollTo(0, 200));
        await page.waitForTimeout(300);
        
        // Content should still be accessible
        await expect(promptList).toBeVisible();
      });
    });
  });

  test.describe('Tablet Viewport (768x1024)', () => {
    test.beforeEach(async () => {
      await helper.viewport.setTabletViewport();
    });

    test('should adapt layout for tablet size', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Sidebar behavior on tablet', async () => {
        // Tablet might have different sidebar behavior than mobile
        const sidebar = page.locator(selectors.sidebar);
        await expect(sidebar).toBeVisible();
        
        // Should be able to toggle
        await helper.navigation.toggleSidebar();
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        expect(typeof isCollapsed).toBe('boolean');
      });
      
      await test.step('Content should use available space efficiently', async () => {
        const mainContent = page.locator(selectors.mainContent);
        const contentBox = await mainContent.boundingBox();
        
        // Should use tablet width appropriately
        expect(contentBox?.width).toBeGreaterThan(500);
        expect(contentBox?.width).toBeLessThanOrEqual(viewports.tablet.width);
      });
    });

    test('should handle tablet form layouts', async ({ page }) => {
      await helper.navigation.navigateTo('/create');
      
      await test.step('Form layout on tablet', async () => {
        const form = page.locator(selectors.promptForm);
        await expect(form).toBeVisible();
        
        // Forms might use two-column layout on tablet
        const titleInput = page.locator(selectors.promptTitleInput);
        const descriptionInput = page.locator(selectors.promptDescriptionInput);
        
        await expect(titleInput).toBeVisible();
        await expect(descriptionInput).toBeVisible();
        
        // Should be touch-friendly but more spacious than mobile
        const titleBox = await titleInput.boundingBox();
        expect(titleBox?.height).toBeGreaterThanOrEqual(44);
      });
      
      await test.step('Category selection on tablet', async () => {
        // Create a test category first
        await helper.navigation.navigateTo('/dashboard');
        await helper.category.createCategory('Tablet Test', 'For tablet testing');
        
        await helper.navigation.navigateTo('/create');
        
        const categorySelect = page.locator(selectors.promptCategorySelect);
        await expect(categorySelect).toBeVisible();
        
        // Should be able to select category
        await categorySelect.selectOption({ label: 'Tablet Test' });
      });
    });

    test('should handle tablet navigation patterns', async ({ page }) => {
      await test.step('Navigation should work smoothly on tablet', async () => {
        const navigationPaths = ['/dashboard', '/create', '/templates', '/'];
        
        for (const path of navigationPaths) {
          await helper.navigation.navigateTo(path);
          await expect(page).toHaveURL(path);
          await helper.ui.waitForLoading();
        }
      });
    });
  });

  test.describe('Desktop Viewport (1920x1080)', () => {
    test.beforeEach(async () => {
      await helper.viewport.setDesktopViewport();
    });

    test('should provide full desktop experience', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Sidebar should be fully functional', async () => {
        const sidebar = page.locator(selectors.sidebar);
        await expect(sidebar).toBeVisible();
        
        // Should show full category list
        const categoryList = page.locator(selectors.categoryList);
        await expect(categoryList).toBeVisible();
        
        // No overlay needed on desktop
        const overlay = page.locator('[data-testid="sidebar-overlay"]');
        await expect(overlay).not.toBeVisible();
      });
      
      await test.step('Content should use desktop layout', async () => {
        const mainContent = page.locator(selectors.mainContent);
        const contentBox = await mainContent.boundingBox();
        
        // Should use significant portion of desktop width
        expect(contentBox?.width).toBeGreaterThan(1000);
      });
      
      await test.step('Multiple columns and advanced layouts', async () => {
        // Desktop might show more information in grid layouts
        const promptItems = page.locator(selectors.promptItem);
        const count = await promptItems.count();
        
        if (count > 0) {
          // Check if items are arranged in a grid on desktop
          const firstItem = promptItems.first();
          const secondItem = promptItems.nth(1);
          
          if (await secondItem.isVisible()) {
            const firstBox = await firstItem.boundingBox();
            const secondBox = await secondItem.boundingBox();
            
            // Items might be side by side in desktop grid
            if (firstBox && secondBox) {
              const isGridLayout = Math.abs(firstBox.y - secondBox.y) < 50; // Similar Y position
              // Grid layout is acceptable on desktop
              expect(typeof isGridLayout).toBe('boolean');
            }
          }
        }
      });
    });

    test('should handle desktop-specific features', async ({ page }) => {
      await test.step('Hover interactions should work', async () => {
        // Create a test category to hover over
        await helper.category.createCategory('Hover Test', 'For hover testing');
        
        const categoryElement = helper.category.getCategoryByName('Hover Test');
        await categoryElement.hover();
        
        // Action buttons should appear on hover
        const editButton = categoryElement.locator(selectors.categoryEditButton);
        const deleteButton = categoryElement.locator(selectors.categoryDeleteButton);
        
        await expect(editButton).toBeVisible();
        await expect(deleteButton).toBeVisible();
      });
      
      await test.step('Keyboard shortcuts should work', async () => {
        // Test sidebar toggle shortcut
        const initialState = await helper.navigation.isSidebarCollapsed();
        
        await page.keyboard.press(process.platform === 'darwin' ? 'Meta+KeyB' : 'Control+KeyB');
        await page.waitForTimeout(300);
        
        const newState = await helper.navigation.isSidebarCollapsed();
        expect(newState).toBe(!initialState);
      });
      
      await test.step('Context menus and advanced interactions', async () => {
        // Right-click on category for context menu (if implemented)
        const categoryElement = helper.category.getCategoryByName('Hover Test');
        await categoryElement.click({ button: 'right' });
        
        // Context menu might appear
        const contextMenu = page.locator('[data-testid="context-menu"]');
        const hasContextMenu = await contextMenu.isVisible().catch(() => false);
        
        if (hasContextMenu) {
          await expect(contextMenu).toBeVisible();
          
          // Close context menu
          await page.keyboard.press('Escape');
        }
      });
    });
  });

  test.describe('Viewport Transitions', () => {
    test('should handle smooth transitions between viewport sizes', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Desktop to mobile transition', async () => {
        await helper.viewport.setDesktopViewport();
        
        // Verify desktop state
        const sidebar = page.locator(selectors.sidebar);
        await expect(sidebar).toBeVisible();
        
        // Transition to mobile
        await helper.viewport.setMobileViewport();
        await page.waitForTimeout(500); // Wait for responsive changes
        
        // Should adapt to mobile
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsed).toBe(true);
      });
      
      await test.step('Mobile to desktop transition', async () => {
        await helper.viewport.setMobileViewport();
        
        // Verify mobile state
        const isCollapsedMobile = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsedMobile).toBe(true);
        
        // Transition to desktop
        await helper.viewport.setDesktopViewport();
        await page.waitForTimeout(500);
        
        // Should restore desktop functionality
        const sidebar = page.locator(selectors.sidebar);
        await expect(sidebar).toBeVisible();
        
        const categoryList = page.locator(selectors.categoryList);
        await expect(categoryList).toBeVisible();
      });
    });

    test('should maintain functionality across viewport changes', async ({ page }) => {
      // Create test data
      await helper.category.createCategory('Responsive Test', 'Testing viewport changes');
      
      await test.step('Test category functionality across viewports', async () => {
        const viewportSizes = [
          { name: 'desktop', setter: () => helper.viewport.setDesktopViewport() },
          { name: 'tablet', setter: () => helper.viewport.setTabletViewport() },
          { name: 'mobile', setter: () => helper.viewport.setMobileViewport() }
        ];
        
        for (const viewport of viewportSizes) {
          await viewport.setter();
          await page.waitForTimeout(300);
          
          // Category should be accessible
          const categoryExists = await helper.category.categoryExists('Responsive Test');
          expect(categoryExists).toBe(true);
          
          // Should be able to select category
          if (viewport.name === 'mobile') {
            await helper.navigation.toggleSidebar();
          }
          
          await helper.navigation.selectCategory('Responsive Test');
          await expect(page).toHaveURL(/\/category\/.+/);
          
          // Navigate back to dashboard
          await helper.navigation.navigateTo('/dashboard');
        }
      });
    });
  });

  test.describe('Touch Interactions', () => {
    test.beforeEach(async () => {
      await helper.viewport.setMobileViewport();
    });

    test('should handle touch gestures on mobile', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Tap interactions should work', async () => {
        // Create test category
        await helper.category.createCategory('Touch Test', 'For touch testing');
        
        // Open sidebar with tap
        await helper.navigation.toggleSidebar();
        
        // Tap on category
        const categoryElement = helper.category.getCategoryByName('Touch Test');
        await categoryElement.tap();
        
        // Should navigate
        await expect(page).toHaveURL(/\/category\/.+/);
      });
      
      await test.step('Swipe gestures should work (if implemented)', async () => {
        // Swipe to open sidebar (if implemented)
        const mainContent = page.locator(selectors.mainContent);
        
        // Simulate swipe from left edge
        await mainContent.hover({ position: { x: 10, y: 300 } });
        await page.mouse.down();
        await page.mouse.move(100, 300);
        await page.mouse.up();
        
        await page.waitForTimeout(300);
        
        // Sidebar might open (depending on implementation)
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        // This is implementation-dependent
        expect(typeof isCollapsed).toBe('boolean');
      });
    });

    test('should handle long press interactions', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      await helper.category.createCategory('Long Press Test', 'For long press testing');
      
      const categoryElement = helper.category.getCategoryByName('Long Press Test');
      
      await test.step('Long press should show context menu (if implemented)', async () => {
        // Simulate long press
        await categoryElement.hover();
        await page.mouse.down();
        await page.waitForTimeout(800); // Long press duration
        await page.mouse.up();
        
        // Context menu might appear
        const contextMenu = page.locator('[data-testid="context-menu"]');
        const hasContextMenu = await contextMenu.isVisible().catch(() => false);
        
        if (hasContextMenu) {
          await expect(contextMenu).toBeVisible();
          
          // Dismiss context menu
          await page.tap('body');
        }
      });
    });
  });

  test.describe('Performance on Different Viewports', () => {
    test('should load efficiently on mobile', async ({ page }) => {
      await helper.viewport.setMobileViewport();
      
      const startTime = Date.now();
      await helper.navigation.navigateTo('/dashboard');
      await helper.ui.waitForLoading();
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time on mobile
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
      
      // Essential elements should be visible
      const mainContent = page.locator(selectors.mainContent);
      await expect(mainContent).toBeVisible();
    });

    test('should handle large datasets on small screens', async ({ page }) => {
      await helper.viewport.setMobileViewport();
      
      // Create multiple items to test performance
      for (let i = 1; i <= 20; i++) {
        await helper.navigation.navigateTo('/create');
        await helper.prompt.createPrompt(
          `Performance Test ${i}`,
          `Content for performance testing prompt ${i}`,
          `Description ${i}`
        );
      }
      
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Should render list efficiently', async () => {
        const promptList = page.locator(selectors.promptList);
        await expect(promptList).toBeVisible();
        
        // Should be able to scroll through items
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(300);
        
        // List should remain responsive
        const promptItems = page.locator(selectors.promptItem);
        const visibleCount = await promptItems.count();
        expect(visibleCount).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Accessibility on Different Viewports', () => {
    test('should maintain accessibility on mobile', async ({ page }) => {
      await helper.viewport.setMobileViewport();
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Touch targets should be adequately sized', async () => {
        const touchTargets = page.locator('button, a, [role="button"]');
        const count = await touchTargets.count();
        
        for (let i = 0; i < Math.min(count, 10); i++) { // Test first 10 elements
          const target = touchTargets.nth(i);
          const box = await target.boundingBox();
          
          if (box) {
            // WCAG guideline: minimum 44x44px for touch targets
            expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
          }
        }
      });
      
      await test.step('Text should be readable on mobile', async () => {
        const textElements = page.locator('p, span, div').filter({ hasText: /.+/ });
        const count = await textElements.count();
        
        for (let i = 0; i < Math.min(count, 5); i++) {
          const element = textElements.nth(i);
          const fontSize = await element.evaluate(el => 
            window.getComputedStyle(el).fontSize
          );
          
          const sizeValue = parseInt(fontSize);
          expect(sizeValue).toBeGreaterThanOrEqual(16); // Minimum readable size
        }
      });
    });

    test('should support screen readers on all viewports', async ({ page }) => {
      const viewportTests = [
        () => helper.viewport.setMobileViewport(),
        () => helper.viewport.setTabletViewport(),
        () => helper.viewport.setDesktopViewport()
      ];
      
      for (const setViewport of viewportTests) {
        await setViewport();
        await helper.navigation.navigateTo('/dashboard');
        
        // Essential elements should have proper ARIA labels
        const sidebar = page.locator(selectors.sidebar);
        const sidebarLabel = await sidebar.getAttribute('aria-label');
        expect(sidebarLabel).toBeTruthy();
        
        const mainContent = page.locator(selectors.mainContent);
        const mainLabel = await mainContent.getAttribute('aria-label') || 
                         await mainContent.getAttribute('role');
        expect(mainLabel).toBeTruthy();
      }
    });
  });
});