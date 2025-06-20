import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { PDFGenerator } from '@/lib/pdf-generator';

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceData = await request.json();

    const generator = new PDFGenerator();
    const pdfBuffer = generator.generatePDF({
      invoiceNumber: invoiceData.invoiceNumber,
      date: invoiceData.date,
      dueDate: invoiceData.dueDate,
      clientName: invoiceData.clientName,
      clientEmail: invoiceData.clientEmail,
      clientCompany: invoiceData.clientCompany,
      clientAddress: invoiceData.clientAddress,
      clientGST: invoiceData.clientGST,
      clientCurrency: invoiceData.clientCurrency,
      items: invoiceData.items,
      notes: invoiceData.notes,
      terms: invoiceData.terms,
      subtotal: invoiceData.subtotal,
      taxAmount: invoiceData.taxAmount,
      discountAmount: invoiceData.discountAmount,
      amount: invoiceData.amount,
      taxRate: invoiceData.taxRate,
      discountRate: invoiceData.discountRate,
      paymentLink: invoiceData.paymentLink,
      companyName: user.company || 'SmartInvoice',
      companyAddress: 'Your Company Address\nCity, State - PIN',
      companyGST: 'Your GST Number',
      companyEmail: user.email,
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-preview-${invoiceData.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF preview error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF preview' }, { status: 500 });
  }
}