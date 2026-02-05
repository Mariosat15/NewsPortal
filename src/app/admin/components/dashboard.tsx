'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  CreditCard, 
  Settings, 
  Bot,
  Upload,
  Layout,
  Image,
  Rocket,
  LogOut,
  Menu,
  BarChart3,
  Megaphone,
  Palette,
  DollarSign,
  Cog,
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DashboardOverview } from './dashboard-overview';
import { ArticlesManager } from './articles-manager';
import { PeopleManager } from './people-manager';
import { TransactionsManager } from './transactions-manager';
import { BillingImport } from './billing-import';
import { AgentConfig } from './agent-config';
import { BrandingSettings } from './branding-settings';
import { TemplateManager } from './template-manager';
import { ImageSources } from './image-sources';
import { LandingPagesManager } from './landing-pages-manager';
import { TrackingAnalytics } from './tracking-analytics';
import { CategoriesManager } from './categories-manager';
import { LegalPagesManager } from './legal-pages-manager';
import { FolderOpen } from 'lucide-react';

type TabType = 'overview' | 'articles' | 'categories' | 'users' | 'transactions' | 'billing' | 'agents' | 'landing-pages' | 'analytics' | 'templates' | 'images' | 'settings' | 'legal';

interface NavSection {
  title: string;
  icon: typeof LayoutDashboard;
  items: { id: TabType; label: string; icon: typeof LayoutDashboard }[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    icon: LayoutDashboard,
    items: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Content',
    icon: FileText,
    items: [
      { id: 'articles', label: 'Articles', icon: FileText },
      { id: 'categories', label: 'Categories', icon: FolderOpen },
      { id: 'templates', label: 'Templates', icon: Layout },
      { id: 'images', label: 'Image Sources', icon: Image },
    ],
  },
  {
    title: 'Customers',
    icon: Users,
    items: [
      { id: 'users', label: 'People', icon: Users },
      { id: 'transactions', label: 'Transactions', icon: CreditCard },
      { id: 'billing', label: 'Billing Import', icon: Upload },
    ],
  },
  {
    title: 'Marketing',
    icon: Megaphone,
    items: [
      { id: 'landing-pages', label: 'Landing Pages', icon: Rocket },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'System',
    icon: Cog,
    items: [
      { id: 'agents', label: 'AI Agents', icon: Bot },
      { id: 'legal', label: 'Legal Pages', icon: Scale },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [personSearch, setPersonSearch] = useState<string | null>(null);
  const peopleManagerRef = useRef<{ searchPerson: (phone: string) => void } | null>(null);

  // Listen for navigate-to-person events from other components
  useEffect(() => {
    const handleNavigateToPerson = (event: CustomEvent<string>) => {
      const phone = event.detail;
      setActiveTab('users');
      setPersonSearch(phone);
    };

    window.addEventListener('navigate-to-person', handleNavigateToPerson as EventListener);
    return () => {
      window.removeEventListener('navigate-to-person', handleNavigateToPerson as EventListener);
    };
  }, []);

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

        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {navSections.map((section, sectionIndex) => (
            <div key={section.title} className={cn(sectionIndex > 0 && 'mt-4')}>
              {/* Section Header */}
              {sidebarOpen && (
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
              )}
              {!sidebarOpen && sectionIndex > 0 && (
                <div className="border-t border-gray-100 my-2" />
              )}
              
              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start h-9',
                      !sidebarOpen && 'justify-center px-2',
                      activeTab === item.id && 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    )}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon className={cn('h-4 w-4', sidebarOpen && 'mr-3')} />
                    {sidebarOpen && <span className="text-sm">{item.label}</span>}
                  </Button>
                ))}
              </div>
            </div>
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
          {activeTab === 'categories' && <CategoriesManager />}
          {activeTab === 'users' && <PeopleManager initialSearch={personSearch} onSearchComplete={() => setPersonSearch(null)} />}
          {activeTab === 'transactions' && <TransactionsManager />}
          {activeTab === 'billing' && <BillingImport />}
          {activeTab === 'agents' && <AgentConfig />}
          {activeTab === 'landing-pages' && <LandingPagesManager />}
          {activeTab === 'analytics' && <TrackingAnalytics />}
          {activeTab === 'images' && <ImageSources />}
          {activeTab === 'templates' && <TemplateManager />}
          {activeTab === 'legal' && <LegalPagesManager />}
          {activeTab === 'settings' && <BrandingSettings />}
        </div>
      </main>
    </div>
  );
}
