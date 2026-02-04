'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Play, Settings, Clock, Plus, X } from 'lucide-react';

interface AgentSettings {
  enabled: boolean;
  topics: string[];
  cronSchedule: string;
  maxArticlesPerRun: number;
  defaultLanguage: 'de' | 'en';
}

const defaultSettings: AgentSettings = {
  enabled: true,
  topics: ['news', 'lifestyle', 'technology', 'sports', 'health', 'finance'],
  cronSchedule: '0 */6 * * *',
  maxArticlesPerRun: 5,
  defaultLanguage: 'de',
};

export function AgentConfig() {
  const [settings, setSettings] = useState<AgentSettings>(defaultSettings);
  const [newTopic, setNewTopic] = useState('');
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleAddTopic = () => {
    if (newTopic.trim() && !settings.topics.includes(newTopic.trim().toLowerCase())) {
      setSettings({
        ...settings,
        topics: [...settings.topics, newTopic.trim().toLowerCase()],
      });
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setSettings({
      ...settings,
      topics: settings.topics.filter(t => t !== topic),
    });
  };

  const handleRunAgents = async () => {
    const secret = prompt('Enter admin secret to run agents:');
    if (!secret) return;

    setRunning(true);
    setRunResult(null);

    try {
      const response = await fetch('/api/agents/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secret}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setRunResult({
          success: true,
          message: `Successfully published ${data.data.itemsSuccessful} articles`,
        });
        setLastRun(new Date().toISOString());
      } else {
        setRunResult({
          success: false,
          message: data.error || 'Failed to run agents',
        });
      }
    } catch (error) {
      setRunResult({
        success: false,
        message: 'Network error',
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSaveSettings = async () => {
    alert('Settings saved (Note: Full persistence requires database storage - coming soon)');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">AI Content Agents</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Run Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Run Agents
            </CardTitle>
            <CardDescription>
              Manually trigger the AI content generation pipeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleRunAgents} 
              disabled={running}
              className="w-full"
            >
              {running ? 'Running...' : 'Run Content Pipeline'}
            </Button>

            {runResult && (
              <div className={`p-3 rounded-lg ${
                runResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {runResult.message}
              </div>
            )}

            {lastRun && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Last run: {new Date(lastRun).toLocaleString()}
              </p>
            )}

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Pipeline steps:</strong>
              </p>
              <ol className="text-sm text-blue-600 mt-2 list-decimal list-inside space-y-1">
                <li>Gatherer: Collects news from configured topics</li>
                <li>Drafter: Creates article drafts using GPT-4</li>
                <li>Editor: Polishes and improves content</li>
                <li>Publisher: Publishes quality articles</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Topic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Topics Configuration
            </CardTitle>
            <CardDescription>
              Configure which topics agents should cover
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {settings.topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="pl-3 pr-1 py-1">
                  {topic}
                  <button
                    onClick={() => handleRemoveTopic(topic)}
                    className="ml-2 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add new topic..."
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
              />
              <Button onClick={handleAddTopic} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="space-y-2">
                <Label>Max Articles per Run</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.maxArticlesPerRun}
                  onChange={(e) => setSettings({
                    ...settings,
                    maxArticlesPerRun: parseInt(e.target.value) || 5,
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Cron Schedule</Label>
                <Input
                  value={settings.cronSchedule}
                  onChange={(e) => setSettings({
                    ...settings,
                    cronSchedule: e.target.value,
                  })}
                  placeholder="0 */6 * * *"
                />
                <p className="text-xs text-muted-foreground">
                  Default: Every 6 hours (0 */6 * * *)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Default Language</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={settings.defaultLanguage}
                  onChange={(e) => setSettings({
                    ...settings,
                    defaultLanguage: e.target.value as 'de' | 'en',
                  })}
                >
                  <option value="de">German (Deutsch)</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <Button onClick={handleSaveSettings} className="w-full">
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
