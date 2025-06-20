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

    const client = await DatabaseService.getClientById(user.id, params.id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
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

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email) {
      return NextResponse.json({ 
        error: 'Name and email are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json({ 
        error: 'Please enter a valid email address' 
      }, { status: 400 });
    }

    // Check if client exists
    const existingClient = await DatabaseService.getClientById(user.id, params.id);
    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check if email is being changed and if it conflicts with another client
    if (data.email.toLowerCase() !== existingClient.email.toLowerCase()) {
      const allClients = await DatabaseService.getClients(user.id);
      const emailExists = allClients.some(client => 
        client.id !== params.id && 
        client.email.toLowerCase() === data.email.toLowerCase()
      );

      if (emailExists) {
        return NextResponse.json({ 
          error: 'A client with this email already exists' 
        }, { status: 409 });
      }
    }

    const updates = {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      company: data.company?.trim() || '',
      address: data.address?.trim() || '',
      gstNumber: data.gstNumber?.trim() || '',
      currency: data.currency || 'USD',
    };

    const client = await DatabaseService.updateClient(user.id, params.id, updates);
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      client,
      message: 'Client updated successfully'
    });
  } catch (error) {
    console.error('Update client error:', error);
    return NextResponse.json({ 
      error: 'Failed to update client. Please try again.',
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

    // Check if client has any invoices
    const hasInvoices = await DatabaseService.clientHasInvoices(user.id, params.id);
    if (hasInvoices) {
      return NextResponse.json({ 
        error: 'Cannot delete client with existing invoices. Archive the client instead.' 
      }, { status: 400 });
    }

    const success = await DatabaseService.deleteClient(user.id, params.id);
    if (!success) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete client. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}