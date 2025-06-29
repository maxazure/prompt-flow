import { Prompt, User, PromptVersion, Category } from '../models';
import { WhereOptions, Op } from 'sequelize';
import { ensureUncategorizedCategory } from './uncategorizedService';

export interface CreatePromptData {
  title: string;
  content: string;
  description?: string;
  category?: string;
  categoryId?: number;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdatePromptData {
  title?: string;
  content?: string;
  description?: string;
  category?: string;
  categoryId?: number;
  tags?: string[];
  isPublic?: boolean;
}

export interface GetPromptsOptions {
  userId?: number;
  currentUserId?: number;  // Current logged-in user ID for permission logic
  category?: string;
  categoryId?: number;
  isPublic?: boolean;
  includePrompts?: boolean;
  search?: string;
  tags?: string[];  // Filter by specific tags
}

export interface CategoryAggregation {
  categoryName: string;
  categoryId: number | null;
  count: number;
  prompts?: Prompt[];
}

export const createPrompt = async (userId: number, data: CreatePromptData) => {
  // If no categoryId is provided, use the uncategorized category
  let finalCategoryId = data.categoryId;
  if (!finalCategoryId) {
    const uncategorizedCategory = await ensureUncategorizedCategory(userId);
    finalCategoryId = uncategorizedCategory.id;
  }

  const prompt = await Prompt.create({
    ...data,
    categoryId: finalCategoryId,
    userId,
    version: 1,
    isPublic: data.isPublic || false,
  });

  // Create initial version record
  await PromptVersion.create({
    promptId: prompt.id,
    version: 1,
    title: prompt.title,
    content: prompt.content,
    description: prompt.description,
    category: prompt.category,
    tags: prompt.tags,
    userId,
    changeLog: 'Initial version'
  });

  return prompt;
};

export const getPrompts = async (options: GetPromptsOptions = {}) => {
  let whereClause: any = {};

  if (options.userId) {
    // If user is specified, get their prompts (both public and private)
    whereClause.userId = options.userId;
  } else {
    // For main endpoint, only get public prompts regardless of authentication
    whereClause.isPublic = true;
  }

  // Apply additional filters
  const additionalFilters: any = {};
  
  if (options.category) {
    additionalFilters.category = options.category;
  }

  if (options.categoryId) {
    additionalFilters.categoryId = options.categoryId;
  }

  // Add search functionality
  if (options.search && options.search.trim()) {
    const searchTerm = options.search.trim();
    additionalFilters[Op.or] = [
      { title: { [Op.iLike]: `%${searchTerm}%` } },
      { description: { [Op.iLike]: `%${searchTerm}%` } },
      { content: { [Op.iLike]: `%${searchTerm}%` } },
    ];
  }

  // Add tag filtering
  if (options.tags && options.tags.length > 0) {
    // For PostgreSQL compatibility, use a different approach
    const tagConditions = options.tags.map(tag => {
      // Use SQL LIKE to check if the tag exists in the JSON array as a string
      return {
        [Op.or]: [
          { tags: { [Op.like]: `%"${tag.trim()}"%` } },
          { category: tag.trim() } // Also check legacy category field
        ]
      };
    });
    
    if (tagConditions.length === 1) {
      additionalFilters[Op.and] = tagConditions;
    } else {
      additionalFilters[Op.and] = tagConditions;
    }
  }

  // Combine base permission logic with additional filters
  if (Object.keys(additionalFilters).length > 0) {
    if (whereClause[Op.or] || additionalFilters[Op.and]) {
      // If we have OR conditions for permissions or AND conditions for filters, wrap everything in AND
      whereClause = {
        [Op.and]: [
          whereClause,
          additionalFilters
        ]
      };
    } else {
      // Simple case: merge filters
      whereClause = {
        ...whereClause,
        ...additionalFilters
      };
    }
  }

  const prompts = await Prompt.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username'],
      },
    ],
    order: [['updatedAt', 'DESC']],
  });

  return prompts;
};

export const getPromptById = async (id: number, userId?: number) => {
  const prompt = await Prompt.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username'],
      },
    ],
  });

  if (!prompt) {
    throw new Error('Prompt not found');
  }

  // Check access permissions
  if (!prompt.isPublic && prompt.userId !== userId) {
    throw new Error('Access denied');
  }

  return prompt;
};

export const updatePrompt = async (id: number, userId: number, data: UpdatePromptData) => {
  const prompt = await Prompt.findByPk(id);

  if (!prompt) {
    throw new Error('Prompt not found');
  }

  if (prompt.userId !== userId) {
    throw new Error('Access denied');
  }

  // Check if there are any actual changes
  const hasChanges = Object.keys(data).some(key => {
    const oldValue = prompt[key as keyof typeof prompt];
    const newValue = data[key as keyof UpdatePromptData];
    
    // Handle array comparison for tags
    if (key === 'tags') {
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        if (oldValue.length !== newValue.length) return true;
        return !oldValue.every((tag, index) => tag === newValue[index]);
      }
      return oldValue !== newValue;
    }
    
    // Handle other fields
    return oldValue !== newValue;
  });

  // If no changes detected, return the existing prompt without updating
  if (!hasChanges) {
    return prompt;
  }

  await prompt.update(data);
  await prompt.reload({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username'],
      },
    ],
  });

  return prompt;
};

export const deletePrompt = async (id: number, userId: number) => {
  const prompt = await Prompt.findByPk(id);

  if (!prompt) {
    throw new Error('Prompt not found');
  }

  if (prompt.userId !== userId) {
    throw new Error('Access denied');
  }

  await prompt.destroy();
};

export const getPromptsByCategory = async (options: GetPromptsOptions = {}): Promise<CategoryAggregation[]> => {
  const whereClause: WhereOptions = {};

  if (options.userId) {
    whereClause.userId = options.userId;
  } else {
    whereClause.isPublic = true;
  }


  // Get prompts with category information
  const prompts = await Prompt.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username'],
      },
      {
        model: Category,
        as: 'categoryRelation',
        attributes: ['id', 'name'],
        required: false,
      },
    ],
    order: [['updatedAt', 'DESC']],
  });

  // Group prompts by category
  const categoryMap = new Map<string, CategoryAggregation>();

  prompts.forEach(prompt => {
    const categoryName = (prompt as any).categoryRelation?.name || prompt.category || 'Uncategorized';
    const categoryId = (prompt as any).categoryRelation?.id || null;
    const key = `${categoryId}-${categoryName}`;

    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        categoryName,
        categoryId,
        count: 0,
        prompts: [],
      });
    }

    const category = categoryMap.get(key)!;
    category.count++;
    if (options.includePrompts !== false) {
      category.prompts!.push(prompt);
    }
  });

  return Array.from(categoryMap.values()).sort((a, b) => a.categoryName.localeCompare(b.categoryName));
};

// Get all available tags with their usage counts
export const getAllTags = async (options: GetPromptsOptions = {}) => {
  let whereConditions: WhereOptions = {};

  if (!options.userId) {
    // For non-authenticated users, only show public prompts
    whereConditions.isPublic = true;
  } else if (options.currentUserId) {
    // For authenticated users, show public prompts + their own prompts
    whereConditions = {
      [Op.or]: [
        { isPublic: true },
        { userId: options.currentUserId },
      ]
    };
  }

  // Get all prompts with tags
  const prompts = await Prompt.findAll({
    where: whereConditions,
    attributes: ['tags'],
    raw: true,
  });

  // Count tag usage
  const tagCounts = new Map<string, number>();
  
  prompts.forEach((prompt: any) => {
    if (prompt.tags && Array.isArray(prompt.tags)) {
      prompt.tags.forEach((tag: string) => {
        if (tag && tag.trim()) {
          const normalizedTag = tag.trim();
          tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
        }
      });
    }
  });

  // Convert to array and sort by usage count (descending) then alphabetically
  const tagsArray = Array.from(tagCounts.entries()).map(([tag, count]) => ({
    name: tag,
    count,
  }));

  return tagsArray.sort((a, b) => {
    if (a.count !== b.count) {
      return b.count - a.count; // Sort by count descending
    }
    return a.name.localeCompare(b.name); // Then sort alphabetically
  });
};