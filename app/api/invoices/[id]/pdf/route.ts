import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { AuthService } from '@/lib/auth';
import { PDFGenerator } from '@/lib/pdf-generator';

export async function GET(
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

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}