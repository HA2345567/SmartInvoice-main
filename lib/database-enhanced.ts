import { DatabaseService } from './database';

export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientAddress: string;
  clientGST?: string;
  clientCurrency: string;
  amount: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  date: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  paymentNotes?: string;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  taxRate: number;
  discountRate: number;
  paymentLink?: string;
  emailSent: boolean;
  remindersSent: number;
  lastReminderSent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  company?: string;
  address: string;
  gstNumber?: string;
  currency: string;
  totalInvoices: number;
  totalAmount: number;
  lastInvoiceDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  totalRevenue: number;
  paidAmount: number;
  unpaidAmount: number;
  overdueAmount: number;
  monthlyRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  draftInvoices: number;
  averageInvoiceValue: number;
  topClients: Array<{
    id: string;
    name: string;
    company?: string;
    totalAmount: number;
    totalInvoices: number;
  }>;
  monthlyData: Array<{
    month: string;
    revenue: number;
    invoices: number;
  }>;
}

// Re-export DatabaseService with enhanced interface compatibility
export { DatabaseService };