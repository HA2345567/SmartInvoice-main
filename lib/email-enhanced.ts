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

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@smartinvoice.com',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments,
      });
      console.log('Email sent successfully:', {
        messageId: info.messageId,
        to: emailData.to,
        subject: emailData.subject,
        response: info.response
      });
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
            background: linear-gradient(135deg, #000 0%, #333 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700; 
          }
          .header p { 
            margin: 5px 0 0 0; 
            opacity: 0.9; 
          }
          .content { 
            padding: 30px; 
          }
          .invoice-details { 
            background: #f8f9fa; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px; 
            border-left: 4px solid #000; 
          }
          .invoice-details h3 { 
            margin: 0 0 15px 0; 
            color: #000; 
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 8px 0; 
          }
          .amount { 
            font-size: 32px; 
            font-weight: 700; 
            color: #000; 
            text-align: center; 
            margin: 20px 0; 
          }
          .button { 
            display: inline-block; 
            padding: 15px 30px; 
            background: #000; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600; 
            text-align: center; 
            margin: 20px 0; 
          }
          .button:hover { 
            background: #333; 
          }
          .footer { 
            text-align: center; 
            padding: 30px; 
            background: #f8f9fa; 
            color: #666; 
            border-top: 1px solid #e9ecef; 
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
          }
          .items-table th, .items-table td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #e9ecef; 
          }
          .items-table th { 
            background: #f8f9fa; 
            font-weight: 600; 
          }
          .company-info { 
            margin: 20px 0; 
            padding: 15px; 
            background: #f8f9fa; 
            border-radius: 6px; 
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
              <div class="detail-row">
                <span><strong>Invoice Date:</strong></span>
                <span>${new Date(invoiceData.date).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span><strong>Due Date:</strong></span>
                <span>${new Date(invoiceData.dueDate).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span><strong>Status:</strong></span>
                <span style="text-transform: capitalize; color: #007bff;">${invoiceData.status}</span>
              </div>
            </div>

            ${invoiceData.items && invoiceData.items.length > 0 ? `
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceData.items.map((item: any) => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.quantity}</td>
                      <td>${invoiceData.clientCurrency || '$'}${item.rate.toFixed(2)}</td>
                      <td>${invoiceData.clientCurrency || '$'}${item.amount.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
            
            <div class="amount">
              Total: ${invoiceData.clientCurrency || '$'}${invoiceData.amount.toFixed(2)}
            </div>
            
            ${invoiceData.paymentLink ? `
              <div style="text-align: center;">
                <a href="${invoiceData.paymentLink}" class="button">Pay Now</a>
              </div>
            ` : ''}
            
            ${invoiceData.notes ? `
              <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 6px;">
                <h4 style="margin: 0 0 10px 0;">Notes:</h4>
                <p style="margin: 0;">${invoiceData.notes}</p>
              </div>
            ` : ''}

            ${companyData.address ? `
              <div class="company-info">
                <h4 style="margin: 0 0 10px 0;">Company Information:</h4>
                <p style="margin: 0; white-space: pre-line;">${companyData.address}</p>
                ${companyData.gst ? `<p style="margin: 5px 0 0 0;"><strong>GST:</strong> ${companyData.gst}</p>` : ''}
              </div>
            ` : ''}
            
            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            <p>Thank you for your business!</p>
          </div>
          
          <div class="footer">
            <p><strong>${companyData.name || 'SmartInvoice'}</strong></p>
            <p>Professional Invoice Management System</p>
            <p style="font-size: 12px; margin-top: 15px;">
              This is an automated email. Please do not reply directly to this message.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generateReminderEmail(invoiceData: any, companyData: any, daysOverdue: number): string {
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
            background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); 
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
          .urgent-notice { 
            background: #fef2f2; 
            border: 2px solid #fecaca; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            text-align: center; 
          }
          .urgent-notice h3 { 
            color: #dc2626; 
            margin: 0 0 10px 0; 
            font-size: 20px; 
          }
          .invoice-details { 
            background: #f8f9fa; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px; 
            border-left: 4px solid #dc2626; 
          }
          .amount { 
            font-size: 32px; 
            font-weight: 700; 
            color: #dc2626; 
            text-align: center; 
            margin: 20px 0; 
          }
          .button { 
            display: inline-block; 
            padding: 15px 30px; 
            background: #dc2626; 
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
            <h1>⚠️ Payment Reminder</h1>
            <p>${companyData.name || 'SmartInvoice'}</p>
          </div>
          
          <div class="content">
            <h2>Hello ${invoiceData.clientName},</h2>
            
            <div class="urgent-notice">
              <h3>Payment Overdue</h3>
              <p>This invoice is <strong>${daysOverdue} days overdue</strong>. Please arrange payment at your earliest convenience to avoid any service interruption.</p>
            </div>
            
            <div class="invoice-details">
              <h3>Invoice #${invoiceData.invoiceNumber}</h3>
              <p><strong>Original Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
              <p><strong>Days Overdue:</strong> ${daysOverdue} days</p>
            </div>
            
            <div class="amount">
              Amount Due: ${invoiceData.clientCurrency || '$'}${invoiceData.amount.toFixed(2)}
            </div>
            
            ${invoiceData.paymentLink ? `
              <div style="text-align: center;">
                <a href="${invoiceData.paymentLink}" class="button">Pay Now</a>
              </div>
            ` : ''}
            
            <p><strong>Important:</strong> If you have already made this payment, please disregard this reminder and contact us with your payment confirmation.</p>
            
            <p>If you're experiencing any issues with payment or need to discuss alternative arrangements, please contact us immediately at ${companyData.email || 'billing@smartinvoice.com'}.</p>
            
            <p>We value our business relationship and look forward to resolving this matter promptly.</p>
            
            <p>Best regards,<br>
            ${companyData.name || 'SmartInvoice'} Team</p>
          </div>
          
          <div class="footer">
            <p><strong>${companyData.name || 'SmartInvoice'}</strong></p>
            <p>This is an automated reminder. Please contact us if you need assistance.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generateWelcomeEmail(userData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to SmartInvoice</title>
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
            background: linear-gradient(135deg, #000 0%, #333 100%); 
            color: white; 
            padding: 40px; 
            text-align: center; 
          }
          .content { 
            padding: 40px; 
          }
          .feature { 
            display: flex; 
            align-items: center; 
            margin: 20px 0; 
            padding: 15px; 
            background: #f8f9fa; 
            border-radius: 6px; 
          }
          .button { 
            display: inline-block; 
            padding: 15px 30px; 
            background: #000; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600; 
            text-align: center; 
            margin: 20px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to SmartInvoice!</h1>
            <p>Your professional invoicing journey starts here</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userData.name},</h2>
            <p>Thank you for joining SmartInvoice! We're excited to help you streamline your invoicing process and get paid faster.</p>
            
            <h3>What you can do with SmartInvoice:</h3>
            
            <div class="feature">
              <span style="margin-right: 15px; font-size: 24px;">📄</span>
              <div>
                <strong>Create Professional Invoices</strong><br>
                Beautiful, customizable templates with your branding
              </div>
            </div>
            
            <div class="feature">
              <span style="margin-right: 15px; font-size: 24px;">💰</span>
              <div>
                <strong>Get Paid Faster</strong><br>
                Integrated payment links and automated reminders
              </div>
            </div>
            
            <div class="feature">
              <span style="margin-right: 15px; font-size: 24px;">📊</span>
              <div>
                <strong>Track Your Business</strong><br>
                Analytics dashboard with insights and reports
              </div>
            </div>
            
            <div class="feature">
              <span style="margin-right: 15px; font-size: 24px;">🤖</span>
              <div>
                <strong>Smart Features</strong><br>
                Auto-suggestions and intelligent client management
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">
                Get Started Now
              </a>
            </div>
            
            <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
            
            <p>Happy invoicing!<br>
            The SmartInvoice Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}