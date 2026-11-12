import React from 'react';
import { Plus, RotateCcw, Trash2, X } from 'lucide-react';
import type { MarketSymbol } from '../data/marketsData';
import { formatPrice, PriceChange, SymbolLogo } from './ui';

export function WatchlistDrawer({
  isOpen,
  onClose,
  watchlist,
  symbols,
  onToggleWatch,
  onResetWatchlist,
  onOpenSearch,
  onSelectSymbol,
}: {
  isOpen: boolean;
  onClose: () => void;
  watchlist: string[];
  symbols: MarketSymbol[];
  onToggleWatch: (sym: string) => void;
  onResetWatchlist: () => void;
  onOpenSearch: () => void;
  onSelectSymbol: (sym: string) => void;
}) {
  if (!isOpen) return null;

  const symbolMap = new Map(symbols.map((s) => [s.symbol, s]));
  const items = watchlist
    .map((t) => symbolMap.get(t))
    .filter((s): s is MarketSymbol => Boolean(s));

  return (
    <aside
      aria-label="Watchlist panel"
      className="fixed inset-y-0 right-0 z-40 w-80 sm:w-88 bg-background border-l border-border shadow-(--shadow-float) flex flex-col"
    >
      <div className="px-4 py-3.5 border-b border-border flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          Watchlist ({items.length})
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Add symbol to watchlist"
            title="Add symbol"
            className="p-1.5 rounded-control text-muted hover:text-foreground hover:bg-surface-hover"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onResetWatchlist}
            aria-label="Reset watchlist to defaults"
            title="Reset default list"
            className="p-1.5 rounded-control text-muted hover:text-foreground hover:bg-surface-hover"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close watchlist"
            className="p-1.5 rounded-control text-muted hover:text-foreground hover:bg-surface-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 px-4 py-2 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted">
        <div className="col-span-6">Symbol</div>
        <div className="col-span-3 text-right">Last</div>
        <div className="col-span-3 text-right">Chg%</div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border/50">
        {items.length === 0 ? (
          <div className="p-6 text-center space-y-3">
            <p className="text-sm text-muted">
              Your watchlist is empty. Star any instrument or add symbols to track them here.
            </p>
            <button
              type="button"
              onClick={onOpenSearch}
              className="text-sm font-medium text-primary hover:underline"
            >
              Add first symbol
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.symbol}
              className="group grid grid-cols-12 items-center gap-2 px-4 py-2.5 hover:bg-surface-hover transition-colors duration-150"
            >
              <button
                type="button"
                onClick={() => onSelectSymbol(item.symbol)}
                className="col-span-6 flex items-center gap-2.5 min-w-0 text-left"
              >
                <SymbolLogo
                  logoUrl={item.logoUrl}
                  secondaryLogoUrl={item.secondaryLogoUrl}
                  symbol={item.symbol}
                  name={item.name}
                  size="xs"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold font-mono text-foreground truncate">
                    {item.symbol}
                  </div>
                  <div className="text-[11px] text-muted truncate">{item.name}</div>
                </div>
              </button>

              <div className="col-span-3 text-right text-xs font-semibold tabular-nums text-foreground">
                {formatPrice(item.price, item.decimals)}
              </div>

              <div className="col-span-3 flex items-center justify-end gap-1.5">
                <PriceChange value={item.changePct} className="text-xs" />
                <button
                  type="button"
                  onClick={() => onToggleWatch(item.symbol)}
                  aria-label={`Remove ${item.symbol}`}
                  className="hidden group-hover:inline-flex p-0.5 text-muted hover:text-down"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
