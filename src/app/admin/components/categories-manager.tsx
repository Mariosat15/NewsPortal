'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Plus, X, Save, Loader2, AlertCircle, CheckCircle, Trash2,
  FolderOpen, Edit2, GripVertical, Palette, FileText, Utensils,
  Heart, DollarSign, Users, Newspaper, Laptop, Trophy, Sparkles,
  Globe, Briefcase, Plane, Music, Film, BookOpen, Lightbulb, Tags, Link2
} from 'lucide-react';

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  news: Newspaper,
  technology: Laptop,
  health: Heart,
  finance: DollarSign,
  sports: Trophy,
  lifestyle: Sparkles,
  entertainment: Film,
  recipes: Utensils,
  relationships: Users,
  travel: Plane,
  music: Music,
  business: Briefcase,
  science: Lightbulb,
  culture: BookOpen,
  world: Globe,
  default: FolderOpen,
};

// Predefined colors for categories
const CATEGORY_COLORS = [
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-100', text: 'text-blue-700' },
  { name: 'Green', value: '#22c55e', bg: 'bg-green-100', text: 'text-green-700' },
  { name: 'Purple', value: '#8b5cf6', bg: 'bg-purple-100', text: 'text-purple-700' },
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-100', text: 'text-orange-700' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-100', text: 'text-pink-700' },
  { name: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-100', text: 'text-cyan-700' },
  { name: 'Red', value: '#ef4444', bg: 'bg-red-100', text: 'text-red-700' },
  { name: 'Amber', value: '#f59e0b', bg: 'bg-amber-100', text: 'text-amber-700' },
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-100', text: 'text-teal-700' },
];

// Content types that can be generated
export const CONTENT_TYPES = [
  { id: 'news', label: 'News Articles', description: 'Breaking news and current events', icon: Newspaper },
  { id: 'analysis', label: 'Analysis & Opinion', description: 'In-depth analysis and opinion pieces', icon: Lightbulb },
  { id: 'guide', label: 'How-To Guides', description: 'Step-by-step tutorials and guides', icon: BookOpen },
  { id: 'recipe', label: 'Recipes', description: 'Food recipes with ingredients and steps', icon: Utensils },
  { id: 'review', label: 'Reviews', description: 'Product, service, or media reviews', icon: Sparkles },
  { id: 'listicle', label: 'Listicles', description: 'Top 10, best of, ranked lists', icon: FileText },
  { id: 'interview', label: 'Interviews', description: 'Q&A style interview articles', icon: Users },
  { id: 'profile', label: 'Profiles', description: 'Person or company profiles', icon: Users },
];

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  enabled: boolean;
  contentTypes: string[]; // Which content types this category supports
  order: number;
  aliases?: string[]; // Alternative slugs that map to this category
  displayName?: { de: string; en: string }; // Localized display names
}

interface CategoriesManagerProps {
  onCategoriesChange?: (categories: Category[]) => void;
}

interface EditCategoryFormProps {
  editingCategory: Category;
  setEditingCategory: (cat: Category | null) => void;
  handleUpdateCategory: (cat: Category) => void;
  addAliasToEditing: (alias: string) => void;
  removeAliasFromEditing: (alias: string) => void;
}

function EditCategoryForm({ 
  editingCategory, 
  setEditingCategory, 
  handleUpdateCategory,
  addAliasToEditing,
  removeAliasFromEditing,
}: EditCategoryFormProps) {
  const [aliasInput, setAliasInput] = useState('');

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={editingCategory.name}
            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            value={editingCategory.description}
            onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
          />
        </div>
      </div>

      {/* Display Names */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Display Name (DE)</Label>
          <Input
            value={editingCategory.displayName?.de || editingCategory.name}
            onChange={(e) => setEditingCategory({ 
              ...editingCategory, 
              displayName: { 
                de: e.target.value, 
                en: editingCategory.displayName?.en || editingCategory.name 
              } 
            })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Display Name (EN)</Label>
          <Input
            value={editingCategory.displayName?.en || editingCategory.name}
            onChange={(e) => setEditingCategory({ 
              ...editingCategory, 
              displayName: { 
                de: editingCategory.displayName?.de || editingCategory.name, 
                en: e.target.value 
              } 
            })}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_COLORS.map(color => (
            <button
              key={color.value}
              onClick={() => setEditingCategory({ ...editingCategory, color: color.value })}
              className={`w-6 h-6 rounded-full border-2 ${
                editingCategory.color === color.value ? 'border-gray-900' : 'border-transparent'
              }`}
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Content Types</Label>
        <div className="flex gap-2 flex-wrap">
          {CONTENT_TYPES.map(type => (
            <Badge
              key={type.id}
              variant={editingCategory.contentTypes.includes(type.id) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                const types = editingCategory.contentTypes.includes(type.id)
                  ? editingCategory.contentTypes.filter(t => t !== type.id)
                  : [...editingCategory.contentTypes, type.id];
                setEditingCategory({ ...editingCategory, contentTypes: types.length > 0 ? types : ['news'] });
              }}
            >
              <type.icon className="h-3 w-3 mr-1" />
              {type.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Aliases */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          URL Aliases
        </Label>
        <div className="flex gap-2">
          <Input
            value={aliasInput}
            onChange={(e) => setAliasInput(e.target.value)}
            placeholder="Add alias"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addAliasToEditing(aliasInput);
                setAliasInput('');
              }
            }}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => {
              addAliasToEditing(aliasInput);
              setAliasInput('');
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {editingCategory.aliases && editingCategory.aliases.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {editingCategory.aliases.map(alias => (
              <Badge key={alias} variant="secondary" className="gap-1">
                {alias}
                <button onClick={() => removeAliasFromEditing(alias)} className="hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => handleUpdateCategory(editingCategory)}>
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'News', slug: 'news', description: 'Breaking news and current events', color: '#3b82f6', icon: 'news', enabled: true, contentTypes: ['news', 'analysis'], order: 0, aliases: ['breaking', 'current-events', 'world-news'], displayName: { de: 'Nachrichten', en: 'News' } },
  { id: '2', name: 'Technology', slug: 'technology', description: 'Tech news, gadgets, and innovations', color: '#8b5cf6', icon: 'technology', enabled: true, contentTypes: ['news', 'review', 'guide'], order: 1, aliases: ['tech', 'gadgets', 'digital'], displayName: { de: 'Technologie', en: 'Technology' } },
  { id: '3', name: 'Health', slug: 'health', description: 'Health tips, wellness, and medical news', color: '#22c55e', icon: 'health', enabled: true, contentTypes: ['news', 'guide', 'listicle'], order: 2, aliases: ['wellness', 'medical', 'fitness'], displayName: { de: 'Gesundheit', en: 'Health' } },
  { id: '4', name: 'Finance', slug: 'finance', description: 'Financial news, investing, and money tips', color: '#f97316', icon: 'finance', enabled: true, contentTypes: ['news', 'analysis', 'guide'], order: 3, aliases: ['business', 'money', 'investing', 'economy'], displayName: { de: 'Finanzen', en: 'Finance' } },
  { id: '5', name: 'Sports', slug: 'sports', description: 'Sports news, scores, and highlights', color: '#ef4444', icon: 'sports', enabled: true, contentTypes: ['news', 'analysis'], order: 4, aliases: ['football', 'soccer', 'basketball', 'athletics'], displayName: { de: 'Sport', en: 'Sports' } },
  { id: '6', name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle, trends, and living tips', color: '#ec4899', icon: 'lifestyle', enabled: true, contentTypes: ['guide', 'listicle', 'review'], order: 5, aliases: ['living', 'trends', 'fashion'], displayName: { de: 'Lifestyle', en: 'Lifestyle' } },
  { id: '7', name: 'Entertainment', slug: 'entertainment', description: 'Movies, music, and celebrity news', color: '#6366f1', icon: 'entertainment', enabled: true, contentTypes: ['news', 'review', 'interview'], order: 6, aliases: ['movies', 'music', 'celebrity', 'tv'], displayName: { de: 'Unterhaltung', en: 'Entertainment' } },
  { id: '8', name: 'Recipes', slug: 'recipes', description: 'Delicious recipes and cooking guides', color: '#f59e0b', icon: 'recipes', enabled: false, contentTypes: ['recipe', 'guide', 'listicle'], order: 7, aliases: ['food', 'cooking', 'kitchen'], displayName: { de: 'Rezepte', en: 'Recipes' } },
  { id: '9', name: 'Relationships', slug: 'relationships', description: 'Dating, relationships, and advice', color: '#ec4899', icon: 'relationships', enabled: false, contentTypes: ['guide', 'analysis', 'listicle'], order: 8, aliases: ['dating', 'love', 'advice'], displayName: { de: 'Beziehungen', en: 'Relationships' } },
  { id: '10', name: 'Travel', slug: 'travel', description: 'Travel guides, destinations, and tips', color: '#06b6d4', icon: 'travel', enabled: false, contentTypes: ['guide', 'listicle', 'review'], order: 9, aliases: ['vacation', 'destinations', 'tourism'], displayName: { de: 'Reisen', en: 'Travel' } },
];

export function CategoriesManager({ onCategoriesChange }: CategoriesManagerProps) {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    description: '',
    color: CATEGORY_COLORS[0].value,
    icon: 'default',
    enabled: true,
    contentTypes: ['news'],
    aliases: [],
    displayName: { de: '', en: '' },
  });
  const [newAlias, setNewAlias] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (onCategoriesChange) {
      onCategoriesChange(categories);
    }
  }, [categories, onCategoriesChange]);

  async function loadCategories() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings?.categories && data.settings.categories.length > 0) {
          setCategories(data.settings.categories);
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveCategories() {
    setSaving(true);
    setSaveResult(null);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories }),
      });
      
      if (response.ok) {
        setSaveResult({ success: true, message: 'Categories saved successfully!' });
        setTimeout(() => setSaveResult(null), 3000);
      } else {
        setSaveResult({ success: false, message: 'Failed to save categories' });
      }
    } catch (err) {
      setSaveResult({ success: false, message: 'Network error' });
    } finally {
      setSaving(false);
    }
  }

  function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function handleAddCategory() {
    if (!newCategory.name) return;
    
    const category: Category = {
      id: `cat-${Date.now()}`,
      name: newCategory.name,
      slug: generateSlug(newCategory.name),
      description: newCategory.description || '',
      color: newCategory.color || CATEGORY_COLORS[0].value,
      icon: newCategory.icon || 'default',
      enabled: newCategory.enabled !== false,
      contentTypes: newCategory.contentTypes || ['news'],
      order: categories.length,
      aliases: newCategory.aliases || [],
      displayName: {
        de: newCategory.displayName?.de || newCategory.name,
        en: newCategory.displayName?.en || newCategory.name,
      },
    };
    
    setCategories([...categories, category]);
    setNewCategory({
      name: '',
      description: '',
      color: CATEGORY_COLORS[0].value,
      icon: 'default',
      enabled: true,
      contentTypes: ['news'],
      aliases: [],
      displayName: { de: '', en: '' },
    });
    setNewAlias('');
    setShowAddForm(false);
  }

  function addAliasToNew() {
    if (!newAlias) return;
    const aliasSlug = generateSlug(newAlias);
    if (aliasSlug && !newCategory.aliases?.includes(aliasSlug)) {
      setNewCategory({
        ...newCategory,
        aliases: [...(newCategory.aliases || []), aliasSlug],
      });
    }
    setNewAlias('');
  }

  function removeAliasFromNew(alias: string) {
    setNewCategory({
      ...newCategory,
      aliases: newCategory.aliases?.filter(a => a !== alias) || [],
    });
  }

  function addAliasToEditing(alias: string) {
    if (!editingCategory || !alias) return;
    const aliasSlug = generateSlug(alias);
    if (aliasSlug && !editingCategory.aliases?.includes(aliasSlug)) {
      setEditingCategory({
        ...editingCategory,
        aliases: [...(editingCategory.aliases || []), aliasSlug],
      });
    }
  }

  function removeAliasFromEditing(alias: string) {
    if (!editingCategory) return;
    setEditingCategory({
      ...editingCategory,
      aliases: editingCategory.aliases?.filter(a => a !== alias) || [],
    });
  }

  function handleUpdateCategory(updated: Category) {
    setCategories(categories.map(c => c.id === updated.id ? updated : c));
    setEditingCategory(null);
  }

  function handleDeleteCategory(id: string) {
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  }

  function handleToggleCategory(id: string) {
    setCategories(categories.map(c => 
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
  }

  function toggleContentType(categoryId: string, contentType: string) {
    setCategories(categories.map(c => {
      if (c.id !== categoryId) return c;
      const types = c.contentTypes.includes(contentType)
        ? c.contentTypes.filter(t => t !== contentType)
        : [...c.contentTypes, contentType];
      return { ...c, contentTypes: types.length > 0 ? types : ['news'] };
    }));
  }

  const getCategoryIcon = (iconName: string) => {
    return CATEGORY_ICONS[iconName] || CATEGORY_ICONS.default;
  };

  const getColorClasses = (color: string) => {
    const found = CATEGORY_COLORS.find(c => c.value === color);
    return found || { bg: 'bg-gray-100', text: 'text-gray-700' };
  };

  const enabledCount = categories.filter(c => c.enabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6" />
            Categories
          </h2>
          <p className="text-muted-foreground">
            Manage content categories used throughout the application
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
          <Button onClick={saveCategories} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {saveResult && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          saveResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {saveResult.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {saveResult.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{categories.length}</div>
          <div className="text-sm text-muted-foreground">Total Categories</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{enabledCount}</div>
          <div className="text-sm text-muted-foreground">Enabled</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-400">{categories.length - enabledCount}</div>
          <div className="text-sm text-muted-foreground">Disabled</div>
        </Card>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={newCategory.name || ''}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Recipes"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newCategory.description || ''}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newCategory.color === color.value ? 'border-gray-900 ring-2 ring-offset-2' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setNewCategory({ ...newCategory, icon: key })}
                    className={`p-2 rounded border ${
                      newCategory.icon === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={key}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Content Types</Label>
              <div className="flex gap-2 flex-wrap">
                {CONTENT_TYPES.map(type => (
                  <Badge
                    key={type.id}
                    variant={newCategory.contentTypes?.includes(type.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const types = newCategory.contentTypes || [];
                      const updated = types.includes(type.id)
                        ? types.filter(t => t !== type.id)
                        : [...types, type.id];
                      setNewCategory({ ...newCategory, contentTypes: updated.length > 0 ? updated : ['news'] });
                    }}
                  >
                    <type.icon className="h-3 w-3 mr-1" />
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Display Names */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Display Names (Localized)
              </Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">German (DE)</Label>
                  <Input
                    value={newCategory.displayName?.de || ''}
                    onChange={(e) => setNewCategory({ 
                      ...newCategory, 
                      displayName: { ...newCategory.displayName, de: e.target.value, en: newCategory.displayName?.en || '' } 
                    })}
                    placeholder="e.g., Nachrichten"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">English (EN)</Label>
                  <Input
                    value={newCategory.displayName?.en || ''}
                    onChange={(e) => setNewCategory({ 
                      ...newCategory, 
                      displayName: { ...newCategory.displayName, de: newCategory.displayName?.de || '', en: e.target.value } 
                    })}
                    placeholder="e.g., News"
                  />
                </div>
              </div>
            </div>

            {/* Aliases */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                URL Aliases
              </Label>
              <p className="text-xs text-muted-foreground">
                Alternative slugs that will redirect to this category (e.g., &quot;business&quot; → &quot;finance&quot;)
              </p>
              <div className="flex gap-2">
                <Input
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  placeholder="Add alias (e.g., business)"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAliasToNew())}
                />
                <Button type="button" variant="outline" onClick={addAliasToNew}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {newCategory.aliases && newCategory.aliases.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {newCategory.aliases.map(alias => (
                    <Badge key={alias} variant="secondary" className="gap-1">
                      {alias}
                      <button onClick={() => removeAliasFromNew(alias)} className="hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            Enable or disable categories, configure content types for each
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categories.sort((a, b) => a.order - b.order).map((category) => {
              const Icon = getCategoryIcon(category.icon);
              const colorClasses = getColorClasses(category.color);
              const isEditing = editingCategory?.id === category.id;

              return (
                <div 
                  key={category.id} 
                  className={`p-4 border rounded-lg ${category.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                >
                  {isEditing ? (
                    <EditCategoryForm 
                      editingCategory={editingCategory}
                      setEditingCategory={setEditingCategory}
                      handleUpdateCategory={handleUpdateCategory}
                      addAliasToEditing={addAliasToEditing}
                      removeAliasFromEditing={removeAliasFromEditing}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-gray-300 cursor-grab" />
                        <input
                          type="checkbox"
                          checked={category.enabled}
                          onChange={() => handleToggleCategory(category.id)}
                          className="w-4 h-4 rounded"
                        />
                        <div 
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses.bg}`}
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: category.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{category.name}</span>
                            <Badge variant="outline" className="text-xs">{category.slug}</Badge>
                            {category.displayName && (
                              <span className="text-xs text-muted-foreground">
                                ({category.displayName.de} / {category.displayName.en})
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {category.contentTypes.map(type => {
                              const contentType = CONTENT_TYPES.find(t => t.id === type);
                              return contentType ? (
                                <Badge key={type} variant="secondary" className="text-xs">
                                  {contentType.label}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                          {category.aliases && category.aliases.length > 0 && (
                            <div className="flex gap-1 mt-1 items-center">
                              <Link2 className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Aliases:</span>
                              {category.aliases.map(alias => (
                                <Badge key={alias} variant="outline" className="text-xs">
                                  {alias}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingCategory(category)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CategoriesManager;
