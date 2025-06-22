import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { EmailService } from '@/lib/email-enhanced';
import config from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testEmail } = await request.json();

    if (!testEmail) {
      return NextResponse.json({ 
        error: 'Test email address is required' 
      }, { status: 400 });
    }

    // Check email configuration
    const emailConfig = config.email;
    
    if (!emailConfig.isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Email not configured',
        details: {
          missing: {
            host: !emailConfig.host,
            user: !emailConfig.user,
            pass: !emailConfig.pass
          },
          current: {
            host: emailConfig.host || 'Not set',
            port: emailConfig.port,
            secure: emailConfig.secure,
            user: emailConfig.user || 'Not set',
            from: emailConfig.from
          }
        },
        message: 'Please configure EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables'
      });
    }

    try {
      // Test email service connection
      const emailService = new EmailService({
        host: emailConfig.host!,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.user!,
          pass: emailConfig.pass!,
        },
      });

      // Test connection first
      const connectionTest = await emailService.testConnection();
      
      if (!connectionTest) {
        return NextResponse.json({
          success: false,
          error: 'Email connection failed',
          message: 'Could not connect to email server. Please check your email configuration.'
        });
      }

      // Send test email
      const emailSent = await emailService.sendEmail({
        to: testEmail,
        subject: 'SmartInvoice - Email Configuration Test',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Email Test</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 20px; 
                background-color: #f8f9fa;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 8px; 
                padding: 30px; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); 
                color: white; 
                padding: 20px; 
                margin: -30px -30px 30px -30px; 
                border-radius: 8px 8px 0 0; 
                text-align: center; 
              }
              .success { 
                color: #22c55e; 
                font-weight: bold; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Email Configuration Test</h1>
                <p>SmartInvoice Email System</p>
              </div>
              
              <h2>Hello!</h2>
              <p>This is a test email to verify that your SmartInvoice email configuration is working correctly.</p>
              
              <div class="success">
                <h3>🎉 Success!</h3>
                <p>Your email configuration is working properly. You can now send invoices via email.</p>
              </div>
              
              <h3>Configuration Details:</h3>
              <ul>
                <li><strong>SMTP Host:</strong> ${emailConfig.host}</li>
                <li><strong>Port:</strong> ${emailConfig.port}</li>
                <li><strong>Secure:</strong> ${emailConfig.secure ? 'Yes' : 'No'}</li>
                <li><strong>From Address:</strong> ${emailConfig.from}</li>
                <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>
              
              <p>If you received this email, your email configuration is working correctly and you can now send invoices to your clients.</p>
              
              <p>Best regards,<br>The SmartInvoice Team</p>
            </div>
          </body>
          </html>
        `,
      });

      if (emailSent) {
        return NextResponse.json({
          success: true,
          message: 'Test email sent successfully!',
          details: {
            to: testEmail,
            from: emailConfig.from,
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Email sending failed',
          message: 'Connection test passed but email sending failed. Please check your email credentials.'
        });
      }

    } catch (emailError) {
      console.error('Email test error:', emailError);
      
      return NextResponse.json({
        success: false,
        error: 'Email configuration error',
        details: emailError instanceof Error ? emailError.message : 'Unknown error',
        message: 'There was an error with your email configuration. Please check your settings.'
      });
    }

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      error: 'Failed to test email configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}