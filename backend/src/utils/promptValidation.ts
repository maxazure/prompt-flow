export const validateCreatePromptData = (data: any): string[] => {
  const errors: string[] = [];

  if (!data.title) {
    errors.push('Title is required');
  } else if (data.title.length < 3) {
    errors.push('Title must be at least 3 characters');
  } else if (data.title.length > 200) {
    errors.push('Title must not exceed 200 characters');
  }

  if (!data.content) {
    errors.push('Content is required');
  } else if (data.content.length < 10) {
    errors.push('Content must be at least 10 characters');
  }

  if (data.description && data.description.length > 1000) {
    errors.push('Description must not exceed 1000 characters');
  }

  if (data.category && data.category.length > 100) {
    errors.push('Category must not exceed 100 characters');
  }

  if (data.tags && (!Array.isArray(data.tags) || data.tags.length > 10)) {
    errors.push('Tags must be an array with maximum 10 items');
  }

  return errors;
};

export const validateUpdatePromptData = (data: any): string[] => {
  const errors: string[] = [];

  if (data.title !== undefined) {
    if (!data.title) {
      errors.push('Title cannot be empty');
    } else if (data.title.length < 3) {
      errors.push('Title must be at least 3 characters');
    } else if (data.title.length > 200) {
      errors.push('Title must not exceed 200 characters');
    }
  }

  if (data.content !== undefined) {
    if (!data.content) {
      errors.push('Content cannot be empty');
    } else if (data.content.length < 10) {
      errors.push('Content must be at least 10 characters');
    }
  }

  if (data.description && data.description.length > 1000) {
    errors.push('Description must not exceed 1000 characters');
  }

  if (data.category && data.category.length > 100) {
    errors.push('Category must not exceed 100 characters');
  }

  if (data.tags && (!Array.isArray(data.tags) || data.tags.length > 10)) {
    errors.push('Tags must be an array with maximum 10 items');
  }

  return errors;
};