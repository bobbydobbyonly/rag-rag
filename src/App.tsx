import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookmarkCheck,
  ChevronDown,
  Menu,
  Moon,
  Pause,
  Play,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { MotionConfig } from 'motion/react';
import {
  ALL_SYMBOLS,
  type AssetCategory,
  CATEGORY_TABS,
  COUNTRY_SCOPES,
  type MarketSymbol,
} from './data/marketsData';
import { CategoryScreen } from './components/CategoryScreen';
import { OverviewScreen } from './components/OverviewScreen';
import { SearchModal } from './components/SearchModal';
import { SymbolScreen } from './components/SymbolScreen';
import { Button } from './components/ui';
import { WatchlistDrawer } from './components/WatchlistDrawer';

const WATCHLIST_STORAGE_KEY = 'tv_markets_watchlist_v1';
const THEME_STORAGE_KEY = 'tv_markets_theme_v1';
const DEFAULT_WATCHLIST = [
  'SPX',
  'NDX',
  'NVDA',
  'AAPL',
  'BTCUSD',
  'ETHUSD',
  'GC1!',
  'EURUSD',
  'US10Y',
];

function loadWatchlist(): string[] {
  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return DEFAULT_WATCHLIST;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
      return parsed;
    }
    return DEFAULT_WATCHLIST;
  } catch {
    return DEFAULT_WATCHLIST;
  }
}

function loadTheme(): 'light' | 'dark' {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'dark' || raw === 'light') return raw;
    return 'light';
  } catch {
    return 'light';
  }
}

function TradingViewMark() {
  return (
    <svg
      width="28"
      height="20"
      viewBox="0 0 36 28"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M14 22H7V11H0V4h14v18zM28 22h-8l7.5-18h8L28 22z" />
      <circle cx="20" cy="8" r="4" />
    </svg>
  );
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(loadTheme);
  const [symbols, setSymbols] = useState<MarketSymbol[]>(ALL_SYMBOLS);
  const [liveFeed, setLiveFeed] = useState<boolean>(true);

  const [activeCategory, setActiveCategory] = useState<AssetCategory>('overview');
  const [activeSymbolId, setActiveSymbolId] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string>('US');
  const [countryMenuOpen, setCountryMenuOpen] = useState<boolean>(false);

  const [watchlist, setWatchlist] = useState<string[]>(loadWatchlist);
  const [watchlistOpen, setWatchlistOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [lookFirstFailed, setLookFirstFailed] = useState<boolean>(false);

  const [statusNotice, setStatusNotice] = useState<{
    text: string;
    undoSymbol?: string;
  } | null>(null);
  const statusTimerRef = useRef<number | null>(null);

  // Sync theme attribute on <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage quota errors
    }
  }, [theme]);

  // Persist watchlist
  useEffect(() => {
    try {
      window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
    } catch {
      // Ignore storage quota errors
    }
  }, [watchlist]);

  // Global Ctrl+K / Cmd+K shortcut for Symbol Search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Gentle simulated live market ticks
  useEffect(() => {
    if (!liveFeed) return;
    const interval = window.setInterval(() => {
      setSymbols((prev) =>
        prev.map((item, idx) => {
          if (Math.random() > 0.28) return item;
          const basisMove = (Math.random() - 0.492) * 0.0024;
          const nextPrice = Math.max(0.000001, item.price * (1 + basisMove));
          const nextPct = Number((item.changePct + basisMove * 100).toFixed(2));
          return {
            ...item,
            price: nextPrice,
            changePct: idx % 9 === 0 ? item.changePct : nextPct,
          };
        })
      );
    }, 2800);
    return () => window.clearInterval(interval);
  }, [liveFeed]);

  const showStatus = useCallback((text: string, undoSymbol?: string) => {
    if (statusTimerRef.current) {
      window.clearTimeout(statusTimerRef.current);
    }
    setStatusNotice({ text, undoSymbol });
    statusTimerRef.current = window.setTimeout(() => {
      setStatusNotice(null);
    }, 4500);
  }, []);

  const handleToggleWatch = useCallback(
    (sym: string) => {
      setWatchlist((prev) => {
        const exists = prev.includes(sym);
        const next = exists ? prev.filter((x) => x !== sym) : [sym, ...prev];
        showStatus(
          exists ? `Removed ${sym} from watchlist` : `Added ${sym} to watchlist`,
          sym
        );
        return next;
      });
    },
    [showStatus]
  );

  const handleResetWatchlist = useCallback(() => {
    setWatchlist(DEFAULT_WATCHLIST);
    showStatus('Restored default watchlist');
  }, [showStatus]);

  const handleSelectSymbol = useCallback((sym: string) => {
    setActiveSymbolId(sym);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenCategory = useCallback((cat: AssetCategory) => {
    setActiveSymbolId(null);
    setActiveCategory(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const countryScope = useMemo(
    () => COUNTRY_SCOPES.find((c) => c.code === countryCode) ?? COUNTRY_SCOPES[0],
    [countryCode]
  );

  const activeSymbol = useMemo(
    () => (activeSymbolId ? symbols.find((s) => s.symbol === activeSymbolId) ?? null : null),
    [activeSymbolId, symbols]
  );

  const lookFirstSrc =
    theme === 'dark'
      ? 'https://static.tradingview.com/static/bundles/look-first-dark.8cb7462c584f600e8f31.svg'
      : 'https://static.tradingview.com/static/bundles/look-first-light.74b5bba06f657157cdb4.svg';

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh flex flex-col bg-background text-foreground">
        {/* TradingView Top Header */}
        <header className="sticky top-0 z-30 bg-background border-b border-border">
          <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
            {/* Brand + Search + Links */}
            <div className="flex items-center gap-4 lg:gap-6 min-w-0">
              <button
                type="button"
                onClick={() => handleOpenCategory('overview')}
                className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-foreground shrink-0 focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
              >
                <TradingViewMark />
                <span>TradingView</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Open symbol search"
                className="hidden sm:inline-flex items-center gap-2.5 min-h-9 px-3.5 rounded-full bg-surface hover:bg-surface-hover border border-border text-sm text-muted transition-colors duration-150 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted/80 ml-2">
                  [⌘K]
                </span>
              </button>

              <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenCategory('overview')}
                  className={`px-3 py-1.5 rounded-control text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                    !activeSymbol && activeCategory === 'overview'
                      ? 'text-primary font-semibold'
                      : 'text-foreground hover:bg-surface-hover'
                  }`}
                >
                  Markets
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCategory('stocks')}
                  className={`px-3 py-1.5 rounded-control text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                    !activeSymbol && activeCategory === 'stocks'
                      ? 'text-primary font-semibold'
                      : 'text-foreground hover:bg-surface-hover'
                  }`}
                >
                  Screener
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCategory('crypto')}
                  className={`px-3 py-1.5 rounded-control text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                    !activeSymbol && activeCategory === 'crypto'
                      ? 'text-primary font-semibold'
                      : 'text-foreground hover:bg-surface-hover'
                  }`}
                >
                  Crypto
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCategory('bonds')}
                  className={`px-3 py-1.5 rounded-control text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                    !activeSymbol && activeCategory === 'bonds'
                      ? 'text-primary font-semibold'
                      : 'text-foreground hover:bg-surface-hover'
                  }`}
                >
                  Yield curves
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCategory('economy')}
                  className={`px-3 py-1.5 rounded-control text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                    !activeSymbol && activeCategory === 'economy'
                      ? 'text-primary font-semibold'
                      : 'text-foreground hover:bg-surface-hover'
                  }`}
                >
                  Economy
                </button>
              </nav>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search symbols"
                className="sm:hidden p-2 rounded-control text-foreground hover:bg-surface-hover"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setLiveFeed((v) => !v)}
                aria-pressed={liveFeed}
                aria-label={liveFeed ? 'Pause simulated live quotes' : 'Resume simulated live quotes'}
                title={liveFeed ? 'Pause quote updates' : 'Resume quote updates'}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-control text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors duration-150 whitespace-nowrap"
              >
                {liveFeed ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{liveFeed ? 'Quotes active' : 'Quotes paused'}</span>
              </button>

              <button
                type="button"
                onClick={() => setWatchlistOpen((v) => !v)}
                aria-expanded={watchlistOpen}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs sm:text-sm font-medium border border-border bg-surface hover:bg-surface-hover text-foreground transition-colors duration-150 whitespace-nowrap"
              >
                <BookmarkCheck className="w-4 h-4 text-primary" />
                <span className="hidden sm:inline">Watchlist</span>
                <span className="tabular-nums text-muted">({watchlist.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
                className="p-2 rounded-control text-foreground hover:bg-surface-hover transition-colors duration-150"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              <Button
                tone="ink"
                onClick={() => handleSelectSymbol(activeSymbol?.symbol ?? 'SPX')}
                className="hidden sm:inline-flex min-h-9 px-3.5 text-xs sm:text-sm"
              >
                Supercharts
              </Button>

              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileNavOpen}
                className="md:hidden p-2 rounded-control text-foreground hover:bg-surface-hover"
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Collapsible Menu */}
          {mobileNavOpen && (
            <div className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-wrap gap-2">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    handleOpenCategory(tab.id);
                    setMobileNavOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    !activeSymbol && activeCategory === tab.id
                      ? 'bg-ink-button text-ink-button-fg'
                      : 'bg-surface text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Inline Status Line (role="status" for accessible Undo feedback) */}
        {statusNotice && (
          <div className="bg-surface border-b border-border">
            <div
              role="status"
              className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-xs"
            >
              <span className="text-foreground font-medium">{statusNotice.text}</span>
              <div className="flex items-center gap-3">
                {statusNotice.undoSymbol && (
                  <button
                    type="button"
                    onClick={() => {
                      const sym = statusNotice.undoSymbol!;
                      setStatusNotice(null);
                      handleToggleWatch(sym);
                    }}
                    className="font-semibold text-primary hover:underline"
                  >
                    Undo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStatusNotice(null)}
                  className="text-muted hover:text-foreground"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 w-full max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {activeSymbol ? (
            <SymbolScreen
              symbol={activeSymbol}
              allSymbols={symbols}
              isWatched={watchlist.includes(activeSymbol.symbol)}
              onToggleWatch={handleToggleWatch}
              onSelectSymbol={handleSelectSymbol}
              onOpenCategory={handleOpenCategory}
              onBackOverview={() => setActiveSymbolId(null)}
            />
          ) : (
            <>
              {/* Hero Heading: Markets, everywhere + Country Switcher */}
              <div className="relative mb-6">
                <button
                  type="button"
                  onClick={() => setCountryMenuOpen((v) => !v)}
                  aria-expanded={countryMenuOpen}
                  aria-haspopup="listbox"
                  className="group inline-flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
                >
                  <h1 className="text-display tracking-tight text-foreground">
                    Markets, everywhere
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface group-hover:bg-surface-hover border border-border text-xs font-medium text-foreground mt-1">
                    <img
                      src={countryScope.flagUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{countryScope.code}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted" />
                  </span>
                </button>

                {countryMenuOpen && (
                  <div
                    role="listbox"
                    aria-label="Select regional market focus"
                    className="absolute left-0 top-full mt-2 z-30 w-64 rounded-card bg-background border border-border shadow-(--shadow-float) py-1.5 divide-y divide-border/40"
                  >
                    {COUNTRY_SCOPES.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        role="option"
                        aria-selected={c.code === countryCode}
                        onClick={() => {
                          setCountryCode(c.code);
                          setCountryMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors duration-150 ${
                          c.code === countryCode
                            ? 'bg-surface-hover font-semibold text-foreground'
                            : 'text-foreground hover:bg-surface'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <img
                            src={c.flagUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span>{c.name}</span>
                        </span>
                        <span className="text-xs font-mono text-muted">{c.currency}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sticky Category Round-Tabs Bar */}
              <div className="sticky top-16 z-20 bg-background/95 py-3 mb-8 border-b border-border">
                <div
                  role="tablist"
                  aria-label="Market asset classes"
                  className="flex flex-wrap items-center gap-1.5"
                >
                  {CATEGORY_TABS.map((tab) => {
                    const selected = activeCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => handleOpenCategory(tab.id)}
                        className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary ${
                          selected
                            ? 'bg-ink-button text-ink-button-fg'
                            : 'text-foreground hover:bg-surface-hover'
                        }`}
                      >
                        {tab.id === 'stocks' ? countryScope.stocksTitle : tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeCategory === 'overview' ? (
                <OverviewScreen
                  symbols={symbols}
                  countryScope={countryScope}
                  watchlist={watchlist}
                  onToggleWatch={handleToggleWatch}
                  onSelectSymbol={handleSelectSymbol}
                  onOpenCategory={handleOpenCategory}
                />
              ) : (
                <CategoryScreen
                  category={activeCategory}
                  symbols={symbols}
                  watchlist={watchlist}
                  onToggleWatch={handleToggleWatch}
                  onSelectSymbol={handleSelectSymbol}
                  onBackOverview={() => handleOpenCategory('overview')}
                />
              )}
            </>
          )}
        </main>

        {/* TradingView Footer */}
        <footer className="border-t border-border bg-surface mt-auto">
          <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
                  <TradingViewMark />
                  <span>TradingView</span>
                </div>
                {!lookFirstFailed ? (
                  <img
                    src={lookFirstSrc}
                    alt="Look first / Then leap."
                    referrerPolicy="no-referrer"
                    onError={() => setLookFirstFailed(true)}
                    className="h-6 w-auto block"
                  />
                ) : (
                  <p className="text-sm font-semibold text-muted">Look first / Then leap.</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleOpenCategory(tab.id)}
                    className="text-muted hover:text-foreground transition-colors duration-150 whitespace-nowrap"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
              <span>
                Market data across indices, equities, crypto, futures, FX, sovereign & corporate bonds, and ETFs.
              </span>
              <span>Quotes in local instrument currencies · Simulated real-time feed</span>
            </div>
          </div>
        </footer>

        {/* Global Symbol Search Modal */}
        <SearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          symbols={symbols}
          watchlist={watchlist}
          onToggleWatch={handleToggleWatch}
          onSelectSymbol={handleSelectSymbol}
        />

        {/* Collapsible Right Watchlist Drawer */}
        <WatchlistDrawer
          isOpen={watchlistOpen}
          onClose={() => setWatchlistOpen(false)}
          watchlist={watchlist}
          symbols={symbols}
          onToggleWatch={handleToggleWatch}
          onResetWatchlist={handleResetWatchlist}
          onOpenSearch={() => setSearchOpen(true)}
          onSelectSymbol={handleSelectSymbol}
        />
      </div>
    </MotionConfig>
  );
}
