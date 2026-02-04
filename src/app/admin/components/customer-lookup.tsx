'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Download, Phone, Calendar, TrendingUp, Clock, Activity } from 'lucide-react';

interface CustomerStats {
  totalCustomers: number;
  heavyUsers: number;
  activeLastWeek: number;
  activeLastMonth: number;
  totalBillingAmount: number;
}

interface Customer {
  _id: string;
  msisdn: string;
  totalVisits: number;
  visitsLast30d: number;
  firstSeenAt: string;
  lastSeenAt: string;
  heavyUserFlag: boolean;
  topCampaign?: string;
  topSource?: string;
  totalBillingAmount: number;
}

interface TimelineItem {
  type: 'session' | 'event' | 'billing';
  timestamp: string;
  data: Record<string, unknown>;
}

interface CustomerDetail {
  customer: Customer;
  sessions: number;
  timeline: TimelineItem[];
}

export function CustomerLookup() {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchMsisdn, setSearchMsisdn] = useState('');
  const [heavyOnly, setHeavyOnly] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Export params
  const [minVisits, setMinVisits] = useState(3);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [heavyOnly]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (heavyOnly) params.set('heavyUserOnly', 'true');
      if (searchMsisdn) params.set('msisdn', searchMsisdn);
      params.set('limit', '50');

      const res = await fetch(`/api/admin/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers();
  };

  const loadCustomerDetail = async (msisdn: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(msisdn)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomer(data);
      } else {
        setMessage({ type: 'error', text: 'Customer not found' });
      }
    } catch (error) {
      console.error('Error loading customer detail:', error);
      setMessage({ type: 'error', text: 'Failed to load customer' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('minVisits', minVisits.toString());

      const res = await fetch(`/api/admin/customers/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `heavy_users_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: 'Export downloaded!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Export failed' });
    } finally {
      setExportLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2) + ' €';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Customer Lookup</h2>
            <p className="text-sm text-gray-500">Search customers by phone number and view activity</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Total Customers</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Heavy Users</div>
            <div className="text-2xl font-bold text-orange-600">{stats.heavyUsers}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Active (7d)</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeLastWeek}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Active (30d)</div>
            <div className="text-2xl font-bold text-blue-600">{stats.activeLastMonth}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Total Billing</div>
            <div className="text-2xl font-bold text-purple-600">{formatAmount(stats.totalBillingAmount)}</div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchMsisdn}
                onChange={(e) => setSearchMsisdn(e.target.value)}
                placeholder="+49 123 456 7890"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={heavyOnly}
              onChange={(e) => setHeavyOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Heavy users only</span>
          </label>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </form>
      </div>

      {/* Export Section */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Export Heavy Users</h3>
            <p className="text-sm text-gray-500">Download a CSV of users with high visit counts</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Min visits:</label>
              <input
                type="number"
                value={minVisits}
                onChange={(e) => setMinVisits(parseInt(e.target.value) || 1)}
                min={1}
                className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {exportLoading ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customers List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Customers</h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : customers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No customers found</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <div
                    key={customer._id}
                    onClick={() => loadCustomerDetail(customer.msisdn)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedCustomer?.customer._id === customer._id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{customer.msisdn}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {customer.totalVisits} visits · Last seen {new Date(customer.lastSeenAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {customer.heavyUserFlag && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                            Heavy
                          </span>
                        )}
                        {customer.totalBillingAmount > 0 && (
                          <span className="text-sm text-green-600 font-medium">
                            {formatAmount(customer.totalBillingAmount)}
                          </span>
                        )}
                      </div>
                    </div>
                    {(customer.topCampaign || customer.topSource) && (
                      <div className="text-xs text-gray-400 mt-1">
                        {customer.topCampaign && `Campaign: ${customer.topCampaign}`}
                        {customer.topCampaign && customer.topSource && ' · '}
                        {customer.topSource && `Source: ${customer.topSource}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer Detail / Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Customer Timeline</h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {detailLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : !selectedCustomer ? (
              <div className="p-8 text-center text-gray-500">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>Select a customer to view their activity timeline</p>
              </div>
            ) : (
              <div className="p-4">
                {/* Customer Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-lg font-bold text-gray-900">{selectedCustomer.customer.msisdn}</div>
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <div className="text-gray-500">Total Visits</div>
                      <div className="font-semibold">{selectedCustomer.customer.totalVisits}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Sessions</div>
                      <div className="font-semibold">{selectedCustomer.sessions}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Total Billing</div>
                      <div className="font-semibold text-green-600">
                        {formatAmount(selectedCustomer.customer.totalBillingAmount)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-3">
                    First seen: {formatDate(selectedCustomer.customer.firstSeenAt)}<br />
                    Last seen: {formatDate(selectedCustomer.customer.lastSeenAt)}
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  {selectedCustomer.timeline.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.type === 'session' ? 'bg-blue-100 text-blue-600' :
                        item.type === 'billing' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.type === 'session' ? <Users className="h-4 w-4" /> :
                         item.type === 'billing' ? <TrendingUp className="h-4 w-4" /> :
                         <Clock className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-sm text-gray-900 capitalize">
                            {item.type === 'session' ? 'Session' :
                             item.type === 'billing' ? `Billing: ${(item.data as {status?: string}).status}` :
                             (item.data as {eventType?: string}).eventType?.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDate(item.timestamp)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.type === 'session' && (
                            <>
                              {(item.data as {landingPageSlug?: string}).landingPageSlug && `LP: ${(item.data as {landingPageSlug?: string}).landingPageSlug}`}
                              {(item.data as {pageViews?: number}).pageViews && ` · ${(item.data as {pageViews?: number}).pageViews} page views`}
                            </>
                          )}
                          {item.type === 'billing' && (
                            <>
                              {formatAmount((item.data as {amount?: number}).amount || 0)}
                              {(item.data as {source?: string}).source && ` · ${(item.data as {source?: string}).source}`}
                            </>
                          )}
                          {item.type === 'event' && (item.data as {metadata?: {articleSlug?: string}}).metadata?.articleSlug && (
                            `Article: ${(item.data as {metadata?: {articleSlug?: string}}).metadata?.articleSlug}`
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
