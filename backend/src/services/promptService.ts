import { Prompt, User, PromptVersion, Category } from '../models';
import { WhereOptions, Op } from 'sequelize';

export interface CreatePromptData {
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  isTemplate?: boolean;
  isPublic?: boolean;
}

export interface UpdatePromptData {
  title?: string;
  content?: string;
  description?: string;
  category?: string;
  tags?: string[];
  isTemplate?: boolean;
  isPublic?: boolean;
}

export interface GetPromptsOptions {
  userId?: number;
  category?: string;
  categoryId?: number;
  isPublic?: boolean;
  isTemplate?: boolean;
  includePrompts?: boolean;
}

export interface CategoryAggregation {
  categoryName: string;
  categoryId: number | null;
  count: number;
  prompts?: Prompt[];
}

export const createPrompt = async (userId: number, data: CreatePromptData) => {
  const prompt = await Prompt.create({
    ...data,
    userId,
    version: 1,
    isTemplate: data.isTemplate || false,
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
  const whereClause: WhereOptions = {};

  if (options.userId) {
    // If user is specified, get their prompts (both public and private)
    whereClause.userId = options.userId;
  } else {
    // If no user specified, only get public prompts
    whereClause.isPublic = true;
  }

  if (options.category) {
    whereClause.category = options.category;
  }

  if (options.categoryId) {
    whereClause.categoryId = options.categoryId;
  }

  if (options.isTemplate !== undefined) {
    whereClause.isTemplate = options.isTemplate;
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

  if (options.isTemplate !== undefined) {
    whereClause.isTemplate = options.isTemplate;
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