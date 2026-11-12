import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import type { MarketSymbol, PaperPosition } from '../data/marketsData';
import { formatPrice, PriceChange } from './ui';

export function PaperTradingWidget({
  symbol,
  positions,
  cashBalance,
  onOpenPosition,
  onClosePosition,
  onResetAccount,
}: {
  symbol: MarketSymbol;
  positions: PaperPosition[];
  cashBalance: number;
  onOpenPosition: (pos: Omit<PaperPosition, 'id' | 'timestamp'>) => void;
  onClosePosition: (id: string) => void;
  onResetAccount: () => void;
}) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<number>(Number(symbol.price.toFixed(symbol.decimals ?? 2)));
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const execPrice = orderType === 'MARKET' ? symbol.price : limitPrice;
  const orderTotal = execPrice * quantity;

  // Calculate portfolio values
  const unrealizedPl = positions.reduce((acc, pos) => {
    const isLong = pos.side === 'BUY';
    const delta = isLong ? symbol.price - pos.entryPrice : pos.entryPrice - symbol.price;
    return acc + delta * pos.quantity;
  }, 0);

  const portfolioValue = cashBalance + unrealizedPl;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;
    if (side === 'BUY' && orderTotal > cashBalance) {
      alert('Insufficient paper buying power.');
      return;
    }
    onOpenPosition({
      symbol: symbol.symbol,
      side,
      quantity,
      entryPrice: execPrice,
    });
    setSuccessMsg(`Simulated ${side} order executed for ${quantity} shares of ${symbol.symbol} @ ${formatPrice(execPrice, symbol.decimals)} ${symbol.currency}`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-w-0">
      {/* Order Ticket Form */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Order Execution Ticket
          </h3>
          <span className="text-xs text-muted">Paper Trading (Simulated)</span>
        </div>

        <form onSubmit={handleSubmitOrder} className="border border-border rounded-card p-4 space-y-4 bg-surface/40">
          {/* Side Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide('BUY')}
              className={`py-2 rounded-control font-bold text-sm transition-colors duration-150 ${
                side === 'BUY'
                  ? 'bg-up text-white shadow-sm'
                  : 'bg-surface text-muted hover:text-foreground'
              }`}
            >
              BUY / LONG
            </button>
            <button
              type="button"
              onClick={() => setSide('SELL')}
              className={`py-2 rounded-control font-bold text-sm transition-colors duration-150 ${
                side === 'SELL'
                  ? 'bg-down text-white shadow-sm'
                  : 'bg-surface text-muted hover:text-foreground'
              }`}
            >
              SELL / SHORT
            </button>
          </div>

          {/* Order Type */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOrderType('MARKET')}
              className={`flex-1 py-1 text-xs font-semibold rounded-control transition-colors duration-150 ${
                orderType === 'MARKET' ? 'bg-ink-button text-ink-button-fg' : 'border border-border text-muted hover:text-foreground'
              }`}
            >
              Market
            </button>
            <button
              type="button"
              onClick={() => setOrderType('LIMIT')}
              className={`flex-1 py-1 text-xs font-semibold rounded-control transition-colors duration-150 ${
                orderType === 'LIMIT' ? 'bg-ink-button text-ink-button-fg' : 'border border-border text-muted hover:text-foreground'
              }`}
            >
              Limit
            </button>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted font-medium flex justify-between">
              <span>Quantity (Shares / Units)</span>
              <span>Available Cash: ${formatPrice(cashBalance, 2)}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full min-h-10 rounded-control border border-border bg-surface px-3 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
              <div className="flex gap-1 shrink-0">
                {[10, 50, 100].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className="px-2 py-1 text-xs rounded-control border border-border hover:bg-surface-hover text-muted"
                  >
                    +{q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Limit Price Input */}
          {orderType === 'LIMIT' && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted font-medium">
                Limit Price ({symbol.currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || symbol.price)}
                className="w-full min-h-10 rounded-control border border-border bg-surface px-3 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
          )}

          {/* Order Summary Line */}
          <div className="pt-2 border-t border-border/60 text-xs space-y-1">
            <div className="flex justify-between text-muted">
              <span>Estimated Execution Price</span>
              <span className="font-semibold text-foreground">
                {formatPrice(execPrice, symbol.decimals)} {symbol.currency}
              </span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Estimated Order Value</span>
              <span className="font-bold text-foreground">
                ${formatPrice(orderTotal, 2)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full min-h-11 rounded-control font-bold text-sm text-white shadow-sm transition-all duration-150 hover:brightness-105 active:translate-y-px ${
              side === 'BUY' ? 'bg-up' : 'bg-down'
            }`}
          >
            Submit Simulated {side} Order
          </button>

          {successMsg && (
            <div className="p-2.5 bg-up/15 text-up rounded-control text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </form>
      </div>

      {/* Positions & Account Summary */}
      <div className="lg:col-span-7 space-y-4">
        {/* Account Header Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border border-border rounded-card bg-surface/30">
          <div>
            <div className="text-xs text-muted">Total Paper Equity</div>
            <div className="text-2xl font-bold tabular-nums text-foreground mt-0.5">
              ${formatPrice(portfolioValue, 2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted">Unrealized P&L</div>
            <div className={`text-xl font-bold tabular-nums mt-0.5 ${unrealizedPl >= 0 ? 'text-up' : 'text-down'}`}>
              {unrealizedPl >= 0 ? '+' : '−'}${formatPrice(Math.abs(unrealizedPl), 2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted">Buying Power</div>
            <div className="text-xl font-bold tabular-nums text-foreground mt-0.5">
              ${formatPrice(cashBalance, 2)}
            </div>
          </div>
          <button
            type="button"
            onClick={onResetAccount}
            title="Reset simulated trading balance to $100,000"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium border border-border hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>

        {/* Open Positions Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Open Positions ({positions.length})
          </h4>

          {positions.length === 0 ? (
            <div className="p-8 text-center border border-border rounded-card text-muted text-xs">
              No open positions. Use the order ticket to practice paper trading without capital risk.
            </div>
          ) : (
            <div className="border border-border rounded-card overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3 text-right">Shares</th>
                    <th className="py-2.5 px-3 text-right">Entry</th>
                    <th className="py-2.5 px-3 text-right">Current</th>
                    <th className="py-2.5 px-3 text-right">P&L ($)</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-mono tabular-nums">
                  {positions.map((pos) => {
                    const isLong = pos.side === 'BUY';
                    const curPrice = pos.symbol === symbol.symbol ? symbol.price : pos.entryPrice;
                    const delta = isLong ? curPrice - pos.entryPrice : pos.entryPrice - curPrice;
                    const plDollars = delta * pos.quantity;
                    const plPct = ((delta / pos.entryPrice) * 100).toFixed(2);

                    return (
                      <tr key={pos.id} className="hover:bg-surface-hover">
                        <td className="py-2 px-3 font-semibold text-foreground">{pos.symbol}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isLong ? 'bg-up/15 text-up' : 'bg-down/15 text-down'}`}>
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-foreground">{pos.quantity}</td>
                        <td className="py-2 px-3 text-right text-muted">{formatPrice(pos.entryPrice, 2)}</td>
                        <td className="py-2 px-3 text-right text-foreground">{formatPrice(curPrice, 2)}</td>
                        <td className={`py-2 px-3 text-right font-bold ${plDollars >= 0 ? 'text-up' : 'text-down'}`}>
                          {plDollars >= 0 ? '+' : '−'}${formatPrice(Math.abs(plDollars), 2)} ({plPct}%)
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => onClosePosition(pos.id)}
                            className="px-2 py-1 rounded bg-surface hover:bg-down hover:text-white text-muted text-[11px] font-sans font-medium transition-colors"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
