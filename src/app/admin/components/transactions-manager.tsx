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
  User, ExternalLink
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
        document.body.appendChild(a);
        a.click();
        a.remove();
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

      {/* Stats Cards - Cleaner Grid */}
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
            {/* Search */}
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

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'completed', 'pending', 'failed', 'refunded'] as const).map(status => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  className="h-8"
                  onClick={() => { setFilterStatus(status); setPage(1); }}
                >
                  {status === 'all' ? (
                    'All'
                  ) : (
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

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36 h-8"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36 h-8"
              />
              <Button size="sm" className="h-8" onClick={fetchTransactions}>
                Apply
              </Button>
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
                    <th className="text-left p-3 font-medium">Provider</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
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
                        {getProviderBadge(tx.paymentProvider)}
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(tx.unlockedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTransaction(tx)}
                            title="View transaction details"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Navigate to People tab with this user's phone number
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
                              variant="ghost"
                              size="sm"
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
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

              {/* Payment & Tracking Data */}
              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 border-b pb-2">
                    <Shield className="h-4 w-4" />
                    Payment & Tracking Data
                  </h3>
                  
                  {/* Render all metadata fields in a user-friendly way */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(selectedTransaction.metadata)
                      // Filter out null, undefined, and empty values (except for originalPayload)
                      .filter(([key, value]) => {
                        if (key === 'originalPayload') return true; // Always show original payload
                        if (value === null || value === undefined || value === 'null' || value === '') return false;
                        return true;
                      })
                      .map(([key, value]) => {
                      // Format the key for display
                      const formattedKey = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/_/g, ' ')
                        .replace(/^./, str => str.toUpperCase())
                        .trim();
                      
                      // Handle nested objects (like originalPayload)
                      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        // Filter out null/empty values from nested object
                        const filteredEntries = Object.entries(value as Record<string, unknown>)
                          .filter(([, v]) => v !== null && v !== undefined && v !== 'null' && v !== '');
                        
                        if (filteredEntries.length === 0) return null;
                        
                        // Helper to format values nicely
                        const formatNestedValue = (subKey: string, subValue: unknown): string => {
                          const lowerKey = subKey.toLowerCase();
                          // Format amount fields as currency (convert from cents)
                          if (lowerKey === 'amount' && typeof subValue === 'string') {
                            const cents = parseInt(subValue, 10);
                            if (!isNaN(cents)) {
                              return formatAmount(cents, 'EUR');
                            }
                          }
                          return String(subValue);
                        };
                        
                        return (
                          <div key={key} className="col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-blue-700">
                              <CreditCard className="h-4 w-4" />
                              {formattedKey}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {filteredEntries.map(([subKey, subValue]) => (
                                <div key={subKey} className="p-2 bg-white rounded border">
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {subKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                                  </p>
                                  <p className="font-medium text-sm truncate" title={String(subValue)}>
                                    {formatNestedValue(subKey, subValue)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      
                      // Handle arrays
                      if (Array.isArray(value)) {
                        return (
                          <div key={key} className="col-span-2 p-3 bg-gray-50 rounded-lg border">
                            <p className="text-xs text-muted-foreground mb-2">{formattedKey}</p>
                            <div className="flex flex-wrap gap-1">
                              {value.map((item, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {String(item)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      
                      // Handle special fields with icons
                      const getFieldIcon = () => {
                        const lowerKey = key.toLowerCase();
                        if (lowerKey.includes('ip')) return <Wifi className="h-3 w-3" />;
                        if (lowerKey.includes('browser') || lowerKey.includes('user') && lowerKey.includes('agent')) return <Monitor className="h-3 w-3" />;
                        if (lowerKey.includes('timezone') || lowerKey.includes('location')) return <MapPin className="h-3 w-3" />;
                        if (lowerKey.includes('language')) return <Languages className="h-3 w-3" />;
                        if (lowerKey.includes('fingerprint')) return <Fingerprint className="h-3 w-3" />;
                        if (lowerKey.includes('risk') || lowerKey.includes('fraud')) return <AlertTriangle className="h-3 w-3" />;
                        if (lowerKey.includes('session')) return <Clock className="h-3 w-3" />;
                        if (lowerKey.includes('network') || lowerKey.includes('carrier')) return <Globe className="h-3 w-3" />;
                        return null;
                      };
                      
                      // Get background color based on field type
                      const getFieldBgColor = () => {
                        const lowerKey = key.toLowerCase();
                        if (lowerKey.includes('risk') || lowerKey.includes('fraud')) return 'bg-red-50 border-red-100';
                        if (lowerKey.includes('success') || lowerKey.includes('status') && String(value).toLowerCase() === 'success') return 'bg-green-50 border-green-100';
                        if (lowerKey.includes('ip') || lowerKey.includes('network')) return 'bg-blue-50 border-blue-100';
                        if (lowerKey.includes('fingerprint')) return 'bg-purple-50 border-purple-100';
                        return 'bg-gray-50 border-gray-100';
                      };
                      
                      // Render simple values
                      return (
                        <div key={key} className={`p-3 rounded-lg border ${getFieldBgColor()}`}>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            {getFieldIcon()}
                            {formattedKey}
                          </p>
                          <p className="font-medium text-sm break-all" title={String(value)}>
                            {String(value).length > 100 ? `${String(value).slice(0, 100)}...` : String(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
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
