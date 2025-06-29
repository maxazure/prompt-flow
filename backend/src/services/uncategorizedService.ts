import { Category, CategoryScopeType } from '../models/Category';

/**
 * Creates an "Uncategorized" category for a new user
 * This category is private to the user and serves as the default category
 * for prompts that don't have a specific category assigned
 */
export const createUncategorizedCategory = async (userId: number): Promise<Category> => {
  try {
    // Check if the user already has an uncategorized category
    const existingUncategorized = await Category.findOne({
      where: {
        name: '未分类',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: userId,
        createdBy: userId,
        isActive: true
      }
    });

    if (existingUncategorized) {
      return existingUncategorized;
    }

    // Create the uncategorized category
    const uncategorizedCategory = await Category.create({
      name: '未分类',
      description: '默认分类，用于存放未分类的提示词',
      scopeType: CategoryScopeType.PERSONAL,
      scopeId: userId,
      createdBy: userId,
      color: '#6b7280', // Gray color for uncategorized
      isActive: true
    });

    return uncategorizedCategory;
  } catch (error) {
    console.error('Error creating uncategorized category:', error);
    throw new Error('Failed to create uncategorized category');
  }
};

/**
 * Gets the uncategorized category for a specific user
 */
export const getUncategorizedCategory = async (userId: number): Promise<Category | null> => {
  try {
    const uncategorizedCategory = await Category.findOne({
      where: {
        name: '未分类',
        scopeType: CategoryScopeType.PERSONAL,
        scopeId: userId,
        createdBy: userId,
        isActive: true
      }
    });

    return uncategorizedCategory;
  } catch (error) {
    console.error('Error getting uncategorized category:', error);
    return null;
  }
};

/**
 * Ensures that a user has an uncategorized category
 * Creates one if it doesn't exist
 */
export const ensureUncategorizedCategory = async (userId: number): Promise<Category> => {
  let uncategorizedCategory = await getUncategorizedCategory(userId);
  
  if (!uncategorizedCategory) {
    uncategorizedCategory = await createUncategorizedCategory(userId);
  }
  
  return uncategorizedCategory;
};