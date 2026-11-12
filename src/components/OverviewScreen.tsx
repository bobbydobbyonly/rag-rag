import React, { useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import {
  ALL_SYMBOLS,
  type AssetCategory,
  type CountryScope,
  EARNINGS_CALENDAR,
  ECONOMIC_CALENDAR_EVENTS,
  getSymbolsByTickers,
  IPO_CALENDAR,
  MACRO_HEATMAP_ROWS,
  type MarketSymbol,
} from '../data/marketsData';
import { MarketSummaryBlock } from './MarketSummaryBlock';
import { YieldCurveChart } from './YieldCurveChart';
import { formatPrice, PriceChange, SectionHeading, SymbolLogo } from './ui';

function QuoteRow({
  item,
  onSelectSymbol,
  isWatched,
  onToggleWatch,
  rightMetricLabel,
  rightMetricValue,
  usePreMarket = false,
}: {
  item: MarketSymbol;
  onSelectSymbol: (symbol: string) => void;
  isWatched: boolean;
  onToggleWatch: (symbol: string) => void;
  rightMetricLabel?: string;
  rightMetricValue?: string;
  usePreMarket?: boolean;
}) {
  const pct =
    usePreMarket && item.preMarketChangePct !== undefined
      ? item.preMarketChangePct
      : item.changePct;

  return (
    <div className="group flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 rounded-control hover:bg-surface-hover transition-colors duration-150 min-w-0">
      <button
        type="button"
        onClick={() => onSelectSymbol(item.symbol)}
        className="flex items-center gap-3 min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
      >
        <SymbolLogo
          logoUrl={item.logoUrl}
          secondaryLogoUrl={item.secondaryLogoUrl}
          symbol={item.symbol}
          name={item.name}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate" title={item.name}>
            {item.name}
          </div>
          <div className="text-xs text-muted flex items-center gap-1.5">
            <span className="font-mono uppercase tracking-wide">{item.symbol}</span>
            <span>·</span>
            <span>{item.exchange}</span>
          </div>
        </div>
      </button>

      <div className="flex items-center gap-3 shrink-0">
        {rightMetricValue ? (
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums text-foreground">
              {rightMetricValue}
            </div>
            <div className="text-xs text-muted flex items-center justify-end gap-1.5 tabular-nums">
              {rightMetricLabel && <span>{rightMetricLabel}</span>}
              <PriceChange value={pct} className="text-xs" />
            </div>
          </div>
        ) : (
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums text-foreground">
              {formatPrice(item.price, item.decimals)}{' '}
              <span className="text-[11px] font-normal uppercase text-muted">
                {item.currency}
              </span>
            </div>
            <div className="text-xs flex justify-end">
              <PriceChange value={pct} />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => onToggleWatch(item.symbol)}
          aria-label={
            isWatched
              ? `Remove ${item.symbol} from watchlist`
              : `Add ${item.symbol} to watchlist`
          }
          className={`p-1.5 rounded-control transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary ${
            isWatched
              ? 'text-warn'
              : 'text-muted/50 hover:text-foreground opacity-70 group-hover:opacity-100'
          }`}
        >
          <Star className={`w-4 h-4 ${isWatched ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}

function SeeAllButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline pt-2 focus-visible:outline-2 focus-visible:outline-primary rounded-sm whitespace-nowrap"
    >
      <span>{label}</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}

export function OverviewScreen({
  symbols,
  countryScope,
  watchlist,
  onToggleWatch,
  onSelectSymbol,
  onOpenCategory,
}: {
  symbols: MarketSymbol[];
  countryScope: CountryScope;
  watchlist: string[];
  onToggleWatch: (symbol: string) => void;
  onSelectSymbol: (symbol: string) => void;
  onOpenCategory: (cat: AssetCategory) => void;
}) {
  const [gainerSession, setGainerSession] = useState<'regular' | 'pre'>('regular');
  const [loserSession, setLoserSession] = useState<'regular' | 'pre'>('regular');

  const liveMap = new Map(symbols.map((s) => [s.symbol, s]));
  const pick = (tickers: string[]) =>
    tickers
      .map((t) => liveMap.get(t))
      .filter((s): s is MarketSymbol => Boolean(s));

  const indicesSummary = pick(countryScope.leadIndices);
  const worldIndices = pick([
    'NI225',
    'UKX',
    'DAX',
    'PX1',
    'FTMIB',
    'IBC',
    '000001',
    'HSI',
    'NIFTY',
    'IBOV',
  ]);

  const usStocksSummary = pick(
    countryScope.code === 'US'
      ? ['NVDA', 'AAPL', 'AMZN', 'GOOGL', 'TSLA', 'MSFT']
      : ['NVDA', 'AAPL', 'TSM', '0700', 'MC', 'BABA']
  );

  const communityTrends = pick(['NVDA', 'AMD', 'BABA', 'MSTR', 'SNDK', 'MU', 'ORCL', 'SPCX']);

  const allStocks = symbols.filter((s) => s.category === 'stocks');
  const highestVolumeStocks = [...allStocks]
    .sort((a, b) => (b.volumeNum ?? 0) - (a.volumeNum ?? 0))
    .slice(0, 6);
  const mostVolatileStocks = [...allStocks]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 6);
  const stockGainers = [...allStocks]
    .sort((a, b) =>
      gainerSession === 'pre'
        ? (b.preMarketChangePct ?? b.changePct) - (a.preMarketChangePct ?? a.changePct)
        : b.changePct - a.changePct
    )
    .slice(0, 6);
  const stockLosers = [...allStocks]
    .sort((a, b) =>
      loserSession === 'pre'
        ? (a.preMarketChangePct ?? a.changePct) - (b.preMarketChangePct ?? b.changePct)
        : a.changePct - b.changePct
    )
    .slice(0, 6);

  const worldStocksSummary = pick(['MSFT', '2222', 'TSM', 'MC', '0700', '005930']);
  const worldBiggestCompanies = pick(['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'SPCX']);
  const worldLargestEmployers = pick(['WMT', 'AMZN', '002594', 'ACN', 'JD', '2618']);

  const allCrypto = symbols.filter((s) => s.category === 'crypto');
  const cryptoSummary = pick(['BTCUSD', 'ETHUSD', 'USDTUSD', 'BNBUSD', 'USDCUSD', 'XRPUSD']);
  const cryptoMcap = [...allCrypto]
    .sort((a, b) => (b.marketCapB ?? 0) - (a.marketCapB ?? 0))
    .slice(0, 6);
  const cryptoTvl = pick(['ETHUSD', 'LDOUSD', 'AAVEUSD', 'ENAUSD', 'BNBUSD', 'UNIUSD']);
  const cryptoGainers = [...allCrypto].sort((a, b) => b.changePct - a.changePct).slice(0, 6);
  const cryptoLosers = [...allCrypto].sort((a, b) => a.changePct - b.changePct).slice(0, 6);

  const futuresSummary = pick(['GC1!', 'SI1!', 'HG1!', 'PL1!', 'CL1!', 'NG1!']);
  const energyFutures = pick(['CL1!', 'NG1!', 'BRN1!', 'RB1!', 'HO1!']);
  const agriFutures = pick(['KC1!', 'CT1!', 'ZS1!', 'ZW1!', 'SB1!', 'ZC1!']);
  const metalsFutures = pick(['GC1!', 'SI1!', 'PL1!', 'HG1!', 'PA1!', 'ALI1!']);
  const indexFutures = pick(['NQ1!', 'ES1!', 'YM1!', 'VX1!']);

  const forexSummary = pick(['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'AUDUSD', 'NZDUSD']);
  const forexMajors = pick(['EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD', 'USDCHF']);
  const currencyIndices = pick(['DXY', 'EXY', 'JXY', 'BXY', 'SXY', 'CXY']);

  const usBonds = pick(['US01Y', 'US02Y', 'US05Y', 'US10Y', 'US20Y', 'US30Y']);
  const major10YBonds = pick(['US10Y', 'EU10Y', 'GB10Y', 'DE10Y', 'FR10Y', 'IT10Y']);

  const corpFeatured = pick(['PEMX5055132', 'ORCL5500354', 'USU7010QAY8']);
  const corpLongTerm = pick(['US655844CJ5', 'US13645RAX2', 'ELEN', 'ORCL5500354', 'USU7010QAY8']);
  const corpFloating = pick(['MET.IS', 'CS5501682', 'BNS5491221', 'US29250NBT19', 'PEMX5055132']);

  const etfSummary = pick(['SPY', 'IBIT', 'VTI', 'QQQ', '1306', 'SMH']);
  const etfMostTraded = pick(['SPY', 'IBIT', 'QQQ', 'NVDL', 'MUU', 'SMH']);
  const etfHighestReturns = pick(['MUU', 'NVDL', 'USO', 'IBIT', 'SMH', 'QQQ']);
  const etfDividend = pick(['TSLY', '1306', 'VTI', 'SPY', 'QQQ', 'SIX']);

  const watchedSet = new Set(watchlist);

  return (
    <div className="space-y-16 pb-16 min-w-0">
      {/* 1. INDICES */}
      <section id="sec-indices" className="space-y-6 scroll-mt-28">
        <SectionHeading title="Indices" onClick={() => onOpenCategory('indices')} />
        <MarketSummaryBlock
          symbols={indicesSummary.length ? indicesSummary : getSymbolsByTickers(['SPX', 'NDX', 'DJI'])}
          onSelectSymbolPage={onSelectSymbol}
        />

        <div className="pt-4 space-y-3">
          <SectionHeading
            title="World indices"
            level="h3"
            onClick={() => onOpenCategory('indices')}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 divide-y md:divide-y-0 divide-border/50">
            <div className="divide-y divide-border/50">
              {worldIndices.slice(0, 5).map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                />
              ))}
            </div>
            <div className="divide-y divide-border/50">
              {worldIndices.slice(5, 10).map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                />
              ))}
            </div>
          </div>
          <SeeAllButton
            label="See all major indices"
            onClick={() => onOpenCategory('indices')}
          />
        </div>
      </section>

      {/* 2. US / REGIONAL STOCKS */}
      <section id="sec-stocks" className="space-y-8 pt-8 border-t border-border scroll-mt-28">
        <SectionHeading
          title={countryScope.stocksTitle}
          logoUrl={countryScope.flagUrl}
          onClick={() => onOpenCategory('stocks')}
        />
        <MarketSummaryBlock
          symbols={usStocksSummary}
          onSelectSymbolPage={onSelectSymbol}
        />

        {/* Community trends strip */}
        <div className="space-y-3">
          <SectionHeading title="Community trends" level="h3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {communityTrends.map((item) => (
              <button
                key={item.symbol}
                type="button"
                onClick={() => onSelectSymbol(item.symbol)}
                className="flex items-center justify-between gap-3 rounded-card bg-surface hover:bg-surface-hover px-3.5 py-3 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <SymbolLogo
                    logoUrl={item.logoUrl}
                    symbol={item.symbol}
                    name={item.name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                      {item.symbol}
                    </div>
                    <div className="text-xs text-muted truncate" title={item.name}>
                      {item.name}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold tabular-nums text-foreground">
                    {formatPrice(item.price, item.decimals)}
                  </div>
                  <PriceChange value={item.changePct} className="text-xs" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 4 Stock Movers Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          <div className="space-y-2">
            <SectionHeading
              title="Highest volume stocks"
              level="h3"
              onClick={() => onOpenCategory('stocks')}
            />
            <div className="divide-y divide-border/50">
              {highestVolumeStocks.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                  rightMetricLabel="Vol"
                  rightMetricValue={item.volume}
                />
              ))}
            </div>
            <SeeAllButton
              label="See all most actively traded stocks"
              onClick={() => onOpenCategory('stocks')}
            />
          </div>

          <div className="space-y-2">
            <SectionHeading
              title="Most volatile stocks"
              level="h3"
              onClick={() => onOpenCategory('stocks')}
            />
            <div className="divide-y divide-border/50">
              {mostVolatileStocks.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                />
              ))}
            </div>
            <SeeAllButton
              label="See all stocks with biggest price changes"
              onClick={() => onOpenCategory('stocks')}
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionHeading
                title="Stock gainers"
                level="h3"
                onClick={() => onOpenCategory('stocks')}
              />
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setGainerSession('regular')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                    gainerSession === 'regular'
                      ? 'bg-ink-button text-ink-button-fg'
                      : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  Regular hours
                </button>
                <button
                  type="button"
                  onClick={() => setGainerSession('pre')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                    gainerSession === 'pre'
                      ? 'bg-ink-button text-ink-button-fg'
                      : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  Pre-market
                </button>
              </div>
            </div>
            <div className="divide-y divide-border/50">
              {stockGainers.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                  usePreMarket={gainerSession === 'pre'}
                />
              ))}
            </div>
            <SeeAllButton
              label="See all stocks with largest daily growth"
              onClick={() => onOpenCategory('stocks')}
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionHeading
                title="Stock losers"
                level="h3"
                onClick={() => onOpenCategory('stocks')}
              />
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setLoserSession('regular')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                    loserSession === 'regular'
                      ? 'bg-ink-button text-ink-button-fg'
                      : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  Regular hours
                </button>
                <button
                  type="button"
                  onClick={() => setLoserSession('pre')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                    loserSession === 'pre'
                      ? 'bg-ink-button text-ink-button-fg'
                      : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  Pre-market
                </button>
              </div>
            </div>
            <div className="divide-y divide-border/50">
              {stockLosers.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                  usePreMarket={loserSession === 'pre'}
                />
              ))}
            </div>
            <SeeAllButton
              label="See all stocks with largest daily drop"
              onClick={() => onOpenCategory('stocks')}
            />
          </div>
        </div>

        {/* Earnings & IPO Calendars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-2">
          <div className="space-y-3 min-w-0">
            <SectionHeading title="Earnings calendar" level="h3" />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <th className="py-2 pr-3">Company</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">EPS est.</th>
                    <th className="py-2 pl-3 text-right">Actual / Cap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {EARNINGS_CALENDAR.map((ev) => (
                    <tr
                      key={ev.symbol}
                      onClick={() => {
                        if (ALL_SYMBOLS.some((s) => s.symbol === ev.symbol)) {
                          onSelectSymbol(ev.symbol);
                        }
                      }}
                      className="hover:bg-surface-hover cursor-pointer transition-colors duration-150"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <SymbolLogo
                            logoUrl={ev.logoUrl}
                            symbol={ev.symbol}
                            name={ev.name}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">{ev.name}</div>
                            <div className="text-xs text-muted font-mono">{ev.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted whitespace-nowrap">
                        {ev.date} · {ev.timing}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-foreground whitespace-nowrap">
                        {ev.epsEst}
                      </td>
                      <td className="py-2.5 pl-3 text-right tabular-nums whitespace-nowrap">
                        {ev.epsActual ? (
                          <span className="text-up font-medium">{ev.epsActual}</span>
                        ) : (
                          <span className="text-muted text-xs">{ev.marketCap}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 min-w-0">
            <SectionHeading title="IPO calendar" level="h3" />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <th className="py-2 pr-3">Issuer</th>
                    <th className="py-2 px-3">Listing</th>
                    <th className="py-2 px-3 text-right">Price range</th>
                    <th className="py-2 pl-3 text-right">Deal size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {IPO_CALENDAR.map((ipo) => (
                    <tr key={ipo.symbol} className="hover:bg-surface-hover transition-colors duration-150">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <SymbolLogo
                            logoUrl={ipo.logoUrl}
                            symbol={ipo.symbol}
                            name={ipo.name}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">{ipo.name}</div>
                            <div className="text-xs text-muted">
                              <span className="font-mono">{ipo.symbol}</span> · {ipo.exchange}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted whitespace-nowrap">
                        {ipo.date}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-xs text-foreground whitespace-nowrap">
                        {ipo.priceRange}
                      </td>
                      <td className="py-2.5 pl-3 text-right tabular-nums font-medium text-foreground whitespace-nowrap">
                        {ipo.dealSize}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WORLD STOCKS */}
      <section id="sec-world-stocks" className="space-y-8 pt-8 border-t border-border scroll-mt-28">
        <SectionHeading
          title="World stocks"
          onClick={() => onOpenCategory('world-stocks')}
        />
        <MarketSummaryBlock
          symbols={worldStocksSummary}
          onSelectSymbolPage={onSelectSymbol}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          <div className="space-y-2">
            <SectionHeading
              title="World biggest companies"
              level="h3"
              onClick={() => onOpenCategory('world-stocks')}
            />
            <div className="divide-y divide-border/50">
              {worldBiggestCompanies.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                  rightMetricLabel="Mkt cap"
                  rightMetricValue={`${item.marketCap} USD`}
                />
              ))}
            </div>
            <SeeAllButton
              label="See all world major companies"
              onClick={() => onOpenCategory('world-stocks')}
            />
          </div>

          <div className="space-y-2">
            <SectionHeading
              title="World largest employers"
              level="h3"
              onClick={() => onOpenCategory('world-stocks')}
            />
            <div className="divide-y divide-border/50">
              {worldLargestEmployers.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                  rightMetricLabel="Staff"
                  rightMetricValue={item.extraValue}
                />
              ))}
            </div>
            <SeeAllButton
              label="See all world biggest employers"
              onClick={() => onOpenCategory('world-stocks')}
            />
          </div>
        </div>
      </section>

      {/* 4. CRYPTO */}
      <section id="sec-crypto" className="space-y-8 pt-8 border-t border-border scroll-mt-28">
        <SectionHeading title="Crypto" onClick={() => onOpenCategory('crypto')} />
        <MarketSummaryBlock
          symbols={cryptoSummary}
          onSelectSymbolPage={onSelectSymbol}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          <div className="space-y-2">
            <SectionHeading
              title="Crypto market cap ranking"
              level="h3"
              onClick={() => onOpenCategory('crypto')}
            />
            <div className="divide-y divide-border/50">
              {cryptoMcap.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                  rightMetricLabel="Mkt cap"
                  rightMetricValue={item.marketCap}
                />
              ))}
            </div>
            <SeeAllButton
              label="See all coins by market cap"
              onClick={() => onOpenCategory('crypto')}
            />
          </div>

          <div className="space-y-2">
            <SectionHeading
              title="TVL ranking"
              level="h3"
              onClick={() => onOpenCategory('crypto')}
            />
            <div className="divide-y divide-border/50">
              {cryptoTvl.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                  rightMetricLabel="TVL"
                  rightMetricValue={item.extraValue}
                />
              ))}
            </div>
            <SeeAllButton
              label="See all protocols with highest TVL"
              onClick={() => onOpenCategory('crypto')}
            />
          </div>

          <div className="space-y-2">
            <SectionHeading
              title="Crypto gainers"
              level="h3"
              onClick={() => onOpenCategory('crypto')}
            />
            <div className="divide-y divide-border/50">
              {cryptoGainers.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <SectionHeading
              title="Crypto losers"
              level="h3"
              onClick={() => onOpenCategory('crypto')}
            />
            <div className="divide-y divide-border/50">
              {cryptoLosers.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. FUTURES AND COMMODITIES */}
      <section id="sec-futures" className="space-y-8 pt-8 border-t border-border scroll-mt-28">
        <SectionHeading
          title="Futures and commodities"
          onClick={() => onOpenCategory('futures')}
        />
        <MarketSummaryBlock
          symbols={futuresSummary}
          onSelectSymbolPage={onSelectSymbol}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          <div className="space-y-2">
            <SectionHeading title="Energy futures" level="h3" />
            <div className="divide-y divide-border/50">
              {energyFutures.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <SectionHeading title="Agricultural futures" level="h3" />
            <div className="divide-y divide-border/50">
              {agriFutures.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <SectionHeading title="Metals futures" level="h3" />
            <div className="divide-y divide-border/50">
              {metalsFutures.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <SectionHeading title="Index futures" level="h3" />
            <div className="divide-y divide-border/50">
              {indexFutures.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                />
              ))}
            </div>
            <SeeAllButton
              label="See all futures contracts"
              onClick={() => onOpenCategory('futures')}
            />
          </div>
        </div>
      </section>

      {/* 6. FOREX AND CURRENCIES */}
      <section id="sec-forex" className="space-y-8 pt-8 border-t border-border scroll-mt-28">
        <SectionHeading
          title="Forex and currencies"
          onClick={() => onOpenCategory('forex')}
        />
        <MarketSummaryBlock
          symbols={forexSummary}
          onSelectSymbolPage={onSelectSymbol}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          <div className="space-y-2">
            <SectionHeading title="Majors" level="h3" />
            <div className="divide-y divide-border/50">
              {forexMajors.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                />
              ))}
            </div>
            <SeeAllButton
              label="See all major currency pairs"
              onClick={() => onOpenCategory('forex')}
            />
          </div>

          <div className="space-y-2">
            <SectionHeading title="Currency indices" level="h3" />
            <div className="divide-y divide-border/50">
              {currencyIndices.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                />
              ))}
            </div>
            <SeeAllButton
              label="See all currency indices"
              onClick={() => onOpenCategory('forex')}
            />
          </div>
        </div>
      </section>

      {/* 7. GOVERNMENT BONDS */}
      <section id="sec-bonds" className="space-y-8 pt-8 border-t border-border scroll-mt-28">
        <SectionHeading
          title="Government bonds"
          onClick={() => onOpenCategory('bonds')}
        />
        <div className="space-y-3">
          <SectionHeading title="Yield curve" level="h3" />
          <YieldCurveChart />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          <div className="space-y-2">
            <SectionHeading title="US bonds" level="h3" />
            <div className="divide-y divide-border/50">
              {usBonds.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                  rightMetricLabel="Yield"
                  rightMetricValue={item.extraValue}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <SectionHeading title="Major 10Y bonds" level="h3" />
            <div className="divide-y divide-border/50">
              {major10YBonds.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                  rightMetricLabel="Yield"
                  rightMetricValue={item.extraValue}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. CORPORATE BONDS */}
      <section id="sec-corporate-bonds" className="space-y-8 pt-8 border-t border-border scroll-mt-28">
        <SectionHeading
          title="Corporate bonds"
          onClick={() => onOpenCategory('corporate-bonds')}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {corpFeatured.map((bond) => (
            <button
              key={bond.symbol}
              type="button"
              onClick={() => onSelectSymbol(bond.symbol)}
              className="flex flex-col justify-between gap-3 rounded-card bg-surface hover:bg-surface-hover p-4 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <div className="flex items-center gap-3 min-w-0">
                <SymbolLogo
                  logoUrl={bond.logoUrl}
                  symbol={bond.symbol}
                  name={bond.name}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate" title={bond.name}>
                    {bond.name}
                  </div>
                  <div className="text-xs text-muted font-mono">{bond.symbol}</div>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2 pt-2 border-t border-border/50 text-xs">
                <span className="text-muted">{bond.extraLabel}</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {bond.extraValue}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          <div className="space-y-2">
            <SectionHeading title="Long-term maturities" level="h3" />
            <div className="divide-y divide-border/50">
              {corpLongTerm.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                  rightMetricValue={item.extraValue}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <SectionHeading title="Floating-rate & high coupon" level="h3" />
            <div className="divide-y divide-border/50">
              {corpFloating.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                  rightMetricValue={item.extraValue}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. ETFs */}
      <section id="sec-etfs" className="space-y-8 pt-8 border-t border-border scroll-mt-28">
        <SectionHeading title="ETFs" onClick={() => onOpenCategory('etfs')} />
        <MarketSummaryBlock
          symbols={etfSummary}
          onSelectSymbolPage={onSelectSymbol}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
          <div className="space-y-2">
            <SectionHeading title="Most traded" level="h3" />
            <div className="divide-y divide-border/50">
              {etfMostTraded.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <SectionHeading title="Highest returns (1Y NAV)" level="h3" />
            <div className="divide-y divide-border/50">
              {etfHighestReturns.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                  rightMetricLabel="1Y"
                  rightMetricValue={item.extraValue}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <SectionHeading title="Dividend & income ETFs" level="h3" />
            <div className="divide-y divide-border/50">
              {etfDividend.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  item={item}
                  onSelectSymbol={onSelectSymbol}
                  isWatched={watchedSet.has(item.symbol)}
                  onToggleWatch={onToggleWatch}
                  rightMetricValue={
                    item.divYield ? `${item.divYield.toFixed(2)}% yield` : item.extraValue
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 10. ECONOMY */}
      <section id="sec-economy" className="space-y-8 pt-8 border-t border-border scroll-mt-28">
        <SectionHeading title="Economy" onClick={() => onOpenCategory('economy')} />

        <div className="space-y-3">
          <SectionHeading title="Economic indicators heatmap" level="h3" />
          <div className="overflow-x-auto border border-border rounded-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface text-[11px] font-semibold uppercase tracking-wider text-muted divide-x divide-border/60">
                  <th className="py-3 px-4">Country / Region</th>
                  <th className="py-3 px-4 text-right">GDP YoY</th>
                  <th className="py-3 px-4 text-right">Interest rate</th>
                  <th className="py-3 px-4 text-right">Inflation YoY</th>
                  <th className="py-3 px-4 text-right">Jobless rate</th>
                  <th className="py-3 px-4 text-right">Gov. debt / GDP</th>
                  <th className="py-3 px-4 text-right">Current acct / GDP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm tabular-nums">
                {MACRO_HEATMAP_ROWS.map((row) => (
                  <tr key={row.code} className="divide-x divide-border/60 hover:bg-surface-hover/50">
                    <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={row.flagUrl}
                          alt={row.country}
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <span>{row.country}</span>
                      </div>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-medium ${
                        row.gdpYoY >= 3 ? 'bg-up/15 text-up' : 'text-foreground'
                      }`}
                    >
                      {row.gdpYoY.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {row.interestRate.toFixed(2)}%
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-medium ${
                        row.inflationYoY >= 3.5 ? 'bg-down/15 text-down' : 'text-foreground'
                      }`}
                    >
                      {row.inflationYoY.toFixed(1)}%
                    </td>
                    <td
                      className={`py-3 px-4 text-right ${
                        row.joblessRate >= 6.5 ? 'text-down font-medium' : 'text-foreground'
                      }`}
                    >
                      {row.joblessRate.toFixed(1)}%
                    </td>
                    <td
                      className={`py-3 px-4 text-right ${
                        row.govDebtGdp >= 110 ? 'bg-warn/12 text-foreground font-medium' : 'text-foreground'
                      }`}
                    >
                      {row.govDebtGdp.toFixed(1)}%
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-medium ${
                        row.currentAccountGdp >= 0 ? 'text-up' : 'text-down'
                      }`}
                    >
                      {row.currentAccountGdp > 0 ? '+' : '−'}
                      {Math.abs(row.currentAccountGdp).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted">
            Latest reported national accounts and central bank policy rates across G20 benchmarks.
          </p>
        </div>

        <div className="space-y-3">
          <SectionHeading title="Economic calendar" level="h3" />
          <div className="overflow-x-auto border border-border rounded-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="py-2.5 px-4">Time (PT)</th>
                  <th className="py-2.5 px-4">Event</th>
                  <th className="py-2.5 px-4">Impact</th>
                  <th className="py-2.5 px-4 text-right">Actual</th>
                  <th className="py-2.5 px-4 text-right">Forecast</th>
                  <th className="py-2.5 px-4 text-right">Prior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-sm">
                {ECONOMIC_CALENDAR_EVENTS.map((ev) => (
                  <tr key={ev.id} className="hover:bg-surface-hover transition-colors duration-150">
                    <td className="py-2.5 px-4 font-mono text-xs text-muted whitespace-nowrap">
                      {ev.time}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={ev.flagUrl}
                          alt={ev.countryCode}
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                        <span className="font-medium text-foreground">{ev.event}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-xs whitespace-nowrap">
                      <span
                        className={
                          ev.impact === 'High'
                            ? 'text-down font-semibold'
                            : ev.impact === 'Medium'
                            ? 'text-warn font-medium'
                            : 'text-muted'
                        }
                      >
                        ● {ev.impact}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-foreground whitespace-nowrap">
                      {ev.actual}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-muted whitespace-nowrap">
                      {ev.forecast}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-muted whitespace-nowrap">
                      {ev.prior}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
