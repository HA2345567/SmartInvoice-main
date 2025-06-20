import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';

export async function GET(request: NextRequest) {
  try {
    // Test email configuration
    const emailService = new EmailService({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    });

    const isValid = await emailService.testConnection();
    
    if (isValid) {
      // Send a test email
      const testEmailSent = await emailService.sendEmail({
        to: process.env.EMAIL_USER || '',
        subject: 'SmartInvoice - Email Configuration Test',
        html: `
          <h2>🎉 Email Configuration Successful!</h2>
          <p>Your SmartInvoice application is now ready to send emails.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>Host: ${process.env.EMAIL_HOST}</li>
            <li>Port: ${process.env.EMAIL_PORT}</li>
            <li>User: ${process.env.EMAIL_USER}</li>
          </ul>
          <p>You can now send invoices via email to your clients!</p>
        `,
      });

      return NextResponse.json({
        success: true,
        message: 'Email configuration is working correctly',
        testEmailSent,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Email configuration failed',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Email test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}