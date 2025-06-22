import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { AuthService } from '@/lib/auth';
import { EmailService } from '@/lib/email-service';
import { PremiumPDFGenerator } from '@/lib/pdf-generator';

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

    if (!invoice.clientEmail || !invoice.invoiceNumber) {
      return NextResponse.json({ error: 'Invoice is missing client email or invoice number. Please check the invoice data.' }, { status: 400 });
    }

    // Generate PDF
    const generator = new PremiumPDFGenerator();
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

    // Send email using Nodemailer
    console.log('EMAIL_USER:', process.env.EMAIL_USER, 'EMAIL_PASS:', process.env.EMAIL_PASS);
    const emailService = new EmailService(); // Uses Gmail env vars by default
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
        message: 'Invoice sent successfully via email (Gmail/Nodemailer)',
      });
    } else {
      console.error('[Nodemailer] Email sending failed');
      await DatabaseService.updateInvoice(user.id, params.id, {
        status: 'sent',
        emailSent: false,
      });
      return NextResponse.json({
        success: false,
        message: 'Invoice marked as sent (email delivery failed)',
        warning: 'Email could not be delivered, but invoice status updated',
      });
    }
  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json({
      error: 'Failed to send invoice',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}