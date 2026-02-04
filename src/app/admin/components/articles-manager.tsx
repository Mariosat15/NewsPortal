'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { ArticleEditor } from './article-editor';

interface Article {
  _id: string;
  title: string;
  slug: string;
  teaser: string;
  content: string;
  thumbnail: string;
  category: string;
  tags: string[];
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  publishDate: string;
  viewCount: number;
  unlockCount: number;
  agentGenerated: boolean;
  language: 'de' | 'en';
}

export function ArticlesManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [page]);

  async function fetchArticles() {
    try {
      const response = await fetch(`/api/admin/articles?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data.data.articles);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setArticles(articles.filter(a => a._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/articles/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEditingArticle(data.data);
        setMode('edit');
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
    }
  };

  const handleSave = async (articleData: Omit<Article, '_id' | 'slug' | 'viewCount' | 'unlockCount' | 'agentGenerated'> & { _id?: string }) => {
    const isEditing = !!articleData._id;
    const url = isEditing 
      ? `/api/admin/articles/${articleData._id}` 
      : '/api/admin/articles';
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(articleData),
    });

    if (!response.ok) {
      throw new Error('Failed to save article');
    }

    // Refresh list and return to list view
    await fetchArticles();
    setMode('list');
    setEditingArticle(null);
  };

  const handleCancel = () => {
    setMode('list');
    setEditingArticle(null);
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  // Show editor if in create or edit mode
  if (mode === 'create' || mode === 'edit') {
    return (
      <div>
        <Button 
          variant="ghost" 
          onClick={handleCancel}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Articles
        </Button>
        <ArticleEditor
          article={editingArticle}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Articles</h1>
        <Button onClick={() => setMode('create')}>
          <Plus className="h-4 w-4 mr-2" />
          New Article
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No articles found. 
              <Button variant="link" onClick={() => setMode('create')}>
                Create your first article
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <div
                  key={article._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{article.title}</h3>
                      {article.agentGenerated && (
                        <Badge variant="secondary" className="text-xs">AI</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {article.language.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="capitalize">{article.category}</span>
                      <Badge variant={article.status === 'published' ? 'default' : 'outline'}>
                        {article.status}
                      </Badge>
                      <span>{new Date(article.publishDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right text-sm">
                      <div>{article.viewCount} views</div>
                      <div className="text-muted-foreground">{article.unlockCount} unlocks</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/${article.language}/article/${article.slug}`, '_blank')}
                        title="View article"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(article._id)}
                        title="Edit article"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(article._id)}
                        title="Delete article"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
