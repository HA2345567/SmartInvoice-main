'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileText, Home, Plus, Users, Settings, LogOut, Menu, X, BarChart3, Download, Sparkles, FileDown, Bell, Zap } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FeedbackWidget } from '@/components/FeedbackWidget';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading, token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Only check authentication after loading is complete
    if (!loading) {
      // Check if we have a stored token as a fallback
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');
      
      // If we have stored data but context doesn't have user/token, 
      // wait a bit more for the context to sync
      if (storedToken && storedUser && !user && !token) {
        // Give the context a moment to sync from localStorage
        const timeoutId = setTimeout(() => {
          if (!user && !token) {
            router.push('/auth/login');
          }
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
      
      // If no stored data and no user/token, redirect to login
      if (!storedToken && !user && !token) {
        router.push('/auth/login');
      }
    }
  }, [user, loading, token, router]);

  const navigation = useMemo(() => [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Create Invoice', href: '/dashboard/create', icon: Plus },
    { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
    { name: 'Clients', href: '/dashboard/clients', icon: Users },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Smart Reminders', href: '/dashboard/reminders', icon: Bell, badge: 'AI' },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ], []);

  const handleExportInvoices = useCallback(async () => {
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
        a.download = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Success',
          description: 'Invoices exported successfully',
        });
      } else {
        throw new Error('Export failed');
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
  }, [token, toast]);

  const handleExportClients = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export/clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Success',
          description: 'Clients exported successfully',
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export clients',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [token, toast]);

  const isActiveRoute = useCallback((href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-dark w-12 h-12 mx-auto mb-4"></div>
          <p className="text-dark-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Only return null if we're not loading and definitely have no user
  if (!loading && !user && !token) {
    // Check localStorage as a fallback
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (!storedToken || !storedUser) {
      return null;
    }
  }

  // Ensure we have a user before rendering the layout
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-dark w-12 h-12 mx-auto mb-4"></div>
          <p className="text-dark-muted">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar-responsive sidebar-dark ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-white/10 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center dark-glow">
              <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-black" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-dark-primary">SmartInvoice</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-dark-muted hover:text-dark-primary p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Navigation - Scrollable */}
        <div className="flex-1 flex flex-col min-h-0">
          <nav className="flex-1 px-2 sm:px-4 py-4 sm:py-6 overflow-y-auto">
            <div className="space-y-1 sm:space-y-2">
              {navigation.map((item) => {
                const isActive = isActiveRoute(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`nav-item-dark flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                      isActive ? 'active' : ''
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <div className="ml-auto">
                        <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-500/20 text-dark-primary text-xs font-bold rounded-full border border-green-500/30 flex items-center">
                          <Zap className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">{item.badge}</span>
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Smart Features Section */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10">
              <h3 className="text-xs sm:text-sm font-semibold text-dark-primary mb-2 sm:mb-3 px-3 sm:px-4 flex items-center">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Smart Features</span>
                <span className="sm:hidden">Smart</span>
              </h3>
              <div className="space-y-1 sm:space-y-2">
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-dark-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-white truncate">AI Auto-Suggestions</span>
                  </div>
                  <p className="text-xs text-dark-muted hidden sm:block">Smart line items and client data auto-fill</p>
                </div>
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                    <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-dark-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-white truncate">Smart Reminders</span>
                  </div>
                  <p className="text-xs text-dark-muted hidden sm:block">Automated overdue invoice reminders</p>
                </div>
              </div>
            </div>

            {/* Export Section */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10">
              <h3 className="text-xs sm:text-sm font-semibold text-dark-primary mb-2 sm:mb-3 px-3 sm:px-4">Export Data</h3>
              <div className="space-y-1 sm:space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start nav-item-dark px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm h-auto"
                  onClick={handleExportInvoices}
                  disabled={isExporting}
                >
                  <FileDown className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="truncate">{isExporting ? 'Exporting...' : 'Export Invoices'}</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start nav-item-dark px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm h-auto"
                  onClick={handleExportClients}
                  disabled={isExporting}
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="truncate">{isExporting ? 'Exporting...' : 'Export Clients'}</span>
                </Button>
              </div>
            </div>
          </nav>

          {/* User Profile Section - Fixed at bottom */}
          <div className="border-t border-white/10 p-3 sm:p-4 flex-shrink-0">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full flex items-center justify-center text-dark-primary font-semibold border border-green-500/30 flex-shrink-0">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-dark-muted truncate">{user?.email || ''}</p>
                {user?.company && (
                  <p className="text-xs text-dark-muted/70 truncate hidden sm:block">{user.company}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-dark-muted hover:text-red-400 hover:bg-red-500/10 text-xs sm:text-sm h-auto py-2"
              onClick={logout}
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content-responsive">
        {/* Top bar */}
        <div className="top-nav-responsive">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-14 sm:h-16">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-dark-muted hover:text-dark-primary p-2"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link href="/dashboard/reminders" className="hidden sm:block">
                  <Button size="sm" className="btn-dark-secondary text-xs sm:text-sm">
                    <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Smart Reminders</span>
                    <span className="sm:hidden">Reminders</span>
                  </Button>
                </Link>
                <Link href="/dashboard/create">
                  <Button size="sm" className="btn-dark-primary dark-glow text-xs sm:text-sm">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">New Invoice</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="content-area-responsive mobile-safe-area">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Floating Action Button */}
      <Link href="/dashboard/create" className="mobile-fab">
        <Plus className="w-6 h-6" />
      </Link>

      {/* Feedback Widget */}
      <FeedbackWidget />
    </div>
  );
}