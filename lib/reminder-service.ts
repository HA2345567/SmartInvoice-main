export interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  remindersSent: number;
  lastReminderSent?: string;
}

export interface ReminderSettings {
  enabled: boolean;
  firstReminderDays: number; // Days after due date for first reminder
  secondReminderDays: number; // Days after due date for second reminder
  finalReminderDays: number; // Days after due date for final reminder
  maxReminders: number;
}

export class ReminderService {
  private static defaultSettings: ReminderSettings = {
    enabled: true,
    firstReminderDays: 1, // 1 day after due date
    secondReminderDays: 7, // 1 week after due date
    finalReminderDays: 14, // 2 weeks after due date
    maxReminders: 3
  };

  // Find all overdue invoices that need reminders
  static findOverdueInvoices(userInvoices: any[]): OverdueInvoice[] {
    const today = new Date();
    const overdueInvoices: OverdueInvoice[] = [];

    userInvoices.forEach(invoice => {
      if (invoice.status === 'sent' || invoice.status === 'overdue') {
        const dueDate = new Date(invoice.dueDate);
        const diffTime = today.getTime() - dueDate.getTime();
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysOverdue > 0) {
          // Update status to overdue if not already
          if (invoice.status === 'sent') {
            invoice.status = 'overdue';
          }

          overdueInvoices.push({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            clientName: invoice.clientName,
            clientEmail: invoice.clientEmail,
            amount: invoice.amount,
            dueDate: invoice.dueDate,
            daysOverdue,
            remindersSent: invoice.remindersSent || 0,
            lastReminderSent: invoice.lastReminderSent
          });
        }
      }
    });

    return overdueInvoices.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  // Determine which invoices need reminders sent
  static getInvoicesNeedingReminders(
    overdueInvoices: OverdueInvoice[],
    settings: ReminderSettings = this.defaultSettings
  ): OverdueInvoice[] {
    if (!settings.enabled) return [];

    const today = new Date();
    const needingReminders: OverdueInvoice[] = [];

    overdueInvoices.forEach(invoice => {
      // Skip if already sent maximum reminders
      if (invoice.remindersSent >= settings.maxReminders) {
        return;
      }

      // Check if enough time has passed since last reminder
      if (invoice.lastReminderSent) {
        const lastReminderDate = new Date(invoice.lastReminderSent);
        const daysSinceLastReminder = Math.ceil(
          (today.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Don't send reminders too frequently (minimum 2 days apart)
        if (daysSinceLastReminder < 2) {
          return;
        }
      }

      // Determine if reminder should be sent based on days overdue
      let shouldSendReminder = false;

      if (invoice.remindersSent === 0) {
        // First reminder
        shouldSendReminder = invoice.daysOverdue >= settings.firstReminderDays;
      } else if (invoice.remindersSent === 1) {
        // Second reminder
        shouldSendReminder = invoice.daysOverdue >= settings.secondReminderDays;
      } else if (invoice.remindersSent === 2) {
        // Final reminder
        shouldSendReminder = invoice.daysOverdue >= settings.finalReminderDays;
      }

      if (shouldSendReminder) {
        needingReminders.push(invoice);
      }
    });

    return needingReminders;
  }

  // Generate reminder message based on reminder count
  static generateReminderMessage(invoice: OverdueInvoice): {
    subject: string;
    urgency: 'low' | 'medium' | 'high';
    tone: 'polite' | 'firm' | 'urgent';
  } {
    const reminderCount = invoice.remindersSent + 1; // +1 because we're generating the next reminder

    if (reminderCount === 1) {
      return {
        subject: `Friendly Reminder: Invoice ${invoice.invoiceNumber} Payment Due`,
        urgency: 'low',
        tone: 'polite'
      };
    } else if (reminderCount === 2) {
      return {
        subject: `Payment Reminder: Invoice ${invoice.invoiceNumber} - ${invoice.daysOverdue} Days Overdue`,
        urgency: 'medium',
        tone: 'firm'
      };
    } else {
      return {
        subject: `URGENT: Final Notice for Invoice ${invoice.invoiceNumber} - ${invoice.daysOverdue} Days Overdue`,
        urgency: 'high',
        tone: 'urgent'
      };
    }
  }

  // Smart reminder scheduling based on invoice amount and client history
  static calculateOptimalReminderTiming(
    invoice: OverdueInvoice,
    clientHistory: any[]
  ): ReminderSettings {
    const baseSettings = { ...this.defaultSettings };

    // Adjust timing based on invoice amount
    if (invoice.amount > 10000) {
      // High-value invoices get more aggressive reminders
      baseSettings.firstReminderDays = 0; // Same day as due date
      baseSettings.secondReminderDays = 3;
      baseSettings.finalReminderDays = 7;
    } else if (invoice.amount < 1000) {
      // Low-value invoices get more relaxed timing
      baseSettings.firstReminderDays = 3;
      baseSettings.secondReminderDays = 10;
      baseSettings.finalReminderDays = 21;
    }

    // Adjust based on client payment history
    const clientInvoices = clientHistory.filter(inv => 
      inv.clientEmail === invoice.clientEmail
    );

    if (clientInvoices.length > 0) {
      const paidInvoices = clientInvoices.filter(inv => inv.status === 'paid');
      const paymentRate = paidInvoices.length / clientInvoices.length;
      
      // Calculate average payment delay
      const paymentDelays = paidInvoices
        .filter(inv => inv.paidDate && inv.dueDate)
        .map(inv => {
          const due = new Date(inv.dueDate);
          const paid = new Date(inv.paidDate);
          return Math.ceil((paid.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        });

      const avgPaymentDelay = paymentDelays.length > 0 
        ? paymentDelays.reduce((sum, delay) => sum + delay, 0) / paymentDelays.length
        : 0;

      // Good payment history - more relaxed reminders
      if (paymentRate > 0.8 && avgPaymentDelay < 5) {
        baseSettings.firstReminderDays += 2;
        baseSettings.secondReminderDays += 3;
        baseSettings.finalReminderDays += 5;
      }
      // Poor payment history - more aggressive reminders
      else if (paymentRate < 0.5 || avgPaymentDelay > 15) {
        baseSettings.firstReminderDays = Math.max(0, baseSettings.firstReminderDays - 1);
        baseSettings.secondReminderDays = Math.max(1, baseSettings.secondReminderDays - 2);
        baseSettings.finalReminderDays = Math.max(3, baseSettings.finalReminderDays - 3);
      }
    }

    return baseSettings;
  }

  // Generate reminder statistics for dashboard
  static generateReminderStats(userInvoices: any[]): {
    totalOverdue: number;
    totalOverdueAmount: number;
    remindersSentToday: number;
    avgDaysOverdue: number;
    clientsWithOverdueInvoices: number;
    upcomingReminders: number;
  } {
    const overdueInvoices = this.findOverdueInvoices(userInvoices);
    const today = new Date().toISOString().split('T')[0];

    const remindersSentToday = userInvoices.filter(invoice => 
      invoice.lastReminderSent === today
    ).length;

    const totalOverdueAmount = overdueInvoices.reduce(
      (sum, invoice) => sum + invoice.amount, 0
    );

    const avgDaysOverdue = overdueInvoices.length > 0
      ? overdueInvoices.reduce((sum, invoice) => sum + invoice.daysOverdue, 0) / overdueInvoices.length
      : 0;

    const uniqueClients = new Set(overdueInvoices.map(invoice => invoice.clientEmail));

    const upcomingReminders = this.getInvoicesNeedingReminders(overdueInvoices).length;

    return {
      totalOverdue: overdueInvoices.length,
      totalOverdueAmount,
      remindersSentToday,
      avgDaysOverdue: Math.round(avgDaysOverdue),
      clientsWithOverdueInvoices: uniqueClients.size,
      upcomingReminders
    };
  }

  // Auto-escalation logic for severely overdue invoices
  static getEscalationRecommendations(overdueInvoices: OverdueInvoice[]): {
    invoice: OverdueInvoice;
    recommendation: string;
    action: 'call' | 'legal' | 'collection' | 'writeoff';
  }[] {
    const recommendations: any[] = [];

    overdueInvoices.forEach(invoice => {
      if (invoice.daysOverdue > 60 && invoice.amount > 5000) {
        recommendations.push({
          invoice,
          recommendation: 'Consider legal action or debt collection agency',
          action: 'legal'
        });
      } else if (invoice.daysOverdue > 45) {
        recommendations.push({
          invoice,
          recommendation: 'Personal phone call recommended',
          action: 'call'
        });
      } else if (invoice.daysOverdue > 90 && invoice.amount < 500) {
        recommendations.push({
          invoice,
          recommendation: 'Consider writing off as bad debt',
          action: 'writeoff'
        });
      } else if (invoice.daysOverdue > 30 && invoice.remindersSent >= 3) {
        recommendations.push({
          invoice,
          recommendation: 'Escalate to collection process',
          action: 'collection'
        });
      }
    });

    return recommendations.sort((a, b) => b.invoice.amount - a.invoice.amount);
  }
}