// @ts-ignore
// If you see a 'Cannot find module \"pg\"' error, run: npm install pg
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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
  items: string; // JSON string
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

let dbPromise: Promise<any> | null = null;

export class DatabaseService {
  private static async getDb(): Promise<any> {
    if (!dbPromise) {
      dbPromise = this.initializeDatabase();
    }
    return dbPromise;
  }

  private static async initializeDatabase(): Promise<any> {
    const dbPath = path.join(process.cwd(), 'data', 'smartinvoice.db');
    
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const client = await pool.connect();
    try {
      await this.initializeTables(client);
      return client;
    } finally {
      client.release();
    }
  }

  private static async initializeTables(client: any): Promise<void> {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        company TEXT,
        avatar TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Create clients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT,
        address TEXT NOT NULL,
        gstNumber TEXT,
        currency TEXT NOT NULL DEFAULT 'USD',
        isActive BOOLEAN NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(userId, email)
      )
    `);

    // Create invoices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        invoiceNumber TEXT NOT NULL,
        clientId TEXT NOT NULL,
        clientName TEXT NOT NULL,
        clientEmail TEXT NOT NULL,
        clientCompany TEXT,
        clientAddress TEXT NOT NULL,
        clientGST TEXT,
        clientCurrency TEXT NOT NULL DEFAULT '$',
        amount REAL NOT NULL,
        subtotal REAL NOT NULL,
        taxAmount REAL NOT NULL DEFAULT 0,
        discountAmount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'draft',
        date TEXT NOT NULL,
        dueDate TEXT NOT NULL,
        paidDate TEXT,
        paymentMethod TEXT,
        paymentNotes TEXT,
        items TEXT NOT NULL,
        notes TEXT,
        terms TEXT,
        taxRate REAL NOT NULL DEFAULT 0,
        discountRate REAL NOT NULL DEFAULT 0,
        paymentLink TEXT,
        emailSent BOOLEAN NOT NULL DEFAULT 0,
        remindersSent INTEGER NOT NULL DEFAULT 0,
        lastReminderSent TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (clientId) REFERENCES clients (id) ON DELETE CASCADE,
        UNIQUE(userId, invoiceNumber)
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_userId ON invoices(userId);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
      CREATE INDEX IF NOT EXISTS idx_invoices_dueDate ON invoices(dueDate);
      CREATE INDEX IF NOT EXISTS idx_clients_userId ON clients(userId);
      CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
    `);

    console.log('Database tables initialized successfully');
  }

  // User operations
  static async createUser(userData: {
    email: string;
    password: string;
    name: string;
    company?: string;
  }): Promise<{ user: any; exists: boolean }> {
    const client = await pool.connect();
    try {
      // Check if user exists
      const res = await client.query('SELECT * FROM users WHERE email = $1', [userData.email.toLowerCase()]);
      if (res.rows.length > 0) {
        const { password, ...userWithoutPassword } = res.rows[0];
        return { user: userWithoutPassword, exists: true };
      }

      const user = {
        id: uuidv4(),
        email: userData.email.toLowerCase(),
        password: userData.password,
        name: userData.name,
        company: userData.company,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await client.query(
        `INSERT INTO users (id, email, password, name, company, createdAt, updatedAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user.id, user.email, user.password, user.name, user.company, user.createdAt, user.updatedAt]
      );

      const { password, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, exists: false };
    } finally {
      client.release();
    }
  }

  static async getUserByEmail(email: string): Promise<any | null> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      return res.rows[0] || null;
    } finally {
      client.release();
    }
  }

  static async getUserById(id: string): Promise<any | null> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      if (res.rows[0]) {
        const { password, ...userWithoutPassword } = res.rows[0];
        return userWithoutPassword;
      }
      return null;
    } finally {
      client.release();
    }
  }

  // Client operations
  static async createClient(userId: string, clientData: Omit<Client, 'id' | 'userId' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const client = {
      id: uuidv4(),
      userId,
      ...clientData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const db = await pool.connect();
    try {
      await db.query(
        `INSERT INTO clients (id, userId, name, email, company, address, gstNumber, currency, isActive, createdAt, updatedAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [client.id, client.userId, client.name, client.email, client.company, client.address, client.gstNumber, client.currency, client.isActive, client.createdAt, client.updatedAt]
      );
      return client;
    } finally {
      db.release();
    }
  }

  static async getClients(userId: string): Promise<any[]> {
    const db = await pool.connect();
    try {
      const res = await db.query('SELECT * FROM clients WHERE userId = $1', [userId]);
      return res.rows;
    } finally {
      db.release();
    }
  }

  static async getClientById(userId: string, id: string): Promise<Client | null> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM clients WHERE id = $1 AND userId = $2', [id, userId]);
      return res.rows[0] || null;
    } finally {
      client.release();
    }
  }

  static async updateClient(userId: string, id: string, updates: Partial<Client>): Promise<Client | null> {
    const client = await pool.connect();
    try {
      const setClause = Object.keys(updates).map(key => `${key} = $${Object.keys(updates).indexOf(key) + 1}`).join(', ');
      const values = [...Object.values(updates), new Date().toISOString(), id, userId];
      
      await client.query(
        `UPDATE clients SET ${setClause}, updatedAt = $${values.length - 2} WHERE id = $${values.length - 1} AND userId = $${values.length}`,
        values
      );

      return await this.getClientById(userId, id);
    } finally {
      client.release();
    }
  }

  static async deleteClient(userId: string, id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const res = await client.query('DELETE FROM clients WHERE id = $1 AND userId = $2', [id, userId]);
      return res.rowCount > 0;
    } finally {
      client.release();
    }
  }

  static async clientHasInvoices(userId: string, clientId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT COUNT(*) as count FROM invoices WHERE clientId = $1 AND userId = $2', [clientId, userId]);
      return res.rows[0].count > 0;
    } finally {
      client.release();
    }
  }

  // Invoice operations
  static async createInvoice(userId: string, invoiceData: any): Promise<any> {
    const invoice = {
      id: uuidv4(),
      userId,
      ...invoiceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const db = await pool.connect();
    try {
      await db.query(
        `INSERT INTO invoices (id, userId, invoiceNumber, clientId, clientName, clientEmail, clientCompany, clientAddress, clientGST, clientCurrency, amount, subtotal, taxAmount, discountAmount, status, date, dueDate, paidDate, paymentMethod, paymentNotes, items, notes, terms, taxRate, discountRate, paymentLink, emailSent, remindersSent, lastReminderSent, createdAt, updatedAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)`,
        [invoice.id, invoice.userId, invoice.invoiceNumber, invoice.clientId, invoice.clientName, invoice.clientEmail, invoice.clientCompany, invoice.clientAddress, invoice.clientGST, invoice.clientCurrency, invoice.amount, invoice.subtotal, invoice.taxAmount, invoice.discountAmount, invoice.status, invoice.date, invoice.dueDate, invoice.paidDate, invoice.paymentMethod, invoice.paymentNotes, invoice.items, invoice.notes, invoice.terms, invoice.taxRate, invoice.discountRate, invoice.paymentLink, invoice.emailSent, invoice.remindersSent, invoice.lastReminderSent, invoice.createdAt, invoice.updatedAt]
      );
      return invoice;
    } finally {
      db.release();
    }
  }

  static async getInvoices(userId: string): Promise<any[]> {
    const db = await pool.connect();
    try {
      const res = await db.query('SELECT * FROM invoices WHERE userId = $1', [userId]);
      return res.rows;
    } finally {
      db.release();
    }
  }

  static async getInvoiceById(userId: string, id: string): Promise<any | null> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM invoices WHERE id = $1 AND userId = $2', [id, userId]);
      if (!res.rows[0]) return null;

      const parsedInvoice = {
        ...res.rows[0],
        items: JSON.parse(res.rows[0].items),
        emailSent: Boolean(res.rows[0].emailSent)
      };

      // Auto-update overdue status
      if (parsedInvoice.status === 'sent') {
        const dueDate = new Date(parsedInvoice.dueDate);
        const today = new Date();
        if (dueDate < today) {
          parsedInvoice.status = 'overdue';
          await this.updateInvoice(userId, id, { status: 'overdue' });
        }
      }

      return parsedInvoice;
    } finally {
      client.release();
    }
  }

  static async updateInvoice(userId: string, id: string, updates: any): Promise<any | null> {
    const client = await pool.connect();
    try {
      const updateData = { ...updates, updatedAt: new Date().toISOString() };
      
      // Handle items serialization
      if (updateData.items) {
        updateData.items = JSON.stringify(updateData.items);
      }

      const setClause = Object.keys(updateData).map(key => `${key} = $${Object.keys(updateData).indexOf(key) + 1}`).join(', ');
      const values = [...Object.values(updateData), id, userId];
      
      await client.query(
        `UPDATE invoices SET ${setClause} WHERE id = $${values.length - 2} AND userId = $${values.length - 1}`,
        values
      );

      return await this.getInvoiceById(userId, id);
    } finally {
      client.release();
    }
  }

  static async deleteInvoice(userId: string, id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const res = await client.query('DELETE FROM invoices WHERE id = $1 AND userId = $2', [id, userId]);
      return res.rowCount > 0;
    } finally {
      client.release();
    }
  }

  // Helper methods
  private static async getOrCreateClientId(userId: string, email: string, clientData?: any): Promise<string> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT id FROM clients WHERE email = $1 AND userId = $2', [email, userId]);
      if (res.rows.length > 0) {
        return res.rows[0].id;
      }

      if (clientData) {
        const client = await this.createClient(userId, clientData);
        return client.id;
      }

      return uuidv4();
    } finally {
      client.release();
    }
  }

  static generateInvoiceNumber(userId: string): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  // Analytics
  static async getAnalytics(userId: string): Promise<any> {
    const db = await pool.connect();
    try {
      const invoicesRes = await db.query('SELECT * FROM invoices WHERE userId = $1', [userId]);
      const clientsRes = await db.query('SELECT * FROM clients WHERE userId = $1', [userId]);
      const invoices = invoicesRes.rows;
      const clients = clientsRes.rows;

      const totalRevenue = invoices.filter((inv: any) => inv.status === 'paid').reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
      const paidAmount = totalRevenue;
      const unpaidAmount = invoices.filter((inv: any) => inv.status === 'sent').reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
      const overdueAmount = invoices.filter((inv: any) => inv.status === 'overdue').reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = invoices.filter((inv: any) => {
        const invoiceDate = new Date(inv.date);
        return inv.status === 'paid' && invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
      }).reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
      // Generate monthly data for the last 6 months
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const monthInvoices = invoices.filter((inv: any) => {
          const invoiceDate = new Date(inv.date);
          return invoiceDate.getMonth() === date.getMonth() && invoiceDate.getFullYear() === date.getFullYear() && inv.status === 'paid';
        });
        monthlyData.push({
          month,
          revenue: monthInvoices.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0),
          invoices: monthInvoices.length,
        });
      }
      const paidInvoices = invoices.filter((i: any) => i.status === 'paid').length;
      const unpaidInvoices = invoices.filter((i: any) => i.status === 'sent').length;
      const overdueInvoices = invoices.filter((i: any) => i.status === 'overdue').length;
      const draftInvoices = invoices.filter((i: any) => i.status === 'draft').length;
      return {
        totalRevenue,
        paidAmount,
        unpaidAmount,
        overdueAmount,
        monthlyRevenue,
        totalInvoices: invoices.length,
        paidInvoices,
        unpaidInvoices,
        overdueInvoices,
        draftInvoices,
        averageInvoiceValue: paidInvoices > 0 ? totalRevenue / paidInvoices : 0,
        topClients: clients.sort((a: any, b: any) => (b.totalAmount || 0) - (a.totalAmount || 0)).slice(0, 5),
        monthlyData,
      };
    } finally {
      db.release();
    }
  }

  // Export functions
  static async exportInvoicesCSV(userId: string): Promise<string> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT * FROM invoices 
        WHERE userId = $1 
        ORDER BY createdAt DESC
      `, [userId]);

      const headers = [
        'Invoice Number', 'Client Name', 'Client Email', 'Client Company',
        'Amount', 'Currency', 'Status', 'Invoice Date', 'Due Date', 'Paid Date',
        'Payment Method', 'Tax Rate (%)', 'Discount Rate (%)', 'Subtotal',
        'Tax Amount', 'Discount Amount', 'Notes', 'Terms', 'Created Date', 'Updated Date'
      ];
      
      const rows = res.rows.map((invoice: any) => [
        invoice.invoiceNumber || '',
        invoice.clientName || '',
        invoice.clientEmail || '',
        invoice.clientCompany || '',
        (invoice.amount || 0).toFixed(2),
        invoice.clientCurrency || '$',
        invoice.status || '',
        invoice.date || '',
        invoice.dueDate || '',
        invoice.paidDate || '',
        invoice.paymentMethod || '',
        (invoice.taxRate || 0).toString(),
        (invoice.discountRate || 0).toString(),
        (invoice.subtotal || 0).toFixed(2),
        (invoice.taxAmount || 0).toFixed(2),
        (invoice.discountAmount || 0).toFixed(2),
        (invoice.notes || '').replace(/"/g, '""'),
        (invoice.terms || '').replace(/"/g, '""'),
        invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '',
        invoice.updatedAt ? new Date(invoice.updatedAt).toLocaleDateString() : ''
      ]);
      
      return [headers, ...rows]
        .map((row: any[]) => row.map((field: unknown) => `"${String(field)}"`).join(','))
        .join('\n');
    } finally {
      client.release();
    }
  }

  static async exportClientsCSV(userId: string): Promise<string> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT * FROM clients 
        WHERE userId = $1
      `, [userId]);

      const headers = [
        'Name', 'Email', 'Company', 'Address', 'GST/VAT Number', 'Currency',
        'Total Invoices', 'Total Amount', 'Last Invoice Date', 'Status',
        'Created Date', 'Updated Date'
      ];
      
      const rows = res.rows.map((client: any) => [
        client.name || '',
        client.email || '',
        client.company || '',
        (client.address || '').replace(/\n/g, ' ').replace(/"/g, '""'),
        client.gstNumber || '',
        client.currency || '',
        (client.totalInvoices || 0).toString(),
        (client.totalAmount || 0).toFixed(2),
        client.lastInvoiceDate || '',
        client.isActive ? 'Active' : 'Inactive',
        client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '',
        client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : ''
      ]);
      
      return [headers, ...rows]
        .map((row: any[]) => row.map((field: unknown) => `"${String(field)}"`).join(','))
        .join('\n');
    } finally {
      client.release();
    }
  }
}