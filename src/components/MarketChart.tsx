import React, { useId, useMemo, useState } from 'react';
import {
  Activity,
  BarChart2,
  Crosshair,
  Maximize2,
  Minimize2,
  Minus,
  Percent,
  Ruler,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import {
  type CandlePoint,
  generateCandleSeries,
  type MarketSymbol,
  type Timeframe,
} from '../data/marketsData';
import { formatPrice, PriceChange } from './ui';

export type ChartStyle = 'candles' | 'hollow' | 'heikin' | 'bars' | 'area' | 'line';
export type ActiveDrawingTool = 'cursor' | 'trendline' | 'horizontal' | 'fib' | 'ruler';

export interface UserDrawing {
  id: string;
  type: 'trendline' | 'horizontal' | 'fib' | 'ruler';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  price1: number;
  price2: number;
}

export function MarketChart({
  symbol,
  compareSymbol,
  defaultTimeframe = '1D',
  height = 360,
  showToolbar = true,
  onOpenSymbol,
  onQuickTrade,
}: {
  symbol: MarketSymbol;
  compareSymbol?: MarketSymbol | null;
  defaultTimeframe?: Timeframe;
  height?: number;
  showToolbar?: boolean;
  onOpenSymbol?: (sym: string) => void;
  onQuickTrade?: (side: 'BUY' | 'SELL', price: number) => void;
}) {
  const gradId = useId().replace(/:/g, '');
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candles');

  // Indicators toggles
  const [showSma, setShowSma] = useState<boolean>(true);
  const [showEma, setShowEma] = useState<boolean>(false);
  const [showBollinger, setShowBollinger] = useState<boolean>(false);
  const [showRsi, setShowRsi] = useState<boolean>(false);
  const [showMacd, setShowMacd] = useState<boolean>(false);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [isLogScale, setIsLogScale] = useState<boolean>(false);
  const [isPercentScale, setIsPercentScale] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Drawing tools
  const [activeTool, setActiveTool] = useState<ActiveDrawingTool>('cursor');
  const [drawings, setDrawings] = useState<UserDrawing[]>([]);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number; price: number } | null>(null);

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const { points: rawPoints, periodChangePct } = useMemo(
    () => generateCandleSeries(symbol.symbol, symbol.price, symbol.changePct, timeframe),
    [symbol.symbol, symbol.price, symbol.changePct, timeframe]
  );

  // Compute Heikin-Ashi if selected
  const points = useMemo(() => {
    if (chartStyle !== 'heikin') return rawPoints;
    const ha: CandlePoint[] = [];
    for (let i = 0; i < rawPoints.length; i++) {
      const p = rawPoints[i];
      const prevHa = i > 0 ? ha[i - 1] : p;
      const haClose = (p.open + p.high + p.low + p.close) / 4;
      const haOpen = i === 0 ? (p.open + p.close) / 2 : (prevHa.open + prevHa.close) / 2;
      const haHigh = Math.max(p.high, haOpen, haClose);
      const haLow = Math.min(p.low, haOpen, haClose);
      ha.push({
        timeLabel: p.timeLabel,
        open: haOpen,
        high: haHigh,
        low: haLow,
        close: haClose,
        volume: p.volume,
      });
    }
    return ha;
  }, [rawPoints, chartStyle]);

  const compareSeries = useMemo(() => {
    if (!compareSymbol) return null;
    return generateCandleSeries(
      compareSymbol.symbol,
      compareSymbol.price,
      compareSymbol.changePct,
      timeframe
    ).points;
  }, [compareSymbol, timeframe]);

  // Compute RSI (14)
  const rsiValues = useMemo(() => {
    const rsi: (number | null)[] = [];
    const period = 14;
    let gains = 0;
    let losses = 0;
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        rsi.push(50);
        continue;
      }
      const diff = points[i].close - points[i - 1].close;
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      if (i <= period) {
        gains += gain;
        losses += loss;
        rsi.push(50);
      } else {
        gains = (gains * (period - 1) + gain) / period;
        losses = (losses * (period - 1) + loss) / period;
        const rs = losses === 0 ? 100 : gains / losses;
        const val = 100 - 100 / (1 + rs);
        rsi.push(Number(val.toFixed(1)));
      }
    }
    return rsi;
  }, [points]);

  // Compute MACD (12, 26, 9)
  const macdData = useMemo(() => {
    const ema = (period: number) => {
      const k = 2 / (period + 1);
      const res: number[] = [];
      let prev = points[0].close;
      for (const p of points) {
        const val = p.close * k + prev * (1 - k);
        res.push(val);
        prev = val;
      }
      return res;
    };
    const ema12 = ema(12);
    const ema26 = ema(26);
    const macdLine = ema12.map((v, i) => v - ema26[i]);
    const kSig = 2 / 10;
    const signalLine: number[] = [];
    let prevSig = macdLine[0];
    for (const v of macdLine) {
      const s = v * kSig + prevSig * (1 - kSig);
      signalLine.push(s);
      prevSig = s;
    }
    const histogram = macdLine.map((v, i) => v - signalLine[i]);
    return { macdLine, signalLine, histogram };
  }, [points]);

  const W = 960;
  const mainPlotH = isExpanded ? 480 : height;
  const subPaneH = showRsi || showMacd ? 90 : 0;
  const totalH = mainPlotH + subPaneH + 40;

  const PAD_L = 46; // Left toolbar clearance
  const PAD_R = 76; // Right price ladder
  const PAD_T = 20;
  const PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = mainPlotH - PAD_T - PAD_B;

  const isPositive = periodChangePct >= 0;
  const strokeColor = isPositive ? 'var(--color-up)' : 'var(--color-down)';

  const { minVal, maxVal, smaValues, emaValues, bbUpper, bbLower } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const p of points) {
      const lo = p.low;
      const hi = p.high;
      if (lo < min) min = lo;
      if (hi > max) max = hi;
    }
    const span = max - min || max * 0.02 || 1;
    const paddedMin = min - span * (showVolume ? 0.2 : 0.08);
    const paddedMax = max + span * 0.08;

    // SMA 20
    const sma: (number | null)[] = points.map((_, idx) => {
      const win = Math.min(20, idx + 1);
      if (idx < 5) return null;
      let sum = 0;
      for (let k = idx - win + 1; k <= idx; k++) sum += points[k].close;
      return sum / win;
    });

    // EMA 9
    const kEma = 2 / 10;
    let prevEma = points[0].close;
    const emaList: number[] = [];
    for (const p of points) {
      const val = p.close * kEma + prevEma * (1 - kEma);
      emaList.push(val);
      prevEma = val;
    }

    // Bollinger Bands (20, 2)
    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];
    for (let i = 0; i < points.length; i++) {
      const s = sma[i];
      if (s === null) {
        upper.push(null);
        lower.push(null);
        continue;
      }
      const win = Math.min(20, i + 1);
      let sumSq = 0;
      for (let k = i - win + 1; k <= i; k++) {
        sumSq += Math.pow(points[k].close - s, 2);
      }
      const std = Math.sqrt(sumSq / win);
      upper.push(s + std * 2);
      lower.push(s - std * 2);
    }

    return {
      minVal: paddedMin,
      maxVal: paddedMax,
      smaValues: sma,
      emaValues: emaList,
      bbUpper: upper,
      bbLower: lower,
    };
  }, [points, showVolume]);

  const maxVol = useMemo(() => Math.max(1, ...points.map((p) => p.volume)), [points]);

  const xAt = (idx: number) =>
    PAD_L + (points.length <= 1 ? 0 : (idx / (points.length - 1)) * plotW);

  const yAt = (val: number) => {
    let normalized = (val - minVal) / (maxVal - minVal || 1);
    if (isLogScale && minVal > 0 && val > 0) {
      normalized = (Math.log(val) - Math.log(minVal)) / (Math.log(maxVal) - Math.log(minVal) || 1);
    }
    return PAD_T + (1 - normalized) * plotH;
  };

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(p.close).toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L${xAt(points.length - 1).toFixed(1)},${(
    PAD_T + plotH
  ).toFixed(1)} L${xAt(0).toFixed(1)},${(PAD_T + plotH).toFixed(1)} Z`;

  const smaPath = smaValues
    .map((v, i) => (v === null ? '' : `${i === 5 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`))
    .filter(Boolean)
    .join(' ');

  const emaPath = emaValues
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`)
    .join(' ');

  const bbAreaPath = useMemo(() => {
    if (!showBollinger) return '';
    const validIndices = bbUpper
      .map((v, i) => (v !== null && bbLower[i] !== null ? i : -1))
      .filter((i) => i >= 0);
    if (validIndices.length === 0) return '';
    const upperPts = validIndices.map(
      (i) => `${i === validIndices[0] ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(bbUpper[i]!).toFixed(1)}`
    );
    const lowerPts = [...validIndices]
      .reverse()
      .map((i) => `L${xAt(i).toFixed(1)},${yAt(bbLower[i]!).toFixed(1)}`);
    return `${upperPts.join(' ')} ${lowerPts.join(' ')} Z`;
  }, [showBollinger, bbUpper, bbLower, minVal, maxVal]);

  const candleWidth = Math.max(3.5, Math.min(10, (plotW / points.length) * 0.65));

  const yTicks = [0.08, 0.3, 0.52, 0.74, 0.94].map((t) => {
    const val = minVal + (1 - t) * (maxVal - minVal);
    return { val, y: PAD_T + t * plotH };
  });

  const xTickIndices = [0, 0.25, 0.5, 0.75, 1].map((f) =>
    Math.min(points.length - 1, Math.round(f * (points.length - 1)))
  );

  const activePoint: CandlePoint =
    hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : points[points.length - 1];

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool === 'cursor') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const svgY = ((e.clientY - rect.top) / rect.height) * totalH;
    const price = minVal + (1 - (svgY - PAD_T) / plotH) * (maxVal - minVal);

    if (activeTool === 'horizontal') {
      setDrawings((prev) => [
        ...prev,
        {
          id: `draw-${Date.now()}`,
          type: 'horizontal',
          x1: PAD_L,
          y1: svgY,
          x2: W - PAD_R,
          y2: svgY,
          price1: price,
          price2: price,
        },
      ]);
      return;
    }

    if (!drawingStart) {
      setDrawingStart({ x: svgX, y: svgY, price });
    } else {
      setDrawings((prev) => [
        ...prev,
        {
          id: `draw-${Date.now()}`,
          type: activeTool,
          x1: drawingStart.x,
          y1: drawingStart.y,
          x2: svgX,
          y2: svgY,
          price1: drawingStart.price,
          price2: price,
        },
      ]);
      setDrawingStart(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const rel = Math.max(0, Math.min(1, (svgX - PAD_L) / plotW));
    const idx = Math.round(rel * (points.length - 1));
    setHoverIdx(idx);
  };

  return (
    <div className={`space-y-2.5 min-w-0 ${isExpanded ? 'fixed inset-4 z-50 bg-background border border-border p-4 shadow-2xl rounded-card overflow-y-auto' : ''}`}>
      {/* Top Pro Toolbar: Timeframes, Chart Styles, Indicators, Quick Buy/Sell */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1 py-1 border-b border-border/60">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Symbol & Name */}
          <button
            type="button"
            onClick={() => onOpenSymbol?.(symbol.symbol)}
            className="font-bold text-sm text-foreground hover:text-primary transition-colors duration-150 flex items-center gap-1.5 mr-2"
          >
            <span>{symbol.symbol}</span>
            <span className="text-xs text-muted font-normal hidden sm:inline truncate max-w-44">
              {symbol.name}
            </span>
          </button>

          {/* Timeframes */}
          <div className="flex items-center gap-1 bg-surface p-0.5 rounded-control border border-border/60">
            {(['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 rounded-xs text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                  timeframe === tf
                    ? 'bg-ink-button text-ink-button-fg'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Style Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-surface p-0.5 rounded-control border border-border/60">
            {(
              [
                { id: 'candles', label: 'Candles' },
                { id: 'hollow', label: 'Hollow' },
                { id: 'heikin', label: 'Heikin-Ashi' },
                { id: 'bars', label: 'Bars' },
                { id: 'area', label: 'Area' },
                { id: 'line', label: 'Line' },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setChartStyle(st.id)}
                className={`px-2 py-0.5 rounded-xs text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                  chartStyle === st.id
                    ? 'bg-ink-button text-ink-button-fg'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Indicators and Quick Order Execution */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSma((v) => !v)}
            aria-pressed={showSma}
            className={`px-2 py-1 rounded-control text-xs font-semibold transition-colors duration-150 ${
              showSma ? 'bg-primary/15 text-primary' : 'text-muted hover:text-foreground'
            }`}
          >
            SMA 20
          </button>
          <button
            type="button"
            onClick={() => setShowEma((v) => !v)}
            aria-pressed={showEma}
            className={`px-2 py-1 rounded-control text-xs font-semibold transition-colors duration-150 ${
              showEma ? 'bg-warn/15 text-warn' : 'text-muted hover:text-foreground'
            }`}
          >
            EMA 9
          </button>
          <button
            type="button"
            onClick={() => setShowBollinger((v) => !v)}
            aria-pressed={showBollinger}
            className={`px-2 py-1 rounded-control text-xs font-semibold transition-colors duration-150 ${
              showBollinger ? 'bg-primary/20 text-primary' : 'text-muted hover:text-foreground'
            }`}
          >
            BB (20,2)
          </button>
          <button
            type="button"
            onClick={() => setShowRsi((v) => !v)}
            aria-pressed={showRsi}
            className={`px-2 py-1 rounded-control text-xs font-semibold transition-colors duration-150 ${
              showRsi ? 'bg-purple-600/15 text-purple-600' : 'text-muted hover:text-foreground'
            }`}
          >
            RSI (14)
          </button>
          <button
            type="button"
            onClick={() => setShowMacd((v) => !v)}
            aria-pressed={showMacd}
            className={`px-2 py-1 rounded-control text-xs font-semibold transition-colors duration-150 ${
              showMacd ? 'bg-cyan-600/15 text-cyan-600' : 'text-muted hover:text-foreground'
            }`}
          >
            MACD
          </button>

          {/* Quick Buy / Sell Buttons */}
          {onQuickTrade && (
            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => onQuickTrade('BUY', activePoint.close)}
                className="px-2.5 py-1 bg-up text-white rounded-control text-xs font-bold hover:brightness-110 active:translate-y-px transition-all duration-150"
              >
                BUY @ {formatPrice(activePoint.close, symbol.decimals)}
              </button>
              <button
                type="button"
                onClick={() => onQuickTrade('SELL', activePoint.close)}
                className="px-2.5 py-1 bg-down text-white rounded-control text-xs font-bold hover:brightness-110 active:translate-y-px transition-all duration-150"
              >
                SELL @ {formatPrice(activePoint.close, symbol.decimals)}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-label={isExpanded ? 'Restore chart size' : 'Expand chart to full window'}
            className="p-1 rounded-control text-muted hover:text-foreground hover:bg-surface-hover"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Pro Chart Layout: Left Drawing Palette + Main SVG Canvas */}
      <div className="relative flex items-stretch">
        {/* Left Drawing Tools Palette */}
        {showToolbar && (
          <div className="w-10 flex flex-col items-center gap-1.5 py-2 border-r border-border/60 bg-surface/50 rounded-l-control shrink-0">
            <button
              type="button"
              onClick={() => setActiveTool('cursor')}
              title="Pointer / Crosshair"
              aria-label="Pointer cursor"
              className={`p-1.5 rounded-control transition-colors duration-150 ${
                activeTool === 'cursor' ? 'bg-ink-button text-ink-button-fg' : 'text-muted hover:text-foreground'
              }`}
            >
              <Crosshair className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('trendline')}
              title="Draw Trend Line (Click two points)"
              aria-label="Draw trendline"
              className={`p-1.5 rounded-control transition-colors duration-150 ${
                activeTool === 'trendline' ? 'bg-ink-button text-ink-button-fg' : 'text-muted hover:text-foreground'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('horizontal')}
              title="Horizontal Support / Resistance Line"
              aria-label="Draw horizontal line"
              className={`p-1.5 rounded-control transition-colors duration-150 ${
                activeTool === 'horizontal' ? 'bg-ink-button text-ink-button-fg' : 'text-muted hover:text-foreground'
              }`}
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('fib')}
              title="Fibonacci Retracement (Click high & low)"
              aria-label="Fibonacci retracement"
              className={`p-1.5 rounded-control transition-colors duration-150 ${
                activeTool === 'fib' ? 'bg-ink-button text-ink-button-fg' : 'text-muted hover:text-foreground'
              }`}
            >
              <Percent className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('ruler')}
              title="Price / Bar Ruler"
              aria-label="Price measurement ruler"
              className={`p-1.5 rounded-control transition-colors duration-150 ${
                activeTool === 'ruler' ? 'bg-ink-button text-ink-button-fg' : 'text-muted hover:text-foreground'
              }`}
            >
              <Ruler className="w-4 h-4" />
            </button>
            {drawings.length > 0 && (
              <button
                type="button"
                onClick={() => setDrawings([])}
                title="Clear all drawings"
                aria-label="Clear all drawings"
                className="p-1.5 rounded-control text-down hover:bg-down/10 mt-auto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* SVG Interactive Canvas */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <svg
            viewBox={`0 0 ${W} ${totalH}`}
            className="w-full h-auto select-none touch-none cursor-crosshair block"
            role="img"
            aria-label={`${symbol.name} professional chart`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIdx(null)}
          >
            <defs>
              <linearGradient id={`area-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                <stop offset="95%" stopColor={strokeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {yTicks.map((t, idx) => (
              <line
                key={`grid-${idx}`}
                x1={PAD_L}
                y1={t.y}
                x2={W - PAD_R}
                y2={t.y}
                stroke="var(--color-border)"
                strokeOpacity="0.5"
                strokeWidth="1"
              />
            ))}

            {/* Bollinger Bands Translucent Fill */}
            {showBollinger && bbAreaPath && (
              <path d={bbAreaPath} fill="var(--color-primary)" fillOpacity="0.08" />
            )}

            {/* Volume Histogram */}
            {showVolume &&
              points.map((p, idx) => {
                const barH = (p.volume / maxVol) * (plotH * 0.18);
                const x = xAt(idx) - candleWidth / 2;
                const y = PAD_T + plotH - barH;
                const up = p.close >= p.open;
                return (
                  <rect
                    key={`v-${idx}`}
                    x={x}
                    y={y}
                    width={candleWidth}
                    height={barH}
                    fill={up ? 'var(--color-up)' : 'var(--color-down)'}
                    fillOpacity="0.25"
                  />
                );
              })}

            {/* Main Price Series */}
            {chartStyle === 'area' && (
              <>
                <path d={areaPath} fill={`url(#area-${gradId})`} />
                <path
                  d={linePath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.2"
                  strokeLinejoin="round"
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
              />
            )}

            {(chartStyle === 'candles' || chartStyle === 'hollow' || chartStyle === 'heikin') &&
              points.map((p, idx) => {
                const cx = xAt(idx);
                const openY = yAt(p.open);
                const closeY = yAt(p.close);
                const highY = yAt(p.high);
                const lowY = yAt(p.low);
                const up = p.close >= p.open;
                const color = up ? 'var(--color-up)' : 'var(--color-down)';
                const topY = Math.min(openY, closeY);
                const bodyH = Math.max(1.5, Math.abs(closeY - openY));

                const isHollow = chartStyle === 'hollow' && up;
                return (
                  <g key={`candle-${idx}`}>
                    <line x1={cx} y1={highY} x2={cx} y2={lowY} stroke={color} strokeWidth="1.2" />
                    <rect
                      x={cx - candleWidth / 2}
                      y={topY}
                      width={candleWidth}
                      height={bodyH}
                      fill={isHollow ? 'var(--color-background)' : color}
                      stroke={color}
                      strokeWidth={isHollow ? 1.4 : 0}
                      rx="0.5"
                    />
                  </g>
                );
              })}

            {chartStyle === 'bars' &&
              points.map((p, idx) => {
                const cx = xAt(idx);
                const openY = yAt(p.open);
                const closeY = yAt(p.close);
                const highY = yAt(p.high);
                const lowY = yAt(p.low);
                const up = p.close >= p.open;
                const color = up ? 'var(--color-up)' : 'var(--color-down)';
                return (
                  <g key={`bar-${idx}`}>
                    <line x1={cx} y1={highY} x2={cx} y2={lowY} stroke={color} strokeWidth="1.4" />
                    <line x1={cx - candleWidth / 2} y1={openY} x2={cx} y2={openY} stroke={color} strokeWidth="1.4" />
                    <line x1={cx} y1={closeY} x2={cx + candleWidth / 2} y2={closeY} stroke={color} strokeWidth="1.4" />
                  </g>
                );
              })}

            {/* SMA 20 Overlay */}
            {showSma && smaPath && (
              <path
                d={smaPath}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="1.8"
              />
            )}

            {/* EMA 9 Overlay */}
            {showEma && emaPath && (
              <path
                d={emaPath}
                fill="none"
                stroke="var(--color-warn)"
                strokeWidth="1.8"
                strokeDasharray="4 2"
              />
            )}

            {/* Bollinger Bands Lines */}
            {showBollinger && (
              <>
                <path
                  d={bbUpper
                    .map((v, i) => (v === null ? '' : `${i === 5 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`))
                    .filter(Boolean)
                    .join(' ')}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                <path
                  d={bbLower
                    .map((v, i) => (v === null ? '' : `${i === 5 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`))
                    .filter(Boolean)
                    .join(' ')}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
              </>
            )}

            {/* User Custom Interactive Drawings */}
            {drawings.map((d) => {
              if (d.type === 'horizontal') {
                return (
                  <g key={d.id}>
                    <line
                      x1={PAD_L}
                      y1={d.y1}
                      x2={W - PAD_R}
                      y2={d.y1}
                      stroke="var(--color-warn)"
                      strokeWidth="1.8"
                      strokeDasharray="4 2"
                    />
                    <rect
                      x={W - PAD_R + 2}
                      y={d.y1 - 9}
                      width={PAD_R - 4}
                      height={18}
                      rx="3"
                      fill="var(--color-warn)"
                    />
                    <text
                      x={W - PAD_R + 6}
                      y={d.y1 + 4}
                      fontSize="10"
                      fontWeight="600"
                      fill="#ffffff"
                    >
                      {formatPrice(d.price1, symbol.decimals)}
                    </text>
                  </g>
                );
              }
              if (d.type === 'trendline') {
                return (
                  <line
                    key={d.id}
                    x1={d.x1}
                    y1={d.y1}
                    x2={d.x2}
                    y2={d.y2}
                    stroke="var(--color-primary)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                );
              }
              if (d.type === 'fib') {
                const yTop = Math.min(d.y1, d.y2);
                const yBottom = Math.max(d.y1, d.y2);
                const h = yBottom - yTop;
                const levels = [
                  { ratio: 0, label: '0.0% (Base)' },
                  { ratio: 0.236, label: '23.6%' },
                  { ratio: 0.382, label: '38.2%' },
                  { ratio: 0.5, label: '50.0%' },
                  { ratio: 0.618, label: '61.8% (Golden)' },
                  { ratio: 0.786, label: '78.6%' },
                  { ratio: 1.0, label: '100.0%' },
                ];
                return (
                  <g key={d.id}>
                    {levels.map((lvl) => {
                      const yLevel = yBottom - h * lvl.ratio;
                      return (
                        <g key={lvl.label}>
                          <line
                            x1={PAD_L}
                            y1={yLevel}
                            x2={W - PAD_R}
                            y2={yLevel}
                            stroke="var(--color-primary)"
                            strokeOpacity="0.45"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <text
                            x={PAD_L + 6}
                            y={yLevel - 3}
                            fontSize="9"
                            fill="var(--color-muted)"
                          >
                            Fib {lvl.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              }
              if (d.type === 'ruler') {
                const pDelta = d.price2 - d.price1;
                const pct = ((pDelta / d.price1) * 100).toFixed(2);
                return (
                  <g key={d.id}>
                    <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke="var(--color-foreground)" strokeWidth="1.5" />
                    <rect
                      x={(d.x1 + d.x2) / 2 - 40}
                      y={(d.y1 + d.y2) / 2 - 12}
                      width={80}
                      height={24}
                      rx="4"
                      fill="var(--color-surface)"
                      stroke="var(--color-border)"
                    />
                    <text
                      x={(d.x1 + d.x2) / 2}
                      y={(d.y1 + d.y2) / 2 + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      fill={pDelta >= 0 ? 'var(--color-up)' : 'var(--color-down)'}
                    >
                      {pDelta >= 0 ? '+' : ''}{pct}%
                    </text>
                  </g>
                );
              }
              return null;
            })}

            {/* Hover Crosshair & Data Readout */}
            {hoverIdx !== null && points[hoverIdx] && (
              <g>
                <line
                  x1={xAt(hoverIdx)}
                  y1={PAD_T}
                  x2={xAt(hoverIdx)}
                  y2={PAD_T + plotH}
                  stroke="var(--color-muted)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <line
                  x1={PAD_L}
                  y1={yAt(points[hoverIdx].close)}
                  x2={W - PAD_R}
                  y2={yAt(points[hoverIdx].close)}
                  stroke="var(--color-muted)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <circle
                  cx={xAt(hoverIdx)}
                  cy={yAt(points[hoverIdx].close)}
                  r="4"
                  fill={strokeColor}
                  stroke="var(--color-background)"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Right Y-Axis Price Ladder Labels */}
            {yTicks.map((t, idx) => (
              <text
                key={`yt-${idx}`}
                x={W - PAD_R + 8}
                y={t.y + 4}
                fontSize="11"
                fill="var(--color-muted)"
                className="tabular-nums svg-halo"
              >
                {formatPrice(t.val, symbol.decimals)}
              </text>
            ))}

            {/* Live Right-Axis Price Pill */}
            <g>
              <rect
                x={W - PAD_R + 4}
                y={Math.max(PAD_T, Math.min(PAD_T + plotH - 18, yAt(activePoint.close) - 10))}
                width={PAD_R - 6}
                height={20}
                rx="4"
                fill={strokeColor}
              />
              <text
                x={W - PAD_R + 8}
                y={Math.max(PAD_T + 14, Math.min(PAD_T + plotH - 4, yAt(activePoint.close) + 4))}
                fontSize="11"
                fontWeight="700"
                fill="#ffffff"
                className="tabular-nums"
              >
                {formatPrice(activePoint.close, symbol.decimals)}
              </text>
            </g>

            {/* Bottom X-axis Time Labels */}
            {xTickIndices.map((ptIdx, i) => (
              <text
                key={`xt-${i}`}
                x={xAt(ptIdx)}
                y={mainPlotH - 8}
                textAnchor={i === 0 ? 'start' : i === xTickIndices.length - 1 ? 'end' : 'middle'}
                fontSize="11"
                fill="var(--color-muted)"
                className="tabular-nums svg-halo"
              >
                {points[ptIdx]?.timeLabel}
              </text>
            ))}

            {/* SUB-PANE: RSI (14) OSCILLATOR */}
            {showRsi && (
              <g transform={`translate(0, ${mainPlotH})`}>
                <line x1={PAD_L} y1={0} x2={W - PAD_R} y2={0} stroke="var(--color-border)" strokeWidth="1" />
                {/* 30-70 Band Shading */}
                <rect x={PAD_L} y={18} width={plotW} height={44} fill="var(--color-primary)" fillOpacity="0.06" />
                <line x1={PAD_L} y1={18} x2={W - PAD_R} y2={18} stroke="var(--color-border)" strokeDasharray="2 2" />
                <line x1={PAD_L} y1={62} x2={W - PAD_R} y2={62} stroke="var(--color-border)" strokeDasharray="2 2" />
                <text x={PAD_L + 6} y={14} fontSize="10" fontWeight="600" fill="var(--color-muted)">
                  RSI 14: <tspan fill="var(--color-foreground)">{rsiValues[hoverIdx ?? points.length - 1] ?? 50}</tspan>
                </text>
                <text x={W - PAD_R + 8} y={22} fontSize="10" fill="var(--color-muted)">70</text>
                <text x={W - PAD_R + 8} y={66} fontSize="10" fill="var(--color-muted)">30</text>
                <path
                  d={rsiValues
                    .map((val, i) => {
                      if (val === null) return '';
                      const y = 80 - (val / 100) * 70;
                      return `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth="1.8"
                />
              </g>
            )}

            {/* SUB-PANE: MACD (12, 26, 9) */}
            {showMacd && (
              <g transform={`translate(0, ${mainPlotH + (showRsi ? 90 : 0)})`}>
                <line x1={PAD_L} y1={0} x2={W - PAD_R} y2={0} stroke="var(--color-border)" strokeWidth="1" />
                <text x={PAD_L + 6} y={14} fontSize="10" fontWeight="600" fill="var(--color-muted)">
                  MACD (12,26,9)
                </text>
                <line x1={PAD_L} y1={45} x2={W - PAD_R} y2={45} stroke="var(--color-border)" strokeDasharray="2 2" />
                {macdData.histogram.map((hVal, idx) => {
                  const barHeight = Math.min(35, Math.abs(hVal) * 8);
                  const isUp = hVal >= 0;
                  const y = isUp ? 45 - barHeight : 45;
                  return (
                    <rect
                      key={`macd-${idx}`}
                      x={xAt(idx) - 1.5}
                      y={y}
                      width={3}
                      height={barHeight}
                      fill={isUp ? 'var(--color-up)' : 'var(--color-down)'}
                    />
                  );
                })}
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
