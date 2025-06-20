import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { DatabaseService } from './database';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'your-super-secret-jwt-key-change-in-production') {
    throw new Error('JWT_SECRET environment variable is not set. Please set it in your environment variables for security.');
  }
  return secret;
}

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(userId: string): string {
    return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' });
  }

  static verifyToken(token: string): { userId: string } | null {
    try {
      return jwt.verify(token, getJwtSecret()) as unknown as { userId: string };
    } catch {
      return null;
    }
  }

  static async createUser(userData: {
    email: string;
    password: string;
    name: string;
    company?: string;
  }): Promise<{ user: User; exists: boolean }> {
    const hashedPassword = await this.hashPassword(userData.password);
    
    const result = await DatabaseService.createUser({
      ...userData,
      password: hashedPassword,
    });

    return result;
  }

  static async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await DatabaseService.getUserByEmail(email);
    if (!user) {
      return null;
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async getUserById(id: string): Promise<User | null> {
    return await DatabaseService.getUserById(id);
  }

  static async getUserFromRequest(request: NextRequest): Promise<User | null> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = this.verifyToken(token);
    if (!decoded) {
      return null;
    }

    return this.getUserById(decoded.userId);
  }

  static async userExists(email: string): Promise<boolean> {
    const user = await DatabaseService.getUserByEmail(email);
    return !!user;
  }
}