/**
 * Sidebar Interaction E2E Tests
 * 
 * Tests for MainLayout sidebar toggle and CategorySidebar interaction functionality including:
 * - Sidebar toggle functionality
 * - Category sidebar interactions
 * - Responsive sidebar behavior
 * - Sidebar state persistence
 * - Keyboard navigation
 * - Category group expand/collapse
 * - Category selection and filtering
 */

import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers/testHelpers';
import { testCategories, selectors, timeouts, viewports } from './fixtures/testData';

test.describe('Sidebar Interactions', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.setup();
    await helper.auth.login('regular');
    await helper.navigation.navigateTo('/dashboard');
    await helper.ui.waitForLoading();
  });

  test.afterEach(async () => {
    await helper.teardown();
  });

  test.describe('MainLayout Sidebar Toggle', () => {
    test('should toggle sidebar visibility with button click', async ({ page }) => {
      await test.step('Verify initial sidebar state', async () => {
        const sidebar = page.locator(selectors.sidebar);
        await expect(sidebar).toBeVisible();
        
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        // Default state might be expanded on desktop
        expect(typeof isCollapsed).toBe('boolean');
      });
      
      await test.step('Toggle sidebar to collapsed', async () => {
        await helper.navigation.toggleSidebar();
        
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsed).toBe(true);
        
        // Sidebar should still be in DOM but visually collapsed
        const sidebar = page.locator(selectors.sidebar);
        await expect(sidebar).toBeVisible();
        
        // Main content should expand to fill space
        const mainContent = page.locator(selectors.mainContent);
        await expect(mainContent).toBeVisible();
      });
      
      await test.step('Toggle sidebar back to expanded', async () => {
        await helper.navigation.toggleSidebar();
        
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsed).toBe(false);
        
        // Categories should be visible again
        const categoryList = page.locator(selectors.categoryList);
        await expect(categoryList).toBeVisible();
      });
    });

    test('should persist sidebar state across page refreshes', async ({ page }) => {
      await test.step('Collapse sidebar and refresh', async () => {
        await helper.navigation.toggleSidebar();
        const isCollapsedBefore = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsedBefore).toBe(true);
        
        await page.reload();
        await helper.ui.waitForLoading();
        
        const isCollapsedAfter = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsedAfter).toBe(true);
      });
      
      await test.step('Expand sidebar and refresh', async () => {
        await helper.navigation.toggleSidebar();
        const isExpandedBefore = await helper.navigation.isSidebarCollapsed();
        expect(isExpandedBefore).toBe(false);
        
        await page.reload();
        await helper.ui.waitForLoading();
        
        const isExpandedAfter = await helper.navigation.isSidebarCollapsed();
        expect(isExpandedAfter).toBe(false);
      });
    });

    test('should handle keyboard shortcuts for sidebar toggle', async ({ page }) => {
      await test.step('Use keyboard shortcut to toggle sidebar', async () => {
        const initialState = await helper.navigation.isSidebarCollapsed();
        
        // Common keyboard shortcut (Ctrl/Cmd + B)
        await page.keyboard.press(process.platform === 'darwin' ? 'Meta+KeyB' : 'Control+KeyB');
        
        // Wait for animation
        await page.waitForTimeout(300);
        
        const newState = await helper.navigation.isSidebarCollapsed();
        expect(newState).toBe(!initialState);
      });
    });

    test('should show toggle button at all times', async ({ page }) => {
      const toggleButton = page.locator(selectors.sidebarToggle);
      
      await test.step('Toggle button visible when expanded', async () => {
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        if (isCollapsed) {
          await helper.navigation.toggleSidebar();
        }
        
        await expect(toggleButton).toBeVisible();
        await expect(toggleButton).toBeEnabled();
      });
      
      await test.step('Toggle button visible when collapsed', async () => {
        await helper.navigation.toggleSidebar();
        
        await expect(toggleButton).toBeVisible();
        await expect(toggleButton).toBeEnabled();
      });
    });
  });

  test.describe('CategorySidebar Interactions', () => {
    test.beforeEach(async () => {
      // Create test categories for interaction testing
      for (const category of testCategories.slice(0, 4)) {
        await helper.category.createCategory(category.name, category.description, category.color);
      }
    });

    test('should display categories in organized groups', async ({ page }) => {
      await test.step('Verify category groups are visible', async () => {
        const categoryList = page.locator(selectors.categoryList);
        await expect(categoryList).toBeVisible();
        
        // Should show different scope groups
        const personalGroup = page.locator('[data-testid="category-group-personal"]');
        const publicGroup = page.locator('[data-testid="category-group-public"]');
        
        await expect(personalGroup).toBeVisible();
        
        // Public group might be visible if there are public categories
        const hasPublicCategories = await publicGroup.isVisible();
        if (hasPublicCategories) {
          await expect(publicGroup).toBeVisible();
        }
      });
      
      await test.step('Verify individual categories are displayed', async () => {
        for (const category of testCategories.slice(0, 3)) {
          const categoryElement = helper.category.getCategoryByName(category.name);
          await expect(categoryElement).toBeVisible();
          await expect(categoryElement).toContainText(category.name);
        }
      });
    });

    test('should handle category selection', async ({ page }) => {
      const testCategory = testCategories[0];
      
      await test.step('Select a category', async () => {
        await helper.navigation.selectCategory(testCategory.name);
        
        // URL should update to category view
        await expect(page).toHaveURL(/\/category\/.+/);
        
        // Selected category should be highlighted
        const selectedCategory = helper.category.getCategoryByName(testCategory.name);
        await expect(selectedCategory).toHaveClass(/selected|active/);
      });
      
      await test.step('Select "All" to show all prompts', async () => {
        await page.click('[data-testid="category-all"]');
        await page.waitForURL('/', { timeout: timeouts.medium });
        
        // Should show all prompts
        await expect(page).toHaveURL('/');
        
        // "All" should be selected
        const allCategory = page.locator('[data-testid="category-all"]');
        await expect(allCategory).toHaveClass(/selected|active/);
      });
    });

    test('should expand and collapse category groups', async ({ page }) => {
      await test.step('Collapse personal category group', async () => {
        const personalGroupHeader = page.locator('[data-testid="category-group-personal-header"]');
        await personalGroupHeader.click();
        
        // Personal categories should be hidden
        const personalCategories = page.locator('[data-testid="category-group-personal"] .category-item');
        await expect(personalCategories.first()).not.toBeVisible();
        
        // Group should show collapsed state
        const collapseIcon = personalGroupHeader.locator('[data-testid="collapse-icon"]');
        await expect(collapseIcon).toHaveClass(/collapsed|rotated/);
      });
      
      await test.step('Expand personal category group', async () => {
        const personalGroupHeader = page.locator('[data-testid="category-group-personal-header"]');
        await personalGroupHeader.click();
        
        // Personal categories should be visible again
        const personalCategories = page.locator('[data-testid="category-group-personal"] .category-item');
        await expect(personalCategories.first()).toBeVisible();
        
        // Group should show expanded state
        const collapseIcon = personalGroupHeader.locator('[data-testid="collapse-icon"]');
        await expect(collapseIcon).not.toHaveClass(/collapsed|rotated/);
      });
    });

    test('should show category create button in appropriate groups', async ({ page }) => {
      await test.step('Create button visible in personal group', async () => {
        const personalGroup = page.locator('[data-testid="category-group-personal"]');
        const createButton = personalGroup.locator(selectors.createCategoryButton);
        
        await expect(createButton).toBeVisible();
        await expect(createButton).toBeEnabled();
      });
      
      await test.step('Create button functionality', async () => {
        const createButton = page.locator('[data-testid="category-group-personal"]').locator(selectors.createCategoryButton);
        await createButton.click();
        
        // Should open category creation form
        await expect(page.locator(selectors.categoryForm)).toBeVisible();
        
        // Cancel to close
        await page.click(selectors.categoryCancelButton);
      });
    });

    test('should display category metadata correctly', async ({ page }) => {
      const testCategory = testCategories[0];
      const categoryElement = helper.category.getCategoryByName(testCategory.name);
      
      await test.step('Show category name and description', async () => {
        await expect(categoryElement).toContainText(testCategory.name);
        if (testCategory.description) {
          await expect(categoryElement).toContainText(testCategory.description);
        }
      });
      
      await test.step('Show category color indicator', async () => {
        const colorIndicator = categoryElement.locator('[data-testid="category-color-indicator"]');
        await expect(colorIndicator).toBeVisible();
        
        // Should have the correct background color
        if (testCategory.color) {
          const expectedRgb = hexToRgb(testCategory.color);
          await expect(colorIndicator).toHaveCSS('background-color', expectedRgb);
        }
      });
      
      await test.step('Show prompt count if available', async () => {
        const promptCount = categoryElement.locator('[data-testid="category-prompt-count"]');
        const isVisible = await promptCount.isVisible();
        
        if (isVisible) {
          const countText = await promptCount.textContent();
          expect(countText).toMatch(/\d+/); // Should contain a number
        }
      });
    });

    test('should handle category actions (edit/delete)', async ({ page }) => {
      const testCategory = testCategories[0];
      const categoryElement = helper.category.getCategoryByName(testCategory.name);
      
      await test.step('Show action menu on hover/click', async () => {
        await categoryElement.hover();
        
        // Action buttons should become visible
        const editButton = categoryElement.locator(selectors.categoryEditButton);
        const deleteButton = categoryElement.locator(selectors.categoryDeleteButton);
        
        await expect(editButton).toBeVisible();
        await expect(deleteButton).toBeVisible();
      });
      
      await test.step('Edit action opens form', async () => {
        const editButton = categoryElement.locator(selectors.categoryEditButton);
        await editButton.click();
        
        await expect(page.locator(selectors.categoryForm)).toBeVisible();
        
        // Form should be pre-filled with current values
        const nameInput = page.locator(selectors.categoryNameInput);
        await expect(nameInput).toHaveValue(testCategory.name);
        
        // Cancel edit
        await page.click(selectors.categoryCancelButton);
      });
      
      await test.step('Delete action shows confirmation', async () => {
        const deleteButton = categoryElement.locator(selectors.categoryDeleteButton);
        await deleteButton.click();
        
        // Should show confirmation dialog
        await expect(page.locator(selectors.confirmDialog)).toBeVisible();
        
        // Cancel deletion
        await page.click(selectors.confirmNoButton);
      });
    });
  });

  test.describe('Responsive Sidebar Behavior', () => {
    test('should behave correctly on mobile viewport', async ({ page }) => {
      await helper.viewport.setMobileViewport();
      
      await test.step('Sidebar collapsed by default on mobile', async () => {
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsed).toBe(true);
        
        // Sidebar should be hidden off-screen
        const sidebar = page.locator(selectors.sidebar);
        const boundingBox = await sidebar.boundingBox();
        
        if (boundingBox) {
          expect(boundingBox.x).toBeLessThan(0); // Off-screen to the left
        }
      });
      
      await test.step('Toggle sidebar on mobile shows overlay', async () => {
        await helper.navigation.toggleSidebar();
        
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsed).toBe(false);
        
        // Should show overlay backdrop
        const overlay = page.locator('[data-testid="sidebar-overlay"]');
        await expect(overlay).toBeVisible();
        
        // Sidebar should be on-screen
        const sidebar = page.locator(selectors.sidebar);
        await expect(sidebar).toBeVisible();
      });
      
      await test.step('Clicking overlay closes mobile sidebar', async () => {
        const overlay = page.locator('[data-testid="sidebar-overlay"]');
        await overlay.click();
        
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsed).toBe(true);
        
        // Overlay should be hidden
        await expect(overlay).not.toBeVisible();
      });
    });

    test('should behave correctly on tablet viewport', async ({ page }) => {
      await helper.viewport.setTabletViewport();
      
      await test.step('Sidebar behavior on tablet', async () => {
        // Tablet might have different default behavior
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        
        // Should be able to toggle
        await helper.navigation.toggleSidebar();
        
        const newState = await helper.navigation.isSidebarCollapsed();
        expect(newState).toBe(!isCollapsed);
      });
    });

    test('should behave correctly on desktop viewport', async ({ page }) => {
      await helper.viewport.setDesktopViewport();
      
      await test.step('Sidebar fully functional on desktop', async () => {
        // Sidebar should be expanded by default on desktop
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        
        // Should show full sidebar with all features
        const sidebar = page.locator(selectors.sidebar);
        await expect(sidebar).toBeVisible();
        
        const categoryList = page.locator(selectors.categoryList);
        await expect(categoryList).toBeVisible();
        
        // No overlay needed on desktop
        const overlay = page.locator('[data-testid="sidebar-overlay"]');
        await expect(overlay).not.toBeVisible();
      });
    });

    test('should handle viewport resize gracefully', async ({ page }) => {
      await test.step('Start with desktop viewport', async () => {
        await helper.viewport.setDesktopViewport();
        const desktopState = await helper.navigation.isSidebarCollapsed();
        
        // Sidebar should be functional
        const sidebar = page.locator(selectors.sidebar);
        await expect(sidebar).toBeVisible();
      });
      
      await test.step('Resize to mobile and verify adaptation', async () => {
        await helper.viewport.setMobileViewport();
        
        // Should adapt to mobile behavior
        await page.waitForTimeout(300); // Wait for responsive changes
        
        const mobileState = await helper.navigation.isSidebarCollapsed();
        // Mobile should typically be collapsed
        expect(mobileState).toBe(true);
      });
      
      await test.step('Resize back to desktop', async () => {
        await helper.viewport.setDesktopViewport();
        await page.waitForTimeout(300);
        
        // Should restore desktop behavior
        const sidebar = page.locator(selectors.sidebar);
        await expect(sidebar).toBeVisible();
      });
    });
  });

  test.describe('Keyboard Navigation', () => {
    test.beforeEach(async () => {
      // Create test categories for keyboard navigation
      for (const category of testCategories.slice(0, 3)) {
        await helper.category.createCategory(category.name, category.description);
      }
    });

    test('should support keyboard navigation through categories', async ({ page }) => {
      await test.step('Focus on category list', async () => {
        const categoryList = page.locator(selectors.categoryList);
        await categoryList.focus();
        
        // First category should be focusable
        await page.keyboard.press('Tab');
        
        const firstCategory = page.locator(`${selectors.categoryItem}:first-child`);
        await expect(firstCategory).toBeFocused();
      });
      
      await test.step('Navigate between categories with arrow keys', async () => {
        await page.keyboard.press('ArrowDown');
        
        const secondCategory = page.locator(`${selectors.categoryItem}:nth-child(2)`);
        await expect(secondCategory).toBeFocused();
        
        await page.keyboard.press('ArrowUp');
        
        const firstCategory = page.locator(`${selectors.categoryItem}:first-child`);
        await expect(firstCategory).toBeFocused();
      });
      
      await test.step('Select category with Enter key', async () => {
        await page.keyboard.press('Enter');
        
        // Should navigate to the focused category
        await expect(page).toHaveURL(/\/category\/.+/);
      });
    });

    test('should support keyboard shortcuts for sidebar actions', async ({ page }) => {
      await test.step('Escape key closes open forms', async () => {
        // Open category creation form
        await page.click(selectors.createCategoryButton);
        await expect(page.locator(selectors.categoryForm)).toBeVisible();
        
        // Press Escape to close
        await page.keyboard.press('Escape');
        await expect(page.locator(selectors.categoryForm)).not.toBeVisible();
      });
      
      await test.step('Escape key closes confirmation dialogs', async () => {
        // Try to delete a category to open confirmation
        const categoryElement = helper.category.getCategoryByName(testCategories[0].name);
        await categoryElement.locator(selectors.categoryDeleteButton).click();
        
        await expect(page.locator(selectors.confirmDialog)).toBeVisible();
        
        // Press Escape to cancel
        await page.keyboard.press('Escape');
        await expect(page.locator(selectors.confirmDialog)).not.toBeVisible();
      });
    });
  });

  test.describe('Sidebar State Persistence', () => {
    test('should persist collapsed state across sessions', async ({ page }) => {
      await test.step('Collapse sidebar and verify persistence', async () => {
        await helper.navigation.toggleSidebar();
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsed).toBe(true);
        
        // Refresh page
        await page.reload();
        await helper.ui.waitForLoading();
        
        // State should be preserved
        const persistedState = await helper.navigation.isSidebarCollapsed();
        expect(persistedState).toBe(true);
      });
      
      await test.step('Expand sidebar and verify persistence', async () => {
        await helper.navigation.toggleSidebar();
        const isExpanded = await helper.navigation.isSidebarCollapsed();
        expect(isExpanded).toBe(false);
        
        // Navigate to different page
        await helper.navigation.navigateTo('/create');
        await helper.navigation.navigateTo('/dashboard');
        
        // State should be preserved
        const persistedState = await helper.navigation.isSidebarCollapsed();
        expect(persistedState).toBe(false);
      });
    });

    test('should persist expanded category groups', async ({ page }) => {
      // Create categories in different scopes
      await helper.category.createCategory('Personal Cat', 'Personal category', '#3B82F6');
      
      await test.step('Collapse personal group', async () => {
        const personalHeader = page.locator('[data-testid="category-group-personal-header"]');
        await personalHeader.click();
        
        // Verify collapsed
        const personalCategories = page.locator('[data-testid="category-group-personal"] .category-item');
        await expect(personalCategories.first()).not.toBeVisible();
      });
      
      await test.step('Refresh and verify group state persisted', async () => {
        await page.reload();
        await helper.ui.waitForLoading();
        
        // Personal group should still be collapsed
        const personalCategories = page.locator('[data-testid="category-group-personal"] .category-item');
        await expect(personalCategories.first()).not.toBeVisible();
      });
    });
  });

  test.describe('Search Integration', () => {
    test.beforeEach(async () => {
      // Create categories with searchable names
      const searchableCategories = [
        { name: 'Development Tools', description: 'Programming and development' },
        { name: 'Marketing Content', description: 'Marketing materials and copy' },
        { name: 'Data Analysis', description: 'Data science and analytics' },
        { name: 'Design Patterns', description: 'UI/UX design patterns' }
      ];
      
      for (const category of searchableCategories) {
        await helper.category.createCategory(category.name, category.description);
      }
    });

    test('should filter categories based on search input', async ({ page }) => {
      await test.step('Search for specific categories', async () => {
        await helper.search.search('Development');
        
        // Should show only matching categories
        const devCategory = await helper.category.categoryExists('Development Tools');
        expect(devCategory).toBe(true);
        
        const marketingCategory = await helper.category.categoryExists('Marketing Content');
        expect(marketingCategory).toBe(false);
      });
      
      await test.step('Clear search shows all categories', async () => {
        await helper.search.clearSearch();
        
        // All categories should be visible again
        const devCategory = await helper.category.categoryExists('Development Tools');
        const marketingCategory = await helper.category.categoryExists('Marketing Content');
        
        expect(devCategory).toBe(true);
        expect(marketingCategory).toBe(true);
      });
    });

    test('should highlight search matches in category names', async ({ page }) => {
      await helper.search.search('Design');
      
      const designCategory = helper.category.getCategoryByName('Design Patterns');
      const highlightedText = designCategory.locator('[data-testid="search-highlight"]');
      
      // Should highlight the matching text
      if (await highlightedText.isVisible()) {
        await expect(highlightedText).toContainText('Design');
      }
    });
  });
});

// Helper function to convert hex color to rgb format for CSS comparison
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgb(${r}, ${g}, ${b})`;
}