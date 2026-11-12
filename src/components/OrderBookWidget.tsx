import React, { useEffect, useState } from 'react';
import {
  generateOrderBook,
  generateRecentTrades,
  type MarketSymbol,
  type OrderBookData,
  type RecentTrade,
} from '../data/marketsData';
import { formatPrice } from './ui';

export function OrderBookWidget({ symbol }: { symbol: MarketSymbol }) {
  const [orderBook, setOrderBook] = useState<OrderBookData>(() =>
    generateOrderBook(symbol.price, symbol.decimals)
  );
  const [trades, setTrades] = useState<RecentTrade[]>(() =>
    generateRecentTrades(symbol.price, symbol.decimals)
  );

  useEffect(() => {
    setOrderBook(generateOrderBook(symbol.price, symbol.decimals));
    setTrades(generateRecentTrades(symbol.price, symbol.decimals));
  }, [symbol.price, symbol.decimals, symbol.symbol]);

  const maxDepth = Math.max(
    ...orderBook.bids.map((b) => b.total),
    ...orderBook.asks.map((a) => a.total),
    1
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
      {/* Level 2 DOM Ladder */}
      <div className="lg:col-span-7 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-semibold text-foreground uppercase tracking-wide">
            Level 2 Depth of Market (DOM)
          </span>
          <span className="tabular-nums">
            Spread: <strong className="text-foreground">{orderBook.spread} {symbol.currency}</strong> ({orderBook.spreadPct}%)
          </span>
        </div>

        <div className="border border-border rounded-card overflow-hidden text-xs">
          {/* Header */}
          <div className="grid grid-cols-3 bg-surface px-3 py-2 font-semibold uppercase tracking-wider text-muted border-b border-border text-[11px]">
            <div>Price ({symbol.currency})</div>
            <div className="text-right">Size</div>
            <div className="text-right">Total Depth</div>
          </div>

          {/* Asks (Red) */}
          <div className="divide-y divide-border/30">
            {[...orderBook.asks].reverse().map((ask, idx) => {
              const depthPct = Math.round((ask.total / maxDepth) * 100);
              return (
                <div
                  key={`ask-${idx}`}
                  className="relative grid grid-cols-3 px-3 py-1.5 tabular-nums font-mono"
                >
                  <div
                    className="absolute inset-y-0 right-0 bg-down/15 pointer-events-none"
                    style={{ width: `${depthPct}%` }}
                  />
                  <div className="text-down font-semibold z-10">
                    {formatPrice(ask.price, symbol.decimals)}
                  </div>
                  <div className="text-right text-foreground z-10">{ask.size}</div>
                  <div className="text-right text-muted z-10">{ask.total}</div>
                </div>
              );
            })}
          </div>

          {/* Mid Spread Banner */}
          <div className="bg-surface px-3 py-1.5 flex items-center justify-between border-y border-border font-semibold text-xs">
            <span className="text-foreground tabular-nums">
              Last: {formatPrice(symbol.price, symbol.decimals)} {symbol.currency}
            </span>
            <span className="text-muted text-[11px]">
              Mid Market: {formatPrice((orderBook.bids[0].price + orderBook.asks[0].price) / 2, symbol.decimals)}
            </span>
          </div>

          {/* Bids (Green) */}
          <div className="divide-y divide-border/30">
            {orderBook.bids.map((bid, idx) => {
              const depthPct = Math.round((bid.total / maxDepth) * 100);
              return (
                <div
                  key={`bid-${idx}`}
                  className="relative grid grid-cols-3 px-3 py-1.5 tabular-nums font-mono"
                >
                  <div
                    className="absolute inset-y-0 right-0 bg-up/15 pointer-events-none"
                    style={{ width: `${depthPct}%` }}
                  />
                  <div className="text-up font-semibold z-10">
                    {formatPrice(bid.price, symbol.decimals)}
                  </div>
                  <div className="text-right text-foreground z-10">{bid.size}</div>
                  <div className="text-right text-muted z-10">{bid.total}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time & Sales Stream */}
      <div className="lg:col-span-5 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-semibold text-foreground uppercase tracking-wide">
            Time & Sales Tape
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-up animate-ping" />
            <span>Streaming</span>
          </span>
        </div>

        <div className="border border-border rounded-card overflow-hidden text-xs">
          <div className="grid grid-cols-3 bg-surface px-3 py-2 font-semibold uppercase tracking-wider text-muted border-b border-border text-[11px]">
            <div>Time</div>
            <div className="text-right">Price</div>
            <div className="text-right">Shares / Qty</div>
          </div>
          <div className="divide-y divide-border/40 font-mono tabular-nums">
            {trades.map((tr) => (
              <div key={tr.id} className="grid grid-cols-3 px-3 py-1.5 hover:bg-surface-hover">
                <div className="text-muted text-[11px]">{tr.time}</div>
                <div className={`text-right font-medium ${tr.side === 'BUY' ? 'text-up' : 'text-down'}`}>
                  {formatPrice(tr.price, symbol.decimals)}
                </div>
                <div className="text-right text-foreground font-semibold">{tr.size}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
