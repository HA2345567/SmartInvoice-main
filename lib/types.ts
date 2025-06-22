// Core application types
export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
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
  totalInvoices?: number;
  totalAmount?: number;
  lastInvoiceDate?: string;
  isActive: boolean;
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

export interface CompanyData {
  name: string;
  address?: string;
  gst?: string;
  email?: string;
  phone?: string;
  logo?: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export interface PaymentLinkData {
  url: string;
  id: string;
  amount: number;
  currency: string;
  description: string;
}

export interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  lastReminderSent?: string;
}

export interface ReminderStats {
  totalOverdue: number;
  totalAmount: number;
  averageDaysOverdue: number;
  recommendations: string[];
}

export interface CreateInvoiceRequest {
  invoiceNumber?: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientAddress?: string;
  clientGST?: string;
  clientCurrency?: string;
  date?: string;
  dueDate?: string;
  items: Array<{
    id?: string;
    description: string;
    quantity: number;
    rate: number;
    amount?: number;
  }>;
  notes?: string;
  terms?: string;
  taxRate?: number;
  discountRate?: number;
  status?: 'draft' | 'sent' | 'paid' | 'overdue';
  paymentLink?: string;
}

export interface CreateClientRequest {
  name: string;
  email: string;
  company?: string;
  address: string;
  gstNumber?: string;
  currency?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  isActive?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  company?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
  userNotFound?: boolean;
  userExists?: boolean;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Database specific types
export interface DatabaseUser extends User {
  password: string;
}

export interface DatabaseInvoice extends Omit<Invoice, 'items'> {
  items: string; // JSON string in database
}

export interface DatabaseClient extends Client {
  // Additional database-specific fields if needed
}

// Environment configuration types
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  JWT_SECRET: string;
  EMAIL_HOST?: string;
  EMAIL_PORT?: string;
  EMAIL_SECURE?: string;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  EMAIL_FROM?: string;
  NEXT_PUBLIC_APP_URL?: string;
}

// Utility types
export type StatusType = 'draft' | 'sent' | 'paid' | 'overdue';
export type CurrencyType = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  status?: StatusType;
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  search?: string;
} 