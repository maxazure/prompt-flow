/**
 * Prompt Management E2E Tests
 * 
 * Tests for prompt management functionality with category integration including:
 * - Creating prompts with category assignment
 * - Editing prompts and updating categories
 * - Viewing prompt details with category info
 * - Filtering prompts by category
 * - Template creation and management
 * - Prompt versioning and history
 * - Public/private prompt settings
 */

import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers/testHelpers';
import { testPrompts, testCategories, selectors, timeouts, navigationPaths, pageTitles } from './fixtures/testData';

test.describe('Prompt Management', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.setup();
    await helper.auth.login('regular');
    
    // Set up test categories for prompt assignment
    await helper.navigation.navigateTo('/dashboard');
    await helper.ui.waitForLoading();
    
    // Create test categories
    for (const category of testCategories.slice(0, 3)) {
      await helper.category.createCategory(category.name, category.description, category.color);
    }
  });

  test.afterEach(async () => {
    await helper.teardown();
  });

  test.describe('Prompt Creation', () => {
    test('should create a new prompt with category assignment', async ({ page }) => {
      const promptData = testPrompts[0];
      const categoryName = testCategories[0].name;
      
      await test.step('Navigate to create prompt page', async () => {
        await helper.navigation.navigateTo('/create');
        await expect(page).toHaveTitle(new RegExp(pageTitles.createPrompt));
      });
      
      await test.step('Fill prompt form with category', async () => {
        await page.fill(selectors.promptTitleInput, promptData.title);
        await page.fill(selectors.promptContentInput, promptData.content);
        
        if (promptData.description) {
          await page.fill(selectors.promptDescriptionInput, promptData.description);
        }
        
        // Select category
        await page.selectOption(selectors.promptCategorySelect, { label: categoryName });
        
        // Add tags if specified
        if (promptData.tags && promptData.tags.length > 0) {
          await page.fill(selectors.promptTagsInput, promptData.tags.join(', '));
        }
        
        // Set template/public flags
        if (promptData.isTemplate) {
          await page.check('[data-testid="prompt-is-template-checkbox"]');
        }
        
        if (promptData.isPublic) {
          await page.check('[data-testid="prompt-is-public-checkbox"]');
        }
      });
      
      await test.step('Submit and verify creation', async () => {
        await page.click(selectors.promptSubmitButton);
        
        // Should redirect to prompt detail or dashboard
        await page.waitForURL('**/prompt/**', { timeout: timeouts.medium });
        
        // Verify prompt was created with correct category
        await expect(page.locator('[data-testid="prompt-category-info"]')).toContainText(categoryName);
        await expect(page.locator(selectors.promptTitle)).toContainText(promptData.title);
        await expect(page.locator(selectors.promptContent)).toContainText(promptData.content);
      });
    });

    test('should create a prompt without category (uncategorized)', async ({ page }) => {
      const promptData = testPrompts[1];
      
      await helper.navigation.navigateTo('/create');
      
      // Fill basic prompt data without selecting category
      await page.fill(selectors.promptTitleInput, promptData.title);
      await page.fill(selectors.promptContentInput, promptData.content);
      
      await page.click(selectors.promptSubmitButton);
      
      // Verify creation
      await page.waitForURL('**/prompt/**', { timeout: timeouts.medium });
      
      // Should show as uncategorized or no category
      const categoryInfo = page.locator('[data-testid="prompt-category-info"]');
      const categoryText = await categoryInfo.textContent();
      expect(categoryText?.toLowerCase()).toMatch(/uncategorized|no category/);
    });

    test('should validate required fields before creation', async ({ page }) => {
      await helper.navigation.navigateTo('/create');
      
      await test.step('Try to submit empty form', async () => {
        await page.click(selectors.promptSubmitButton);
        
        const hasError = await helper.ui.hasErrorMessage();
        expect(hasError).toBe(true);
        
        const errorMessage = await helper.ui.getErrorMessage();
        expect(errorMessage.toLowerCase()).toMatch(/title.*required|content.*required/);
      });
      
      await test.step('Submit with only title', async () => {
        await page.fill(selectors.promptTitleInput, 'Test Title');
        await page.click(selectors.promptSubmitButton);
        
        const hasError = await helper.ui.hasErrorMessage();
        expect(hasError).toBe(true);
        
        const errorMessage = await helper.ui.getErrorMessage();
        expect(errorMessage.toLowerCase()).toContain('content');
      });
    });

    test('should create template prompt with proper indicators', async ({ page }) => {
      const templateData = testPrompts.find(p => p.isTemplate);
      expect(templateData).toBeDefined();
      
      await helper.navigation.navigateTo('/create');
      
      await page.fill(selectors.promptTitleInput, templateData!.title);
      await page.fill(selectors.promptContentInput, templateData!.content);
      
      // Mark as template
      await page.check('[data-testid="prompt-is-template-checkbox"]');
      
      await page.click(selectors.promptSubmitButton);
      
      // Verify template indicators
      await page.waitForURL('**/prompt/**', { timeout: timeouts.medium });
      
      const templateIndicator = page.locator('[data-testid="template-indicator"]');
      await expect(templateIndicator).toBeVisible();
      await expect(templateIndicator).toContainText('Template');
    });
  });

  test.describe('Prompt Editing', () => {
    test.beforeEach(async () => {
      // Create a test prompt to edit
      await helper.navigation.navigateTo('/create');
      await helper.prompt.createPrompt(
        'Edit Test Prompt',
        'Original content for editing',
        'Original description',
        testCategories[0].name,
        ['edit', 'test']
      );
    });

    test('should edit prompt title and content', async ({ page }) => {
      const newTitle = 'Updated Prompt Title';
      const newContent = 'Updated prompt content with new instructions';
      
      await test.step('Navigate to edit page', async () => {
        // Assuming we're on the prompt detail page after creation
        await page.click('[data-testid="edit-prompt-button"]');
        await page.waitForSelector(selectors.promptForm);
      });
      
      await test.step('Update prompt data', async () => {
        await page.fill(selectors.promptTitleInput, newTitle);
        await page.fill(selectors.promptContentInput, newContent);
        
        await page.click(selectors.promptSubmitButton);
      });
      
      await test.step('Verify updates', async () => {
        // Should redirect back to prompt detail
        await expect(page.locator(selectors.promptTitle)).toContainText(newTitle);
        await expect(page.locator(selectors.promptContent)).toContainText(newContent);
      });
    });

    test('should change prompt category', async ({ page }) => {
      const newCategoryName = testCategories[1].name;
      
      await test.step('Edit prompt category', async () => {
        await page.click('[data-testid="edit-prompt-button"]');
        await page.waitForSelector(selectors.promptForm);
        
        // Change category
        await page.selectOption(selectors.promptCategorySelect, { label: newCategoryName });
        
        await page.click(selectors.promptSubmitButton);
      });
      
      await test.step('Verify category change', async () => {
        const categoryInfo = page.locator('[data-testid="prompt-category-info"]');
        await expect(categoryInfo).toContainText(newCategoryName);
      });
    });

    test('should update prompt tags', async ({ page }) => {
      const newTags = ['updated', 'modified', 'test'];
      
      await page.click('[data-testid="edit-prompt-button"]');
      await page.waitForSelector(selectors.promptForm);
      
      // Update tags
      await page.fill(selectors.promptTagsInput, newTags.join(', '));
      await page.click(selectors.promptSubmitButton);
      
      // Verify tags are updated
      for (const tag of newTags) {
        await expect(page.locator(`[data-testid="prompt-tag"][data-tag="${tag}"]`)).toBeVisible();
      }
    });

    test('should toggle prompt visibility (public/private)', async ({ page }) => {
      await test.step('Make prompt public', async () => {
        await page.click('[data-testid="edit-prompt-button"]');
        await page.waitForSelector(selectors.promptForm);
        
        await page.check('[data-testid="prompt-is-public-checkbox"]');
        await page.click(selectors.promptSubmitButton);
        
        // Verify public indicator
        const publicIndicator = page.locator('[data-testid="public-indicator"]');
        await expect(publicIndicator).toBeVisible();
      });
      
      await test.step('Make prompt private again', async () => {
        await page.click('[data-testid="edit-prompt-button"]');
        await page.waitForSelector(selectors.promptForm);
        
        await page.uncheck('[data-testid="prompt-is-public-checkbox"]');
        await page.click(selectors.promptSubmitButton);
        
        // Public indicator should be hidden
        const publicIndicator = page.locator('[data-testid="public-indicator"]');
        await expect(publicIndicator).not.toBeVisible();
      });
    });
  });

  test.describe('Prompt Detail View', () => {
    test.beforeEach(async () => {
      // Create test prompt with full details
      await helper.navigation.navigateTo('/create');
      await helper.prompt.createPrompt(
        'Detail View Test',
        'Detailed prompt content with {variables} and instructions',
        'Comprehensive test prompt',
        testCategories[0].name,
        ['detail', 'view', 'test']
      );
    });

    test('should display all prompt information correctly', async ({ page }) => {
      await test.step('Verify basic information', async () => {
        await expect(page.locator(selectors.promptTitle)).toContainText('Detail View Test');
        await expect(page.locator(selectors.promptContent)).toContainText('Detailed prompt content');
        await expect(page.locator('[data-testid="prompt-description"]')).toContainText('Comprehensive test prompt');
      });
      
      await test.step('Verify category information', async () => {
        const categoryInfo = page.locator('[data-testid="prompt-category-info"]');
        await expect(categoryInfo).toContainText(testCategories[0].name);
        
        // Should show category color
        const categoryColor = page.locator('[data-testid="category-color-indicator"]');
        await expect(categoryColor).toBeVisible();
      });
      
      await test.step('Verify tags display', async () => {
        const tags = ['detail', 'view', 'test'];
        for (const tag of tags) {
          await expect(page.locator(`[data-testid="prompt-tag"][data-tag="${tag}"]`)).toBeVisible();
        }
      });
      
      await test.step('Verify metadata', async () => {
        // Should show creation date, author, version, etc.
        await expect(page.locator('[data-testid="prompt-metadata"]')).toBeVisible();
        await expect(page.locator('[data-testid="prompt-version"]')).toContainText('v1');
        await expect(page.locator('[data-testid="prompt-author"]')).toContainText('e2e_user');
      });
    });

    test('should provide action buttons for prompt management', async ({ page }) => {
      await test.step('Verify edit button', async () => {
        const editButton = page.locator('[data-testid="edit-prompt-button"]');
        await expect(editButton).toBeVisible();
        await expect(editButton).toBeEnabled();
      });
      
      await test.step('Verify copy/duplicate button', async () => {
        const copyButton = page.locator('[data-testid="copy-prompt-button"]');
        await expect(copyButton).toBeVisible();
      });
      
      await test.step('Verify share button for public prompts', async () => {
        // Make prompt public first
        await page.click('[data-testid="edit-prompt-button"]');
        await page.check('[data-testid="prompt-is-public-checkbox"]');
        await page.click(selectors.promptSubmitButton);
        
        const shareButton = page.locator('[data-testid="share-prompt-button"]');
        await expect(shareButton).toBeVisible();
      });
    });

    test('should allow copying prompt content', async ({ page }) => {
      const copyButton = page.locator('[data-testid="copy-prompt-button"]');
      await copyButton.click();
      
      // Verify success message
      const successMessage = await helper.ui.waitForSuccessMessage();
      expect(successMessage.toLowerCase()).toContain('copied');
    });
  });

  test.describe('Prompt Filtering by Category', () => {
    test.beforeEach(async () => {
      // Create prompts in different categories
      const prompts = [
        { title: 'Development Prompt', category: testCategories[0].name },
        { title: 'Marketing Prompt', category: testCategories[1].name },
        { title: 'Analytics Prompt', category: testCategories[2].name },
        { title: 'Uncategorized Prompt', category: null }
      ];
      
      for (const prompt of prompts) {
        await helper.navigation.navigateTo('/create');
        await helper.prompt.createPrompt(
          prompt.title,
          `Content for ${prompt.title}`,
          undefined,
          prompt.category || undefined
        );
      }
    });

    test('should filter prompts by selected category', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Filter by first category', async () => {
        await helper.navigation.selectCategory(testCategories[0].name);
        
        // Should show only prompts from selected category
        const developmentPrompt = await helper.prompt.promptExists('Development Prompt');
        expect(developmentPrompt).toBe(true);
        
        const marketingPrompt = await helper.prompt.promptExists('Marketing Prompt');
        expect(marketingPrompt).toBe(false);
      });
      
      await test.step('Filter by second category', async () => {
        await helper.navigation.selectCategory(testCategories[1].name);
        
        const marketingPrompt = await helper.prompt.promptExists('Marketing Prompt');
        expect(marketingPrompt).toBe(true);
        
        const developmentPrompt = await helper.prompt.promptExists('Development Prompt');
        expect(developmentPrompt).toBe(false);
      });
      
      await test.step('Show all prompts', async () => {
        await helper.navigation.selectCategory('all');
        
        // All prompts should be visible
        const developmentPrompt = await helper.prompt.promptExists('Development Prompt');
        const marketingPrompt = await helper.prompt.promptExists('Marketing Prompt');
        const analyticsPrompt = await helper.prompt.promptExists('Analytics Prompt');
        
        expect(developmentPrompt).toBe(true);
        expect(marketingPrompt).toBe(true);
        expect(analyticsPrompt).toBe(true);
      });
    });

    test('should show uncategorized prompts separately', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      // Filter by uncategorized
      await helper.navigation.selectCategory('uncategorized');
      
      const uncategorizedPrompt = await helper.prompt.promptExists('Uncategorized Prompt');
      expect(uncategorizedPrompt).toBe(true);
      
      const categorizedPrompt = await helper.prompt.promptExists('Development Prompt');
      expect(categorizedPrompt).toBe(false);
    });
  });

  test.describe('Template Management', () => {
    test('should create and manage prompt templates', async ({ page }) => {
      const templateData = {
        title: 'Email Template',
        content: 'Subject: {subject}\n\nDear {recipient_name},\n\n{email_body}\n\nBest regards,\n{sender_name}',
        description: 'Standard email template with variables'
      };
      
      await test.step('Create template', async () => {
        await helper.navigation.navigateTo('/create');
        
        await page.fill(selectors.promptTitleInput, templateData.title);
        await page.fill(selectors.promptContentInput, templateData.content);
        await page.fill(selectors.promptDescriptionInput, templateData.description);
        
        // Mark as template
        await page.check('[data-testid="prompt-is-template-checkbox"]');
        
        await page.click(selectors.promptSubmitButton);
      });
      
      await test.step('Verify template creation', async () => {
        await expect(page.locator('[data-testid="template-indicator"]')).toBeVisible();
        await expect(page.locator(selectors.promptTitle)).toContainText(templateData.title);
      });
      
      await test.step('Template should appear in templates section', async () => {
        await helper.navigation.navigateTo('/templates');
        
        const templateExists = await helper.prompt.promptExists(templateData.title);
        expect(templateExists).toBe(true);
      });
    });

    test('should allow using template to create new prompt', async ({ page }) => {
      // First create a template
      await helper.navigation.navigateTo('/create');
      await helper.prompt.createPrompt(
        'Base Template',
        'Template content with {variable}',
        'Base template for testing',
        testCategories[0].name
      );
      
      // Mark as template
      await page.click('[data-testid="edit-prompt-button"]');
      await page.check('[data-testid="prompt-is-template-checkbox"]');
      await page.click(selectors.promptSubmitButton);
      
      await test.step('Use template to create new prompt', async () => {
        await page.click('[data-testid="use-template-button"]');
        
        // Should open create form with template content pre-filled
        await expect(page.locator(selectors.promptContentInput)).toHaveValue('Template content with {variable}');
        
        // Modify and save as new prompt
        await page.fill(selectors.promptTitleInput, 'New Prompt from Template');
        await page.fill(selectors.promptContentInput, 'Modified template content');
        
        await page.click(selectors.promptSubmitButton);
        
        // Should create new prompt (not modify template)
        await expect(page.locator(selectors.promptTitle)).toContainText('New Prompt from Template');
      });
    });
  });

  test.describe('Prompt Search and Discovery', () => {
    test.beforeEach(async () => {
      // Create diverse prompts for search testing
      const searchTestPrompts = [
        { title: 'JavaScript Code Review', content: 'Review JavaScript code for best practices', tags: ['javascript', 'code-review'] },
        { title: 'Python Data Analysis', content: 'Analyze Python data processing scripts', tags: ['python', 'data-analysis'] },
        { title: 'Marketing Email Copy', content: 'Create compelling marketing emails', tags: ['marketing', 'email'] },
        { title: 'SQL Query Optimization', content: 'Optimize database queries for performance', tags: ['sql', 'database', 'optimization'] }
      ];
      
      for (const prompt of searchTestPrompts) {
        await helper.navigation.navigateTo('/create');
        await helper.prompt.createPrompt(prompt.title, prompt.content, undefined, undefined, prompt.tags);
      }
    });

    test('should search prompts by title and content', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      await test.step('Search by title', async () => {
        await helper.search.search('JavaScript');
        
        const jsPrompt = await helper.prompt.promptExists('JavaScript Code Review');
        expect(jsPrompt).toBe(true);
        
        const pythonPrompt = await helper.prompt.promptExists('Python Data Analysis');
        expect(pythonPrompt).toBe(false);
      });
      
      await test.step('Search by content', async () => {
        await helper.search.search('database');
        
        const sqlPrompt = await helper.prompt.promptExists('SQL Query Optimization');
        expect(sqlPrompt).toBe(true);
      });
      
      await test.step('Search by tags', async () => {
        await helper.search.search('marketing');
        
        const marketingPrompt = await helper.prompt.promptExists('Marketing Email Copy');
        expect(marketingPrompt).toBe(true);
      });
    });

    test('should handle empty search results', async ({ page }) => {
      await helper.navigation.navigateTo('/dashboard');
      
      await helper.search.search('nonexistentprompt');
      
      const resultCount = await helper.search.getSearchResultsCount();
      expect(resultCount).toBe(0);
      
      // Should show empty state message
      const emptyState = page.locator('[data-testid="empty-search-results"]');
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText('No prompts found');
    });
  });

  test.describe('Prompt Version Management', () => {
    test('should create new version when editing prompt', async ({ page }) => {
      // Create initial prompt
      await helper.navigation.navigateTo('/create');
      await helper.prompt.createPrompt(
        'Version Test Prompt',
        'Original version content',
        'Original description'
      );
      
      await test.step('Edit prompt to create new version', async () => {
        await page.click('[data-testid="edit-prompt-button"]');
        await page.fill(selectors.promptContentInput, 'Updated version content');
        await page.fill('[data-testid="version-changelog-input"]', 'Updated content for clarity');
        await page.click(selectors.promptSubmitButton);
      });
      
      await test.step('Verify version increment', async () => {
        await expect(page.locator('[data-testid="prompt-version"]')).toContainText('v2');
        await expect(page.locator(selectors.promptContent)).toContainText('Updated version content');
      });
      
      await test.step('View version history', async () => {
        await page.click('[data-testid="version-history-button"]');
        
        // Should show both versions
        await expect(page.locator('[data-testid="version-1"]')).toBeVisible();
        await expect(page.locator('[data-testid="version-2"]')).toBeVisible();
        
        // Should show changelog
        await expect(page.locator('[data-testid="version-2-changelog"]')).toContainText('Updated content for clarity');
      });
    });

    test('should allow reverting to previous version', async ({ page }) => {
      // Create and update prompt (from previous test setup)
      await helper.navigation.navigateTo('/create');
      await helper.prompt.createPrompt('Revert Test', 'Original content');
      
      // Create version 2
      await page.click('[data-testid="edit-prompt-button"]');
      await page.fill(selectors.promptContentInput, 'Modified content');
      await page.click(selectors.promptSubmitButton);
      
      await test.step('Revert to version 1', async () => {
        await page.click('[data-testid="version-history-button"]');
        await page.click('[data-testid="revert-to-version-1"]');
        
        // Confirm revert
        await page.click('[data-testid="confirm-revert-button"]');
      });
      
      await test.step('Verify revert', async () => {
        await expect(page.locator('[data-testid="prompt-version"]')).toContainText('v3');
        await expect(page.locator(selectors.promptContent)).toContainText('Original content');
      });
    });
  });

  test.describe('Prompt Permissions and Sharing', () => {
    test('should handle public prompt sharing', async ({ page }) => {
      await helper.navigation.navigateTo('/create');
      await helper.prompt.createPrompt(
        'Public Share Test',
        'Content to be shared publicly',
        'Test prompt for sharing'
      );
      
      await test.step('Make prompt public', async () => {
        await page.click('[data-testid="edit-prompt-button"]');
        await page.check('[data-testid="prompt-is-public-checkbox"]');
        await page.click(selectors.promptSubmitButton);
        
        // Verify public indicator
        await expect(page.locator('[data-testid="public-indicator"]')).toBeVisible();
      });
      
      await test.step('Get shareable link', async () => {
        await page.click('[data-testid="share-prompt-button"]');
        
        const shareDialog = page.locator('[data-testid="share-dialog"]');
        await expect(shareDialog).toBeVisible();
        
        const shareLink = page.locator('[data-testid="share-link-input"]');
        await expect(shareLink).toHaveValue(/.+/); // Should have some URL
        
        // Copy link button should work
        await page.click('[data-testid="copy-share-link-button"]');
        const successMessage = await helper.ui.waitForSuccessMessage();
        expect(successMessage.toLowerCase()).toContain('copied');
      });
    });

    test('should restrict access to private prompts', async ({ page }) => {
      // Test would require multiple user sessions to properly verify
      // For now, verify UI state for private prompts
      
      await helper.navigation.navigateTo('/create');
      await helper.prompt.createPrompt(
        'Private Test Prompt',
        'Private content',
        'This should remain private'
      );
      
      // Verify private state
      const shareButton = page.locator('[data-testid="share-prompt-button"]');
      await expect(shareButton).not.toBeVisible();
      
      const publicIndicator = page.locator('[data-testid="public-indicator"]');
      await expect(publicIndicator).not.toBeVisible();
    });
  });

  test.describe('Responsive Prompt Management', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      await helper.viewport.setMobileViewport();
      
      await test.step('Create prompt on mobile', async () => {
        await helper.navigation.navigateTo('/create');
        
        // Form should be properly laid out for mobile
        const form = page.locator(selectors.promptForm);
        await expect(form).toBeVisible();
        
        // Create prompt
        await helper.prompt.createPrompt(
          'Mobile Test Prompt',
          'Created on mobile device',
          'Mobile testing'
        );
        
        // Should successfully create and navigate to detail
        await expect(page.locator(selectors.promptTitle)).toContainText('Mobile Test Prompt');
      });
      
      await test.step('View prompt details on mobile', async () => {
        // Content should be properly formatted for mobile
        const content = page.locator(selectors.promptContent);
        await expect(content).toBeVisible();
        
        // Action buttons should be accessible
        const editButton = page.locator('[data-testid="edit-prompt-button"]');
        await expect(editButton).toBeVisible();
      });
    });

    test('should adapt form layout for different screen sizes', async ({ page }) => {
      const promptTitle = 'Responsive Test Prompt';
      
      await test.step('Desktop form layout', async () => {
        await helper.viewport.setDesktopViewport();
        await helper.navigation.navigateTo('/create');
        
        const form = page.locator(selectors.promptForm);
        await expect(form).toBeVisible();
        
        // Fields should be properly spaced for desktop
        const titleInput = page.locator(selectors.promptTitleInput);
        const contentInput = page.locator(selectors.promptContentInput);
        
        await expect(titleInput).toBeVisible();
        await expect(contentInput).toBeVisible();
      });
      
      await test.step('Mobile form layout', async () => {
        await helper.viewport.setMobileViewport();
        
        // Form should adapt to mobile constraints
        const form = page.locator(selectors.promptForm);
        await expect(form).toBeVisible();
        
        // Inputs should be full width on mobile
        const titleInput = page.locator(selectors.promptTitleInput);
        const contentInput = page.locator(selectors.promptContentInput);
        
        await expect(titleInput).toBeVisible();
        await expect(contentInput).toBeVisible();
      });
    });
  });
});