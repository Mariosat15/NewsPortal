'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, Download, Eye, Phone, Mail, User, Calendar,
  CreditCard, RefreshCw, Loader2, X, ChevronDown, ChevronUp,
  DollarSign, Clock, CheckCircle, XCircle, RotateCcw,
  Globe, Shield, Activity, TrendingUp, Users
} from 'lucide-react';

interface Transaction {
  _id: string;
  transactionId: string;
  articleId: string;
  articleTitle?: string;
  amount: number;
  currency: string;
  status: string;
  unlockedAt: string;
}

interface Person {
  id: string;
  type: 'user' | 'customer' | 'both';
  // User data
  userId?: string;
  email?: string;
  name?: string;
  authType?: string;
  // Customer/Phone data
  msisdn?: string;
  normalizedMsisdn?: string;
  // Combined stats
  totalSpent: number;
  transactionCount: number;
  visitCount: number;
  firstSeen: string;
  lastSeen: string;
  status: 'active' | 'inactive';
  // Related data
  transactions: Transaction[];
}

interface Stats {
  totalPeople: number;
  totalUsers: number;
  totalCustomers: number;
  totalRevenue: number;
  activeToday: number;
}

interface PeopleManagerProps {
  initialSearch?: string | null;
  onSearchComplete?: () => void;
}

export function PeopleManager({ initialSearch, onSearchComplete }: PeopleManagerProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Handle initial search from navigation
  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
      // Trigger search after a brief delay to let component mount
      setTimeout(() => {
        onSearchComplete?.();
      }, 100);
    }
  }, [initialSearch, onSearchComplete]);
  const [filter, setFilter] = useState<'all' | 'users' | 'customers' | 'paying'>('all');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadPeople();
  }, []);

  async function loadPeople() {
    setLoading(true);
    try {
      // Fetch users, customers, and transactions in parallel
      const [usersRes, customersRes, transactionsRes] = await Promise.all([
        fetch('/api/admin/users?limit=1000'),
        fetch('/api/admin/customers?limit=1000'),
        fetch('/api/admin/transactions?limit=1000'),
      ]);

      const usersData = usersRes.ok ? await usersRes.json() : {};
      const customersData = customersRes.ok ? await customersRes.json() : {};
      const transactionsData = transactionsRes.ok ? await transactionsRes.json() : {};

      console.log('Users API response:', usersData);
      console.log('Customers API response:', customersData);
      console.log('Transactions API response:', transactionsData);

      // Handle different API response formats
      const users = usersData.data?.users || usersData.users || [];
      const customers = customersData.customers || customersData.data?.customers || [];
      const transactions = transactionsData.data?.transactions || transactionsData.transactions || [];

      console.log('Parsed users:', users.length);
      console.log('Parsed customers:', customers.length);
      console.log('Parsed transactions:', transactions.length);

      // Create a map to merge by phone number
      const peopleMap = new Map<string, Person>();

      // Process users
      users.forEach((user: { _id: string; email?: string; name?: string; msisdn?: string; authType?: string; createdAt?: string; lastActiveAt?: string; visitCount?: number }) => {
        const key = user.msisdn || user.email || user._id;
        const normalizedPhone = user.msisdn?.replace(/\D/g, '') || '';
        
        peopleMap.set(key, {
          id: key,
          type: 'user',
          userId: user._id,
          email: user.email,
          name: user.name,
          msisdn: user.msisdn,
          normalizedMsisdn: normalizedPhone,
          authType: user.authType || (user.email ? 'email' : 'phone'),
          totalSpent: 0,
          transactionCount: 0,
          visitCount: user.visitCount || 1,
          firstSeen: user.createdAt || new Date().toISOString(),
          lastSeen: user.lastActiveAt || user.createdAt || new Date().toISOString(),
          status: 'active',
          transactions: [],
        });
      });

      // Process customers and merge with existing users
      customers.forEach((customer: { msisdn: string; normalizedMsisdn?: string; totalBilling?: number; visitCount?: number; firstSeen?: string; lastSeen?: string }) => {
        const normalizedPhone = customer.normalizedMsisdn || customer.msisdn?.replace(/\D/g, '') || '';
        
        // Check if this customer matches an existing user
        let existingKey: string | null = null;
        peopleMap.forEach((person, key) => {
          if (person.normalizedMsisdn && person.normalizedMsisdn === normalizedPhone) {
            existingKey = key;
          }
        });

        if (existingKey) {
          // Merge with existing user
          const existing = peopleMap.get(existingKey)!;
          existing.type = 'both';
          existing.totalSpent = customer.totalBilling || 0;
          existing.visitCount = Math.max(existing.visitCount, customer.visitCount || 0);
          if (customer.firstSeen && new Date(customer.firstSeen) < new Date(existing.firstSeen)) {
            existing.firstSeen = customer.firstSeen;
          }
          if (customer.lastSeen && new Date(customer.lastSeen) > new Date(existing.lastSeen)) {
            existing.lastSeen = customer.lastSeen;
          }
        } else {
          // New customer-only entry
          peopleMap.set(normalizedPhone || customer.msisdn, {
            id: normalizedPhone || customer.msisdn,
            type: 'customer',
            msisdn: customer.msisdn,
            normalizedMsisdn: normalizedPhone,
            totalSpent: customer.totalBilling || 0,
            transactionCount: 0,
            visitCount: customer.visitCount || 1,
            firstSeen: customer.firstSeen || new Date().toISOString(),
            lastSeen: customer.lastSeen || new Date().toISOString(),
            status: 'active',
            transactions: [],
          });
        }
      });

      // Add transactions to people
      transactions.forEach((tx: Transaction & { normalizedMsisdn?: string; msisdn?: string }) => {
        const normalizedPhone = tx.normalizedMsisdn || tx.msisdn?.replace(/\D/g, '') || '';
        
        // Find matching person
        peopleMap.forEach((person) => {
          if (person.normalizedMsisdn && person.normalizedMsisdn === normalizedPhone) {
            person.transactions.push(tx);
            person.transactionCount++;
            if (tx.status === 'completed') {
              person.totalSpent += tx.amount / 100;
            }
          }
        });
      });

      // Convert to array and sort by last seen
      const peopleArray = Array.from(peopleMap.values()).sort((a, b) => 
        new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      );

      setPeople(peopleArray);

      // Calculate stats
      setStats({
        totalPeople: peopleArray.length,
        totalUsers: peopleArray.filter(p => p.type === 'user' || p.type === 'both').length,
        totalCustomers: peopleArray.filter(p => p.type === 'customer' || p.type === 'both').length,
        totalRevenue: peopleArray.reduce((sum, p) => sum + p.totalSpent, 0),
        activeToday: peopleArray.filter(p => {
          const lastSeen = new Date(p.lastSeen);
          const today = new Date();
          return lastSeen.toDateString() === today.toDateString();
        }).length,
      });

    } catch (error) {
      console.error('Failed to load people:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPeople = people.filter(person => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matches = 
        person.email?.toLowerCase().includes(searchLower) ||
        person.name?.toLowerCase().includes(searchLower) ||
        person.msisdn?.includes(search) ||
        person.normalizedMsisdn?.includes(search);
      if (!matches) return false;
    }

    // Type filter
    if (filter === 'users' && person.type === 'customer') return false;
    if (filter === 'customers' && person.type === 'user') return false;
    if (filter === 'paying' && person.totalSpent === 0) return false;

    return true;
  });

  function toggleRow(id: string) {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case 'both':
        return <Badge className="bg-purple-100 text-purple-700">User + Customer</Badge>;
      case 'user':
        return <Badge className="bg-blue-100 text-blue-700">Registered User</Badge>;
      case 'customer':
        return <Badge className="bg-green-100 text-green-700">Phone Customer</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  }

  function getStatusBadge(status: string) {
    if (status === 'completed') return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
    if (status === 'refunded') return <Badge className="bg-purple-100 text-purple-700"><RotateCcw className="h-3 w-3 mr-1" />Refunded</Badge>;
    if (status === 'failed') return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  }

  async function handleExport() {
    try {
      const csvContent = [
        ['ID', 'Type', 'Name', 'Email', 'Phone', 'Total Spent', 'Transactions', 'Visits', 'First Seen', 'Last Seen'].join(','),
        ...filteredPeople.map(p => [
          p.id,
          p.type,
          p.name || '',
          p.email || '',
          p.msisdn || '',
          p.totalSpent.toFixed(2),
          p.transactionCount,
          p.visitCount,
          new Date(p.firstSeen).toLocaleDateString(),
          new Date(p.lastSeen).toLocaleDateString(),
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `people-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            People
          </h1>
          <p className="text-muted-foreground">
            Unified view of all users, customers, and their activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPeople}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalPeople}</p>
                <p className="text-xs text-muted-foreground">Total People</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Registered Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Phone className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                <p className="text-xs text-muted-foreground">Phone Customers</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{formatAmount(stats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeToday}</p>
                <p className="text-xs text-muted-foreground">Active Today</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'users', 'customers', 'paying'] as const).map(f => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'users' ? 'Users' : f === 'customers' ? 'Customers' : 'Paying'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* People List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading people...</p>
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No people found
            </div>
          ) : (
            <div className="divide-y">
              {filteredPeople.map((person) => (
                <div key={person.id} className="hover:bg-gray-50">
                  {/* Main Row */}
                  <div 
                    className="p-4 cursor-pointer flex items-center gap-4"
                    onClick={() => toggleRow(person.id)}
                  >
                    {/* Avatar/Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      person.type === 'both' ? 'bg-purple-500' :
                      person.type === 'user' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {person.name ? person.name[0].toUpperCase() : 
                       person.email ? person.email[0].toUpperCase() : 
                       <Phone className="h-5 w-5" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">
                          {person.name || person.email || person.msisdn || 'Unknown'}
                        </span>
                        {getTypeBadge(person.type)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap mt-1">
                        {person.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {person.email}
                          </span>
                        )}
                        {person.msisdn && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {person.msisdn}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-lg">{person.transactionCount}</p>
                        <p className="text-xs text-muted-foreground">Transactions</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-bold text-lg ${person.totalSpent > 0 ? 'text-green-600' : ''}`}>
                          {formatAmount(person.totalSpent)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">{person.visitCount}</p>
                        <p className="text-xs text-muted-foreground">Visits</p>
                      </div>
                    </div>

                    {/* Last Seen & Expand */}
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Last seen: {new Date(person.lastSeen).toLocaleDateString()}
                      </p>
                      {expandedRows.has(person.id) ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground mt-1 ml-auto" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground mt-1 ml-auto" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedRows.has(person.id) && (
                    <div className="px-4 pb-4 bg-gray-50 border-t">
                      {/* Mobile Stats */}
                      <div className="md:hidden grid grid-cols-3 gap-4 py-4 border-b mb-4">
                        <div className="text-center">
                          <p className="font-bold">{person.transactionCount}</p>
                          <p className="text-xs text-muted-foreground">Transactions</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-green-600">{formatAmount(person.totalSpent)}</p>
                          <p className="text-xs text-muted-foreground">Spent</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{person.visitCount}</p>
                          <p className="text-xs text-muted-foreground">Visits</p>
                        </div>
                      </div>

                      {/* Person Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-xs text-muted-foreground">First Seen</p>
                          <p className="font-medium">{new Date(person.firstSeen).toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-xs text-muted-foreground">Last Seen</p>
                          <p className="font-medium">{new Date(person.lastSeen).toLocaleString()}</p>
                        </div>
                        {person.userId && (
                          <div className="p-3 bg-white rounded-lg border">
                            <p className="text-xs text-muted-foreground">User ID</p>
                            <p className="font-mono text-xs truncate">{person.userId}</p>
                          </div>
                        )}
                        {person.authType && (
                          <div className="p-3 bg-white rounded-lg border">
                            <p className="text-xs text-muted-foreground">Auth Type</p>
                            <p className="font-medium capitalize">{person.authType}</p>
                          </div>
                        )}
                      </div>

                      {/* Transactions */}
                      {person.transactions.length > 0 ? (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Transactions ({person.transactions.length})
                          </h4>
                          <div className="bg-white rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left p-2 font-medium">Date</th>
                                  <th className="text-left p-2 font-medium">Article</th>
                                  <th className="text-left p-2 font-medium">Amount</th>
                                  <th className="text-left p-2 font-medium">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {person.transactions.slice(0, 5).map((tx) => (
                                  <tr key={tx._id} className="border-t">
                                    <td className="p-2">{new Date(tx.unlockedAt).toLocaleDateString()}</td>
                                    <td className="p-2 truncate max-w-48">{tx.articleTitle || tx.articleId}</td>
                                    <td className="p-2 font-medium">{formatAmount(tx.amount / 100)}</td>
                                    <td className="p-2">{getStatusBadge(tx.status)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {person.transactions.length > 5 && (
                              <div className="p-2 text-center text-sm text-muted-foreground border-t">
                                +{person.transactions.length - 5} more transactions
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          No transactions yet
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPerson(person);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Full Profile
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Profile Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 border-b">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                  selectedPerson.type === 'both' ? 'bg-purple-500' :
                  selectedPerson.type === 'user' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {selectedPerson.name ? selectedPerson.name[0].toUpperCase() : 
                   selectedPerson.email ? selectedPerson.email[0].toUpperCase() : 
                   <Phone className="h-8 w-8" />}
                </div>
                <div>
                  <CardTitle>
                    {selectedPerson.name || selectedPerson.email || selectedPerson.msisdn}
                  </CardTitle>
                  <div className="flex gap-2 mt-1">
                    {getTypeBadge(selectedPerson.type)}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedPerson(null)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                {selectedPerson.email && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </p>
                    <p className="font-medium">{selectedPerson.email}</p>
                  </div>
                )}
                {selectedPerson.msisdn && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone
                    </p>
                    <p className="font-medium">{selectedPerson.msisdn}</p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">{formatAmount(selectedPerson.totalSpent)}</p>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-3xl font-bold">{selectedPerson.transactionCount}</p>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-3xl font-bold">{selectedPerson.visitCount}</p>
                  <p className="text-xs text-muted-foreground">Visits</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-3xl font-bold">
                    {selectedPerson.transactionCount > 0 
                      ? formatAmount(selectedPerson.totalSpent / selectedPerson.transactionCount)
                      : '€0'}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Order</p>
                </div>
              </div>

              {/* Timeline Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">First Seen</p>
                  <p className="font-medium">{new Date(selectedPerson.firstSeen).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Last Seen</p>
                  <p className="font-medium">{new Date(selectedPerson.lastSeen).toLocaleString()}</p>
                </div>
              </div>

              {/* All Transactions */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  All Transactions
                </h4>
                {selectedPerson.transactions.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 font-medium">Date</th>
                          <th className="text-left p-3 font-medium">Transaction ID</th>
                          <th className="text-left p-3 font-medium">Article</th>
                          <th className="text-right p-3 font-medium">Amount</th>
                          <th className="text-left p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPerson.transactions.map((tx) => (
                          <tr key={tx._id} className="border-t hover:bg-gray-50">
                            <td className="p-3">{new Date(tx.unlockedAt).toLocaleString()}</td>
                            <td className="p-3">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {tx.transactionId.slice(0, 16)}...
                              </code>
                            </td>
                            <td className="p-3 max-w-48 truncate">{tx.articleTitle || tx.articleId}</td>
                            <td className="p-3 text-right font-medium">{formatAmount(tx.amount / 100)}</td>
                            <td className="p-3">{getStatusBadge(tx.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    No transactions yet
                  </div>
                )}
              </div>

              {/* IDs */}
              <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                {selectedPerson.userId && (
                  <p><strong>User ID:</strong> {selectedPerson.userId}</p>
                )}
                {selectedPerson.normalizedMsisdn && (
                  <p><strong>Normalized Phone:</strong> {selectedPerson.normalizedMsisdn}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
