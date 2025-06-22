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
    
    // Persistently update status to 'overdue' in the database for invoices that are overdue but still marked as 'sent'
    const updatePromises = overdueInvoices
      .filter(inv => {
        const original = userInvoices.find(u => u.id === inv.id);
        return original && original.status === 'sent';
      })
      .map(inv => DatabaseService.updateInvoice(user.id, inv.id, { status: 'overdue' }));
    await Promise.all(updatePromises);
    
    // Show all overdue invoices in Smart Reminders
    const needingReminders = overdueInvoices;
    
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