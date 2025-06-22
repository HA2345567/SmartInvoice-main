import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(config?: EmailConfig) {
    // Use provided config or default to Gmail SMTP
    const emailConfig = config || {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      }
    };

    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments,
      });
      
      // console.log('Email sent successfully:', {
      //   messageId: info.messageId,
      //   to: emailData.to,
      //   subject: emailData.subject,
      //   response: info.response
      // });
      return true;
    } catch (error) {
      console.error('Email sending failed:', {
        to: emailData.to,
        subject: emailData.subject,
        error
      });
      return false;
    }
  }

  // Test email configuration
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      // console.log('Email configuration is valid');
      return true;
    } catch (error) {
      console.error('Email configuration error:', error);
      return false;
    }
  }

  static generateInvoiceEmail(invoiceData: any, companyData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700; 
          }
          .content { 
            padding: 30px; 
          }
          .invoice-details { 
            background: #f8f9fa; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px; 
            border-left: 4px solid #22c55e; 
          }
          .amount { 
            font-size: 32px; 
            font-weight: 700; 
            color: #22c55e; 
            text-align: center; 
            margin: 20px 0; 
          }
          .button { 
            display: inline-block; 
            padding: 15px 30px; 
            background: #22c55e; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600; 
            text-align: center; 
            margin: 20px 0; 
          }
          .footer { 
            text-align: center; 
            padding: 30px; 
            background: #f8f9fa; 
            color: #666; 
            border-top: 1px solid #e9ecef; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="font-family: 'Cookie', cursive; font-size: 2.5em; font-weight: 700; letter-spacing: 0.01em;">${companyData.name || 'SmartInvoice'}</h1>
            <p>Professional Invoice</p>
          </div>
          
          <div class="content">
            <h2>Hello ${invoiceData.clientName},</h2>
            <p>Thank you for your business! Please find your invoice details below:</p>
            
            <div class="invoice-details">
              <h3>Invoice #${invoiceData.invoiceNumber}</h3>
              <p><strong>Invoice Date:</strong> ${new Date(invoiceData.date).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${invoiceData.status}</p>
            </div>
            
            <div class="amount">
              Total: ${invoiceData.clientCurrency || '$'}${invoiceData.amount.toFixed(2)}
            </div>
            
            ${invoiceData.paymentLink ? `
              <div style="text-align: center;">
                <a href="${invoiceData.paymentLink}" class="button">Pay Now</a>
              </div>
            ` : ''}
            
            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            <p>Thank you for your business!</p>
          </div>
          
          <div class="footer">
            <p>Sent via <strong style="font-family: 'Cookie', cursive; font-size: 2em; font-weight: 700; letter-spacing: 0.01em;">SmartInvoice</strong></p>
            <p>&copy; ${new Date().getFullYear()} SmartInvoice. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generateWelcomeEmail(recipientName: string, ctaLink: string = "https://smartinvoice-rosy.vercel.app/"): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Welcome to SmartInvoice</title>
        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: auto;
            background-color: #ffffff;
            padding: 40px 30px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #4F46E5;
            font-size: 24px;
            margin-bottom: 5px;
          }
          .header p {
            color: #666;
            font-size: 14px;
          }
          .features {
            margin: 24px 0 24px 0;
            padding-left: 20px;
          }
          .features li {
            margin-bottom: 10px;
            font-size: 16px;
          }
          .cta {
            display: block;
            margin: 30px 0;
            padding: 14px 0;
            text-align: center;
            background-color: #22c55e;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #888;
            text-align: center;
          }
          .signature {
            margin-top: 30px;
            font-size: 16px;
          }
          .signature strong {
            display: block;
            margin-top: 6px;
            font-size: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="font-family: 'Cookie', cursive; font-size: 2.5em; font-weight: 700; letter-spacing: 0.01em;">Welcome to SmartInvoice!</h1>
            <p>Your professional invoice management solution</p>
          </div>
          <p>Hello ${recipientName},</p>
          <p>Welcome to <strong style="font-family: 'Cookie', cursive; font-size: 2em; font-weight: 700; letter-spacing: 0.01em;">SmartInvoice</strong>! We're excited to have you on board. You're now one step closer to simplifying and elevating your invoicing process.</p>
          <ul class="features">
            <li>Create beautiful, professional invoices in seconds</li>
            <li>Track payments and manage overdue invoices with ease</li>
            <li>Send automatic payment reminders to clients</li>
            <li>Generate real-time reports and smart analytics</li>
            <li>Maintain an organized client database</li>
            <li>Export invoice data to CSV for accounting tools</li>
          </ul>
          <a href="${ctaLink}" class="cta">Get Started Now</a>
          <p>If you ever have questions or need help, our team is just a message away.</p>
          <div class="signature">
            Warm regards,<br />
            <strong>Harsh Bhardwaj</strong><br />
            Cofounder & CEO, SmartInvoice
          </div>
          <div class="footer">
            SmartInvoice – Professional Invoice Management<br />
            Need help? Contact us at support@smartinvoice.com
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generateInvoiceSentEmail(clientName: string, invoiceNumber: string, recipientEmail: string, currency: string, amount: number, dueDate: string, invoiceLink: string): string {
    return `Hi ${clientName},\n\nGreat news! Your invoice #${invoiceNumber} has been sent to ${recipientEmail}.\n\nAmount: ${currency}${amount}\nDue Date: ${dueDate}\n\nYou can view your invoice here: ${invoiceLink}\n\nIf you have any questions or need to make changes, just reply to this email or contact us anytime.\n\nThank you for choosing SmartInvoice!\n\nBest regards,\nThe SmartInvoice Team`;
  }

  static generatePaymentReceivedEmail(clientName: string, invoiceNumber: string, currency: string, amount: number, paymentDate: string): string {
    return `Hi ${clientName},\n\nWe're happy to let you know that we've received your payment for invoice #${invoiceNumber}.\n\nAmount Paid: ${currency}${amount}\nDate: ${paymentDate}\n\nThank you for your prompt payment! If you need a receipt or have any questions, just reply to this email.\n\nWith gratitude,\nThe SmartInvoice Team`;
  }

  static generatePaymentReminderEmail(clientName: string, invoiceNumber: string, currency: string, amount: number, dueDate: string, paymentLink: string, daysOverdue?: number): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Payment Reminder - Invoice ${invoiceNumber}</title>
        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: auto;
            background-color: #ffffff;
            padding: 40px 30px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #eab308;
            font-size: 24px;
            margin-bottom: 5px;
          }
          .header p {
            color: #666;
            font-size: 14px;
          }
          .summary {
            background: #f8fafc;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #eab308;
          }
          .summary-row {
            margin-bottom: 8px;
            font-size: 16px;
          }
          .cta {
            display: block;
            margin: 30px 0;
            padding: 14px 0;
            text-align: center;
            background-color: #4F46E5;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #888;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Reminder</h1>
            <p>Your invoice payment is overdue</p>
          </div>
          <p>Hi ${clientName},</p>
          <p>This is a friendly reminder that payment for your invoice <strong>#${invoiceNumber}</strong> is now overdue.</p>
          <div class="summary">
            <div class="summary-row"><strong>Amount Due:</strong> ${currency}${amount.toFixed(2)}</div>
            <div class="summary-row"><strong>Due Date:</strong> ${dueDate}</div>
            ${daysOverdue !== undefined ? `<div class="summary-row"><strong>Days Overdue:</strong> ${daysOverdue}</div>` : ''}
          </div>
          <a href="${paymentLink}" class="cta">Pay Now</a>
          <p>If you have already made this payment, please disregard this message. If you have any questions or need assistance, feel free to reply to this email or contact our support team.</p>
          <div class="footer">
            Thank you for your prompt attention!<br />
            <strong style="font-family: 'Cookie', cursive; font-size: 2em; font-weight: 700; letter-spacing: 0.01em;">SmartInvoice</strong> &mdash; Professional Invoice Management<br />
            Need help? Contact us at support@smartinvoice.com
          </div>
        </div>
      </body>
      </html>
    `;
  }
}