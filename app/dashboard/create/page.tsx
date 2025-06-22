'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Save, Eye, Send, AlertCircle, Search, User, Building, Mail, FileText, Download, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  address: string;
  gstNumber?: string;
  currency: string;
}

export default function CreateInvoice() {
  const { toast } = useToast();
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [itemSuggestions, setItemSuggestions] = useState<any[]>([]);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    clientName: '',
    clientEmail: '',
    clientCompany: '',
    clientAddress: '',
    clientGST: '',
    clientCurrency: '$',
    items: [
      { id: '1', description: '', quantity: 1, rate: 0, amount: 0 }
    ] as InvoiceItem[],
    notes: 'Thank you for your business!',
    terms: 'Payment due within 30 days',
    taxRate: 0,
    discountRate: 0,
    paymentLink: '',
    theme: 'professional' as 'professional' | 'modern' | 'luxury' | 'minimal' | 'elegant-black-gold' | 'minimal-white-silver' | 'ivory-serif-classic' | 'modern-rose-gold',
    customColors: {
      primary: '#0d3c61',
      secondary: '#0ea5e9',
      accent: '#10b981',
      background: '#f8fafc'
    }
  });

  useEffect(() => {
    if (token) {
      fetchClients();
      generateInvoiceNumber();
    }
  }, [token]);

  useEffect(() => {
    // Set default due date to 30 days from invoice date
    if (invoiceData.date && !invoiceData.dueDate) {
      const dueDate = new Date(invoiceData.date);
      dueDate.setDate(dueDate.getDate() + 30);
      setInvoiceData(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0]
      }));
    }
  }, [invoiceData.date]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      const response = await fetch('/api/invoices/generate-number', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setInvoiceData(prev => ({
          ...prev,
          invoiceNumber: data.invoiceNumber
        }));
      }
    } catch (error) {
      // Fallback to client-side generation
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      setInvoiceData(prev => ({
        ...prev,
        invoiceNumber: `INV-${year}${month}-${random}`
      }));
    }
  };

  const fetchItemSuggestions = async (query: string) => {
    if (query.length < 2) {
      setItemSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/suggestions/items?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const suggestions = await response.json();
        setItemSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching item suggestions:', error);
    }
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setInvoiceData(prev => ({
      ...prev,
      clientName: client.name,
      clientEmail: client.email,
      clientCompany: client.company || '',
      clientAddress: client.address,
      clientGST: client.gstNumber || '',
      clientCurrency: client.currency,
    }));
    setClientSearch(client.name);
    setShowClientDropdown(false);
  };

  const handleClientSearch = (value: string) => {
    setClientSearch(value);
    setShowClientDropdown(true);
    
    // Update invoice data for manual entry
    if (!selectedClient || selectedClient.name !== value) {
      setSelectedClient(null);
      setInvoiceData(prev => ({
        ...prev,
        clientName: value,
      }));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (id: string) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const calculateSubtotal = () => {
    return invoiceData.items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateDiscount = () => {
    return invoiceData.discountRate ? (calculateSubtotal() * invoiceData.discountRate) / 100 : 0;
  };

  const calculateTax = () => {
    const subtotalAfterDiscount = calculateSubtotal() - calculateDiscount();
    return invoiceData.taxRate ? (subtotalAfterDiscount * invoiceData.taxRate) / 100 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateTax();
  };

  const validateForm = () => {
    if (!invoiceData.clientName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Client name is required.',
        variant: 'destructive',
      });
      return false;
    }
    if (!invoiceData.dueDate || invoiceData.dueDate.trim() === '') {
      // Set default due date if missing
      const dueDate = new Date(invoiceData.date);
      dueDate.setDate(dueDate.getDate() + 30);
      setInvoiceData(prev => ({ ...prev, dueDate: dueDate.toISOString().split('T')[0] }));
      toast({
        title: 'Validation Error',
        description: 'Due date was missing and has been set to 30 days from invoice date.',
        variant: 'destructive',
      });
      return false;
    }

    if (!invoiceData.clientEmail.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Client email is required.',
        variant: 'destructive',
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(invoiceData.clientEmail)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return false;
    }

    if (invoiceData.items.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one invoice item is required.',
        variant: 'destructive',
      });
      return false;
    }

    for (let i = 0; i < invoiceData.items.length; i++) {
      const item = invoiceData.items[i];
      if (!item.description.trim()) {
        toast({
          title: 'Validation Error',
          description: `Item ${i + 1} description is required.`,
          variant: 'destructive',
        });
        return false;
      }
      if (item.quantity <= 0) {
        toast({
          title: 'Validation Error',
          description: `Item ${i + 1} quantity must be greater than 0.`,
          variant: 'destructive',
        });
        return false;
      }
      if (item.rate < 0) {
        toast({
          title: 'Validation Error',
          description: `Item ${i + 1} rate cannot be negative.`,
          variant: 'destructive',
        });
        return false;
      }
    }

    return true;
  };

  const handleSave = async (status: 'draft' | 'sent' = 'draft') => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const subtotal = calculateSubtotal();
      const discountAmount = calculateDiscount();
      const taxAmount = calculateTax();
      const amount = calculateTotal();

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...invoiceData,
          subtotal,
          discountAmount,
          taxAmount,
          amount,
          status,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Success!',
          description: result.message || `Invoice ${status === 'draft' ? 'saved as draft' : 'created and sent'}.`,
        });
        router.push('/dashboard/invoices');
      } else {
        throw new Error(result.error || result.details || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Invoice creation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!validateForm()) {
      return;
    }

    setPreviewLoading(true);
    try {
      const subtotal = calculateSubtotal();
      const discountAmount = calculateDiscount();
      const taxAmount = calculateTax();
      const amount = calculateTotal();

      // Create a temporary invoice for preview
      const tempInvoiceData = {
        ...invoiceData,
        subtotal,
        discountAmount,
        taxAmount,
        amount,
      };

      // Generate PDF preview
      const response = await fetch('/api/invoices/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(tempInvoiceData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to generate preview');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate preview. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewInModal = async () => {
    if (!validateForm()) {
      return;
    }

    setShowPreviewDialog(true);
  };

  const handleSimplePDF = () => {
    let y = 20;
    const doc = new jsPDF();
    const currency = invoiceData.clientCurrency || '$';

    doc.setFontSize(16);
    doc.text(`Invoice Number: ${invoiceData.invoiceNumber || 'N/A'}`, 10, y);
    y += 10;
    doc.text(`Client: ${invoiceData.clientName || 'N/A'}`, 10, y);
    y += 10;
    doc.text(`Email: ${invoiceData.clientEmail || 'N/A'}`, 10, y);
    y += 15;
    doc.setFontSize(14);
    doc.text('Items:', 10, y);
    y += 10;
    doc.setFontSize(12);
    invoiceData.items.forEach((item, idx) => {
      doc.text(
        `${item.description || 'N/A'} | Qty: ${item.quantity} | Rate: ${currency}${item.rate} | Amount: ${currency}${item.amount}`,
        10,
        y
      );
      y += 8;
    });
    y += 10;
    doc.setFontSize(14);
    doc.text(`Subtotal: ${currency}${calculateSubtotal().toFixed(2)}`, 10, y);
    y += 8;
    doc.text(`Total: ${currency}${calculateTotal().toFixed(2)}`, 10, y);

    // Optional: Add notes and terms
    if (invoiceData.notes) {
      y += 12;
      doc.setFontSize(12);
      doc.text('Notes:', 10, y);
      y += 8;
      doc.text(invoiceData.notes, 10, y);
    }
    if (invoiceData.terms) {
      y += 12;
      doc.setFontSize(12);
      doc.text('Terms:', 10, y);
      y += 8;
      doc.text(invoiceData.terms, 10, y);
    }

    doc.save(`invoice-${invoiceData.invoiceNumber || 'N/A'}.pdf`);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const themeSchemes = {
    professional: {
      primary: '#0d3c61',
      secondary: '#0ea5e9',
      accent: '#10b981',
      background: '#f8fafc'
    },
    modern: {
      primary: '#4f46e5',
      secondary: '#8b5cf6',
      accent: '#ec4899',
      background: '#f9fafb'
    },
    luxury: {
      primary: '#713f12',
      secondary: '#d97706',
      accent: '#f59e0b',
      background: '#fefce8'
    },
    minimal: {
      primary: '#1f2937',
      secondary: '#4b5563',
      accent: '#6366f1',
      background: '#ffffff'
    },
    'elegant-black-gold': {
      primary: '#000000',
      secondary: '#d4af37',
      accent: '#ffd700',
      background: '#0f0f0f'
    },
    'minimal-white-silver': {
      primary: '#404040',
      secondary: '#c0c0c0',
      accent: '#808080',
      background: '#ffffff'
    },
    'ivory-serif-classic': {
      primary: '#8b4513',
      secondary: '#a0522d',
      accent: '#cd853f',
      background: '#fffff0'
    },
    'modern-rose-gold': {
      primary: '#bc8f8f',
      secondary: '#ffb6c1',
      accent: '#ffc0cb',
      background: '#ffffff'
    }
  };

  const themeDescriptions = {
    professional: 'Perfect for corporate and business invoices',
    modern: 'Clean and contemporary design for tech companies',
    luxury: 'Premium feel for high-end services and products',
    minimal: 'Simple and elegant for any business type',
    'elegant-black-gold': 'Sophisticated dark theme with gold accents',
    'minimal-white-silver': 'Ultra-clean white design with silver elements',
    'ivory-serif-classic': 'Traditional and formal for law firms and finance',
    'modern-rose-gold': 'Elegant and feminine for lifestyle and wellness'
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white">Create Invoice</h1>
          <p className="text-green-muted text-lg">Generate a professional invoice with premium design</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handlePreviewInModal} 
            className="btn-green-secondary"
            disabled={loading || previewLoading}
          >
            <Eye className="w-4 h-4 mr-2" />
            Quick Preview
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePreview} 
            className="btn-green-secondary"
            disabled={loading || previewLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            {previewLoading ? 'Generating...' : 'Premium PDF'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSimplePDF} 
            className="btn-green-secondary"
            disabled={loading || previewLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Simple PDF
          </Button>
          <Button 
            onClick={() => handleSave('draft')} 
            disabled={loading}
            className="btn-green-secondary"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            onClick={() => handleSave('sent')} 
            disabled={loading}
            className="btn-green-primary green-glow"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create & Send'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <Card className="card-green-mist animate-slide-in">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-primary" />
                Invoice Details
              </CardTitle>
              <CardDescription className="text-green-muted">Basic information about this invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber" className="text-white">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    placeholder="Auto-generated"
                    className="input-green"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-white">Invoice Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={invoiceData.date}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                    className="input-green"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-white">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoiceData.dueDate}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="input-green"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme & Color Customization */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.05s' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-green-primary" />
                Theme & Colors
              </CardTitle>
              <CardDescription className="text-green-muted">Customize the visual appearance of your invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label className="text-white">Choose Theme</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['professional', 'modern', 'luxury', 'minimal', 'elegant-black-gold', 'minimal-white-silver', 'ivory-serif-classic', 'modern-rose-gold'] as const).map((theme) => (
                    <div
                      key={theme}
                      className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:scale-105 ${
                        invoiceData.theme === theme 
                          ? 'border-green-primary bg-green-primary/10' 
                          : 'border-gray-600 hover:border-green-primary/50'
                      }`}
                      onClick={() => {
                        setInvoiceData(prev => ({
                          ...prev,
                          theme,
                          customColors: themeSchemes[theme]
                        }));
                      }}
                    >
                      <div className="space-y-2">
                        <div className="flex space-x-1">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: themeSchemes[theme].primary }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: themeSchemes[theme].secondary }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: themeSchemes[theme].accent }}
                          />
                        </div>
                        <span className="text-xs font-medium text-white capitalize">
                          {theme.replace('-', ' ')}
                        </span>
                      </div>
                      {invoiceData.theme === theme && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Color Picker */}
              <div className="space-y-4">
                <Label className="text-white">Customize Colors</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Primary</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={invoiceData.customColors.primary}
                        onChange={(e) => setInvoiceData(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, primary: e.target.value }
                        }))}
                        className="w-10 h-10 rounded border-2 border-gray-600 cursor-pointer"
                      />
                      <Input
                        value={invoiceData.customColors.primary}
                        onChange={(e) => setInvoiceData(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, primary: e.target.value }
                        }))}
                        className="input-green text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">Secondary</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={invoiceData.customColors.secondary}
                        onChange={(e) => setInvoiceData(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, secondary: e.target.value }
                        }))}
                        className="w-10 h-10 rounded border-2 border-gray-600 cursor-pointer"
                      />
                      <Input
                        value={invoiceData.customColors.secondary}
                        onChange={(e) => setInvoiceData(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, secondary: e.target.value }
                        }))}
                        className="input-green text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">Accent</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={invoiceData.customColors.accent}
                        onChange={(e) => setInvoiceData(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, accent: e.target.value }
                        }))}
                        className="w-10 h-10 rounded border-2 border-gray-600 cursor-pointer"
                      />
                      <Input
                        value={invoiceData.customColors.accent}
                        onChange={(e) => setInvoiceData(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, accent: e.target.value }
                        }))}
                        className="input-green text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">Background</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={invoiceData.customColors.background}
                        onChange={(e) => setInvoiceData(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, background: e.target.value }
                        }))}
                        className="w-10 h-10 rounded border-2 border-gray-600 cursor-pointer"
                      />
                      <Input
                        value={invoiceData.customColors.background}
                        onChange={(e) => setInvoiceData(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, background: e.target.value }
                        }))}
                        className="input-green text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="space-y-2">
                <Label className="text-white text-sm">Preview</Label>
                <div className="flex space-x-2">
                  <div 
                    className="w-8 h-8 rounded border border-gray-600"
                    style={{ backgroundColor: invoiceData.customColors.primary }}
                  />
                  <div 
                    className="w-8 h-8 rounded border border-gray-600"
                    style={{ backgroundColor: invoiceData.customColors.secondary }}
                  />
                  <div 
                    className="w-8 h-8 rounded border border-gray-600"
                    style={{ backgroundColor: invoiceData.customColors.accent }}
                  />
                  <div 
                    className="w-8 h-8 rounded border border-gray-600"
                    style={{ backgroundColor: invoiceData.customColors.background }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="w-5 h-5 mr-2 text-green-primary" />
                Client Information
              </CardTitle>
              <CardDescription className="text-green-muted">Select existing client or enter new details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client Search/Selection */}
              <div className="space-y-2">
                <Label htmlFor="clientSearch" className="text-white">Client *</Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-muted w-4 h-4" />
                    <Input
                      id="clientSearch"
                      value={clientSearch}
                      onChange={(e) => handleClientSearch(e.target.value)}
                      onFocus={() => setShowClientDropdown(true)}
                      placeholder="Search existing clients or enter new client name"
                      className="input-green pl-10"
                      required
                    />
                  </div>
                  
                  {/* Client Dropdown */}
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-green-900/95 border border-green-500/30 rounded-lg shadow-lg max-h-60 overflow-y-auto backdrop-blur-sm">
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className="p-3 hover:bg-green-500/20 cursor-pointer border-b border-green-500/20 last:border-b-0"
                          onClick={() => selectClient(client)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                              {client.company ? (
                                <Building className="w-4 h-4 text-green-primary" />
                              ) : (
                                <User className="w-4 h-4 text-green-primary" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{client.name}</p>
                              {client.company && (
                                <p className="text-green-muted text-sm">{client.company}</p>
                              )}
                              <p className="text-green-muted text-sm flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {client.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientEmail" className="text-white">Client Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={invoiceData.clientEmail}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="client@example.com"
                    className="input-green"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientCompany" className="text-white">Company</Label>
                  <Input
                    id="clientCompany"
                    value={invoiceData.clientCompany}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, clientCompany: e.target.value }))}
                    placeholder="Company name (optional)"
                    className="input-green"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientAddress" className="text-white">Client Address</Label>
                <Textarea
                  id="clientAddress"
                  value={invoiceData.clientAddress}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, clientAddress: e.target.value }))}
                  placeholder="Enter client address"
                  rows={3}
                  className="input-green"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientGST" className="text-white">GST/VAT Number</Label>
                  <Input
                    id="clientGST"
                    value={invoiceData.clientGST}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, clientGST: e.target.value }))}
                    placeholder="GST/VAT number (optional)"
                    className="input-green"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientCurrency" className="text-white">Currency</Label>
                  <Select
                    value={invoiceData.clientCurrency}
                    onValueChange={(value) => setInvoiceData(prev => ({ ...prev, clientCurrency: value }))}
                  >
                    <SelectTrigger className="input-green">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-green-900 border-green-500/30">
                      <SelectItem value="$">USD - US Dollar</SelectItem>
                      <SelectItem value="€">EUR - Euro</SelectItem>
                      <SelectItem value="£">GBP - British Pound</SelectItem>
                      <SelectItem value="₹">INR - Indian Rupee</SelectItem>
                      <SelectItem value="C$">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="A$">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Invoice Items</CardTitle>
                  <CardDescription className="text-green-muted">Add products or services</CardDescription>
                </div>
                <Button onClick={addItem} size="sm" className="btn-green-secondary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoiceData.items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 items-end p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                    <div className="col-span-5">
                      <Label htmlFor={`description-${item.id}`} className="text-white">Description *</Label>
                      <div className="relative">
                        <Input
                          id={`description-${item.id}`}
                          value={item.description}
                          onChange={(e) => {
                            updateItem(item.id, 'description', e.target.value);
                            fetchItemSuggestions(e.target.value);
                          }}
                          placeholder="Item description"
                          className="input-green"
                          required
                        />
                        {itemSuggestions.length > 0 && item.description && (
                          <div className="absolute z-10 w-full mt-1 bg-green-900/95 border border-green-500/30 rounded-lg shadow-lg max-h-40 overflow-y-auto backdrop-blur-sm">
                            {itemSuggestions.map((suggestion, idx) => (
                              <div
                                key={idx}
                                className="p-2 hover:bg-green-500/20 cursor-pointer text-sm text-white"
                                onClick={() => {
                                  updateItem(item.id, 'description', suggestion.description);
                                  setItemSuggestions([]);
                                }}
                              >
                                {suggestion.description}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor={`quantity-${item.id}`} className="text-white">Qty *</Label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="input-green"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor={`rate-${item.id}`} className="text-white">Rate *</Label>
                      <Input
                        id={`rate-${item.id}`}
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="input-green"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-white">Amount</Label>
                      <Input
                        value={`${invoiceData.clientCurrency}${item.amount.toFixed(2)}`}
                        disabled
                        className="input-green opacity-75"
                      />
                    </div>
                    <div className="col-span-1">
                      {invoiceData.items.length > 1 && (
                        <Button
                          onClick={() => removeItem(item.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="text-white">Additional Information</CardTitle>
              <CardDescription className="text-green-muted">Notes and terms for this invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-white">Notes</Label>
                <Textarea
                  id="notes"
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes for the client"
                  rows={3}
                  className="input-green"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms" className="text-white">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={invoiceData.terms}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, terms: e.target.value }))}
                  placeholder="Payment terms and conditions"
                  rows={3}
                  className="input-green"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentLink" className="text-white">Payment Link (Optional)</Label>
                <Input
                  id="paymentLink"
                  value={invoiceData.paymentLink}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, paymentLink: e.target.value }))}
                  placeholder="https://payment-link.com"
                  className="input-green"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tax & Discount Options */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="text-white">Tax & Discount</CardTitle>
              <CardDescription className="text-green-muted">Configure tax and discount rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate" className="text-white">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={invoiceData.taxRate}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0"
                  className="input-green"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="discountRate" className="text-white">Discount Rate (%)</Label>
                <Input
                  id="discountRate"
                  type="number"
                  value={invoiceData.discountRate}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, discountRate: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0"
                  className="input-green"
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <CardTitle className="text-white">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-green-muted">
                  <span>Subtotal:</span>
                  <span>{invoiceData.clientCurrency}{calculateSubtotal().toFixed(2)}</span>
                </div>
                
                {invoiceData.discountRate > 0 && (
                  <div className="flex justify-between text-green-muted">
                    <span>Discount ({invoiceData.discountRate}%):</span>
                    <span className="text-red-400">-{invoiceData.clientCurrency}{calculateDiscount().toFixed(2)}</span>
                  </div>
                )}
                
                {invoiceData.taxRate > 0 && (
                  <div className="flex justify-between text-green-muted">
                    <span>Tax ({invoiceData.taxRate}%):</span>
                    <span>{invoiceData.clientCurrency}{calculateTax().toFixed(2)}</span>
                  </div>
                )}
                
                <Separator className="bg-green-500/30" />
                
                <div className="flex justify-between text-lg font-bold text-white">
                  <span>Total:</span>
                  <span className="text-green-primary">{invoiceData.clientCurrency}{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium PDF Features */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.6s' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-green-primary" />
                Premium PDF Features
              </CardTitle>
              <CardDescription className="text-green-muted">Professional invoice design</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-green-primary" />
                  <span className="text-sm font-medium text-white">Modern Design</span>
                </div>
                <p className="text-xs text-green-muted">Clean, professional layout with premium typography</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Live Preview</span>
                </div>
                <p className="text-xs text-green-muted">See exactly how your invoice will look</p>
              </div>
              <Button
                onClick={handlePreviewInModal}
                className="w-full btn-green-secondary"
                disabled={loading || previewLoading}
              >
                <Eye className="w-4 h-4 mr-2" />
                Quick Preview
              </Button>
              <Button
                onClick={handlePreview}
                className="w-full btn-green-primary"
                disabled={loading || previewLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                {previewLoading ? 'Generating...' : 'Download Premium PDF'}
              </Button>
            </CardContent>
          </Card>

          {/* Validation Notice */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.7s' }}>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Required Fields</p>
                  <p className="text-sm text-green-muted mt-1">
                    Make sure to fill in client name, email, due date, and at least one item before saving.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Premium Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl h-[85vh] bg-slate-900/95 border-slate-700 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-400" />
              Premium Invoice Preview
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Preview of your professional invoice - {invoiceData.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 bg-white rounded-lg p-8 overflow-auto shadow-2xl">
            {/* Premium Preview Content */}
            <div className="max-w-2xl mx-auto">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">SI</span>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900 font-cookie">SmartInvoice</h1>
                    <p className="text-slate-600">Professional Invoice Management</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-bold text-slate-900">INVOICE</h2>
                  <div className="w-16 h-1 bg-blue-600 ml-auto mt-2"></div>
                </div>
              </div>
              
              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">BILL TO</h3>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-slate-900">{invoiceData.clientName || 'No Client'}</p>
                    {invoiceData.clientCompany && (
                      <p className="text-slate-600">{invoiceData.clientCompany}</p>
                    )}
                    <p className="text-slate-600">{invoiceData.clientEmail}</p>
                    {invoiceData.clientAddress && (
                      <p className="text-slate-600 text-sm mt-2">{invoiceData.clientAddress}</p>
                    )}
                    {invoiceData.clientGST && (
                      <p className="text-blue-600 font-medium text-sm mt-2">GST: {invoiceData.clientGST}</p>
                    )}
                  </div>
                </div>
                <div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Invoice #</span>
                        <span className="font-medium">{invoiceData.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Date</span>
                        <span className="font-medium">{new Date(invoiceData.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Due Date</span>
                        <span className="font-medium text-red-600">{new Date(invoiceData.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Items Table */}
              <div className="mb-8">
                <div className="bg-slate-900 text-white p-3 rounded-t-lg">
                  <div className="grid grid-cols-12 gap-4 font-semibold text-sm">
                    <div className="col-span-6">DESCRIPTION</div>
                    <div className="col-span-2">QTY</div>
                    <div className="col-span-2">RATE</div>
                    <div className="col-span-2">AMOUNT</div>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-b-lg">
                  {invoiceData.items.map((item, index) => (
                    <div key={item.id} className={`grid grid-cols-12 gap-4 p-3 text-sm ${index % 2 === 1 ? 'bg-slate-50' : ''}`}>
                      <div className="col-span-6">{item.description}</div>
                      <div className="col-span-2">{item.quantity}</div>
                      <div className="col-span-2">{invoiceData.clientCurrency}{item.rate.toFixed(2)}</div>
                      <div className="col-span-2 font-semibold">{invoiceData.clientCurrency}{item.amount.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-64">
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{invoiceData.clientCurrency}{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    {invoiceData.discountRate > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount ({invoiceData.discountRate}%)</span>
                        <span>-{invoiceData.clientCurrency}{calculateDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    {invoiceData.taxRate > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({invoiceData.taxRate}%)</span>
                        <span>{invoiceData.clientCurrency}{calculateTax().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="bg-slate-900 text-white p-3 rounded flex justify-between font-bold">
                        <span>TOTAL</span>
                        <span>{invoiceData.clientCurrency}{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-6">
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600 mb-2">Thank you for your business!</p>
                  <p className="text-sm text-slate-500">Generated by SmartInvoice</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreviewDialog(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Close Preview
            </Button>
            <Button
              onClick={handlePreview}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={previewLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              {previewLoading ? 'Generating...' : 'Download Premium PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}