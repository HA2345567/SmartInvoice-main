import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-enhanced';
import { AuthService } from '@/lib/auth';
import { EmailService } from '@/lib/email-enhanced';
import { PDFGenerator } from '@/lib/pdf-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoice = await DatabaseService.getInvoiceById(user.id, params.id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if email is configured
    const emailConfigured = process.env.EMAIL_HOST && process.env.EMAIL_USER;
    
    if (!emailConfigured) {
      // If email is not configured, just mark as sent without actually sending
      await DatabaseService.updateInvoice(user.id, params.id, {
        status: 'sent',
        emailSent: false, // Mark as false since we didn't actually send
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Invoice marked as sent (Email not configured)',
        warning: 'Email configuration is required to send invoices via email'
      });
    }

    try {
      // Generate PDF
      const generator = new PDFGenerator();
      const pdfBuffer = generator.generatePDF({
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        dueDate: invoice.dueDate,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        clientCompany: invoice.clientCompany,
        clientAddress: invoice.clientAddress,
        clientGST: invoice.clientGST,
        clientCurrency: invoice.clientCurrency,
        items: invoice.items,
        notes: invoice.notes,
        terms: invoice.terms,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        discountAmount: invoice.discountAmount,
        amount: invoice.amount,
        taxRate: invoice.taxRate,
        discountRate: invoice.discountRate,
        paymentLink: invoice.paymentLink,
        companyName: user.company || 'SmartInvoice',
        companyAddress: 'Your Company Address\nCity, State - PIN',
        companyGST: 'Your GST Number',
        companyEmail: user.email,
      });

      // Send email
      const emailService = new EmailService({
        host: process.env.EMAIL_HOST || '',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASS || '',
        },
      });

      const emailSent = await emailService.sendEmail({
        to: invoice.clientEmail,
        subject: `Invoice ${invoice.invoiceNumber} from ${user.company || user.name}`,
        html: EmailService.generateInvoiceEmail(invoice, {
          name: user.company || user.name,
          email: user.email,
          address: 'Your Company Address\nCity, State - PIN',
          gst: 'Your GST Number',
        }),
        attachments: [
          {
            filename: `invoice-${invoice.invoiceNumber}.pdf`,
            content: Buffer.from(pdfBuffer),
            contentType: 'application/pdf',
          },
        ],
      });

      if (emailSent) {
        // Update invoice status
        await DatabaseService.updateInvoice(user.id, params.id, {
          status: 'sent',
          emailSent: true,
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Invoice sent successfully via email' 
        });
      } else {
        // Email failed but still mark as sent
        await DatabaseService.updateInvoice(user.id, params.id, {
          status: 'sent',
          emailSent: false,
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Invoice marked as sent (Email delivery failed)',
          warning: 'Email could not be delivered, but invoice status updated'
        });
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Still mark as sent even if email fails
      await DatabaseService.updateInvoice(user.id, params.id, {
        status: 'sent',
        emailSent: false,
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Invoice marked as sent (Email error occurred)',
        warning: 'Email could not be sent due to configuration issues'
      });
    }
  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json({ 
      error: 'Failed to send invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}