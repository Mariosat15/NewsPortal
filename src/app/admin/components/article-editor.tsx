'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  X, Save, Eye, Loader2, Plus, 
  Bold, Italic, Heading2, List, ListOrdered, 
  Image, Link, Quote, Code, AlignLeft
} from 'lucide-react';

interface Article {
  _id?: string;
  slug?: string;
  title: string;
  teaser: string;
  content: string;
  thumbnail: string;
  category: string;
  tags: string[];
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  publishDate: string;
  language: 'de' | 'en';
}

interface ArticleEditorProps {
  article?: Article | null;
  onSave: (article: Article) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES = [
  'news',
  'technology',
  'health',
  'finance',
  'sports',
  'lifestyle',
  'entertainment',
];

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const defaultArticle: Article = {
  title: '',
  teaser: '',
  content: '',
  thumbnail: '',
  category: 'news',
  tags: [],
  status: 'draft',
  publishDate: new Date().toISOString().split('T')[0],
  language: 'de',
};

export function ArticleEditor({ article, onSave, onCancel }: ArticleEditorProps) {
  const [formData, setFormData] = useState<Article>(article || defaultArticle);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Rich text toolbar functions
  const insertTag = (openTag: string, closeTag: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const newContent = 
      formData.content.substring(0, start) + 
      openTag + selectedText + closeTag + 
      formData.content.substring(end);
    
    setFormData({ ...formData, content: newContent });
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + openTag.length + selectedText.length + closeTag.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newContent = 
      formData.content.substring(0, start) + 
      text + 
      formData.content.substring(start);
    
    setFormData({ ...formData, content: newContent });
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Bold, label: 'Bold', action: () => insertTag('<strong>', '</strong>') },
    { icon: Italic, label: 'Italic', action: () => insertTag('<em>', '</em>') },
    { icon: Heading2, label: 'Heading', action: () => insertTag('<h2>', '</h2>') },
    { icon: AlignLeft, label: 'Paragraph', action: () => insertTag('<p>', '</p>') },
    { icon: List, label: 'Bullet List', action: () => insertAtCursor('\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>\n') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertAtCursor('\n<ol>\n  <li>First</li>\n  <li>Second</li>\n</ol>\n') },
    { icon: Quote, label: 'Blockquote', action: () => insertTag('<blockquote>', '</blockquote>') },
    { icon: Link, label: 'Link', action: () => insertTag('<a href="URL">', '</a>') },
    { icon: Image, label: 'Image', action: () => insertAtCursor('\n<figure class="article-image">\n  <img src="https://images.unsplash.com/photo-ID?w=800&h=450&fit=crop" alt="Description" />\n  <figcaption>Image caption</figcaption>\n</figure>\n') },
  ];

  useEffect(() => {
    if (article) {
      setFormData({
        ...article,
        publishDate: article.publishDate 
          ? new Date(article.publishDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      });
    }
  }, [article]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.teaser.trim()) {
      newErrors.teaser = 'Teaser is required';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    if (formData.teaser.length > 300) {
      newErrors.teaser = 'Teaser must be less than 300 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Failed to save article:', error);
      setErrors({ submit: 'Failed to save article. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handlePreview = () => {
    // Open preview in new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Preview: ${formData.title}</title>
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 2rem;
                line-height: 1.6;
              }
              img { max-width: 100%; height: auto; border-radius: 8px; }
              .teaser { color: #666; font-size: 1.2rem; margin-bottom: 2rem; }
              .meta { color: #888; font-size: 0.9rem; margin-bottom: 1rem; }
              .content { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            ${formData.thumbnail ? `<img src="${formData.thumbnail}" alt="${formData.title}" />` : ''}
            <h1>${formData.title}</h1>
            <div class="meta">${formData.category} | ${formData.publishDate}</div>
            <p class="teaser">${formData.teaser}</p>
            <div class="content">${formData.content}</div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{article?._id ? 'Edit Article' : 'Create New Article'}</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview} type="button">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errors.submit}
            </div>
          )}

          {/* Article ID and Slug (shown when editing) */}
          {article?._id && (
            <div className="p-3 bg-gray-50 border rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Article ID:</span>
                  <span className="ml-2 font-mono bg-white px-2 py-0.5 rounded border select-all">
                    {article._id}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Slug:</span>
                  <span className="ml-2 font-mono text-blue-600 bg-white px-2 py-0.5 rounded border select-all">
                    {article.slug || 'auto-generated'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter article title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Teaser */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Teaser <span className="text-red-500">*</span>
              <span className="text-muted-foreground ml-2">
                ({formData.teaser.length}/300 characters)
              </span>
            </label>
            <textarea
              value={formData.teaser}
              onChange={(e) => setFormData({ ...formData, teaser: e.target.value })}
              placeholder="Short summary shown in article previews"
              rows={3}
              className={`w-full px-3 py-2 border rounded-md resize-none ${
                errors.teaser ? 'border-red-500' : 'border-input'
              }`}
            />
            {errors.teaser && <p className="text-red-500 text-sm mt-1">{errors.teaser}</p>}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            
            {/* Rich Text Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border border-b-0 rounded-t-md">
              {toolbarButtons.map((btn, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={btn.action}
                  title={btn.label}
                  className="h-8 w-8 p-0"
                >
                  <btn.icon className="h-4 w-4" />
                </Button>
              ))}
              <div className="border-l mx-2" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Generate starter template
                  const template = `<h2>Introduction</h2>
<p>Your opening paragraph here. Set the scene and capture the reader's attention.</p>

<figure class="article-image">
  <img src="https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop" alt="Description" />
  <figcaption>Image caption</figcaption>
</figure>

<h2>Main Point 1</h2>
<p>Explain your first main point. Use <strong>bold</strong> for emphasis and <em>italics</em> for quotes.</p>

<h2>Main Point 2</h2>
<p>Continue with supporting information.</p>

<ul>
  <li>Key point one</li>
  <li>Key point two</li>
  <li>Key point three</li>
</ul>

<h2>Conclusion</h2>
<p>Summarize the key takeaways and provide a call to action or final thought.</p>`;
                  if (formData.content.trim() === '' || confirm('This will replace your current content. Continue?')) {
                    setFormData({ ...formData, content: template });
                  }
                }}
                className="text-xs"
              >
                Insert Template
              </Button>
            </div>
            
            <textarea
              ref={contentRef}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Full article content (supports HTML)"
              rows={20}
              className={`w-full px-3 py-2 border border-t-0 rounded-b-md font-mono text-sm ${
                errors.content ? 'border-red-500' : 'border-input'
              }`}
            />
            {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
            <p className="text-muted-foreground text-sm mt-1">
              Use the toolbar above to insert HTML formatting. Supported tags: &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, &lt;figure&gt;, &lt;blockquote&gt;, &lt;a&gt;
            </p>
          </div>

          {/* Thumbnail URL */}
          <div>
            <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
            <Input
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
            {formData.thumbnail && (
              <div className="mt-2">
                <img
                  src={formData.thumbnail}
                  alt="Thumbnail preview"
                  className="max-w-xs h-auto rounded border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Category, Language, Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as 'de' | 'en' })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="de">German (DE)</option>
                <option value="en">English (EN)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Article['status'] })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Publish Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Publish Date</label>
            <Input
              type="date"
              value={formData.publishDate}
              onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {formData.tags.length === 0 && (
                <span className="text-muted-foreground text-sm">No tags added</span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {article?._id ? 'Update Article' : 'Create Article'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
