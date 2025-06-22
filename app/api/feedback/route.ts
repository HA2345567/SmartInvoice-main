import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/database-config';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.title || !data.description || !data.type || !data.rating) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    const { error } = await supabase
      .from('feedback')
      .insert([{ ...data, created_at: new Date().toISOString() }]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit feedback.' }, { status: 500 });
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
} 