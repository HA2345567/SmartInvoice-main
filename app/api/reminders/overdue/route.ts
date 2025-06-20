import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-enhanced';
import { AuthService } from '@/lib/auth';
import { ReminderService } from '@/lib/reminder-service';

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userInvoices = await DatabaseService.getInvoices(user.id);
    
    // Find overdue invoices
    const overdueInvoices = ReminderService.findOverdueInvoices(userInvoices);
    
    // Get invoices needing reminders
    const needingReminders = ReminderService.getInvoicesNeedingReminders(overdueInvoices);
    
    // Generate reminder statistics
    const stats = ReminderService.generateReminderStats(userInvoices);
    
    // Get escalation recommendations
    const escalations = ReminderService.getEscalationRecommendations(overdueInvoices);

    return NextResponse.json({
      overdueInvoices,
      needingReminders,
      stats,
      escalations
    });
  } catch (error) {
    console.error('Overdue reminders error:', error);
    return NextResponse.json({ error: 'Failed to fetch overdue invoices' }, { status: 500 });
  }
}