import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
  items: any[];
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

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  company?: string;
  address: string;
  gstNumber?: string;
  currency: string;
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

export class DatabaseService {
  // User operations
  static async createUser(userData: {
    email: string;
    password: string;
    name: string;
    company?: string;
  }): Promise<{ user: any; exists: boolean }> {
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email.toLowerCase())
        .single();

      if (existingUser) {
        const { password, ...userWithoutPassword } = existingUser;
        return { user: userWithoutPassword, exists: true };
      }

      const user = {
        id: crypto.randomUUID(),
        email: userData.email.toLowerCase(),
        password: userData.password,
        name: userData.name,
        company: userData.company,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users')
        .insert([user])
        .select()
        .single();

      if (error) throw error;

      const { password, ...userWithoutPassword } = data;
      return { user: userWithoutPassword, exists: false };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUserByEmail(email: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error) return null;
    return data;
  }

  static async getUserById(id: string): Promise<any | null> {
    console.log('Looking for user with ID:', id);
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, company, avatar, createdat, updatedat, company_address, company_gst, company_phone, company_website')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Database error when getting user by ID:', error);
      return null;
    }
    
    if (!data) {
      console.log('No user found with ID:', id);
      return null;
    }
    
    console.log('User found:', data.email);
    
    // Transform to camelCase for consistency
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      company: data.company,
      companyAddress: data.company_address,
      companyGST: data.company_gst,
      companyPhone: data.company_phone,
      companyWebsite: data.company_website,
      avatar: data.avatar,
      createdAt: data.createdat,
      updatedAt: data.updatedat,
    };
  }

  static async createClient(userId: string, clientData: Omit<Client, 'id' | 'userId' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    try {
      const client = {
        id: crypto.randomUUID(),
        userid: userId,
        name: clientData.name,
        email: clientData.email.toLowerCase(),
        company: clientData.company,
        address: clientData.address,
        gstnumber: clientData.gstNumber,
        currency: clientData.currency || 'USD',
        isactive: true,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('clients')
        .insert([client])
        .select()
        .single();

      if (error) throw error;
      
      // Transform back to camelCase for consistency
      return {
        id: data.id,
        userId: data.userid,
        name: data.name,
        email: data.email,
        company: data.company,
        address: data.address,
        gstNumber: data.gstnumber,
        currency: data.currency,
        isActive: data.isactive,
        createdAt: data.createdat,
        updatedAt: data.updatedat,
      };
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  static async getClients(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('userid', userId)
        .order('createdat', { ascending: false });
      
      if (error) throw error;
      
      // Transform to camelCase
      return (data || []).map(client => ({
        id: client.id,
        userId: client.userid,
        name: client.name,
        email: client.email,
        company: client.company,
        address: client.address,
        gstNumber: client.gstnumber,
        currency: client.currency,
        isActive: client.isactive,
        createdAt: client.createdat,
        updatedAt: client.updatedat,
      }));
    } catch (error) {
      console.error('Error getting clients:', error);
      return [];
    }
  }

  static async getClientById(userId: string, id: string): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('userid', userId)
        .eq('id', id)
        .single();
      
      if (error) return null;
      
      // Transform to camelCase
      return {
        id: data.id,
        userId: data.userid,
        name: data.name,
        email: data.email,
        company: data.company,
        address: data.address,
        gstNumber: data.gstnumber,
        currency: data.currency,
        isActive: data.isactive,
        createdAt: data.createdat,
        updatedAt: data.updatedat,
      };
    } catch (error) {
      console.error('Error getting client by id:', error);
      return null;
    }
  }

  static async updateClient(userId: string, id: string, updates: any): Promise<Client | null> {
    try {
      // Transform camelCase to database column names
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.email) dbUpdates.email = updates.email.toLowerCase();
      if (updates.company) dbUpdates.company = updates.company;
      if (updates.address) dbUpdates.address = updates.address;
      if (updates.gstNumber) dbUpdates.gstnumber = updates.gstNumber;
      if (updates.currency) dbUpdates.currency = updates.currency;
      if (updates.isActive !== undefined) dbUpdates.isactive = updates.isActive;
      dbUpdates.updatedat = new Date().toISOString();

      const { data, error } = await supabase
        .from('clients')
        .update(dbUpdates)
        .eq('userid', userId)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform back to camelCase
      return {
        id: data.id,
        userId: data.userid,
        name: data.name,
        email: data.email,
        company: data.company,
        address: data.address,
        gstNumber: data.gstnumber,
        currency: data.currency,
        isActive: data.isactive,
        createdAt: data.createdat,
        updatedAt: data.updatedat,
      };
    } catch (error) {
      console.error('Error updating client:', error);
      return null;
    }
  }

  static async deleteClient(userId: string, id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('userid', userId)
        .eq('id', id);
      
      return !error;
    } catch (error) {
      console.error('Error deleting client:', error);
      return false;
    }
  }

  static async clientHasInvoices(userId: string, clientId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id')
        .eq('userid', userId)
        .eq('clientid', clientId)
        .limit(1);
      
      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking client invoices:', error);
      return false;
    }
  }

  static async createInvoice(userId: string, invoiceData: any): Promise<any> {
    try {
      const clientId = await this.getOrCreateClientId(userId, invoiceData.clientEmail, {
        name: invoiceData.clientName,
        address: invoiceData.clientAddress,
        company: invoiceData.clientCompany,
        gstNumber: invoiceData.clientGST,
        currency: invoiceData.clientCurrency
      });

      const newInvoice = {
        id: crypto.randomUUID(),
        userid: userId,
        invoicenumber: invoiceData.invoiceNumber,
        clientid: clientId,
        clientname: invoiceData.clientName,
        clientemail: invoiceData.clientEmail.toLowerCase(),
        clientcompany: invoiceData.clientCompany,
        clientaddress: invoiceData.clientAddress,
        clientgst: invoiceData.clientGST,
        clientcurrency: invoiceData.clientCurrency,
        amount: invoiceData.amount,
        subtotal: invoiceData.subtotal,
        taxamount: invoiceData.taxAmount,
        discountamount: invoiceData.discountAmount,
        status: 'draft',
        date: invoiceData.date,
        duedate: invoiceData.dueDate,
        items: invoiceData.items,
        notes: invoiceData.notes,
        terms: invoiceData.terms,
        taxrate: invoiceData.taxRate,
        discountrate: invoiceData.discountRate,
        emailsent: false,
        reminderssent: 0,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert([newInvoice])
        .select()
        .single();

      if (error) throw error;
      
      // Transform back to camelCase
      return this.transformInvoiceToCamelCase(data);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  private static async getOrCreateClientId(userId: string, email: string, clientData?: any): Promise<string> {
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('userid', userId)
        .eq('email', email.toLowerCase())
        .single();

      if (client) {
        return client.id;
      }

      const newClient = await this.createClient(userId, {
        email,
        name: clientData?.name || 'N/A',
        address: clientData?.address || 'N/A',
        company: clientData?.company,
        gstNumber: clientData?.gstNumber,
        currency: clientData?.currency || 'USD'
      });
      return newClient.id;
    } catch (error) {
      console.error('Error getting or creating client id:', error);
      throw error;
    }
  }

  private static transformInvoiceToCamelCase(data: any): any {
    return {
      id: data.id,
      userId: data.userid,
      invoiceNumber: data.invoicenumber,
      clientId: data.clientid,
      clientName: data.clientname,
      clientEmail: data.clientemail,
      clientCompany: data.clientcompany,
      clientAddress: data.clientaddress,
      clientGST: data.clientgst,
      clientCurrency: data.clientcurrency,
      amount: data.amount,
      subtotal: data.subtotal,
      taxAmount: data.taxamount,
      discountAmount: data.discountamount,
      status: data.status,
      date: data.date,
      dueDate: data.duedate,
      paidDate: data.paiddate,
      paymentMethod: data.paymentmethod,
      paymentNotes: data.paymentnotes,
      items: data.items,
      notes: data.notes,
      terms: data.terms,
      taxRate: data.taxrate,
      discountRate: data.discountrate,
      paymentLink: data.paymentlink,
      emailSent: data.emailsent,
      remindersSent: data.reminderssent,
      lastReminderSent: data.lastremindersent,
      createdAt: data.createdat,
      updatedAt: data.updatedat,
    };
  }

  static async getInvoices(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('userid', userId)
        .order('createdat', { ascending: false });
      
      if (error) throw error;
      
      // Transform to camelCase
      return (data || []).map(invoice => this.transformInvoiceToCamelCase(invoice));
    } catch (error) {
      console.error('Error getting invoices:', error);
      return [];
    }
  }

  static async getInvoiceById(userId: string, id: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('userid', userId)
        .eq('id', id)
        .single();
      
      if (error) return null;
      
      return this.transformInvoiceToCamelCase(data);
    } catch (error) {
      console.error('Error getting invoice by id:', error);
      return null;
    }
  }

  static async getPublicInvoiceById(id: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) return null;
      
      return this.transformInvoiceToCamelCase(data);
    } catch (error) {
      console.error('Error getting public invoice by id:', error);
      return null;
    }
  }

  static async updateInvoice(userId: string, id: string, updates: any): Promise<any | null> {
    try {
      // Transform camelCase to database column names
      const dbUpdates: any = {};
      if (updates.invoiceNumber) dbUpdates.invoicenumber = updates.invoiceNumber;
      if (updates.clientName) dbUpdates.clientname = updates.clientName;
      if (updates.clientEmail) dbUpdates.clientemail = updates.clientEmail.toLowerCase();
      if (updates.clientCompany) dbUpdates.clientcompany = updates.clientCompany;
      if (updates.clientAddress) dbUpdates.clientaddress = updates.clientAddress;
      if (updates.clientGST) dbUpdates.clientgst = updates.clientGST;
      if (updates.clientCurrency) dbUpdates.clientcurrency = updates.clientCurrency;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal;
      if (updates.taxAmount !== undefined) dbUpdates.taxamount = updates.taxAmount;
      if (updates.discountAmount !== undefined) dbUpdates.discountamount = updates.discountAmount;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.date) dbUpdates.date = updates.date;
      if (updates.dueDate) dbUpdates.duedate = updates.dueDate;
      if (updates.paidDate) dbUpdates.paiddate = updates.paidDate;
      if (updates.paymentMethod) dbUpdates.paymentmethod = updates.paymentMethod;
      if (updates.paymentNotes) dbUpdates.paymentnotes = updates.paymentNotes;
      if (updates.items) dbUpdates.items = updates.items;
      if (updates.notes) dbUpdates.notes = updates.notes;
      if (updates.terms) dbUpdates.terms = updates.terms;
      if (updates.taxRate !== undefined) dbUpdates.taxrate = updates.taxRate;
      if (updates.discountRate !== undefined) dbUpdates.discountrate = updates.discountRate;
      if (updates.paymentLink) dbUpdates.paymentlink = updates.paymentLink;
      if (updates.emailSent !== undefined) dbUpdates.emailsent = updates.emailSent;
      if (updates.remindersSent !== undefined) dbUpdates.reminders_sent = updates.remindersSent;
      if (updates.lastReminderSent) dbUpdates.last_reminder_sent = updates.lastReminderSent;
      dbUpdates.updatedat = new Date().toISOString();

      const { data, error } = await supabase
        .from('invoices')
        .update(dbUpdates)
        .eq('userid', userId)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return this.transformInvoiceToCamelCase(data);
    } catch (error) {
      console.error('Error updating invoice:', error);
      return null;
    }
  }

  static async deleteInvoice(userId: string, id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('userid', userId)
        .eq('id', id);
      
      return !error;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  static generateInvoiceNumber(userId: string): string {
    const prefix = 'INV-';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${timestamp}-${random}`;
  }

  static async getAnalytics(userId: string): Promise<any> {
    try {
      const { data: allInvoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('userid', userId);
      
      if (error) throw error;
      
      const invoices = (allInvoices || []).map(invoice => this.transformInvoiceToCamelCase(invoice));
      const totalRevenue = invoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + inv.amount, 0);
      
      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid').length;
      const pendingInvoices = invoices.filter((inv: any) => inv.status === 'sent' || inv.status === 'overdue').length;
      const averageInvoiceValue = totalInvoices > 0 && paidInvoices > 0 ? totalRevenue / paidInvoices : 0;
      
      const monthlyData = this.calculateMonthlyData(invoices);
      const topClients = this.calculateTopClients(invoices);
      const invoiceStatusDistribution = {
        paid: paidInvoices,
        pending: pendingInvoices,
        draft: invoices.filter((inv: any) => inv.status === 'draft').length,
        overdue: invoices.filter((inv: any) => inv.status === 'overdue').length,
      };

      return {
        totalRevenue,
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        averageInvoiceValue,
        monthlyData,
        topClients,
        invoiceStatusDistribution,
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        totalRevenue: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        averageInvoiceValue: 0,
        monthlyData: [],
        topClients: [],
        invoiceStatusDistribution: { paid: 0, pending: 0, draft: 0, overdue: 0 },
      };
    }
  }

  static calculateMonthlyData(invoices: any[]): Array<{ month: string; revenue: number; invoices: number }> {
    const monthly: { [key: string]: { revenue: number; invoices: number } } = {};
    invoices.filter((i: any) => i.status === 'paid' && i.paidDate).forEach((invoice: any) => {
      const month = new Date(invoice.paidDate).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthly[month]) {
        monthly[month] = { revenue: 0, invoices: 0 };
      }
      monthly[month].revenue += invoice.amount;
      monthly[month].invoices += 1;
    });
    return Object.entries(monthly).map(([month, data]) => ({ month, ...data }));
  }

  static calculateTopClients(invoices: any[]): Array<{ id: string; name: string; company?: string; totalAmount: number; totalInvoices: number }> {
    const clientMap: { [key: string]: { id: string, name: string; company?: string; totalAmount: number; totalInvoices: number } } = {};
    invoices.filter((i: any) => i.status === 'paid').forEach((invoice: any) => {
      if (!clientMap[invoice.clientId]) {
        clientMap[invoice.clientId] = {
          id: invoice.clientId,
          name: invoice.clientName,
          company: invoice.clientCompany,
          totalAmount: 0,
          totalInvoices: 0
        };
      }
      clientMap[invoice.clientId].totalAmount += invoice.amount;
      clientMap[invoice.clientId].totalInvoices += 1;
    });

    return Object.values(clientMap)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  }

  static async exportInvoicesCSV(userId: string): Promise<string> {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('userid', userId)
        .order('createdat', { ascending: false });
      
      if (error) throw error;
      
      if (!invoices || invoices.length === 0) {
        return '';
      }

      // Transform to camelCase for CSV export
      const transformedInvoices = invoices.map(invoice => this.transformInvoiceToCamelCase(invoice));
      const headers = Object.keys(transformedInvoices[0]).join(',');
      const rows = transformedInvoices.map((invoice: any) =>
        Object.values(invoice).map(value => {
          const strValue = String(value);
          if (strValue.includes(',')) {
            return `"${strValue}"`;
          }
          return strValue;
        }).join(',')
      ).join('\n');

      return `${headers}\n${rows}`;
    } catch (error) {
      console.error('Error exporting invoices CSV:', error);
      return '';
    }
  }

  static async exportClientsCSV(userId: string): Promise<string> {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('userid', userId)
        .order('createdat', { ascending: false });
      
      if (error) throw error;
      
      if (!clients || clients.length === 0) {
        return '';
      }

      // Transform to camelCase for CSV export
      const transformedClients = clients.map(client => ({
        id: client.id,
        userId: client.userid,
        name: client.name,
        email: client.email,
        company: client.company,
        address: client.address,
        gstNumber: client.gstnumber,
        currency: client.currency,
        isActive: client.isactive,
        createdAt: client.createdat,
        updatedAt: client.updatedat,
      }));

      const headers = Object.keys(transformedClients[0]).join(',');
      const rows = transformedClients.map((client: any) =>
        Object.values(client).map(value => {
          const strValue = String(value);
          if (strValue.includes(',')) {
            return `"${strValue}"`;
          }
          return strValue;
        }).join(',')
      ).join('\n');

      return `${headers}\n${rows}`;
    } catch (error) {
      console.error('Error exporting clients CSV:', error);
      return '';
    }
  }
} 