import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { EmailService } from '@/lib/email-enhanced';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, company } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
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

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const userExists = await AuthService.userExists(email);
    if (userExists) {
      return NextResponse.json(
        { 
          error: 'An account with this email already exists. Please try logging in instead.',
          userExists: true 
        },
        { status: 409 }
      );
    }

    // Create user
    const { user, exists } = await AuthService.createUser({
      email,
      password,
      name,
      company,
    });

    if (exists) {
      return NextResponse.json(
        { 
          error: 'An account with this email already exists. Please try logging in instead.',
          userExists: true 
        },
        { status: 409 }
      );
    }

    // Generate token (not async)
    const token = AuthService.generateToken(user.id);

    // Send welcome email (optional, non-blocking)
    try {
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
        const emailService = new EmailService({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS || '',
          },
        });

        await emailService.sendEmail({
          to: user.email,
          subject: 'Welcome to SmartInvoice!',
          html: EmailService.generateWelcomeEmail(user),
        });
      }
    } catch (emailError) {
      console.error(`Failed to send welcome email to ${user.email}:`, emailError instanceof Error ? emailError.stack : emailError);
    }

    // Sanitize user before returning
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      avatar: user.avatar,
    };

    return NextResponse.json({
      user: safeUser,
      token,
      message: 'Account created successfully!'
    });

  } catch (error) {
    console.error('Signup error:', error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}