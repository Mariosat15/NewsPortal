'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, Users, CreditCard, TrendingUp, Activity, BarChart3, 
  ArrowUpRight, ArrowDownRight, Target, DollarSign, UserPlus, ShoppingCart,
  Repeat, Eye, Zap, RefreshCw, Calendar, Radio
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
  ReferenceLine,
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
  daysFilter?: number;
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

interface EquityPoint {
  timestamp: string;
  revenue: number;
  cumRevenue: number;
  cumUnlocks: number;
  // Computed for display
  label?: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  pending: '#f59e0b',
  failed: '#ef4444',
  cancelled: '#6b7280',
};

const DATE_RANGES = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '60D', value: 60 },
  { label: '120D', value: 120 },
  { label: '1Y', value: 365 },
];

// ── Live Equity Chart Component ──
function LiveEquityChart({ days }: { days: number }) {
  const [equityData, setEquityData] = useState<EquityPoint[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalUnlocks, setTotalUnlocks] = useState(0);
  const [prevRevenue, setPrevRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const lastTimestampRef = useRef<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTimestamp = useCallback((ts: string) => {
    const d = new Date(ts);
    if (days <= 1) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (days <= 7) return d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    if (days <= 60) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [days]);

  const fetchEquity = useCallback(async (incremental: boolean = false) => {
    try {
      const url = incremental && lastTimestampRef.current
        ? `/api/admin/stats/equity?days=${days}&after=${encodeURIComponent(lastTimestampRef.current)}`
        : `/api/admin/stats/equity?days=${days}`;

      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success) return;

      const { equityPoints, totalRevenue: tr, totalUnlocks: tu, lastTimestamp } = json.data;

      if (incremental && lastTimestampRef.current) {
        // Append new points only
        if (equityPoints.length > 0) {
          setEquityData(prev => {
            const newPoints = equityPoints.map((p: EquityPoint) => ({
              ...p,
              label: formatTimestamp(p.timestamp),
            }));
            return [...prev, ...newPoints];
          });
          setPrevRevenue(totalRevenue);
          setTotalRevenue(tr);
          setTotalUnlocks(tu);
        }
      } else {
        // Full load
        const points = equityPoints.map((p: EquityPoint) => ({
          ...p,
          label: formatTimestamp(p.timestamp),
        }));
        setEquityData(points);
        setTotalRevenue(tr);
        setTotalUnlocks(tu);
        setPrevRevenue(tr);
        setLoading(false);
      }

      lastTimestampRef.current = lastTimestamp;
    } catch (err) {
      console.error('Equity fetch error:', err);
    }
  }, [days, formatTimestamp, totalRevenue]);

  // Full load on mount / days change
  useEffect(() => {
    setLoading(true);
    lastTimestampRef.current = null;
    fetchEquity(false);
  }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 10 seconds for incremental updates
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchEquity(true);
    }, 10000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchEquity]);

  const revenueChange = totalRevenue - prevRevenue;
  const isPositive = revenueChange >= 0;

  // Compute domain for the Y axis (add some breathing room)
  const values = equityData.map((p) => p.cumRevenue);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 0;
  const padding = Math.max((maxVal - minVal) * 0.1, 0.5);

  // Custom tooltip
  const EquityTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: EquityPoint }> }) => {
    if (!active || !payload?.[0]) return null;
    const p = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground">{new Date(p.timestamp).toLocaleString()}</p>
        <p className="text-sm font-bold text-green-600">€{p.cumRevenue.toFixed(2)}</p>
        {p.revenue > 0 && (
          <p className="text-xs text-emerald-500">+€{p.revenue.toFixed(2)} this transaction</p>
        )}
        <p className="text-xs text-muted-foreground">{p.cumUnlocks} total unlocks</p>
      </div>
    );
  };

  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Equity / PnL
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              Cumulative revenue over time
              <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                <Radio className="h-3 w-3 animate-pulse" />
                Live
              </span>
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
            <div className="flex items-center justify-end gap-1 text-sm">
              {isPositive ? (
                <span className="text-green-600 flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" />
                  +€{revenueChange.toFixed(2)}
                </span>
              ) : revenueChange < 0 ? (
                <span className="text-red-600 flex items-center gap-0.5">
                  <ArrowDownRight className="h-3 w-3" />
                  €{revenueChange.toFixed(2)}
                </span>
              ) : null}
              <span className="text-muted-foreground text-xs">| {totalUnlocks} unlocks</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[280px]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading equity curve...
            </div>
          ) : equityData.length < 2 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <TrendingUp className="h-8 w-8 opacity-40" />
              <p>No transaction data yet</p>
              <p className="text-xs">The equity chart will appear after the first sale</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={60}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={(v) => `€${v.toFixed(v >= 100 ? 0 : 2)}`}
                  domain={[Math.max(0, minVal - padding), maxVal + padding]}
                  width={65}
                />
                <Tooltip content={<EquityTooltip />} />
                {/* Baseline reference line (start of period) */}
                {equityData.length > 0 && (
                  <ReferenceLine
                    y={equityData[0].cumRevenue}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                )}
                <Area
                  type="stepAfter"
                  dataKey="cumRevenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#equityGrad)"
                  animationDuration={600}
                  dot={false}
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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
  const [daysFilter, setDaysFilter] = useState(7);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async (days: number, silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/admin/stats?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(daysFilter);
  }, [daysFilter, fetchStats]);

  // Auto-refresh stats every 30 seconds (silent — no loading spinner)
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      fetchStats(daysFilter, true);
    }, 30000);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [daysFilter, fetchStats]);

  const handleRefresh = () => {
    fetchStats(daysFilter);
  };

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
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of your news portal performance</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Date Range Filter */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {DATE_RANGES.map((range) => (
              <Button
                key={range.value}
                variant={daysFilter === range.value ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setDaysFilter(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Live Equity / PnL Chart */}
      <LiveEquityChart days={daysFilter} />

      {/* Main Stats Cards */}
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
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">{stats.returningCustomers} returning</p>
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
              <span className="text-xs text-muted-foreground">vs prev period</span>
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
              <span className="text-xs text-muted-foreground">vs prev period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Users</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">{stats.recentUsers} new this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Returning</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.returningCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCustomers > 0 ? Math.round((stats.returningCustomers / stats.totalCustomers) * 100) : 0}% retention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Conv. Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">views to purchase</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg. Rev/Customer</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">€{stats.avgRevenuePerUser}</div>
            <p className="text-xs text-muted-foreground">lifetime value</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Unlocks Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Revenue & Unlocks
              </CardTitle>
              <CardDescription>Last {daysFilter} days - daily revenue and article unlocks</CardDescription>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {daysFilter} days
            </Badge>
          </div>
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
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    interval={daysFilter > 30 ? Math.floor(daysFilter / 10) : 0}
                    angle={daysFilter > 30 ? -45 : 0}
                    textAnchor={daysFilter > 30 ? 'end' : 'middle'}
                    height={daysFilter > 30 ? 60 : 30}
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
                    dot={{ fill: '#22c55e', r: daysFilter > 30 ? 0 : 4 }}
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
              User Growth
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
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor((stats.userGrowth?.length || 1) / 7)} />
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
                const percentage = maxValue > 0 ? Math.round((stage.value / maxValue) * 100) : 0;
                return (
                  <div key={stage.stage} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{stage.stage}</span>
                      <span className="text-muted-foreground">
                        {stage.value.toLocaleString()} 
                        {index > 0 && stats.conversionFunnel?.[index - 1]?.value ? 
                          ` (${Math.round((stage.value / stats.conversionFunnel[index - 1].value) * 100)}% of prev)` : 
                          ''
                        }
                      </span>
                    </div>
                    <div className="h-8 bg-muted rounded-lg overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ 
                          width: `${Math.max(percentage, 2)}%`, 
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
