'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Save, Building, Mail, Bell, CreditCard, Shield, Sparkles, Zap, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    // Company Information
    companyName: 'SmartInvoice',
    companyAddress: 'Your Company Address\nCity, State - PIN Code',
    companyGST: 'Your GST Number',
    companyEmail: 'billing@smartinvoice.com',
    companyPhone: '+91 9876543210',
    
    // Invoice Settings
    invoicePrefix: 'INV',
    defaultTerms: 'Payment due within 30 days',
    defaultNotes: 'Thank you for your business!',
    autoGenerateNumbers: true,
    
    // Email Settings
    emailNotifications: true,
    reminderEmails: true,
    reminderDays: 7,
    
    // Payment Settings
    razorpayEnabled: false,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    
    // Tax Settings
    defaultGSTRate: 18,
    defaultTDSRate: 2,
  });

  const handleSave = () => {
    // In a real app, you would save to database/API
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been updated successfully.',
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white">Settings</h1>
          <p className="text-green-muted text-lg">Configure your SmartInvoice preferences and business details</p>
        </div>
        <Button onClick={handleSave} className="btn-green-primary green-glow">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Settings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-green-mist group animate-slide-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-muted">Company Profile</CardTitle>
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:green-glow transition-all duration-300">
              <Building className="h-4 w-4 text-green-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{settings.companyName}</div>
            <p className="text-xs mt-1 text-green-muted">
              Business information and branding
            </p>
          </CardContent>
        </Card>

        <Card className="card-green-mist group animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-muted">Email Integration</CardTitle>
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:green-glow transition-all duration-300">
              <Mail className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{settings.emailNotifications ? 'Active' : 'Disabled'}</div>
            <p className="text-xs mt-1 text-green-muted">
              Automated email notifications
            </p>
          </CardContent>
        </Card>

        <Card className="card-green-mist group animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-muted">Payment Gateway</CardTitle>
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:green-glow transition-all duration-300">
              <CreditCard className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{settings.razorpayEnabled ? 'Connected' : 'Not Setup'}</div>
            <p className="text-xs mt-1 text-green-muted">
              Payment processing status
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-8">
          {/* Company Information */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Building className="w-5 h-5 text-green-primary" />
                </div>
                <div>
                  <CardTitle className="text-white">Company Information</CardTitle>
                  <CardDescription className="text-green-muted">
                    This information will appear on your invoices and communications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-white font-medium">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="input-green"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyGST" className="text-white font-medium">GST Number</Label>
                  <Input
                    id="companyGST"
                    value={settings.companyGST}
                    onChange={(e) => handleInputChange('companyGST', e.target.value)}
                    className="input-green"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress" className="text-white font-medium">Company Address</Label>
                <Textarea
                  id="companyAddress"
                  value={settings.companyAddress}
                  onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                  rows={3}
                  className="input-green"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyEmail" className="text-white font-medium">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                    className="input-green"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone" className="text-white font-medium">Phone</Label>
                  <Input
                    id="companyPhone"
                    value={settings.companyPhone}
                    onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                    className="input-green"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Settings */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Invoice Settings</CardTitle>
                  <CardDescription className="text-green-muted">
                    Configure default invoice behavior and templates
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix" className="text-white font-medium">Invoice Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={settings.invoicePrefix}
                    onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                    className="input-green"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="space-y-0.5">
                    <Label className="text-white font-medium">Auto-generate Numbers</Label>
                    <p className="text-sm text-green-muted">Automatically generate invoice numbers</p>
                  </div>
                  <Switch
                    checked={settings.autoGenerateNumbers}
                    onCheckedChange={(checked) => handleInputChange('autoGenerateNumbers', checked)}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultTerms" className="text-white font-medium">Default Terms & Conditions</Label>
                <Textarea
                  id="defaultTerms"
                  value={settings.defaultTerms}
                  onChange={(e) => handleInputChange('defaultTerms', e.target.value)}
                  rows={2}
                  className="input-green"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultNotes" className="text-white font-medium">Default Notes</Label>
                <Textarea
                  id="defaultNotes"
                  value={settings.defaultNotes}
                  onChange={(e) => handleInputChange('defaultNotes', e.target.value)}
                  rows={2}
                  className="input-green"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tax Settings */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Tax Settings</CardTitle>
                  <CardDescription className="text-green-muted">
                    Configure default tax rates for your invoices
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultGSTRate" className="text-white font-medium">Default GST Rate (%)</Label>
                  <Input
                    id="defaultGSTRate"
                    type="number"
                    value={settings.defaultGSTRate}
                    onChange={(e) => handleInputChange('defaultGSTRate', parseFloat(e.target.value))}
                    className="input-green"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultTDSRate" className="text-white font-medium">Default TDS Rate (%)</Label>
                  <Input
                    id="defaultTDSRate"
                    type="number"
                    value={settings.defaultTDSRate}
                    onChange={(e) => handleInputChange('defaultTDSRate', parseFloat(e.target.value))}
                    className="input-green"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-8">
          {/* Email Notifications */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.6s' }}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Email Settings</CardTitle>
                  <CardDescription className="text-green-muted">Notification preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="space-y-0.5">
                  <Label className="text-white font-medium">Email Notifications</Label>
                  <p className="text-sm text-green-muted">Send invoice emails to clients</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              <Separator className="bg-green-500/30" />
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="space-y-0.5">
                  <Label className="text-white font-medium">Payment Reminders</Label>
                  <p className="text-sm text-green-muted">Auto-send payment reminders</p>
                </div>
                <Switch
                  checked={settings.reminderEmails}
                  onCheckedChange={(checked) => handleInputChange('reminderEmails', checked)}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              {settings.reminderEmails && (
                <div className="space-y-2">
                  <Label htmlFor="reminderDays" className="text-white font-medium">Reminder Days</Label>
                  <Input
                    id="reminderDays"
                    type="number"
                    value={settings.reminderDays}
                    onChange={(e) => handleInputChange('reminderDays', parseInt(e.target.value))}
                    className="input-green"
                  />
                  <p className="text-xs text-green-muted">Days after due date to send reminder</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Integration */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.7s' }}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Payment Integration</CardTitle>
                  <CardDescription className="text-green-muted">Payment gateway setup</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="space-y-0.5">
                  <Label className="text-white font-medium">Razorpay Integration</Label>
                  <p className="text-sm text-green-muted">Enable payment links</p>
                </div>
                <Switch
                  checked={settings.razorpayEnabled}
                  onCheckedChange={(checked) => handleInputChange('razorpayEnabled', checked)}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              {settings.razorpayEnabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="razorpayKeyId" className="text-white font-medium">Key ID</Label>
                    <Input
                      id="razorpayKeyId"
                      value={settings.razorpayKeyId}
                      onChange={(e) => handleInputChange('razorpayKeyId', e.target.value)}
                      placeholder="rzp_test_..."
                      className="input-green"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="razorpayKeySecret" className="text-white font-medium">Key Secret</Label>
                    <Input
                      id="razorpayKeySecret"
                      type="password"
                      value={settings.razorpayKeySecret}
                      onChange={(e) => handleInputChange('razorpayKeySecret', e.target.value)}
                      placeholder="Enter secret key"
                      className="input-green"
                    />
                  </div>
                  <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10">
                    <Shield className="w-3 h-3 mr-1" />
                    Test Mode
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Smart Features */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.8s' }}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-primary" />
                </div>
                <div>
                  <CardTitle className="text-white">Smart Features</CardTitle>
                  <CardDescription className="text-green-muted">AI-powered enhancements</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center space-x-3 mb-2">
                  <Zap className="w-5 h-5 text-green-primary" />
                  <h3 className="font-semibold text-white">AI Auto-Suggestions</h3>
                </div>
                <p className="text-sm text-green-muted">
                  Smart line items and client data auto-fill based on your history
                </p>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center space-x-3 mb-2">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold text-white">Smart Reminders</h3>
                </div>
                <p className="text-sm text-green-muted">
                  Automated overdue invoice reminders with intelligent timing
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card className="card-green-mist animate-slide-in" style={{ animationDelay: '0.9s' }}>
            <CardHeader>
              <CardTitle className="text-white">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Badge className="bg-green-500/20 text-green-primary border-green-500/30 mb-2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Professional Plan
                </Badge>
                <p className="text-sm text-green-muted">All features unlocked</p>
              </div>
              <Button className="w-full btn-green-primary green-glow">
                <Zap className="w-4 h-4 mr-2" />
                Upgrade to Enterprise
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}