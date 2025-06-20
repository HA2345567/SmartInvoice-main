import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoices = await DatabaseService.getInvoices(user.id);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.clientName || !data.clientEmail) {
      return NextResponse.json({ 
        error: 'Client name and email are required' 
      }, { status: 400 });
    }

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ 
        error: 'At least one invoice item is required' 
      }, { status: 400 });
    }

    // Generate unique invoice number if not provided
    if (!data.invoiceNumber) {
      data.invoiceNumber = DatabaseService.generateInvoiceNumber(user.id);
    }

    // Ensure items have proper structure
    const validatedItems = data.items.map((item: any, index: number) => ({
      id: item.id || `item_${index + 1}`,
      description: item.description || '',
      quantity: parseFloat(item.quantity) || 1,
      rate: parseFloat(item.rate) || 0,
      amount: parseFloat(item.amount) || (parseFloat(item.quantity) || 1) * (parseFloat(item.rate) || 0)
    }));

    // Calculate amounts with proper validation
    const subtotal = validatedItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    const discountRate = parseFloat(data.discountRate) || 0;
    const taxRate = parseFloat(data.taxRate) || 0;
    
    const discountAmount = discountRate ? (subtotal * discountRate) / 100 : 0;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = taxRate ? (subtotalAfterDiscount * taxRate) / 100 : 0;
    const amount = subtotalAfterDiscount + taxAmount;

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber: data.invoiceNumber,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientCompany: data.clientCompany || '',
      clientAddress: data.clientAddress || '',
      clientGST: data.clientGST || '',
      clientCurrency: data.clientCurrency || '$',
      date: data.date || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: validatedItems,
      notes: data.notes || '',
      terms: data.terms || '',
      subtotal,
      taxAmount,
      discountAmount,
      amount,
      taxRate,
      discountRate,
      status: data.status || 'draft',
      emailSent: false,
      remindersSent: 0,
      paymentLink: data.paymentLink || '',
    };

    const invoice = await DatabaseService.createInvoice(user.id, invoiceData);

    return NextResponse.json({
      success: true,
      invoice,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ 
      error: 'Failed to create invoice. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}