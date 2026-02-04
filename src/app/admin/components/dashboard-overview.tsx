'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, CreditCard, TrendingUp } from 'lucide-react';

interface Stats {
  totalArticles: number;
  totalUsers: number;
  totalRevenue: number;
  totalUnlocks: number;
  recentArticles: number;
  recentUsers: number;
}

export function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalUnlocks: 0,
    recentArticles: 0,
    recentUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Articles',
      value: stats.totalArticles,
      description: `${stats.recentArticles} this week`,
      icon: FileText,
      color: 'text-blue-500',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      description: `${stats.recentUsers} new this week`,
      icon: Users,
      color: 'text-green-500',
    },
    {
      title: 'Total Revenue',
      value: `€${(stats.totalRevenue / 100).toFixed(2)}`,
      description: 'All time',
      icon: CreditCard,
      color: 'text-purple-500',
    },
    {
      title: 'Article Unlocks',
      value: stats.totalUnlocks,
      description: 'All time',
      icon: TrendingUp,
      color: 'text-orange-500',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button 
              className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => window.location.href = '/admin?tab=articles'}
            >
              Create New Article
            </button>
            <button 
              className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => window.location.href = '/admin?tab=billing'}
            >
              Import Billing Data
            </button>
            <button 
              className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={async () => {
                if (confirm('Run AI agents to generate new content?')) {
                  const response = await fetch('/api/agents/run', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${prompt('Enter admin secret:')}`,
                    },
                  });
                  const data = await response.json();
                  alert(data.success ? `Generated ${data.data?.itemsSuccessful || 0} articles` : 'Failed to run agents');
                }
              }}
            >
              Run AI Content Agents
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Database</span>
                <span className="text-sm text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Connected
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Payment Gateway</span>
                <span className="text-sm text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">AI Agents</span>
                <span className="text-sm text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Ready
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
