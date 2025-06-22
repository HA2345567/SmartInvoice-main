import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { AuthService } from '@/lib/auth';
import { ReminderService } from '@/lib/reminder-service';
import { EmailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceIds, sendEmail = true } = await request.json();

    if (!invoiceIds || !Array.isArray(invoiceIds)) {
      return NextResponse.json({ 
        error: 'Invoice IDs array is required' 
      }, { status: 400 });
    }

    const results = [];
    const today = new Date().toISOString().split('T')[0];

    for (const invoiceId of invoiceIds) {
      try {
        const invoice = await DatabaseService.getInvoiceById(user.id, invoiceId);
        if (!invoice) {
          results.push({
            invoiceId,
            success: false,
            error: 'Invoice not found'
          });
          continue;
        }

        // Calculate days overdue
        const dueDate = new Date(invoice.dueDate);
        const todayDate = new Date();
        const daysOverdue = Math.ceil((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Generate reminder message
        const reminderInfo = ReminderService.generateReminderMessage({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
          daysOverdue,
          remindersSent: invoice.remindersSent || 0
        });

        let emailSent = false;

        // Send email if configured and requested
        if (sendEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          try {
            console.log('EMAIL_USER:', process.env.EMAIL_USER, 'EMAIL_PASS:', process.env.EMAIL_PASS);
            const emailService = new EmailService();
            emailSent = await emailService.sendEmail({
              to: invoice.clientEmail,
              subject: reminderInfo.subject,
              html: EmailService.generatePaymentReminderEmail(
                invoice.clientName,
                invoice.invoiceNumber,
                invoice.clientCurrency,
                invoice.amount,
                invoice.dueDate,
                invoice.paymentLink || ''
              ),
            });
          } catch (emailError) {
            console.error('Email sending error:', emailError);
          }
        }

        // Update invoice with reminder info
        const updatedInvoice = await DatabaseService.updateInvoice(user.id, invoiceId, {
          remindersSent: (invoice.remindersSent || 0) + 1,
          lastReminderSent: today,
          status: 'overdue' // Ensure status is overdue
        });

        results.push({
          invoiceId,
          success: true,
          emailSent,
          reminderCount: (invoice.remindersSent || 0) + 1,
          urgency: reminderInfo.urgency
        });

      } catch (error) {
        results.push({
          invoiceId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const emailCount = results.filter(r => r.success && r.emailSent).length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: invoiceIds.length,
        successful: successCount,
        emailsSent: emailCount,
        failed: invoiceIds.length - successCount
      }
    });

  } catch (error) {
    console.error('Send reminders error:', error);
    return NextResponse.json({ 
      error: 'Failed to send reminders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}