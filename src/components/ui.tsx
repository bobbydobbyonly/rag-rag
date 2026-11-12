import React, { Component, type ComponentProps, type ReactNode, useState } from 'react';
import { ChevronRight } from 'lucide-react';

export const Surface = ({
  inset = false,
  className = '',
  ...p
}: ComponentProps<'div'> & { inset?: boolean }) => (
  <div
    className={`min-w-0 [:where(&)]:rounded-card [:where(&)]:text-foreground ${
      inset ? '[:where(&)]:bg-background' : '[:where(&)]:bg-surface [:where(&)]:shadow-surface'
    } ${className}`}
    {...p}
  />
);

const tones = {
  primary: '[:where(&)]:bg-primary [:where(&)]:text-primary-foreground',
  ink: '[:where(&)]:bg-ink-button [:where(&)]:text-ink-button-fg',
  quiet:
    '[:where(&)]:border [:where(&)]:border-border [:where(&)]:bg-surface [:where(&)]:text-foreground hover:bg-surface-hover',
  ghost:
    '[:where(&)]:bg-transparent [:where(&)]:text-foreground hover:bg-surface-hover',
};

export const Button = ({
  tone = 'primary',
  type = 'button',
  className = '',
  ...p
}: ComponentProps<'button'> & { tone?: keyof typeof tones }) => (
  <button
    type={type}
    className={`[:where(&)]:inline-flex [:where(&)]:min-h-10 [:where(&)]:items-center [:where(&)]:justify-center [:where(&)]:gap-2 whitespace-nowrap [:where(&)]:rounded-control [:where(&)]:px-3.5 [:where(&)]:text-sm [:where(&)]:font-medium transition-colors duration-150 ease-out active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 ${tones[tone]} ${className}`}
    {...p}
  />
);

export const Field = ({
  label,
  id,
  className = '',
  children,
}: {
  label: string;
  id: string;
  className?: string;
  children: ReactNode;
}) => (
  <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
    <label htmlFor={id} className="text-xs font-medium text-muted">
      {label}
    </label>
    {children}
  </div>
);

const FALLBACK_TONES = [
  'bg-primary/15 text-primary',
  'bg-up/15 text-up',
  'bg-down/15 text-down',
  'bg-warn/15 text-warn',
];

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function SymbolLogo({
  logoUrl,
  secondaryLogoUrl,
  symbol,
  name,
  size = 'md',
}: {
  logoUrl?: string;
  secondaryLogoUrl?: string;
  symbol: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const [failedPrimary, setFailedPrimary] = useState(false);
  const [failedSecondary, setFailedSecondary] = useState(false);

  const dims =
    size === 'xs'
      ? 'w-5 h-5 text-[10px]'
      : size === 'sm'
      ? 'w-7 h-7 text-xs'
      : size === 'lg'
      ? 'w-11 h-11 text-sm'
      : 'w-9 h-9 text-xs';

  const toneClass = FALLBACK_TONES[hashCode(symbol) % FALLBACK_TONES.length];

  if (logoUrl && secondaryLogoUrl && !failedPrimary && !failedSecondary) {
    const pairContainer =
      size === 'xs' ? 'w-6 h-5' : size === 'sm' ? 'w-8 h-7' : size === 'lg' ? 'w-12 h-11' : 'w-10 h-9';
    const subCircle =
      size === 'xs' ? 'w-4 h-4' : size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
    return (
      <div className={`relative shrink-0 ${pairContainer}`} aria-hidden="true">
        <img
          src={secondaryLogoUrl}
          alt={`${name} quote currency`}
          referrerPolicy="no-referrer"
          onError={() => setFailedSecondary(true)}
          className={`absolute bottom-0 right-0 ${subCircle} rounded-full object-cover ring-2 ring-background`}
        />
        <img
          src={logoUrl}
          alt={`${name} base currency`}
          referrerPolicy="no-referrer"
          onError={() => setFailedPrimary(true)}
          className={`absolute top-0 left-0 ${subCircle} rounded-full object-cover ring-2 ring-background`}
        />
      </div>
    );
  }

  if (logoUrl && !failedPrimary) {
    return (
      <img
        src={logoUrl}
        alt={`${name} (${symbol})`}
        referrerPolicy="no-referrer"
        onError={() => setFailedPrimary(true)}
        className={`${dims} shrink-0 rounded-full object-cover`}
      />
    );
  }

  const initials = symbol.replace(/[^A-Z0-9]/gi, '').slice(0, 2).toUpperCase() || 'TV';
  return (
    <div
      aria-hidden="true"
      className={`${dims} shrink-0 rounded-full flex items-center justify-center font-semibold tracking-tight ${toneClass}`}
    >
      {initials}
    </div>
  );
}

export function formatPrice(price: number, decimals?: number): string {
  const d =
    decimals !== undefined
      ? decimals
      : price >= 1000
      ? 2
      : price >= 10
      ? 2
      : price >= 1
      ? 4
      : 5;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(price);
}

export function PriceChange({
  value,
  suffix = '%',
  className = '',
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const sign = isPositive ? '+' : isNegative ? '−' : '';
  const absFormatted = Math.abs(value).toFixed(2);
  const colorClass = isPositive
    ? 'text-up'
    : isNegative
    ? 'text-down'
    : 'text-muted';

  return (
    <span className={`tabular-nums font-medium whitespace-nowrap ${colorClass} ${className}`}>
      {sign}
      {absFormatted}
      {suffix}
    </span>
  );
}

export function SectionHeading({
  title,
  onClick,
  level = 'h2',
  logoUrl,
}: {
  title: string;
  onClick?: () => void;
  level?: 'h2' | 'h3';
  logoUrl?: string;
}) {
  const textClass =
    level === 'h2'
      ? 'text-section font-bold tracking-tight text-foreground'
      : 'text-lg font-semibold tracking-tight text-foreground';

  const content = (
    <span className="inline-flex items-center gap-2 group">
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="w-6 h-6 rounded-full object-cover shrink-0"
        />
      )}
      <span>{title}</span>
      {onClick && (
        <ChevronRight className="w-5 h-5 text-muted transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-primary shrink-0" />
      )}
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${textClass} text-left inline-flex items-center hover:text-primary transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm`}
      >
        {level === 'h2' ? <h2>{content}</h2> : <h3>{content}</h3>}
      </button>
    );
  }

  return level === 'h2' ? (
    <h2 className={textClass}>{content}</h2>
  ) : (
    <h3 className={textClass}>{content}</h3>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unexpected display error.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-6">
          <Surface className="max-w-md w-full p-6 border border-border space-y-4" role="alert">
            <h1 className="text-lg font-semibold">Unable to render market view</h1>
            <p className="text-sm text-muted">{this.state.message}</p>
            <Button tone="primary" onClick={() => window.location.reload()}>
              Reload application
            </Button>
          </Surface>
        </div>
      );
    }
    return this.props.children;
  }
}
