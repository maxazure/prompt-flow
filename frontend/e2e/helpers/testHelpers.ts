/**
 * Common test helper functions for e2e tests
 */

import { Page, expect, Locator } from '@playwright/test';
import { testUsers, selectors, timeouts, apiEndpoints } from '../fixtures/testData';

/**
 * Authentication helpers
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login with test user credentials
   */
  async login(userType: 'admin' | 'regular' = 'regular') {
    const user = testUsers[userType];
    
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    
    // Fill login form
    await this.page.fill(selectors.emailInput, user.email);
    await this.page.fill(selectors.passwordInput, user.password);
    
    // Submit form and wait for redirect
    await Promise.all([
      this.page.waitForURL('/dashboard', { timeout: timeouts.medium }),
      this.page.click(selectors.loginButton)
    ]);
    
    // Verify successful login
    await expect(this.page).toHaveURL('/dashboard');
    await this.page.waitForSelector(selectors.logoutButton, { timeout: timeouts.short });
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.page.click(selectors.logoutButton);
    await this.page.waitForURL('/login', { timeout: timeouts.medium });
    await expect(this.page).toHaveURL('/login');
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector(selectors.logoutButton, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Category management helpers
 */
export class CategoryHelper {
  constructor(private page: Page) {}

  /**
   * Create a new category
   */
  async createCategory(name: string, description?: string, color?: string) {
    await this.page.click(selectors.createCategoryButton);
    await this.page.waitForSelector(selectors.categoryForm, { timeout: timeouts.short });
    
    // Fill form
    await this.page.fill(selectors.categoryNameInput, name);
    if (description) {
      await this.page.fill(selectors.categoryDescriptionInput, description);
    }
    if (color) {
      await this.page.click(selectors.categoryColorPicker);
      await this.page.click(`[data-color="${color}"]`);
    }
    
    // Submit form
    await this.page.click(selectors.categorySubmitButton);
    
    // Wait for category to appear in list
    await this.page.waitForSelector(`[data-testid="category-item"][data-name="${name}"]`, {
      timeout: timeouts.medium
    });
  }

  /**
   * Edit an existing category
   */
  async editCategory(currentName: string, newName: string, newDescription?: string) {
    const categoryItem = this.page.locator(`[data-testid="category-item"][data-name="${currentName}"]`);
    await categoryItem.locator(selectors.categoryEditButton).click();
    
    await this.page.waitForSelector(selectors.categoryForm, { timeout: timeouts.short });
    
    // Update form
    await this.page.fill(selectors.categoryNameInput, newName);
    if (newDescription) {
      await this.page.fill(selectors.categoryDescriptionInput, newDescription);
    }
    
    // Submit changes
    await this.page.click(selectors.categorySubmitButton);
    
    // Wait for updated category to appear
    await this.page.waitForSelector(`[data-testid="category-item"][data-name="${newName}"]`, {
      timeout: timeouts.medium
    });
  }

  /**
   * Delete a category
   */
  async deleteCategory(name: string) {
    const categoryItem = this.page.locator(`[data-testid="category-item"][data-name="${name}"]`);
    await categoryItem.locator(selectors.categoryDeleteButton).click();
    
    // Confirm deletion
    await this.page.waitForSelector(selectors.confirmDialog, { timeout: timeouts.short });
    await this.page.click(selectors.confirmYesButton);
    
    // Wait for category to disappear
    await expect(categoryItem).not.toBeVisible({ timeout: timeouts.medium });
  }

  /**
   * Get category by name
   */
  getCategoryByName(name: string): Locator {
    return this.page.locator(`[data-testid="category-item"][data-name="${name}"]`);
  }

  /**
   * Check if category exists
   */
  async categoryExists(name: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(`[data-testid="category-item"][data-name="${name}"]`, {
        timeout: 2000
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Prompt management helpers
 */
export class PromptHelper {
  constructor(private page: Page) {}

  /**
   * Create a new prompt
   */
  async createPrompt(
    title: string,
    content: string,
    description?: string,
    category?: string,
    tags?: string[]
  ) {
    await this.page.click(selectors.createPromptButton);
    await this.page.waitForSelector(selectors.promptForm, { timeout: timeouts.short });
    
    // Fill form
    await this.page.fill(selectors.promptTitleInput, title);
    await this.page.fill(selectors.promptContentInput, content);
    
    if (description) {
      await this.page.fill(selectors.promptDescriptionInput, description);
    }
    
    if (category) {
      await this.page.selectOption(selectors.promptCategorySelect, category);
    }
    
    if (tags && tags.length > 0) {
      await this.page.fill(selectors.promptTagsInput, tags.join(', '));
    }
    
    // Submit form
    await this.page.click(selectors.promptSubmitButton);
    
    // Wait for prompt to appear in list
    await this.page.waitForSelector(`[data-testid="prompt-item"][data-title="${title}"]`, {
      timeout: timeouts.medium
    });
  }

  /**
   * Get prompt by title
   */
  getPromptByTitle(title: string): Locator {
    return this.page.locator(`[data-testid="prompt-item"][data-title="${title}"]`);
  }

  /**
   * Check if prompt exists
   */
  async promptExists(title: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(`[data-testid="prompt-item"][data-title="${title}"]`, {
        timeout: 2000
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Open prompt detail page
   */
  async openPromptDetail(title: string) {
    const promptItem = this.getPromptByTitle(title);
    await promptItem.click();
    
    // Wait for detail page to load
    await this.page.waitForSelector(selectors.promptContent, { timeout: timeouts.medium });
  }
}

/**
 * Navigation helpers
 */
export class NavigationHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to specific page and wait for load
   */
  async navigateTo(path: string, waitForSelector?: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
    
    if (waitForSelector) {
      await this.page.waitForSelector(waitForSelector, { timeout: timeouts.medium });
    }
  }

  /**
   * Toggle sidebar
   */
  async toggleSidebar() {
    await this.page.click(selectors.sidebarToggle);
    
    // Wait for animation to complete
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if sidebar is collapsed
   */
  async isSidebarCollapsed(): Promise<boolean> {
    const sidebar = this.page.locator(selectors.sidebar);
    const classList = await sidebar.getAttribute('class');
    return classList?.includes('collapsed') || classList?.includes('hidden') || false;
  }

  /**
   * Select category from sidebar
   */
  async selectCategory(categoryName: string) {
    const categoryItem = this.page.locator(`[data-testid="category-item"][data-name="${categoryName}"]`);
    await categoryItem.click();
    
    // Wait for category selection to take effect
    await this.page.waitForURL(`**/category/**`, { timeout: timeouts.medium });
  }
}

/**
 * Search and filter helpers
 */
export class SearchHelper {
  constructor(private page: Page) {}

  /**
   * Perform search
   */
  async search(term: string) {
    await this.page.fill(selectors.searchInput, term);
    await this.page.press(selectors.searchInput, 'Enter');
    
    // Wait for search results to load
    await this.page.waitForTimeout(500);
  }

  /**
   * Clear search
   */
  async clearSearch() {
    await this.page.fill(selectors.searchInput, '');
    await this.page.press(selectors.searchInput, 'Enter');
    
    // Wait for results to reset
    await this.page.waitForTimeout(500);
  }

  /**
   * Get search results count
   */
  async getSearchResultsCount(): Promise<number> {
    const results = await this.page.locator(selectors.promptItem).count();
    return results;
  }
}

/**
 * UI state helpers
 */
export class UIHelper {
  constructor(private page: Page) {}

  /**
   * Wait for loading to complete
   */
  async waitForLoading() {
    try {
      await this.page.waitForSelector(selectors.loadingSpinner, { timeout: 1000 });
      await this.page.waitForSelector(selectors.loadingSpinner, { 
        state: 'hidden', 
        timeout: timeouts.long 
      });
    } catch {
      // Loading spinner might not appear for fast operations
    }
  }

  /**
   * Check for error messages
   */
  async hasErrorMessage(): Promise<boolean> {
    try {
      await this.page.waitForSelector(selectors.errorMessage, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    const errorElement = this.page.locator(selectors.errorMessage);
    return await errorElement.textContent() || '';
  }

  /**
   * Wait for success message
   */
  async waitForSuccessMessage(): Promise<string> {
    await this.page.waitForSelector(selectors.successMessage, { timeout: timeouts.medium });
    const successElement = this.page.locator(selectors.successMessage);
    return await successElement.textContent() || '';
  }

  /**
   * Dismiss modal or dialog
   */
  async dismissModal() {
    try {
      await this.page.press('body', 'Escape');
      await this.page.waitForTimeout(300);
    } catch {
      // Modal might not be present
    }
  }
}

/**
 * Viewport helpers
 */
export class ViewportHelper {
  constructor(private page: Page) {}

  /**
   * Set viewport size
   */
  async setViewport(width: number, height: number) {
    await this.page.setViewportSize({ width, height });
    await this.page.waitForTimeout(300); // Wait for responsive adjustments
  }

  /**
   * Set mobile viewport
   */
  async setMobileViewport() {
    await this.setViewport(375, 667);
  }

  /**
   * Set tablet viewport
   */
  async setTabletViewport() {
    await this.setViewport(768, 1024);
  }

  /**
   * Set desktop viewport
   */
  async setDesktopViewport() {
    await this.setViewport(1920, 1080);
  }
}

/**
 * Test data cleanup helpers
 */
export class CleanupHelper {
  constructor(private page: Page) {}

  /**
   * Clean up test data after test
   */
  async cleanupTestData() {
    // This would typically call API endpoints to clean up test data
    // For now, we'll just log the cleanup action
    console.log('Cleaning up test data...');
  }

  /**
   * Reset application state
   */
  async resetAppState() {
    // Clear localStorage
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Clear any cookies
    await this.page.context().clearCookies();
  }
}

/**
 * Composite helper class that includes all helpers
 */
export class TestHelper {
  public auth: AuthHelper;
  public category: CategoryHelper;
  public prompt: PromptHelper;
  public navigation: NavigationHelper;
  public search: SearchHelper;
  public ui: UIHelper;
  public viewport: ViewportHelper;
  public cleanup: CleanupHelper;

  constructor(private page: Page) {
    this.auth = new AuthHelper(page);
    this.category = new CategoryHelper(page);
    this.prompt = new PromptHelper(page);
    this.navigation = new NavigationHelper(page);
    this.search = new SearchHelper(page);
    this.ui = new UIHelper(page);
    this.viewport = new ViewportHelper(page);
    this.cleanup = new CleanupHelper(page);
  }

  /**
   * Set up test environment
   */
  async setup() {
    // Set reasonable timeout
    this.page.setDefaultTimeout(timeouts.medium);
    
    // Go to home page
    await this.navigation.navigateTo('/');
  }

  /**
   * Tear down test environment
   */
  async teardown() {
    await this.cleanup.resetAppState();
    await this.cleanup.cleanupTestData();
  }
}