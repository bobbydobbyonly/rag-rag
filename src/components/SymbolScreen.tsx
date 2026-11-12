import React, { useState } from 'react';
import { ChevronLeft, GitCompare, Star } from 'lucide-react';
import {
  type AssetCategory,
  CATEGORY_TABS,
  type MarketSymbol,
   type TechnicalRating,
} from '../data/marketsData';
import { MarketChart } from './MarketChart';
import { Button, formatPrice, PriceChange, Surface, SymbolLogo } from './ui';

function TechnicalGauge({ rating }: { rating: TechnicalRating }) {
  const angleMap: Record<TechnicalRating, number> = {
    'Strong sell': -72,
    Sell: -36,
    Neutral: 0,
    Buy: 36,
    'Strong buy': 72,
  };
  const countsMap: Record<TechnicalRating, { sell: number; neutral: number; buy: number }> = {
    'Strong sell': { sell: 17, neutral: 6, buy: 3 },
    Sell: { sell: 14, neutral: 7, buy: 5 },
    Neutral: { sell: 8, neutral: 10, buy: 8 },
    Buy: { sell: 4, neutral: 8, buy: 14 },
    'Strong buy': { sell: 2, neutral: 6, buy: 18 },
  };

  const angleDeg = angleMap[rating];
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const cx = 130;
  const cy = 112;
  const r = 74;
  const needleX = cx + Math.cos(rad) * (r - 12);
  const needleY = cy + Math.sin(rad) * (r - 12);
  const counts = countsMap[rating];

  const ratingColor =
    rating === 'Strong buy' || rating === 'Buy'
      ? 'text-up'
      : rating === 'Sell' || rating === 'Strong sell'
      ? 'text-down'
      : 'text-foreground';

  return (
    <div className="flex flex-col items-center space-y-2">
      <svg
        viewBox="0 0 260 136"
        className="w-full max-w-64 h-auto"
        role="img"
        aria-label={`Technical analysis gauge: ${rating}`}
      >
        {/* Semicircle background track */}
        <path
          d="M 56 112 A 74 74 0 0 1 204 112"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Bearish left arc */}
        <path
          d="M 56 112 A 74 74 0 0 1 98 45"
          fill="none"
          stroke="var(--color-down)"
          strokeOpacity="0.65"
          strokeWidth="12"
          strokeLinecap="butt"
        />
        {/* Bullish right arc */}
        <path
          d="M 162 45 A 74 74 0 0 1 204 112"
          fill="none"
          stroke="var(--color-up)"
          strokeOpacity="0.65"
          strokeWidth="12"
          strokeLinecap="butt"
        />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="var(--color-foreground)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5" fill="var(--color-foreground)" />

        <text x={44} y={128} textAnchor="middle" fontSize="10" fill="var(--color-muted)" className="svg-halo-surface">
          Sell
        </text>
        <text x={130} y={24} textAnchor="middle" fontSize="10" fill="var(--color-muted)" className="svg-halo-surface">
          Neutral
        </text>
        <text x={216} y={128} textAnchor="middle" fontSize="10" fill="var(--color-muted)" className="svg-halo-surface">
          Buy
        </text>
      </svg>

      <div className={`text-base font-bold ${ratingColor}`}>{rating}</div>
      <div className="flex items-center gap-5 text-xs tabular-nums pt-1">
        <span className="text-down">Sell {counts.sell}</span>
        <span className="text-muted">Neutral {counts.neutral}</span>
        <span className="text-up">Buy {counts.buy}</span>
      </div>
      <p className="text-[11px] text-muted text-center">
        Summary of 26 moving averages and momentum oscillators (1D interval).
      </p>
    </div>
  );
}

export function SymbolScreen({
  symbol,
  allSymbols,
  isWatched,
  onToggleWatch,
  onSelectSymbol,
  onOpenCategory,
  onBackOverview,
}: {
  symbol: MarketSymbol;
  allSymbols: MarketSymbol[];
  isWatched: boolean;
  onToggleWatch: (sym: string) => void;
  onSelectSymbol: (sym: string) => void;
  onOpenCategory: (cat: AssetCategory) => void;
  onBackOverview: () => void;
}) {
  const [compareTicker, setCompareTicker] = useState<string>('');

  const compareBenchmarks = ['SPX', 'NDX', 'BTCUSD', 'GC1!', 'EURUSD'].filter(
    (t) => t !== symbol.symbol
  );
  const compareSymbol =
    allSymbols.find((s) => s.symbol === compareTicker) ?? null;

  const catLabel =
    CATEGORY_TABS.find((t) => t.id === symbol.category)?.label ?? 'Markets';

  const priceDelta = symbol.price - symbol.price / (1 + symbol.changePct / 100);
  const peers = allSymbols
    .filter((s) => s.category === symbol.category && s.symbol !== symbol.symbol)
    .slice(0, 6);

  const low52 = symbol.low52w ?? symbol.price * 0.76;
  const high52 = symbol.high52w ?? symbol.price * 1.12;
  const rangePos = Math.max(
    4,
    Math.min(96, ((symbol.price - low52) / (high52 - low52 || 1)) * 100)
  );

  return (
    <div className="space-y-10 pb-16 min-w-0">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={onBackOverview}
          className="inline-flex items-center gap-1 text-muted hover:text-foreground font-medium transition-colors duration-150"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Markets</span>
        </button>
        <span className="text-muted">/</span>
        <button
          type="button"
          onClick={() => onOpenCategory(symbol.category)}
          className="text-muted hover:text-foreground font-medium transition-colors duration-150"
        >
          {catLabel}
        </button>
        <span className="text-muted">/</span>
        <span className="font-semibold text-foreground font-mono">{symbol.symbol}</span>
      </div>

      {/* Symbol Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-border">
        <div className="space-y-4 min-w-0">
          <div className="flex items-center gap-4 min-w-0">
            <SymbolLogo
              logoUrl={symbol.logoUrl}
              secondaryLogoUrl={symbol.secondaryLogoUrl}
              symbol={symbol.symbol}
              name={symbol.name}
              size="lg"
            />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
                {symbol.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted mt-1">
                <span className="font-mono font-semibold text-foreground">{symbol.symbol}</span>
                <span>·</span>
                <span>{symbol.exchange}</span>
                {symbol.sector && (
                  <>
                    <span>·</span>
                    <span>{symbol.sector}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight text-foreground">
              {formatPrice(symbol.price, symbol.decimals)}
            </span>
            <span className="text-sm font-medium uppercase text-muted">
              {symbol.currency}
            </span>
            <span
              className={`text-lg font-semibold tabular-nums ${
                priceDelta >= 0 ? 'text-up' : 'text-down'
              }`}
            >
              {priceDelta >= 0 ? '+' : '−'}
              {formatPrice(Math.abs(priceDelta), symbol.decimals)}
            </span>
            <PriceChange value={symbol.changePct} className="text-lg font-semibold" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5">
            <GitCompare className="w-4 h-4 text-muted" />
            <select
              aria-label="Compare with benchmark"
              value={compareTicker}
              onChange={(e) => setCompareTicker(e.target.value)}
              className="min-h-10 rounded-control border border-border bg-surface px-3 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            >
              <option value="">Compare symbol...</option>
              {compareBenchmarks.map((b) => (
                <option key={b} value={b}>
                  vs {b}
                </option>
              ))}
            </select>
          </div>

          <Button
            tone={isWatched ? 'ink' : 'quiet'}
            onClick={() => onToggleWatch(symbol.symbol)}
          >
            <Star className={`w-4 h-4 ${isWatched ? 'fill-current text-warn' : ''}`} />
            <span>{isWatched ? 'In watchlist' : 'Add to watchlist'}</span>
          </Button>
        </div>
      </div>

      {/* Key Statistics Strip (1px hairline dividers, no boxed sub-cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-4 sm:divide-x divide-border/60 border-b border-border pb-6">
        <div className="pr-4">
          <div className="text-xs text-muted">Market cap</div>
          <div className="text-base font-semibold tabular-nums text-foreground mt-1">
            {symbol.marketCap ?? (symbol.marketCapB ? `${symbol.marketCapB} B` : '—')}
          </div>
        </div>
        <div className="sm:px-4">
          <div className="text-xs text-muted">Volume (24h)</div>
          <div className="text-base font-semibold tabular-nums text-foreground mt-1">
            {symbol.volume ?? '—'}
          </div>
        </div>
        <div className="sm:px-4">
          <div className="text-xs text-muted">P/E ratio (TTM)</div>
          <div className="text-base font-semibold tabular-nums text-foreground mt-1">
            {symbol.pe ? symbol.pe.toFixed(2) : '—'}
          </div>
        </div>
        <div className="sm:px-4">
          <div className="text-xs text-muted">Basic EPS (TTM)</div>
          <div className="text-base font-semibold tabular-nums text-foreground mt-1">
            {symbol.eps ? `${symbol.eps.toFixed(2)} ${symbol.currency}` : '—'}
          </div>
        </div>
        <div className="sm:px-4">
          <div className="text-xs text-muted">
            {symbol.extraLabel ?? 'Dividend yield'}
          </div>
          <div className="text-base font-semibold tabular-nums text-foreground mt-1">
            {symbol.extraValue ??
              (symbol.divYield !== undefined ? `${symbol.divYield.toFixed(2)}%` : '—')}
          </div>
        </div>
        <div className="sm:pl-4 col-span-2 sm:col-span-1">
          <div className="text-xs text-muted">52-week range</div>
          <div className="mt-2 space-y-1">
            <div className="relative h-1.5 rounded-full bg-border">
              <span
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary"
                style={{ left: `${rangePos}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] tabular-nums text-muted">
              <span>{formatPrice(low52, symbol.decimals)}</span>
              <span>{formatPrice(high52, symbol.decimals)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Superchart + Technicals Side-by-Side */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 min-w-0">
          <MarketChart
            symbol={symbol}
            compareSymbol={compareSymbol}
            showToolbar={true}
            height={340}
          />
        </div>

        <Surface className="xl:col-span-4 p-5 border border-border space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Technicals
          </h2>
          <TechnicalGauge rating={symbol.rating} />
        </Surface>
      </div>

      {/* Related Peers */}
      {peers.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Related {catLabel.toLowerCase()} symbols
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {peers.map((peer) => (
              <button
                key={peer.symbol}
                type="button"
                onClick={() => onSelectSymbol(peer.symbol)}
                className="flex items-center justify-between gap-3 rounded-card bg-surface hover:bg-surface-hover p-3.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <SymbolLogo
                    logoUrl={peer.logoUrl}
                    secondaryLogoUrl={peer.secondaryLogoUrl}
                    symbol={peer.symbol}
                    name={peer.name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                      {peer.name}
                    </div>
                    <div className="text-xs text-muted font-mono">{peer.symbol}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold tabular-nums text-foreground">
                    {formatPrice(peer.price, peer.decimals)}
                  </div>
                  <PriceChange value={peer.changePct} className="text-xs" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
