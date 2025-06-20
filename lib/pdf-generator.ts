// professional-invoice-generator.ts

import jsPDF from 'jspdf';
import { format } from 'date-fns';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  note?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientAddress: string;
  clientGST?: string;
  clientCurrency: string;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  amount: number;
  taxRate: number;
  discountRate: number;
  paymentLink?: string;
  companyName?: string;
  companyAddress?: string;
  companyGST?: string;
  companyEmail?: string;
  companyPhone?: string;
  invoiceStatus?: 'PAID' | 'DUE' | 'OVERDUE';
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
  }

  generatePDF(invoiceData: InvoiceData): Uint8Array {
    try {
      this.doc.setProperties({
        title: `Invoice #${invoiceData.invoiceNumber}`,
        subject: 'Invoice Document',
        author: invoiceData.companyName || 'SmartInvoice',
        keywords: 'invoice, billing, payment',
        creator: 'SmartInvoice PDF Generator'
      });

      // Set white background
      this.doc.setFillColor(255, 255, 255);
      this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

      // Add all sections
      this.addPremiumHeader(invoiceData);
      this.addInvoiceInfo(invoiceData);
      this.addClientInfo(invoiceData);
      this.addPremiumTable(invoiceData);
      this.addTotalsSection(invoiceData);
      this.addFooterSection(invoiceData);

      // Return the PDF as Uint8Array
      return this.doc.output('arraybuffer') as Uint8Array;
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  private addPremiumHeader(data: InvoiceData) {
    // Header background
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(0, 0, this.pageWidth, 60, 'F');

    // Company logo circle
    this.doc.setFillColor(34, 197, 94); // Green color
    this.doc.circle(35, 30, 18, 'F');

    // Company initials
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    const initials = (data.companyName || 'SI').substring(0, 2).toUpperCase();
    this.doc.text(initials, 35, 33, { align: 'center' });

    // Company name
    this.doc.setFontSize(24);
    this.doc.setTextColor(15, 23, 42);
    this.doc.text(data.companyName || 'SmartInvoice', 60, 25);

    // Company tagline
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 116, 139);
    this.doc.text('Professional Invoice Management', 60, 35);

    // Company contact info
    if (data.companyEmail) this.doc.text(data.companyEmail, 60, 43);
    if (data.companyPhone) this.doc.text(data.companyPhone, 60, 50);

    // Invoice title
    this.doc.setFontSize(32);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(15, 23, 42);
    this.doc.text('INVOICE', this.pageWidth - 20, 35, { align: 'right' });

    // Status badge
    if (data.invoiceStatus) {
      const colorMap = {
        PAID: [16, 185, 129],
        DUE: [234, 179, 8],
        OVERDUE: [239, 68, 68]
      }[data.invoiceStatus];
      
      if (colorMap) {
        this.doc.setFillColor(...(colorMap as [number, number, number]));
        this.doc.roundedRect(this.pageWidth - 60, 20, 40, 10, 2, 2, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(8);
        this.doc.text(data.invoiceStatus, this.pageWidth - 40, 27, { align: 'center' });
      }
    }

    // Header separator line
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.5);
    this.doc.line(0, 60, this.pageWidth, 60);
  }

  private addInvoiceInfo(data: InvoiceData) {
    const startY = 75;
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(15, 23, 42);
    this.doc.text('Invoice Details', this.margin, startY);

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 116, 139);

    const details = [
      ['Invoice Number:', data.invoiceNumber],
      ['Invoice Date:', format(new Date(data.date), 'MMM dd, yyyy')],
      ['Due Date:', format(new Date(data.dueDate), 'MMM dd, yyyy')],
      ['Currency:', data.clientCurrency]
    ];

    details.forEach(([label, value], index) => {
      const y = startY + 15 + (index * 8);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, this.margin, y);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(value, this.margin + 35, y);
    });
  }

  private addClientInfo(data: InvoiceData) {
    const startY = 75;
    const rightX = this.pageWidth - this.margin;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(15, 23, 42);
    this.doc.text('Bill To:', rightX, startY, { align: 'right' });

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(34, 197, 94); // Green color
    this.doc.text(data.clientName, rightX, startY + 12, { align: 'right' });

    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 116, 139);

    const clientInfo = [];
    if (data.clientCompany) clientInfo.push(data.clientCompany);
    if (data.clientEmail) clientInfo.push(data.clientEmail);
    if (data.clientAddress) {
      // Split address by newlines and add each line
      const addressLines = data.clientAddress.split('\n');
      clientInfo.push(...addressLines);
    }
    if (data.clientGST) clientInfo.push(`GST: ${data.clientGST}`);

    clientInfo.forEach((info, index) => {
      this.doc.text(info, rightX, startY + 22 + (index * 8), { align: 'right' });
    });
  }

  private addPremiumTable(data: InvoiceData) {
    const startY = 140;
    const tableWidth = this.pageWidth - (2 * this.margin);
    const rowHeight = 12;

    // Table header
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(this.margin, startY, tableWidth, rowHeight, 'F');

    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, startY, tableWidth, rowHeight);

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(71, 85, 105);

    const headers = ['Description', 'Qty', 'Rate', 'Amount'];
    const columnWidths = [tableWidth * 0.5, tableWidth * 0.15, tableWidth * 0.175, tableWidth * 0.175];
    let currentX = this.margin;

    headers.forEach((header, index) => {
      this.doc.text(header, currentX + 5, startY + 8);
      currentX += columnWidths[index];
    });

    // Table rows
    let currentY = startY + rowHeight;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(51, 65, 85);

    data.items.forEach((item, index) => {
      // Alternate row colors
      if (index % 2 === 1) {
        this.doc.setFillColor(249, 250, 251);
        this.doc.rect(this.margin, currentY, tableWidth, rowHeight, 'F');
      }

      // Row border
      this.doc.setDrawColor(226, 232, 240);
      this.doc.rect(this.margin, currentY, tableWidth, rowHeight);

      currentX = this.margin;
      const values = [
        item.description,
        item.quantity.toString(),
        `${data.clientCurrency}${item.rate.toFixed(2)}`,
        `${data.clientCurrency}${item.amount.toFixed(2)}`
      ];

      values.forEach((value, colIndex) => {
        const align = colIndex === 0 ? 'left' : 'right';
        const textX = align === 'left' ? currentX + 5 : currentX + columnWidths[colIndex] - 5;
        this.doc.text(value, textX, currentY + 8, { align });
        currentX += columnWidths[colIndex];
      });

      currentY += rowHeight;
    });
  }

  private addTotalsSection(data: InvoiceData) {
    const startY = 140 + (data.items.length + 1) * 12 + 20;
    const rightX = this.pageWidth - this.margin;
    const labelWidth = 40;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 116, 139);

    const totals = [];
    
    // Add subtotal
    totals.push(['Subtotal:', `${data.clientCurrency}${data.subtotal.toFixed(2)}`]);
    
    // Add discount if applicable
    if (data.discountAmount > 0) {
      totals.push([`Discount (${data.discountRate}%):`, `-${data.clientCurrency}${data.discountAmount.toFixed(2)}`]);
    }
    
    // Add tax if applicable
    if (data.taxAmount > 0) {
      totals.push([`Tax (${data.taxRate}%):`, `${data.clientCurrency}${data.taxAmount.toFixed(2)}`]);
    }

    totals.forEach(([label, value], index) => {
      const y = startY + (index * 10);
      this.doc.text(label, rightX - labelWidth - 50, y);
      this.doc.text(value, rightX, y, { align: 'right' });
    });

    // Total amount
    const totalY = startY + (totals.length * 10) + 5;
    this.doc.setDrawColor(226, 232, 240);
    this.doc.line(rightX - labelWidth - 50, totalY - 2, rightX, totalY - 2);

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(15, 23, 42);
    this.doc.text('Total:', rightX - labelWidth - 50, totalY + 8);
    
    // Highlight total amount in green
    this.doc.setTextColor(34, 197, 94);
    this.doc.text(`${data.clientCurrency}${data.amount.toFixed(2)}`, rightX, totalY + 8, { align: 'right' });
  }

  private addFooterSection(data: InvoiceData) {
    const footerY = this.pageHeight - 80;

    // Notes section
    if (data.notes) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(71, 85, 105);
      this.doc.text('Notes:', this.margin, footerY);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 116, 139);
      const noteLines = this.doc.splitTextToSize(data.notes, this.pageWidth - (2 * this.margin));
      this.doc.text(noteLines, this.margin, footerY + 8);
    }

    // Terms section
    if (data.terms) {
      const termsY = footerY + (data.notes ? 25 : 0);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(71, 85, 105);
      this.doc.text('Terms & Conditions:', this.margin, termsY);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 116, 139);
      const termLines = this.doc.splitTextToSize(data.terms, this.pageWidth - (2 * this.margin));
      this.doc.text(termLines, this.margin, termsY + 8);
    }

    // Footer line
    this.doc.setDrawColor(226, 232, 240);
    this.doc.line(this.margin, this.pageHeight - 30, this.pageWidth - this.margin, this.pageHeight - 30);

    // Footer text
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(148, 163, 184);
    this.doc.text('Generated by SmartInvoice - Professional Invoice Management', this.pageWidth / 2, this.pageHeight - 20, { align: 'center' });
    
    // Payment link if provided
    if (data.paymentLink) {
      this.doc.setTextColor(34, 197, 94);
      this.doc.text(`Pay online: ${data.paymentLink}`, this.pageWidth / 2, this.pageHeight - 12, { align: 'center' });
    }
  }
}