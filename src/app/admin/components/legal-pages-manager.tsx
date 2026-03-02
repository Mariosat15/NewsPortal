'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from './rich-text-editor';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  ArrowLeft,
  GripVertical,
  AlertTriangle,
  Globe,
  FileText,
  ChevronUp,
  ChevronDown,
  Wand2,
  FileCode,
  FileType,
} from 'lucide-react';

interface LegalPage {
  _id: string;
  slug: string;
  title: { de: string; en: string };
  content: { de: string; en: string };
  type: 'legal' | 'disclaimer' | 'info';
  showInFooter: boolean;
  footerOrder: number;
  isActive: boolean;
  isSystem: boolean;
}

interface RiskDisclaimer {
  content: { de: string; en: string };
  isActive: boolean;
}

type ViewMode = 'list' | 'edit' | 'create';
type EditorMode = 'visual' | 'html';

const PAGE_TYPES = [
  { value: 'impressum', label: 'Impressum / Legal Notice', slug: 'impressum', titleDe: 'Impressum', titleEn: 'Legal Notice' },
  { value: 'datenschutz', label: 'Privacy Policy / Datenschutzerklärung', slug: 'datenschutz', titleDe: 'Datenschutzerklärung', titleEn: 'Privacy Policy' },
  { value: 'agb', label: 'Terms & Conditions / AGB', slug: 'agb', titleDe: 'Allgemeine Geschäftsbedingungen', titleEn: 'Terms and Conditions' },
  { value: 'widerrufsbelehrung', label: 'Cancellation Policy / Widerrufsbelehrung', slug: 'widerrufsbelehrung', titleDe: 'Widerrufsbelehrung', titleEn: 'Cancellation Policy' },
  { value: 'hilfe', label: 'Help & FAQ / Hilfe', slug: 'hilfe', titleDe: 'Hilfe & FAQ', titleEn: 'Help & FAQ' },
  { value: 'custom', label: 'Custom Page', slug: '', titleDe: '', titleEn: '' },
];

export function LegalPagesManager() {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingPage, setEditingPage] = useState<LegalPage | null>(null);
  const [activeTab, setActiveTab] = useState<'pages' | 'footer' | 'disclaimer'>('pages');
  const [editorMode, setEditorMode] = useState<EditorMode>('visual');
  
  // Form state
  const [formData, setFormData] = useState<{
    slug: string;
    title: { de: string; en: string };
    content: { de: string; en: string };
    type: 'legal' | 'disclaimer' | 'info';
    showInFooter: boolean;
    isActive: boolean;
  }>({
    slug: '',
    title: { de: '', en: '' },
    content: { de: '', en: '' },
    type: 'legal',
    showInFooter: false,
    isActive: true,
  });
  const [formLang, setFormLang] = useState<'de' | 'en'>('de');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [showTemplateChooser, setShowTemplateChooser] = useState(false);

  // Disclaimer state
  const [disclaimer, setDisclaimer] = useState<RiskDisclaimer>({
    content: { de: '', en: '' },
    isActive: false,
  });
  const [savingDisclaimer, setSavingDisclaimer] = useState(false);

  useEffect(() => {
    fetchPages();
    fetchDisclaimer();
  }, []);

  async function fetchPages() {
    try {
      const res = await fetch('/api/admin/legal-pages');
      const data = await res.json();
      if (data.success) {
        setPages(data.data.pages || []);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDisclaimer() {
    try {
      const res = await fetch('/api/admin/legal-pages/disclaimer');
      const data = await res.json();
      if (data.success && data.data) {
        setDisclaimer(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch disclaimer:', error);
    }
  }

  function startCreate(fromTemplate?: string) {
    if (fromTemplate && fromTemplate !== 'custom') {
      const tpl = PAGE_TYPES.find(t => t.value === fromTemplate);
      if (tpl) {
        setFormData({
          slug: tpl.slug,
          title: { de: tpl.titleDe, en: tpl.titleEn },
          content: { de: '', en: '' },
          type: 'legal',
          showInFooter: true,
          isActive: true,
        });
        setEditingPage(null);
        setViewMode('create');
        setEditorMode('visual');
        setShowTemplateChooser(false);
        // Auto-generate content
        generateContent(fromTemplate);
        return;
      }
    }
    setFormData({
      slug: '',
      title: { de: '', en: '' },
      content: { de: '', en: '' },
      type: 'legal',
      showInFooter: false,
      isActive: true,
    });
    setEditingPage(null);
    setViewMode('create');
    setEditorMode('visual');
    setShowTemplateChooser(false);
  }

  function startEdit(page: LegalPage) {
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content,
      type: page.type,
      showInFooter: page.showInFooter,
      isActive: page.isActive,
    });
    setEditingPage(page);
    setViewMode('edit');
    setEditorMode('visual');
  }

  async function handleSave() {
    if (!formData.slug || !formData.title.de) {
      alert('Please fill in at least the slug and German title');
      return;
    }

    setSaving(true);
    try {
      const url = editingPage 
        ? `/api/admin/legal-pages/${editingPage._id}`
        : '/api/admin/legal-pages';
      const method = editingPage ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        await fetchPages();
        setViewMode('list');
      } else {
        alert(data.error || 'Failed to save page');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save page');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(page: LegalPage) {
    if (page.isSystem) {
      alert('System pages cannot be deleted');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${page.title?.de || page.slug}"?`)) return;

    try {
      const res = await fetch(`/api/admin/legal-pages/${page._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchPages();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }

  async function toggleFooterVisibility(page: LegalPage) {
    try {
      await fetch(`/api/admin/legal-pages/${page._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showInFooter: !page.showInFooter }),
      });
      await fetchPages();
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  }

  async function moveFooterOrder(page: LegalPage, direction: 'up' | 'down') {
    const footerPages = pages.filter(p => p.showInFooter).sort((a, b) => a.footerOrder - b.footerOrder);
    const currentIndex = footerPages.findIndex(p => p._id === page._id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= footerPages.length) return;

    const otherPage = footerPages[newIndex];
    
    try {
      await Promise.all([
        fetch(`/api/admin/legal-pages/${page._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ footerOrder: otherPage.footerOrder }),
        }),
        fetch(`/api/admin/legal-pages/${otherPage._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ footerOrder: page.footerOrder }),
        }),
      ]);
      await fetchPages();
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  }

  async function generateContent(pageType: string) {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/legal-pages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageType,
          language: formLang,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          content: {
            ...prev.content,
            [formLang]: data.data.content,
          },
          title: {
            ...prev.title,
            [formLang]: prev.title[formLang] || data.data.title?.[formLang] || '',
          },
        }));
      } else {
        alert(data.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Failed to generate:', error);
      alert('Failed to generate content');
    } finally {
      setGenerating(false);
    }
  }

  // ── AI Format & Style Button ──
  async function handleAIFormat() {
    const currentContent = formData.content[formLang];
    if (!currentContent || currentContent.trim().length < 10) {
      alert('Please add some content first (at least a few sentences) before using AI formatting.');
      return;
    }

    setFormatting(true);
    try {
      const res = await fetch('/api/admin/legal-pages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'format',
          rawContent: currentContent,
          language: formLang,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          content: {
            ...prev.content,
            [formLang]: data.data.content,
          },
        }));
      } else {
        alert(data.error || 'Failed to format content');
      }
    } catch (error) {
      console.error('Failed to format:', error);
      alert('Failed to format content');
    } finally {
      setFormatting(false);
    }
  }

  async function generateDisclaimer() {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/legal-pages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageType: 'risk_disclaimer',
          language: formLang,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDisclaimer(prev => ({
          ...prev,
          content: {
            ...prev.content,
            [formLang]: data.data.content,
          },
        }));
      } else {
        alert(data.error || 'Failed to generate disclaimer');
      }
    } catch (error) {
      console.error('Failed to generate:', error);
      alert('Failed to generate disclaimer');
    } finally {
      setGenerating(false);
    }
  }

  async function saveDisclaimer() {
    setSavingDisclaimer(true);
    try {
      const res = await fetch('/api/admin/legal-pages/disclaimer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(disclaimer),
      });

      const data = await res.json();
      if (data.success) {
        alert('Disclaimer saved successfully');
      } else {
        alert(data.error || 'Failed to save disclaimer');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save disclaimer');
    } finally {
      setSavingDisclaimer(false);
    }
  }

  // ═══════════════════════════════════════════════
  //  TEMPLATE CHOOSER (when creating a new page)
  // ═══════════════════════════════════════════════
  if (showTemplateChooser) {
    return (
      <div>
        <Button variant="ghost" onClick={() => setShowTemplateChooser(false)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Legal Pages
        </Button>

        <h2 className="text-2xl font-bold mb-2">Create New Legal Page</h2>
        <p className="text-muted-foreground mb-6">Choose how you want to create your page:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Option 1: From Template with AI */}
          <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => {}}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Generate from Template</CardTitle>
                  <CardDescription>AI generates a complete legal page for you</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Select a page type and our AI will generate professional, legally compliant content 
                based on your company information.
              </p>
              <div className="space-y-2">
                {PAGE_TYPES.filter(t => t.value !== 'custom').map((type) => {
                  const existingSlugs = pages.map(p => p.slug);
                  const alreadyExists = existingSlugs.includes(type.slug);
                  return (
                    <button
                      key={type.value}
                      onClick={() => startCreate(type.value)}
                      disabled={alreadyExists}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center justify-between ${
                        alreadyExists
                          ? 'opacity-50 cursor-not-allowed bg-muted'
                          : 'hover:bg-accent hover:border-primary/30'
                      }`}
                    >
                      <div>
                        <span className="font-medium text-sm">{type.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">/{type.slug}</span>
                      </div>
                      {alreadyExists ? (
                        <Badge variant="secondary" className="text-xs">Already exists</Badge>
                      ) : (
                        <Sparkles className="h-4 w-4 text-purple-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Option 2: From Scratch */}
          <Card
            className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => startCreate()}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <FileType className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Create from Scratch</CardTitle>
                  <CardDescription>Write or paste your own content</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Start with a blank page and write your content using our rich text editor. 
                You can also paste text from Word, Google Docs, or any other editor.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <div className="p-1 rounded bg-green-100 dark:bg-green-900/30 mt-0.5">
                    <FileType className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div>
                    <span className="font-medium">Rich Text Editor</span>
                    <p className="text-muted-foreground text-xs">Edit like Word — bold, headings, lists, links</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="p-1 rounded bg-purple-100 dark:bg-purple-900/30 mt-0.5">
                    <Wand2 className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <div>
                    <span className="font-medium">AI Styling</span>
                    <p className="text-muted-foreground text-xs">Paste raw text, then press AI to auto-format</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="p-1 rounded bg-orange-100 dark:bg-orange-900/30 mt-0.5">
                    <FileCode className="h-3.5 w-3.5 text-orange-600" />
                  </div>
                  <div>
                    <span className="font-medium">HTML Mode</span>
                    <p className="text-muted-foreground text-xs">Switch to raw HTML for full control</p>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Start Blank Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  //  EDITOR VIEW (create or edit)
  // ═══════════════════════════════════════════════
  if (viewMode !== 'list') {
    return (
      <div>
        <Button variant="ghost" onClick={() => setViewMode('list')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Legal Pages
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{viewMode === 'create' ? 'Create Legal Page' : 'Edit Legal Page'}</CardTitle>
                {editingPage?.isSystem && (
                  <Badge variant="secondary" className="mt-1">System Page — Slug cannot be changed</Badge>
                )}
              </div>
              {/* Editor mode toggle */}
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                    editorMode === 'visual'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setEditorMode('visual')}
                >
                  <FileType className="h-3.5 w-3.5" />
                  Visual
                </button>
                <button
                  className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                    editorMode === 'html'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setEditorMode('html')}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  HTML
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Slug */}
            <div className="space-y-2">
              <Label>Slug (URL path)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="e.g., privacy-policy"
                disabled={editingPage?.isSystem}
              />
              <p className="text-xs text-muted-foreground">URL will be: /de/legal/{formData.slug || 'your-slug'}</p>
            </div>

            {/* Language tabs */}
            <div className="flex gap-2 border-b">
              <button
                className={`px-4 py-2 ${formLang === 'de' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
                onClick={() => setFormLang('de')}
              >
                🇩🇪 German
              </button>
              <button
                className={`px-4 py-2 ${formLang === 'en' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
                onClick={() => setFormLang('en')}
              >
                🇬🇧 English
              </button>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Title ({formLang.toUpperCase()})</Label>
              <Input
                value={formData.title[formLang]}
                onChange={(e) => setFormData({
                  ...formData,
                  title: { ...formData.title, [formLang]: e.target.value },
                })}
                placeholder={formLang === 'de' ? 'Seitentitel' : 'Page Title'}
              />
            </div>

            {/* AI Actions Bar */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
              <div className="flex items-center gap-2 mr-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">AI Tools:</span>
              </div>

              {/* Generate from template */}
              <div className="flex items-center gap-1">
                <select
                  className="text-xs border rounded px-2 py-1.5 bg-background"
                  onChange={(e) => {
                    if (e.target.value) {
                      generateContent(e.target.value);
                      if (!formData.slug && e.target.value !== 'custom') {
                        const type = PAGE_TYPES.find(t => t.value === e.target.value);
                        if (type) {
                          setFormData(prev => ({
                            ...prev,
                            slug: prev.slug || type.slug,
                            title: {
                              de: prev.title.de || type.titleDe,
                              en: prev.title.en || type.titleEn,
                            },
                          }));
                        }
                      }
                      e.target.value = '';
                    }
                  }}
                  disabled={generating}
                >
                  <option value="">Generate from template...</option>
                  {PAGE_TYPES.filter(t => t.value !== 'custom').map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {generating && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
              </div>

              <div className="w-px h-6 bg-border" />

              {/* AI Format Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAIFormat}
                disabled={formatting || !formData.content[formLang]?.trim()}
                className="border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30"
              >
                {formatting ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
                )}
                {formatting ? 'Formatting...' : 'AI Format & Style'}
              </Button>

              <span className="text-xs text-muted-foreground hidden sm:inline">
                Paste plain text → press to auto-format
              </span>
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label>Content ({formLang.toUpperCase()})</Label>
              
              {editorMode === 'visual' ? (
                <RichTextEditor
                  content={formData.content[formLang]}
                  onChange={(html) => setFormData({
                    ...formData,
                    content: { ...formData.content, [formLang]: html },
                  })}
                  placeholder={
                    formLang === 'de'
                      ? 'Schreiben Sie Ihren Inhalt hier oder fügen Sie Text aus Word/Google Docs ein...'
                      : 'Type your content here or paste text from Word/Google Docs...'
                  }
                />
              ) : (
                <textarea
                  value={formData.content[formLang]}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: { ...formData.content, [formLang]: e.target.value },
                  })}
                  rows={20}
                  className="w-full px-3 py-2 border rounded-md font-mono text-sm bg-gray-50 dark:bg-gray-900"
                  placeholder="<h1>Title</h1><p>Content...</p>"
                />
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showInFooter"
                  checked={formData.showInFooter}
                  onChange={(e) => setFormData({ ...formData, showInFooter: e.target.checked })}
                />
                <Label htmlFor="showInFooter">Show in footer</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <Label htmlFor="isActive">Active (published)</Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? 'Saving...' : 'Save Page'}
              </Button>
              <Button variant="outline" onClick={() => setViewMode('list')}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  //  MAIN LIST VIEW
  // ═══════════════════════════════════════════════
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Legal Pages</h1>
        <Button onClick={() => setShowTemplateChooser(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Page
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          className={`px-4 py-2 flex items-center gap-2 ${activeTab === 'pages' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('pages')}
        >
          <FileText className="h-4 w-4" />
          All Pages
        </button>
        <button
          className={`px-4 py-2 flex items-center gap-2 ${activeTab === 'footer' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('footer')}
        >
          <Globe className="h-4 w-4" />
          Footer Links
        </button>
        <button
          className={`px-4 py-2 flex items-center gap-2 ${activeTab === 'disclaimer' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('disclaimer')}
        >
          <AlertTriangle className="h-4 w-4" />
          Risk Disclaimer
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* All Pages Tab */}
          {activeTab === 'pages' && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {pages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No legal pages yet</p>
                      <p className="text-sm mt-1">Click &quot;New Page&quot; to create one from a template or from scratch.</p>
                    </div>
                  ) : (
                    pages.map((page) => (
                      <div key={page._id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{page.title?.de || page.slug}</span>
                            {page.isSystem && <Badge variant="secondary" className="text-xs">System</Badge>}
                            {!page.isActive && <Badge variant="outline" className="text-xs">Draft</Badge>}
                            {page.showInFooter && <Badge className="text-xs">Footer</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            /legal/{page.slug}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(page)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!page.isSystem && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(page)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer Links Tab */}
          {activeTab === 'footer' && (
            <Card>
              <CardHeader>
                <CardTitle>Footer Links</CardTitle>
                <CardDescription>Manage which legal pages appear in the footer and their order</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pages
                    .filter(p => p.showInFooter)
                    .sort((a, b) => a.footerOrder - b.footerOrder)
                    .map((page, index, arr) => (
                      <div key={page._id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <span className="font-medium">{page.title?.de || page.slug}</span>
                          <span className="text-muted-foreground ml-2 text-sm">/{page.slug}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={index === 0}
                            onClick={() => moveFooterOrder(page, 'up')}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={index === arr.length - 1}
                            onClick={() => moveFooterOrder(page, 'down')}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFooterVisibility(page)}
                            title="Remove from footer"
                          >
                            <EyeOff className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium mb-3">Add to Footer</h4>
                  <div className="space-y-2">
                    {pages
                      .filter(p => !p.showInFooter && p.isActive)
                      .map((page) => (
                        <div key={page._id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                          <span>{page.title?.de || page.slug}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleFooterVisibility(page)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Add to Footer
                          </Button>
                        </div>
                      ))}
                    {pages.filter(p => !p.showInFooter && p.isActive).length === 0 && (
                      <p className="text-muted-foreground text-sm">All active pages are already in the footer.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Disclaimer Tab */}
          {activeTab === 'disclaimer' && (
            <Card>
              <CardHeader>
                <CardTitle>Risk Disclaimer</CardTitle>
                <CardDescription>This text will be displayed at the bottom of the footer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="disclaimerActive"
                    checked={disclaimer.isActive}
                    onChange={(e) => setDisclaimer({ ...disclaimer, isActive: e.target.checked })}
                  />
                  <Label htmlFor="disclaimerActive">Show disclaimer in footer</Label>
                </div>

                {/* Language tabs */}
                <div className="flex gap-2 border-b">
                  <button
                    className={`px-4 py-2 ${formLang === 'de' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
                    onClick={() => setFormLang('de')}
                  >
                    🇩🇪 German
                  </button>
                  <button
                    className={`px-4 py-2 ${formLang === 'en' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
                    onClick={() => setFormLang('en')}
                  >
                    🇬🇧 English
                  </button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={generateDisclaimer}
                    disabled={generating}
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate with AI
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Disclaimer Text ({formLang.toUpperCase()})</Label>
                  <textarea
                    value={disclaimer.content?.[formLang] || ''}
                    onChange={(e) => setDisclaimer({
                      ...disclaimer,
                      content: { ...(disclaimer.content || { de: '', en: '' }), [formLang]: e.target.value },
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    placeholder={formLang === 'de' 
                      ? 'Die auf dieser Website bereitgestellten Informationen dienen nur zu Informationszwecken...'
                      : 'The information provided on this website is for informational purposes only...'
                    }
                  />
                </div>

                <Button onClick={saveDisclaimer} disabled={savingDisclaimer}>
                  {savingDisclaimer ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Disclaimer
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
