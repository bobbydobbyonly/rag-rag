import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  ChevronLeft,
  DollarSign,
  FileText,
  GitCompare,
  Layers,
  Newspaper,
  Star,
} from 'lucide-react';
import {
  BREAKING_MARKET_NEWS,
  CATEGORY_TABS,
  type AssetCategory,
  type MarketSymbol,
  type PaperPosition,
  type PriceAlert,
  type TechnicalRating,
} from '../data/marketsData';
import { AlertsModal } from './AlertsModal';
import { FinancialsWidget } from './FinancialsWidget';
import { MarketChart } from './MarketChart';
import { OrderBookWidget } from './OrderBookWidget';
import { PaperTradingWidget } from './PaperTradingWidget';
import { Button, formatPrice, PriceChange, Surface, SymbolLogo } from './ui';

export type SymbolTab = 'chart' | 'orderbook' | 'financials' | 'trading' | 'technicals' | 'news';

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
    <div className="flex flex-col items-center space-y-3">
      <svg
        viewBox="0 0 260 136"
        className="w-full max-w-64 h-auto"
        role="img"
        aria-label={`Technical analysis gauge: ${rating}`}
      >
        <path
          d="M 56 112 A 74 74 0 0 1 204 112"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 56 112 A 74 74 0 0 1 98 45"
          fill="none"
          stroke="var(--color-down)"
          strokeOpacity="0.65"
          strokeWidth="12"
          strokeLinecap="butt"
        />
        <path
          d="M 162 45 A 74 74 0 0 1 204 112"
          fill="none"
          stroke="var(--color-up)"
          strokeOpacity="0.65"
          strokeWidth="12"
          strokeLinecap="butt"
        />
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
        <span className="text-down font-medium">Sell {counts.sell}</span>
        <span className="text-muted">Neutral {counts.neutral}</span>
        <span className="text-up font-medium">Buy {counts.buy}</span>
      </div>
      <p className="text-[11px] text-muted text-center max-w-sm">
        Summary of 26 technical indicators: Oscillators (RSI, Stochastic, CCI, MACD) and Moving Averages (SMA 20/50/200, EMA 10/20/50/100/200).
      </p>
    </div>
  );
}

export function SymbolScreen({
  symbol,
  allSymbols,
  isWatched,
  positions,
  alerts,
  cashBalance,
  onToggleWatch,
  onOpenPosition,
  onClosePosition,
  onResetTradingAccount,
  onAddAlert,
  onToggleAlert,
  onDeleteAlert,
  onSelectSymbol,
  onOpenCategory,
  onBackOverview,
}: {
  symbol: MarketSymbol;
  allSymbols: MarketSymbol[];
  isWatched: boolean;
  positions: PaperPosition[];
  alerts: PriceAlert[];
  cashBalance: number;
  onToggleWatch: (sym: string) => void;
  onOpenPosition: (pos: Omit<PaperPosition, 'id' | 'timestamp'>) => void;
  onClosePosition: (id: string) => void;
  onResetTradingAccount: () => void;
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdPrice' | 'triggered'>) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  onSelectSymbol: (sym: string) => void;
  onOpenCategory: (cat: AssetCategory) => void;
  onBackOverview: () => void;
}) {
  const [activeTab, setActiveTab] = useState<SymbolTab>('chart');
  const [compareTicker, setCompareTicker] = useState<string>('');
  const [alertsModalOpen, setAlertsModalOpen] = useState<boolean>(false);

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

  const symbolAlerts = alerts.filter((a) => a.symbol === symbol.symbol);

  return (
    <div className="space-y-8 pb-16 min-w-0">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAlertsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-semibold border border-border bg-surface hover:bg-surface-hover text-foreground transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-primary" />
            <span>Alerts</span>
            {symbolAlerts.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {symbolAlerts.length}
              </span>
            )}
          </button>

          <Button
            tone={isWatched ? 'ink' : 'quiet'}
            onClick={() => onToggleWatch(symbol.symbol)}
            className="min-h-8 text-xs px-3"
          >
            <Star className={`w-3.5 h-3.5 ${isWatched ? 'fill-current text-warn' : ''}`} />
            <span>{isWatched ? 'In watchlist' : 'Add to watchlist'}</span>
          </Button>
        </div>
      </div>

      {/* Symbol Main Price Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-4 border-b border-border">
        <div className="space-y-3 min-w-0">
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
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-surface font-semibold text-foreground border border-border">
                  PRO TIER 1
                </span>
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

        {/* Quick Trade & Compare */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5">
            <GitCompare className="w-4 h-4 text-muted" />
            <select
              aria-label="Compare with benchmark"
              value={compareTicker}
              onChange={(e) => setCompareTicker(e.target.value)}
              className="min-h-9 rounded-control border border-border bg-surface px-2.5 text-xs font-medium text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            >
              <option value="">Compare vs benchmark...</option>
              {compareBenchmarks.map((b) => (
                <option key={b} value={b}>
                  vs {b}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              onOpenPosition({
                symbol: symbol.symbol,
                side: 'BUY',
                quantity: 10,
                entryPrice: symbol.price,
              });
              setActiveTab('trading');
            }}
            className="px-3 py-1.5 rounded-control bg-up text-white font-bold text-xs hover:brightness-105 active:translate-y-px transition-all"
          >
            Quick BUY (10)
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenPosition({
                symbol: symbol.symbol,
                side: 'SELL',
                quantity: 10,
                entryPrice: symbol.price,
              });
              setActiveTab('trading');
            }}
            className="px-3 py-1.5 rounded-control bg-down text-white font-bold text-xs hover:brightness-105 active:translate-y-px transition-all"
          >
            Quick SELL (10)
          </button>
        </div>
      </div>

      {/* Pro Stats Strip (Hairline divided, no boxed cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-3 sm:divide-x divide-border/60 border-b border-border pb-4 text-xs">
        <div className="pr-4">
          <div className="text-muted">Market Cap</div>
          <div className="text-sm font-semibold tabular-nums text-foreground mt-0.5">
            {symbol.marketCap ?? (symbol.marketCapB ? `${symbol.marketCapB} B` : '—')}
          </div>
        </div>
        <div className="sm:px-4">
          <div className="text-muted">24h Volume</div>
          <div className="text-sm font-semibold tabular-nums text-foreground mt-0.5">
            {symbol.volume ?? '—'}
          </div>
        </div>
        <div className="sm:px-4">
          <div className="text-muted">P/E Ratio</div>
          <div className="text-sm font-semibold tabular-nums text-foreground mt-0.5">
            {symbol.pe ? symbol.pe.toFixed(2) : '—'}
          </div>
        </div>
        <div className="sm:px-4">
          <div className="text-muted">EPS (TTM)</div>
          <div className="text-sm font-semibold tabular-nums text-foreground mt-0.5">
            {symbol.eps ? `${symbol.eps.toFixed(2)} ${symbol.currency}` : '—'}
          </div>
        </div>
        <div className="sm:px-4">
          <div className="text-muted">{symbol.extraLabel ?? 'Div Yield'}</div>
          <div className="text-sm font-semibold tabular-nums text-foreground mt-0.5">
            {symbol.extraValue ?? (symbol.divYield !== undefined ? `${symbol.divYield.toFixed(2)}%` : '—')}
          </div>
        </div>
        <div className="sm:pl-4 col-span-2 sm:col-span-1">
          <div className="text-muted">52W Range</div>
          <div className="mt-1 space-y-1">
            <div className="relative h-1.5 rounded-full bg-border">
              <span
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary"
                style={{ left: `${rangePos}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] tabular-nums text-muted">
              <span>{formatPrice(low52, symbol.decimals)}</span>
              <span>{formatPrice(high52, symbol.decimals)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Workspace Tab Selector */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2" role="tablist">
        {(
          [
            { id: 'chart', label: 'Superchart', icon: BarChart3 },
            { id: 'orderbook', label: 'Order Book & DOM', icon: Layers },
            { id: 'trading', label: 'Paper Trading', icon: DollarSign },
            { id: 'financials', label: 'Financials & Multiples', icon: FileText },
            { id: 'technicals', label: 'Technicals Gauge', icon: Activity },
            { id: 'news', label: 'Market News', icon: Newspaper },
          ] as const
        ).map((tb) => {
          const Icon = tb.icon;
          const active = activeTab === tb.id;
          return (
            <button
              key={tb.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tb.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-control text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                active
                  ? 'bg-ink-button text-ink-button-fg'
                  : 'text-muted hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tb.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'chart' && (
        <div className="space-y-6">
          <MarketChart
            symbol={symbol}
            compareSymbol={compareSymbol}
            showToolbar={true}
            height={360}
            onQuickTrade={(side, price) => {
              onOpenPosition({
                symbol: symbol.symbol,
                side,
                quantity: 10,
                entryPrice: price,
              });
              setActiveTab('trading');
            }}
          />
        </div>
      )}

      {activeTab === 'orderbook' && (
        <OrderBookWidget symbol={symbol} />
      )}

      {activeTab === 'trading' && (
        <PaperTradingWidget
          symbol={symbol}
          positions={positions}
          cashBalance={cashBalance}
          onOpenPosition={onOpenPosition}
          onClosePosition={onClosePosition}
          onResetAccount={onResetTradingAccount}
        />
      )}

      {activeTab === 'financials' && (
        <FinancialsWidget symbol={symbol} />
      )}

      {activeTab === 'technicals' && (
        <Surface className="max-w-xl mx-auto p-6 border border-border">
          <TechnicalGauge rating={symbol.rating} />
        </Surface>
      )}

      {activeTab === 'news' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Breaking News & Analysis · {symbol.symbol}
          </h3>
          <div className="divide-y divide-border/50 border border-border rounded-card overflow-hidden">
            {BREAKING_MARKET_NEWS.map((item) => (
              <div key={item.id} className="p-4 bg-surface/20 hover:bg-surface-hover transition-colors space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-semibold text-primary">{item.source}</span>
                  <span>{item.timeAgo}</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                <p className="text-xs text-muted leading-relaxed">{item.summary}</p>
                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-surface border border-border text-foreground font-medium">
                    {item.category}
                  </span>
                  <span className="text-up font-semibold">● {item.sentiment}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Peers Strip */}
      {peers.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Related {catLabel.toLowerCase()} instruments
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {peers.map((peer) => (
              <button
                key={peer.symbol}
                type="button"
                onClick={() => onSelectSymbol(peer.symbol)}
                className="flex items-center justify-between gap-3 rounded-card bg-surface hover:bg-surface-hover p-3 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary border border-border/50"
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

      {/* Alerts Modal */}
      <AlertsModal
        isOpen={alertsModalOpen}
        onClose={() => setAlertsModalOpen(false)}
        symbol={symbol}
        alerts={alerts}
        onAddAlert={onAddAlert}
        onToggleAlert={onToggleAlert}
        onDeleteAlert={onDeleteAlert}
      />
    </div>
  );
}
