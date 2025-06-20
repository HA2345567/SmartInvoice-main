'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Clock, Send, Phone, Scale, Trash2, Mail, DollarSign, Calendar, TrendingUp, Users, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  remindersSent: number;
  lastReminderSent?: string;
}

interface ReminderStats {
  totalOverdue: number;
  totalOverdueAmount: number;
  remindersSentToday: number;
  avgDaysOverdue: number;
  clientsWithOverdueInvoices: number;
  upcomingReminders: number;
}

interface EscalationRecommendation {
  invoice: OverdueInvoice;
  recommendation: string;
  action: 'call' | 'legal' | 'collection' | 'writeoff';
}

const actionConfig = {
  call: {
    label: 'Phone Call',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: Phone
  },
  legal: {
    label: 'Legal Action',
    color: 'bg-red-500/20 text-red-300 border-red-500/30',
    icon: Scale
  },
  collection: {
    label: 'Collection',
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    icon: AlertTriangle
  },
  writeoff: {
    label: 'Write Off',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    icon: Trash2
  }
};

export default function RemindersPage() {
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [needingReminders, setNeedingReminders] = useState<OverdueInvoice[]>([]);
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [escalations, setEscalations] = useState<EscalationRecommendation[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchOverdueData();
    }
  }, [token]);

  const fetchOverdueData = async () => {
    try {
      const response = await fetch('/api/reminders/overdue', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOverdueInvoices(data.overdueInvoices);
        setNeedingReminders(data.needingReminders);
        setStats(data.stats);
        setEscalations(data.escalations);
      } else {
        throw new Error('Failed to fetch overdue data');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch overdue invoices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(needingReminders.map(inv => inv.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSendReminders = async () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select invoices to send reminders for',
        variant: 'destructive',
      });
      return;
    }

    setSendingReminders(true);
    try {
      const response = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoiceIds: selectedInvoices,
          sendEmail: true
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Reminders Sent',
          description: `Successfully sent ${result.summary.successful} reminders (${result.summary.emailsSent} emails)`,
        });
        
        setSelectedInvoices([]);
        fetchOverdueData(); // Refresh data
      } else {
        throw new Error(result.error || 'Failed to send reminders');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send reminders',
        variant: 'destructive',
      });
    } finally {
      setSendingReminders(false);
    }
  };

  const getUrgencyBadge = (daysOverdue: number, remindersSent: number) => {
    if (daysOverdue > 30 || remindersSent >= 3) {
      return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">High</Badge>;
    } else if (daysOverdue > 7 || remindersSent >= 2) {
      return <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">Medium</Badge>;
    } else {
      return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Low</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner-green w-12 h-12 mx-auto mb-4"></div>
          <p className="text-green-muted">Loading reminder data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white">Smart Reminders</h1>
          <p className="text-green-muted text-lg">AI-powered overdue invoice management and automated reminders</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleSendReminders}
            disabled={selectedInvoices.length === 0 || sendingReminders}
            className="btn-green-primary green-glow"
          >
            <Send className="w-4 h-4 mr-2" />
            {sendingReminders ? 'Sending...' : `Send Reminders (${selectedInvoices.length})`}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="card-green-mist group animate-slide-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-muted">Overdue Invoices</CardTitle>
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:green-glow transition-all duration-300">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.totalOverdue}</div>
              <p className="text-xs mt-1 text-red-400">
                ${stats.totalOverdueAmount.toLocaleString()} total amount
              </p>
            </CardContent>
          </Card>

          <Card className="card-green-mist group animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-muted">Avg Days Overdue</CardTitle>
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:green-glow transition-all duration-300">
                <Clock className="h-4 w-4 text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.avgDaysOverdue}</div>
              <p className="text-xs mt-1 text-orange-400">
                {stats.clientsWithOverdueInvoices} clients affected
              </p>
            </CardContent>
          </Card>

          <Card className="card-green-mist group animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-muted">Reminders Today</CardTitle>
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:green-glow transition-all duration-300">
                <Mail className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.remindersSentToday}</div>
              <p className="text-xs mt-1 text-blue-400">
                {stats.upcomingReminders} pending reminders
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Features Card */}
      <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="w-5 h-5 mr-2 text-green-primary" />
            Smart Reminder Features
          </CardTitle>
          <CardDescription className="text-green-muted">
            AI-powered reminder system with intelligent timing and escalation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-primary" />
                <h3 className="font-semibold text-white">Smart Timing</h3>
              </div>
              <p className="text-sm text-green-muted">
                AI adjusts reminder timing based on invoice amount and client payment history
              </p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center space-x-3 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Client Profiling</h3>
              </div>
              <p className="text-sm text-green-muted">
                Personalized reminder strategies based on individual client behavior patterns
              </p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-center space-x-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">Auto Escalation</h3>
              </div>
              <p className="text-sm text-green-muted">
                Automatic escalation recommendations for severely overdue invoices
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Reminders */}
      <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center">
                <Send className="w-5 h-5 mr-2 text-green-primary" />
                Pending Reminders ({needingReminders.length})
              </CardTitle>
              <CardDescription className="text-green-muted">
                Invoices that need reminder emails sent
              </CardDescription>
            </div>
            {needingReminders.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedInvoices.length === needingReminders.length}
                  onCheckedChange={handleSelectAll}
                  className="border-green-500/30"
                />
                <span className="text-sm text-green-muted">Select All</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {needingReminders.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">All caught up!</h3>
              <p className="text-green-muted">No pending reminders at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {needingReminders.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border border-green-500/20 rounded-lg hover:bg-green-500/5 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedInvoices.includes(invoice.id)}
                      onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                      className="border-green-500/30"
                    />
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <p className="font-semibold text-white">{invoice.invoiceNumber}</p>
                        {getUrgencyBadge(invoice.daysOverdue, invoice.remindersSent)}
                      </div>
                      <p className="text-green-muted">{invoice.clientName}</p>
                      <div className="flex items-center space-x-4 text-sm text-green-muted mt-1">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {invoice.daysOverdue} days overdue
                        </span>
                        <span className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {invoice.remindersSent} reminders sent
                        </span>
                        {invoice.lastReminderSent && (
                          <span className="text-xs">
                            Last: {format(new Date(invoice.lastReminderSent), 'MMM dd')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-white text-lg flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {invoice.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-red-400">
                      Due {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Overdue Invoices */}
      <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.5s' }}>
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
            All Overdue Invoices ({overdueInvoices.length})
          </CardTitle>
          <CardDescription className="text-green-muted">
            Complete list of overdue invoices with reminder history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overdueInvoices.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No overdue invoices!</h3>
              <p className="text-green-muted">All your invoices are up to date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {overdueInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border border-red-500/20 rounded-lg hover:bg-red-500/5 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <p className="font-semibold text-white">{invoice.invoiceNumber}</p>
                        {getUrgencyBadge(invoice.daysOverdue, invoice.remindersSent)}
                      </div>
                      <p className="text-green-muted">{invoice.clientName}</p>
                      <div className="flex items-center space-x-4 text-sm text-green-muted mt-1">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {invoice.daysOverdue} days overdue
                        </span>
                        <span className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {invoice.remindersSent} reminders
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Due {format(new Date(invoice.dueDate), 'MMM dd')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-white text-lg">${invoice.amount.toFixed(2)}</p>
                    <p className="text-sm text-red-400">
                      {invoice.daysOverdue} days overdue
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escalation Recommendations */}
      {escalations.length > 0 && (
        <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.6s' }}>
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Scale className="w-5 h-5 mr-2 text-orange-400" />
              Escalation Recommendations ({escalations.length})
            </CardTitle>
            <CardDescription className="text-green-muted">
              AI-powered recommendations for severely overdue invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {escalations.map((escalation, index) => {
                const config = actionConfig[escalation.action];
                const Icon = config.icon;
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-orange-500/20 rounded-lg bg-orange-500/5"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-orange-400" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <p className="font-semibold text-white">{escalation.invoice.invoiceNumber}</p>
                          <Badge className={config.color}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-green-muted">{escalation.invoice.clientName}</p>
                        <p className="text-sm text-orange-300 mt-1">{escalation.recommendation}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-white text-lg">${escalation.invoice.amount.toFixed(2)}</p>
                      <p className="text-sm text-red-400">
                        {escalation.invoice.daysOverdue} days overdue
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}