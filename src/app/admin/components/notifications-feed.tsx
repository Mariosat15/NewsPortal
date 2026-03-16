'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  type: 'purchase' | 'subscriber' | 'article' | 'admin';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

const TYPE_COLORS: Record<string, string> = {
  purchase: 'bg-green-50 border-green-200',
  subscriber: 'bg-blue-50 border-blue-200',
  article: 'bg-purple-50 border-purple-200',
  admin: 'bg-gray-50 border-gray-200',
};

/**
 * NotificationsFeed — bell icon + dropdown that shows recent events.
 * Polls every 60 seconds for fresh data.
 */
export function NotificationsFeed() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const lastSeenRef = useRef<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications');
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setNotifications(json.notifications);
        // Count unread: notifications newer than last seen
        if (lastSeenRef.current) {
          const lastTs = new Date(lastSeenRef.current).getTime();
          setUnread(json.notifications.filter((n: Notification) => new Date(n.timestamp).getTime() > lastTs).length);
        } else {
          setUnread(json.notifications.length > 0 ? json.notifications.length : 0);
        }
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  // Initial fetch + poll
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleOpen = () => {
    setOpen(prev => !prev);
    if (!open) {
      // Mark all as seen
      if (notifications.length > 0) {
        lastSeenRef.current = notifications[0].timestamp;
      }
      setUnread(0);
    }
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={handleOpen} className="relative">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown — fixed so it isn't clipped by the sidebar */}
          <div className="fixed left-64 top-2 w-96 max-h-[480px] bg-white rounded-xl shadow-2xl border overflow-hidden z-[70]">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/80">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>

            <div className="overflow-y-auto max-h-[420px] divide-y">
              {notifications.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No recent notifications
                </div>
              )}

              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors ${TYPE_COLORS[n.type] || ''}`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {timeAgo(n.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
