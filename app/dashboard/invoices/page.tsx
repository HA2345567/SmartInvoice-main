'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Eye, Download, Send, Trash2, Search, Filter, Plus, CheckCircle, Clock, AlertTriangle, Edit, Calendar, DollarSign, CreditCard, FileDown, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  date: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  createdAt: string;
}

const statusConfig = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    icon: Edit,
    description: 'Invoice not yet sent'
  },
  sent: {
    label: 'Sent',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: Send,
    description: 'Invoice sent, awaiting payment'
  },
  paid: {
    label: 'Paid',
    color: 'bg-green-500/20 text-green-300 border-green-500/30',
    icon: CheckCircle,
    description: 'Payment received'
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-red-500/20 text-red-300 border-red-500/30',
    icon: AlertTriangle,
    description: 'Payment overdue'
  }
};

const paymentMethods = [
  'Bank Transfer',
  'Credit Card',
  'PayPal',
  'Stripe',
  'Razorpay',
  'Cash',
  'Check',
  'Other'
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paidDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    notes: ''
  });
  const { toast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchInvoices();
    }
  }, [token]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter]);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        throw new Error('Failed to fetch invoices');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch invoices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(
        invoice =>
          invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  };

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Success',
          description: 'Branded PDF downloaded successfully',
        });
      } else {
        throw new Error('Failed to download PDF');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Success',
          description: 'All invoices exported to CSV successfully',
        });
      } else {
        throw new Error('Failed to export invoices');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export invoices',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkDownloadPDFs = async () => {
    if (filteredInvoices.length === 0) {
      toast({
        title: 'No Invoices',
        description: 'No invoices to download',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const invoice of filteredInvoices) {
      try {
        await handleDownloadPDF(invoice.id, invoice.invoiceNumber);
        successCount++;
        // Add small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        errorCount++;
      }
    }

    setIsExporting(false);
    
    if (successCount > 0) {
      toast({
        title: 'Bulk Download Complete',
        description: `${successCount} PDFs downloaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });
    } else {
      toast({
        title: 'Download Failed',
        description: 'Failed to download PDFs',
        variant: 'destructive',
      });
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
        
        if (result.warning) {
          toast({
            title: 'Warning',
            description: result.warning,
            variant: 'destructive',
          });
        }
        
        fetchInvoices();
      } else {
        throw new Error(result.error || 'Failed to send invoice');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invoice',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      paidDate: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      notes: ''
    });
    setIsPaymentDialogOpen(true);
  };

  const handleChangeStatus = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsStatusDialogOpen(true);
  };

  const submitPayment = async () => {
    if (!selectedInvoice) return;

    if (!paymentData.paymentMethod) {
      toast({
        title: 'Validation Error',
        description: 'Please select a payment method',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${selectedInvoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'paid',
          paidDate: paymentData.paidDate,
          paymentMethod: paymentData.paymentMethod,
          paymentNotes: paymentData.notes,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Payment recorded successfully',
        });
        setIsPaymentDialogOpen(false);
        setSelectedInvoice(null);
        fetchInvoices();
      } else {
        throw new Error(result.error || 'Failed to record payment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record payment',
        variant: 'destructive',
      });
    }
  };

  const submitStatusChange = async (newStatus: string) => {
    if (!selectedInvoice) return;

    try {
      const updateData: any = { status: newStatus };
      
      // If changing from paid to another status, clear payment data
      if (selectedInvoice.status === 'paid' && newStatus !== 'paid') {
        updateData.paidDate = null;
        updateData.paymentMethod = null;
        updateData.paymentNotes = null;
      }

      const response = await fetch(`/api/invoices/${selectedInvoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Invoice status updated to ${statusConfig[newStatus as keyof typeof statusConfig].label}`,
        });
        setIsStatusDialogOpen(false);
        setSelectedInvoice(null);
        fetchInvoices();
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Invoice deleted successfully',
        });
        fetchInvoices();
      } else {
        throw new Error('Failed to delete invoice');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner-green w-12 h-12 mx-auto mb-4"></div>
          <p className="text-green-muted">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white">Invoices</h1>
          <p className="text-green-muted text-lg">Track and manage all your invoices</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={isExporting || invoices.length === 0}
            className="btn-green-secondary"
          >
            <FileDown className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button
            variant="outline"
            onClick={handleBulkDownloadPDFs}
            disabled={isExporting || filteredInvoices.length === 0}
            className="btn-green-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Downloading...' : 'Download All PDFs'}
          </Button>
          <Link href="/dashboard/create">
            <Button className="btn-green-primary green-glow">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Export Features Card */}
      <Card className="card-green-mist">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-green-primary" />
            Export & PDF Features
          </CardTitle>
          <CardDescription className="text-green-muted">
            Professional branded PDFs and comprehensive data export options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center space-x-3 mb-2">
                <Download className="w-5 h-5 text-green-primary" />
                <h3 className="font-semibold text-white">Branded PDFs</h3>
              </div>
              <p className="text-sm text-green-muted">
                Professional invoices with your company branding, colors, and logo
              </p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center space-x-3 mb-2">
                <FileDown className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">CSV Export</h3>
              </div>
              <p className="text-sm text-green-muted">
                Export all invoice data for accounting software and analysis
              </p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">Bulk Download</h3>
              </div>
              <p className="text-sm text-green-muted">
                Download multiple PDFs at once for batch processing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="card-green-mist">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-muted w-4 h-4" />
                <Input
                  placeholder="Search invoices by number, client name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-green"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 input-green">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-green-900 border-green-500/30">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = invoices.filter(inv => inv.status === status).length;
          const Icon = config.icon;
          
          return (
            <Card key={status} className="card-green-mist group cursor-pointer" onClick={() => setStatusFilter(status)}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-muted">{config.label}</p>
                    <p className="text-2xl font-bold text-white">{count}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${config.color.replace('text-', 'text-').replace('border-', 'bg-').replace('/30', '/20')} group-hover:green-glow transition-all duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Invoices List */}
      <Card className="card-green-mist">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-green-primary" />
            {filteredInvoices.length} Invoice{filteredInvoices.length !== 1 ? 's' : ''}
          </CardTitle>
          <CardDescription className="text-green-muted">
            {statusFilter !== 'all' ? `Filtered by ${statusConfig[statusFilter as keyof typeof statusConfig]?.label} status` : 'All invoices'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-green-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No invoices found</h3>
              <p className="text-green-muted mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first invoice to get started'}
              </p>
              <Link href="/dashboard/create">
                <Button className="btn-green-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-6 border border-green-500/20 rounded-lg hover:bg-green-500/5 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:green-glow transition-all duration-300">
                      <FileText className="w-6 h-6 text-green-primary" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <p className="font-semibold text-white text-lg">{invoice.invoiceNumber}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-green-muted">{invoice.clientName}</p>
                      <div className="flex items-center space-x-4 text-sm text-green-muted mt-1">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Created {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Due {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                          {invoice.status === 'overdue' && (
                            <span className="ml-1 text-red-400">
                              ({getDaysOverdue(invoice.dueDate)} days overdue)
                            </span>
                          )}
                        </span>
                      </div>
                      {invoice.paidDate && (
                        <div className="flex items-center space-x-2 text-sm text-green-400 mt-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Paid on {format(new Date(invoice.paidDate), 'MMM dd, yyyy')}</span>
                          {invoice.paymentMethod && (
                            <span className="text-green-muted">via {invoice.paymentMethod}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="font-bold text-white text-xl flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {invoice.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-green-muted">
                        Due {format(new Date(invoice.dueDate), 'MMM dd')}
                      </p>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-muted hover:text-green-primary"
                        onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                        title="Download Branded PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      {invoice.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-muted hover:text-blue-400"
                          onClick={() => handleSendInvoice(invoice.id)}
                          title="Send Invoice"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-muted hover:text-green-400"
                          onClick={() => handleMarkAsPaid(invoice)}
                          title="Mark as Paid"
                        >
                          <CreditCard className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-muted hover:text-yellow-400"
                        onClick={() => handleChangeStatus(invoice)}
                        title="Change Status"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-muted hover:text-red-400"
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-green-900/95 border-green-500/30 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-green-primary" />
              Record Payment
            </DialogTitle>
            <DialogDescription className="text-green-muted">
              Record payment details for invoice {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paidDate" className="text-white">Payment Date *</Label>
              <Input
                id="paidDate"
                type="date"
                value={paymentData.paidDate}
                onChange={(e) => setPaymentData(prev => ({ ...prev, paidDate: e.target.value }))}
                className="input-green"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="text-white">Payment Method *</Label>
              <Select
                value={paymentData.paymentMethod}
                onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger className="input-green">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent className="bg-green-900 border-green-500/30">
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentNotes" className="text-white">Notes (Optional)</Label>
              <Input
                id="paymentNotes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional payment notes"
                className="input-green"
              />
            </div>
            
            {selectedInvoice && (
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-green-muted">Invoice Amount:</span>
                  <span className="text-white font-bold text-lg">${selectedInvoice.amount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              className="btn-green-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={submitPayment}
              className="btn-green-primary"
            >
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-green-900/95 border-green-500/30 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Edit className="w-5 h-5 mr-2 text-green-primary" />
              Change Status
            </DialogTitle>
            <DialogDescription className="text-green-muted">
              Update the status for invoice {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {Object.entries(statusConfig).map(([status, config]) => {
              const Icon = config.icon;
              const isCurrentStatus = selectedInvoice?.status === status;
              
              return (
                <Button
                  key={status}
                  variant="outline"
                  className={`w-full justify-start h-auto p-4 ${
                    isCurrentStatus 
                      ? 'border-green-500 bg-green-500/20 text-green-primary' 
                      : 'border-green-500/30 text-green-muted hover:border-green-500/50 hover:bg-green-500/10'
                  }`}
                  onClick={() => submitStatusChange(status)}
                  disabled={isCurrentStatus}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">{config.label}</p>
                      <p className="text-sm opacity-75">{config.description}</p>
                    </div>
                  </div>
                  {isCurrentStatus && (
                    <CheckCircle className="w-4 h-4 ml-auto" />
                  )}
                </Button>
              );
            })}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              className="btn-green-secondary"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}