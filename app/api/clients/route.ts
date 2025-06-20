import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clients = await DatabaseService.getClients(user.id);
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
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

    // Check if client with this email already exists
    const existingClients = await DatabaseService.getClients(user.id);
    const emailExists = existingClients.some(client => 
      client.email.toLowerCase() === data.email.toLowerCase()
    );

    if (emailExists) {
      return NextResponse.json({ 
        error: 'A client with this email already exists' 
      }, { status: 409 });
    }

    const clientData = {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      company: data.company?.trim() || '',
      address: data.address?.trim() || '',
      gstNumber: data.gstNumber?.trim() || '',
      currency: data.currency || 'USD',
    };

    const client = await DatabaseService.createClient(user.id, clientData);

    return NextResponse.json({
      success: true,
      client,
      message: 'Client created successfully'
    });
  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json({ 
      error: 'Failed to create client. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}