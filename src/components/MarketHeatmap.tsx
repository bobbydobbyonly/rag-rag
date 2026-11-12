import React, { useMemo } from 'react';
import type { MarketSymbol } from '../data/marketsData';

interface RectBox {
  item: MarketSymbol;
  x: number;
  y: number;
  w: number;
  h: number;
}

function layoutTreemap(
  items: MarketSymbol[],
  x: number,
  y: number,
  w: number,
  h: number
): RectBox[] {
  if (items.length === 0 || w <= 0 || h <= 0) return [];
  if (items.length === 1) {
    return [{ item: items[0], x, y, w, h }];
  }

  const weights = items.map((s) => Math.max(10, Math.sqrt(s.marketCapB ?? 50)));
  const total = weights.reduce((a, b) => a + b, 0);

  let acc = 0;
  let splitIdx = 1;
  for (let i = 0; i < weights.length - 1; i++) {
    acc += weights[i];
    splitIdx = i + 1;
    if (acc >= total / 2) break;
  }

  const ratio = acc / (total || 1);
  const leftItems = items.slice(0, splitIdx);
  const rightItems = items.slice(splitIdx);

  if (w >= h) {
    const wLeft = w * ratio;
    return [
      ...layoutTreemap(leftItems, x, y, wLeft, h),
      ...layoutTreemap(rightItems, x + wLeft, y, w - wLeft, h),
    ];
  } else {
    const hTop = h * ratio;
    return [
      ...layoutTreemap(leftItems, x, y, w, hTop),
      ...layoutTreemap(rightItems, x, y + hTop, w, h - hTop),
    ];
  }
}

function heatmapFill(changePct: number): string {
  if (changePct >= 3.0) return '#089981';
  if (changePct >= 1.2) return '#158471';
  if (changePct > 0.15) return '#24665c';
  if (changePct >= -0.15) return '#363a45';
  if (changePct >= -1.2) return '#84343d';
  if (changePct >= -3.0) return '#bd2e3c';
  return '#f23645';
}

export function MarketHeatmap({
  symbols,
  onSelectSymbol,
}: {
  symbols: MarketSymbol[];
  onSelectSymbol: (symbol: string) => void;
}) {
  const sorted = useMemo(
    () =>
      [...symbols]
        .sort((a, b) => (b.marketCapB ?? 50) - (a.marketCapB ?? 50))
        .slice(0, 18),
    [symbols]
  );

  const W = 1000;
  const H = 500;
  const boxes = useMemo(() => layoutTreemap(sorted, 0, 0, W, H), [sorted]);

  return (
    <div className="space-y-3 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>Tile area weighted by market capitalization · Color by 24h performance (%)</span>
        <div className="flex items-center gap-1.5 tabular-nums">
          <span>−3%</span>
          <span className="w-4 h-3 rounded-xs" style={{ backgroundColor: '#f23645' }} />
          <span className="w-4 h-3 rounded-xs" style={{ backgroundColor: '#84343d' }} />
          <span className="w-4 h-3 rounded-xs" style={{ backgroundColor: '#363a45' }} />
          <span className="w-4 h-3 rounded-xs" style={{ backgroundColor: '#24665c' }} />
          <span className="w-4 h-3 rounded-xs" style={{ backgroundColor: '#089981' }} />
          <span>+3%</span>
        </div>
      </div>

      <div className="rounded-card overflow-hidden border border-border">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block select-none"
          role="img"
          aria-label="Market capitalization performance heatmap"
        >
          {boxes.map(({ item, x, y, w, h }) => {
            const pad = 1.5;
            const bw = Math.max(0, w - pad * 2);
            const bh = Math.max(0, h - pad * 2);
            const cx = x + w / 2;
            const cy = y + h / 2;
            const showLogo = bw >= 86 && bh >= 86 && Boolean(item.logoUrl);
            const showLabel = bw >= 54 && bh >= 38;
            const sign = item.changePct > 0 ? '+' : item.changePct < 0 ? '−' : '';
            const pctText = `${sign}${Math.abs(item.changePct).toFixed(2)}%`;

            return (
              <g
                key={item.symbol}
                onClick={() => onSelectSymbol(item.symbol)}
                className="cursor-pointer hover:brightness-110 transition-[filter] duration-150"
              >
                <title>
                  {item.name} ({item.symbol}): {pctText} · Market cap {item.marketCap ?? `${item.marketCapB}B`}
                </title>
                <rect
                  x={x + pad}
                  y={y + pad}
                  width={bw}
                  height={bh}
                  rx="4"
                  fill={heatmapFill(item.changePct)}
                />
                {showLogo && item.logoUrl && (
                  <image
                    href={item.logoUrl}
                    x={cx - 14}
                    y={cy - 34}
                    width="28"
                    height="28"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath="inset(0% round 14px)"
                  />
                )}
                {showLabel && (
                  <>
                    <text
                      x={cx}
                      y={showLogo ? cy + 10 : cy - 3}
                      textAnchor="middle"
                      fontSize={bw > 130 ? '15' : '12'}
                      fontWeight="700"
                      fill="#ffffff"
                    >
                      {item.symbol}
                    </text>
                    <text
                      x={cx}
                      y={showLogo ? cy + 28 : cy + 14}
                      textAnchor="middle"
                      fontSize={bw > 130 ? '13' : '11'}
                      fontWeight="500"
                      fill="rgba(255,255,255,0.92)"
                      className="tabular-nums"
                    >
                      {pctText}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
