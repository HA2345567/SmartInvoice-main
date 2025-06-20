import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userExists = await AuthService.userExists(email);
    if (!userExists) {
      return NextResponse.json(
        { 
          error: 'No account found with this email address. Please sign up first.',
          userNotFound: true 
        },
        { status: 404 }
      );
    }

    // Authenticate user
    const user = await AuthService.authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid password. Please check your password and try again.' },
        { status: 401 }
      );
    }

    // Generate token
    const token = AuthService.generateToken(user.id);

    return NextResponse.json({
      user,
      token,
      message: 'Login successful!'
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}