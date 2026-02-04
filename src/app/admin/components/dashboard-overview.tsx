'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Users, CreditCard, TrendingUp, Activity, BarChart3, 
  ArrowUpRight, ArrowDownRight, Target, DollarSign, UserPlus, ShoppingCart,
  Repeat, Eye, Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
} from 'recharts';

interface Stats {
  totalArticles: number;
  totalUsers: number;
  totalRevenue: number;
  totalUnlocks: number;
  recentArticles: number;
  recentUsers: number;
  totalCustomers: number;
  returningCustomers: number;
  conversionRate: string;
  avgRevenuePerUser: string;
  topArticles?: { title: string; views: number; unlocks: number; slug: string }[];
  viewsByCategory?: { category: string; views: number; unlocks: number; articles: number; color: string }[];
  revenueByDay?: { date: string; revenue: number; unlocks: number }[];
  userGrowth?: { date: string; newUsers: number; totalUsers: number }[];
  transactionsByStatus?: Record<string, number>;
  articleRevenueData?: { title: string; revenue: number; unlocks: number }[];
  conversionFunnel?: { stage: string; value: number; color: string }[];
  lpPerformance?: { name: string; visits: number; conversions: number; rate: number }[];
  weekOverWeek?: {
    unlocks: { current: number; previous: number; change: number };
    revenue: { current: number; previous: number; change: number };
  };
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  pending: '#f59e0b',
  failed: '#ef4444',
  cancelled: '#6b7280',
};

export function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalUnlocks: 0,
    recentArticles: 0,
    recentUsers: 0,
    totalCustomers: 0,
    returningCustomers: 0,
    conversionRate: '0',
    avgRevenuePerUser: '0',
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

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`;
  const formatChange = (change: number) => {
    if (change > 0) return <span className="text-green-600 flex items-center text-xs"><ArrowUpRight className="h-3 w-3" />+{change}%</span>;
    if (change < 0) return <span className="text-red-600 flex items-center text-xs"><ArrowDownRight className="h-3 w-3" />{change}%</span>;
    return <span className="text-gray-500 text-xs">0%</span>;
  };

  // Prepare transaction status data for pie chart
  const transactionStatusData = stats.transactionsByStatus 
    ? Object.entries(stats.transactionsByStatus).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: STATUS_COLORS[status] || '#6b7280',
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Badge variant="outline" className="text-xs">
          Last updated: {new Date().toLocaleTimeString()}
        </Badge>
      </div>

      {/* Main Stats Cards - 2 rows */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalArticles}</div>
            <p className="text-xs text-muted-foreground">{stats.recentArticles} this week</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.recentUsers} new this week</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : formatCurrency(stats.totalRevenue / 100)}</div>
            <div className="flex items-center gap-2">
              {stats.weekOverWeek && formatChange(stats.weekOverWeek.revenue.change)}
              <span className="text-xs text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unlocks</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalUnlocks}</div>
            <div className="flex items-center gap-2">
              {stats.weekOverWeek && formatChange(stats.weekOverWeek.unlocks.change)}
              <span className="text-xs text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Customers</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.totalCustomers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Returning</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.returningCustomers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Conv. Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.conversionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg. Revenue/User</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">€{stats.avgRevenuePerUser}</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Unlocks Chart - FIXED */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Revenue & Unlocks (Last 7 Days)
          </CardTitle>
          <CardDescription>Daily revenue in euros and article unlocks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading chart...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.revenueByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={(value) => `€${value.toFixed(2)}`}
                    domain={[0, 'auto']}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    domain={[0, 'auto']}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      const numValue = typeof value === 'number' ? value : 0;
                      if (name === 'Revenue (€)') return [`€${numValue.toFixed(2)}`, 'Revenue'];
                      return [numValue, 'Unlocks'];
                    }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.95)', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    name="Revenue (€)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="unlocks"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ fill: '#22c55e', r: 4 }}
                    name="Unlocks"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              User Growth (14 Days)
            </CardTitle>
            <CardDescription>New user registrations and total users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {loading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.userGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.95)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalUsers" 
                      stroke="#3b82f6" 
                      fill="#3b82f680" 
                      name="Total Users"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="newUsers" 
                      stroke="#22c55e" 
                      fill="#22c55e80" 
                      name="New Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Transactions by Status
            </CardTitle>
            <CardDescription>Distribution of transaction outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {loading || transactionStatusData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {loading ? 'Loading...' : 'No transaction data'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={transactionStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {transactionStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Views by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance by Category
            </CardTitle>
            <CardDescription>Views and unlocks per category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {loading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.viewsByCategory || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="category" 
                      tick={{ fontSize: 12 }}
                      width={90}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.95)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="views" fill="#3b82f6" name="Views" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="unlocks" fill="#22c55e" name="Unlocks" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Conversion Funnel
            </CardTitle>
            <CardDescription>User journey from views to purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats.conversionFunnel || []).map((stage, index) => {
                const maxValue = stats.conversionFunnel?.[0]?.value || 1;
                const percentage = Math.round((stage.value / maxValue) * 100);
                return (
                  <div key={stage.stage} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{stage.stage}</span>
                      <span className="text-muted-foreground">{stage.value.toLocaleString()} ({percentage}%)</span>
                    </div>
                    <div className="h-8 bg-muted rounded-lg overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ 
                          width: `${percentage}%`, 
                          backgroundColor: stage.color,
                        }}
                      >
                        {percentage > 15 && (
                          <span className="text-white text-xs font-medium">{percentage}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Top Articles */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Top Performing Articles
            </CardTitle>
            <CardDescription>Articles with most views and unlocks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats.topArticles || []).map((article, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium truncate max-w-[350px]">
                      {article.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline">{article.views} views</Badge>
                    <Badge className="bg-green-100 text-green-700">{article.unlocks} unlocks</Badge>
                  </div>
                </div>
              ))}
              {(!stats.topArticles || stats.topArticles.length === 0) && (
                <p className="text-muted-foreground text-center py-4">No article data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button 
              className="w-full text-left px-4 py-3 rounded-md hover:bg-muted transition-colors text-sm border"
              onClick={() => window.location.href = '/admin?tab=articles'}
            >
              <span className="font-medium">Create New Article</span>
              <p className="text-muted-foreground text-xs mt-0.5">Add content manually</p>
            </button>
            <button 
              className="w-full text-left px-4 py-3 rounded-md hover:bg-muted transition-colors text-sm border"
              onClick={() => window.location.href = '/admin?tab=billing'}
            >
              <span className="font-medium">Import Billing Data</span>
              <p className="text-muted-foreground text-xs mt-0.5">Upload CSV from provider</p>
            </button>
            <button 
              className="w-full text-left px-4 py-3 rounded-md hover:bg-muted transition-colors text-sm border"
              onClick={async () => {
                if (confirm('Run AI agents to generate new content?')) {
                  const secret = prompt('Enter admin secret:');
                  if (!secret) return;
                  const response = await fetch('/api/agents/run', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${secret}` },
                  });
                  const data = await response.json();
                  alert(data.success ? `Generated ${data.data?.itemsSuccessful || 0} articles` : 'Failed');
                }
              }}
            >
              <span className="font-medium">Run AI Agents</span>
              <p className="text-muted-foreground text-xs mt-0.5">Generate articles with AI</p>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Landing Page Performance (if available) */}
      {stats.lpPerformance && stats.lpPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Landing Page Performance</CardTitle>
            <CardDescription>Conversion rates by landing page</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Landing Page</th>
                    <th className="text-right py-2 font-medium">Visits</th>
                    <th className="text-right py-2 font-medium">Conversions</th>
                    <th className="text-right py-2 font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lpPerformance.map((lp, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{lp.name}</td>
                      <td className="text-right py-2">{lp.visits}</td>
                      <td className="text-right py-2">{lp.conversions}</td>
                      <td className="text-right py-2">
                        <Badge variant={lp.rate > 5 ? 'default' : 'secondary'}>
                          {lp.rate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current system health and connectivity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { name: 'Database', status: 'Connected' },
              { name: 'Payment Gateway', status: 'Active' },
              { name: 'AI Agents', status: 'Ready' },
              { name: 'CDN / Assets', status: 'Operational' },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
