import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { PaymentService } from '@/lib/payment-service';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const invoiceId = params.id;
    if (!invoiceId) {
      return new NextResponse(JSON.stringify({ error: 'Invoice ID is required' }), { status: 400 });
    }

    const invoice = await DatabaseService.getInvoiceById(auth.userId, invoiceId);

    if (!invoice) {
      return new NextResponse(JSON.stringify({ error: 'Invoice not found' }), { status: 404 });
    }
    
    // Ensure the invoice is in a state that can be paid
    if (invoice.status === 'paid' || invoice.status === 'draft') {
      return new NextResponse(JSON.stringify({ error: `Invoice cannot be paid. Status: ${invoice.status}` }), { status: 400 });
    }

    const paymentService = new PaymentService();
    const paymentLink = await paymentService.createPaymentLinkForInvoice(invoice);

    if (!paymentLink) {
      return new NextResponse(JSON.stringify({ error: 'Failed to create payment link' }), { status: 500 });
    }

    // Update the invoice with the payment link
    await DatabaseService.updateInvoice(auth.userId, invoiceId, { paymentLink });

    return NextResponse.json({ paymentLink });

  } catch (error) {
    console.error('[INVOICE_PAY]', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
} 