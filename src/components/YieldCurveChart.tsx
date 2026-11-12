import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { SOVEREIGN_YIELD_CURVES, YIELD_TENORS } from '../data/marketsData';

export function YieldCurveChart() {
  const [enabledIds, setEnabledIds] = useState<string[]>(['US', 'GB', 'EU', 'DE']);
  const [hoverTenorIdx, setHoverTenorIdx] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState<boolean>(false);

  const toggleCurve = (id: string) => {
    setEnabledIds((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((x) => x !== id) : prev;
      }
      return [...prev, id];
    });
  };

  const activeCurves = SOVEREIGN_YIELD_CURVES.filter((c) => enabledIds.includes(c.id));

  const W = 900;
  const H = 285;
  const PAD_L = 44;
  const PAD_R = 24;
  const PAD_T = 18;
  const PAD_B = 32;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const minY = 0;
  const maxY = 6.0;

  const xAt = (i: number) => PAD_L + (i / (YIELD_TENORS.length - 1)) * plotW;
  const yAt = (val: number) => PAD_T + (1 - (val - minY) / (maxY - minY)) * plotH;

  const yTicks = [0, 1.5, 3.0, 4.5, 6.0];
  const readoutIdx = hoverTenorIdx ?? 6; // Default readout on 10Y benchmark

  return (
    <div className="space-y-3 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-muted font-medium">
            Tenor {YIELD_TENORS[readoutIdx]} yields:
          </span>
          {activeCurves.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: c.color }}
              />
              <span>{c.id}</span>
              <span className="tabular-nums font-semibold">
                {c.yields[readoutIdx].toFixed(2)}%
              </span>
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          aria-expanded={showPicker}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium border border-border bg-surface hover:bg-surface-hover text-foreground transition-colors duration-150 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          Customize curves
        </button>
      </div>

      {showPicker && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {SOVEREIGN_YIELD_CURVES.map((c) => {
            const active = enabledIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleCurve(c.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                  active
                    ? 'bg-ink-button text-ink-button-fg'
                    : 'border border-border bg-surface text-muted hover:text-foreground'
                }`}
              >
                <img
                  src={c.flagUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none cursor-crosshair"
        role="img"
        aria-label="Sovereign government bond yield curve across maturities"
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          if (!rect.width) return;
          const svgX = ((e.clientX - rect.left) / rect.width) * W;
          const rel = Math.max(0, Math.min(1, (svgX - PAD_L) / plotW));
          setHoverTenorIdx(Math.round(rel * (YIELD_TENORS.length - 1)));
        }}
        onPointerLeave={() => setHoverTenorIdx(null)}
      >
        {/* Y-axis gridlines & labels */}
        {yTicks.map((yv) => (
          <g key={yv}>
            <line
              x1={PAD_L}
              y1={yAt(yv)}
              x2={W - PAD_R}
              y2={yAt(yv)}
              stroke="var(--color-border)"
              strokeOpacity="0.6"
              strokeWidth="1"
            />
            <text
              x={PAD_L - 8}
              y={yAt(yv) + 4}
              textAnchor="end"
              fontSize="11"
              fill="var(--color-muted)"
              className="tabular-nums svg-halo"
            >
              {yv.toFixed(1)}%
            </text>
          </g>
        ))}

        {/* Vertical hover / benchmark guide */}
        <line
          x1={xAt(readoutIdx)}
          y1={PAD_T}
          x2={xAt(readoutIdx)}
          y2={PAD_T + plotH}
          stroke="var(--color-muted)"
          strokeDasharray="3 3"
          strokeOpacity="0.6"
          strokeWidth="1"
        />

        {/* Sovereign Curves */}
        {activeCurves.map((curve) => {
          const d = curve.yields
            .map((val, idx) => `${idx === 0 ? 'M' : 'L'}${xAt(idx).toFixed(1)},${yAt(val).toFixed(1)}`)
            .join(' ');
          return (
            <g key={curve.id}>
              <path
                d={d}
                fill="none"
                stroke={curve.color}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {curve.yields.map((val, idx) => (
                <circle
                  key={`${curve.id}-${idx}`}
                  cx={xAt(idx)}
                  cy={yAt(val)}
                  r={idx === readoutIdx ? 4.5 : 3}
                  fill={curve.color}
                  stroke="var(--color-background)"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          );
        })}

        {/* X-axis Tenor Labels */}
        {YIELD_TENORS.map((tenor, idx) => (
          <text
            key={tenor}
            x={xAt(idx)}
            y={H - 8}
            textAnchor="middle"
            fontSize="11"
            fontWeight={idx === readoutIdx ? '600' : '400'}
            fill={idx === readoutIdx ? 'var(--color-foreground)' : 'var(--color-muted)'}
            className="tabular-nums svg-halo"
          >
            {tenor}
          </text>
        ))}
      </svg>
      <p className="text-xs text-muted">
        Annualized yield to maturity (%) across benchmark sovereign tenors (1 month to 30 years).
      </p>
    </div>
  );
}
