import jsPDF from 'jspdf';
import { format } from 'date-fns';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  note?: string;
  category?: string;
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
  companyWebsite?: string;
  companyLogo?: string;
  invoiceStatus?: 'PAID' | 'DUE' | 'OVERDUE' | 'PENDING';
  theme?: 'professional' | 'modern' | 'luxury' | 'minimal' | 'elegant-black-gold' | 'minimal-white-silver' | 'ivory-serif-classic' | 'modern-rose-gold';
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

export class PremiumPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private colors: {
    primary: [number, number, number];
    secondary: [number, number, number];
    accent: [number, number, number];
    dark: [number, number, number];
    medium: [number, number, number];
    light: [number, number, number];
    bg: [number, number, number];
    white: [number, number, number];
  };

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 15;
    this.colors = this.getColorScheme('professional') as {
      primary: [number, number, number];
      secondary: [number, number, number];
      accent: [number, number, number];
      dark: [number, number, number];
      medium: [number, number, number];
      light: [number, number, number];
      bg: [number, number, number];
      white: [number, number, number];
    };
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }

  private getColorScheme(theme: string = 'professional', customColors?: InvoiceData['customColors']) {
    if (customColors) {
      return {
        primary: this.hexToRgb(customColors.primary),
        secondary: this.hexToRgb(customColors.secondary),
        accent: this.hexToRgb(customColors.accent),
        dark: [15, 23, 42] as [number, number, number],
        medium: [71, 85, 105] as [number, number, number],
        light: [148, 163, 184] as [number, number, number],
        bg: this.hexToRgb(customColors.background),
        white: [255, 255, 255] as [number, number, number]
      } as {
        primary: [number, number, number];
        secondary: [number, number, number];
        accent: [number, number, number];
        dark: [number, number, number];
        medium: [number, number, number];
        light: [number, number, number];
        bg: [number, number, number];
        white: [number, number, number];
      };
    }

    type RGB = [number, number, number];
    const schemes: Record<string, {
      primary: RGB;
      secondary: RGB;
      accent: RGB;
      dark: RGB;
      medium: RGB;
      light: RGB;
      bg: RGB;
      white: RGB;
    }> = {
      professional: {
        primary: [13, 60, 97],
        secondary: [14, 165, 233],
        accent: [16, 185, 129],
        dark: [15, 23, 42],
        medium: [71, 85, 105],
        light: [148, 163, 184],
        bg: [248, 250, 252],
        white: [255, 255, 255]
      },
      modern: {
        primary: [79, 70, 229],
        secondary: [139, 92, 246],
        accent: [236, 72, 153],
        dark: [17, 24, 39],
        medium: [75, 85, 99],
        light: [156, 163, 175],
        bg: [249, 250, 251],
        white: [255, 255, 255]
      },
      luxury: {
        primary: [113, 63, 18],
        secondary: [217, 119, 6],
        accent: [245, 158, 11],
        dark: [20, 83, 45],
        medium: [52, 73, 94],
        light: [127, 140, 141],
        bg: [254, 252, 232],
        white: [255, 255, 255]
      },
      minimal: {
        primary: [31, 41, 55],
        secondary: [75, 85, 99],
        accent: [99, 102, 241],
        dark: [17, 24, 39],
        medium: [107, 114, 128],
        light: [156, 163, 175],
        bg: [255, 255, 255],
        white: [255, 255, 255]
      },
      'elegant-black-gold': {
        primary: [0, 0, 0],
        secondary: [212, 175, 55],
        accent: [255, 215, 0],
        dark: [20, 20, 20],
        medium: [64, 64, 64],
        light: [128, 128, 128],
        bg: [15, 15, 15],
        white: [255, 255, 255]
      },
      'minimal-white-silver': {
        primary: [64, 64, 64],
        secondary: [192, 192, 192],
        accent: [128, 128, 128],
        dark: [32, 32, 32],
        medium: [96, 96, 96],
        light: [160, 160, 160],
        bg: [255, 255, 255],
        white: [255, 255, 255]
      },
      'ivory-serif-classic': {
        primary: [139, 69, 19],
        secondary: [160, 82, 45],
        accent: [205, 133, 63],
        dark: [101, 67, 33],
        medium: [139, 115, 85],
        light: [188, 170, 164],
        bg: [255, 255, 240],
        white: [255, 255, 255]
      },
      'modern-rose-gold': {
        primary: [188, 143, 143],
        secondary: [255, 182, 193],
        accent: [255, 192, 203],
        dark: [139, 69, 19],
        medium: [205, 133, 63],
        light: [255, 218, 185],
        bg: [255, 255, 255],
        white: [255, 255, 255]
      }
    };
    return schemes[theme as keyof typeof schemes] || schemes.professional;
  }

  generatePDF(invoiceData: InvoiceData): Uint8Array {
    try {
      this.colors = this.getColorScheme(invoiceData.theme || 'professional', invoiceData.customColors);
      
      this.doc.setProperties({
        title: `Invoice #${invoiceData.invoiceNumber}`,
        subject: 'Premium Invoice Document',
        author: invoiceData.companyName || 'Premium Invoice System',
        keywords: 'invoice, billing, payment, premium',
        creator: 'Premium Invoice Generator Pro'
      });

      this.doc.setFillColor(...(this.colors.bg as [number, number, number]));
      this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

      this.addPremiumHeader(invoiceData);
      this.addCompanyBranding(invoiceData);
      this.addInvoiceMetadata(invoiceData);
      this.addClientSection(invoiceData);
      this.addPremiumItemsTable(invoiceData);
      this.addFinancialSummary(invoiceData);
      this.addPaymentInformation(invoiceData);
      this.addFooterBranding(invoiceData);

      return this.doc.output('arraybuffer') as unknown as Uint8Array;
    } catch (error) {
      console.error('Premium PDF Generation Error:', error);
      throw new Error('Failed to generate premium PDF');
    }
  }

  // Placeholder methods - will be implemented next
  private addPremiumHeader(data: InvoiceData) {
    this.doc.setFillColor(...(this.colors.primary as [number, number, number]));
    this.doc.rect(0, 0, this.pageWidth, 80, 'F');
    
    this.doc.setFillColor(...(this.colors.secondary as [number, number, number]));
    this.doc.setGState(this.doc.GState({ opacity: 0.1 }));
    this.doc.rect(0, 0, this.pageWidth, 80, 'F');
    this.doc.setGState(this.doc.GState({ opacity: 1 }));

    this.addGeometricPattern();
    
    if (data.invoiceStatus) {
      this.addPremiumStatusBadge(data.invoiceStatus);
    }
  }

  private addGeometricPattern() {
    this.doc.setDrawColor(...(this.colors.white as [number, number, number]));
    this.doc.setGState(this.doc.GState({ opacity: 0.05 }));
    
    for (let i = 0; i < 15; i++) {
      const x = (i * 25) - 50;
      const y = 20 + (i % 3) * 15;
      this.doc.circle(x, y, 8);
      this.doc.circle(x + 200, y + 20, 6);
    }
    
    this.doc.setGState(this.doc.GState({ opacity: 1 }));
  }

  private addPremiumStatusBadge(status: string) {
    const statusConfig = {
      PAID: { color: [16, 185, 129], text: 'PAID', bgOpacity: 0.9 },
      DUE: { color: [245, 158, 11], text: 'DUE', bgOpacity: 0.9 },
      OVERDUE: { color: [239, 68, 68], text: 'OVERDUE', bgOpacity: 0.9 },
      PENDING: { color: [99, 102, 241], text: 'PENDING', bgOpacity: 0.9 }
    }[status] || { color: [156, 163, 175], text: status, bgOpacity: 0.9 };

    const badgeWidth = 35;
    const badgeHeight = 10;
    const badgeX = this.pageWidth - this.margin - badgeWidth;
    const badgeY = 30;

    this.doc.setFillColor(0, 0, 0);
    this.doc.setGState(this.doc.GState({ opacity: 0.1 }));
    this.doc.roundedRect(badgeX, badgeY + 1, badgeWidth, badgeHeight, 5, 5, 'F');
    
    this.doc.setGState(this.doc.GState({ opacity: statusConfig.bgOpacity }));
    this.doc.setFillColor(...(statusConfig.color as [number, number, number]));
    this.doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 5, 5, 'F');
    
    this.doc.setGState(this.doc.GState({ opacity: 1 }));
    this.doc.setTextColor(...(this.colors.white as [number, number, number]));
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(statusConfig.text, badgeX + badgeWidth / 2, badgeY + 6.5, { align: 'center' });
  }

  private addCompanyBranding(data: InvoiceData) {
    const startY = 25;
    
    this.doc.setFillColor(...(this.colors.accent as [number, number, number]));
    this.doc.setGState(this.doc.GState({ opacity: 0.9 }));
    this.doc.roundedRect(this.margin, startY - 8, 24, 24, 4, 4, 'F');
    this.doc.setGState(this.doc.GState({ opacity: 1 }));

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...(this.colors.white as [number, number, number]));
    const initials = (data.companyName || 'SI').substring(0, 2).toUpperCase();
    this.doc.text(initials, this.margin + 12, startY + 6, { align: 'center' });

    this.doc.setFontSize(22);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...(this.colors.white as [number, number, number]));
    
    const companyNameLines = this.doc.splitTextToSize(data.companyName || 'SmartInvoice', 60);
    this.doc.text(companyNameLines, this.margin + 35, startY + 2);

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setGState(this.doc.GState({ opacity: 0.8 }));
    this.doc.text('Professional Invoice Management', this.margin + 35, startY + 12);
    this.doc.setGState(this.doc.GState({ opacity: 1 }));

    const contactY = startY + 22;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...(this.colors.white as [number, number, number]));
    
    const contactInfo = [
      data.companyEmail,
      data.companyPhone,
      data.companyWebsite
    ].filter(Boolean) as string[];
    
    let contactLineY = contactY;
    contactInfo.forEach((info) => {
      if (info) {
        const infoLines = this.doc.splitTextToSize(info, 60);
        this.doc.text(infoLines, this.margin + 35, contactLineY);
        contactLineY += (infoLines.length * 4);
      }
    });

    this.doc.setFontSize(32);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...(this.colors.white as [number, number, number]));
    this.doc.text('INVOICE', this.pageWidth - this.margin - 40, startY + 18, { align: 'right' });
  }

  private addInvoiceMetadata(data: InvoiceData) {
    const startY = 100;
    const cardWidth = 85;
    const cardHeight = 50;
    
    this.doc.setFillColor(0, 0, 0);
    this.doc.setGState(this.doc.GState({ opacity: 0.05 }));
    this.doc.roundedRect(this.margin + 2, startY + 2, cardWidth, cardHeight, 4, 4, 'F');
    
    this.doc.setGState(this.doc.GState({ opacity: 1 }));
    this.doc.setFillColor(...(this.colors.white as [number, number, number]));
    this.doc.roundedRect(this.margin, startY, cardWidth, cardHeight, 4, 4, 'F');
    
    this.doc.setDrawColor(...(this.colors.light as [number, number, number]));
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.margin, startY, cardWidth, cardHeight, 4, 4);

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...(this.colors.primary as [number, number, number]));
    this.doc.text('Invoice Details', this.margin + 5, startY + 10);

    const metadata = [
      ['Invoice #', data.invoiceNumber || 'INV-001'],
      ['Issue Date', data.date ? format(new Date(data.date), 'MMM dd, yyyy') : 'N/A'],
      ['Due Date', data.dueDate ? format(new Date(data.dueDate), 'MMM dd, yyyy') : 'N/A'],
      ['Currency', data.clientCurrency || 'USD']
    ];

    this.doc.setFontSize(8);
    metadata.forEach(([label, value], index) => {
      const y = startY + 18 + (index * 7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...(this.colors.medium as [number, number, number]));
      this.doc.text(label + ':', this.margin + 5, y);
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...(this.colors.dark as [number, number, number]));
      this.doc.text(value, this.margin + 35, y);
    });
  }

  private addClientSection(data: InvoiceData) {
    const startY = 100;
    const cardWidth = 85;
    const cardHeight = 50;
    const rightX = this.pageWidth - this.margin - cardWidth;
    
    this.doc.setFillColor(0, 0, 0);
    this.doc.setGState(this.doc.GState({ opacity: 0.05 }));
    this.doc.roundedRect(rightX + 2, startY + 2, cardWidth, cardHeight, 4, 4, 'F');
    
    this.doc.setGState(this.doc.GState({ opacity: 1 }));
    this.doc.setFillColor(...(this.colors.bg as [number, number, number]));
    this.doc.roundedRect(rightX, startY, cardWidth, cardHeight, 4, 4, 'F');
    
    this.doc.setDrawColor(...(this.colors.light as [number, number, number]));
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(rightX, startY, cardWidth, cardHeight, 4, 4);

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...(this.colors.primary as [number, number, number]));
    this.doc.text('Bill To', rightX + 5, startY + 10);

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...(this.colors.accent as [number, number, number]));
    
    const clientName = data.clientName || 'Valued Client';
    
    this.doc.setTextColor(...(this.colors.dark as [number, number, number]));
    this.doc.setFont('helvetica', 'bold');
    const clientNameLines = this.doc.splitTextToSize(clientName, cardWidth - 16);
    this.doc.text(clientNameLines, rightX + 8, startY + 20);

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...(this.colors.dark as [number, number, number]));

    const detailsY = startY + 20 + (clientNameLines.length * 5) + 2;
    const details = [
        data.clientCompany || '',
        data.clientEmail || '',
        data.clientAddress || '',
        data.clientGST ? `GST: ${data.clientGST}` : ''
    ].filter(Boolean);

    const fullDetailsText = details.join('\n');
    const textLines = this.doc.splitTextToSize(fullDetailsText, cardWidth - 16);
    this.doc.text(textLines, rightX + 8, detailsY);
  }

  private calculateItemsTableHeight(items: InvoiceItem[]): { totalHeight: number, rowHeights: number[] } {
    if (!items || !Array.isArray(items)) {
        return { totalHeight: 0, rowHeights: [] };
    }
    const tableWidth = this.pageWidth - (2 * this.margin);
    let totalRowsHeight = 0;
    const rowHeights = items.map(item => {
        const descriptionLines = this.doc.splitTextToSize(item.description || 'N/A', tableWidth * 0.5 - 16);
        const rowHeight = Math.max(15, (descriptionLines.length * 5) + 6);
        totalRowsHeight += rowHeight;
        return rowHeight;
    });
    return { totalHeight: totalRowsHeight, rowHeights };
  }

  private addPremiumItemsTable(data: InvoiceData) {
    // Ensure items is an array
    let items: InvoiceItem[] = [];
    if (data.items) {
      if (typeof data.items === 'string') {
        try {
          items = JSON.parse(data.items);
        } catch (error) {
          console.error('Failed to parse items JSON:', error);
          items = [];
        }
      } else if (Array.isArray(data.items)) {
        items = data.items;
      } else {
        console.error('Items is not an array or JSON string:', typeof data.items);
        items = [];
      }
    }

    const startY = 165;
    const tableWidth = this.pageWidth - (2 * this.margin);
    const headerHeight = 18;

    const { totalHeight: totalRowsHeight, rowHeights } = this.calculateItemsTableHeight(items);
    const tableHeight = headerHeight + totalRowsHeight;

    // Draw the main container with rounded corners
    this.doc.setDrawColor(...(this.colors.light as [number, number, number]));
    this.doc.setLineWidth(0.3);
    this.doc.setFillColor(...(this.colors.white as [number, number, number]));
    this.doc.roundedRect(this.margin, startY, tableWidth, tableHeight, 4, 4, 'FD');

    // Draw the header
    this.doc.setFillColor(...(this.colors.primary as [number, number, number]));
    this.doc.rect(this.margin, startY, tableWidth, headerHeight, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...(this.colors.white as [number, number, number]));

    const headers = ['Description', 'Qty', 'Rate', 'Amount'];
    const columnWidths = [tableWidth * 0.5, tableWidth * 0.15, tableWidth * 0.175, tableWidth * 0.175];
    let currentX = this.margin;

    headers.forEach((header, index) => {
      const headerX = index === 0 ? currentX + 8 : currentX + columnWidths[index] - 8;
      const align = index === 0 ? 'left' : 'right';
      this.doc.text(header, headerX, startY + 12, { align });
      currentX += columnWidths[index];
    });

    this.doc.setFontSize(9);
    let currentY = startY + headerHeight;

    items.forEach((item, index) => {
      const rowHeight = rowHeights[index];
      
      if (index < items.length - 1) {
        this.doc.setDrawColor(...(this.colors.light as [number, number, number]));
        this.doc.setLineWidth(0.2);
        this.doc.line(this.margin, currentY + rowHeight, this.pageWidth - this.margin, currentY + rowHeight);
      }

      this.doc.setTextColor(...(this.colors.dark as [number, number, number]));
      this.doc.setFont('helvetica', 'bold');
      
      const descriptionLines = this.doc.splitTextToSize(item.description, 75);
      const textY = currentY + 8;
      this.doc.text(descriptionLines, this.margin + 5, textY);

      const verticalCenterY = currentY + rowHeight / 2 + 2;

      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...(this.colors.medium as [number, number, number]));
      
      this.doc.text(item.quantity.toString(), this.margin + 105, verticalCenterY, { align: 'right' });
      this.doc.text(`${data.clientCurrency || '$'}${item.rate.toFixed(2)}`, this.margin + 140, verticalCenterY, { align: 'right' });
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...(this.colors.primary as [number, number, number]));
      this.doc.text(`${data.clientCurrency || '$'}${item.amount.toFixed(2)}`, this.margin + 175, verticalCenterY, { align: 'right' });
      
      currentY += rowHeight;
    });
  }

  private addFinancialSummary(data: InvoiceData) {
    // Ensure items is an array
    let items: InvoiceItem[] = [];
    if (data.items) {
      if (typeof data.items === 'string') {
        try {
          items = JSON.parse(data.items);
        } catch (error) {
          console.error('Failed to parse items JSON:', error);
          items = [];
        }
      } else if (Array.isArray(data.items)) {
        items = data.items;
      } else {
        console.error('Items is not an array or JSON string:', typeof data.items);
        items = [];
      }
    }

    const { totalHeight } = this.calculateItemsTableHeight(items);
    const tableEndy = 165 + 18 + totalHeight;

    const startY = tableEndy + 10;
    const summaryWidth = 80;
    const summaryX = this.pageWidth - this.margin - summaryWidth;
    
    this.doc.setFillColor(0, 0, 0);
    this.doc.setGState(this.doc.GState({ opacity: 0.05 }));
    this.doc.roundedRect(summaryX + 2, startY + 2, summaryWidth, 40, 4, 4, 'F');
    this.doc.setGState(this.doc.GState({ opacity: 1 }));
    
    this.doc.setFillColor(...(this.colors.bg as [number, number, number]));
    this.doc.roundedRect(summaryX, startY, summaryWidth, 40, 4, 4, 'F');
    
    this.doc.setDrawColor(...(this.colors.light as [number, number, number]));
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(summaryX, startY, summaryWidth, 40, 4, 4);

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...(this.colors.medium as [number, number, number]));

    const financials = [
      ['Subtotal', `${data.clientCurrency || '$'}${data.subtotal?.toFixed(2) || '0.00'}`],
      ['Discount', `(${(data.discountRate || 0).toFixed(1)}%) -${data.clientCurrency || '$'}${data.discountAmount?.toFixed(2) || '0.00'}`],
      ['Tax', `(${(data.taxRate || 0).toFixed(1)}%) +${data.clientCurrency || '$'}${data.taxAmount?.toFixed(2) || '0.00'}`]
    ];

    financials.forEach(([label, value], index) => {
      const y = startY + 10 + (index * 7);
      this.doc.text(label, summaryX + 8, y);
      this.doc.text(value, summaryX + summaryWidth - 8, y, { align: 'right' });
    });

    const totalY = startY + 32;
    this.doc.setDrawColor(...(this.colors.accent as [number, number, number]));
    this.doc.setLineWidth(0.5);
    this.doc.line(summaryX + 8, totalY - 2, summaryX + summaryWidth - 8, totalY - 2);

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...(this.colors.primary as [number, number, number]));
    this.doc.text('TOTAL:', summaryX + 8, totalY + 5);
    
    this.doc.setTextColor(...(this.colors.accent as [number, number, number]));
    this.doc.setFontSize(14);
    this.doc.text(`${data.clientCurrency || '$'}${data.amount?.toFixed(2) || '0.00'}`, summaryX + summaryWidth - 8, totalY + 5, { align: 'right' });
  }

  private addPaymentInformation(data: InvoiceData) {
    const items = Array.isArray(data.items) ? data.items : [];
    const { totalHeight } = this.calculateItemsTableHeight(items);
    let tableEndy = 165 + 18 + totalHeight;
    
    let currentY = tableEndy + 10;
    
    if (data.notes) {
      this.addPremiumTextSection('Notes', data.notes, currentY);
      currentY += 25;
    }
    
    if (data.terms) {
      this.addPremiumTextSection('Terms & Conditions', data.terms, currentY);
      currentY += 25;
    }

    if (data.paymentLink) {
      currentY = Math.max(currentY, 230);
      this.doc.setFillColor(...(this.colors.accent as [number, number, number]));
      this.doc.setGState(this.doc.GState({ opacity: 0.1 }));
      this.doc.roundedRect(this.margin, currentY, this.pageWidth - (2 * this.margin), 25, 4, 4, 'F');
      this.doc.setGState(this.doc.GState({ opacity: 1 }));
      
      this.doc.setDrawColor(...(this.colors.accent as [number, number, number]));
      this.doc.setLineWidth(0.3);
      this.doc.roundedRect(this.margin, currentY, this.pageWidth - (2 * this.margin), 25, 4, 4);

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...(this.colors.primary as [number, number, number]));
      this.doc.text('Quick Payment', this.margin + 5, currentY + 7);

      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...(this.colors.dark as [number, number, number]));
      this.doc.textWithLink('Pay securely online', this.margin + 5, currentY + 15, { url: data.paymentLink });
    }
  }

  private addPremiumTextSection(title: string, content: string, y: number) {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...(this.colors.primary as [number, number, number]));
    this.doc.text(title, this.margin, y);

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...(this.colors.dark as [number, number, number]));
    const lines = this.doc.splitTextToSize(content, this.pageWidth - (2 * this.margin) - 90);
    this.doc.text(lines.slice(0, 3), this.margin, y + 7);
  }

  private addFooterBranding(data: InvoiceData) {
    const footerY = this.pageHeight - 20;
    
    this.doc.setDrawColor(...(this.colors.primary as [number, number, number]));
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    this.doc.setDrawColor(...(this.colors.accent as [number, number, number]));
    this.doc.setLineWidth(0.2);
    this.doc.line(this.margin, footerY - 4, this.pageWidth - this.margin, footerY - 4);

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...(this.colors.primary as [number, number, number]));
    this.doc.text('Generated by SmartInvoice', this.pageWidth / 2, footerY, { align: 'center' });
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...(this.colors.medium as [number, number, number]));
    this.doc.text('Professional Invoice Management', this.pageWidth / 2, footerY + 5, { align: 'center' });

    const timestamp = format(new Date(), 'MMM dd, yyyy HH:mm');
    this.doc.setFontSize(7);
    this.doc.setTextColor(...(this.colors.light as [number, number, number]));
    this.doc.text(`Generated on ${timestamp}`, this.pageWidth / 2, footerY + 10, { align: 'center' });
  }
}
