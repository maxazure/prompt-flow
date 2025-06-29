import { CategoryScopeType } from '../models/Category';

export interface CreateCategoryData {
  name: string;
  description?: string;
  scopeType: CategoryScopeType;
  scopeId?: number;
  color?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
}

export interface ValidationResult<T> {
  isValid: boolean;
  data: T;
  errors: string[];
}

export function validateCreateCategoryData(data: any): ValidationResult<CreateCategoryData> {
  const errors: string[] = [];
  const result: Partial<CreateCategoryData> = {};

  // 验证 name
  if (typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  } else if (data.name.trim().length > 100) {
    errors.push('Name must be 100 characters or less');
  } else {
    result.name = data.name.trim();
  }

  // 验证 description (可选)
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    } else {
      result.description = data.description.trim() || undefined;
    }
  }

  // 验证 scopeType
  if (!Object.values(CategoryScopeType).includes(data.scopeType)) {
    errors.push('Invalid scope type. Must be personal or team');
  } else {
    result.scopeType = data.scopeType;
  }

  // 验证 scopeId (对于 team 类型是必需的)
  if (data.scopeType === CategoryScopeType.TEAM) {
    if (typeof data.scopeId !== 'number' || data.scopeId <= 0) {
      errors.push('Valid team ID is required for team categories');
    } else {
      result.scopeId = data.scopeId;
    }
  } else if (data.scopeType === CategoryScopeType.PERSONAL) {
    // 个人分类的 scopeId 由服务层设置，忽略客户端传递的值
    result.scopeId = undefined;
  }

  // 验证 color (可选)
  if (data.color !== undefined) {
    if (typeof data.color !== 'string') {
      errors.push('Color must be a string');
    } else if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
      errors.push('Color must be a valid hex color code (e.g., #FF5733)');
    } else {
      result.color = data.color.toUpperCase();
    }
  }

  return {
    isValid: errors.length === 0,
    data: result as CreateCategoryData,
    errors,
  };
}

export function validateUpdateCategoryData(data: any): ValidationResult<UpdateCategoryData> {
  const errors: string[] = [];
  const result: UpdateCategoryData = {};

  // 验证 name (可选)
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name must be a non-empty string');
    } else if (data.name.trim().length > 100) {
      errors.push('Name must be 100 characters or less');
    } else {
      result.name = data.name.trim();
    }
  }

  // 验证 description (可选)
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    } else {
      result.description = data.description.trim() || undefined;
    }
  }

  // 验证 color (可选)
  if (data.color !== undefined) {
    if (typeof data.color !== 'string') {
      errors.push('Color must be a string');
    } else if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
      errors.push('Color must be a valid hex color code (e.g., #FF5733)');
    } else {
      result.color = data.color.toUpperCase();
    }
  }

  // 至少需要一个字段
  if (Object.keys(result).length === 0) {
    errors.push('At least one field must be provided for update');
  }

  return {
    isValid: errors.length === 0,
    data: result,
    errors,
  };
}