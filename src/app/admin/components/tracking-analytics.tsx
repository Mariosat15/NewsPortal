'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw, Loader2, Eye, Users, Globe, Smartphone, Monitor,
  Clock, MapPin, MousePointer, ArrowRight, Phone, Search,
  TrendingUp, Calendar, Filter, ChevronDown, ChevronUp, X, Download,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';

interface VisitorSession {
  _id: string;
  sessionId: string;
  landingPageId?: string;
  landingPageSlug?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  ip: string;
  userAgent: string;
  device: {
    type: string;
    os: string;
    browser: string;
  };
  referrer?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  msisdn?: string;
  normalizedMsisdn?: string;
  msisdnConfidence: 'CONFIRMED' | 'UNCONFIRMED' | 'NONE';
  networkType: 'MOBILE_DATA' | 'WIFI' | 'UNKNOWN';
  carrier?: string;
  pageViews: number;
  events: number;
}

interface TrackingEvent {
  _id: string;
  sessionId: string;
  msisdn?: string;
  type: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface LandingPageStats {
  slug: string;
  name: string;
  type?: 'landing_page' | 'main_site';
  totalVisits: number;
  uniqueVisitors: number;
  msisdnCaptured: number;
  mobileDataVisits?: number;
  wifiVisits?: number;
  conversionRate: number;
  topSource?: string;
}

interface Stats {
  totalSessions: number;
  totalEvents: number;
  uniqueVisitors: number;
  msisdnCaptured: number;
  mobileDataVisits: number;
  wifiVisits: number;
  captureRate: number;
}

export function TrackingAnalytics() {
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [landingPageStats, setLandingPageStats] = useState<LandingPageStats[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSession, setSelectedSession] = useState<VisitorSession | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<string | null>(null); // Filter by page slug
  const [mobileOnly, setMobileOnly] = useState(true); // Default to showing only mobile data visits
  
  // Sorting state
  type SortField = 'lastSeen' | 'firstSeen' | 'msisdn' | 'visits' | 'referrer' | 'network' | 'carrier' | 'page';
  const [sortField, setSortField] = useState<SortField>('lastSeen');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch sessions
      const sessionsRes = await fetch('/api/admin/tracking/sessions');
      const sessionsData = sessionsRes.ok ? await sessionsRes.json() : { sessions: [] };
      
      // Fetch events
      const eventsRes = await fetch('/api/admin/tracking/events');
      const eventsData = eventsRes.ok ? await eventsRes.json() : { events: [] };
      
      // Fetch landing page stats
      const lpStatsRes = await fetch('/api/admin/tracking/landing-page-stats');
      const lpStatsData = lpStatsRes.ok ? await lpStatsRes.json() : { stats: [] };

      const sessionsList = sessionsData.sessions || sessionsData.data?.sessions || [];
      const eventsList = eventsData.events || eventsData.data?.events || [];
      const lpStatsList = lpStatsData.stats || lpStatsData.data?.stats || [];

      setSessions(sessionsList);
      setEvents(eventsList);
      setLandingPageStats(lpStatsList);

      // Calculate stats
      const uniqueIps = new Set(sessionsList.map((s: VisitorSession) => s.ip)).size;
      const msisdnCount = sessionsList.filter((s: VisitorSession) => s.msisdn).length;
      const mobileCount = sessionsList.filter((s: VisitorSession) => s.networkType === 'MOBILE_DATA').length;
      const wifiCount = sessionsList.filter((s: VisitorSession) => s.networkType === 'WIFI').length;

      setStats({
        totalSessions: sessionsList.length,
        totalEvents: eventsList.length,
        uniqueVisitors: uniqueIps,
        msisdnCaptured: msisdnCount,
        mobileDataVisits: mobileCount,
        wifiVisits: wifiCount,
        captureRate: sessionsList.length > 0 ? (msisdnCount / sessionsList.length) * 100 : 0,
      });
    } catch (error) {
      console.error('Error loading tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const sessionDate = new Date(session.firstSeenAt);
      if (sessionDate < fromDate) {
        return false;
      }
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      const sessionDate = new Date(session.lastSeenAt);
      if (sessionDate > toDate) {
        return false;
      }
    }

    // Filter by mobile only
    if (mobileOnly && session.networkType !== 'MOBILE_DATA') {
      return false;
    }

    // Filter by selected page
    if (selectedPage) {
      if (selectedPage === 'main-site') {
        // Main site = sessions without landing page
        if (session.landingPageSlug) {
          return false;
        }
      } else {
        // Landing page filter
        if (session.landingPageSlug !== selectedPage) {
          return false;
        }
      }
    }

    // Filter by search (searches multiple fields)
    if (search) {
      const searchLower = search.toLowerCase();
      const searchableFields = [
        session.sessionId,
        session.ip,
        session.msisdn,
        session.landingPageSlug,
        session.referrer,
        session.carrier,
        session.networkType,
        session.utm?.source,
        session.utm?.medium,
        session.utm?.campaign,
        session.device?.browser,
        session.device?.os,
      ].filter(Boolean).map(f => f!.toLowerCase());
      
      const matchesSearch = searchableFields.some(field => field.includes(searchLower));
      if (!matchesSearch) {
        return false;
      }
    }
    return true;
  });

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Monitor className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'CONFIRMED':
        return <Badge className="bg-green-100 text-green-700">Confirmed</Badge>;
      case 'UNCONFIRMED':
        return <Badge className="bg-yellow-100 text-yellow-700">Unconfirmed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600">None</Badge>;
    }
  };

  const getNetworkBadge = (network: string) => {
    switch (network) {
      case 'MOBILE_DATA':
        return <Badge className="bg-blue-100 text-blue-700">Mobile Data</Badge>;
      case 'WIFI':
        return <Badge className="bg-purple-100 text-purple-700">WiFi</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600">Unknown</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group sessions by MSISDN (or IP if no MSISDN)
  interface SessionGroup {
    key: string;
    msisdn: string | null;
    sessions: VisitorSession[];
    latestSession: VisitorSession;
    totalVisits: number;
    landingPages: string[];
    firstSeenAt: string;
  }

  const groupSessionsByMsisdn = (sessionList: VisitorSession[]): SessionGroup[] => {
    const groups = new Map<string, VisitorSession[]>();
    
    sessionList.forEach(session => {
      // Use MSISDN as key if available, otherwise use IP
      const key = session.msisdn || `ip_${session.ip}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(session);
    });

    // Convert to array and sort by latest activity
    return Array.from(groups.entries()).map(([key, sessions]) => {
      // Sort sessions by lastSeenAt descending
      sessions.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
      const latestSession = sessions[0];
      
      // Get unique landing pages
      const landingPages = [...new Set(sessions.map(s => s.landingPageSlug).filter(Boolean))] as string[];
      
      // Sum total page views
      const totalVisits = sessions.reduce((sum, s) => sum + (s.pageViews || 1), 0);
      
      // Get earliest first seen
      const firstSeenAt = sessions.reduce((earliest, s) => {
        const sDate = new Date(s.firstSeenAt).getTime();
        const eDate = new Date(earliest).getTime();
        return sDate < eDate ? s.firstSeenAt : earliest;
      }, sessions[0].firstSeenAt);

      return {
        key,
        msisdn: latestSession.msisdn || null,
        sessions,
        latestSession,
        totalVisits,
        landingPages,
        firstSeenAt,
      };
    });
  };

  // Sort grouped sessions based on current sort settings
  const sortGroups = (groups: SessionGroup[]): SessionGroup[] => {
    return [...groups].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'lastSeen':
          comparison = new Date(a.latestSession.lastSeenAt).getTime() - new Date(b.latestSession.lastSeenAt).getTime();
          break;
        case 'firstSeen':
          comparison = new Date(a.firstSeenAt).getTime() - new Date(b.firstSeenAt).getTime();
          break;
        case 'msisdn':
          const msisdnA = a.msisdn || '';
          const msisdnB = b.msisdn || '';
          comparison = msisdnA.localeCompare(msisdnB);
          break;
        case 'visits':
          comparison = a.totalVisits - b.totalVisits;
          break;
        case 'referrer':
          const refA = a.latestSession.referrer || '';
          const refB = b.latestSession.referrer || '';
          comparison = refA.localeCompare(refB);
          break;
        case 'network':
          const netA = a.latestSession.networkType || '';
          const netB = b.latestSession.networkType || '';
          comparison = netA.localeCompare(netB);
          break;
        case 'carrier':
          const carrierA = a.latestSession.carrier || '';
          const carrierB = b.latestSession.carrier || '';
          comparison = carrierA.localeCompare(carrierB);
          break;
        case 'page':
          const pageA = a.latestSession.landingPageSlug || 'Main Site';
          const pageB = b.latestSession.landingPageSlug || 'Main Site';
          comparison = pageA.localeCompare(pageB);
          break;
        default:
          comparison = new Date(a.latestSession.lastSeenAt).getTime() - new Date(b.latestSession.lastSeenAt).getTime();
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Toggle sort - if same field, toggle direction; if different field, set to desc
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get sort icon for a field
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Get sorted and grouped data
  const getSortedGroupedData = () => {
    return sortGroups(groupSessionsByMsisdn(filteredSessions));
  };

  // Export visitor sessions to CSV (uses current sort order)
  const exportToCSV = () => {
    const groupedData = getSortedGroupedData();
    
    // CSV Headers
    const headers = [
      'Mobile Number (MSISDN)',
      'IP Address',
      'Network Type',
      'Carrier',
      'Device Type',
      'Browser',
      'OS',
      'Current Page',
      'Landing Pages Visited',
      'Referrer',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
      'Total Visits',
      'Total Sessions',
      'First Seen',
      'Last Seen',
      'MSISDN Confidence',
      'User Agent'
    ];

    // CSV Rows
    const rows = groupedData.map(group => {
      const session = group.latestSession;
      // Format MSISDN as text for Excel (prefix with ' to prevent scientific notation)
      const msisdnForExcel = group.msisdn ? `'${group.msisdn}` : 'Not detected';
      return [
        msisdnForExcel,
        session.ip || '',
        session.networkType || 'UNKNOWN',
        session.carrier || '',
        session.device?.type || '',
        session.device?.browser || '',
        session.device?.os || '',
        session.landingPageSlug ? `/lp/${session.landingPageSlug}` : 'Main Site',
        group.landingPages.map(lp => `/lp/${lp}`).join('; ') || 'None',
        session.referrer || '',
        session.utm?.source || '',
        session.utm?.medium || '',
        session.utm?.campaign || '',
        group.totalVisits.toString(),
        group.sessions.length.toString(),
        new Date(group.firstSeenAt).toLocaleString('de-DE'),
        new Date(session.lastSeenAt).toLocaleString('de-DE'),
        session.msisdnConfidence || 'NONE',
        session.userAgent || ''
      ];
    });

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV content
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Generate filename with date and filter info
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    let filename = `visitor-sessions-${dateStr}`;
    if (selectedPage) {
      filename += `-${selectedPage}`;
    }
    if (dateFrom) {
      filename += `-from-${dateFrom}`;
    }
    if (dateTo) {
      filename += `-to-${dateTo}`;
    }
    filename += '.csv';

    // Download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Visitor Analytics</h1>
          <p className="text-muted-foreground">Track visitor sessions, MSISDN captures, and conversions across all pages</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card className="p-4 border-l-4 border-l-blue-500">
            <p className="text-2xl font-bold">{stats.totalSessions}</p>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-purple-500">
            <p className="text-2xl font-bold">{stats.uniqueVisitors}</p>
            <p className="text-xs text-muted-foreground">Unique Visitors</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-green-500">
            <p className="text-2xl font-bold">{stats.msisdnCaptured}</p>
            <p className="text-xs text-muted-foreground">MSISDN Captured</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-yellow-500">
            <p className="text-2xl font-bold">{stats.captureRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Capture Rate</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-blue-500" />
              <span className="font-bold">{stats.mobileDataVisits}</span>
            </div>
            <p className="text-xs text-muted-foreground">Mobile Data</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-500" />
              <span className="font-bold">{stats.wifiVisits}</span>
            </div>
            <p className="text-xs text-muted-foreground">WiFi Visits</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-orange-500">
            <p className="text-2xl font-bold">{stats.totalEvents}</p>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </Card>
        </div>
      )}

      {/* Page Performance - Clickable to filter visitors */}
      {landingPageStats.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="py-3 px-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-medium">
                Page Performance (Click to filter visitors)
              </CardTitle>
              {selectedPage && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedPage(null)}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Page</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-500">Visits</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-500">Unique</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-500">
                      <div className="flex items-center justify-center gap-1">
                        <Phone className="h-3 w-3" />
                        MSISDN
                      </div>
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-gray-500">
                      <div className="flex items-center justify-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        Mobile
                      </div>
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-gray-500">
                      <div className="flex items-center justify-center gap-1">
                        <Globe className="h-3 w-3" />
                        WiFi
                      </div>
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-gray-500">Rate</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {landingPageStats.map((lp) => {
                    const isSelected = selectedPage === lp.slug;
                    return (
                      <tr 
                        key={lp.slug} 
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-100 hover:bg-blue-150 ring-2 ring-blue-500 ring-inset' 
                            : lp.type === 'main_site' 
                              ? 'bg-blue-50 hover:bg-blue-100' 
                              : 'hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedPage(isSelected ? null : lp.slug)}
                      >
                        <td className="p-3 font-medium">
                          <div className="flex items-center gap-2">
                            {isSelected && <MousePointer className="h-3 w-3 text-blue-600" />}
                            <span>{lp.name || lp.slug}</span>
                            {lp.type === 'landing_page' && (
                              <span className="text-xs text-gray-400">/lp/{lp.slug}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={lp.type === 'main_site' ? 'default' : 'outline'} className="text-xs">
                            {lp.type === 'main_site' ? 'Main' : 'LP'}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">{lp.totalVisits}</td>
                        <td className="p-3 text-center">{lp.uniqueVisitors}</td>
                        <td className="p-3 text-center">
                          <span className={`font-medium ${lp.msisdnCaptured > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {lp.msisdnCaptured}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-blue-600">{lp.mobileDataVisits || 0}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-purple-600">{lp.wifiVisits || 0}</span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={lp.conversionRate > 50 ? 'default' : 'outline'}>
                            {lp.conversionRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-3 text-gray-500 text-sm">{lp.topSource || 'direct'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by session ID, IP, phone, or page..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36 h-9"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36 h-9"
              />
            </div>
            {/* Mobile Only Filter */}
            <label className="flex items-center gap-2 cursor-pointer select-none ml-2">
              <input
                type="checkbox"
                checked={mobileOnly}
                onChange={(e) => setMobileOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Smartphone className="h-3.5 w-3.5" />
                Mobile Data Only
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List - Grouped by MSISDN */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-medium">Visitor Sessions</CardTitle>
              {selectedPage && (
                <Badge variant="default" className="bg-blue-600">
                  <Filter className="h-3 w-3 mr-1" />
                  {selectedPage === 'main-site' ? 'Main Site' : `/lp/${selectedPage}`}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {filteredSessions.length} sessions | {groupSessionsByMsisdn(filteredSessions).length} unique visitors
              </span>
              {selectedPage && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedPage(null)}
                  className="text-xs h-7"
                >
                  Show All
                </Button>
              )}
              {/* Export Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToCSV}
                disabled={filteredSessions.length === 0}
                className="text-xs h-7"
              >
                <Download className="h-3 w-3 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No sessions found</p>
              <p className="text-sm">
                {selectedPage 
                  ? `No visitors for ${selectedPage === 'main-site' ? 'Main Site' : `/lp/${selectedPage}`}` 
                  : 'Sessions will appear when visitors land on your pages'}
              </p>
              {selectedPage && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedPage(null)}
                  className="mt-4"
                >
                  Show All Visitors
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {/* Sortable Header Row */}
              <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-4 text-xs font-medium text-gray-600">
                <div className="w-8"></div> {/* Device icon space */}
                <button 
                  onClick={() => toggleSort('msisdn')}
                  className="flex items-center hover:text-gray-900 min-w-[140px]"
                >
                  Phone/IP {getSortIcon('msisdn')}
                </button>
                <button 
                  onClick={() => toggleSort('network')}
                  className="flex items-center hover:text-gray-900 min-w-[80px]"
                >
                  Network {getSortIcon('network')}
                </button>
                <button 
                  onClick={() => toggleSort('carrier')}
                  className="flex items-center hover:text-gray-900 min-w-[70px]"
                >
                  Carrier {getSortIcon('carrier')}
                </button>
                <button 
                  onClick={() => toggleSort('page')}
                  className="flex items-center hover:text-gray-900 min-w-[80px]"
                >
                  Page {getSortIcon('page')}
                </button>
                <button 
                  onClick={() => toggleSort('referrer')}
                  className="flex items-center hover:text-gray-900 flex-1"
                >
                  Referrer {getSortIcon('referrer')}
                </button>
                <button 
                  onClick={() => toggleSort('visits')}
                  className="flex items-center hover:text-gray-900 min-w-[60px]"
                >
                  Visits {getSortIcon('visits')}
                </button>
                <button 
                  onClick={() => toggleSort('firstSeen')}
                  className="flex items-center hover:text-gray-900 min-w-[90px]"
                >
                  First Seen {getSortIcon('firstSeen')}
                </button>
                <button 
                  onClick={() => toggleSort('lastSeen')}
                  className="flex items-center hover:text-gray-900 min-w-[90px]"
                >
                  Last Seen {getSortIcon('lastSeen')}
                </button>
              </div>
              {getSortedGroupedData().slice(0, 50).map((group) => (
                <div key={group.key} className="hover:bg-gray-50">
                  {/* Session Row */}
                  <div 
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedSession(expandedSession === group.key ? null : group.key)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        {getDeviceIcon(group.latestSession.device?.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {group.msisdn ? (
                            <span className="font-medium text-green-600 font-mono">
                              <Phone className="h-3 w-3 inline mr-1" />
                              {group.msisdn}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm font-mono">{group.latestSession.ip}</span>
                          )}
                          {getConfidenceBadge(group.latestSession.msisdnConfidence)}
                          {getNetworkBadge(group.latestSession.networkType)}
                          {group.latestSession.carrier && (
                            <Badge variant="outline" className="text-xs">{group.latestSession.carrier}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                          <span>{group.latestSession.device?.browser} on {group.latestSession.device?.os}</span>
                          {/* Show current page/landing page */}
                          {group.latestSession.landingPageSlug ? (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              📍 /lp/{group.latestSession.landingPageSlug}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                              📍 Main Site
                            </Badge>
                          )}
                          {/* Show other landing pages visited */}
                          {group.landingPages.length > 0 && !group.landingPages.includes(group.latestSession.landingPageSlug || '') && (
                            <span className="text-blue-600 text-xs">
                              Also: {group.landingPages.filter(lp => lp !== group.latestSession.landingPageSlug).map(lp => `/lp/${lp}`).join(', ')}
                            </span>
                          )}
                        </div>
                        {/* Referrer - where they came from */}
                        {group.latestSession.referrer && (
                          <div className="text-xs text-orange-600 mt-1 truncate max-w-lg" title={group.latestSession.referrer}>
                            <span className="text-gray-500 mr-1">Came from:</span>
                            {group.latestSession.referrer}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="font-medium">
                          {group.totalVisits} visit{group.totalVisits > 1 ? 's' : ''}
                          {group.sessions.length > 1 && (
                            <span className="text-gray-400 ml-1">({group.sessions.length} sessions)</span>
                          )}
                        </div>
                        <div className="text-gray-500">{formatDate(group.latestSession.lastSeenAt)}</div>
                        {group.firstSeenAt !== group.latestSession.lastSeenAt && (
                          <div className="text-xs text-gray-400">First: {formatDate(group.firstSeenAt)}</div>
                        )}
                      </div>
                      {expandedSession === group.key ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedSession === group.key && (
                    <div className="px-4 pb-4 bg-gray-50 border-t">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Mobile Number (Full)</p>
                          <p className="font-mono text-sm font-medium text-green-600">{group.msisdn || 'Not detected'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">IP Address</p>
                          <p className="font-mono text-sm">{group.latestSession.ip}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">First Seen</p>
                          <p className="text-sm">{formatDate(group.firstSeenAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Last Seen</p>
                          <p className="text-sm">{formatDate(group.latestSession.lastSeenAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Total Sessions</p>
                          <p className="text-sm font-medium">{group.sessions.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Total Page Views</p>
                          <p className="text-sm font-medium">{group.totalVisits}</p>
                        </div>
                        {group.latestSession.utm?.source && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase">UTM Source</p>
                            <p className="text-sm">{group.latestSession.utm.source}</p>
                          </div>
                        )}
                        {group.latestSession.utm?.campaign && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Campaign</p>
                            <p className="text-sm">{group.latestSession.utm.campaign}</p>
                          </div>
                        )}
                        {group.latestSession.carrier && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Carrier</p>
                            <p className="text-sm">{group.latestSession.carrier}</p>
                          </div>
                        )}
                      </div>
                      {/* Referrer - Full URL */}
                      {group.latestSession.referrer && (
                        <div className="border-t pt-2 mt-2">
                          <p className="text-xs text-gray-500 uppercase mb-1">Referrer (Full URL)</p>
                          <p className="text-sm text-orange-600 break-all">{group.latestSession.referrer}</p>
                        </div>
                      )}
                      {/* Landing Pages Visited */}
                      {group.landingPages.length > 0 && (
                        <div className="border-t pt-2 mt-2">
                          <p className="text-xs text-gray-500 uppercase mb-1">Landing Pages Visited</p>
                          <div className="flex flex-wrap gap-1">
                            {group.landingPages.map(lp => (
                              <Badge key={lp} variant="outline" className="text-xs">/lp/{lp}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-gray-400 border-t pt-2 mt-2">
                        User Agent: {group.latestSession.userAgent}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
