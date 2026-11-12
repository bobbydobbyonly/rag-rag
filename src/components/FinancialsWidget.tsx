import React from 'react';
import {
  FINANCIAL_STATEMENTS,
  type FinancialStatementData,
  type MarketSymbol,
} from '../data/marketsData';

export function FinancialsWidget({ symbol }: { symbol: MarketSymbol }) {
  const statement: FinancialStatementData =
    FINANCIAL_STATEMENTS[symbol.symbol] ?? {
      symbol: symbol.symbol,
      quarters: [
        { quarter: "Q4 '24", revenueB: 12.4, netIncomeB: 3.8, operatingMarginPct: 30.6 },
        { quarter: "Q1 '25", revenueB: 14.1, netIncomeB: 4.4, operatingMarginPct: 31.2 },
        { quarter: "Q2 '25", revenueB: 15.8, netIncomeB: 5.1, operatingMarginPct: 32.3 },
        { quarter: "Q3 '25", revenueB: 16.9, netIncomeB: 5.7, operatingMarginPct: 33.7 },
        { quarter: "Q4 '25", revenueB: 18.2, netIncomeB: 6.4, operatingMarginPct: 35.1 },
      ],
      valuation: {
        pe: symbol.pe ?? 24.5,
        forwardPe: symbol.pe ? symbol.pe * 0.85 : 20.8,
        priceToSales: 6.4,
        evToEbitda: 18.2,
        roePct: 28.4,
        debtToEquity: 0.35,
      },
    };

  const maxRev = Math.max(...statement.quarters.map((q) => q.revenueB), 1);

  return (
    <div className="space-y-8 min-w-0">
      {/* Quarterly Revenue & Net Income Bar Chart */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Quarterly Revenue & Net Income (Billions USD)
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-primary" />
              <span>Revenue</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-up" />
              <span>Net Income</span>
            </span>
          </div>
        </div>

        <div className="border border-border rounded-card p-6 bg-surface/30">
          <div className="grid grid-cols-5 gap-4 items-end h-44 border-b border-border pb-4">
            {statement.quarters.map((q) => {
              const revHeight = Math.round((q.revenueB / maxRev) * 100);
              const netHeight = Math.round((q.netIncomeB / maxRev) * 100);
              return (
                <div key={q.quarter} className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 h-32">
                    <div
                      className="w-5 sm:w-8 rounded-t-xs bg-primary hover:brightness-110 transition-all duration-150 relative group"
                      style={{ height: `${revHeight}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-background border border-border px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-sm pointer-events-none transition-opacity">
                        ${q.revenueB}B
                      </span>
                    </div>
                    <div
                      className="w-5 sm:w-8 rounded-t-xs bg-up hover:brightness-110 transition-all duration-150 relative group"
                      style={{ height: `${netHeight}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-background border border-border px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-sm pointer-events-none transition-opacity">
                        ${q.netIncomeB}B
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-muted text-center">{q.quarter}</span>
                  <span className="text-[11px] font-mono text-muted text-center hidden sm:inline">
                    Margin: {q.operatingMarginPct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Valuation Multiples & Capital Structure Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Pro Valuation & Performance Multiples
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-card bg-surface border border-border">
            <div className="text-xs text-muted">Trailing P/E</div>
            <div className="text-lg font-bold tabular-nums text-foreground mt-1">
              {statement.valuation.pe.toFixed(1)}x
            </div>
            <div className="text-[11px] text-muted mt-0.5">TTM Earnings</div>
          </div>
          <div className="p-3.5 rounded-card bg-surface border border-border">
            <div className="text-xs text-muted">Forward P/E</div>
            <div className="text-lg font-bold tabular-nums text-foreground mt-1">
              {statement.valuation.forwardPe.toFixed(1)}x
            </div>
            <div className="text-[11px] text-muted mt-0.5">FY2026 Consensus</div>
          </div>
          <div className="p-3.5 rounded-card bg-surface border border-border">
            <div className="text-xs text-muted">Price / Sales</div>
            <div className="text-lg font-bold tabular-nums text-foreground mt-1">
              {statement.valuation.priceToSales.toFixed(1)}x
            </div>
            <div className="text-[11px] text-muted mt-0.5">Revenue Multiple</div>
          </div>
          <div className="p-3.5 rounded-card bg-surface border border-border">
            <div className="text-xs text-muted">EV / EBITDA</div>
            <div className="text-lg font-bold tabular-nums text-foreground mt-1">
              {statement.valuation.evToEbitda.toFixed(1)}x
            </div>
            <div className="text-[11px] text-muted mt-0.5">Enterprise Multiple</div>
          </div>
          <div className="p-3.5 rounded-card bg-surface border border-border">
            <div className="text-xs text-muted">Return on Equity</div>
            <div className="text-lg font-bold tabular-nums text-up mt-1">
              {statement.valuation.roePct.toFixed(1)}%
            </div>
            <div className="text-[11px] text-muted mt-0.5">Capital Efficiency</div>
          </div>
          <div className="p-3.5 rounded-card bg-surface border border-border">
            <div className="text-xs text-muted">Debt / Equity</div>
            <div className="text-lg font-bold tabular-nums text-foreground mt-1">
              {statement.valuation.debtToEquity.toFixed(2)}
            </div>
            <div className="text-[11px] text-muted mt-0.5">Solvency Ratio</div>
          </div>
        </div>
      </div>
    </div>
  );
}
