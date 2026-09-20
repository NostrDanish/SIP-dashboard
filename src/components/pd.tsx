import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Mono section eyebrow + title, mission-control style. */
export function SectionHeader({
  index,
  eyebrow,
  title,
  right,
}: {
  index: string;
  eyebrow: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#1a2540] pb-4">
      <div>
        <div className="font-mono-pd mb-2 flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[#7c87a0]">
          <span className="text-[#f0b45a]">{index}</span>
          <span className="h-px w-8 bg-[#1a2540]" />
          <span>{eyebrow}</span>
        </div>
        <h2 className="font-mono-pd text-2xl font-bold uppercase tracking-tight text-[#ede6d6] sm:text-3xl">
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

/** A hairline panel with a mono label strip on top. */
export function Panel({
  label,
  children,
  className,
  pad = true,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div className={cn('panel', className)}>
      {label && (
        <div className="font-mono-pd flex items-center gap-2 border-b border-[#1a2540] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#7c87a0]">
          <span className="inline-block h-1.5 w-1.5 bg-[#f0b45a]" />
          {label}
        </div>
      )}
      <div className={cn(pad && 'p-4')}>{children}</div>
    </div>
  );
}

/** Label + animated big number + subline. */
export function StatBlock({
  label,
  value,
  sub,
  tone = 'amber',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'amber' | 'purple' | 'mint' | 'plain';
}) {
  const toneClass =
    tone === 'amber'
      ? 'glow-amber'
      : tone === 'purple'
        ? 'glow-purple'
        : tone === 'mint'
          ? 'glow-mint'
          : 'text-[#ede6d6]';
  return (
    <div>
      <div className="font-mono-pd text-[10px] uppercase tracking-[0.2em] text-[#7c87a0]">{label}</div>
      <div className={cn('font-mono-pd mt-1 text-3xl font-extrabold tabular-nums leading-none sm:text-4xl', toneClass)}>
        {value}
      </div>
      {sub && <div className="font-mono-pd mt-2 text-[11px] text-[#7c87a0]">{sub}</div>}
    </div>
  );
}

/** Tiny status pill with LED. */
export function StatusPill({ status }: { status: 'ok' | 'partial' | 'failed' }) {
  const map = {
    ok: { dot: 'dot-live', text: 'text-[#34d399]', label: 'OK' },
    partial: { dot: 'dot-warn', text: 'text-[#fbbf24]', label: 'PARTIAL' },
    failed: { dot: 'dot-dead', text: 'text-[#f87171]', label: 'FAILED' },
  } as const;
  const s = map[status];
  return (
    <span className={cn('font-mono-pd inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]', s.text)}>
      <span className={s.dot} />
      {s.label}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-[#111a2b]', className)} style={{ borderRadius: 2 }} />
  );
}
