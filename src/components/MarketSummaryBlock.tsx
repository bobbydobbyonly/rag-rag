import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { MarketSymbol } from '../data/marketsData';
import { MarketChart } from './MarketChart';
import { formatPrice, PriceChange, SymbolLogo } from './ui';

export function MarketSummaryBlock({
  symbols,
  onSelectSymbolPage,
}: {
  symbols: MarketSymbol[];
  onSelectSymbolPage: (symbol: string) => void;
}) {
  const [selectedTicker, setSelectedTicker] = useState<string>(symbols[0]?.symbol ?? '');

  const activeSymbol =
    symbols.find((s) => s.symbol === selectedTicker) ?? symbols[0];

  if (!activeSymbol) return null;

  return (
    <div className="space-y-4 min-w-0">
      {/* Selectable Ticker Strip (TradingView Market Summary Cards) */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5"
        role="tablist"
        aria-label="Select benchmark symbol for chart"
      >
        {symbols.slice(0, 6).map((item) => {
          const isSelected = item.symbol === activeSymbol.symbol;
          return (
            <div
              key={item.symbol}
              className={`group relative flex items-center justify-between gap-2.5 rounded-card px-3.5 py-3 transition-colors duration-150 ${
                isSelected
                  ? 'bg-surface-hover ring-1 ring-foreground/20'
                  : 'bg-surface hover:bg-surface-hover'
              }`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedTicker(item.symbol)}
                className="flex items-center gap-3 min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
              >
                <SymbolLogo
                  logoUrl={item.logoUrl}
                  secondaryLogoUrl={item.secondaryLogoUrl}
                  symbol={item.symbol}
                  name={item.name}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground truncate" title={item.name}>
                    {item.name}
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mt-0.5">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatPrice(item.price, item.decimals)}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-muted">
                      {item.currency}
                    </span>
                    <PriceChange value={item.changePct} className="text-xs" />
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelectSymbolPage(item.symbol)}
                aria-label={`Open ${item.name} full chart`}
                title={`Open ${item.symbol} overview`}
                className="p-1.5 rounded-control text-muted hover:text-foreground hover:bg-background/70 opacity-80 group-hover:opacity-100 transition-opacity duration-150 shrink-0 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Connected Interactive Chart */}
      <div className="pt-1">
        <MarketChart
          symbol={activeSymbol}
          onOpenSymbol={onSelectSymbolPage}
          height={275}
        />
      </div>
    </div>
  );
}
