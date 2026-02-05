'use client';

import { useState, useEffect } from 'react';
import { Layout, Check, Moon, Sun, Eye, Palette, Sparkles, Grid, List, Newspaper, BookOpen, Laptop, Building2, Loader2 } from 'lucide-react';
import { getAllTemplates, TemplateDefinition } from '@/lib/templates';

// Category icons for template categories
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  financial: Building2,
  editorial: Newspaper,
  tech: Laptop,
  minimal: BookOpen,
  news: Grid,
  magazine: List,
};

// Color presets that can override template colors
const colorPresets = [
  { id: 'default', name: 'Template Default', primary: null },
  { id: 'pink', name: 'Pink', primary: '#e91e8c' },
  { id: 'blue', name: 'Blue', primary: '#2563eb' },
  { id: 'red', name: 'Red', primary: '#dc2626' },
  { id: 'green', name: 'Green', primary: '#16a34a' },
  { id: 'purple', name: 'Purple', primary: '#9333ea' },
  { id: 'orange', name: 'Orange', primary: '#ea580c' },
  { id: 'teal', name: 'Teal', primary: '#14b8a6' },
];

export function TemplateManager() {
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('guardian');
  const [selectedColor, setSelectedColor] = useState('default');
  const [colorMode, setColorMode] = useState<'light' | 'dark' | 'system'>('light');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  useEffect(() => {
    // Load all templates
    const allTemplates = getAllTemplates();
    setTemplates(allTemplates);
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const settings = data.settings || data;
        if (settings.template?.templateId) setSelectedTemplate(settings.template.templateId);
        if (settings.template?.colorPreset) setSelectedColor(settings.template.colorPreset);
        if (settings.template?.colorMode) setColorMode(settings.template.colorMode);
      }
    } catch (error) {
      console.error('Error loading template settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const colorPreset = colorPresets.find(c => c.id === selectedColor);
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: {
            templateId: selectedTemplate,
            colorPreset: selectedColor,
            colorMode,
            customPrimary: colorPreset?.primary || null,
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

  const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);
  const selectedColorObj = colorPresets.find(c => c.id === selectedColor);
  
  // Get unique categories
  const categories = [...new Set(templates.map(t => t.category))];
  
  // Filter templates
  const filteredTemplates = filterCategory 
    ? templates.filter(t => t.category === filterCategory)
    : templates;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

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
            <p className="text-sm text-gray-500">Choose from {templates.length} professional templates</p>
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

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory(null)}
          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
            !filterCategory 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Templates
        </button>
        {categories.map(cat => {
          const Icon = CATEGORY_ICONS[cat] || Sparkles;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                filterCategory === cat 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          {filterCategory ? `${filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1)} Templates` : 'All Templates'} 
          <span className="text-gray-400 font-normal">({filteredTemplates.length})</span>
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => {
            const CategoryIcon = CATEGORY_ICONS[template.category] || Sparkles;
            const isDark = template.features.darkMode;
            
            return (
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
                
                {/* Template Preview */}
                <div 
                  className="aspect-[4/3] rounded-lg mb-3 p-2 overflow-hidden relative"
                  style={{ 
                    backgroundColor: template.colors.light.background,
                    border: `1px solid ${template.colors.light.border}`,
                  }}
                >
                  {/* Mini header */}
                  <div 
                    className="h-3 rounded-sm mb-1.5 flex items-center px-1"
                    style={{ backgroundColor: template.colors.light.surface }}
                  >
                    <div 
                      className="w-6 h-1.5 rounded"
                      style={{ backgroundColor: template.colors.light.primary }}
                    />
                  </div>
                  
                  {/* Layout preview based on homepage type */}
                  {template.layout.homepage === 'magazine' && (
                    <div className="flex gap-1 h-[calc(100%-1rem)]">
                      <div className="w-1/4 space-y-1">
                        <div className="h-4 rounded" style={{ backgroundColor: template.colors.light.surfaceAlt }} />
                        <div className="h-4 rounded" style={{ backgroundColor: template.colors.light.surfaceAlt }} />
                      </div>
                      <div className="flex-1 rounded" style={{ backgroundColor: template.colors.light.primary + '30' }} />
                    </div>
                  )}
                  {template.layout.homepage === 'grid' && (
                    <div className="grid grid-cols-3 gap-1 h-[calc(100%-1rem)]">
                      {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="rounded" style={{ backgroundColor: template.colors.light.surfaceAlt }} />
                      ))}
                    </div>
                  )}
                  {template.layout.homepage === 'editorial' && (
                    <div className="space-y-1 h-[calc(100%-1rem)]">
                      <div className="h-1/2 rounded flex gap-1">
                        <div className="flex-1 rounded" style={{ backgroundColor: template.colors.light.surfaceAlt }} />
                        <div className="w-1/3 space-y-1">
                          <div className="h-1/2 rounded" style={{ backgroundColor: template.colors.light.border }} />
                          <div className="h-1/2 rounded" style={{ backgroundColor: template.colors.light.border }} />
                        </div>
                      </div>
                      <div className="h-1/2 grid grid-cols-3 gap-1">
                        {[1,2,3].map(i => (
                          <div key={i} className="rounded" style={{ backgroundColor: template.colors.light.surfaceAlt }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {template.layout.homepage === 'minimal' && (
                    <div className="flex flex-col items-center justify-center h-[calc(100%-1rem)] space-y-1">
                      <div className="w-3/4 h-2 rounded" style={{ backgroundColor: template.colors.light.text + '40' }} />
                      <div className="w-1/2 h-1.5 rounded" style={{ backgroundColor: template.colors.light.textMuted }} />
                      <div className="w-full h-8 rounded mt-2" style={{ backgroundColor: template.colors.light.surfaceAlt }} />
                    </div>
                  )}
                  {template.layout.homepage === 'cards' && (
                    <div className="grid grid-cols-2 gap-1 h-[calc(100%-1rem)]">
                      {[1,2,3,4].map(i => (
                        <div 
                          key={i} 
                          className="rounded relative overflow-hidden"
                          style={{ backgroundColor: template.colors.light.surfaceAlt }}
                        >
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-1/2"
                            style={{ 
                              background: `linear-gradient(transparent, ${template.colors.light.surface})` 
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {template.layout.homepage === 'masonry' && (
                    <div className="flex gap-1 h-[calc(100%-1rem)]">
                      <div className="flex-1 space-y-1">
                        <div className="h-2/3 rounded" style={{ backgroundColor: template.colors.light.surfaceAlt }} />
                        <div className="h-1/3 rounded" style={{ backgroundColor: template.colors.light.surfaceAlt }} />
                      </div>
                      <div className="flex-1 space-y-1 mt-2">
                        <div className="h-1/2 rounded" style={{ backgroundColor: template.colors.light.surfaceAlt }} />
                        <div className="h-1/2 rounded" style={{ backgroundColor: template.colors.light.surfaceAlt }} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="h-1/3 rounded" style={{ backgroundColor: template.colors.light.surfaceAlt }} />
                        <div className="h-2/3 rounded" style={{ backgroundColor: template.colors.light.surfaceAlt }} />
                      </div>
                    </div>
                  )}
                  
                  {/* Dark mode indicator */}
                  {isDark && (
                    <div className="absolute top-1 left-1">
                      <Moon className="h-3 w-3 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{template.name}</h4>
                  <span 
                    className="text-[10px] px-1.5 py-0.5 rounded capitalize"
                    style={{ 
                      backgroundColor: template.colors.light.primary + '20',
                      color: template.colors.light.primary,
                    }}
                  >
                    {template.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                
                {/* Feature tags */}
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">
                    {template.layout.header}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">
                    {template.layout.homepage}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Mode */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          {colorMode === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          Color Mode
        </h3>
        <div className="flex gap-3">
          {(['light', 'dark', 'system'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setColorMode(mode)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                colorMode === mode
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {mode === 'light' && <Sun className="h-4 w-4" />}
              {mode === 'dark' && <Moon className="h-4 w-4" />}
              {mode === 'system' && <Laptop className="h-4 w-4" />}
              <span className="text-sm font-medium text-gray-700 capitalize">{mode}</span>
              {colorMode === mode && <Check className="h-4 w-4 text-gray-900" />}
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color Override */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Accent Color Override
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Override the template&apos;s default accent color, or keep the original design.
        </p>
        <div className="flex flex-wrap gap-3">
          {colorPresets.map((color) => (
            <button
              key={color.id}
              onClick={() => setSelectedColor(color.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                selectedColor === color.id
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {color.primary ? (
                <div 
                  className="w-5 h-5 rounded-full shadow-inner"
                  style={{ backgroundColor: color.primary }}
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
              )}
              <span className="text-sm font-medium text-gray-700">{color.name}</span>
              {selectedColor === color.id && (
                <Check className="h-4 w-4 text-gray-900" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Template Preview */}
      {selectedTemplateObj && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Template Preview: {selectedTemplateObj.name}
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
                  {selectedTemplateObj.name} - {selectedTemplateObj.layout.homepage} layout
                </span>
              </div>
            </div>
            
            <div 
              className="min-h-[400px] p-6"
              style={{ 
                backgroundColor: colorMode === 'dark' 
                  ? selectedTemplateObj.colors.dark.background 
                  : selectedTemplateObj.colors.light.background 
              }}
            >
              {/* Header Preview */}
              <div 
                className="rounded-lg p-3 mb-4 flex items-center justify-between"
                style={{ 
                  backgroundColor: colorMode === 'dark'
                    ? selectedTemplateObj.colors.dark.surface
                    : selectedTemplateObj.colors.light.surface,
                  borderBottom: `1px solid ${colorMode === 'dark' ? selectedTemplateObj.colors.dark.border : selectedTemplateObj.colors.light.border}`,
                }}
              >
                <div 
                  className="font-bold text-lg"
                  style={{ 
                    fontFamily: selectedTemplateObj.typography.headingFont,
                    color: selectedColorObj?.primary || (colorMode === 'dark' 
                      ? selectedTemplateObj.colors.dark.primary 
                      : selectedTemplateObj.colors.light.primary),
                  }}
                >
                  Brand
                </div>
                <div className="flex gap-4">
                  {['News', 'Tech', 'Finance', 'Sports'].map(cat => (
                    <span 
                      key={cat}
                      className="text-sm"
                      style={{ 
                        fontFamily: selectedTemplateObj.typography.bodyFont,
                        color: colorMode === 'dark' 
                          ? selectedTemplateObj.colors.dark.text 
                          : selectedTemplateObj.colors.light.text,
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content Preview based on layout */}
              <div className="space-y-4">
                {/* Featured Article */}
                <div 
                  className="rounded-lg overflow-hidden"
                  style={{ 
                    backgroundColor: colorMode === 'dark'
                      ? selectedTemplateObj.colors.dark.surface
                      : selectedTemplateObj.colors.light.surface,
                    borderRadius: selectedTemplateObj.features.roundedCorners === 'none' ? '0' : 
                                  selectedTemplateObj.features.roundedCorners === 'lg' ? '0.75rem' : '0.5rem',
                  }}
                >
                  <div 
                    className="aspect-video relative"
                    style={{ 
                      backgroundColor: colorMode === 'dark'
                        ? selectedTemplateObj.colors.dark.surfaceAlt
                        : selectedTemplateObj.colors.light.surfaceAlt,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span 
                        className="inline-block px-2 py-1 text-xs font-bold text-white rounded mb-2"
                        style={{ 
                          backgroundColor: selectedColorObj?.primary || (colorMode === 'dark' 
                            ? selectedTemplateObj.colors.dark.accent 
                            : selectedTemplateObj.colors.light.accent),
                        }}
                      >
                        FEATURED
                      </span>
                      <h2 
                        className="text-xl font-bold text-white"
                        style={{ fontFamily: selectedTemplateObj.typography.headingFont }}
                      >
                        Breaking News: Major Development in Tech Industry
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Article Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div 
                      key={i}
                      className="overflow-hidden"
                      style={{ 
                        backgroundColor: colorMode === 'dark'
                          ? selectedTemplateObj.colors.dark.surface
                          : selectedTemplateObj.colors.light.surface,
                        borderRadius: selectedTemplateObj.features.roundedCorners === 'none' ? '0' : 
                                      selectedTemplateObj.features.roundedCorners === 'lg' ? '0.75rem' : '0.5rem',
                        boxShadow: selectedTemplateObj.features.shadows === 'none' ? 'none' :
                                   selectedTemplateObj.features.shadows === 'subtle' ? '0 1px 3px rgba(0,0,0,0.08)' :
                                   '0 4px 6px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div 
                        className="aspect-video"
                        style={{ 
                          backgroundColor: colorMode === 'dark'
                            ? selectedTemplateObj.colors.dark.surfaceAlt
                            : selectedTemplateObj.colors.light.surfaceAlt,
                        }}
                      />
                      <div className="p-3">
                        <span 
                          className="text-xs font-semibold uppercase"
                          style={{ 
                            color: selectedColorObj?.primary || (colorMode === 'dark' 
                              ? selectedTemplateObj.colors.dark.accent 
                              : selectedTemplateObj.colors.light.accent),
                          }}
                        >
                          {['Tech', 'Finance', 'Sports'][i - 1]}
                        </span>
                        <h3 
                          className="font-semibold mt-1 line-clamp-2"
                          style={{ 
                            fontFamily: selectedTemplateObj.typography.headingFont,
                            color: colorMode === 'dark' 
                              ? selectedTemplateObj.colors.dark.text 
                              : selectedTemplateObj.colors.light.text,
                          }}
                        >
                          Article Title Goes Here
                        </h3>
                        <p 
                          className="text-sm mt-1 line-clamp-2"
                          style={{ 
                            fontFamily: selectedTemplateObj.typography.bodyFont,
                            color: colorMode === 'dark' 
                              ? selectedTemplateObj.colors.dark.textMuted 
                              : selectedTemplateObj.colors.light.textMuted,
                          }}
                        >
                          Article excerpt text preview...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Selection Info */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Currently selected:</strong> {selectedTemplateObj?.name} template 
          {selectedColor !== 'default' && ` with ${selectedColorObj?.name} accent override`}
          {colorMode !== 'light' && ` in ${colorMode} mode`}.
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Template features: {selectedTemplateObj?.layout.header} header, {selectedTemplateObj?.layout.homepage} homepage, 
          {selectedTemplateObj?.layout.articleCard} cards
        </p>
      </div>
    </div>
  );
}
