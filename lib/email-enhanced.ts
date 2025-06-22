import nodemailer from 'nodemailer';
import { EmailConfig, EmailData, CompanyData, Invoice, User } from './types';
import appConfig from './config'; // renamed to avoid conflict with constructor param

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(emailConfig: EmailConfig) {
    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: appConfig.email.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments || [],
      });

      // Always log SMTP response for debugging
      console.log('[EmailService] Email sent:', {
        messageId: info.messageId,
        to: emailData.to,
        subject: emailData.subject,
        response: info.response,
        envelope: info.envelope,
        accepted: info.accepted,
        rejected: info.rejected,
        pending: info.pending,
      });

      return true;
    } catch (error: any) {
      console.error('[EmailService] Email sending failed:', {
        to: emailData.to,
        subject: emailData.subject,
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error: any) {
      if (appConfig.isDevelopment) {
        console.error('Email connection test failed:', error.message);
      }
      return false;
    }
  }

  static generateInvoiceEmail(invoiceData: Invoice, companyData: CompanyData): string {
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
            <h1>${companyData.name || 'SmartInvoice'}</h1>
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
            <p><strong>${companyData.name || 'SmartInvoice'}</strong></p>
            <p>Professional Invoice Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generateReminderEmail(invoiceData: Invoice, companyData: CompanyData, daysOverdue: number): string {
    const urgency = daysOverdue > 14 ? 'high' : daysOverdue > 7 ? 'medium' : 'low';
    const urgencyColor = urgency === 'high' ? '#dc2626' : urgency === 'medium' ? '#f59e0b' : '#22c55e';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Reminder - Invoice ${invoiceData.invoiceNumber}</title>
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
            background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); 
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
          .reminder-details { 
            background: #fef2f2; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px; 
            border-left: 4px solid ${urgencyColor}; 
          }
          .amount { 
            font-size: 32px; 
            font-weight: 700; 
            color: ${urgencyColor}; 
            text-align: center; 
            margin: 20px 0; 
          }
          .button { 
            display: inline-block; 
            padding: 15px 30px; 
            background: ${urgencyColor}; 
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
            <h1>Payment Reminder</h1>
            <p>Invoice ${invoiceData.invoiceNumber} - ${daysOverdue} Days Overdue</p>
          </div>
          
          <div class="content">
            <h2>Hello ${invoiceData.clientName},</h2>
            <p>This is a friendly reminder that your invoice payment is overdue.</p>
            
            <div class="reminder-details">
              <h3>Invoice #${invoiceData.invoiceNumber}</h3>
              <p><strong>Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
              <p><strong>Days Overdue:</strong> ${daysOverdue} days</p>
              <p><strong>Status:</strong> Overdue</p>
            </div>
            
            <div class="amount">
              Outstanding Amount: ${invoiceData.clientCurrency || '$'}${invoiceData.amount.toFixed(2)}
            </div>
            
            ${invoiceData.paymentLink ? `
              <div style="text-align: center;">
                <a href="${invoiceData.paymentLink}" class="button">Pay Now</a>
              </div>
            ` : ''}
            
            <p>Please process this payment as soon as possible to avoid any late fees or service interruptions.</p>
            <p>If you have already made the payment, please disregard this reminder.</p>
            <p>Thank you for your prompt attention to this matter.</p>
          </div>
          
          <div class="footer">
            <p><strong>${companyData.name || 'SmartInvoice'}</strong></p>
            <p>Professional Invoice Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generateWelcomeEmail(userData: User): string {
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
            color: #1a1a1a;
            font-size: 24px;
            margin-bottom: 5px;
          }
          .header p {
            color: #666;
            font-size: 14px;
          }
          .body {
            color: #333;
            font-size: 16px;
            line-height: 1.6;
          }
          .features {
            margin-top: 20px;
            padding-left: 20px;
          }
          .features li {
            margin-bottom: 10px;
          }
          .cta {
            display: block;
            margin: 30px 0;
            padding: 12px 20px;
            text-align: center;
            background-color: #4F46E5;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
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
            <h1>Welcome to SmartInvoice!</h1>
            <p>Your professional invoice management solution</p>
          </div>
          <div class="body">
            <p>Hello ${userData.name},</p>
            <p>Welcome to <strong>SmartInvoice</strong>! We're excited to have you on board. You're now one step closer to simplifying and elevating your invoicing process.</p>

            <p><strong>With SmartInvoice, you can:</strong></p>
            <ul class="features">
              <li>Create beautiful, professional invoices in seconds</li>
              <li>Track payments and manage overdue invoices with ease</li>
              <li>Send automatic payment reminders to clients</li>
              <li>Generate real-time reports and smart analytics</li>
              <li>Maintain an organized client database</li>
              <li>Export invoice data to CSV for accounting tools</li>
            </ul>

            <a href="${appConfig.app.url}/dashboard" class="cta">Get Started Now</a>

            <p>If you ever have questions or need help, our team is just a message away.</p>

            <div class="signature">
              Warm regards,<br />
              <strong>Harsh Bhardwaj</strong><br />
              Cofounder & CEO, SmartInvoice
            </div>
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
}
