import React, { useState } from 'react';
import { Bell, BellRing, Check, Trash2, X } from 'lucide-react';
import type { MarketSymbol, PriceAlert } from '../data/marketsData';
import { formatPrice } from './ui';

export function AlertsModal({
  isOpen,
  onClose,
  symbol,
  alerts,
  onAddAlert,
  onToggleAlert,
  onDeleteAlert,
}: {
  isOpen: boolean;
  onClose: () => void;
  symbol: MarketSymbol;
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdPrice' | 'triggered'>) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
}) {
  const [targetPrice, setTargetPrice] = useState<number>(() =>
    Number((symbol.price * 1.02).toFixed(symbol.decimals ?? 2))
  );
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || targetPrice <= 0) return;
    onAddAlert({
      symbol: symbol.symbol,
      targetPrice,
      condition,
      active: true,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-background border border-border rounded-card shadow-2xl overflow-hidden p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Price Alerts · {symbol.symbol}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-control text-muted hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Alert Form */}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="text-xs text-muted">
            Current Price:{' '}
            <strong className="text-foreground font-mono">
              {formatPrice(symbol.price, symbol.decimals)} {symbol.currency}
            </strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted font-medium block mb-1">
                Trigger Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as 'ABOVE' | 'BELOW')}
                className="w-full min-h-10 rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <option value="ABOVE">Crosses Above (≥)</option>
                <option value="BELOW">Crosses Below (≤)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted font-medium block mb-1">
                Target Price ({symbol.currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                className="w-full min-h-10 rounded-control border border-border bg-surface px-3 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-10 rounded-control bg-primary text-primary-foreground font-bold text-sm hover:brightness-105 transition-colors"
          >
            Set Real-Time Alert
          </button>
        </form>

        {/* Active Alerts List */}
        <div className="space-y-3 pt-2 border-t border-border">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Active Alerts ({alerts.length})
          </h4>

          {alerts.length === 0 ? (
            <div className="text-xs text-muted text-center py-4">
              No price alerts set for this instrument.
            </div>
          ) : (
            <div className="divide-y divide-border/40 text-xs">
              {alerts.map((al) => (
                <div key={al.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BellRing className={`w-4 h-4 ${al.triggered ? 'text-warn' : 'text-primary'}`} />
                    <div>
                      <div className="font-semibold text-foreground font-mono">
                        {al.symbol} {al.condition === 'ABOVE' ? '≥' : '≤'} {formatPrice(al.targetPrice, 2)}
                      </div>
                      <div className="text-[11px] text-muted">
                        {al.triggered ? `Triggered at ${al.triggeredAt}` : 'Monitoring live feed'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleAlert(al.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        al.active ? 'bg-up/15 text-up' : 'bg-surface text-muted'
                      }`}
                    >
                      {al.active ? 'Active' : 'Paused'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAlert(al.id)}
                      className="p-1 text-muted hover:text-down"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
