import React, { useEffect, useState } from 'react';
import type { MarketSymbol } from '../data/marketsData';
import { formatPrice, PriceChange, SymbolLogo } from './ui';

export function ProTickerTape({
  symbols,
  onSelectSymbol,
}: {
  symbols: MarketSymbol[];
  onSelectSymbol: (symbol: string) => void;
}) {
  const [timeUtc, setTimeUtc] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().slice(17, 25) + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const tapeTickers = [
    'SPX',
    'NDX',
    'DJI',
    'NVDA',
    'AAPL',
    'BTCUSD',
    'ETHUSD',
    'GC1!',
    'CL1!',
    'EURUSD',
    'USDJPY',
    'US10Y',
    'SPY',
    'QQQ',
    'TSLA',
  ];

  const tapeItems = tapeTickers
    .map((t) => symbols.find((s) => s.symbol === t))
    .filter((s): s is MarketSymbol => Boolean(s));

  return (
    <div className="bg-surface border-b border-border text-xs select-none min-w-0">
      <div className="max-w-[90rem] mx-auto px-4 flex items-center justify-between gap-3 h-8">
        {/* Pro session status badges */}
        <div className="hidden lg:flex items-center gap-3 shrink-0 text-[11px] font-mono text-muted divide-x divide-border/60">
          <div className="flex items-center gap-1.5 pr-3">
            <span className="w-2 h-2 rounded-full bg-up animate-pulse" />
            <span className="font-semibold text-foreground">PRO FEED</span>
          </div>
          <div className="flex items-center gap-2 px-3">
            <span>NYSE <span className="text-up font-semibold">OPEN</span></span>
            <span>·</span>
            <span>NASDAQ <span className="text-up font-semibold">OPEN</span></span>
            <span>·</span>
            <span>LSE <span className="text-muted">CLOSED</span></span>
            <span>·</span>
            <span>TSE <span className="text-muted">CLOSED</span></span>
          </div>
          <div className="pl-3 tabular-nums text-foreground">{timeUtc}</div>
        </div>

        {/* Streaming horizontal ticker marquee */}
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-5 py-1">
          {tapeItems.concat(tapeItems).map((item, idx) => (
            <button
              key={`${item.symbol}-${idx}`}
              type="button"
              onClick={() => onSelectSymbol(item.symbol)}
              className="inline-flex items-center gap-2 hover:bg-surface-hover px-2 py-0.5 rounded-sm transition-colors duration-150 shrink-0 text-left"
            >
              <SymbolLogo
                logoUrl={item.logoUrl}
                secondaryLogoUrl={item.secondaryLogoUrl}
                symbol={item.symbol}
                name={item.name}
                size="xs"
              />
              <span className="font-mono font-semibold text-foreground">{item.symbol}</span>
              <span className="tabular-nums font-medium text-foreground">
                {formatPrice(item.price, item.decimals)}
              </span>
              <PriceChange value={item.changePct} className="text-[11px]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
