"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bot, Building, FileText, Loader2 } from "lucide-react";

type SearchResult = {
  id: string;
  label: string;
  href: string;
  category: "assets" | "vendors" | "regulations" | "useCases" | "pages";
};

type Props = { onClose: () => void };

export function GlobalSearch({ onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    assets: SearchResult[];
    vendors: SearchResult[];
    regulations: SearchResult[];
    useCases: SearchResult[];
    pages: SearchResult[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults({
        assets: data.assets ?? [],
        vendors: data.vendors ?? [],
        regulations: data.regulations ?? [],
        useCases: data.useCases ?? [],
        pages: data.pages ?? []
      });
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 200);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const allResults: SearchResult[] = results
    ? [
        ...results.assets,
        ...results.vendors,
        ...results.regulations,
        ...results.useCases,
        ...results.pages
      ]
    : [];

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    assets: Bot,
    vendors: Building,
    regulations: FileText,
    useCases: FileText,
    pages: FileText
  };

  const categoryLabels: Record<string, string> = {
    assets: "AI Assets",
    vendors: "Vendors",
    regulations: "Regulations",
    useCases: "Use Cases",
    pages: "Platform Pages"
  };

  const byCategory = allResults.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-32"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-lg border border-slatePro-700 bg-slatePro-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-slatePro-700 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-slatePro-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets, vendors, pages…"
            className="flex-1 bg-transparent text-slatePro-100 placeholder:text-slatePro-500 focus:outline-none"
            autoFocus
          />
          <kbd className="rounded bg-slatePro-700 px-2 py-0.5 text-xs text-slatePro-400">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-slatePro-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Searching…
            </div>
          ) : query.trim() === "" ? (
            <p className="px-4 py-6 text-sm text-slatePro-500">
              Type to search across AI assets, vendors, and platform pages.
            </p>
          ) : allResults.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slatePro-500">No results found.</p>
          ) : (
            <div className="py-2">
              {Object.entries(byCategory).map(([cat, items]) => {
                const Icon = categoryIcons[cat] ?? FileText;
                return (
                  <div key={cat} className="mb-2">
                    <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-slatePro-500">
                      <Icon className="h-3.5 w-3.5" />
                      {categoryLabels[cat] ?? cat}
                    </div>
                    {items.map((r) => (
                      <button
                        key={`${r.category}-${r.id}`}
                        type="button"
                        onClick={() => handleSelect(r.href)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slatePro-200 hover:bg-slatePro-800"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-slatePro-500" />
                        <span className="truncate">{r.label}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
