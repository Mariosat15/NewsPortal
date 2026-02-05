'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Settings, Clock, Plus, X, Rss, Brain, FileText, 
  Sliders, Save, Loader2, AlertCircle, CheckCircle, Trash2,
  Globe, Zap, BookOpen, MessageSquare, Timer
} from 'lucide-react';
import { SchedulePicker } from './schedule-picker';

interface RSSFeed {
  url: string;
  name: string;
  category: string;
  language: 'de' | 'en';
  enabled: boolean;
}

interface AIModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

interface ArticleStyle {
  types: string[]; // Multiple types now supported
  tone: 'neutral' | 'engaging' | 'formal' | 'conversational';
  depth: 'brief' | 'standard' | 'in-depth';
  includeImages: boolean;
  includeQuotes: boolean;
  includeSources: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  enabled: boolean;
  contentTypes: string[];
  order: number;
}

interface AgentSettings {
  enabled: boolean;
  topics: string[];
  cronSchedule: string;
  maxArticlesPerRun: number;
  defaultLanguage: 'de' | 'en';
  
  // RSS Feeds
  rssFeeds: RSSFeed[];
  useRSSFeeds: boolean;
  
  // AI Model
  aiModel: AIModelConfig;
  
  // Article Settings
  articleStyle: ArticleStyle;
  minWordCount: number;
  maxWordCount: number;
  minQualityScore: number;
  
  // Distribution settings
  distributeEvenly: boolean; // Distribute articles evenly across categories
}

const defaultRSSFeeds: RSSFeed[] = [
  { url: 'https://www.tagesschau.de/xml/rss2/', name: 'Tagesschau', category: 'news', language: 'de', enabled: true },
  { url: 'https://www.spiegel.de/schlagzeilen/index.rss', name: 'Spiegel Online', category: 'news', language: 'de', enabled: true },
  { url: 'https://rss.sueddeutsche.de/rss/Topthemen', name: 'Süddeutsche', category: 'news', language: 'de', enabled: true },
  { url: 'https://www.heise.de/rss/heise-top-atom.xml', name: 'Heise', category: 'technology', language: 'de', enabled: true },
  { url: 'https://www.golem.de/rss.php', name: 'Golem', category: 'technology', language: 'de', enabled: true },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', category: 'news', language: 'en', enabled: false },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'NY Times', category: 'news', language: 'en', enabled: false },
  { url: 'https://feeds.feedburner.com/TechCrunch/', name: 'TechCrunch', category: 'technology', language: 'en', enabled: false },
];

const defaultAIModel: AIModelConfig = {
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4000,
  topP: 0.9,
  frequencyPenalty: 0.3,
  presencePenalty: 0.3,
};

const defaultArticleStyle: ArticleStyle = {
  types: ['news'], // Multiple types supported
  tone: 'engaging',
  depth: 'standard',
  includeImages: true,
  includeQuotes: true,
  includeSources: true,
};

const defaultSettings: AgentSettings = {
  enabled: true,
  topics: ['news', 'lifestyle', 'technology', 'sports', 'health', 'finance'],
  cronSchedule: '0 */6 * * *',
  maxArticlesPerRun: 5,
  defaultLanguage: 'de',
  rssFeeds: defaultRSSFeeds,
  useRSSFeeds: true,
  aiModel: defaultAIModel,
  articleStyle: defaultArticleStyle,
  minWordCount: 500,
  maxWordCount: 1200,
  minQualityScore: 7,
  distributeEvenly: true,
};

const AI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o (Best Quality)', description: 'Most capable, best for complex articles' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast)', description: 'Fast and cost-effective' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'High quality with 128k context' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Budget)', description: 'Fastest, most economical' },
];

const ARTICLE_TYPES = [
  { value: 'news', label: 'News Report', icon: FileText, description: 'Factual, objective news reporting' },
  { value: 'analysis', label: 'Analysis', icon: Brain, description: 'In-depth analysis with expert insights' },
  { value: 'opinion', label: 'Opinion/Editorial', icon: MessageSquare, description: 'Opinion pieces with clear stance' },
  { value: 'summary', label: 'Summary/Digest', icon: BookOpen, description: 'Quick summaries of multiple sources' },
  { value: 'investigative', label: 'Investigative', icon: Zap, description: 'Deep-dive investigative pieces' },
  { value: 'guide', label: 'How-To Guide', icon: BookOpen, description: 'Step-by-step tutorials and guides' },
  { value: 'recipe', label: 'Recipe', icon: FileText, description: 'Food recipes with ingredients and steps' },
  { value: 'review', label: 'Review', icon: MessageSquare, description: 'Product, service, or media reviews' },
  { value: 'listicle', label: 'Listicle', icon: FileText, description: 'Top 10, best of, ranked lists' },
  { value: 'profile', label: 'Profile/Interview', icon: Globe, description: 'Person or company profiles' },
];

const TONES = [
  { value: 'neutral', label: 'Neutral & Objective' },
  { value: 'engaging', label: 'Engaging & Dynamic' },
  { value: 'formal', label: 'Formal & Professional' },
  { value: 'conversational', label: 'Conversational & Friendly' },
];

const DEPTHS = [
  { value: 'brief', label: 'Brief (300-500 words)' },
  { value: 'standard', label: 'Standard (500-800 words)' },
  { value: 'in-depth', label: 'In-Depth (800-1500 words)' },
];

export function AgentConfig() {
  const [settings, setSettings] = useState<AgentSettings>(defaultSettings);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'run' | 'rss' | 'ai' | 'style' | 'topics'>('run');
  const [newTopic, setNewTopic] = useState('');
  const [newFeed, setNewFeed] = useState<Partial<RSSFeed>>({ url: '', name: '', category: 'news', language: 'de', enabled: true });
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load settings from API
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings?.agentConfig) {
          // Handle backward compatibility: if articleStyle.type exists, convert to types array
          const articleStyle = data.settings.agentConfig.articleStyle || {};
          if (articleStyle.type && !articleStyle.types) {
            articleStyle.types = [articleStyle.type];
          }
          
          setSettings({
            ...defaultSettings,
            ...data.settings.agentConfig,
            rssFeeds: data.settings.agentConfig.rssFeeds || defaultRSSFeeds,
            aiModel: { ...defaultAIModel, ...(data.settings.agentConfig.aiModel || {}) },
            articleStyle: { ...defaultArticleStyle, ...articleStyle },
          });
        }
        
        // Load categories - ALWAYS sync with Categories Manager as single source of truth
        if (data.settings?.categories && data.settings.categories.length > 0) {
          setCategories(data.settings.categories);
          // Get enabled category slugs from Categories Manager
          const enabledCategorySlugs = data.settings.categories
            .filter((c: Category) => c.enabled)
            .map((c: Category) => c.slug);
          
          // Get previously selected topics from agentConfig
          const savedTopics = data.settings.agentConfig?.topics || [];
          
          // Filter saved topics to only include those that are still enabled in Categories Manager
          // This keeps user's selection but removes any that were disabled
          const validTopics = savedTopics.filter((t: string) => enabledCategorySlugs.includes(t));
          
          // If no valid topics but there are enabled categories, auto-select all enabled
          const finalTopics = validTopics.length > 0 ? validTopics : enabledCategorySlugs;
          
          setSettings(prev => ({ ...prev, topics: finalTopics }));
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }
  
  // Get enabled categories for topics
  const enabledCategories = categories.filter(c => c.enabled);
  
  // Calculate articles per category
  const articlesPerCategory = settings.distributeEvenly && enabledCategories.length > 0
    ? Math.floor(settings.maxArticlesPerRun / enabledCategories.length)
    : 0;
  const remainderArticles = settings.distributeEvenly && enabledCategories.length > 0
    ? settings.maxArticlesPerRun % enabledCategories.length
    : 0;

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

  const handleAddFeed = () => {
    if (newFeed.url && newFeed.name) {
      setSettings({
        ...settings,
        rssFeeds: [...settings.rssFeeds, newFeed as RSSFeed],
      });
      setNewFeed({ url: '', name: '', category: 'news', language: 'de', enabled: true });
    }
  };

  const handleRemoveFeed = (url: string) => {
    setSettings({
      ...settings,
      rssFeeds: settings.rssFeeds.filter(f => f.url !== url),
    });
  };

  const handleToggleFeed = (url: string) => {
    setSettings({
      ...settings,
      rssFeeds: settings.rssFeeds.map(f => 
        f.url === url ? { ...f, enabled: !f.enabled } : f
      ),
    });
  };

  const handleRunAgents = async () => {
    setRunning(true);
    setRunResult(null);

    try {
      // First save settings
      await handleSaveSettings(true);
      
      const response = await fetch('/api/agents/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();

      if (data.success) {
        setRunResult({
          success: true,
          message: `Successfully published ${data.data?.itemsSuccessful || 0} articles`,
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
        message: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown'),
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSaveSettings = async (silent = false) => {
    if (!silent) setSaving(true);
    setSaveResult(null);
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentConfig: settings }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (!silent) {
          setSaveResult({ success: true, message: 'Settings saved successfully!' });
          setTimeout(() => setSaveResult(null), 3000);
        }
      } else {
        setSaveResult({ success: false, message: data.error || 'Failed to save' });
      }
    } catch (err) {
      setSaveResult({ success: false, message: 'Network error' });
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const tabs = [
    { id: 'run', label: 'Run Pipeline', icon: Play },
    { id: 'rss', label: 'RSS Feeds', icon: Rss },
    { id: 'ai', label: 'AI Model', icon: Brain },
    { id: 'style', label: 'Article Style', icon: FileText },
    { id: 'topics', label: 'Topics', icon: Settings },
  ] as const;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">AI Content Agents</h1>
          <p className="text-muted-foreground">Configure smart article generation</p>
        </div>
        <Button onClick={() => handleSaveSettings(false)} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save All Settings
        </Button>
      </div>

      {saveResult && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          saveResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {saveResult.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {saveResult.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Run Pipeline Tab */}
      {activeTab === 'run' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Run Content Pipeline
              </CardTitle>
              <CardDescription>
                Generate new articles using AI agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-800 mb-2">Current Configuration:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Topics: {settings.topics.length} configured</li>
                  <li>• RSS Feeds: {settings.rssFeeds.filter(f => f.enabled).length} enabled</li>
                  <li>• AI Model: {settings.aiModel.model}</li>
                  <li>• Articles per run: {settings.maxArticlesPerRun}</li>
                  <li>• Types: {settings.articleStyle.types?.join(', ') || 'news'}</li>
                  <li>• Tone: {settings.articleStyle.tone}</li>
                </ul>
              </div>

              <Button 
                onClick={handleRunAgents} 
                disabled={running}
                className="w-full"
                size="lg"
              >
                {running ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Articles...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Generate Articles Now
                  </>
                )}
              </Button>

              {runResult && (
                <div className={`p-4 rounded-lg ${
                  runResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {runResult.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    {runResult.message}
                  </div>
                </div>
              )}

              {lastRun && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Last run: {new Date(lastRun).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Automatic Scheduling
              </CardTitle>
              <CardDescription>
                Set up automated article generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="font-medium text-amber-800 mb-2">Current Schedule</p>
                <p className="text-sm text-amber-700 mb-2">
                  Configure in the <strong>Topics</strong> tab above
                </p>
                <p className="text-xs text-amber-600">
                  Cron: {settings.cronSchedule}
                </p>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-sm">External Cron Setup</p>
                <p className="text-sm text-muted-foreground">
                  To enable automatic scheduled runs, configure an external cron service to call this endpoint:
                </p>
                <div className="p-3 bg-gray-100 rounded-lg font-mono text-xs break-all">
                  GET /api/agents/schedule?check=true&secret=YOUR_ADMIN_SECRET
                </div>
                <p className="text-xs text-muted-foreground">
                  Set up your server cron or a service like Vercel Cron Jobs to call this endpoint every minute. 
                  The system will check the schedule and only run when needed.
                </p>
                
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800">Example crontab entry:</p>
                  <code className="text-xs text-blue-700 block mt-1">
                    * * * * * curl -s "https://yoursite.com/api/agents/schedule?check=true&secret=YOUR_SECRET"
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline Steps</CardTitle>
              <CardDescription>How articles are generated</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</div>
                  <div>
                    <p className="font-medium">Gather Sources</p>
                    <p className="text-sm text-muted-foreground">Fetch news from RSS feeds and web sources</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">2</div>
                  <div>
                    <p className="font-medium">Draft Articles</p>
                    <p className="text-sm text-muted-foreground">AI creates unique articles from gathered info</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">3</div>
                  <div>
                    <p className="font-medium">Edit & Polish</p>
                    <p className="text-sm text-muted-foreground">AI editor improves quality and style</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">4</div>
                  <div>
                    <p className="font-medium">Publish</p>
                    <p className="text-sm text-muted-foreground">High-quality articles go live automatically</p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      )}

      {/* RSS Feeds Tab */}
      {activeTab === 'rss' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rss className="h-5 w-5" />
                RSS Feed Sources
              </CardTitle>
              <CardDescription>
                Configure news sources for article generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Use RSS Feeds</p>
                  <p className="text-sm text-muted-foreground">Fetch real news from RSS feeds</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.useRSSFeeds}
                    onChange={(e) => setSettings({ ...settings, useRSSFeeds: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Feed List */}
              <div className="space-y-2">
                {settings.rssFeeds.map((feed) => (
                  <div key={feed.url} className={`flex items-center justify-between p-3 border rounded-lg ${feed.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={feed.enabled}
                        onChange={() => handleToggleFeed(feed.url)}
                        className="w-4 h-4 rounded"
                      />
                      <div>
                        <p className="font-medium">{feed.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-md">{feed.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{feed.category}</Badge>
                      <Badge variant="secondary">{feed.language.toUpperCase()}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveFeed(feed.url)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Feed */}
              <div className="p-4 border rounded-lg space-y-3">
                <p className="font-medium">Add New RSS Feed</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Feed URL"
                    value={newFeed.url || ''}
                    onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                  />
                  <Input
                    placeholder="Feed Name"
                    value={newFeed.name || ''}
                    onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                  />
                  <select
                    className="px-3 py-2 border rounded-md"
                    value={newFeed.category}
                    onChange={(e) => setNewFeed({ ...newFeed, category: e.target.value })}
                  >
                    <option value="news">News</option>
                    <option value="technology">Technology</option>
                    <option value="sports">Sports</option>
                    <option value="health">Health</option>
                    <option value="finance">Finance</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="entertainment">Entertainment</option>
                  </select>
                  <select
                    className="px-3 py-2 border rounded-md"
                    value={newFeed.language}
                    onChange={(e) => setNewFeed({ ...newFeed, language: e.target.value as 'de' | 'en' })}
                  >
                    <option value="de">German</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <Button onClick={handleAddFeed} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Model Tab */}
      {activeTab === 'ai' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Model Selection
              </CardTitle>
              <CardDescription>Choose the AI model for content generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {AI_MODELS.map((model) => (
                <div 
                  key={model.value}
                  onClick={() => setSettings({ 
                    ...settings, 
                    aiModel: { ...settings.aiModel, model: model.value } 
                  })}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    settings.aiModel.model === model.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{model.label}</p>
                      <p className="text-sm text-muted-foreground">{model.description}</p>
                    </div>
                    {settings.aiModel.model === model.value && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Model Parameters
              </CardTitle>
              <CardDescription>Fine-tune AI behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Temperature: {settings.aiModel.temperature}</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.aiModel.temperature}
                  onChange={(e) => setSettings({
                    ...settings,
                    aiModel: { ...settings.aiModel, temperature: parseFloat(e.target.value) }
                  })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Lower = more focused, Higher = more creative
                </p>
              </div>

              <div className="space-y-2">
                <Label>Max Tokens: {settings.aiModel.maxTokens}</Label>
                <Input
                  type="number"
                  min={1000}
                  max={8000}
                  value={settings.aiModel.maxTokens}
                  onChange={(e) => setSettings({
                    ...settings,
                    aiModel: { ...settings.aiModel, maxTokens: parseInt(e.target.value) || 4000 }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Top P: {settings.aiModel.topP}</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.aiModel.topP}
                  onChange={(e) => setSettings({
                    ...settings,
                    aiModel: { ...settings.aiModel, topP: parseFloat(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequency Penalty</Label>
                  <Input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={settings.aiModel.frequencyPenalty}
                    onChange={(e) => setSettings({
                      ...settings,
                      aiModel: { ...settings.aiModel, frequencyPenalty: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Presence Penalty</Label>
                  <Input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={settings.aiModel.presencePenalty}
                    onChange={(e) => setSettings({
                      ...settings,
                      aiModel: { ...settings.aiModel, presencePenalty: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Article Style Tab */}
      {activeTab === 'style' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Article Types</CardTitle>
              <CardDescription>Select multiple content types to generate (articles will mix these types)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-2">
                Selected: {settings.articleStyle.types?.length || 0} type{(settings.articleStyle.types?.length || 0) !== 1 ? 's' : ''}
              </p>
              {ARTICLE_TYPES.map((type) => {
                const isSelected = settings.articleStyle.types?.includes(type.value);
                return (
                  <div
                    key={type.value}
                    onClick={() => {
                      const currentTypes = settings.articleStyle.types || ['news'];
                      const newTypes = isSelected
                        ? currentTypes.filter(t => t !== type.value)
                        : [...currentTypes, type.value];
                      // Ensure at least one type is selected
                      if (newTypes.length > 0) {
                        setSettings({
                          ...settings,
                          articleStyle: { ...settings.articleStyle, types: newTypes }
                        });
                      }
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <type.icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Writing Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={settings.articleStyle.tone}
                    onChange={(e) => setSettings({
                      ...settings,
                      articleStyle: { ...settings.articleStyle, tone: e.target.value as ArticleStyle['tone'] }
                    })}
                  >
                    {TONES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Article Depth</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={settings.articleStyle.depth}
                    onChange={(e) => setSettings({
                      ...settings,
                      articleStyle: { ...settings.articleStyle, depth: e.target.value as ArticleStyle['depth'] }
                    })}
                  >
                    {DEPTHS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Words</Label>
                    <Input
                      type="number"
                      value={settings.minWordCount}
                      onChange={(e) => setSettings({ ...settings, minWordCount: parseInt(e.target.value) || 300 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Words</Label>
                    <Input
                      type="number"
                      value={settings.maxWordCount}
                      onChange={(e) => setSettings({ ...settings, maxWordCount: parseInt(e.target.value) || 1200 })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'includeImages', label: 'Include Images', desc: 'Add relevant images to articles' },
                  { key: 'includeQuotes', label: 'Include Quotes', desc: 'Add expert quotes and citations' },
                  { key: 'includeSources', label: 'Cite Sources', desc: 'Reference source material' },
                ].map(feature => (
                  <div key={feature.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{feature.label}</p>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.articleStyle[feature.key as keyof ArticleStyle] as boolean}
                        onChange={(e) => setSettings({
                          ...settings,
                          articleStyle: { ...settings.articleStyle, [feature.key]: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Topics Tab */}
      {activeTab === 'topics' && (
        <div className="space-y-6">
          {/* Article Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Content Categories & Distribution
              </CardTitle>
              <CardDescription>
                Select which categories to generate articles for. Articles will be distributed across enabled categories.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Distribution toggle */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">Distribute Evenly</p>
                  <p className="text-sm text-muted-foreground">
                    Spread {settings.maxArticlesPerRun} articles evenly across {settings.topics.filter(t => enabledCategories.some(c => c.slug === t)).length} selected categories
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.distributeEvenly}
                    onChange={(e) => setSettings({ ...settings, distributeEvenly: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Categories with article counts */}
              {enabledCategories.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-medium text-sm">Enabled Categories ({enabledCategories.length})</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {enabledCategories.map((category, index) => {
                      const isSelected = settings.topics.includes(category.slug);
                      const articleCount = isSelected && settings.distributeEvenly
                        ? articlesPerCategory + (index < remainderArticles ? 1 : 0)
                        : 0;
                      
                      return (
                        <div
                          key={category.id}
                          onClick={() => {
                            if (isSelected) {
                              setSettings({ ...settings, topics: settings.topics.filter(t => t !== category.slug) });
                            } else {
                              setSettings({ ...settings, topics: [...settings.topics, category.slug] });
                            }
                          }}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded"
                              />
                              <span className="font-medium">{category.name}</span>
                            </div>
                            {isSelected && settings.distributeEvenly && (
                              <Badge variant="secondary" className="ml-2">
                                {articleCount} article{articleCount !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 pl-6">
                            {category.contentTypes?.slice(0, 2).join(', ')}
                            {category.contentTypes?.length > 2 ? '...' : ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-700">
                  <p className="font-medium">No categories configured</p>
                  <p className="text-sm">Go to <strong>Content → Categories</strong> to add and enable categories.</p>
                </div>
              )}

              {/* Manual topic input (fallback) */}
              <div className="border-t pt-4">
                <p className="font-medium text-sm mb-2">Custom Topics (optional)</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {settings.topics.filter(t => !enabledCategories.some(c => c.slug === t)).map((topic) => (
                    <Badge key={topic} variant="outline" className="pl-3 pr-1 py-1.5 text-sm">
                      {topic}
                      <button
                        onClick={() => handleRemoveTopic(topic)}
                        className="ml-2 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom topic..."
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                  />
                  <Button onClick={handleAddTopic} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Generation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Articles per Run</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={settings.maxArticlesPerRun}
                    onChange={(e) => setSettings({
                      ...settings,
                      maxArticlesPerRun: parseInt(e.target.value) || 5,
                    })}
                  />
                  {settings.distributeEvenly && settings.topics.length > 0 && (
                    <p className="text-xs text-blue-600">
                      ≈ {articlesPerCategory} article{articlesPerCategory !== 1 ? 's' : ''} per category
                      {remainderArticles > 0 ? ` (+${remainderArticles} extra for first categories)` : ''}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Minimum Quality Score (1-10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={settings.minQualityScore}
                    onChange={(e) => setSettings({
                      ...settings,
                      minQualityScore: parseInt(e.target.value) || 7,
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Articles below this score won't be published
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

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Schedule
                  </Label>
                  <SchedulePicker
                    value={settings.cronSchedule}
                    onChange={(newSchedule) => setSettings({
                      ...settings,
                      cronSchedule: newSchedule,
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Generation Preview</CardTitle>
                <CardDescription>What will be generated on next run</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{settings.maxArticlesPerRun}</p>
                    <p className="text-sm text-muted-foreground">Total articles</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{settings.topics.length}</p>
                    <p className="text-sm text-muted-foreground">Active categories</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{settings.articleStyle.types?.length || 1}</p>
                    <p className="text-sm text-muted-foreground">Content types</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">Types: {settings.articleStyle.types?.join(', ') || 'news'}</p>
                    <p>Tone: {settings.articleStyle.tone}</p>
                    <p>Depth: {settings.articleStyle.depth}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
