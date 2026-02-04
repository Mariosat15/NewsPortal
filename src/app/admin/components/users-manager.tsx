'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Download, Eye, Mail, Phone, User, Calendar, Shield, X, 
  Edit, Ban, CheckCircle, Loader2, Save 
} from 'lucide-react';

interface User {
  _id: string;
  // Email auth fields
  email?: string;
  name?: string;
  avatar?: string;
  emailVerified?: boolean;
  // MSISDN auth fields
  msisdn?: string;
  normalizedMsisdn?: string;
  // Common fields
  authProvider?: 'email' | 'msisdn';
  firstSeen: string;
  lastSeen: string;
  totalVisits: number;
  bookmarks: string[];
  favorites?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'email' | 'msisdn'>('all');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<{ name: string }>({ name: '' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, filterType]);

  async function fetchUsers() {
    try {
      let url = `/api/admin/users?page=${page}&limit=20`;
      if (filterType !== 'all') {
        url += `&authProvider=${filterType}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.pages);
        setTotalUsers(data.data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!search.trim()) {
      fetchUsers();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
        setTotalPages(data.data.pagination?.pages || 1);
        setTotalUsers(data.data.pagination?.total || data.data.users.length);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const response = await fetch('/api/admin/users/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error('Failed to export users:', error);
    }
  }

  async function handleBanToggle(user: User) {
    const action = user.isActive !== false ? 'ban' : 'unban';
    const confirmMessage = action === 'ban' 
      ? 'Are you sure you want to ban this user? They will not be able to access the portal.'
      : 'Are you sure you want to unban this user?';

    if (!confirm(confirmMessage)) return;

    setActionLoading(user._id);
    try {
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update user in list
        setUsers(users.map(u => u._id === user._id ? data.data : u));
        // Update selected user if viewing details
        if (selectedUser?._id === user._id) {
          setSelectedUser(data.data);
        }
      } else {
        alert('Failed to update user status');
      }
    } catch (error) {
      console.error('Failed to toggle ban:', error);
      alert('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveEdit() {
    if (!selectedUser) return;

    setActionLoading('save');
    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editData.name }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update user in list
        setUsers(users.map(u => u._id === selectedUser._id ? data.data : u));
        setSelectedUser(data.data);
        setEditMode(false);
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      console.error('Failed to save edit:', error);
      alert('Failed to update user');
    } finally {
      setActionLoading(null);
    }
  }

  function startEdit() {
    if (selectedUser) {
      setEditData({ name: selectedUser.name || '' });
      setEditMode(true);
    }
  }

  function cancelEdit() {
    setEditMode(false);
    setEditData({ name: '' });
  }

  function maskMsisdn(msisdn: string): string {
    if (!msisdn || msisdn.length < 8) return msisdn || '-';
    return msisdn.slice(0, 5) + '****' + msisdn.slice(-3);
  }

  function maskEmail(email: string): string {
    if (!email) return '-';
    const [local, domain] = email.split('@');
    if (local.length <= 3) return email;
    return local.slice(0, 2) + '***@' + domain;
  }

  function getAuthBadge(provider?: string) {
    if (provider === 'email') {
      return <Badge className="bg-blue-100 text-blue-700"><Mail className="h-3 w-3 mr-1" />Email</Badge>;
    }
    if (provider === 'msisdn') {
      return <Badge className="bg-green-100 text-green-700"><Phone className="h-3 w-3 mr-1" />Phone</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  }

  function getUserIdentifier(user: User): string {
    if (user.authProvider === 'email' && user.email) {
      return maskEmail(user.email);
    }
    return maskMsisdn(user.normalizedMsisdn || user.msisdn || '');
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">{totalUsers} total users</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Users
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or MSISDN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filterType === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All
              </Button>
              <Button 
                variant={filterType === 'email' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterType('email')}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
              <Button 
                variant={filterType === 'msisdn' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterType('msisdn')}
              >
                <Phone className="h-4 w-4 mr-1" />
                Phone
              </Button>
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Auth Type</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">First Seen</th>
                    <th className="text-left p-3 font-medium">Last Active</th>
                    <th className="text-left p-3 font-medium">Visits</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{user.name || 'Anonymous'}</p>
                            <p className="text-sm text-muted-foreground font-mono">
                              {getUserIdentifier(user)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {getAuthBadge(user.authProvider)}
                      </td>
                      <td className="p-3">
                        {user.isActive !== false ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Banned</Badge>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(user.firstSeen || user.createdAt || '').toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(user.lastSeen || user.updatedAt || '').toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <Badge variant={user.totalVisits >= 3 ? 'default' : 'outline'}>
                          {user.totalVisits || 0}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBanToggle(user)}
                            disabled={actionLoading === user._id}
                            title={user.isActive !== false ? 'Ban user' : 'Unban user'}
                            className={user.isActive !== false ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}
                          >
                            {actionLoading === user._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.isActive !== false ? (
                              <Ban className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
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

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 border-b">
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {selectedUser.name?.charAt(0).toUpperCase() || selectedUser.email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p>{selectedUser.name || 'Anonymous User'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getAuthBadge(selectedUser.authProvider)}
                    {selectedUser.isActive !== false ? (
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Banned</Badge>
                    )}
                  </div>
                </div>
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(null); setEditMode(false); }}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Edit Mode */}
              {editMode ? (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium mb-4">Edit User</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        placeholder="User's name"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit} disabled={actionLoading === 'save'}>
                        {actionLoading === 'save' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Identity Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <User className="h-3 w-3" /> Full Name
                      </label>
                      <p className="font-medium">{selectedUser.name || '-'}</p>
                    </div>
                    {selectedUser.email && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <Mail className="h-3 w-3" /> Email
                        </label>
                        <p className="font-mono">{selectedUser.email}</p>
                        {selectedUser.emailVerified && (
                          <Badge className="mt-1 bg-green-100 text-green-700">Verified</Badge>
                        )}
                      </div>
                    )}
                    {selectedUser.msisdn && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Phone (MSISDN)
                        </label>
                        <p className="font-mono">{selectedUser.normalizedMsisdn || selectedUser.msisdn}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Status
                      </label>
                      <p>
                        {selectedUser.isActive !== false ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Banned</Badge>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Activity Section */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Activity
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-700">{selectedUser.totalVisits || 0}</p>
                        <p className="text-xs text-blue-600">Total Visits</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-700">{selectedUser.bookmarks?.length || 0}</p>
                        <p className="text-xs text-purple-600">Bookmarks</p>
                      </div>
                      <div className="p-3 bg-pink-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-pink-700">{selectedUser.favorites?.length || 0}</p>
                        <p className="text-xs text-pink-600">Favorites</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-amber-700">0</p>
                        <p className="text-xs text-amber-600">Purchases</p>
                      </div>
                    </div>
                  </div>

                  {/* Dates Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">First Seen</label>
                      <p>{new Date(selectedUser.firstSeen || selectedUser.createdAt || '').toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Active</label>
                      <p>{new Date(selectedUser.lastSeen || selectedUser.updatedAt || '').toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={startEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </Button>
                    <Button
                      variant={selectedUser.isActive !== false ? 'destructive' : 'default'}
                      onClick={() => handleBanToggle(selectedUser)}
                      disabled={actionLoading === selectedUser._id}
                    >
                      {actionLoading === selectedUser._id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : selectedUser.isActive !== false ? (
                        <Ban className="h-4 w-4 mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {selectedUser.isActive !== false ? 'Ban User' : 'Unban User'}
                    </Button>
                  </div>
                </>
              )}

              {/* User ID */}
              <div className="pt-4 border-t">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User ID</label>
                <p className="font-mono text-xs text-muted-foreground">{selectedUser._id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
