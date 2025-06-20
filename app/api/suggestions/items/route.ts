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
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    // Get user's invoices for AI suggestions
    const userInvoices = await DatabaseService.getInvoices(user.id);
    
    // Generate AI-powered suggestions
    const suggestions = SmartSuggestionsService.generateLineItemSuggestions(
      userInvoices,
      query,
      8 // Return up to 8 suggestions
    );

    // Format suggestions for the frontend
    const formattedSuggestions = suggestions.map(suggestion => ({
      description: suggestion.description,
      rate: suggestion.rate,
      frequency: suggestion.frequency,
      lastUsed: suggestion.lastUsed,
      confidence: Math.round((suggestion.frequency / Math.max(userInvoices.length, 1)) * 100)
    }));

    return NextResponse.json(formattedSuggestions);
  } catch (error) {
    console.error('Item suggestions error:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}