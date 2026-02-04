'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw, Loader2, Eye, Users, Globe, Smartphone, Monitor,
  Clock, MapPin, MousePointer, ArrowRight, Phone, Search,
  TrendingUp, Calendar, Filter, ChevronDown, ChevronUp, X
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
  totalVisits: number;
  uniqueVisitors: number;
  msisdnCaptured: number;
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
    if (search) {
      const searchLower = search.toLowerCase();
      if (
        !session.sessionId.toLowerCase().includes(searchLower) &&
        !session.ip.toLowerCase().includes(searchLower) &&
        !(session.msisdn && session.msisdn.includes(search)) &&
        !(session.landingPageSlug && session.landingPageSlug.toLowerCase().includes(searchLower))
      ) {
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
          <h1 className="text-2xl font-bold">Landing Page Analytics</h1>
          <p className="text-muted-foreground">Track visitor sessions and MSISDN captures</p>
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

      {/* Landing Page Performance */}
      {landingPageStats.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-base font-medium">Landing Page Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Landing Page</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Visits</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Unique</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">MSISDN</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Rate</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Top Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {landingPageStats.map((lp) => (
                    <tr key={lp.slug} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{lp.name || lp.slug}</td>
                      <td className="p-3">{lp.totalVisits}</td>
                      <td className="p-3">{lp.uniqueVisitors}</td>
                      <td className="p-3 text-green-600 font-medium">{lp.msisdnCaptured}</td>
                      <td className="p-3">
                        <Badge variant={lp.conversionRate > 50 ? 'default' : 'outline'}>
                          {lp.conversionRate.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-500">{lp.topSource || '-'}</td>
                    </tr>
                  ))}
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
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium">Visitor Sessions</CardTitle>
            <span className="text-sm text-muted-foreground">{filteredSessions.length} sessions</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No sessions found</p>
              <p className="text-sm">Sessions will appear when visitors land on your landing pages</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSessions.slice(0, 50).map((session) => (
                <div key={session._id} className="hover:bg-gray-50">
                  {/* Session Row */}
                  <div 
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedSession(expandedSession === session._id ? null : session._id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        {getDeviceIcon(session.device?.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {session.msisdn ? (
                            <span className="font-medium text-green-600">
                              <Phone className="h-3 w-3 inline mr-1" />
                              {session.msisdn.slice(0, -4)}****{session.msisdn.slice(-2)}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">{session.ip}</span>
                          )}
                          {getConfidenceBadge(session.msisdnConfidence)}
                          {getNetworkBadge(session.networkType)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>{session.device?.browser} on {session.device?.os}</span>
                          {session.landingPageSlug && (
                            <span className="text-blue-600">/lp/{session.landingPageSlug}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="font-medium">{session.pageViews} views</div>
                        <div className="text-gray-500">{formatDate(session.lastSeenAt)}</div>
                      </div>
                      {expandedSession === session._id ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedSession === session._id && (
                    <div className="px-4 pb-4 bg-gray-50 border-t">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Session ID</p>
                          <p className="font-mono text-sm truncate">{session.sessionId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">IP Address</p>
                          <p className="font-mono text-sm">{session.ip}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">First Seen</p>
                          <p className="text-sm">{formatDate(session.firstSeenAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Last Seen</p>
                          <p className="text-sm">{formatDate(session.lastSeenAt)}</p>
                        </div>
                        {session.utm?.source && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase">UTM Source</p>
                            <p className="text-sm">{session.utm.source}</p>
                          </div>
                        )}
                        {session.utm?.campaign && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Campaign</p>
                            <p className="text-sm">{session.utm.campaign}</p>
                          </div>
                        )}
                        {session.referrer && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Referrer</p>
                            <p className="text-sm truncate">{session.referrer}</p>
                          </div>
                        )}
                        {session.carrier && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Carrier</p>
                            <p className="text-sm">{session.carrier}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 border-t pt-2">
                        User Agent: {session.userAgent}
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
