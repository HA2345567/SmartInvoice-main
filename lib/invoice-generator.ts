import jsPDF from 'jspdf';
import { format } from 'date-fns';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientGST: string;
  items: InvoiceItem[];
  notes: string;
  terms: string;
  includeGST: boolean;
  gstRate: number;
  includeTDS: boolean;
  tdsRate: number;
  paymentLink?: string;
  companyName?: string;
  companyAddress?: string;
  companyGST?: string;
}

export class InvoiceGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
  }

  generatePDF(invoiceData: InvoiceData): Uint8Array {
    this.addHeader(invoiceData);
    this.addInvoiceDetails(invoiceData);
    this.addClientDetails(invoiceData);
    this.addItemsTable(invoiceData);
    this.addTotals(invoiceData);
    this.addFooter(invoiceData);

    return this.doc.output('arraybuffer') as Uint8Array;
  }

  private addHeader(data: InvoiceData) {
    // Company Logo/Name
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(data.companyName || 'SmartInvoice', this.margin, 30);

    // Company Address
    if (data.companyAddress) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      const addressLines = data.companyAddress.split('\n');
      addressLines.forEach((line, index) => {
        this.doc.text(line, this.margin, 40 + (index * 5));
      });
    }

    // Invoice Title
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('INVOICE', this.pageWidth - this.margin - 50, 30);
  }

  private addInvoiceDetails(data: InvoiceData) {
    const startY = 70;
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Invoice Number:', this.pageWidth - 100, startY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.invoiceNumber, this.pageWidth - 100, startY + 8);

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Date:', this.pageWidth - 100, startY + 20);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(format(new Date(data.date), 'dd/MM/yyyy'), this.pageWidth - 100, startY + 28);

    if (data.dueDate) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Due Date:', this.pageWidth - 100, startY + 40);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(format(new Date(data.dueDate), 'dd/MM/yyyy'), this.pageWidth - 100, startY + 48);
    }
  }

  private addClientDetails(data: InvoiceData) {
    const startY = 70;
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Bill To:', this.margin, startY);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.clientName, this.margin, startY + 12);
    this.doc.text(data.clientEmail, this.margin, startY + 20);
    
    if (data.clientAddress) {
      const addressLines = data.clientAddress.split('\n');
      addressLines.forEach((line, index) => {
        this.doc.text(line, this.margin, startY + 28 + (index * 8));
      });
    }

    if (data.clientGST) {
      this.doc.text(`GST: ${data.clientGST}`, this.margin, startY + 60);
    }
  }

  private addItemsTable(data: InvoiceData) {
    const startY = 150;
    const tableWidth = this.pageWidth - (2 * this.margin);
    const colWidths = [80, 30, 30, 40]; // Description, Qty, Rate, Amount
    
    // Table Header
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin, startY, tableWidth, 12, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Description', this.margin + 2, startY + 8);
    this.doc.text('Qty', this.margin + colWidths[0] + 2, startY + 8);
    this.doc.text('Rate', this.margin + colWidths[0] + colWidths[1] + 2, startY + 8);
    this.doc.text('Amount', this.margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, startY + 8);

    // Table Rows
    let currentY = startY + 12;
    this.doc.setFont('helvetica', 'normal');
    
    data.items.forEach((item, index) => {
      const rowHeight = 12;
      
      // Alternate row colors
      if (index % 2 === 1) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(this.margin, currentY, tableWidth, rowHeight, 'F');
      }
      
      this.doc.text(item.description, this.margin + 2, currentY + 8);
      this.doc.text(item.quantity.toString(), this.margin + colWidths[0] + 2, currentY + 8);
      this.doc.text(`₹${item.rate.toFixed(2)}`, this.margin + colWidths[0] + colWidths[1] + 2, currentY + 8);
      this.doc.text(`₹${item.amount.toFixed(2)}`, this.margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, currentY + 8);
      
      currentY += rowHeight;
    });

    // Table border
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(this.margin, startY, tableWidth, currentY - startY);
  }

  private addTotals(data: InvoiceData) {
    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = data.includeGST ? (subtotal * data.gstRate) / 100 : 0;
    const tdsAmount = data.includeTDS ? (subtotal * data.tdsRate) / 100 : 0;
    const total = subtotal + gstAmount - tdsAmount;

    const startY = 200 + (data.items.length * 12);
    const rightAlign = this.pageWidth - this.margin - 60;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    // Subtotal
    this.doc.text('Subtotal:', rightAlign - 40, startY);
    this.doc.text(`₹${subtotal.toFixed(2)}`, rightAlign, startY);

    // GST
    if (data.includeGST) {
      this.doc.text(`GST (${data.gstRate}%):`, rightAlign - 40, startY + 12);
      this.doc.text(`₹${gstAmount.toFixed(2)}`, rightAlign, startY + 12);
    }

    // TDS
    if (data.includeTDS) {
      this.doc.text(`TDS (${data.tdsRate}%):`, rightAlign - 40, startY + 24);
      this.doc.text(`-₹${tdsAmount.toFixed(2)}`, rightAlign, startY + 24);
    }

    // Total
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    const totalY = startY + (data.includeGST ? 12 : 0) + (data.includeTDS ? 12 : 0) + 20;
    this.doc.text('Total:', rightAlign - 40, totalY);
    this.doc.text(`₹${total.toFixed(2)}`, rightAlign, totalY);

    // Draw line above total
    this.doc.setDrawColor(0, 0, 0);
    this.doc.line(rightAlign - 50, totalY - 5, rightAlign + 20, totalY - 5);
  }

  private addFooter(data: InvoiceData) {
    const footerY = this.pageHeight - 60;

    // Notes
    if (data.notes) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Notes:', this.margin, footerY);
      this.doc.setFont('helvetica', 'normal');
      const noteLines = data.notes.split('\n');
      noteLines.forEach((line, index) => {
        this.doc.text(line, this.margin, footerY + 8 + (index * 5));
      });
    }

    // Terms
    if (data.terms) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Terms & Conditions:', this.margin, footerY + 25);
      this.doc.setFont('helvetica', 'normal');
      const termLines = data.terms.split('\n');
      termLines.forEach((line, index) => {
        this.doc.text(line, this.margin, footerY + 33 + (index * 5));
      });
    }

    // Payment Link
    if (data.paymentLink) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Payment Link:', this.pageWidth - 100, footerY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 255);
      this.doc.text(data.paymentLink, this.pageWidth - 100, footerY + 8);
    }
  }
}