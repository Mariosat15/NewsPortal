'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  CreditCard, 
  Settings, 
  Bot,
  Upload,
  Download,
  LogOut,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DashboardOverview } from './dashboard-overview';
import { ArticlesManager } from './articles-manager';
import { UsersManager } from './users-manager';
import { BillingImport } from './billing-import';
import { AgentConfig } from './agent-config';

type TabType = 'overview' | 'articles' | 'users' | 'billing' | 'agents' | 'settings';

const tabs: { id: TabType; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'articles', label: 'Articles', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'billing', label: 'Billing Import', icon: Upload },
  { id: 'agents', label: 'AI Agents', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-white border-r transition-transform',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {sidebarOpen && (
            <span className="font-bold text-lg">Admin Panel</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start',
                !sidebarOpen && 'justify-center px-2'
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className={cn('h-5 w-5', sidebarOpen && 'mr-2')} />
              {sidebarOpen && tab.label}
            </Button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-4">
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-red-500 hover:text-red-600',
              !sidebarOpen && 'justify-center px-2'
            )}
            onClick={handleLogout}
          >
            <LogOut className={cn('h-5 w-5', sidebarOpen && 'mr-2')} />
            {sidebarOpen && 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          'transition-all p-8',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && <DashboardOverview />}
          {activeTab === 'articles' && <ArticlesManager />}
          {activeTab === 'users' && <UsersManager />}
          {activeTab === 'billing' && <BillingImport />}
          {activeTab === 'agents' && <AgentConfig />}
          {activeTab === 'settings' && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Settings</h1>
              <p className="text-muted-foreground">Brand settings and configuration coming soon.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
