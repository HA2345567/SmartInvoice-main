import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoiceId = params.id;
    if (!invoiceId) {
      return new NextResponse(JSON.stringify({ error: 'Invoice ID is required' }), { status: 400 });
    }

    // For public access, we need to find the invoice without user context
    // This is a simplified approach - in production you might want a separate public token system
    const invoice = await DatabaseService.getPublicInvoiceById(invoiceId);

    if (!invoice) {
      return new NextResponse(JSON.stringify({ error: 'Invoice not found or access denied' }), { status: 404 });
    }
    
    // Do not allow access to draft invoices publicly
    if (invoice.status === 'draft') {
        return new NextResponse(JSON.stringify({ error: 'This invoice is not available for public view.' }), { status: 403 });
    }

    return NextResponse.json(invoice);

  } catch (error) {
    console.error('[PUBLIC_INVOICE_GET]', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
} 