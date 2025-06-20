import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-enhanced';
import { AuthService } from '@/lib/auth';
import { SmartSuggestionsService } from '@/lib/smart-suggestions';

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || '';
    const name = searchParams.get('name') || '';

    if (!email && !name) {
      return NextResponse.json(null);
    }

    const clients = await DatabaseService.getClients(user.id);

    if (email) {
      // Email-based suggestion (auto-fill)
      const suggestion = SmartSuggestionsService.generateClientSuggestions(clients, email);
      return NextResponse.json(suggestion);
    }

    if (name) {
      // Name-based suggestions (auto-complete)
      const suggestions = SmartSuggestionsService.generateClientNameSuggestions(clients, name, 5);
      return NextResponse.json(suggestions);
    }

    return NextResponse.json(null);
  } catch (error) {
    console.error('Client suggestions error:', error);
    return NextResponse.json({ error: 'Failed to fetch client suggestions' }, { status: 500 });
  }
}