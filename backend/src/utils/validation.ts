export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return !!password && password.length >= 6;
};

export const validateUsername = (username: string): boolean => {
  return !!username && username.length >= 3 && username.length <= 50;
};

export const validateRegisterData = (data: any): string[] => {
  const errors: string[] = [];

  if (!data.username) {
    errors.push('Username is required');
  } else if (!validateUsername(data.username)) {
    errors.push('Username must be between 3 and 50 characters');
  }

  if (!data.email) {
    errors.push('Email is required');
  } else if (!validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.password) {
    errors.push('Password is required');
  } else if (!validatePassword(data.password)) {
    errors.push('Password must be at least 6 characters');
  }

  return errors;
};

export const validateLoginData = (data: any): string[] => {
  const errors: string[] = [];

  if (!data.email) {
    errors.push('Email is required');
  } else if (!validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.password) {
    errors.push('Password is required');
  }

  return errors;
};