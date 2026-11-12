import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, Search, Star } from 'lucide-react';
import {
  type AssetCategory,
  CATEGORY_TABS,
  ECONOMIC_CALENDAR_EVENTS,
  MACRO_HEATMAP_ROWS,
  type MarketSymbol,
} from '../data/marketsData';
import { MarketHeatmap } from './MarketHeatmap';
import { MarketSummaryBlock } from './MarketSummaryBlock';
import { YieldCurveChart } from './YieldCurveChart';
import { formatPrice, PriceChange, SymbolLogo } from './ui';

type SortKey = 'marketCapB' | 'price' | 'changePct' | 'volumeNum' | 'symbol';

export function CategoryScreen({
  category,
  symbols,
  watchlist,
  onToggleWatch,
  onSelectSymbol,
  onBackOverview,
}: {
  category: Exclude<AssetCategory, 'overview'>;
  symbols: MarketSymbol[];
  watchlist: string[];
  onToggleWatch: (symbol: string) => void;
  onSelectSymbol: (symbol: string) => void;
  onBackOverview: () => void;
}) {
  const [viewMode, setViewMode] = useState<'screener' | 'heatmap'>('screener');
  const [query, setQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const [perfFilter, setPerfFilter] = useState<'all' | 'gainers' | 'losers' | 'strong-buy'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('marketCapB');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const categoryTitle =
    CATEGORY_TABS.find((t) => t.id === category)?.label ?? 'Markets';

  const categorySymbols = useMemo(() => {
    if (category === 'economy') return [];
    return symbols.filter((s) => s.category === category);
  }, [symbols, category]);

  const sectors = useMemo(() => {
    const set = new Set<string>();
    categorySymbols.forEach((s) => {
      if (s.sector) set.add(s.sector);
    });
    return ['All', ...Array.from(set)];
  }, [categorySymbols]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = categorySymbols.filter((s) => {
      if (q && !s.symbol.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q)) {
        return false;
      }
      if (sectorFilter !== 'All' && s.sector !== sectorFilter) {
        return false;
      }
      if (perfFilter === 'gainers' && s.changePct <= 0) return false;
      if (perfFilter === 'losers' && s.changePct >= 0) return false;
      if (perfFilter === 'strong-buy' && s.rating !== 'Strong buy') return false;
      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'symbol') {
        cmp = a.symbol.localeCompare(b.symbol);
      } else {
        const av = a[sortKey] ?? 0;
        const bv = b[sortKey] ?? 0;
        cmp = av - bv;
      }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [categorySymbols, query, sectorFilter, perfFilter, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(key === 'symbol');
    }
  };

  const watchedSet = new Set(watchlist);

  if (category === 'economy') {
    return (
      <div className="space-y-10 pb-16 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackOverview}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors duration-150"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Markets overview</span>
          </button>
        </div>

        <div className="space-y-3">
          <h2 className="text-section font-bold tracking-tight">
            Global macroeconomic indicators
          </h2>
          <div className="overflow-x-auto border border-border rounded-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface text-[11px] font-semibold uppercase tracking-wider text-muted divide-x divide-border/60">
                  <th className="py-3 px-4">Economy</th>
                  <th className="py-3 px-4 text-right">GDP YoY</th>
                  <th className="py-3 px-4 text-right">Policy rate</th>
                  <th className="py-3 px-4 text-right">CPI YoY</th>
                  <th className="py-3 px-4 text-right">Unemployment</th>
                  <th className="py-3 px-4 text-right">Debt / GDP</th>
                  <th className="py-3 px-4 text-right">Current acct</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm tabular-nums">
                {MACRO_HEATMAP_ROWS.map((row) => (
                  <tr key={row.code} className="divide-x divide-border/60 hover:bg-surface-hover">
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={row.flagUrl}
                          alt={row.country}
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span>{row.country}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">{row.gdpYoY.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right">{row.interestRate.toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right">{row.inflationYoY.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right">{row.joblessRate.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right">{row.govDebtGdp.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right">
                      {row.currentAccountGdp > 0 ? '+' : '−'}
                      {Math.abs(row.currentAccountGdp).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Upcoming economic releases</h3>
          <div className="overflow-x-auto border border-border rounded-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="py-2.5 px-4">Time (PT)</th>
                  <th className="py-2.5 px-4">Release</th>
                  <th className="py-2.5 px-4">Impact</th>
                  <th className="py-2.5 px-4 text-right">Actual</th>
                  <th className="py-2.5 px-4 text-right">Forecast</th>
                  <th className="py-2.5 px-4 text-right">Prior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-sm">
                {ECONOMIC_CALENDAR_EVENTS.map((ev) => (
                  <tr key={ev.id} className="hover:bg-surface-hover">
                    <td className="py-2.5 px-4 font-mono text-xs text-muted">{ev.time}</td>
                    <td className="py-2.5 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <img
                          src={ev.flagUrl}
                          alt={ev.countryCode}
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>{ev.event}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-xs">{ev.impact}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-semibold">{ev.actual}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-muted">{ev.forecast}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-muted">{ev.prior}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16 min-w-0">
      {/* Breadcrumb + Screen Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={onBackOverview}
            className="text-muted hover:text-foreground font-medium transition-colors duration-150"
          >
            Markets
          </button>
          <span className="text-muted">/</span>
          <span className="font-semibold text-foreground">{categoryTitle}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Category view">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'screener'}
            onClick={() => setViewMode('screener')}
            className={`px-3.5 py-1.5 rounded-control text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
              viewMode === 'screener'
                ? 'bg-ink-button text-ink-button-fg'
                : 'bg-surface text-muted hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            Screener table ({filtered.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'heatmap'}
            onClick={() => setViewMode('heatmap')}
            className={`px-3.5 py-1.5 rounded-control text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
              viewMode === 'heatmap'
                ? 'bg-ink-button text-ink-button-fg'
                : 'bg-surface text-muted hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            Market heatmap
          </button>
        </div>
      </div>

      {/* Category Benchmark Summary */}
      {category === 'bonds' ? (
        <YieldCurveChart />
      ) : (
        <MarketSummaryBlock
          symbols={categorySymbols.slice(0, 6)}
          onSelectSymbolPage={onSelectSymbol}
        />
      )}

      {viewMode === 'heatmap' ? (
        <div className="space-y-3 pt-4 border-t border-border">
          <h2 className="text-section font-bold tracking-tight">
            {categoryTitle} performance heatmap
          </h2>
          <MarketHeatmap symbols={categorySymbols} onSelectSymbol={onSelectSymbol} />
        </div>
      ) : (
        <div className="space-y-4 pt-4 border-t border-border">
          {/* Screener Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', label: 'All instruments' },
                  { id: 'gainers', label: 'Top gainers' },
                  { id: 'losers', label: 'Top losers' },
                  { id: 'strong-buy', label: 'Strong buy' },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setPerfFilter(chip.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                    perfFilter === chip.id
                      ? 'bg-ink-button text-ink-button-fg'
                      : 'border border-border bg-surface text-muted hover:text-foreground'
                  }`}
                >
                  {chip.label}
                </button>
              ))}

              {sectors.length > 2 && (
                <select
                  aria-label="Filter by sector or group"
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="min-h-8 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {sectors.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec === 'All' ? 'All groups' : sec}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="relative min-w-56">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label={`Search ${categoryTitle}`}
                placeholder={`Filter ${categoryTitle.toLowerCase()}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full min-h-9 rounded-control border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
          </div>

          {/* TradingView Screener Data Grid */}
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-2 border border-border rounded-card">
              <p className="text-sm font-medium text-foreground">
                No symbols match your active filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSectorFilter('All');
                  setPerfFilter('all');
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Reset screener filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-card">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <th className="py-3 pl-4 pr-2 w-10">
                      <span className="sr-only">Watch</span>
                    </th>
                    <th className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleSort('symbol')}
                        className="inline-flex items-center gap-1 hover:text-foreground uppercase"
                      >
                        Symbol
                        {sortKey === 'symbol' &&
                          (sortAsc ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          ))}
                      </button>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('price')}
                        className="inline-flex items-center gap-1 hover:text-foreground uppercase ml-auto"
                      >
                        Price
                        {sortKey === 'price' &&
                          (sortAsc ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          ))}
                      </button>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('changePct')}
                        className="inline-flex items-center gap-1 hover:text-foreground uppercase ml-auto"
                      >
                        Change %
                        {sortKey === 'changePct' &&
                          (sortAsc ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          ))}
                      </button>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('volumeNum')}
                        className="inline-flex items-center gap-1 hover:text-foreground uppercase ml-auto"
                      >
                        Volume / Info
                        {sortKey === 'volumeNum' &&
                          (sortAsc ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          ))}
                      </button>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('marketCapB')}
                        className="inline-flex items-center gap-1 hover:text-foreground uppercase ml-auto"
                      >
                        Mkt cap
                        {sortKey === 'marketCapB' &&
                          (sortAsc ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          ))}
                      </button>
                    </th>
                    <th className="py-3 px-3">Sector</th>
                    <th className="py-3 pl-3 pr-4 text-right">Technical rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {filtered.map((item) => {
                    const isWatched = watchedSet.has(item.symbol);
                    const ratingColor =
                      item.rating === 'Strong buy' || item.rating === 'Buy'
                        ? 'text-up'
                        : item.rating === 'Sell' || item.rating === 'Strong sell'
                        ? 'text-down'
                        : 'text-muted';

                    return (
                      <tr
                        key={item.symbol}
                        className="hover:bg-surface-hover transition-colors duration-150"
                      >
                        <td className="py-2.5 pl-4 pr-2">
                          <button
                            type="button"
                            onClick={() => onToggleWatch(item.symbol)}
                            aria-label={
                              isWatched
                                ? `Remove ${item.symbol} from watchlist`
                                : `Add ${item.symbol} to watchlist`
                            }
                            className={`p-1 rounded-sm ${
                              isWatched ? 'text-warn' : 'text-muted/50 hover:text-foreground'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${isWatched ? 'fill-current' : ''}`} />
                          </button>
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => onSelectSymbol(item.symbol)}
                            className="flex items-center gap-3 text-left min-w-0 group focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
                          >
                            <SymbolLogo
                              logoUrl={item.logoUrl}
                              secondaryLogoUrl={item.secondaryLogoUrl}
                              symbol={item.symbol}
                              name={item.name}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground group-hover:text-primary transition-colors duration-150">
                                {item.symbol}
                              </div>
                              <div className="text-xs text-muted truncate max-w-56" title={item.name}>
                                {item.name}
                              </div>
                            </div>
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-medium text-foreground whitespace-nowrap">
                          {formatPrice(item.price, item.decimals)}{' '}
                          <span className="text-[11px] font-normal uppercase text-muted">
                            {item.currency}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <PriceChange value={item.changePct} />
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-muted whitespace-nowrap">
                          {item.volume ?? item.extraValue ?? '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-foreground whitespace-nowrap">
                          {item.marketCap ?? (item.marketCapB ? `${item.marketCapB} B` : '—')}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted whitespace-nowrap">
                          {item.sector ?? '—'}
                        </td>
                        <td
                          className={`py-2.5 pl-3 pr-4 text-right text-xs font-semibold whitespace-nowrap ${ratingColor}`}
                        >
                          {item.rating}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
