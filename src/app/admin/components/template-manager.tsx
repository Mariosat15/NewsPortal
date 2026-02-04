'use client';

import { useState, useEffect } from 'react';
import { Layout, Check, Monitor, Moon, Sun, Eye, Palette } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  features: string[];
  isDark: boolean;
}

const templates: Template[] = [
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Classic news magazine layout with trending sidebar, featured articles, and category sections',
    features: ['3-column layout', 'Trending sidebar', 'Featured hero', 'Category sections'],
    isDark: false,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, minimalist design focusing on content with generous whitespace',
    features: ['Single column', 'Large typography', 'Focused reading', 'Serif fonts'],
    isDark: false,
  },
  {
    id: 'grid',
    name: 'Grid',
    description: 'Modern card-based grid layout for visual browsing',
    features: ['Masonry grid', 'Visual cards', 'Category filters', 'Compact view'],
    isDark: false,
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional newspaper-style layout with breaking news bar',
    features: ['Multi-column', 'Breaking news', 'Headline focus', 'Traditional style'],
    isDark: false,
  },
  {
    id: 'dark-pro',
    name: 'Dark Pro',
    description: 'Professional dark theme with market tickers, breaking news, and category sections',
    features: ['Dark background', 'Market ticker', 'Breaking news bar', 'Multi-section'],
    isDark: true,
  },
  {
    id: 'dark-portal',
    name: 'Dark Portal',
    description: 'Modern news portal with tabbed navigation, top stories, and world news sidebar',
    features: ['Tabbed content', 'Top stories', 'World news', 'Mixed dark/light'],
    isDark: true,
  },
];

const colorSchemes = [
  { id: 'pink', name: 'Pink', primary: '#e91e8c', secondary: '#d11a7d' },
  { id: 'blue', name: 'Blue', primary: '#2563eb', secondary: '#1d4ed8' },
  { id: 'red', name: 'Red', primary: '#dc2626', secondary: '#b91c1c' },
  { id: 'green', name: 'Green', primary: '#16a34a', secondary: '#15803d' },
  { id: 'purple', name: 'Purple', primary: '#9333ea', secondary: '#7e22ce' },
  { id: 'orange', name: 'Orange', primary: '#ea580c', secondary: '#c2410c' },
];

export function TemplateManager() {
  const [selectedTemplate, setSelectedTemplate] = useState('magazine');
  const [selectedColor, setSelectedColor] = useState('pink');
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const settings = data.settings || data;
        if (settings.template?.layout) setSelectedTemplate(settings.template.layout);
        if (settings.template?.colorScheme) setSelectedColor(settings.template.colorScheme);
        if (settings.template?.darkMode !== undefined) setDarkMode(settings.template.darkMode);
      }
    } catch (error) {
      console.error('Error loading template settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: {
            layout: selectedTemplate,
            colorScheme: selectedColor,
            darkMode,
          }
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Template settings saved! Refresh the homepage to see changes.' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save template settings' });
    } finally {
      setSaving(false);
    }
  };

  const selectedColorObj = colorSchemes.find(c => c.id === selectedColor);
  const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);
  const lightTemplates = templates.filter(t => !t.isDark);
  const darkTemplates = templates.filter(t => t.isDark);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Layout className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Template Settings</h2>
            <p className="text-sm text-gray-500">Customize the look and feel of your news portal</p>
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

      {/* Light Templates */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Sun className="h-4 w-4" />
          Light Templates
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {lightTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                selectedTemplate === template.id
                  ? 'border-[#e91e8c] bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {selectedTemplate === template.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-[#e91e8c] rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              
              {/* Preview */}
              <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-3 p-2 overflow-hidden">
                {template.id === 'magazine' && (
                  <div className="h-full flex gap-1">
                    <div className="w-1/4 bg-gray-200 rounded" />
                    <div className="flex-1 bg-gray-300 rounded" />
                    <div className="w-1/4 bg-gray-200 rounded" />
                  </div>
                )}
                {template.id === 'minimal' && (
                  <div className="h-full flex flex-col items-center gap-1">
                    <div className="w-3/4 h-2 bg-gray-300 rounded" />
                    <div className="w-full h-12 bg-gray-200 rounded mt-1" />
                    <div className="w-full h-1 bg-gray-200 rounded" />
                    <div className="w-full h-1 bg-gray-200 rounded" />
                  </div>
                )}
                {template.id === 'grid' && (
                  <div className="h-full grid grid-cols-3 gap-1">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-gray-200 rounded" />
                    ))}
                  </div>
                )}
                {template.id === 'classic' && (
                  <div className="h-full flex flex-col gap-1">
                    <div className="h-2 bg-red-400 rounded" />
                    <div className="flex-1 flex gap-1">
                      <div className="w-2/3 bg-gray-300 rounded" />
                      <div className="w-1/3 space-y-1">
                        <div className="h-1/3 bg-gray-200 rounded" />
                        <div className="h-1/3 bg-gray-200 rounded" />
                        <div className="h-1/3 bg-gray-200 rounded" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <h4 className="font-semibold text-gray-900 text-sm">{template.name}</h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
              
              <div className="mt-3 flex flex-wrap gap-1">
                {template.features.slice(0, 2).map((feature) => (
                  <span key={feature} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {feature}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dark Templates */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Moon className="h-4 w-4" />
          Dark Templates
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {darkTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                selectedTemplate === template.id
                  ? 'border-[#e91e8c] bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {selectedTemplate === template.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-[#e91e8c] rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              
              {/* Dark Preview */}
              <div className="aspect-[4/3] bg-[#1a1d29] rounded-lg mb-3 p-2 overflow-hidden">
                {template.id === 'dark-pro' && (
                  <div className="h-full flex flex-col gap-1">
                    <div className="h-1.5 bg-red-500 rounded" />
                    <div className="flex-1 flex gap-1">
                      <div className="w-2/3 bg-gray-700 rounded relative">
                        <div className="absolute bottom-1 left-1 right-1 h-2 bg-gray-600 rounded" />
                      </div>
                      <div className="w-1/3 space-y-1">
                        <div className="h-1/2 bg-[#242836] rounded" />
                        <div className="h-1/2 bg-[#242836] rounded" />
                      </div>
                    </div>
                  </div>
                )}
                {template.id === 'dark-portal' && (
                  <div className="h-full flex flex-col gap-1">
                    <div className="h-1.5 bg-red-600 rounded" />
                    <div className="flex-1 bg-gray-300 rounded relative">
                      <div className="absolute bottom-1 left-1 right-1 h-3 bg-white/90 rounded" />
                    </div>
                    <div className="flex gap-1 h-1/3">
                      <div className="flex-1 bg-gray-800 rounded" />
                      <div className="w-1/3 bg-gray-200 rounded" />
                    </div>
                  </div>
                )}
              </div>
              
              <h4 className="font-semibold text-gray-900 text-sm">{template.name}</h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
              
              <div className="mt-3 flex flex-wrap gap-1">
                {template.features.slice(0, 2).map((feature) => (
                  <span key={feature} className="text-[10px] px-2 py-0.5 bg-gray-800 text-gray-300 rounded">
                    {feature}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Scheme */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Accent Color
        </h3>
        <div className="flex flex-wrap gap-3">
          {colorSchemes.map((color) => (
            <button
              key={color.id}
              onClick={() => setSelectedColor(color.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                selectedColor === color.id
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div 
                className="w-5 h-5 rounded-full shadow-inner"
                style={{ backgroundColor: color.primary }}
              />
              <span className="text-sm font-medium text-gray-700">{color.name}</span>
              {selectedColor === color.id && (
                <Check className="h-4 w-4 text-gray-900" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Live Preview
        </h3>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs text-gray-400">
                {selectedTemplateObj?.name} Template
                {selectedTemplateObj?.isDark && ' (Dark)'}
              </span>
            </div>
          </div>
          
          <div className={`min-h-[320px] p-6 ${selectedTemplateObj?.isDark ? 'bg-[#1a1d29]' : 'bg-gray-50'}`}>
            {/* Magazine Preview */}
            {selectedTemplate === 'magazine' && (
              <div className="flex gap-4">
                <div className="w-1/4 space-y-2">
                  <div className="h-4 rounded" style={{ backgroundColor: selectedColorObj?.primary }} />
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex gap-2 p-2 bg-white rounded shadow-sm">
                      <div className="w-8 h-8 bg-gray-200 rounded" />
                      <div className="flex-1 space-y-1">
                        <div className="h-2 bg-gray-200 rounded w-full" />
                        <div className="h-2 bg-gray-100 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="aspect-video bg-gray-200 rounded-lg relative">
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="h-3 rounded w-16 mb-2" style={{ backgroundColor: selectedColorObj?.primary }} />
                      <div className="h-3 bg-white rounded w-3/4 mb-1" />
                      <div className="h-2 bg-white/70 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[1,2].map(i => (
                      <div key={i} className="aspect-video bg-gray-200 rounded-lg" />
                    ))}
                  </div>
                </div>
                <div className="w-1/4 space-y-2">
                  <div className="flex gap-1">
                    <div className="h-6 rounded px-2 text-white text-xs flex items-center" style={{ backgroundColor: selectedColorObj?.primary }}>Latest</div>
                    <div className="h-6 bg-gray-200 rounded px-2 text-xs flex items-center text-gray-600">Popular</div>
                  </div>
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-2 p-2 bg-white rounded shadow-sm">
                      <div className="w-12 h-10 bg-gray-200 rounded" />
                      <div className="flex-1 space-y-1">
                        <div className="h-2 bg-gray-200 rounded w-full" />
                        <div className="h-2 bg-gray-100 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Minimal Preview */}
            {selectedTemplate === 'minimal' && (
              <div className="max-w-2xl mx-auto space-y-6 bg-white p-6 rounded-lg">
                <div className="text-center space-y-2">
                  <div className="h-2 rounded w-16 mx-auto" style={{ backgroundColor: selectedColorObj?.primary }} />
                  <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto" />
                </div>
                <div className="aspect-video bg-gray-200 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded" />
                  <div className="h-2 bg-gray-200 rounded" />
                  <div className="h-2 bg-gray-200 rounded w-4/5" />
                </div>
              </div>
            )}
            
            {/* Grid Preview */}
            {selectedTemplate === 'grid' && (
              <div className="space-y-4">
                <div className="flex gap-2 justify-center">
                  {['All', 'News', 'Tech', 'Sports'].map((cat, i) => (
                    <div 
                      key={cat} 
                      className={`h-6 px-3 rounded-full text-xs flex items-center ${i === 0 ? 'text-white' : 'bg-white text-gray-600'}`}
                      style={i === 0 ? { backgroundColor: selectedColorObj?.primary } : {}}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <div className="aspect-video bg-gray-200" />
                      <div className="p-2 space-y-1">
                        <div className="h-2 bg-gray-200 rounded" />
                        <div className="h-2 bg-gray-100 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Classic Preview */}
            {selectedTemplate === 'classic' && (
              <div className="space-y-4">
                <div className="h-8 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: selectedColorObj?.primary }}>
                  BREAKING NEWS
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-3">
                    <div className="aspect-video bg-gray-200 rounded-lg" />
                    <div className="h-4 bg-gray-300 rounded w-3/4" />
                    <div className="h-2 bg-gray-200 rounded" />
                  </div>
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="p-2 bg-white rounded shadow-sm space-y-1">
                        <div className="h-2 bg-gray-200 rounded" />
                        <div className="h-2 bg-gray-100 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dark Pro Preview */}
            {selectedTemplate === 'dark-pro' && (
              <div className="space-y-4">
                <div className="h-6 bg-red-600 rounded flex items-center px-3">
                  <span className="bg-white text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded">BREAKING</span>
                  <span className="text-white text-xs ml-2">Latest breaking news...</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-3">
                    <div className="aspect-video bg-gray-700 rounded-lg relative">
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="h-3 bg-white rounded w-3/4 mb-1" />
                        <div className="h-2 bg-white/50 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="aspect-video bg-gray-700 rounded" />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-[#242836] rounded-lg p-3">
                      <div className="text-white text-xs font-bold mb-2">Top Stories</div>
                      {[1,2,3].map(i => (
                        <div key={i} className="flex items-center gap-2 py-1">
                          <span className="text-red-500 text-xs">●</span>
                          <div className="h-2 bg-gray-600 rounded flex-1" />
                        </div>
                      ))}
                    </div>
                    <div className="bg-[#242836] rounded-lg p-3">
                      <div className="text-white text-xs font-bold mb-2">Newsletter</div>
                      <div className="h-6 bg-gray-700 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dark Portal Preview */}
            {selectedTemplate === 'dark-portal' && (
              <div className="space-y-4">
                <div className="h-6 bg-red-600 rounded flex items-center px-3">
                  <span className="bg-white text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse">BREAKING</span>
                  <span className="text-white text-xs ml-2">Major news update...</span>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="aspect-[21/9] bg-gray-200 rounded-lg relative mb-4">
                    <div className="absolute bottom-3 left-3">
                      <div className="h-4 bg-gray-800 rounded w-3/4 mb-1" />
                      <div className="h-2 bg-gray-600 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 px-3 text-xs flex items-center border-b-2" style={{ borderColor: selectedColorObj?.primary, color: selectedColorObj?.primary }}>LATEST</div>
                    <div className="h-6 px-3 text-xs flex items-center text-gray-400">POPULAR</div>
                    <div className="h-6 px-3 text-xs flex items-center text-gray-400">TRENDING</div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="space-y-1">
                        <div className="aspect-video bg-gray-200 rounded" />
                        <div className="h-2 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-gray-800 rounded-lg p-3">
                    <div className="text-white text-xs font-bold mb-2">TOP STORIES</div>
                    <div className="flex gap-2">
                      <div className="w-1/2 aspect-[4/3] bg-gray-700 rounded" />
                      <div className="w-1/2 space-y-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-3 bg-gray-700 rounded" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-white text-xs font-bold mb-2">WORLD</div>
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex items-center gap-1 py-1">
                        <span className="text-red-500 text-xs">›</span>
                        <div className="h-2 bg-gray-600 rounded flex-1" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Selection Info */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Currently selected:</strong> {selectedTemplateObj?.name} template with {selectedColorObj?.name} accent color.
          {selectedTemplateObj?.isDark && ' This is a dark theme.'}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          After saving, refresh the homepage to see your changes.
        </p>
      </div>
    </div>
  );
}
