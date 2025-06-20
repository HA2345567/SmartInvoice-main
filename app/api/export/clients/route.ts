import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const csvData = await DatabaseService.exportClientsCSV(user.id);
    
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="clients.csv"',
      },
    });
  } catch (error) {
    console.error('Export clients error:', error);
    return NextResponse.json({ error: 'Failed to export clients' }, { status: 500 });
  }
}