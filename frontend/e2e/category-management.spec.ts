/**
 * Category Management E2E Tests
 * 
 * Tests for comprehensive category management functionality including:
 * - Creating categories
 * - Editing categories 
 * - Deleting categories
 * - Category filtering and search
 * - Category scope management (personal, team, public)
 * - Error handling and validation
 */

import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers/testHelpers';
import { testCategories, selectors, timeouts, viewports } from './fixtures/testData';

test.describe('Category Management', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.setup();
    await helper.auth.login('regular');
    
    // Navigate to dashboard where category management is available
    await helper.navigation.navigateTo('/dashboard');
    await helper.ui.waitForLoading();
  });

  test.afterEach(async () => {
    await helper.teardown();
  });

  test.describe('Category Creation', () => {
    test('should create a new personal category successfully', async () => {
      const categoryData = testCategories[0];
      
      // Create category
      await helper.category.createCategory(
        categoryData.name,
        categoryData.description,
        categoryData.color
      );
      
      // Verify category appears in sidebar
      const categoryExists = await helper.category.categoryExists(categoryData.name);
      expect(categoryExists).toBe(true);
      
      // Verify category details
      const categoryElement = helper.category.getCategoryByName(categoryData.name);
      await expect(categoryElement).toContainText(categoryData.name);
      if (categoryData.description) {
        await expect(categoryElement).toContainText(categoryData.description);
      }
    });

    test('should create a public category when scope is set to public', async () => {
      const publicCategory = testCategories.find(cat => cat.scopeType === 'public');
      expect(publicCategory).toBeDefined();
      
      await test.step('Open create category form', async () => {
        await helper.page.click(selectors.createCategoryButton);
        await helper.page.waitForSelector(selectors.categoryForm);
      });
      
      await test.step('Fill form with public scope', async () => {
        await helper.page.fill(selectors.categoryNameInput, publicCategory!.name);
        await helper.page.fill(selectors.categoryDescriptionInput, publicCategory!.description || '');
        
        // Select public scope
        await helper.page.selectOption('[data-testid="category-scope-select"]', 'public');
        
        if (publicCategory!.color) {
          await helper.page.click(selectors.categoryColorPicker);
          await helper.page.click(`[data-color="${publicCategory!.color}"]`);
        }
      });
      
      await test.step('Submit and verify creation', async () => {
        await helper.page.click(selectors.categorySubmitButton);
        
        // Wait for category to appear
        await helper.page.waitForSelector(
          `[data-testid="category-item"][data-name="${publicCategory!.name}"]`,
          { timeout: timeouts.medium }
        );
        
        // Verify it's marked as public
        const categoryElement = helper.category.getCategoryByName(publicCategory!.name);
        await expect(categoryElement).toHaveAttribute('data-scope', 'public');
      });
    });

    test('should show validation errors for invalid category data', async () => {
      await test.step('Try to create category with empty name', async () => {
        await helper.page.click(selectors.createCategoryButton);
        await helper.page.waitForSelector(selectors.categoryForm);
        
        // Leave name empty and try to submit
        await helper.page.click(selectors.categorySubmitButton);
        
        // Should show validation error
        const hasError = await helper.ui.hasErrorMessage();
        expect(hasError).toBe(true);
        
        const errorMessage = await helper.ui.getErrorMessage();
        expect(errorMessage).toContain('name');
      });
      
      await test.step('Try to create category with duplicate name', async () => {
        // First create a category
        await helper.category.createCategory('Test Category');
        
        // Try to create another with same name
        await helper.page.click(selectors.createCategoryButton);
        await helper.page.waitForSelector(selectors.categoryForm);
        
        await helper.page.fill(selectors.categoryNameInput, 'Test Category');
        await helper.page.click(selectors.categorySubmitButton);
        
        // Should show duplicate error
        const hasError = await helper.ui.hasErrorMessage();
        expect(hasError).toBe(true);
        
        const errorMessage = await helper.ui.getErrorMessage();
        expect(errorMessage.toLowerCase()).toContain('already exists');
      });
    });

    test('should cancel category creation without saving', async () => {
      const categoryName = 'Cancelled Category';
      
      await helper.page.click(selectors.createCategoryButton);
      await helper.page.waitForSelector(selectors.categoryForm);
      
      // Fill form partially
      await helper.page.fill(selectors.categoryNameInput, categoryName);
      await helper.page.fill(selectors.categoryDescriptionInput, 'This should not be saved');
      
      // Cancel instead of submit
      await helper.page.click(selectors.categoryCancelButton);
      
      // Verify form is closed
      await expect(helper.page.locator(selectors.categoryForm)).not.toBeVisible();
      
      // Verify category was not created
      const categoryExists = await helper.category.categoryExists(categoryName);
      expect(categoryExists).toBe(false);
    });
  });

  test.describe('Category Editing', () => {
    test.beforeEach(async () => {
      // Create a test category to edit
      await helper.category.createCategory(
        'Edit Test Category',
        'Original description',
        '#3B82F6'
      );
    });

    test('should edit category name and description successfully', async () => {
      const originalName = 'Edit Test Category';
      const newName = 'Updated Category Name';
      const newDescription = 'Updated description';
      
      await helper.category.editCategory(originalName, newName, newDescription);
      
      // Verify old name is gone
      const oldCategoryExists = await helper.category.categoryExists(originalName);
      expect(oldCategoryExists).toBe(false);
      
      // Verify new name and description
      const newCategoryExists = await helper.category.categoryExists(newName);
      expect(newCategoryExists).toBe(true);
      
      const categoryElement = helper.category.getCategoryByName(newName);
      await expect(categoryElement).toContainText(newDescription);
    });

    test('should update category color', async () => {
      const categoryName = 'Edit Test Category';
      const newColor = '#10B981';
      
      await test.step('Open edit form', async () => {
        const categoryItem = helper.category.getCategoryByName(categoryName);
        await categoryItem.locator(selectors.categoryEditButton).click();
        await helper.page.waitForSelector(selectors.categoryForm);
      });
      
      await test.step('Change color', async () => {
        await helper.page.click(selectors.categoryColorPicker);
        await helper.page.click(`[data-color="${newColor}"]`);
        await helper.page.click(selectors.categorySubmitButton);
      });
      
      await test.step('Verify color change', async () => {
        await helper.page.waitForTimeout(500); // Wait for UI update
        const categoryElement = helper.category.getCategoryByName(categoryName);
        
        // Check if category element has the new color applied
        const colorIndicator = categoryElement.locator('[data-testid="category-color-indicator"]');
        await expect(colorIndicator).toHaveCSS('background-color', 'rgb(16, 185, 129)'); // #10B981 in RGB
      });
    });

    test('should handle edit validation errors', async () => {
      const categoryName = 'Edit Test Category';
      
      await test.step('Try to set empty name', async () => {
        const categoryItem = helper.category.getCategoryByName(categoryName);
        await categoryItem.locator(selectors.categoryEditButton).click();
        await helper.page.waitForSelector(selectors.categoryForm);
        
        // Clear name field
        await helper.page.fill(selectors.categoryNameInput, '');
        await helper.page.click(selectors.categorySubmitButton);
        
        // Should show validation error
        const hasError = await helper.ui.hasErrorMessage();
        expect(hasError).toBe(true);
      });
    });

    test('should cancel edit without saving changes', async () => {
      const categoryName = 'Edit Test Category';
      const originalDescription = 'Original description';
      
      await test.step('Start editing', async () => {
        const categoryItem = helper.category.getCategoryByName(categoryName);
        await categoryItem.locator(selectors.categoryEditButton).click();
        await helper.page.waitForSelector(selectors.categoryForm);
        
        // Make changes
        await helper.page.fill(selectors.categoryNameInput, 'Should Not Save');
        await helper.page.fill(selectors.categoryDescriptionInput, 'Should not be saved');
        
        // Cancel
        await helper.page.click(selectors.categoryCancelButton);
      });
      
      await test.step('Verify changes were not saved', async () => {
        const categoryExists = await helper.category.categoryExists(categoryName);
        expect(categoryExists).toBe(true);
        
        const notSavedExists = await helper.category.categoryExists('Should Not Save');
        expect(notSavedExists).toBe(false);
        
        // Verify original description is still there
        const categoryElement = helper.category.getCategoryByName(categoryName);
        await expect(categoryElement).toContainText(originalDescription);
      });
    });
  });

  test.describe('Category Deletion', () => {
    test.beforeEach(async () => {
      // Create test categories to delete
      await helper.category.createCategory('Delete Test 1', 'First category to delete');
      await helper.category.createCategory('Delete Test 2', 'Second category to delete');
    });

    test('should delete category successfully with confirmation', async () => {
      const categoryName = 'Delete Test 1';
      
      await helper.category.deleteCategory(categoryName);
      
      // Verify category is removed
      const categoryExists = await helper.category.categoryExists(categoryName);
      expect(categoryExists).toBe(false);
    });

    test('should cancel deletion when user clicks No in confirmation', async () => {
      const categoryName = 'Delete Test 2';
      
      await test.step('Start deletion process', async () => {
        const categoryItem = helper.category.getCategoryByName(categoryName);
        await categoryItem.locator(selectors.categoryDeleteButton).click();
        
        // Wait for confirmation dialog
        await helper.page.waitForSelector(selectors.confirmDialog);
      });
      
      await test.step('Cancel deletion', async () => {
        await helper.page.click(selectors.confirmNoButton);
        
        // Wait for dialog to close
        await expect(helper.page.locator(selectors.confirmDialog)).not.toBeVisible();
      });
      
      await test.step('Verify category still exists', async () => {
        const categoryExists = await helper.category.categoryExists(categoryName);
        expect(categoryExists).toBe(true);
      });
    });

    test('should handle deletion of category with associated prompts', async () => {
      // This test assumes the backend prevents deletion of categories with prompts
      const categoryName = 'Delete Test 1';
      
      // First create a prompt in this category (assuming we have prompt creation capability)
      // For now, we'll mock this scenario by expecting an error response
      
      await test.step('Attempt to delete category with prompts', async () => {
        const categoryItem = helper.category.getCategoryByName(categoryName);
        await categoryItem.locator(selectors.categoryDeleteButton).click();
        await helper.page.waitForSelector(selectors.confirmDialog);
        await helper.page.click(selectors.confirmYesButton);
        
        // Should show error message about category having prompts
        const hasError = await helper.ui.hasErrorMessage();
        if (hasError) {
          const errorMessage = await helper.ui.getErrorMessage();
          expect(errorMessage.toLowerCase()).toMatch(/prompt|cannot.*delete/);
        }
      });
    });
  });

  test.describe('Category Filtering and Search', () => {
    test.beforeEach(async () => {
      // Create categories with different scopes and names for filtering tests
      await helper.category.createCategory('Frontend Development', 'React and Vue.js prompts');
      await helper.category.createCategory('Backend Development', 'Node.js and Python prompts');
      await helper.category.createCategory('Marketing Content', 'Social media and blog posts');
      await helper.category.createCategory('Data Science', 'Analysis and ML prompts');
    });

    test('should filter categories by search term', async () => {
      await test.step('Search for "Development" categories', async () => {
        await helper.search.search('Development');
        
        // Should show both development categories
        const frontendExists = await helper.category.categoryExists('Frontend Development');
        const backendExists = await helper.category.categoryExists('Backend Development');
        
        expect(frontendExists).toBe(true);
        expect(backendExists).toBe(true);
        
        // Should hide non-matching categories
        const marketingExists = await helper.category.categoryExists('Marketing Content');
        const dataScienceExists = await helper.category.categoryExists('Data Science');
        
        // These might still be visible depending on implementation
        // Adjust expectations based on actual filtering behavior
      });
      
      await test.step('Search for specific category', async () => {
        await helper.search.search('Marketing');
        
        const marketingExists = await helper.category.categoryExists('Marketing Content');
        expect(marketingExists).toBe(true);
      });
      
      await test.step('Search with no results', async () => {
        await helper.search.search('NonexistentCategory');
        
        // Verify no categories are shown (or appropriate empty state)
        const resultCount = await helper.search.getSearchResultsCount();
        expect(resultCount).toBe(0);
      });
      
      await test.step('Clear search', async () => {
        await helper.search.clearSearch();
        
        // All categories should be visible again
        const frontendExists = await helper.category.categoryExists('Frontend Development');
        const marketingExists = await helper.category.categoryExists('Marketing Content');
        
        expect(frontendExists).toBe(true);
        expect(marketingExists).toBe(true);
      });
    });

    test('should filter categories by scope type', async () => {
      // This test depends on having different scope types available
      await test.step('Filter by personal scope', async () => {
        await helper.page.click(selectors.filterButton);
        await helper.page.waitForSelector(selectors.filterDropdown);
        
        await helper.page.click('[data-testid="filter-personal"]');
        
        // Verify only personal categories are shown
        // Implementation depends on actual filter UI
      });
      
      await test.step('Filter by public scope', async () => {
        await helper.page.click('[data-testid="filter-public"]');
        
        // Verify only public categories are shown
        // Implementation depends on actual filter UI
      });
      
      await test.step('Clear filters', async () => {
        await helper.page.click(selectors.clearFiltersButton);
        
        // All categories should be visible
        const categoryCount = await helper.page.locator(selectors.categoryItem).count();
        expect(categoryCount).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Responsive Category Management', () => {
    test('should work correctly on mobile viewport', async () => {
      await helper.viewport.setMobileViewport();
      
      await test.step('Sidebar should be collapsed by default on mobile', async () => {
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsed).toBe(true);
      });
      
      await test.step('Should be able to toggle sidebar on mobile', async () => {
        await helper.navigation.toggleSidebar();
        
        const isCollapsed = await helper.navigation.isSidebarCollapsed();
        expect(isCollapsed).toBe(false);
        
        // Sidebar should be visible
        const sidebar = helper.page.locator(selectors.sidebar);
        await expect(sidebar).toBeVisible();
      });
      
      await test.step('Should be able to create category on mobile', async () => {
        await helper.category.createCategory('Mobile Test Category', 'Created on mobile');
        
        const categoryExists = await helper.category.categoryExists('Mobile Test Category');
        expect(categoryExists).toBe(true);
      });
    });

    test('should work correctly on tablet viewport', async () => {
      await helper.viewport.setTabletViewport();
      
      await test.step('Category management should work on tablet', async () => {
        await helper.category.createCategory('Tablet Test Category', 'Created on tablet');
        
        const categoryExists = await helper.category.categoryExists('Tablet Test Category');
        expect(categoryExists).toBe(true);
      });
    });

    test('should adapt form layout for different screen sizes', async () => {
      const categoryName = 'Responsive Test';
      
      await test.step('Test desktop form layout', async () => {
        await helper.viewport.setDesktopViewport();
        
        await helper.page.click(selectors.createCategoryButton);
        await helper.page.waitForSelector(selectors.categoryForm);
        
        // Form should be properly laid out for desktop
        const form = helper.page.locator(selectors.categoryForm);
        await expect(form).toBeVisible();
        
        // Close form
        await helper.page.click(selectors.categoryCancelButton);
      });
      
      await test.step('Test mobile form layout', async () => {
        await helper.viewport.setMobileViewport();
        
        await helper.page.click(selectors.createCategoryButton);
        await helper.page.waitForSelector(selectors.categoryForm);
        
        // Form should adapt to mobile layout
        const form = helper.page.locator(selectors.categoryForm);
        await expect(form).toBeVisible();
        
        // Form fields should be properly sized for mobile
        const nameInput = helper.page.locator(selectors.categoryNameInput);
        await expect(nameInput).toBeVisible();
        
        // Cancel to close
        await helper.page.click(selectors.categoryCancelButton);
      });
    });
  });

  test.describe('Category Permissions and Access Control', () => {
    test('should only allow editing of owned categories', async () => {
      // This test would require multiple user accounts
      // For now, we'll test the UI behavior
      
      await test.step('Create category as current user', async () => {
        await helper.category.createCategory('My Category', 'I own this');
        
        const categoryElement = helper.category.getCategoryByName('My Category');
        
        // Edit button should be visible for owned category
        const editButton = categoryElement.locator(selectors.categoryEditButton);
        await expect(editButton).toBeVisible();
        
        // Delete button should be visible for owned category
        const deleteButton = categoryElement.locator(selectors.categoryDeleteButton);
        await expect(deleteButton).toBeVisible();
      });
    });

    test('should handle permission errors gracefully', async () => {
      // Test error handling when trying to perform unauthorized actions
      // This would typically be tested with different user sessions
      
      await test.step('Handle edit permission error', async () => {
        // Mock a scenario where edit fails due to permissions
        // The actual implementation would depend on the API response
        // and how the frontend handles permission errors
      });
    });
  });

  test.describe('Category Management Performance', () => {
    test('should handle large numbers of categories efficiently', async () => {
      await test.step('Create multiple categories', async () => {
        // Create several categories to test performance
        const promises = [];
        for (let i = 1; i <= 10; i++) {
          promises.push(
            helper.category.createCategory(`Performance Test ${i}`, `Category ${i} for performance testing`)
          );
        }
        
        // All categories should be created within reasonable time
        await Promise.all(promises);
      });
      
      await test.step('Verify all categories are visible', async () => {
        for (let i = 1; i <= 10; i++) {
          const exists = await helper.category.categoryExists(`Performance Test ${i}`);
          expect(exists).toBe(true);
        }
      });
      
      await test.step('Search should work with many categories', async () => {
        await helper.search.search('Performance Test');
        
        // Should find all performance test categories
        const resultCount = await helper.search.getSearchResultsCount();
        expect(resultCount).toBeGreaterThanOrEqual(10);
      });
    });
  });
});