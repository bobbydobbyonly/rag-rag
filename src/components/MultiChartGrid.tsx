import React, { useState } from 'react';
import type { MarketSymbol } from '../data/marketsData';
import { MarketChart } from './MarketChart';

export function MultiChartGrid({
  layout,
  symbols,
  onOpenSymbol,
  onQuickTrade,
}: {
  layout: 'single' | 'split-h' | 'split-v' | 'quad';
  symbols: MarketSymbol[];
  onOpenSymbol: (sym: string) => void;
  onQuickTrade?: (side: 'BUY' | 'SELL', price: number) => void;
}) {
  const [paneSymbols, setPaneSymbols] = useState<string[]>(['SPX', 'NDX', 'NVDA', 'BTCUSD']);

  const handleSetPaneSymbol = (index: number, sym: string) => {
    setPaneSymbols((prev) => {
      const next = [...prev];
      next[index] = sym;
      return next;
    });
  };

  const getSymbol = (index: number) =>
    symbols.find((s) => s.symbol === paneSymbols[index]) ?? symbols[index] ?? symbols[0];

  const gridClass =
    layout === 'split-h'
      ? 'grid grid-cols-1 lg:grid-cols-2 gap-4'
      : layout === 'split-v'
      ? 'grid grid-cols-1 gap-6'
      : layout === 'quad'
      ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
      : 'grid grid-cols-1';

  const panesCount = layout === 'quad' ? 4 : layout === 'single' ? 1 : 2;

  return (
    <div className={gridClass}>
      {Array.from({ length: panesCount }).map((_, idx) => {
        const sym = getSymbol(idx);
        return (
          <div
            key={`pane-${idx}`}
            className="border border-border rounded-card p-3 bg-surface/30 space-y-2 min-w-0"
          >
            {/* Pane Header with Symbol Selector */}
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/50 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted text-[11px] uppercase">
                  Pane {idx + 1}
                </span>
                <select
                  value={sym.symbol}
                  onChange={(e) => handleSetPaneSymbol(idx, e.target.value)}
                  className="font-bold text-foreground bg-surface border border-border px-2 py-0.5 rounded-sm focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {symbols.map((s) => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.symbol} · {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-muted text-[11px]">{sym.exchange}</span>
            </div>

            <MarketChart
              symbol={sym}
              height={layout === 'quad' ? 240 : 310}
              showToolbar={true}
              onOpenSymbol={onOpenSymbol}
              onQuickTrade={onQuickTrade}
            />
          </div>
        );
      })}
    </div>
  );
}
