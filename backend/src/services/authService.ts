import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { createUncategorizedCategory } from './uncategorizedService';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const registerUser = async (userData: RegisterData) => {
  const { username, email, password } = userData;

  // Check if user already exists
  const existingUserByEmail = await User.findOne({ where: { email } });
  if (existingUserByEmail) {
    throw new Error('Email already exists');
  }

  const existingUserByUsername = await User.findOne({ where: { username } });
  if (existingUserByUsername) {
    throw new Error('Username already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  // Create default "Uncategorized" category for the new user
  try {
    await createUncategorizedCategory(user.id);
  } catch (error) {
    console.error('Failed to create uncategorized category for new user:', error);
    // Don't fail registration if category creation fails
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'development_secret',
    { expiresIn: '7d' }
  );

  // Return user without password and token
  const { password: _, ...userWithoutPassword } = user.toJSON();
  return { user: userWithoutPassword, token };
};

export const loginUser = async (loginData: LoginData) => {
  const { email, password } = loginData;

  console.log('🔍 Login attempt for email:', email);

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.log('❌ User not found for email:', email);
    throw new Error('Invalid credentials');
  }

  console.log('✅ User found:', { id: user.id, username: user.username, email: user.email });

  // Check password
  console.log('🔐 Comparing password...');
  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log('Password validation result:', isPasswordValid);
  
  if (!isPasswordValid) {
    console.log('❌ Password validation failed');
    throw new Error('Invalid credentials');
  }

  console.log('🎉 Login successful for user:', user.username);

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'development_secret',
    { expiresIn: '7d' }
  );

  // Return user without password and token
  const { password: _, ...userWithoutPassword } = user.toJSON();
  return { user: userWithoutPassword, token };
};