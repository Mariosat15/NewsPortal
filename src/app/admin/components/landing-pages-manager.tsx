'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Copy, ExternalLink, Layout, Link2 } from 'lucide-react';

interface LandingPage {
  _id: string;
  slug: string;
  name: string;
  layout: string;
  status: 'draft' | 'published';
  config: {
    heroTitle?: string;
    heroSubtitle?: string;
  };
  trackingDefaults: {
    utmCampaign?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const layoutOptions = [
  { id: 'lead-gen-1', name: 'Hero + Grid + CTA', description: 'Clean layout for high conversion' },
  { id: 'lead-gen-2', name: 'Magazine + Sidebar', description: 'Rich content with sidebar' },
  { id: 'lead-gen-3', name: 'Video Hero', description: 'Engaging video background option' },
  { id: 'lead-gen-4', name: 'Carousel + Ticker', description: 'Dynamic with animations' },
  { id: 'lead-gen-5', name: 'Full Magazine', description: 'Premium multi-section layout' },
];

export function LandingPagesManager() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    layout: 'lead-gen-1',
    heroTitle: '',
    heroSubtitle: '',
    utmCampaign: '',
  });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const res = await fetch('/api/admin/landing-pages');
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch (error) {
      console.error('Error loading landing pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const url = editingPage
        ? `/api/admin/landing-pages/${editingPage._id}`
        : '/api/admin/landing-pages';
      
      const method = editingPage ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: formData.slug,
          name: formData.name,
          layout: formData.layout,
          config: {
            heroTitle: formData.heroTitle,
            heroSubtitle: formData.heroSubtitle,
            banners: [],
            categoryBlocks: [],
            ctaButtons: [],
          },
          trackingDefaults: {
            utmCampaign: formData.utmCampaign,
          },
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: editingPage ? 'Page updated!' : 'Page created!' });
        loadPages();
        setShowForm(false);
        setEditingPage(null);
        resetForm();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const handleEdit = (page: LandingPage) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      name: page.name,
      layout: page.layout,
      heroTitle: page.config.heroTitle || '',
      heroSubtitle: page.config.heroSubtitle || '',
      utmCampaign: page.trackingDefaults.utmCampaign || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this landing page?')) return;

    try {
      const res = await fetch(`/api/admin/landing-pages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Page deleted' });
        loadPages();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
  };

  const handlePublish = async (id: string, publish: boolean) => {
    try {
      const res = await fetch(`/api/admin/landing-pages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: publish ? 'publish' : 'unpublish' }),
      });
      const data = await res.json();
      console.log('Publish response:', data);
      if (res.ok) {
        setMessage({ type: 'success', text: publish ? 'Page published!' : 'Page unpublished!' });
        loadPages();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update status' });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage({ type: 'error', text: 'Error updating status' });
    }
  };

  const handleDuplicate = async (page: LandingPage) => {
    const newSlug = prompt('Enter slug for the duplicate:', `${page.slug}-copy`);
    if (!newSlug) return;

    const newName = prompt('Enter name for the duplicate:', `${page.name} (Copy)`);
    if (!newName) return;

    try {
      const res = await fetch(`/api/admin/landing-pages/${page._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', newSlug, newName }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Page duplicated!' });
        loadPages();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to duplicate' });
    }
  };

  // Copy full URL to clipboard (uses current domain dynamically)
  const copyFullUrl = async (slug: string) => {
    const fullUrl = `${window.location.origin}/lp/${slug}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setMessage({ type: 'success', text: `URL copied: ${fullUrl}` });
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = fullUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setMessage({ type: 'success', text: `URL copied: ${fullUrl}` });
    }
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      name: '',
      layout: 'lead-gen-1',
      heroTitle: '',
      heroSubtitle: '',
      utmCampaign: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Layout className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Landing Pages</h2>
            <p className="text-sm text-gray-500">Create and manage lead-gen landing pages</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingPage(null); resetForm(); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Page
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {editingPage ? 'Edit Landing Page' : 'Create Landing Page'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="summer-campaign-2024"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">URL: /lp/{formData.slug || 'your-slug'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Summer Campaign 2024"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
              <div className="grid grid-cols-5 gap-3">
                {layoutOptions.map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, layout: layout.id })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.layout === layout.id
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{layout.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{layout.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                <input
                  type="text"
                  value={formData.heroTitle}
                  onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                  placeholder="Welcome to Our Portal"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default UTM Campaign</label>
                <input
                  type="text"
                  value={formData.utmCampaign}
                  onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                  placeholder="summer-2024"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
              <input
                type="text"
                value={formData.heroSubtitle}
                onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                placeholder="Discover the latest news and updates"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {editingPage ? 'Update Page' : 'Create Page'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingPage(null); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pages List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Layout className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No landing pages yet</h3>
          <p className="text-gray-500 mb-4">Create your first landing page to start tracking leads</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Layout</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pages.map((page) => (
                <tr key={page._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{page.name}</div>
                    {page.config.heroTitle && (
                      <div className="text-xs text-gray-500 truncate max-w-xs">{page.config.heroTitle}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {layoutOptions.find(l => l.id === page.layout)?.name || page.layout}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      page.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {page.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">/lp/{page.slug}</code>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {page.status === 'published' ? (
                        <>
                          <a
                            href={`/lp/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="View"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => copyFullUrl(page.slug)}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            title="Copy Full URL"
                          >
                            <Link2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePublish(page._id, false)}
                            className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
                            title="Unpublish"
                          >
                            <EyeOff className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handlePublish(page._id, true)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Publish"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(page)}
                        className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(page)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(page._id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
