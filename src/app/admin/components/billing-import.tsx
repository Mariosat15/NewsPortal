'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

export function BillingImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/billing/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setFile(null);
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (err) {
      setError('Failed to import file');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Billing Import</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Import CSV</CardTitle>
            <CardDescription>
              Upload a CSV file with billing data to import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importing...' : 'Import'}
            </Button>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            {result && (
              <div className="p-4 bg-green-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Import Complete</span>
                </div>
                <div className="text-sm space-y-1">
                  <p>Total rows: {result.total}</p>
                  <p>Imported: {result.imported}</p>
                  <p>Skipped: {result.skipped}</p>
                  {result.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-red-600">
                        {result.errors.length} errors
                      </summary>
                      <ul className="mt-1 text-xs text-red-600">
                        {result.errors.slice(0, 10).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {result.errors.length > 10 && (
                          <li>...and {result.errors.length - 10} more</li>
                        )}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CSV Format</CardTitle>
            <CardDescription>
              Expected columns in your CSV file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Your CSV should have the following columns (in order or with headers):
              </p>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Column</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-left py-2">Required</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-mono">msisdn</td>
                    <td className="py-2">Phone number</td>
                    <td className="py-2">Yes</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">transaction_id</td>
                    <td className="py-2">External transaction ID</td>
                    <td className="py-2">Yes</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">amount</td>
                    <td className="py-2">Amount (EUR or cents)</td>
                    <td className="py-2">Yes</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">status</td>
                    <td className="py-2">paid, refunded, failed</td>
                    <td className="py-2">Yes</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono">date</td>
                    <td className="py-2">Transaction date</td>
                    <td className="py-2">No</td>
                  </tr>
                </tbody>
              </table>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">Example:</p>
                <code className="text-xs block whitespace-pre overflow-x-auto">
{`msisdn,transaction_id,amount,status,date
+491721234567,TXN-001,0.99,paid,2026-01-15
+491729876543,TXN-002,0.99,paid,2026-01-15`}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
