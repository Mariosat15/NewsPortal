'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Megaphone, TrendingUp, Users, DollarSign, RefreshCw, ArrowUpRight } from 'lucide-react';

interface CampaignData {
  name: string;
  totalSessions: number;
  totalPageViews: number;
  uniqueVisitors: number;
  msisdnCaptured: number;
  mobileData: number;
  wifiCount: number;
  purchaseCompleted: number;
  avgPageViews: number;
  revenue: number;
  transactions: number;
  captureRate: number;
  conversionRate: number;
  firstSeen: string;
  lastSeen: string;
}

interface CampaignResponse {
  campaigns: CampaignData[];
  directTraffic: {
    name: string;
    totalSessions: number;
    totalPageViews: number;
    uniqueVisitors: number;
    msisdnCaptured: number;
  } | null;
  groupBy: string;
  days: number;
  totalCampaigns: number;
}

const DATE_RANGES = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
  { label: '1Y', value: 365 },
];

export function CampaignDashboard() {
  const [data, setData] = useState<CampaignResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [groupBy, setGroupBy] = useState<'campaign' | 'source' | 'medium'>('source');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tracking/campaigns?days=${days}&groupBy=${groupBy}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setData(json.data);
      }
    } catch (err) {
      console.error('Campaign fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [days, groupBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Prepare chart data (top 8 campaigns by sessions)
  const chartData = (data?.campaigns || []).slice(0, 8).map(c => ({
    name: c.name.length > 20 ? c.name.slice(0, 20) + '…' : c.name,
    Sessions: c.totalSessions,
    Conversions: c.purchaseCompleted,
    'MSISDN Captured': c.msisdnCaptured,
  }));

  const totalSessions = (data?.campaigns || []).reduce((sum, c) => sum + c.totalSessions, 0);
  const totalRevenue = (data?.campaigns || []).reduce((sum, c) => sum + c.revenue, 0);
  const totalConversions = (data?.campaigns || []).reduce((sum, c) => sum + c.purchaseCompleted, 0);
  const avgCaptureRate = totalSessions > 0
    ? ((data?.campaigns || []).reduce((sum, c) => sum + c.msisdnCaptured, 0) / totalSessions * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-blue-500" />
            Campaign Performance
          </h2>
          <p className="text-muted-foreground text-sm">
            Analyze traffic and conversions by UTM parameters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'campaign' | 'source' | 'medium')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="source">By Source</SelectItem>
              <SelectItem value="medium">By Medium</SelectItem>
              <SelectItem value="campaign">By Campaign</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {DATE_RANGES.map(r => (
              <Button
                key={r.value}
                variant={days === r.value ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setDays(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-8">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Sessions</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : totalSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{data?.totalCampaigns || 0} unique {groupBy}s</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : totalConversions}</div>
            <p className="text-xs text-muted-foreground">
              {totalSessions > 0 ? ((totalConversions / totalSessions) * 100).toFixed(1) : '0'}% rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attributed Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{loading ? '—' : (totalRevenue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">from {groupBy} tracking</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg MSISDN Capture</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : avgCaptureRate}%</div>
            <p className="text-xs text-muted-foreground">across all campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sessions vs Conversions by {groupBy}</CardTitle>
            <CardDescription>Top 8 {groupBy}s by total sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Sessions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="MSISDN Captured" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Conversions" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>Detailed breakdown of each {groupBy}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
          ) : (data?.campaigns || []).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No campaign data found. Add UTM parameters to your landing page URLs.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-3 font-medium capitalize">{groupBy}</th>
                    <th className="text-right py-2 px-3 font-medium">Sessions</th>
                    <th className="text-right py-2 px-3 font-medium">Visitors</th>
                    <th className="text-right py-2 px-3 font-medium">PageViews</th>
                    <th className="text-right py-2 px-3 font-medium">MSISDN</th>
                    <th className="text-right py-2 px-3 font-medium">Capture %</th>
                    <th className="text-right py-2 px-3 font-medium">Purchases</th>
                    <th className="text-right py-2 px-3 font-medium">Conv %</th>
                    <th className="text-right py-2 px-3 font-medium">Revenue</th>
                    <th className="text-right py-2 px-3 font-medium">Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.campaigns.map((c, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3 font-medium max-w-[200px] truncate" title={c.name}>
                        {c.name}
                      </td>
                      <td className="text-right py-2 px-3">{c.totalSessions}</td>
                      <td className="text-right py-2 px-3">{c.uniqueVisitors}</td>
                      <td className="text-right py-2 px-3">{c.totalPageViews}</td>
                      <td className="text-right py-2 px-3">{c.msisdnCaptured}</td>
                      <td className="text-right py-2 px-3">
                        <Badge
                          variant={c.captureRate > 30 ? 'default' : c.captureRate > 10 ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {c.captureRate}%
                        </Badge>
                      </td>
                      <td className="text-right py-2 px-3">{c.purchaseCompleted}</td>
                      <td className="text-right py-2 px-3">
                        <Badge
                          variant={c.conversionRate > 5 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {c.conversionRate}%
                        </Badge>
                      </td>
                      <td className="text-right py-2 px-3">€{(c.revenue / 100).toFixed(2)}</td>
                      <td className="text-right py-2 px-3">{c.mobileData}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Direct Traffic Summary */}
          {data?.directTraffic && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">
                Direct / No UTM: {data.directTraffic.totalSessions} sessions,{' '}
                {data.directTraffic.uniqueVisitors} visitors,{' '}
                {data.directTraffic.totalPageViews} page views
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
