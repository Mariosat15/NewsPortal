'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  Plus,
  Trash2,
  PauseCircle,
  PlayCircle,
  Clock,
  Mail,
  CalendarClock,
  FileBarChart,
  Edit,
  X,
} from 'lucide-react';

interface ScheduledReport {
  _id: string;
  tenantId: string;
  name: string;
  type: 'revenue' | 'traffic' | 'campaigns' | 'full';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipientEmails: string[];
  active: boolean;
  lastSentAt?: string;
  nextRunAt: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  revenue: 'Revenue Summary',
  traffic: 'Traffic & Visitors',
  campaigns: 'Campaign Performance',
  full: 'Full Dashboard Report',
};

const TYPE_COLORS: Record<string, string> = {
  revenue: 'bg-green-100 text-green-800',
  traffic: 'bg-blue-100 text-blue-800',
  campaigns: 'bg-purple-100 text-purple-800',
  full: 'bg-orange-100 text-orange-800',
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export function ScheduledReports() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<string>('revenue');
  const [formFrequency, setFormFrequency] = useState<string>('weekly');
  const [formEmails, setFormEmails] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/scheduled-reports');
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      if (json.success) {
        setReports(json.reports);
      }
    } catch (err) {
      console.error('Error loading scheduled reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const resetForm = () => {
    setFormName('');
    setFormType('revenue');
    setFormFrequency('weekly');
    setFormEmails('');
    setEditingReport(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (report: ScheduledReport) => {
    setEditingReport(report);
    setFormName(report.name);
    setFormType(report.type);
    setFormFrequency(report.frequency);
    setFormEmails(report.recipientEmails.join(', '));
    setShowDialog(true);
  };

  const handleSave = async () => {
    const emails = formEmails
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes('@'));

    if (!formName.trim()) {
      alert('Report name is required');
      return;
    }
    if (emails.length === 0) {
      alert('At least one valid recipient email is required');
      return;
    }

    setSaving(true);
    try {
      const isEditing = !!editingReport;
      const method = isEditing ? 'PUT' : 'POST';
      const payload = isEditing
        ? { id: editingReport._id, name: formName, type: formType, frequency: formFrequency, recipientEmails: emails }
        : { name: formName, type: formType, frequency: formFrequency, recipientEmails: emails };

      const res = await fetch('/api/admin/scheduled-reports', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }

      setShowDialog(false);
      resetForm();
      await fetchReports();
    } catch (err) {
      console.error('Error saving report:', err);
      alert('Failed to save report. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (report: ScheduledReport) => {
    try {
      const res = await fetch('/api/admin/scheduled-reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: report._id, active: !report.active }),
      });
      if (!res.ok) throw new Error('Failed');
      await fetchReports();
    } catch (err) {
      console.error('Error toggling report:', err);
    }
  };

  const handleDelete = async (report: ScheduledReport) => {
    if (!confirm(`Delete report "${report.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/admin/scheduled-reports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: report._id }),
      });
      if (!res.ok) throw new Error('Failed');
      await fetchReports();
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-indigo-600" />
            Scheduled Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure automated email reports for key metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-1" />
            New Report
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/30">
        <CardContent className="py-3 text-sm text-muted-foreground">
          <p>
            Scheduled reports will be generated and emailed to the specified recipients at the configured frequency.
            Reports include data summaries based on the selected type.
          </p>
        </CardContent>
      </Card>

      {/* Reports table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Configured Reports
          </CardTitle>
          <CardDescription>
            {reports.length} report{reports.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No scheduled reports yet</p>
              <p className="text-sm mt-1">
                Create your first report to start receiving automated summaries.
              </p>
              <Button className="mt-4" size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-1" />
                Create Report
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Last Sent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report._id}>
                      <TableCell>
                        <Badge
                          variant={report.active ? 'default' : 'secondary'}
                          className={report.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                        >
                          {report.active ? 'Active' : 'Paused'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[report.type] || 'bg-gray-100'}`}>
                          {TYPE_LABELS[report.type] || report.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {FREQUENCY_LABELS[report.frequency] || report.frequency}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span title={report.recipientEmails.join(', ')}>
                            {report.recipientEmails.length} recipient{report.recipientEmails.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(report.nextRunAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(report.lastSentAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggle(report)}
                            title={report.active ? 'Pause' : 'Resume'}
                          >
                            {report.active ? (
                              <PauseCircle className="h-4 w-4 text-orange-500" />
                            ) : (
                              <PlayCircle className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(report)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(report)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingReport ? 'Edit Report' : 'New Scheduled Report'}</DialogTitle>
            <DialogDescription>
              {editingReport
                ? 'Update the report configuration below.'
                : 'Configure a new automated email report.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                placeholder="e.g., Weekly Revenue Summary"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue Summary</SelectItem>
                    <SelectItem value="traffic">Traffic & Visitors</SelectItem>
                    <SelectItem value="campaigns">Campaign Performance</SelectItem>
                    <SelectItem value="full">Full Dashboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={formFrequency} onValueChange={setFormFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-emails">Recipient Emails</Label>
              <Input
                id="report-emails"
                placeholder="admin@example.com, manager@example.com"
                value={formEmails}
                onChange={(e) => setFormEmails(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple emails with commas
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : editingReport ? (
                'Update Report'
              ) : (
                'Create Report'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
