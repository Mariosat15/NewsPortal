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
  History, ChevronLeft, ChevronRight, RefreshCw,
  FileText, Globe, Users, CreditCard, Settings, Bot, Image, Scale, Rocket,
} from 'lucide-react';

interface AdminAction {
  _id: string;
  adminUser: string;
  action: string;
  resource: string;
  resourceId?: string;
  resourceName?: string;
  details?: string;
  ip?: string;
  timestamp: string;
}

const RESOURCE_ICONS: Record<string, typeof FileText> = {
  article: FileText,
  landing_page: Rocket,
  legal_page: Scale,
  user: Users,
  customer: Users,
  transaction: CreditCard,
  settings: Settings,
  agent: Bot,
  image_source: Image,
  template: Globe,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  publish: 'bg-purple-100 text-purple-700',
  unpublish: 'bg-yellow-100 text-yellow-700',
  import: 'bg-orange-100 text-orange-700',
  export: 'bg-cyan-100 text-cyan-700',
  login: 'bg-emerald-100 text-emerald-700',
  logout: 'bg-gray-100 text-gray-700',
  settings_change: 'bg-indigo-100 text-indigo-700',
  agent_run: 'bg-violet-100 text-violet-700',
  bulk_action: 'bg-amber-100 text-amber-700',
  refund: 'bg-rose-100 text-rose-700',
};

export function ActivityLog() {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const fetchLog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (resourceFilter !== 'all') params.set('resource', resourceFilter);
      if (actionFilter !== 'all') params.set('action', actionFilter);

      const res = await fetch(`/api/admin/activity-log?${params}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setActions(json.data);
          setTotalPages(json.totalPages);
          setTotal(json.total);
        }
      }
    } catch (err) {
      console.error('Activity log error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, resourceFilter, actionFilter]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-blue-500" />
            Activity Log
          </h2>
          <p className="text-muted-foreground text-sm">
            Track all admin actions and changes ({total} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="article">Articles</SelectItem>
              <SelectItem value="landing_page">Landing Pages</SelectItem>
              <SelectItem value="legal_page">Legal Pages</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
              <SelectItem value="agent">AI Agents</SelectItem>
              <SelectItem value="transaction">Transactions</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="publish">Publish</SelectItem>
              <SelectItem value="import">Import</SelectItem>
              <SelectItem value="settings_change">Settings</SelectItem>
              <SelectItem value="login">Login</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchLog} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Page {page} of {totalPages} ({total} entries)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading activity log...</div>
          ) : actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activity recorded yet. Actions will appear here as you use the admin panel.
            </div>
          ) : (
            <div className="space-y-2">
              {actions.map((action) => {
                const Icon = RESOURCE_ICONS[action.resource] || FileText;
                const actionColor = ACTION_COLORS[action.action] || 'bg-gray-100 text-gray-700';
                return (
                  <div
                    key={action._id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                  >
                    <div className="mt-0.5 p-1.5 rounded-md bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{action.adminUser}</span>
                        <Badge className={`text-xs ${actionColor}`}>
                          {action.action}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{action.resource}</span>
                      </div>
                      {action.resourceName && (
                        <p className="text-sm text-foreground mt-0.5 truncate max-w-[400px]">
                          {action.resourceName}
                        </p>
                      )}
                      {action.details && (
                        <p className="text-xs text-muted-foreground mt-0.5">{action.details}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(action.timestamp)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
