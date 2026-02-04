'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Eye } from 'lucide-react';

interface User {
  _id: string;
  msisdn: string;
  normalizedMsisdn: string;
  firstSeen: string;
  lastSeen: string;
  totalVisits: number;
  bookmarks: string[];
}

export function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  async function fetchUsers() {
    try {
      const response = await fetch(`/api/admin/users?page=${page}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.pages);
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

  function maskMsisdn(msisdn: string): string {
    if (msisdn.length < 8) return msisdn;
    return msisdn.slice(0, 5) + '****' + msisdn.slice(-3);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export MSISDNs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by MSISDN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
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
                    <th className="text-left p-3 font-medium">MSISDN</th>
                    <th className="text-left p-3 font-medium">First Seen</th>
                    <th className="text-left p-3 font-medium">Last Seen</th>
                    <th className="text-left p-3 font-medium">Visits</th>
                    <th className="text-left p-3 font-medium">Bookmarks</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono">
                        {maskMsisdn(user.normalizedMsisdn || user.msisdn)}
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(user.firstSeen).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(user.lastSeen).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <Badge variant={user.totalVisits >= 3 ? 'default' : 'outline'}>
                          {user.totalVisits}
                        </Badge>
                      </td>
                      <td className="p-3">{user.bookmarks?.length || 0}</td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg m-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">MSISDN</label>
                <p className="font-mono">{selectedUser.normalizedMsisdn || selectedUser.msisdn}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">First Seen</label>
                  <p>{new Date(selectedUser.firstSeen).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Seen</label>
                  <p>{new Date(selectedUser.lastSeen).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Visits</label>
                <p>{selectedUser.totalVisits}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bookmarked Articles</label>
                <p>{selectedUser.bookmarks?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
