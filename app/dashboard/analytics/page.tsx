'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, DollarSign, FileText, Users, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner-green w-12 h-12 mx-auto mb-4"></div>
          <p className="text-green-muted">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to Load Analytics</h3>
          <p className="text-green-muted">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleString('default', { month: 'short', year: '2-digit' });
  const currentMonthRevenue = analytics.monthlyData.find(m => m.month === currentMonth)?.revenue || 0;

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${analytics.totalRevenue.toLocaleString()}`,
      change: `$${currentMonthRevenue.toLocaleString()} this month`,
      changeType: 'positive' as const,
      icon: DollarSign,
    },
    {
      title: 'Pending Invoices',
      value: analytics.pendingInvoices.toLocaleString(),
      change: `${analytics.invoiceStatusDistribution.overdue} overdue`,
      changeType: analytics.invoiceStatusDistribution.overdue > 0 ? 'negative' : 'neutral' as const,
      icon: AlertCircle,
    },
    {
      title: 'Total Invoices',
      value: analytics.totalInvoices.toString(),
      change: `${analytics.paidInvoices} paid, ${analytics.invoiceStatusDistribution.draft} drafts`,
      changeType: 'neutral' as const,
      icon: FileText,
    },
    {
      title: 'Average Invoice',
      value: `$${analytics.averageInvoiceValue.toLocaleString()}`,
      change: 'Average value of paid invoices',
      changeType: 'neutral' as const,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white">Analytics</h1>
          <p className="text-green-muted text-lg">Insights into your business performance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="card-green-mist group animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-muted">
                {stat.title}
              </CardTitle>
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:green-glow transition-all duration-300">
                <stat.icon className="h-4 w-4 text-green-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <p className={`text-xs mt-1 ${
                stat.changeType === 'positive' ? 'text-green-400' : 
                stat.changeType === 'negative' ? 'text-red-400' : 'text-green-muted'
              }`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Revenue Chart */}
        <Card className="card-green-mist">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-primary" />
              Monthly Revenue
            </CardTitle>
            <CardDescription className="text-green-muted">Revenue trends over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.monthlyData.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-8 h-8 text-green-muted mx-auto mb-2" />
                <p className="text-green-muted">Revenue data from paid invoices will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.monthlyData.map((month, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-green-muted">{month.month}</span>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 bg-green-500/20 rounded h-2">
                        <div 
                          className="bg-green-500 h-2 rounded" 
                          style={{ 
                            width: `${analytics.monthlyData.length > 0 ? 
                              (month.revenue / Math.max(...analytics.monthlyData.map(m => m.revenue))) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-white w-20 text-right">
                        ${month.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card className="card-green-mist">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-primary" />
              Top Clients
            </CardTitle>
            <CardDescription className="text-green-muted">Your highest value clients</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topClients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-green-muted mx-auto mb-2" />
                <p className="text-green-muted">No clients yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.topClients.map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-sm font-semibold text-green-primary border border-green-500/30">
                        {(client.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{client.name}</p>
                        {client.company && (
                          <p className="text-xs text-green-muted/70">{client.company}</p>
                        )}
                        <p className="text-xs text-green-muted">{client.totalInvoices} invoices</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-primary">${client.totalAmount.toLocaleString()}</p>
                      <Badge variant="outline" className="border-green-500/30 text-green-muted text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Overview */}
      <Card className="card-green-mist">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-green-primary" />
            Payment Status Overview
          </CardTitle>
          <CardDescription className="text-green-muted">Breakdown of invoice statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="text-2xl font-bold text-green-primary">{analytics.invoiceStatusDistribution.paid}</div>
                <div className="text-sm text-green-muted">Paid</div>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-400">{analytics.invoiceStatusDistribution.pending}</div>
                <div className="text-sm text-green-muted">Pending</div>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="text-2xl font-bold text-red-400">{analytics.invoiceStatusDistribution.overdue}</div>
                <div className="text-sm text-green-muted">Overdue</div>
              </div>
              <div className="text-center p-4 bg-gray-500/10 rounded-lg border border-gray-500/20">
                <div className="text-2xl font-bold text-gray-400">{analytics.invoiceStatusDistribution.draft}</div>
                <div className="text-sm text-green-muted">Drafts</div>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}