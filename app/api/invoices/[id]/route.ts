import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { AuthService } from '@/lib/auth';

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

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    
    // Validate status if provided
    if (updates.status && !['draft', 'sent', 'paid', 'overdue'].includes(updates.status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: draft, sent, paid, overdue' 
      }, { status: 400 });
    }

    // If marking as paid, validate payment data
    if (updates.status === 'paid') {
      if (!updates.paidDate) {
        return NextResponse.json({ 
          error: 'Payment date is required when marking as paid' 
        }, { status: 400 });
      }
      
      if (!updates.paymentMethod) {
        return NextResponse.json({ 
          error: 'Payment method is required when marking as paid' 
        }, { status: 400 });
      }
    }

    // Auto-update overdue status based on due date
    if (updates.status === 'sent') {
      const invoice = await DatabaseService.getInvoiceById(user.id, params.id);
      if (invoice) {
        const dueDate = new Date(invoice.dueDate);
        const today = new Date();
        if (dueDate < today) {
          updates.status = 'overdue';
        }
      }
    }

    const invoice = await DatabaseService.updateInvoice(user.id, params.id, updates);
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      invoice,
      message: 'Invoice updated successfully'
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json({ 
      error: 'Failed to update invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await DatabaseService.deleteInvoice(user.id, params.id);
    if (!success) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}