'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Download, Eye, Phone, Calendar, CreditCard, X, 
  RefreshCw, Loader2, FileText, DollarSign, Users,
  CheckCircle, XCircle, Clock, RotateCcw, Monitor, Globe, 
  Fingerprint, Cpu, MapPin, Languages, Wifi, Shield, AlertTriangle,
  User, ExternalLink, Smartphone
} from 'lucide-react';

interface DeviceMetadata {
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  device?: string;
  screenResolution?: string;
  colorDepth?: string;
  ipAddress?: string;
  timezone?: string;
  language?: string;
  carrier?: string;
  operator?: string;
  networkType?: string;
  deviceFingerprint?: string;
  canvasFingerprint?: string;
  webglFingerprint?: string;
  gpu?: string;
  userAgent?: string;
  sessionId?: string;
  timesUsed?: number;
  lastSeen?: string;
  riskScore?: number;
  fraudIndicators?: string[];
  dimocoResponse?: Record<string, string | number | boolean>;
  originalPayload?: Record<string, unknown>;
  [key: string]: unknown;
}

interface Transaction {
  _id: string;
  msisdn: string;
  normalizedMsisdn: string;
  articleId: string;
  articleTitle?: string;
  articleSlug?: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentProvider: 'dimoco' | 'import' | 'manual';
  unlockedAt: string;
  expiresAt?: string;
  metadata?: DeviceMetadata;
}

interface TransactionStats {
  totalTransactions: number;
  totalRevenue: number;
  uniqueUsers: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
}

// Abbreviated key labels from DIMOCO metadata JSON
const ABBREVIATED_LABELS: Record<string, string> = {
  fp: 'Fingerprint',
  ip: 'IP Address',
  br: 'Browser',
  os: 'OS',
  sr: 'Screen',
  tz: 'Timezone',
  la: 'Language',
  gpu: 'GPU',
  sid: 'Session ID',
  ua: 'User Agent',
  cd: 'Color Depth',
  op: 'Operator',
  net: 'Network Type',
  cf: 'Canvas Fingerprint',
  wf: 'WebGL Fingerprint',
};

export function TransactionsManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed' | 'refunded'>('all');
  const [filterProvider, setFilterProvider] = useState<'all' | 'dimoco' | 'import' | 'manual'>('all');
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [page, filterStatus, filterProvider]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      let url = `/api/admin/transactions?page=${page}&limit=20`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (filterProvider !== 'all') url += `&provider=${filterProvider}`;
      if (dateFrom) url += `&dateFrom=${dateFrom}`;
      if (dateTo) url += `&dateTo=${dateTo}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data.transactions);
        setTotalPages(data.data.pagination.pages);
        setTotalTransactions(data.data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/transactions/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  async function handleSearch() {
    if (!search.trim()) {
      fetchTransactions();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/transactions?search=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data.transactions);
        setTotalPages(data.data.pagination?.pages || 1);
        setTotalTransactions(data.data.pagination?.total || data.data.transactions.length);
      }
    } catch (error) {
      console.error('Failed to search transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      let url = '/api/admin/transactions/export?';
      if (filterStatus !== 'all') url += `status=${filterStatus}&`;
      if (filterProvider !== 'all') url += `provider=${filterProvider}&`;
      if (dateFrom) url += `dateFrom=${dateFrom}&`;
      if (dateTo) url += `dateTo=${dateTo}&`;

      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `transactions-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error('Failed to export transactions:', error);
    }
  }

  async function handleRefund(transaction: Transaction) {
    if (!confirm(`Are you sure you want to refund transaction ${transaction.transactionId}? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(transaction._id);
    try {
      const response = await fetch(`/api/admin/transactions/${transaction._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refund' }),
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(transactions.map(t => t._id === transaction._id ? data.data : t));
        if (selectedTransaction?._id === transaction._id) {
          setSelectedTransaction(data.data);
        }
        fetchStats();
      } else {
        alert('Failed to process refund');
      }
    } catch (error) {
      console.error('Failed to refund:', error);
      alert('Failed to process refund');
    } finally {
      setActionLoading(null);
    }
  }

  function maskMsisdn(msisdn: string): string {
    if (!msisdn || msisdn.length < 8) return msisdn || '-';
    return msisdn.slice(0, 5) + '****' + msisdn.slice(-3);
  }

  function formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount / 100);
  }

  function getOperator(tx: Transaction): string | null {
    return tx.metadata?.operator as string || tx.metadata?.carrier as string || null;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-purple-100 text-purple-700"><RotateCcw className="h-3 w-3 mr-1" />Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getProviderBadge(provider: string) {
    switch (provider) {
      case 'dimoco':
        return <Badge className="bg-blue-100 text-blue-700">DIMOCO</Badge>;
      case 'import':
        return <Badge className="bg-gray-100 text-gray-700">Import</Badge>;
      case 'manual':
        return <Badge className="bg-orange-100 text-orange-700">Manual</Badge>;
      default:
        return <Badge variant="outline">{provider}</Badge>;
    }
  }

  // Parse metadata string from originalPayload (abbreviated keys)
  function parseNestedMetadata(metadataStr: unknown): Record<string, string> | null {
    if (!metadataStr || typeof metadataStr !== 'string') return null;
    try {
      const parsed = JSON.parse(metadataStr);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    } catch {
      // Not valid JSON
    }
    return null;
  }

  // Render the redesigned metadata modal content
  function renderMetadataDetails(metadata: DeviceMetadata) {
    const operator = metadata.operator || metadata.carrier;
    const ip = metadata.ipAddress;
    const fingerprint = metadata.deviceFingerprint;
    const browser = metadata.browser;
    const os = metadata.os;
    const screen = metadata.screenResolution;
    const timezone = metadata.timezone;
    const language = metadata.language;
    const gpu = metadata.gpu;
    const sessionId = metadata.sessionId;
    const userAgent = metadata.userAgent;
    const riskScore = metadata.riskScore;
    const fraudIndicators = metadata.fraudIndicators;
    const originalPayload = metadata.originalPayload as Record<string, unknown> | undefined;

    return (
      <div className="space-y-4">
        {/* Prominent Key Fields - Color-coded Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {operator && (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-600 flex items-center gap-1 mb-1">
                <Globe className="h-3 w-3" /> Operator
              </p>
              <p className="font-bold text-orange-800 text-lg">{operator}</p>
            </div>
          )}
          {fingerprint && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-600 flex items-center gap-1 mb-1">
                <Fingerprint className="h-3 w-3" /> Device Fingerprint
              </p>
              <p className="font-mono text-sm text-purple-800 break-all">{fingerprint}</p>
            </div>
          )}
          {ip && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 flex items-center gap-1 mb-1">
                <Wifi className="h-3 w-3" /> IP Address
              </p>
              <p className="font-mono text-sm text-blue-800">{ip}</p>
            </div>
          )}
        </div>

        {/* Secondary Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {browser && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Monitor className="h-3 w-3" /> Browser</p>
              <p className="font-medium text-sm">{browser}{metadata.browserVersion ? ` ${metadata.browserVersion}` : ''}</p>
            </div>
          )}
          {os && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Cpu className="h-3 w-3" /> OS</p>
              <p className="font-medium text-sm">{os}{metadata.osVersion ? ` ${metadata.osVersion}` : ''}</p>
            </div>
          )}
          {screen && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-xs text-muted-foreground">Screen</p>
              <p className="font-medium text-sm">{screen}</p>
            </div>
          )}
          {timezone && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Timezone</p>
              <p className="font-medium text-sm">{timezone}</p>
            </div>
          )}
          {language && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Languages className="h-3 w-3" /> Language</p>
              <p className="font-medium text-sm">{language}</p>
            </div>
          )}
          {gpu && (
            <div className="p-3 bg-gray-50 rounded-lg border col-span-2">
              <p className="text-xs text-muted-foreground">GPU</p>
              <p className="font-medium text-sm truncate" title={gpu}>{gpu}</p>
            </div>
          )}
          {sessionId && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Session ID</p>
              <p className="font-mono text-xs truncate" title={sessionId}>{sessionId}</p>
            </div>
          )}
        </div>

        {/* Risk Assessment */}
        {(riskScore !== undefined || (fraudIndicators && fraudIndicators.length > 0)) && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Risk Assessment
            </h4>
            <div className="flex items-center gap-4">
              {riskScore !== undefined && (
                <div>
                  <p className="text-xs text-red-600">Risk Score</p>
                  <p className="text-2xl font-bold text-red-800">{riskScore}</p>
                </div>
              )}
              {fraudIndicators && fraudIndicators.length > 0 && (
                <div>
                  <p className="text-xs text-red-600 mb-1">Fraud Indicators</p>
                  <div className="flex flex-wrap gap-1">
                    {fraudIndicators.map((indicator, i) => (
                      <Badge key={i} className="bg-red-100 text-red-700 text-xs">{indicator}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Original Payment Data (DIMOCO) */}
        {originalPayload && Object.keys(originalPayload).length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-blue-700">
              <CreditCard className="h-4 w-4" />
              Original Payment Data (DIMOCO)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(originalPayload)
                .filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== 'null')
                .map(([key, value]) => {
                  // Check if value is a nested metadata JSON string
                  const nestedParsed = parseNestedMetadata(value);
                  if (nestedParsed) {
                    return (
                      <div key={key} className="col-span-full p-3 bg-white rounded border">
                        <p className="text-xs text-blue-600 font-medium mb-2">
                          {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()} (Parsed)
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(nestedParsed)
                            .filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== 'null')
                            .map(([nKey, nValue]) => (
                              <div key={nKey} className="p-2 bg-gray-50 rounded">
                                <p className="text-xs text-muted-foreground">
                                  {ABBREVIATED_LABELS[nKey] || nKey.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p className="text-xs font-medium break-all">{String(nValue)}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  }
                  
                  // Format amount fields
                  const lowerKey = key.toLowerCase();
                  let displayValue = String(value);
                  if (lowerKey === 'amount' && typeof value === 'string') {
                    const cents = parseInt(value, 10);
                    if (!isNaN(cents)) {
                      displayValue = formatAmount(cents, 'EUR');
                    }
                  }

                  return (
                    <div key={key} className="p-2 bg-white rounded border">
                      <p className="text-xs text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                      </p>
                      <p className="font-medium text-sm break-all" title={String(value)}>
                        {displayValue}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* User Agent - Collapsible */}
        {userAgent && (
          <details className="border rounded-lg">
            <summary className="p-3 cursor-pointer text-sm text-muted-foreground hover:bg-gray-50">
              <span className="ml-1">User Agent (click to expand)</span>
            </summary>
            <div className="px-3 pb-3">
              <p className="text-xs font-mono break-all bg-gray-50 p-2 rounded">{userAgent}</p>
            </div>
          </details>
        )}

        {/* Remaining metadata fields not already shown */}
        {(() => {
          const shownKeys = new Set([
            'operator', 'carrier', 'ipAddress', 'deviceFingerprint', 'browser', 'browserVersion',
            'os', 'osVersion', 'screenResolution', 'timezone', 'language', 'gpu', 'sessionId',
            'userAgent', 'riskScore', 'fraudIndicators', 'originalPayload', 'dimocoResponse',
            'device', 'colorDepth', 'canvasFingerprint', 'webglFingerprint', 'networkType',
            'timesUsed', 'lastSeen',
          ]);
          const remaining = Object.entries(metadata)
            .filter(([k, v]) => !shownKeys.has(k) && v !== null && v !== undefined && v !== '' && v !== 'null');
          
          if (remaining.length === 0) return null;

          return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {remaining.map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-xs text-muted-foreground">
                    {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, s => s.toUpperCase()).trim()}
                  </p>
                  <p className="font-medium text-sm break-all">{String(value)}</p>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">{totalTransactions} total transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchTransactions(); fetchStats(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border-l-4 border-l-blue-500">
            <p className="text-3xl font-bold">{stats.totalTransactions}</p>
            <p className="text-sm text-muted-foreground">Total Transactions</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-green-500">
            <p className="text-3xl font-bold text-green-600">{formatAmount(stats.totalRevenue, 'EUR')}</p>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-purple-500">
            <p className="text-3xl font-bold">{stats.uniqueUsers}</p>
            <p className="text-sm text-muted-foreground">Unique Customers</p>
          </Card>
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">{stats.completedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm">{stats.pendingCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm">{stats.failedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm">{stats.refundedCount}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Completed / Pending / Failed / Refunded</p>
          </Card>
        </div>
      )}

      {/* Filters Card */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by phone or transaction ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'completed', 'pending', 'failed', 'refunded'] as const).map(status => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  className="h-8"
                  onClick={() => { setFilterStatus(status); setPage(1); }}
                >
                  {status === 'all' ? 'All' : (
                    <>
                      <div className={`w-2 h-2 rounded-full mr-1 ${
                        status === 'completed' ? 'bg-green-500' :
                        status === 'pending' ? 'bg-yellow-500' :
                        status === 'failed' ? 'bg-red-500' : 'bg-purple-500'
                      }`}></div>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </>
                  )}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36 h-8" />
              <span className="text-muted-foreground">–</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36 h-8" />
              <Button size="sm" className="h-8" onClick={fetchTransactions}>Apply</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium">Recent Transactions</CardTitle>
            <span className="text-sm text-muted-foreground">{totalTransactions} total</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No transactions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Transaction ID</th>
                    <th className="text-left p-3 font-medium">User (MSISDN)</th>
                    <th className="text-left p-3 font-medium">Article</th>
                    <th className="text-left p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Operator</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const operator = getOperator(tx);
                    return (
                      <tr key={tx._id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {tx.transactionId.slice(0, 12)}...
                          </code>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm">{maskMsisdn(tx.normalizedMsisdn || tx.msisdn)}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="max-w-48 truncate text-sm">
                            {tx.articleTitle || tx.articleSlug || tx.articleId}
                          </div>
                        </td>
                        <td className="p-3 font-medium">
                          {formatAmount(tx.amount, tx.currency)}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(tx.status)}
                        </td>
                        <td className="p-3">
                          {operator ? (
                            <div className="flex items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5 text-orange-500" />
                              <span className="text-sm font-medium text-orange-700">{operator}</span>
                            </div>
                          ) : (
                            getProviderBadge(tx.paymentProvider)
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(tx.unlockedAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => setSelectedTransaction(tx)}
                              title="View transaction details"
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => {
                                const searchPhone = tx.normalizedMsisdn || tx.msisdn;
                                window.dispatchEvent(new CustomEvent('navigate-to-person', { detail: searchPhone }));
                              }}
                              title="View user profile"
                              className="text-purple-500 hover:text-purple-700"
                            >
                              <User className="h-4 w-4" />
                            </Button>
                            {tx.status === 'completed' && (
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => handleRefund(tx)}
                                disabled={actionLoading === tx._id}
                                title="Process refund"
                                className="text-red-500 hover:text-red-700"
                              >
                                {actionLoading === tx._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="flex items-center px-4">Page {page} of {totalPages}</span>
              <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal - Redesigned */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 border-b">
              <CardTitle className="flex items-center gap-3">
                <CreditCard className="h-6 w-6" />
                <div>
                  <p>Transaction Details</p>
                  <code className="text-sm font-normal text-muted-foreground">
                    {selectedTransaction.transactionId}
                  </code>
                </div>
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedTransaction(null)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Status and Amount */}
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-3xl font-bold">
                    {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Phone className="h-3 w-3" /> User MSISDN
                  </label>
                  <p className="font-mono">{selectedTransaction.normalizedMsisdn || selectedTransaction.msisdn}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Payment Provider
                  </label>
                  <p>{getProviderBadge(selectedTransaction.paymentProvider)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Article
                  </label>
                  <p>{selectedTransaction.articleTitle || selectedTransaction.articleSlug || 'N/A'}</p>
                  <code className="text-xs text-muted-foreground">{selectedTransaction.articleId}</code>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Transaction Date
                  </label>
                  <p>{new Date(selectedTransaction.unlockedAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Expiration */}
              {selectedTransaction.expiresAt && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    <strong>Expires:</strong> {new Date(selectedTransaction.expiresAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Payment & Tracking Data - Redesigned */}
              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 border-b pb-2">
                    <Shield className="h-4 w-4" />
                    Payment &amp; Tracking Data
                  </h3>
                  {renderMetadataDetails(selectedTransaction.metadata)}
                </div>
              )}

              {/* Actions */}
              {selectedTransaction.status === 'completed' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => handleRefund(selectedTransaction)}
                    disabled={actionLoading === selectedTransaction._id}
                  >
                    {actionLoading === selectedTransaction._id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Process Refund
                  </Button>
                </div>
              )}

              {/* IDs */}
              <div className="pt-4 border-t space-y-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Transaction ID</label>
                  <p className="font-mono text-xs">{selectedTransaction.transactionId}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Database ID</label>
                  <p className="font-mono text-xs text-muted-foreground">{selectedTransaction._id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
