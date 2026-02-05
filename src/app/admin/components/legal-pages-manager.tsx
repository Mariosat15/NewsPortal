'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

const PAGE_TYPES = [
  { value: 'impressum', label: 'Impressum / Legal Notice' },
  { value: 'datenschutz', label: 'Privacy Policy' },
  { value: 'agb', label: 'Terms & Conditions' },
  { value: 'widerrufsbelehrung', label: 'Cancellation Policy' },
  { value: 'hilfe', label: 'Help / FAQ' },
  { value: 'custom', label: 'Custom Page' },
];

export function LegalPagesManager() {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingPage, setEditingPage] = useState<LegalPage | null>(null);
  const [activeTab, setActiveTab] = useState<'pages' | 'footer' | 'disclaimer'>('pages');
  
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

  function startCreate() {
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

    // Swap order values
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
            [formLang]: prev.title[formLang] || data.data.title[formLang],
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

  // Render editor view
  if (viewMode !== 'list') {
    return (
      <div>
        <Button variant="ghost" onClick={() => setViewMode('list')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Legal Pages
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{viewMode === 'create' ? 'Create Legal Page' : 'Edit Legal Page'}</CardTitle>
            {editingPage?.isSystem && (
              <Badge variant="secondary">System Page - Slug cannot be changed</Badge>
            )}
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

            {/* AI Generation */}
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Generate with AI:</Label>
              <select
                className="flex-1 px-3 py-2 border rounded-md text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    generateContent(e.target.value);
                    // Auto-set slug and title
                    if (!formData.slug && e.target.value !== 'custom') {
                      const type = PAGE_TYPES.find(t => t.value === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        slug: e.target.value,
                        title: {
                          de: type?.label.split(' / ')[0] || prev.title?.de || '',
                          en: type?.label.split(' / ')[1] || type?.label || prev.title?.en || '',
                        },
                      }));
                    }
                  }
                }}
                disabled={generating}
              >
                <option value="">Select page type to generate...</option>
                {PAGE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {generating && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>Content ({formLang.toUpperCase()}) - HTML</Label>
              <textarea
                value={formData.content[formLang]}
                onChange={(e) => setFormData({
                  ...formData,
                  content: { ...formData.content, [formLang]: e.target.value },
                })}
                rows={15}
                className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                placeholder="<h1>Title</h1><p>Content...</p>"
              />
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

  // Main list view with tabs
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Legal Pages</h1>
        <Button onClick={startCreate}>
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
                    <div className="text-center py-8 text-muted-foreground">
                      No legal pages yet. Click "New Page" to create one.
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
