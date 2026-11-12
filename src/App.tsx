import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  BookmarkCheck,
  ChevronDown,
  Columns2,
  DollarSign,
  Grid2X2,
  LayoutGrid,
  Menu,
  Moon,
  Pause,
  Play,
  Rows2,
  Search,
  Square,
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
  type PaperPosition,
  type PriceAlert,
} from './data/marketsData';
import { CategoryScreen } from './components/CategoryScreen';
import { MultiChartGrid } from './components/MultiChartGrid';
import { OverviewScreen } from './components/OverviewScreen';
import { ProTickerTape } from './components/ProTickerTape';
import { SearchModal } from './components/SearchModal';
import { SymbolScreen } from './components/SymbolScreen';
import { Button, formatPrice } from './components/ui';
import { WatchlistDrawer } from './components/WatchlistDrawer';

const WATCHLIST_STORAGE_KEY = 'tv_markets_watchlist_v1';
const THEME_STORAGE_KEY = 'tv_markets_theme_v1';
const POSITIONS_STORAGE_KEY = 'tv_markets_positions_v1';
const BALANCE_STORAGE_KEY = 'tv_markets_balance_v1';
const ALERTS_STORAGE_KEY = 'tv_markets_alerts_v1';

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

export type ChartLayoutMode = 'single' | 'split-h' | 'split-v' | 'quad';

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

function loadPositions(): PaperPosition[] {
  try {
    const raw = window.localStorage.getItem(POSITIONS_STORAGE_KEY);
    if (!raw) {
      return [
        {
          id: 'pos-1',
          symbol: 'NVDA',
          side: 'BUY',
          quantity: 25,
          entryPrice: 164.2,
          timestamp: Date.now() - 86400000,
        },
        {
          id: 'pos-2',
          symbol: 'BTCUSD',
          side: 'BUY',
          quantity: 0.5,
          entryPrice: 94800.0,
          timestamp: Date.now() - 172800000,
        },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadBalance(): number {
  try {
    const raw = window.localStorage.getItem(BALANCE_STORAGE_KEY);
    return raw ? parseFloat(raw) || 100000 : 100000;
  } catch {
    return 100000;
  }
}

function loadAlerts(): PriceAlert[] {
  try {
    const raw = window.localStorage.getItem(ALERTS_STORAGE_KEY);
    if (!raw) {
      return [
        {
          id: 'al-1',
          symbol: 'BTCUSD',
          targetPrice: 100000,
          condition: 'ABOVE',
          createdPrice: 98420.5,
          active: true,
          triggered: false,
        },
        {
          id: 'al-2',
          symbol: 'NVDA',
          targetPrice: 180,
          condition: 'ABOVE',
          createdPrice: 171.48,
          active: true,
          triggered: false,
        },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadTheme(): 'light' | 'dark' {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'dark' || raw === 'light') return raw;
    return 'dark'; // Pro trading terminals look stunning in dark mode
  } catch {
    return 'dark';
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

  // Layout mode: single, 2-split horizontal, 2-split vertical, quad
  const [layoutMode, setLayoutMode] = useState<ChartLayoutMode>('single');
  const [layoutMenuOpen, setLayoutMenuOpen] = useState<boolean>(false);

  const [activeCategory, setActiveCategory] = useState<AssetCategory>('overview');
  const [activeSymbolId, setActiveSymbolId] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string>('US');
  const [countryMenuOpen, setCountryMenuOpen] = useState<boolean>(false);

  const [watchlist, setWatchlist] = useState<string[]>(loadWatchlist);
  const [watchlistOpen, setWatchlistOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // Paper trading state
  const [positions, setPositions] = useState<PaperPosition[]>(loadPositions);
  const [cashBalance, setCashBalance] = useState<number>(loadBalance);

  // Alerts state
  const [alerts, setAlerts] = useState<PriceAlert[]>(loadAlerts);

  const [statusNotice, setStatusNotice] = useState<{
    text: string;
    undoSymbol?: string;
  } | null>(null);
  const statusTimerRef = useRef<number | null>(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  // Sync positions & balance
  useEffect(() => {
    try {
      window.localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
      window.localStorage.setItem(BALANCE_STORAGE_KEY, cashBalance.toString());
      window.localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    } catch {}
  }, [positions, cashBalance, alerts]);

  // Global Ctrl+K / Cmd+K
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

  const showStatus = useCallback((text: string, undoSymbol?: string) => {
    if (statusTimerRef.current) {
      window.clearTimeout(statusTimerRef.current);
    }
    setStatusNotice({ text, undoSymbol });
    statusTimerRef.current = window.setTimeout(() => {
      setStatusNotice(null);
    }, 4500);
  }, []);

  // Simulated live ticks + alert triggers
  useEffect(() => {
    if (!liveFeed) return;
    const interval = window.setInterval(() => {
      setSymbols((prev) => {
        const nextSymbols = prev.map((item, idx) => {
          if (Math.random() > 0.32) return item;
          const basisMove = (Math.random() - 0.491) * 0.0022;
          const nextPrice = Math.max(0.000001, item.price * (1 + basisMove));
          const nextPct = Number((item.changePct + basisMove * 100).toFixed(2));

          // Check alerts for this symbol
          alerts.forEach((al) => {
            if (al.active && !al.triggered && al.symbol === item.symbol) {
              const triggered =
                (al.condition === 'ABOVE' && nextPrice >= al.targetPrice) ||
                (al.condition === 'BELOW' && nextPrice <= al.targetPrice);
              if (triggered) {
                showStatus(
                  `🔔 PRO ALERT: ${item.symbol} reached target price of ${formatPrice(al.targetPrice, 2)} ${item.currency}!`
                );
                setAlerts((all) =>
                  all.map((a) =>
                    a.id === al.id
                      ? { ...a, triggered: true, triggeredAt: new Date().toLocaleTimeString() }
                      : a
                  )
                );
              }
            }
          });

          return {
            ...item,
            price: nextPrice,
            changePct: idx % 8 === 0 ? item.changePct : nextPct,
          };
        });
        return nextSymbols;
      });
    }, 2400);
    return () => window.clearInterval(interval);
  }, [liveFeed, alerts, showStatus]);

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

  // Paper trading handlers
  const handleOpenPosition = useCallback((newPos: Omit<PaperPosition, 'id' | 'timestamp'>) => {
    const cost = newPos.quantity * newPos.entryPrice;
    if (newPos.side === 'BUY') {
      setCashBalance((b) => b - cost);
    } else {
      setCashBalance((b) => b + cost);
    }
    setPositions((prev) => [
      {
        id: `pos-${Date.now()}`,
        ...newPos,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  }, []);

  const handleClosePosition = useCallback(
    (id: string) => {
      const pos = positions.find((p) => p.id === id);
      if (!pos) return;
      const currentSym = symbols.find((s) => s.symbol === pos.symbol);
      const closePrice = currentSym ? currentSym.price : pos.entryPrice;
      const proceeds = pos.quantity * closePrice;

      if (pos.side === 'BUY') {
        setCashBalance((b) => b + proceeds);
      } else {
        const initialCost = pos.quantity * pos.entryPrice;
        const profit = initialCost - proceeds;
        setCashBalance((b) => b + initialCost + profit);
      }
      setPositions((prev) => prev.filter((p) => p.id !== id));
      showStatus(`Closed position for ${pos.quantity} ${pos.symbol} @ ${formatPrice(closePrice, 2)}`);
    },
    [positions, symbols, showStatus]
  );

  const handleResetTradingAccount = useCallback(() => {
    setPositions([]);
    setCashBalance(100000);
    showStatus('Paper trading account reset to initial $100,000 cash balance.');
  }, [showStatus]);

  // Alerts handlers
  const handleAddAlert = useCallback((newAlert: Omit<PriceAlert, 'id' | 'createdPrice' | 'triggered'>) => {
    const cur = symbols.find((s) => s.symbol === newAlert.symbol);
    setAlerts((prev) => [
      {
        id: `al-${Date.now()}`,
        ...newAlert,
        createdPrice: cur?.price ?? 100,
        triggered: false,
      },
      ...prev,
    ]);
    showStatus(`Alert set for ${newAlert.symbol} ${newAlert.condition === 'ABOVE' ? '≥' : '≤'} ${newAlert.targetPrice}`);
  }, [symbols, showStatus]);

  const handleToggleAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  }, []);

  const handleDeleteAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    showStatus('Alert deleted');
  }, [showStatus]);

  const countryScope = useMemo(
    () => COUNTRY_SCOPES.find((c) => c.code === countryCode) ?? COUNTRY_SCOPES[0],
    [countryCode]
  );

  const activeSymbol = useMemo(
    () => (activeSymbolId ? symbols.find((s) => s.symbol === activeSymbolId) ?? null : null),
    [activeSymbolId, symbols]
  );

  // Total portfolio value
  const totalEquity = useMemo(() => {
    const unrealized = positions.reduce((acc, pos) => {
      const cur = symbols.find((s) => s.symbol === pos.symbol);
      const curPrice = cur ? cur.price : pos.entryPrice;
      const delta = pos.side === 'BUY' ? curPrice - pos.entryPrice : pos.entryPrice - curPrice;
      return acc + delta * pos.quantity;
    }, 0);
    return cashBalance + unrealized;
  }, [positions, symbols, cashBalance]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh flex flex-col bg-background text-foreground font-sans">
        {/* PRO LIVE TICKER TAPE */}
        <ProTickerTape symbols={symbols} onSelectSymbol={handleSelectSymbol} />

        {/* PRO TERMINAL TOP HEADER */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
            {/* Left Brand + Pro Tier Badge */}
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setLayoutMode('single');
                  handleOpenCategory('overview');
                }}
                className="inline-flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-foreground shrink-0 focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
              >
                <TradingViewMark />
                <span className="hidden sm:inline">TradingView</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary text-primary-foreground font-extrabold uppercase tracking-wider">
                  PRO
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Open symbol search"
                className="hidden sm:inline-flex items-center gap-2 min-h-8 px-3 rounded-full bg-surface hover:bg-surface-hover border border-border text-xs text-muted transition-colors duration-150 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Markets</span>
                <span className="text-[10px] font-mono text-muted/80 ml-2">[⌘K]</span>
              </button>

              <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode('single');
                    handleOpenCategory('overview');
                  }}
                  className={`px-2.5 py-1 rounded-control transition-colors ${
                    !activeSymbol && layoutMode === 'single' && activeCategory === 'overview'
                      ? 'text-primary font-bold bg-surface'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Markets
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode('single');
                    handleOpenCategory('stocks');
                  }}
                  className={`px-2.5 py-1 rounded-control transition-colors ${
                    !activeSymbol && activeCategory === 'stocks'
                      ? 'text-primary font-bold bg-surface'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Screener
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode('single');
                    handleOpenCategory('crypto');
                  }}
                  className={`px-2.5 py-1 rounded-control transition-colors ${
                    !activeSymbol && activeCategory === 'crypto'
                      ? 'text-primary font-bold bg-surface'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Crypto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode('single');
                    handleOpenCategory('bonds');
                  }}
                  className={`px-2.5 py-1 rounded-control transition-colors ${
                    !activeSymbol && activeCategory === 'bonds'
                      ? 'text-primary font-bold bg-surface'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Yield Curves
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode('single');
                    handleOpenCategory('economy');
                  }}
                  className={`px-2.5 py-1 rounded-control transition-colors ${
                    !activeSymbol && activeCategory === 'economy'
                      ? 'text-primary font-bold bg-surface'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Economy
                </button>
              </nav>
            </div>

            {/* Right Tools: Multi-Chart Layouts, Paper Trading Balance, Watchlist, Theme */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Pro Multi-Chart Layout Switcher */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLayoutMenuOpen((v) => !v)}
                  aria-label="Multi-chart layouts"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-control text-xs font-semibold border border-border bg-surface hover:bg-surface-hover text-foreground transition-colors"
                >
                  {layoutMode === 'single' ? (
                    <Square className="w-3.5 h-3.5" />
                  ) : layoutMode === 'split-h' ? (
                    <Columns2 className="w-3.5 h-3.5 text-primary" />
                  ) : layoutMode === 'split-v' ? (
                    <Rows2 className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Grid2X2 className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span className="hidden md:inline">Layout</span>
                  <ChevronDown className="w-3 h-3 text-muted" />
                </button>

                {layoutMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-48 rounded-card bg-background border border-border shadow-xl p-1.5 space-y-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setLayoutMode('single');
                        setLayoutMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-control text-left ${
                        layoutMode === 'single' ? 'bg-surface font-bold text-primary' : 'hover:bg-surface-hover text-foreground'
                      }`}
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Single Chart</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLayoutMode('split-h');
                        setActiveSymbolId(null);
                        setLayoutMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-control text-left ${
                        layoutMode === 'split-h' ? 'bg-surface font-bold text-primary' : 'hover:bg-surface-hover text-foreground'
                      }`}
                    >
                      <Columns2 className="w-3.5 h-3.5" />
                      <span>Dual Split (2x1)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLayoutMode('split-v');
                        setActiveSymbolId(null);
                        setLayoutMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-control text-left ${
                        layoutMode === 'split-v' ? 'bg-surface font-bold text-primary' : 'hover:bg-surface-hover text-foreground'
                      }`}
                    >
                      <Rows2 className="w-3.5 h-3.5" />
                      <span>Stacked Split (1x2)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLayoutMode('quad');
                        setActiveSymbolId(null);
                        setLayoutMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-control text-left ${
                        layoutMode === 'quad' ? 'bg-surface font-bold text-primary' : 'hover:bg-surface-hover text-foreground'
                      }`}
                    >
                      <Grid2X2 className="w-3.5 h-3.5" />
                      <span>Quad Grid (2x2)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Simulated Paper Trading Balance Pill */}
              <button
                type="button"
                onClick={() => {
                  if (activeSymbol) {
                    // Symbol screen paper trading tab
                  } else {
                    handleSelectSymbol('NVDA');
                  }
                }}
                title="Paper Trading Account Balance"
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-control bg-surface border border-border text-xs tabular-nums font-mono"
              >
                <DollarSign className="w-3.5 h-3.5 text-up" />
                <span className="text-muted">Equity:</span>
                <span className="font-bold text-foreground">${formatPrice(totalEquity, 2)}</span>
              </button>

              {/* Pause/Resume Live Ticks */}
              <button
                type="button"
                onClick={() => setLiveFeed((v) => !v)}
                aria-pressed={liveFeed}
                title={liveFeed ? 'Pause real-time market simulation' : 'Resume real-time market simulation'}
                className="p-1.5 rounded-control text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                {liveFeed ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              {/* Watchlist Trigger */}
              <button
                type="button"
                onClick={() => setWatchlistOpen((v) => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-control text-xs font-semibold border border-border bg-surface hover:bg-surface-hover text-foreground transition-colors"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Watchlist</span>
                <span className="text-muted tabular-nums">({watchlist.length})</span>
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                className="p-1.5 rounded-control text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                className="md:hidden p-1.5 rounded-control text-muted hover:text-foreground"
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Global Alert Notification Banner */}
        {statusNotice && (
          <div className="bg-surface border-b border-border text-xs py-2 px-4">
            <div
              role="status"
              className="max-w-[90rem] mx-auto flex items-center justify-between gap-3"
            >
              <span className="text-foreground font-semibold">{statusNotice.text}</span>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="text-muted hover:text-foreground font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main View Area */}
        <main className="flex-1 w-full max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {/* MULTI-CHART PRO LAYOUT (When user selects Split or Quad) */}
          {layoutMode !== 'single' && !activeSymbol ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-foreground">
                    Pro Multi-Chart Station
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary font-bold">
                    {layoutMode.toUpperCase()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLayoutMode('single')}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Return to Single Overview
                </button>
              </div>

              <MultiChartGrid
                layout={layoutMode}
                symbols={symbols}
                onOpenSymbol={handleSelectSymbol}
                onQuickTrade={(side, price) => {
                  handleOpenPosition({
                    symbol: 'NVDA',
                    side,
                    quantity: 10,
                    entryPrice: price,
                  });
                }}
              />
            </div>
          ) : activeSymbol ? (
            <SymbolScreen
              symbol={activeSymbol}
              allSymbols={symbols}
              isWatched={watchlist.includes(activeSymbol.symbol)}
              positions={positions.filter((p) => p.symbol === activeSymbol.symbol)}
              alerts={alerts}
              cashBalance={cashBalance}
              onToggleWatch={handleToggleWatch}
              onOpenPosition={handleOpenPosition}
              onClosePosition={handleClosePosition}
              onResetTradingAccount={handleResetTradingAccount}
              onAddAlert={handleAddAlert}
              onToggleAlert={handleToggleAlert}
              onDeleteAlert={handleDeleteAlert}
              onSelectSymbol={handleSelectSymbol}
              onOpenCategory={handleOpenCategory}
              onBackOverview={() => setActiveSymbolId(null)}
            />
          ) : (
            <>
              {/* Markets Header & Country Switcher */}
              <div className="relative mb-5 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setCountryMenuOpen((v) => !v)}
                  aria-expanded={countryMenuOpen}
                  className="group inline-flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
                >
                  <h1 className="text-display tracking-tight text-foreground">
                    Markets, everywhere
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface group-hover:bg-surface-hover border border-border text-xs font-semibold text-foreground mt-1 shadow-xs">
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
                  <div className="absolute left-0 top-full mt-2 z-40 w-64 rounded-card bg-background border border-border shadow-2xl py-1.5 divide-y divide-border/40">
                    {COUNTRY_SCOPES.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCountryCode(c.code);
                          setCountryMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors ${
                          c.code === countryCode
                            ? 'bg-surface font-bold text-foreground'
                            : 'text-foreground hover:bg-surface'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <img
                            src={c.flagUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span>{c.name}</span>
                        </span>
                        <span className="text-xs font-mono text-muted">{c.currency}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sticky Category Tabs Bar */}
              <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-xs py-2.5 mb-6 border-b border-border">
                <div
                  role="tablist"
                  className="flex flex-wrap items-center gap-1.5 text-xs font-semibold"
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
                        className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors duration-150 ${
                          selected
                            ? 'bg-ink-button text-ink-button-fg'
                            : 'text-muted hover:text-foreground hover:bg-surface-hover'
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

        {/* Pro Terminal Footer */}
        <footer className="border-t border-border bg-surface/50 mt-auto">
          <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-bold tracking-tight text-sm">
                <TradingViewMark />
                <span>TradingView Markets Pro Terminal</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                <span>Real-Time Simulated Market Data</span>
                <span>·</span>
                <span>Level 2 Depth of Market</span>
                <span>·</span>
                <span>Paper Trading Suite</span>
                <span>·</span>
                <span>Institutional Macro Heatmaps</span>
              </div>
            </div>
          </div>
        </footer>

        {/* Symbol Search Modal */}
        <SearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          symbols={symbols}
          watchlist={watchlist}
          onToggleWatch={handleToggleWatch}
          onSelectSymbol={handleSelectSymbol}
        />

        {/* Watchlist Drawer */}
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
