'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Check, ExternalLink, Eye, EyeOff, Plus, Trash2, AlertCircle } from 'lucide-react';

interface ImageSource {
  id: string;
  name: string;
  logo: string;
  description: string;
  website: string;
  keyName: string;
  keyPlaceholder: string;
  freeLimit: string;
}

const availableSources: ImageSource[] = [
  {
    id: 'unsplash',
    name: 'Unsplash',
    logo: '📷',
    description: 'High-quality free photos from professional photographers',
    website: 'https://unsplash.com/developers',
    keyName: 'Access Key',
    keyPlaceholder: 'Enter your Unsplash Access Key',
    freeLimit: '50 requests/hour (free)',
  },
  {
    id: 'pexels',
    name: 'Pexels',
    logo: '🖼️',
    description: 'Free stock photos and videos with no attribution required',
    website: 'https://www.pexels.com/api/',
    keyName: 'API Key',
    keyPlaceholder: 'Enter your Pexels API Key',
    freeLimit: '200 requests/hour (free)',
  },
  {
    id: 'pixabay',
    name: 'Pixabay',
    logo: '🎨',
    description: 'Over 2.6 million free images, videos, and music',
    website: 'https://pixabay.com/api/docs/',
    keyName: 'API Key',
    keyPlaceholder: 'Enter your Pixabay API Key',
    freeLimit: '5,000 requests/hour (free)',
  },
];

interface SourceConfig {
  enabled: boolean;
  apiKey: string;
}

type ImageSourcesConfig = Record<string, SourceConfig>;

export function ImageSources() {
  const [config, setConfig] = useState<ImageSourcesConfig>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const settings = data.settings || data;
        if (settings.imageSources) {
          // Convert from API format to local format
          const loaded: ImageSourcesConfig = {};
          if (settings.imageSources.unsplash) {
            loaded.unsplash = {
              enabled: settings.imageSources.unsplash.enabled ?? false,
              apiKey: settings.imageSources.unsplash.accessKey || '',
            };
          }
          if (settings.imageSources.pexels) {
            loaded.pexels = {
              enabled: settings.imageSources.pexels.enabled ?? false,
              apiKey: settings.imageSources.pexels.apiKey || '',
            };
          }
          if (settings.imageSources.pixabay) {
            loaded.pixabay = {
              enabled: settings.imageSources.pixabay.enabled ?? false,
              apiKey: settings.imageSources.pixabay.apiKey || '',
            };
          }
          setConfig(loaded);
        }
      }
    } catch (error) {
      console.error('Error loading image sources config:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Convert to API format
      const apiFormat = {
        unsplash: config.unsplash ? {
          enabled: config.unsplash.enabled,
          accessKey: config.unsplash.apiKey,
        } : undefined,
        pexels: config.pexels ? {
          enabled: config.pexels.enabled,
          apiKey: config.pexels.apiKey,
        } : undefined,
        pixabay: config.pixabay ? {
          enabled: config.pixabay.enabled,
          apiKey: config.pixabay.apiKey,
        } : undefined,
      };

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageSources: apiFormat }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Image sources configuration saved successfully!' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save image sources configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSource = async (sourceId: string) => {
    const sourceConfig = config[sourceId];
    if (!sourceConfig?.apiKey) {
      setTestResults({ ...testResults, [sourceId]: 'error' });
      return;
    }

    setTesting(sourceId);
    setTestResults({ ...testResults, [sourceId]: null });

    try {
      // Simple test queries for each API
      let testUrl = '';
      const headers: Record<string, string> = {};

      if (sourceId === 'unsplash') {
        testUrl = `https://api.unsplash.com/search/photos?query=test&per_page=1`;
        headers['Authorization'] = `Client-ID ${sourceConfig.apiKey}`;
      } else if (sourceId === 'pexels') {
        testUrl = `https://api.pexels.com/v1/search?query=test&per_page=1`;
        headers['Authorization'] = sourceConfig.apiKey;
      } else if (sourceId === 'pixabay') {
        testUrl = `https://pixabay.com/api/?key=${sourceConfig.apiKey}&q=test&per_page=3`;
      }

      const res = await fetch(testUrl, { headers });
      
      if (res.ok) {
        setTestResults({ ...testResults, [sourceId]: 'success' });
      } else {
        setTestResults({ ...testResults, [sourceId]: 'error' });
      }
    } catch (error) {
      setTestResults({ ...testResults, [sourceId]: 'error' });
    } finally {
      setTesting(null);
    }
  };

  const toggleSource = (sourceId: string) => {
    setConfig({
      ...config,
      [sourceId]: {
        ...config[sourceId],
        enabled: !config[sourceId]?.enabled,
        apiKey: config[sourceId]?.apiKey || '',
      },
    });
  };

  const updateApiKey = (sourceId: string, apiKey: string) => {
    setConfig({
      ...config,
      [sourceId]: {
        ...config[sourceId],
        enabled: config[sourceId]?.enabled ?? false,
        apiKey,
      },
    });
  };

  const enabledCount = Object.values(config).filter(c => c?.enabled && c?.apiKey).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <ImageIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Image Sources</h2>
            <p className="text-sm text-gray-500">Configure free image APIs for AI-powered article images</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#e91e8c] text-white rounded-lg hover:bg-[#d11a7d] transition-colors disabled:opacity-50 font-medium text-sm"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Status Overview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          {enabledCount > 0 ? (
            <>
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-gray-700">
                <strong>{enabledCount}</strong> image source{enabledCount > 1 ? 's' : ''} configured. 
                AI will search for relevant images when generating articles.
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-gray-700">
                No image sources configured. Articles will use fallback category images.
                <br />
                <span className="text-gray-500">Add at least one API key below to enable AI-powered image search.</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Image Sources */}
      <div className="space-y-4">
        {availableSources.map((source) => {
          const sourceConfig = config[source.id];
          const isEnabled = sourceConfig?.enabled && sourceConfig?.apiKey;
          const testResult = testResults[source.id];

          return (
            <div
              key={source.id}
              className={`border rounded-xl p-5 transition-all ${
                isEnabled ? 'border-green-300 bg-green-50/50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{source.logo}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{source.name}</h3>
                      {isEnabled && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{source.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{source.freeLimit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={source.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Get API Key"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => toggleSource(source.id)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      sourceConfig?.enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        sourceConfig?.enabled ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {sourceConfig?.enabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {source.keyName}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showKeys[source.id] ? 'text' : 'password'}
                          value={sourceConfig.apiKey || ''}
                          onChange={(e) => updateApiKey(source.id, e.target.value)}
                          placeholder={source.keyPlaceholder}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKeys({ ...showKeys, [source.id]: !showKeys[source.id] })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showKeys[source.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => handleTestSource(source.id)}
                        disabled={testing === source.id || !sourceConfig.apiKey}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium transition-colors"
                      >
                        {testing === source.id ? 'Testing...' : 'Test'}
                      </button>
                    </div>
                    {testResult && (
                      <p className={`text-xs mt-1 ${testResult === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {testResult === 'success' ? '✓ API key is valid!' : '✗ Invalid API key or connection error'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">How AI Image Search Works</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>When generating articles, the AI analyzes the title and content</li>
          <li>It generates specific visual keywords (e.g., "business meeting", "tech innovation")</li>
          <li>These keywords are used to search the configured image APIs</li>
          <li>The most relevant image is automatically selected for the article</li>
        </ol>
        <p className="text-xs text-blue-600 mt-3">
          Tip: Enable multiple sources for better variety and reliability.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        <a
          href="https://unsplash.com/developers"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          <span>📷</span>
          <span className="text-gray-700">Get Unsplash Key</span>
          <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
        </a>
        <a
          href="https://www.pexels.com/api/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          <span>🖼️</span>
          <span className="text-gray-700">Get Pexels Key</span>
          <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
        </a>
        <a
          href="https://pixabay.com/api/docs/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          <span>🎨</span>
          <span className="text-gray-700">Get Pixabay Key</span>
          <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
        </a>
      </div>
    </div>
  );
}
