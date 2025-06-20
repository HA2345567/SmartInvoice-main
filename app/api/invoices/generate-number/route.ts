import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceNumber = DatabaseService.generateInvoiceNumber(user.id);
    
    return NextResponse.json({ invoiceNumber });
  } catch (error) {
    console.error('Generate invoice number error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 });
  }
}