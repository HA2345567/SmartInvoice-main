import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { DatabaseService } from './database';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET environment variable is not set');
    throw new Error('JWT_SECRET environment variable is not set. Please set it in your environment variables for security.');
  }
  if (secret === 'your-super-secret-jwt-key-change-in-production') {
    console.error('JWT_SECRET is using the default value. Please change it in production.');
    throw new Error('JWT_SECRET environment variable is using the default value. Please set a secure secret in your environment variables.');
  }
  return secret;
}

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  companyAddress?: string;
  companyGST?: string;
  companyPhone?: string;
  companyWebsite?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: User;
  userId: string;
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
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret) as unknown as { userId: string };
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
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
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No valid authorization header found');
        return null;
      }

      const token = authHeader.substring(7);
      console.log('Verifying token:', token.substring(0, 20) + '...');
      
      const decoded = this.verifyToken(token);
      if (!decoded) {
        console.log('Token verification failed');
        return null;
      }

      console.log('Token verified, getting user with ID:', decoded.userId);
      const user = await this.getUserById(decoded.userId);
      
      if (!user) {
        console.log('User not found for ID:', decoded.userId);
      } else {
        console.log('User found:', user.email);
      }
      
      return user;
    } catch (error) {
      console.error('Error in getUserFromRequest:', error);
      return null;
    }
  }

  static async userExists(email: string): Promise<boolean> {
    const user = await DatabaseService.getUserByEmail(email);
    return !!user;
  }
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult | null> {
  const user = await AuthService.getUserFromRequest(request);
  if (!user) {
    return null;
  }
  
  return {
    user,
    userId: user.id
  };
}