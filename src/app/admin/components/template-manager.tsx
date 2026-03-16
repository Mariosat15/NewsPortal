'use client';

import { useState, useEffect } from 'react';
import { Layout, Check, Moon, Sun, Eye, Palette, Sparkles, Grid, List, Newspaper, BookOpen, Laptop, Building2, Loader2, Monitor, Zap, Layers, Type, RectangleHorizontal, ChevronRight, Star, ArrowRight } from 'lucide-react';
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

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  financial: 'Data-driven layouts for business & markets',
  editorial: 'Traditional journalism-focused designs',
  tech: 'Modern layouts for technology coverage',
  minimal: 'Clean, distraction-free reading',
  news: 'Breaking news with dense content',
  magazine: 'Visual-first immersive experiences',
};

// Color presets that can override template colors
const colorPresets = [
  { id: 'default', name: 'Template Default', primary: null, preview: 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500' },
  { id: 'pink', name: 'Pink', primary: '#e91e8c', preview: 'bg-pink-500' },
  { id: 'blue', name: 'Blue', primary: '#2563eb', preview: 'bg-blue-600' },
  { id: 'red', name: 'Red', primary: '#dc2626', preview: 'bg-red-600' },
  { id: 'green', name: 'Green', primary: '#16a34a', preview: 'bg-green-600' },
  { id: 'purple', name: 'Purple', primary: '#9333ea', preview: 'bg-purple-600' },
  { id: 'orange', name: 'Orange', primary: '#ea580c', preview: 'bg-orange-600' },
  { id: 'teal', name: 'Teal', primary: '#14b8a6', preview: 'bg-teal-500' },
  { id: 'indigo', name: 'Indigo', primary: '#4f46e5', preview: 'bg-indigo-600' },
  { id: 'amber', name: 'Amber', primary: '#d97706', preview: 'bg-amber-600' },
];

function FeatureBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
      enabled 
        ? 'bg-green-50 text-green-700 border border-green-200' 
        : 'bg-gray-50 text-gray-400 border border-gray-200'
    }`}>
      {enabled ? <Check className="h-2.5 w-2.5" /> : null}
      {label}
    </span>
  );
}

function LayoutMiniPreview({ template, colorMode }: { template: TemplateDefinition; colorMode: 'light' | 'dark' }) {
  const colors = colorMode === 'dark' ? template.colors.dark : template.colors.light;
  
  return (
    <div 
      className="aspect-[16/10] rounded-lg overflow-hidden relative"
      style={{ 
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Mini header */}
      <div 
        className="h-[12%] flex items-center px-[8%] gap-[4%]"
        style={{ 
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div 
          className="w-[15%] h-[40%] rounded-sm"
          style={{ backgroundColor: colors.primary }}
        />
        <div className="flex-1" />
        <div className="flex gap-[3%]">
          {[1,2,3].map(i => (
            <div 
              key={i}
              className="w-[12%] h-[30%] rounded-sm"
              style={{ backgroundColor: colors.textMuted + '40' }}
            />
          ))}
        </div>
      </div>
      
      {/* Layout preview based on homepage type */}
      <div className="p-[4%] h-[88%]">
        {template.layout.homepage === 'magazine' && (
          <div className="flex gap-[3%] h-full">
            <div className="w-[60%] space-y-[3%] h-full">
              <div className="h-[65%] rounded-sm relative overflow-hidden" style={{ backgroundColor: colors.surfaceAlt }}>
                <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ background: `linear-gradient(transparent, ${colors.surface}90)` }} />
                <div className="absolute bottom-[8%] left-[5%] w-[60%] h-[8%] rounded-sm" style={{ backgroundColor: colors.text + '60' }} />
              </div>
              <div className="flex gap-[3%] h-[32%]">
                {[1,2].map(i => (
                  <div key={i} className="flex-1 rounded-sm" style={{ backgroundColor: colors.surfaceAlt }} />
                ))}
              </div>
            </div>
            <div className="w-[40%] space-y-[3%] h-full">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-[23%] flex gap-[5%] items-center rounded-sm p-[3%]" style={{ backgroundColor: colors.surface }}>
                  <div className="w-[35%] h-full rounded-sm" style={{ backgroundColor: colors.surfaceAlt }} />
                  <div className="flex-1 space-y-[8%]">
                    <div className="w-[80%] h-[15%] rounded-sm" style={{ backgroundColor: colors.text + '30' }} />
                    <div className="w-[50%] h-[10%] rounded-sm" style={{ backgroundColor: colors.textMuted + '30' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {template.layout.homepage === 'grid' && (
          <div className="grid grid-cols-3 gap-[3%] h-full">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-sm overflow-hidden" style={{ backgroundColor: colors.surface }}>
                <div className="h-[55%]" style={{ backgroundColor: colors.surfaceAlt }} />
                <div className="p-[6%] space-y-[6%]">
                  <div className="w-[30%] h-[8%] rounded-sm" style={{ backgroundColor: colors.accent + '40' }} />
                  <div className="w-[80%] h-[8%] rounded-sm" style={{ backgroundColor: colors.text + '30' }} />
                  <div className="w-[60%] h-[6%] rounded-sm" style={{ backgroundColor: colors.textMuted + '20' }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {template.layout.homepage === 'editorial' && (
          <div className="space-y-[3%] h-full">
            <div className="h-[55%] flex gap-[3%]">
              <div className="flex-1 rounded-sm relative overflow-hidden" style={{ backgroundColor: colors.surfaceAlt }}>
                <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{ background: `linear-gradient(transparent, ${colors.surface}90)` }} />
              </div>
              <div className="w-[35%] space-y-[3%]">
                <div className="h-[48%] rounded-sm" style={{ backgroundColor: colors.surfaceAlt }} />
                <div className="h-[48%] rounded-sm" style={{ backgroundColor: colors.surfaceAlt }} />
              </div>
            </div>
            <div className="h-[42%] grid grid-cols-4 gap-[2%]">
              {[1,2,3,4].map(i => (
                <div key={i} className="rounded-sm overflow-hidden" style={{ backgroundColor: colors.surface }}>
                  <div className="h-[50%]" style={{ backgroundColor: colors.surfaceAlt }} />
                  <div className="p-[5%]">
                    <div className="w-[70%] h-[10%] rounded-sm" style={{ backgroundColor: colors.text + '25' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {template.layout.homepage === 'minimal' && (
          <div className="flex flex-col items-center justify-center h-full space-y-[4%] px-[15%]">
            <div className="w-full h-[6%] rounded-sm" style={{ backgroundColor: colors.text + '15' }} />
            <div className="w-[70%] h-[4%] rounded-sm" style={{ backgroundColor: colors.textMuted + '20' }} />
            <div className="w-full mt-[5%] space-y-[5%]">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-[4%] items-center" style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: '4%' }}>
                  <div className="flex-1 space-y-[6%]">
                    <div className="w-[60%] h-[10%] rounded-sm" style={{ backgroundColor: colors.text + '30' }} />
                    <div className="w-[90%] h-[6%] rounded-sm" style={{ backgroundColor: colors.textMuted + '20' }} />
                  </div>
                  <div className="w-[25%] h-full rounded-sm" style={{ backgroundColor: colors.surfaceAlt }} />
                </div>
              ))}
            </div>
          </div>
        )}
        {template.layout.homepage === 'cards' && (
          <div className="grid grid-cols-2 gap-[3%] h-full">
            {[1,2,3,4].map(i => (
              <div 
                key={i} 
                className="rounded-md relative overflow-hidden"
                style={{ 
                  backgroundColor: colors.surfaceAlt,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-[8%] left-[6%] right-[6%] space-y-[4%]">
                  <div className="w-[25%] h-[8%] rounded-sm" style={{ backgroundColor: colors.accent }} />
                  <div className="w-[70%] h-[8%] rounded-sm bg-white/60" />
                </div>
              </div>
            ))}
          </div>
        )}
        {template.layout.homepage === 'masonry' && (
          <div className="flex gap-[2%] h-full">
            <div className="flex-1 flex flex-col gap-[2%]">
              <div className="h-[62%] rounded-sm relative overflow-hidden" style={{ backgroundColor: colors.surfaceAlt }}>
                <div className="absolute bottom-[5%] left-[5%] w-[70%] h-[10%] rounded-sm bg-white/40" />
              </div>
              <div className="flex-1 rounded-sm" style={{ backgroundColor: colors.surfaceAlt }} />
            </div>
            <div className="flex-1 flex flex-col gap-[2%] mt-[8%]">
              <div className="h-[45%] rounded-sm" style={{ backgroundColor: colors.surfaceAlt }} />
              <div className="flex-1 rounded-sm" style={{ backgroundColor: colors.surfaceAlt }} />
            </div>
            <div className="flex-1 flex flex-col gap-[2%]">
              <div className="h-[35%] rounded-sm" style={{ backgroundColor: colors.surfaceAlt }} />
              <div className="flex-1 rounded-sm relative overflow-hidden" style={{ backgroundColor: colors.surfaceAlt }}>
                <div className="absolute bottom-[5%] left-[5%] w-[60%] h-[8%] rounded-sm bg-white/40" />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Dark mode indicator */}
      {template.features.darkMode && (
        <div className="absolute top-1 left-1 bg-black/30 rounded-full p-0.5">
          <Moon className="h-2.5 w-2.5 text-white/70" />
        </div>
      )}
    </div>
  );
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('guardian');
  const [selectedColor, setSelectedColor] = useState('default');
  const [colorMode, setColorMode] = useState<'light' | 'dark' | 'system'>('light');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');

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
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
            <Palette className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Template Studio</h2>
            <p className="text-sm text-gray-500">{templates.length} professional templates — choose the perfect look for your publication</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 font-medium text-sm shadow-md hover:shadow-lg"
        >
          {saving ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>
          ) : (
            <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Save Changes</span>
          )}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <Check className="h-5 w-5" /> : <span className="text-red-500 text-lg">!</span>}
          {message.text}
        </div>
      )}

      {/* Category Filter — pill navigation */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Filter by Style</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              !filterCategory 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Templates ({templates.length})
          </button>
          {categories.map(cat => {
            const Icon = CATEGORY_ICONS[cat] || Sparkles;
            const count = templates.filter(t => t.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  filterCategory === cat 
                    ? 'bg-gray-900 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                title={CATEGORY_DESCRIPTIONS[cat]}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.charAt(0).toUpperCase() + cat.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            {filterCategory ? `${filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1)} Templates` : 'All Templates'} 
            <span className="text-gray-400 font-normal">({filteredTemplates.length})</span>
          </h3>
          {/* Mini preview mode toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setPreviewMode('light')}
              className={`p-1.5 rounded-md transition-all ${previewMode === 'light' ? 'bg-white shadow-sm' : ''}`}
              title="Light mode preview"
            >
              <Sun className="h-3.5 w-3.5 text-gray-600" />
            </button>
            <button
              onClick={() => setPreviewMode('dark')}
              className={`p-1.5 rounded-md transition-all ${previewMode === 'dark' ? 'bg-gray-800 shadow-sm' : ''}`}
              title="Dark mode preview"
            >
              <Moon className={`h-3.5 w-3.5 ${previewMode === 'dark' ? 'text-white' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((template) => {
            const isSelected = selectedTemplate === template.id;
            
            return (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`group relative text-left transition-all rounded-xl border-2 overflow-hidden ${
                  isSelected
                    ? 'border-purple-500 ring-2 ring-purple-200 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Selection badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 z-10 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                
                {/* Template Preview */}
                <div className="p-3 bg-gray-50 group-hover:bg-gray-100 transition-colors">
                  <LayoutMiniPreview template={template} colorMode={previewMode} />
                </div>
                
                {/* Template Info */}
                <div className="p-4 bg-white">
                  <div className="flex items-start justify-between mb-1.5">
                    <h4 className="font-bold text-gray-900 text-sm">{template.name}</h4>
                    <span 
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                      style={{ 
                        backgroundColor: template.colors.light.accent + '15',
                        color: template.colors.light.accent,
                      }}
                    >
                      {template.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{template.description}</p>
                  
                  {/* Key feature badges */}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md font-medium capitalize">
                      {template.layout.header} header
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-md font-medium capitalize">
                      {template.layout.homepage} layout
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded-md font-medium capitalize">
                      {template.layout.articleCard} cards
                    </span>
                  </div>
                  
                  {/* Color swatch */}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 mr-1">Colors:</span>
                    {[template.colors.light.primary, template.colors.light.accent, template.colors.light.secondary].map((color, i) => (
                      <div 
                        key={i}
                        className="w-4 h-4 rounded-full border border-gray-200 shadow-inner"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    <span className="text-[10px] text-gray-400 ml-auto font-mono">
                      {template.typography.headingFont.split(',')[0].replace('var(--font-', '').replace(')', '')}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configuration Section (Color Mode + Accent) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Color Mode */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-gray-500" />
            Color Mode
          </h3>
          <div className="flex gap-3">
            {([
              { mode: 'light' as const, icon: Sun, label: 'Light', desc: 'Bright background' },
              { mode: 'dark' as const, icon: Moon, label: 'Dark', desc: 'Dark background' },
              { mode: 'system' as const, icon: Monitor, label: 'System', desc: 'Auto-detect' },
            ]).map(({ mode, icon: Icon, label, desc }) => (
              <button
                key={mode}
                onClick={() => setColorMode(mode)}
                className={`flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 transition-all ${
                  colorMode === mode
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <Icon className={`h-5 w-5 ${colorMode === mode ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${colorMode === mode ? 'text-purple-700' : 'text-gray-700'}`}>{label}</span>
                <span className="text-[10px] text-gray-400">{desc}</span>
                {colorMode === mode && <Check className="h-3.5 w-3.5 text-purple-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color Override */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
            <Palette className="h-4 w-4 text-gray-500" />
            Accent Color Override
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Override the template&apos;s default accent, or keep the original.
          </p>
          <div className="grid grid-cols-5 gap-2">
            {colorPresets.map((color) => (
              <button
                key={color.id}
                onClick={() => setSelectedColor(color.id)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                  selectedColor === color.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
                title={color.name}
              >
                {color.primary ? (
                  <div 
                    className="w-7 h-7 rounded-full shadow-inner ring-1 ring-black/5"
                    style={{ backgroundColor: color.primary }}
                  />
                ) : (
                  <div className={`w-7 h-7 rounded-full ${color.preview} ring-1 ring-black/5`} />
                )}
                <span className="text-[9px] text-gray-500 font-medium truncate max-w-full">{color.name}</span>
                {selectedColor === color.id && (
                  <Check className="h-3 w-3 text-purple-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Template Full Preview */}
      {selectedTemplateObj && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-500" />
              Live Preview: {selectedTemplateObj.name}
            </h3>
            <div className="flex items-center gap-3">
              {/* Feature badges */}
              <div className="flex gap-1.5">
                <FeatureBadge label="Dark Mode" enabled={selectedTemplateObj.features.darkMode} />
                <FeatureBadge label="Animations" enabled={selectedTemplateObj.features.animations} />
                <FeatureBadge label="Sticky Header" enabled={selectedTemplateObj.features.stickyHeader} />
                <FeatureBadge label="Reading Time" enabled={selectedTemplateObj.features.showReadingTime} />
                <FeatureBadge label="Author" enabled={selectedTemplateObj.features.showAuthor} />
              </div>
            </div>
          </div>
          
          {/* Browser chrome */}
          <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex-1 bg-gray-700 rounded-md h-6 flex items-center px-3 ml-3">
              <span className="text-xs text-gray-400 font-mono">
                https://yoursite.com — {selectedTemplateObj.name} ({selectedTemplateObj.layout.homepage} layout)
              </span>
            </div>
          </div>
          
          {/* Preview content */}
          <div 
            className="min-h-[450px] p-8"
            style={{ 
              backgroundColor: colorMode === 'dark' 
                ? selectedTemplateObj.colors.dark.background 
                : selectedTemplateObj.colors.light.background 
            }}
          >
            {/* Header Preview */}
            <div 
              className="rounded-lg p-4 mb-6 flex items-center justify-between"
              style={{ 
                backgroundColor: colorMode === 'dark'
                  ? selectedTemplateObj.colors.dark.surface
                  : selectedTemplateObj.colors.light.surface,
                borderBottom: `2px solid ${colorMode === 'dark' ? selectedTemplateObj.colors.dark.border : selectedTemplateObj.colors.light.border}`,
                boxShadow: selectedTemplateObj.features.shadows !== 'none' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <div 
                className="font-bold text-xl tracking-tight"
                style={{ 
                  fontFamily: selectedTemplateObj.typography.headingFont,
                  color: selectedColorObj?.primary || (colorMode === 'dark' 
                    ? selectedTemplateObj.colors.dark.primary 
                    : selectedTemplateObj.colors.light.primary),
                }}
              >
                YourBrand
              </div>
              <div className="flex gap-6">
                {['News', 'Technology', 'Finance', 'Culture'].map(cat => (
                  <span 
                    key={cat}
                    className="text-sm font-medium"
                    style={{ 
                      fontFamily: selectedTemplateObj.typography.bodyFont,
                      color: colorMode === 'dark' 
                        ? selectedTemplateObj.colors.dark.textMuted 
                        : selectedTemplateObj.colors.light.textMuted,
                    }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Content Preview */}
            <div className="space-y-6">
              {/* Featured Article */}
              <div 
                className="overflow-hidden"
                style={{ 
                  backgroundColor: colorMode === 'dark'
                    ? selectedTemplateObj.colors.dark.surface
                    : selectedTemplateObj.colors.light.surface,
                  borderRadius: selectedTemplateObj.features.roundedCorners === 'none' ? '0' : 
                                selectedTemplateObj.features.roundedCorners === 'lg' ? '1rem' : 
                                selectedTemplateObj.features.roundedCorners === 'md' ? '0.5rem' : '0.25rem',
                  boxShadow: selectedTemplateObj.features.shadows === 'none' ? 'none' :
                             selectedTemplateObj.features.shadows === 'subtle' ? '0 1px 3px rgba(0,0,0,0.08)' :
                             selectedTemplateObj.features.shadows === 'medium' ? '0 4px 6px rgba(0,0,0,0.1)' :
                             '0 8px 16px rgba(0,0,0,0.15)',
                }}
              >
                <div 
                  className="aspect-[21/9] relative"
                  style={{ 
                    background: `linear-gradient(135deg, ${colorMode === 'dark' ? selectedTemplateObj.colors.dark.surfaceAlt : selectedTemplateObj.colors.light.surfaceAlt}, ${colorMode === 'dark' ? selectedTemplateObj.colors.dark.surface : selectedTemplateObj.colors.light.surface})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span 
                      className="inline-block px-3 py-1 text-xs font-bold text-white rounded-md mb-3"
                      style={{ 
                        backgroundColor: selectedColorObj?.primary || (colorMode === 'dark' 
                          ? selectedTemplateObj.colors.dark.accent 
                          : selectedTemplateObj.colors.light.accent),
                      }}
                    >
                      BREAKING
                    </span>
                    <h2 
                      className="text-2xl font-bold text-white leading-tight"
                      style={{ fontFamily: selectedTemplateObj.typography.headingFont }}
                    >
                      Major Development Reshapes Industry Landscape
                    </h2>
                    <p className="text-white/70 text-sm mt-2" style={{ fontFamily: selectedTemplateObj.typography.bodyFont }}>
                      An in-depth analysis of how recent changes are transforming the market
                    </p>
                  </div>
                </div>
              </div>

              {/* Article Grid */}
              <div className="grid grid-cols-3 gap-5">
                {[
                  { cat: 'Technology', title: 'AI Revolution: What It Means for Your Business' },
                  { cat: 'Finance', title: 'Markets Rally on Strong Q4 Earnings Reports' },
                  { cat: 'Culture', title: 'The Rise of Digital Art in Contemporary Galleries' },
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="overflow-hidden"
                    style={{ 
                      backgroundColor: colorMode === 'dark'
                        ? selectedTemplateObj.colors.dark.surface
                        : selectedTemplateObj.colors.light.surface,
                      borderRadius: selectedTemplateObj.features.roundedCorners === 'none' ? '0' : 
                                    selectedTemplateObj.features.roundedCorners === 'lg' ? '1rem' : 
                                    selectedTemplateObj.features.roundedCorners === 'md' ? '0.5rem' : '0.25rem',
                      boxShadow: selectedTemplateObj.features.shadows === 'none' ? 'none' :
                                 selectedTemplateObj.features.shadows === 'subtle' ? '0 1px 3px rgba(0,0,0,0.08)' :
                                 selectedTemplateObj.features.shadows === 'medium' ? '0 4px 6px rgba(0,0,0,0.1)' :
                                 '0 8px 16px rgba(0,0,0,0.15)',
                    }}
                  >
                    <div 
                      className="aspect-video"
                      style={{ 
                        background: `linear-gradient(135deg, ${colorMode === 'dark' ? selectedTemplateObj.colors.dark.surfaceAlt : selectedTemplateObj.colors.light.surfaceAlt}80, ${colorMode === 'dark' ? selectedTemplateObj.colors.dark.border : selectedTemplateObj.colors.light.border}40)`,
                      }}
                    />
                    <div className="p-4">
                      <span 
                        className="text-xs font-bold uppercase tracking-wide"
                        style={{ 
                          color: selectedColorObj?.primary || (colorMode === 'dark' 
                            ? selectedTemplateObj.colors.dark.accent 
                            : selectedTemplateObj.colors.light.accent),
                        }}
                      >
                        {item.cat}
                      </span>
                      <h3 
                        className="font-semibold mt-1.5 leading-snug"
                        style={{ 
                          fontFamily: selectedTemplateObj.typography.headingFont,
                          color: colorMode === 'dark' 
                            ? selectedTemplateObj.colors.dark.text 
                            : selectedTemplateObj.colors.light.text,
                        }}
                      >
                        {item.title}
                      </h3>
                      <p 
                        className="text-sm mt-2 leading-relaxed line-clamp-2"
                        style={{ 
                          fontFamily: selectedTemplateObj.typography.bodyFont,
                          color: colorMode === 'dark' 
                            ? selectedTemplateObj.colors.dark.textMuted 
                            : selectedTemplateObj.colors.light.textMuted,
                        }}
                      >
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.
                      </p>
                      {selectedTemplateObj.features.showReadingTime && (
                        <span 
                          className="text-xs mt-2 block"
                          style={{ color: colorMode === 'dark' ? selectedTemplateObj.colors.dark.textMuted : selectedTemplateObj.colors.light.textMuted }}
                        >
                          4 min read
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Selection Summary */}
      <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
        <div className="flex items-center gap-3 mb-2">
          <Star className="h-5 w-5 text-purple-600" />
          <span className="font-semibold text-purple-800">Current Configuration</span>
        </div>
        <p className="text-sm text-purple-700">
          <strong>{selectedTemplateObj?.name}</strong> template 
          {selectedColor !== 'default' && <> with <strong>{selectedColorObj?.name}</strong> accent override</>}
          {colorMode !== 'light' && <> in <strong>{colorMode}</strong> mode</>}.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs px-2.5 py-1 bg-white/70 rounded-full text-purple-600 font-medium">
            <Layers className="h-3 w-3 inline mr-1" />
            {selectedTemplateObj?.layout.homepage} layout
          </span>
          <span className="text-xs px-2.5 py-1 bg-white/70 rounded-full text-purple-600 font-medium">
            <RectangleHorizontal className="h-3 w-3 inline mr-1" />
            {selectedTemplateObj?.layout.header} header
          </span>
          <span className="text-xs px-2.5 py-1 bg-white/70 rounded-full text-purple-600 font-medium">
            <Type className="h-3 w-3 inline mr-1" />
            {selectedTemplateObj?.typography.headingFont.split(',')[0].replace('var(--font-', '').replace(')', '')}
          </span>
          <span className="text-xs px-2.5 py-1 bg-white/70 rounded-full text-purple-600 font-medium">
            <Zap className="h-3 w-3 inline mr-1" />
            {selectedTemplateObj?.layout.articleCard} cards
          </span>
        </div>
      </div>
    </div>
  );
}
