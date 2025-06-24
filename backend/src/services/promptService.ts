import { Prompt, User, PromptVersion } from '../models';
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
  isPublic?: boolean;
  isTemplate?: boolean;
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