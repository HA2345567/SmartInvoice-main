import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

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

let dbPromise: Promise<Database> | null = null;

export class DatabaseService {
  private static async getDb(): Promise<Database> {
    if (!dbPromise) {
      dbPromise = this.initializeDatabase();
    }
    return dbPromise;
  }

  private static async initializeDatabase(): Promise<Database> {
    const dbPath = path.join(process.cwd(), 'data', 'smartinvoice.db');
    
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await db.exec('PRAGMA busy_timeout = 5000');

    await this.initializeTables(db);
    return db;
  }

  private static async initializeTables(database: Database): Promise<void> {
    // Create users table
    await database.exec(`
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
    await database.exec(`
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
    await database.exec(`
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
    await database.exec(`
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
    const database = await this.getDb();
    
    // Check if user exists
    const existingUser = await database.get(
      'SELECT * FROM users WHERE email = ?',
      [userData.email.toLowerCase()]
    );

    if (existingUser) {
      const { password, ...userWithoutPassword } = existingUser;
      return { user: userWithoutPassword, exists: true };
    }

    const user = {
      id: uuidv4(),
      email: userData.email.toLowerCase(),
      password: userData.password, // Should be hashed in production
      name: userData.name,
      company: userData.company,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await database.run(
      `INSERT INTO users (id, email, password, name, company, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.email, user.password, user.name, user.company, user.createdAt, user.updatedAt]
    );

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, exists: false };
  }

  static async getUserByEmail(email: string): Promise<any | null> {
    const database = await this.getDb();
    return await database.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  }

  static async getUserById(id: string): Promise<any | null> {
    const database = await this.getDb();
    const user = await database.get('SELECT * FROM users WHERE id = ?', [id]);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  // Client operations
  static async createClient(userId: string, clientData: Omit<Client, 'id' | 'userId' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const database = await this.getDb();
    
    const client: Client = {
      id: uuidv4(),
      userId,
      ...clientData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await database.run(
      `INSERT INTO clients (id, userId, name, email, company, address, gstNumber, currency, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [client.id, client.userId, client.name, client.email, client.company, client.address, 
       client.gstNumber, client.currency, client.isActive, client.createdAt, client.updatedAt]
    );

    return client;
  }

  static async getClients(userId: string): Promise<any[]> {
    const database = await this.getDb();
    
    const clients = await database.all(`
      SELECT c.*,
             COUNT(i.id) as totalInvoices,
             COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as totalAmount,
             MAX(i.date) as lastInvoiceDate
      FROM clients c
      LEFT JOIN invoices i ON c.id = i.clientId
      WHERE c.userId = ?
      GROUP BY c.id
      ORDER BY totalAmount DESC
    `, [userId]);

    return clients;
  }

  static async getClientById(userId: string, id: string): Promise<Client | null> {
    const database = await this.getDb();
    const result = await database.get('SELECT * FROM clients WHERE id = ? AND userId = ?', [id, userId]);
    return result ?? null;
  }

  static async updateClient(userId: string, id: string, updates: Partial<Client>): Promise<Client | null> {
    const database = await this.getDb();
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), new Date().toISOString(), id, userId];
    
    await database.run(
      `UPDATE clients SET ${setClause}, updatedAt = ? WHERE id = ? AND userId = ?`,
      values
    );

    return await this.getClientById(userId, id);
  }

  static async deleteClient(userId: string, id: string): Promise<boolean> {
    const database = await this.getDb();
    
    const result = await database.run(
      'DELETE FROM clients WHERE id = ? AND userId = ?',
      [id, userId]
    );

    return result.changes! > 0;
  }

  static async clientHasInvoices(userId: string, clientId: string): Promise<boolean> {
    const database = await this.getDb();
    
    const result = await database.get(
      'SELECT COUNT(*) as count FROM invoices WHERE clientId = ? AND userId = ?',
      [clientId, userId]
    );

    return result.count > 0;
  }

  // Invoice operations
  static async createInvoice(userId: string, invoiceData: any): Promise<any> {
    const database = await this.getDb();
    
    // Get or create client
    let clientId = await this.getOrCreateClientId(userId, invoiceData.clientEmail, {
      name: invoiceData.clientName,
      email: invoiceData.clientEmail,
      company: invoiceData.clientCompany,
      address: invoiceData.clientAddress,
      gstNumber: invoiceData.clientGST,
      currency: invoiceData.clientCurrency,
    });

    const invoice = {
      id: uuidv4(),
      userId,
      clientId,
      ...invoiceData,
      items: JSON.stringify(invoiceData.items),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await database.run(`
      INSERT INTO invoices (
        id, userId, invoiceNumber, clientId, clientName, clientEmail, clientCompany,
        clientAddress, clientGST, clientCurrency, amount, subtotal, taxAmount, discountAmount,
        status, date, dueDate, items, notes, terms, taxRate, discountRate, paymentLink,
        emailSent, remindersSent, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoice.id, invoice.userId, invoice.invoiceNumber, invoice.clientId, invoice.clientName,
      invoice.clientEmail, invoice.clientCompany, invoice.clientAddress, invoice.clientGST,
      invoice.clientCurrency, invoice.amount, invoice.subtotal, invoice.taxAmount,
      invoice.discountAmount, invoice.status, invoice.date, invoice.dueDate, invoice.items,
      invoice.notes, invoice.terms, invoice.taxRate, invoice.discountRate, invoice.paymentLink,
      invoice.emailSent, invoice.remindersSent, invoice.createdAt, invoice.updatedAt
    ]);

    // Parse items back to object for return
    const returnInvoice = { ...invoice, items: invoiceData.items };
    return returnInvoice;
  }

  static async getInvoices(userId: string): Promise<any[]> {
    const database = await this.getDb();
    
    const invoices = await database.all(`
      SELECT * FROM invoices 
      WHERE userId = ? 
      ORDER BY createdAt DESC
    `, [userId]);

    // Parse items JSON and update overdue status
    const today = new Date();
    return invoices.map(invoice => {
      const parsedInvoice = {
        ...invoice,
        items: JSON.parse(invoice.items),
        emailSent: Boolean(invoice.emailSent)
      };

      // Auto-update overdue status
      if (parsedInvoice.status === 'sent') {
        const dueDate = new Date(parsedInvoice.dueDate);
        if (dueDate < today) {
          parsedInvoice.status = 'overdue';
          // Update in database asynchronously
          this.updateInvoice(userId, invoice.id, { status: 'overdue' });
        }
      }

      return parsedInvoice;
    });
  }

  static async getInvoiceById(userId: string, id: string): Promise<any | null> {
    const database = await this.getDb();
    
    const invoice = await database.get(
      'SELECT * FROM invoices WHERE id = ? AND userId = ?',
      [id, userId]
    );

    if (!invoice) return null;

    const parsedInvoice = {
      ...invoice,
      items: JSON.parse(invoice.items),
      emailSent: Boolean(invoice.emailSent)
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
  }

  static async updateInvoice(userId: string, id: string, updates: any): Promise<any | null> {
    const database = await this.getDb();
    
    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    
    // Handle items serialization
    if (updateData.items) {
      updateData.items = JSON.stringify(updateData.items);
    }

    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id, userId];
    
    await database.run(
      `UPDATE invoices SET ${setClause} WHERE id = ? AND userId = ?`,
      values
    );

    return await this.getInvoiceById(userId, id);
  }

  static async deleteInvoice(userId: string, id: string): Promise<boolean> {
    const database = await this.getDb();
    
    const result = await database.run(
      'DELETE FROM invoices WHERE id = ? AND userId = ?',
      [id, userId]
    );

    return result.changes! > 0;
  }

  // Helper methods
  private static async getOrCreateClientId(userId: string, email: string, clientData?: any): Promise<string> {
    const database = await this.getDb();
    
    const existingClient = await database.get(
      'SELECT id FROM clients WHERE email = ? AND userId = ?',
      [email, userId]
    );

    if (existingClient) {
      return existingClient.id;
    }

    if (clientData) {
      const client = await this.createClient(userId, clientData);
      return client.id;
    }

    return uuidv4();
  }

  static generateInvoiceNumber(userId: string): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  // Analytics
  static async getAnalytics(userId: string): Promise<any> {
    const database = await this.getDb();
    
    const invoices = await this.getInvoices(userId);
    const clients = await this.getClients(userId);

    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const paidAmount = totalRevenue;
    const unpaidAmount = invoices
      .filter(inv => inv.status === 'sent')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const overdueAmount = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyRevenue = invoices
      .filter(inv => {
        const invoiceDate = new Date(inv.date);
        return inv.status === 'paid' && 
               invoiceDate.getMonth() === currentMonth && 
               invoiceDate.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    // Generate monthly data for the last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthInvoices = invoices.filter(inv => {
        const invoiceDate = new Date(inv.date);
        return invoiceDate.getMonth() === date.getMonth() && 
               invoiceDate.getFullYear() === date.getFullYear() &&
               inv.status === 'paid';
      });
      
      monthlyData.push({
        month,
        revenue: monthInvoices.reduce((sum, inv) => sum + inv.amount, 0),
        invoices: monthInvoices.length,
      });
    }

    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    const unpaidInvoices = invoices.filter(i => i.status === 'sent').length;
    const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
    const draftInvoices = invoices.filter(i => i.status === 'draft').length;

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
      topClients: clients
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5),
      monthlyData,
    };
  }

  // Export functions
  static async exportInvoicesCSV(userId: string): Promise<string> {
    const invoices = await this.getInvoices(userId);
    
    const headers = [
      'Invoice Number', 'Client Name', 'Client Email', 'Client Company',
      'Amount', 'Currency', 'Status', 'Invoice Date', 'Due Date', 'Paid Date',
      'Payment Method', 'Tax Rate (%)', 'Discount Rate (%)', 'Subtotal',
      'Tax Amount', 'Discount Amount', 'Notes', 'Terms', 'Created Date', 'Updated Date'
    ];
    
    const rows = invoices.map(invoice => [
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
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }

  static async exportClientsCSV(userId: string): Promise<string> {
    const clients = await this.getClients(userId);
    
    const headers = [
      'Name', 'Email', 'Company', 'Address', 'GST/VAT Number', 'Currency',
      'Total Invoices', 'Total Amount', 'Last Invoice Date', 'Status',
      'Created Date', 'Updated Date'
    ];
    
    const rows = clients.map(client => [
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
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }
}