interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface CreateProjectData {
  name: string;
  description?: string;
  background: string;
  teamId?: number;
  isPublic?: boolean;
}

interface UpdateProjectData {
  name?: string;
  description?: string;
  background?: string;
  isPublic?: boolean;
}

export function validateCreateProjectData(data: any): ValidationResult {
  const errors: string[] = [];

  // 验证必填字段
  if (!data.name || typeof data.name !== 'string') {
    errors.push('项目名称是必填字段且必须是字符串');
  } else {
    // 验证名称长度
    if (data.name.trim().length === 0) {
      errors.push('项目名称不能为空');
    } else if (data.name.length > 200) {
      errors.push('项目名称长度不能超过200字符');
    }
  }

  if (!data.background || typeof data.background !== 'string') {
    errors.push('项目背景是必填字段且必须是字符串');
  } else if (data.background.trim().length === 0) {
    errors.push('项目背景不能为空');
  }

  // 验证可选字段
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push('项目描述必须是字符串');
  }

  if (data.teamId !== undefined) {
    if (typeof data.teamId !== 'number' || !Number.isInteger(data.teamId) || data.teamId <= 0) {
      errors.push('团队ID必须是正整数');
    }
  }

  if (data.isPublic !== undefined && typeof data.isPublic !== 'boolean') {
    errors.push('isPublic必须是布尔值');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUpdateProjectData(data: any): ValidationResult {
  const errors: string[] = [];

  // 对于更新操作，所有字段都是可选的，但如果提供了就需要验证
  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push('项目名称必须是字符串');
    } else if (data.name.trim().length === 0) {
      errors.push('项目名称不能为空');
    } else if (data.name.length > 200) {
      errors.push('项目名称长度不能超过200字符');
    }
  }

  if (data.background !== undefined) {
    if (typeof data.background !== 'string') {
      errors.push('项目背景必须是字符串');
    } else if (data.background.trim().length === 0) {
      errors.push('项目背景不能为空');
    }
  }

  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push('项目描述必须是字符串');
  }

  if (data.isPublic !== undefined && typeof data.isPublic !== 'boolean') {
    errors.push('isPublic必须是布尔值');
  }

  // 确保至少提供了一个要更新的字段
  const updateFields = ['name', 'description', 'background', 'isPublic'];
  const hasUpdateField = updateFields.some(field => data[field] !== undefined);
  
  if (!hasUpdateField) {
    errors.push('至少需要提供一个要更新的字段');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateProjectSearch(query: any): ValidationResult {
  const errors: string[] = [];

  if (query.search !== undefined && typeof query.search !== 'string') {
    errors.push('搜索关键词必须是字符串');
  }

  if (query.teamId !== undefined) {
    const teamId = parseInt(query.teamId, 10);
    if (isNaN(teamId) || teamId <= 0) {
      errors.push('团队ID必须是正整数');
    }
  }

  if (query.limit !== undefined) {
    const limit = parseInt(query.limit, 10);
    if (isNaN(limit) || limit <= 0 || limit > 100) {
      errors.push('limit必须是1-100之间的整数');
    }
  }

  if (query.offset !== undefined) {
    const offset = parseInt(query.offset, 10);
    if (isNaN(offset) || offset < 0) {
      errors.push('offset必须是非负整数');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}