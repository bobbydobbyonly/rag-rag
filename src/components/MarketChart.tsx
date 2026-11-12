import React, { useId, useMemo, useState } from 'react';
import {
  type CandlePoint,
  generateCandleSeries,
  type MarketSymbol,
  type Timeframe,
} from '../data/marketsData';
import { formatPrice, PriceChange } from './ui';

const TIMEFRAMES: Timeframe[] = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y'];

export type ChartStyle = 'area' | 'candles' | 'line';

export function MarketChart({
  symbol,
  compareSymbol,
  defaultTimeframe = '1D',
  height = 290,
  showToolbar = false,
  onOpenSymbol,
}: {
  symbol: MarketSymbol;
  compareSymbol?: MarketSymbol | null;
  defaultTimeframe?: Timeframe;
  height?: number;
  showToolbar?: boolean;
  onOpenSymbol?: (sym: string) => void;
}) {
  const gradId = useId().replace(/:/g, '');
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [chartStyle, setChartStyle] = useState<ChartStyle>('area');
  const [showSma, setShowSma] = useState<boolean>(showToolbar);
  const [showVolume, setShowVolume] = useState<boolean>(showToolbar);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const { points, periodChangePct } = useMemo(
    () => generateCandleSeries(symbol.symbol, symbol.price, symbol.changePct, timeframe),
    [symbol.symbol, symbol.price, symbol.changePct, timeframe]
  );

  const compareSeries = useMemo(() => {
    if (!compareSymbol) return null;
    return generateCandleSeries(
      compareSymbol.symbol,
      compareSymbol.price,
      compareSymbol.changePct,
      timeframe
    ).points;
  }, [compareSymbol, timeframe]);

  const W = 920;
  const H = height;
  const PAD_LEFT = 14;
  const PAD_RIGHT = 72;
  const PAD_TOP = 18;
  const PAD_BOTTOM = 28;
  const plotW = W - PAD_LEFT - PAD_RIGHT;
  const plotH = H - PAD_TOP - PAD_BOTTOM;

  const isPositive = periodChangePct >= 0;
  const strokeColor = isPositive ? 'var(--color-up)' : 'var(--color-down)';

  const { minVal, maxVal, smaValues } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const p of points) {
      const lo = chartStyle === 'candles' ? p.low : p.close;
      const hi = chartStyle === 'candles' ? p.high : p.close;
      if (lo < min) min = lo;
      if (hi > max) max = hi;
    }
    if (compareSeries && compareSeries.length === points.length) {
      const baseMain = points[0].close || 1;
      const baseComp = compareSeries[0].close || 1;
      for (let i = 0; i < compareSeries.length; i++) {
        const mapped = baseMain * (compareSeries[i].close / baseComp);
        if (mapped < min) min = mapped;
        if (mapped > max) max = mapped;
      }
    }
    const span = max - min || max * 0.02 || 1;
    const paddedMin = min - span * (showVolume ? 0.18 : 0.08);
    const paddedMax = max + span * 0.08;

    const sma: (number | null)[] = points.map((_, idx) => {
      const win = Math.min(12, idx + 1);
      if (idx < 3) return null;
      let sum = 0;
      for (let k = idx - win + 1; k <= idx; k++) {
        sum += points[k].close;
      }
      return sum / win;
    });

    return { minVal: paddedMin, maxVal: paddedMax, smaValues: sma };
  }, [points, compareSeries, chartStyle, showVolume]);

  const maxVol = useMemo(
    () => Math.max(1, ...points.map((p) => p.volume)),
    [points]
  );

  const xAt = (idx: number) =>
    PAD_LEFT + (points.length <= 1 ? 0 : (idx / (points.length - 1)) * plotW);
  const yAt = (val: number) =>
    PAD_TOP + (1 - (val - minVal) / (maxVal - minVal || 1)) * plotH;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(p.close).toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L${xAt(points.length - 1).toFixed(1)},${(
    PAD_TOP + plotH
  ).toFixed(1)} L${xAt(0).toFixed(1)},${(PAD_TOP + plotH).toFixed(1)} Z`;

  const smaPath = smaValues
    .map((v, i) => {
      if (v === null) return '';
      const firstValid = smaValues.findIndex((x) => x !== null);
      return `${i === firstValid ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`;
    })
    .filter(Boolean)
    .join(' ');

  const comparePath = useMemo(() => {
    if (!compareSeries || compareSeries.length !== points.length) return '';
    const baseMain = points[0].close || 1;
    const baseComp = compareSeries[0].close || 1;
    return compareSeries
      .map((cp, i) => {
        const mapped = baseMain * (cp.close / baseComp);
        return `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(mapped).toFixed(1)}`;
      })
      .join(' ');
  }, [compareSeries, points, minVal, maxVal]);

  // 5 clean Y-axis ticks
  const yTicks = [0.1, 0.325, 0.55, 0.775, 0.95].map((t) => {
    const val = minVal + (1 - t) * (maxVal - minVal);
    return { val, y: PAD_TOP + t * plotH };
  });

  // 5 clean X-axis ticks spaced clear of edges
  const xTickIndices = [0, 0.25, 0.5, 0.75, 1].map((f) =>
    Math.min(points.length - 1, Math.round(f * (points.length - 1)))
  );

  const activePoint: CandlePoint =
    hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : points[points.length - 1];

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const rel = Math.max(0, Math.min(1, (svgX - PAD_LEFT) / plotW));
    const idx = Math.round(rel * (points.length - 1));
    setHoverIdx(idx);
  };

  const candleWidth = Math.max(3, Math.min(9, (plotW / points.length) * 0.62));
  const baselineY = yAt(points[0].close);

  return (
    <div className="space-y-3 min-w-0">
      {/* Top readout & optional Superchart toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0 text-xs text-muted">
          <button
            type="button"
            onClick={() => onOpenSymbol?.(symbol.symbol)}
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
          >
            {symbol.name} ({symbol.symbol})
          </button>
          <span className="tabular-nums text-foreground font-medium">
            {formatPrice(activePoint.close, symbol.decimals)} {symbol.currency}
          </span>
          {chartStyle === 'candles' && (
            <span className="tabular-nums hidden sm:inline">
              O {formatPrice(activePoint.open, symbol.decimals)} · H{' '}
              {formatPrice(activePoint.high, symbol.decimals)} · L{' '}
              {formatPrice(activePoint.low, symbol.decimals)} · C{' '}
              {formatPrice(activePoint.close, symbol.decimals)}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <PriceChange value={periodChangePct} />
            <span>({timeframe})</span>
          </span>
          {compareSymbol && (
            <span className="inline-flex items-center gap-1.5 text-primary font-medium">
              · vs {compareSymbol.symbol}
            </span>
          )}
        </div>

        {showToolbar && (
          <div className="flex flex-wrap items-center gap-1.5">
            {(['area', 'candles', 'line'] as ChartStyle[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setChartStyle(st)}
                className={`px-2.5 py-1 rounded-control text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                  chartStyle === st
                    ? 'bg-ink-button text-ink-button-fg'
                    : 'text-muted hover:text-foreground hover:bg-surface-hover'
                }`}
              >
                {st === 'area' ? 'Area' : st === 'candles' ? 'Candles' : 'Line'}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowSma((v) => !v)}
              aria-pressed={showSma}
              className={`px-2.5 py-1 rounded-control text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                showSma
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              SMA 12
            </button>
            <button
              type="button"
              onClick={() => setShowVolume((v) => !v)}
              aria-pressed={showVolume}
              className={`px-2.5 py-1 rounded-control text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                showVolume
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              Volume
            </button>
          </div>
        )}
      </div>

      {/* Interactive SVG Canvas */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto select-none touch-none cursor-crosshair"
          role="img"
          aria-label={`${symbol.name} ${timeframe} price chart`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id={`area-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.24" />
              <stop offset="95%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {yTicks.map((t, idx) => (
            <line
              key={idx}
              x1={PAD_LEFT}
              y1={t.y}
              x2={W - PAD_RIGHT}
              y2={t.y}
              stroke="var(--color-border)"
              strokeOpacity="0.55"
              strokeWidth="1"
            />
          ))}

          {/* Period opening reference dashed line */}
          <line
            x1={PAD_LEFT}
            y1={baselineY}
            x2={W - PAD_RIGHT}
            y2={baselineY}
            stroke="var(--color-muted)"
            strokeOpacity="0.45"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Optional Volume histogram along bottom */}
          {showVolume &&
            points.map((p, idx) => {
              const barH = (p.volume / maxVol) * (plotH * 0.17);
              const x = xAt(idx) - candleWidth / 2;
              const y = PAD_TOP + plotH - barH;
              const up = p.close >= p.open;
              return (
                <rect
                  key={`vol-${idx}`}
                  x={x}
                  y={y}
                  width={candleWidth}
                  height={barH}
                  fill={up ? 'var(--color-up)' : 'var(--color-down)'}
                  fillOpacity="0.22"
                />
              );
            })}

          {/* Primary Series */}
          {chartStyle === 'area' && (
            <>
              <path d={areaPath} fill={`url(#area-${gradId})`} />
              <path
                d={linePath}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </>
          )}

          {chartStyle === 'line' && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {chartStyle === 'candles' &&
            points.map((p, idx) => {
              const cx = xAt(idx);
              const openY = yAt(p.open);
              const closeY = yAt(p.close);
              const highY = yAt(p.high);
              const lowY = yAt(p.low);
              const up = p.close >= p.open;
              const c = up ? 'var(--color-up)' : 'var(--color-down)';
              const topY = Math.min(openY, closeY);
              const bodyH = Math.max(1.5, Math.abs(closeY - openY));
              return (
                <g key={`c-${idx}`}>
                  <line x1={cx} y1={highY} x2={cx} y2={lowY} stroke={c} strokeWidth="1.2" />
                  <rect
                    x={cx - candleWidth / 2}
                    y={topY}
                    width={candleWidth}
                    height={bodyH}
                    fill={c}
                    rx="0.8"
                  />
                </g>
              );
            })}

          {/* Optional SMA 12 Overlay */}
          {showSma && smaPath && (
            <path
              d={smaPath}
              fill="none"
              stroke="var(--color-warn)"
              strokeWidth="1.6"
              strokeDasharray="4 2"
            />
          )}

          {/* Optional Comparison Symbol Overlay */}
          {comparePath && (
            <path
              d={comparePath}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="1.9"
              strokeDasharray="5 3"
            />
          )}

          {/* Hover Crosshair */}
          {hoverIdx !== null && points[hoverIdx] && (
            <g>
              <line
                x1={xAt(hoverIdx)}
                y1={PAD_TOP}
                x2={xAt(hoverIdx)}
                y2={PAD_TOP + plotH}
                stroke="var(--color-muted)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <line
                x1={PAD_LEFT}
                y1={yAt(points[hoverIdx].close)}
                x2={W - PAD_RIGHT}
                y2={yAt(points[hoverIdx].close)}
                stroke="var(--color-muted)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <circle
                cx={xAt(hoverIdx)}
                cy={yAt(points[hoverIdx].close)}
                r="4.5"
                fill={strokeColor}
                stroke="var(--color-background)"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Right Y-axis Price Labels (explicit numeric x,y + halo) */}
          {yTicks.map((t, idx) => (
            <text
              key={`yt-${idx}`}
              x={W - PAD_RIGHT + 8}
              y={t.y + 4}
              fontSize="11"
              fill="var(--color-muted)"
              className="tabular-nums svg-halo"
            >
              {formatPrice(t.val, symbol.decimals)}
            </text>
          ))}

          {/* Current / Hover Price Highlight Tag on Right Axis */}
          <g>
            <rect
              x={W - PAD_RIGHT + 4}
              y={Math.max(PAD_TOP, Math.min(PAD_TOP + plotH - 18, yAt(activePoint.close) - 10))}
              width={PAD_RIGHT - 6}
              height={20}
              rx="4"
              fill={strokeColor}
            />
            <text
              x={W - PAD_RIGHT + 9}
              y={Math.max(PAD_TOP + 13, Math.min(PAD_TOP + plotH - 5, yAt(activePoint.close) + 4))}
              fontSize="11"
              fontWeight="600"
              fill="#ffffff"
              className="tabular-nums"
            >
              {formatPrice(activePoint.close, symbol.decimals)}
            </text>
          </g>

          {/* Bottom X-axis Time Labels (explicit numeric x,y + halo) */}
          {xTickIndices.map((ptIdx, i) => {
            const x = xAt(ptIdx);
            const anchor = i === 0 ? 'start' : i === xTickIndices.length - 1 ? 'end' : 'middle';
            return (
              <text
                key={`xt-${i}`}
                x={x}
                y={H - 6}
                textAnchor={anchor}
                fontSize="11"
                fill="var(--color-muted)"
                className="tabular-nums svg-halo"
              >
                {points[ptIdx]?.timeLabel}
              </text>
            );
          })}
        </svg>
      </div>

      {/* TradingView Bottom Timeframe Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Chart timeframe">
          {TIMEFRAMES.map((tf) => {
            const tfResult = generateCandleSeries(
              symbol.symbol,
              symbol.price,
              symbol.changePct,
              tf
            );
            const active = timeframe === tf;
            return (
              <button
                key={tf}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-control text-xs font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary ${
                  active
                    ? 'bg-surface-hover text-foreground'
                    : 'text-muted hover:text-foreground hover:bg-surface'
                }`}
              >
                <span>{tf}</span>
                {active && (
                  <span
                    className={`ml-1.5 tabular-nums ${
                      tfResult.periodChangePct >= 0 ? 'text-up' : 'text-down'
                    }`}
                  >
                    {tfResult.periodChangePct >= 0 ? '+' : '−'}
                    {Math.abs(tfResult.periodChangePct).toFixed(2)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-muted">
          Interval: {timeframe === '1D' ? '8 min' : timeframe === '5D' ? '2 hr' : '1 day'} · Simulated live feed
        </span>
      </div>
    </div>
  );
}
