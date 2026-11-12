import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Star, X } from 'lucide-react';
import type { AssetCategory, MarketSymbol } from '../data/marketsData';
import { formatPrice, PriceChange, Surface, SymbolLogo } from './ui';

const SEARCH_FILTERS: { id: 'all' | Exclude<AssetCategory, 'overview' | 'economy'>; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'world-stocks', label: 'World' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'indices', label: 'Indices' },
  { id: 'futures', label: 'Futures' },
  { id: 'forex', label: 'Forex' },
  { id: 'bonds', label: 'Bonds' },
  { id: 'etfs', label: 'ETFs' },
];

export function SearchModal({
  isOpen,
  onClose,
  symbols,
  watchlist,
  onToggleWatch,
  onSelectSymbol,
}: {
  isOpen: boolean;
  onClose: () => void;
  symbols: MarketSymbol[];
  watchlist: string[];
  onToggleWatch: (sym: string) => void;
  onSelectSymbol: (sym: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<(typeof SEARCH_FILTERS)[number]['id']>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return symbols
      .filter((s) => {
        if (cat !== 'all') {
          if (cat === 'bonds') {
            if (s.category !== 'bonds' && s.category !== 'corporate-bonds') return false;
          } else if (s.category !== cat) {
            return false;
          }
        }
        if (!q) return true;
        return (
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.exchange.toLowerCase().includes(q)
        );
      })
      .slice(0, 14);
  }, [symbols, query, cat]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, cat]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(results.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter' && results[activeIndex]) {
        e.preventDefault();
        onSelectSymbol(results[activeIndex].symbol);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, results, activeIndex, onClose, onSelectSymbol]);

  if (!isOpen) return null;

  const watchedSet = new Set(watchlist);

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/35 flex items-start justify-center pt-12 sm:pt-20 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Surface
        role="dialog"
        aria-modal="true"
        aria-label="Symbol search"
        className="w-full max-w-2xl bg-background border border-border shadow-(--shadow-float) overflow-hidden"
      >
        {/* Header & Input */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Symbol search</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close symbol search"
              className="p-1.5 rounded-control text-muted hover:text-foreground hover:bg-surface-hover"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              aria-label="Search ticker, company, coin, or exchange"
              placeholder="Symbol, eg. NVDA, SPX, BTCUSD, GC1!, EURUSD..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full min-h-11 rounded-control border border-border bg-surface pl-10 pr-16 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-primary"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono uppercase tracking-wider text-muted">
              [ESC]
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {SEARCH_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCat(f.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                  cat === f.id
                    ? 'bg-ink-button text-ink-button-fg'
                    : 'bg-surface text-muted hover:text-foreground hover:bg-surface-hover'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto divide-y divide-border/50">
          {results.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted">
              No matching symbols found. Try searching by ticker or asset name.
            </div>
          ) : (
            results.map((item, idx) => {
              const watched = watchedSet.has(item.symbol);
              const highlighted = idx === activeIndex;
              return (
                <div
                  key={item.symbol}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 transition-colors duration-150 ${
                    highlighted ? 'bg-surface-hover' : 'hover:bg-surface'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSymbol(item.symbol);
                      onClose();
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                    <SymbolLogo
                      logoUrl={item.logoUrl}
                      secondaryLogoUrl={item.secondaryLogoUrl}
                      symbol={item.symbol}
                      name={item.name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm text-foreground">
                          {item.symbol}
                        </span>
                        <span className="text-sm text-muted truncate">{item.name}</span>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-semibold tabular-nums text-foreground">
                        {formatPrice(item.price, item.decimals)} {item.currency}
                      </div>
                      <PriceChange value={item.changePct} className="text-[11px]" />
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted w-16 text-right">
                      {item.exchange}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleWatch(item.symbol)}
                      aria-label={
                        watched
                          ? `Remove ${item.symbol} from watchlist`
                          : `Add ${item.symbol} to watchlist`
                      }
                      className={`p-1.5 rounded-control ${
                        watched ? 'text-warn' : 'text-muted hover:text-foreground'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${watched ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Surface>
    </div>
  );
}
