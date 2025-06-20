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
          <div className="spinner-dark w-12 h-12 mx-auto mb-4"></div>
          <p className="text-dark-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = analytics ? [
    {
      title: 'Total Invoices',
      value: analytics.totalInvoices.toString(),
      change: `${analytics.paidInvoices} paid, ${analytics.overdueInvoices} overdue`,
      changeType: analytics.overdueInvoices > 0 ? 'negative' : 'positive',
      icon: FileText,
      color: 'green',
    },
    {
      title: 'Amount Paid',
      value: `$${analytics.paidAmount.toLocaleString()}`,
      change: `${analytics.paidInvoices} invoices`,
      changeType: 'positive' as const,
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'Amount Unpaid',
      value: `$${analytics.unpaidAmount.toLocaleString()}`,
      change: `${analytics.unpaidInvoices} pending invoices`,
      changeType: 'neutral' as const,
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Monthly Income',
      value: `$${analytics.monthlyRevenue.toLocaleString()}`,
      change: `This month's revenue`,
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'green',
    },
  ] : [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-muted text-base sm:text-lg">
            Welcome back, {user?.name}! Here's your business overview.
          </p>
        </div>
        <Link href="/dashboard/create" className="w-full sm:w-auto">
          <Button className="btn-dark-primary dark-glow w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid-responsive">
        {stats.map((stat, index) => (
          <Card key={index} className="card-dark group animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-muted">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:dark-glow transition-all duration-300 ${
                stat.color === 'green' ? 'bg-green-500/20' :
                stat.color === 'yellow' ? 'bg-yellow-500/20' : 'bg-green-500/20'
              }`}>
                <stat.icon className={`h-4 w-4 ${
                  stat.color === 'green' ? 'text-green-400' :
                  stat.color === 'yellow' ? 'text-yellow-400' : 'text-green-400'
                }`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stat.value}</div>
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Monthly Income Bar Graph */}
        <div className="lg:col-span-2">
          <Card className="card-dark animate-slide-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                    <BarChart3 className="w-5 h-5 mr-2 text-dark-primary" />
                    Monthly Income Trend
                  </CardTitle>
                  <CardDescription className="text-dark-muted">Revenue over the last 6 months</CardDescription>
                </div>
                <Link href="/dashboard/analytics">
                  <Button className="btn-dark-secondary w-full sm:w-auto">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {analytics && analytics.monthlyData.length > 0 ? (
                <div className="space-y-4">
                  {/* Bar Chart */}
                  <div className="h-48 sm:h-64 flex items-end justify-between space-x-1 sm:space-x-2">
                    {analytics.monthlyData.map((month, index) => {
                      const maxRevenue = Math.max(...analytics.monthlyData.map(m => m.revenue));
                      const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex flex-col items-center">
                            <div className="text-xs text-dark-muted mb-2 font-medium">
                              ${month.revenue.toLocaleString()}
                            </div>
                            <div 
                              className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-500 hover:from-green-500 hover:to-green-300 cursor-pointer group relative"
                              style={{ height: `${Math.max(height, 5)}%` }}
                              title={`${month.month}: $${month.revenue.toLocaleString()}`}
                            >
                              <div className="absolute inset-0 bg-green-400/20 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          </div>
                          <div className="text-xs text-dark-muted mt-2 font-medium">
                            {month.month}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-xs sm:text-sm text-dark-muted">Total Revenue</p>
                      <p className="text-sm sm:text-lg font-bold text-white">
                        ${analytics.monthlyData.reduce((sum, month) => sum + month.revenue, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-sm text-dark-muted">Avg Monthly</p>
                      <p className="text-sm sm:text-lg font-bold text-white">
                        ${Math.round(analytics.monthlyData.reduce((sum, month) => sum + month.revenue, 0) / analytics.monthlyData.length).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-sm text-dark-muted">This Month</p>
                      <p className="text-sm sm:text-lg font-bold text-dark-primary">
                        ${analytics.monthlyRevenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-dark-muted mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No revenue data yet</h3>
                  <p className="text-dark-muted">Create and send invoices to see your income trends</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="card-dark animate-slide-in" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center text-lg">
                <Zap className="w-5 h-5 mr-2 text-dark-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-dark-muted">Common tasks you can perform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/create">
                <Button className="w-full justify-start btn-dark-secondary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Invoice
                </Button>
              </Link>
              <Link href="/dashboard/clients">
                <Button className="w-full justify-start btn-dark-secondary">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Clients
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button className="w-full justify-start btn-dark-secondary">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Top Clients */}
          {analytics && analytics.topClients.length > 0 && (
            <Card className="card-dark animate-slide-in" style={{ animationDelay: '0.6s' }}>
              <CardHeader>
                <CardTitle className="text-white text-lg">Top Clients</CardTitle>
                <CardDescription className="text-dark-muted">Your highest value clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topClients.map((client, index) => (
                    <div key={client.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold text-dark-primary border border-green-500/30">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{client.name}</p>
                          {client.company && (
                            <p className="text-xs text-dark-muted/70">{client.company}</p>
                          )}
                          <p className="text-xs text-dark-muted">{client.totalInvoices} invoices</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-dark-primary">${client.totalAmount.toLocaleString()}</p>
                        <Badge variant="outline" className="border-green-500/30 text-dark-muted text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Status Overview */}
          {analytics && (
            <Card className="card-dark animate-slide-in" style={{ animationDelay: '0.7s' }}>
              <CardHeader>
                <CardTitle className="text-white text-lg">Payment Status</CardTitle>
                <CardDescription className="text-dark-muted">Overview of payment statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-dark-muted">Paid</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 sm:w-20 progress-dark h-2">
                        <div 
                          className="progress-dark-fill h-2" 
                          style={{ width: `${analytics.totalInvoices > 0 ? (analytics.paidInvoices / analytics.totalInvoices) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-white">{analytics.paidInvoices}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-dark-muted">Pending</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 sm:w-20 bg-blue-500/20 rounded h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded" 
                          style={{ width: `${analytics.totalInvoices > 0 ? (analytics.unpaidInvoices / analytics.totalInvoices) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-white">{analytics.unpaidInvoices}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-dark-muted">Overdue</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 sm:w-20 bg-red-500/20 rounded h-2">
                        <div 
                          className="bg-red-500 h-2 rounded" 
                          style={{ width: `${analytics.totalInvoices > 0 ? (analytics.overdueInvoices / analytics.totalInvoices) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-white">{analytics.overdueInvoices}</span>
                    </div>
                  </div>
                </div>
                {analytics.overdueInvoices > 0 && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <p className="text-sm text-red-300">
                        {analytics.overdueInvoices} invoice{analytics.overdueInvoices > 1 ? 's' : ''} overdue
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Pending Invoices List */}
      <Card className="card-dark animate-slide-in" style={{ animationDelay: '0.8s' }}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                <Clock className="w-5 h-5 mr-2 text-yellow-400" />
                Pending Invoices
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Invoices awaiting payment ({pendingInvoices.length} total)
              </CardDescription>
            </div>
            <Link href="/dashboard/invoices?status=sent">
              <Button className="btn-dark-secondary w-full sm:w-auto">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pendingInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-dark-primary" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">All caught up!</h3>
              <p className="text-dark-muted mb-6">No pending invoices at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInvoices.map((invoice) => {
                const StatusIcon = getStatusIcon(invoice.status);
                const isOverdue = invoice.status === 'overdue';
                const daysOverdue = isOverdue ? getDaysOverdue(invoice.dueDate) : 0;
                
                return (
                  <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-all duration-200 group gap-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:dark-glow transition-all duration-300 ${
                        isOverdue ? 'bg-red-500/20' : 'bg-blue-500/20'
                      }`}>
                        <StatusIcon className={`w-6 h-6 ${isOverdue ? 'text-red-400' : 'text-blue-400'}`} />
                      </div>
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-1">
                          <p className="font-semibold text-white text-lg">{invoice.invoiceNumber}</p>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-dark-muted">{invoice.clientName}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-dark-muted mt-1 gap-1 sm:gap-0">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Due {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                          </span>
                          {isOverdue && (
                            <span className="text-red-400 font-medium">
                              {daysOverdue} days overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-4">
                      <div className="text-left sm:text-right">
                        <p className="font-bold text-white text-lg flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {invoice.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-dark-muted">
                          {format(new Date(invoice.date), 'MMM dd')}
                        </p>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-dark-muted hover:text-dark-primary"
                          onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        <Link href={`/dashboard/invoices`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-dark-muted hover:text-green-400"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {pendingInvoices.length >= 10 && (
                <div className="text-center pt-4">
                  <Link href="/dashboard/invoices?status=sent">
                    <Button className="btn-dark-secondary">
                      View All Pending Invoices
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="card-dark animate-slide-in" style={{ animationDelay: '0.9s' }}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                <Sparkles className="w-5 h-5 mr-2 text-dark-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-dark-muted">Your latest invoice activity</CardDescription>
            </div>
            <Link href="/dashboard/invoices">
              <Button className="btn-dark-secondary w-full sm:w-auto">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-dark-primary" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No invoices yet</h3>
              <p className="text-dark-muted mb-6">Create your first invoice to get started</p>
              <Link href="/dashboard/create">
                <Button className="btn-dark-primary dark-glow">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentInvoices.map((invoice) => {
                const StatusIcon = getStatusIcon(invoice.status);
                
                return (
                  <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-all duration-200 group gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:dark-glow transition-all duration-300">
                        <StatusIcon className="w-6 h-6 text-dark-primary" />
                      </div>
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-1">
                          <p className="font-medium text-white">{invoice.invoiceNumber}</p>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-dark-muted">{invoice.clientName}</p>
                        <p className="text-xs text-dark-muted/70">{format(new Date(invoice.date), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-left sm:text-right">
                        <p className="font-medium text-white">${invoice.amount.toFixed(2)}</p>
                        {invoice.paidDate && (
                          <p className="text-xs text-green-400">
                            Paid {format(new Date(invoice.paidDate), 'MMM dd')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-dark-muted hover:text-dark-primary"
                        onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}