'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  FileText, Users, Rocket, BarChart3, Search, Loader2,
} from 'lucide-react';

interface SearchResult {
  type: string;
  title: string;
  subtitle: string;
  tab: string;
  id?: string;
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  article: FileText,
  customer: Users,
  landing_page: Rocket,
  session: BarChart3,
};

const TYPE_COLORS: Record<string, string> = {
  article: 'text-blue-500',
  customer: 'text-green-500',
  landing_page: 'text-purple-500',
  session: 'text-orange-500',
};

interface GlobalSearchProps {
  onNavigate: (tab: string, search?: string) => void;
}

export function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setResults(json.results);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    onNavigate(result.tab, result.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
            placeholder="Search articles, customers, landing pages..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-[300px] overflow-y-auto py-2">
            {results.map((result, i) => {
              const Icon = TYPE_ICONS[result.type] || FileText;
              const color = TYPE_COLORS[result.type] || 'text-gray-500';
              return (
                <button
                  key={`${result.type}-${result.id}-${i}`}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60 transition-colors ${
                    i === selectedIndex ? 'bg-muted' : ''
                  }`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded">
                    {result.type.replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No results found for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Hint */}
        {query.length < 2 && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Type at least 2 characters to search across all data
          </div>
        )}
      </div>
    </div>
  );
}
