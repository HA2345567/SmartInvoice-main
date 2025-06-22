// Dashboard Main Page
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign, Clock, TrendingUp, Plus, Download, Users, AlertCircle, BarChart3, Sparkles, Zap, CheckCircle, Send, Calendar, Eye } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Analytics {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  averageInvoiceValue: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
    invoices: number;
  }>;
  topClients: Array<{
    id: string;
    name: string;
    company?: string;
    totalAmount: number;
    totalInvoices: number;
  }>;
  invoiceStatusDistribution: {
    paid: number;
    pending: number;
    draft: number;
    overdue: number;
  };
}

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

// Helper function to safely format dates
const safeFormatDate = (dateString: string | null | undefined, formatString: string = 'MMM dd, yyyy') => {
  if (!dateString) return 'Not set';
  try {
    return format(new Date(dateString), formatString);
  } catch (error) {
    return 'Invalid date';
  }
};

// Helper function to safely format currency
const safeFormatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0.00';
  return Number(amount).toFixed(2);
};

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { token, user } = useAuth();

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const [analyticsResponse, invoicesResponse] = await Promise.all([
        fetch('/api/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('/api/invoices', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      ]);

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setRecentInvoices(invoicesData.slice(0, 5));
        
        // Filter pending invoices (sent + overdue)
        const pending = invoicesData.filter((inv: Invoice) => 
          inv.status === 'sent' || inv.status === 'overdue'
        ).slice(0, 10);
        setPendingInvoices(pending);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'sent':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'overdue':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'draft':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return CheckCircle;
      case 'sent':
        return Send;
      case 'overdue':
        return AlertCircle;
      case 'draft':
        return FileText;
      default:
        return FileText;
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    if (!dueDate) return 0;
    try {
      const due = new Date(dueDate);
      const today = new Date();
      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner-dark w-12 h-12 mx-auto mb-4"></div>
          <p className="text-dark-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleString('default', { month: 'short', year: '2-digit' });
  const currentMonthRevenue = analytics?.monthlyData.find(m => m.month === currentMonth)?.revenue || 0;

  const stats = analytics ? [
    {
      title: 'Total Revenue',
      value: `$${safeFormatCurrency(analytics.totalRevenue)}`,
      change: `${analytics.paidInvoices} paid invoices`,
      changeType: 'positive',
      icon: DollarSign,
      color: 'green',
    },
    {
      title: 'Pending Invoices',
      value: (analytics.pendingInvoices || 0).toString(),
      change: `${analytics.invoiceStatusDistribution.overdue || 0} overdue`,
      changeType: (analytics.invoiceStatusDistribution.overdue || 0) > 0 ? 'negative' : 'neutral',
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'This Month',
      value: `$${safeFormatCurrency(currentMonthRevenue)}`,
      change: 'Revenue this month',
      changeType: 'positive',
      icon: Calendar,
      color: 'blue',
    },
    {
      title: 'Avg. Invoice Value',
      value: `$${safeFormatCurrency(analytics.averageInvoiceValue)}`,
      change: `Based on ${analytics.paidInvoices} paid invoices`,
      changeType: 'neutral',
      icon: TrendingUp,
      color: 'purple',
    },
  ] : [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-muted text-base sm:text-lg">
            Welcome back, {user?.name || 'User'}! Here's your business overview.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Link href="/dashboard/create">
            <Button className="btn-dark-primary dark-glow w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="card-dark-mist group animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-muted">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 bg-${stat.color}-500/20 rounded-lg flex items-center justify-center group-hover:dark-glow transition-all duration-300`}>
                <stat.icon className={`h-4 w-4 text-${stat.color}-400`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
              <p className={`text-xs mt-1 ${
                stat.changeType === 'positive' ? 'text-green-400' : 
                stat.changeType === 'negative' ? 'text-red-400' : 'text-dark-muted'
              }`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Monthly Income Trend */}
        <Card className="card-dark-mist lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-dark-primary" />
                Monthly Income Trend
              </CardTitle>
              <CardDescription className="text-dark-muted">Revenue from paid invoices over the last 6 months</CardDescription>
            </div>
            <Link href="/dashboard/analytics">
              <Button variant="ghost" className="text-dark-muted hover:text-dark-primary">View Details</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {analytics && analytics.monthlyData && analytics.monthlyData.length > 0 ? (
              <div className="h-64 sm:h-80 w-full">
                {/* A proper chart component should be used here. For now, a simple representation: */}
                <div className="flex h-full items-end justify-around space-x-2">
                  {analytics.monthlyData.slice(-6).map((month, i) => {
                    const maxRevenue = Math.max(...analytics.monthlyData.map(m => m.revenue));
                    const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={i} className="flex flex-col items-center justify-end h-full">
                        <div 
                          className="w-8 sm:w-12 bg-green-500 rounded-t-lg hover:bg-green-400 transition-all"
                          style={{ height: `${height}%` }}
                          title={`$${safeFormatCurrency(month.revenue)}`}
                        ></div>
                        <p className="text-xs text-dark-muted mt-2">{month.month}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-64 sm:h-80 flex flex-col items-center justify-center text-center">
                <BarChart3 className="w-12 h-12 text-dark-muted mb-4" />
                <h3 className="font-semibold text-white">No revenue data yet</h3>
                <p className="text-dark-muted">Paid invoices will be shown here.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <Card className="card-dark-mist">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Zap className="w-5 h-5 mr-2 text-dark-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-3">
            <Link href="/dashboard/create">
              <Button className="w-full justify-start btn-subtle-dark">
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </Link>
            <Link href="/dashboard/clients">
               <Button className="w-full justify-start btn-subtle-dark">
                <Users className="w-4 h-4 mr-2" />
                Manage Clients
              </Button>
            </Link>
             <Link href="/dashboard/reminders">
               <Button className="w-full justify-start btn-subtle-dark">
                <Clock className="w-4 h-4 mr-2" />
                Payment Reminders
              </Button>
            </Link>
             <Link href="/dashboard/analytics">
               <Button className="w-full justify-start btn-subtle-dark">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Invoices */}
        <Card className="card-dark-mist">
          <CardHeader>
            <CardTitle className="text-white">Recent Invoices</CardTitle>
            <CardDescription className="text-dark-muted">Your 5 most recently created invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentInvoices.length > 0 ? (
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {recentInvoices.map((invoice, invoiceIdx) => (
                    <li key={invoice.id}>
                      <div className="relative pb-8">
                        {invoiceIdx !== recentInvoices.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-dark-border" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3 items-start">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-dark-bg bg-dark-border`}>
                              <FileText className="h-4 w-4 text-dark-muted" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5">
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-dark-muted">
                                Invoice <span className="font-medium text-dark-primary">#{invoice.invoiceNumber}</span> to <span className="font-medium text-white">{invoice.clientName || "N/A"}</span>
                              </p>
                              <time dateTime={invoice.createdAt} className="flex-shrink-0 text-xs text-dark-muted">{safeFormatDate(invoice.createdAt)}</time>
                            </div>
                            <div className="mt-2 flex justify-between items-center">
                                <Badge className={`${getStatusColor(invoice.status)} text-xs font-semibold`}>{invoice.status}</Badge>
                                <p className="text-lg font-bold text-white">${safeFormatCurrency(invoice.amount)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-dark-muted" />
                <h3 className="mt-2 text-sm font-medium text-white">No recent invoices</h3>
                <p className="mt-1 text-sm text-dark-muted">Get started by creating a new invoice.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invoices */}
        <Card className="card-dark-mist">
          <CardHeader>
            <CardTitle className="text-white">Pending Invoices</CardTitle>
            <CardDescription className="text-dark-muted">Invoices that are due or overdue.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingInvoices.length > 0 ? (
              <ul role="list" className="divide-y divide-dark-border">
                {pendingInvoices.map((invoice) => (
                  <li key={invoice.id} className="py-3 sm:py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                           invoice.status === 'overdue' ? 'bg-red-500/20' : 'bg-blue-500/20'
                         }`}>
                          <AlertCircle className={`w-4 h-4 ${
                            invoice.status === 'overdue' ? 'text-red-400' : 'text-blue-400'
                          }`} />
                         </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {invoice.clientName || 'No Client'}
                        </p>
                        <p className="text-sm text-dark-muted truncate">
                          Due {safeFormatDate(invoice.dueDate)}
                          {invoice.status === 'overdue' && ` (${getDaysOverdue(invoice.dueDate)} days overdue)`}
                        </p>
                      </div>
                      <div className="inline-flex items-center text-base font-semibold text-white">
                        ${safeFormatCurrency(invoice.amount)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-2 text-sm font-medium text-white">All caught up!</h3>
                <p className="mt-1 text-sm text-dark-muted">You have no pending or overdue invoices.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}