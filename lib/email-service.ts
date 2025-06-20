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
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
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

  // Test email configuration
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email configuration is valid');
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
}