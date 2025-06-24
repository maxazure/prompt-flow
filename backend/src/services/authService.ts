import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';

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

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
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