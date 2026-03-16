'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';

interface CohortRow {
  weekLabel: string;
  users: number;
  retention: number[]; // percentages: [week0, week1, ...]
}

const WEEK_OPTIONS = [4, 8, 12, 16];

/**
 * Weekly cohort retention heatmap.
 * Reason: Visualises whether visitors return in subsequent weeks,
 * which is critical for understanding engagement quality.
 */
export function CohortAnalysis() {
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [weeks, setWeeks] = useState(8);
  const [loading, setLoading] = useState(true);

  const fetchCohorts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tracking/cohorts?weeks=${weeks}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) setCohorts(json.cohorts);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [weeks]);

  useEffect(() => { fetchCohorts(); }, [fetchCohorts]);

  // Color intensity for retention percentage
  const cellColor = (pct: number) => {
    if (pct >= 80) return 'bg-green-600 text-white';
    if (pct >= 60) return 'bg-green-500 text-white';
    if (pct >= 40) return 'bg-green-400 text-white';
    if (pct >= 20) return 'bg-green-300 text-green-900';
    if (pct >= 10) return 'bg-green-200 text-green-800';
    if (pct > 0) return 'bg-green-100 text-green-700';
    return 'bg-gray-50 text-gray-400';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Cohort Retention</CardTitle>
            <CardDescription>Weekly retention of visitors by first-visit cohort</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {WEEK_OPTIONS.map(w => (
                <Button
                  key={w}
                  variant={weeks === w ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setWeeks(w)}
                >
                  {w}w
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={fetchCohorts} disabled={loading} className="h-7">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading cohort data...
          </div>
        ) : cohorts.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 text-sm">
            Not enough data to display cohort retention.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left font-medium text-muted-foreground">Cohort</th>
                  <th className="p-2 text-right font-medium text-muted-foreground">Users</th>
                  {Array.from({ length: weeks }, (_, i) => (
                    <th key={i} className="p-2 text-center font-medium text-muted-foreground">
                      W{i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {cohorts.map((row, ri) => (
                  <tr key={ri}>
                    <td className="p-2 font-medium whitespace-nowrap">{row.weekLabel}</td>
                    <td className="p-2 text-right text-muted-foreground">{row.users}</td>
                    {Array.from({ length: weeks }, (_, ci) => {
                      const pct = row.retention[ci];
                      const hasData = ci < row.retention.length;
                      return (
                        <td key={ci} className="p-1 text-center">
                          {hasData ? (
                            <div
                              className={`rounded px-1 py-0.5 ${cellColor(pct)}`}
                              title={`Week ${ci}: ${pct}% retained (${Math.round(row.users * pct / 100)} users)`}
                            >
                              {pct}%
                            </div>
                          ) : (
                            <div className="text-gray-200">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
          <span>Retention:</span>
          {[0, 10, 20, 40, 60, 80].map(pct => (
            <div key={pct} className="flex items-center gap-1">
              <div className={`w-4 h-3 rounded ${cellColor(pct)}`} />
              <span>{pct}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
