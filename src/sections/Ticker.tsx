import type { IndexStats } from '@/hooks/useIndexStats';
import { formatCompact, formatNumber } from '@/lib/format';
import { SIP01 } from '@/lib/sip01';

function Item({ label, value, tone = 'text-[#ede6d6]' }: { label: string; value: string; tone?: string }) {
  return (
    <span className="font-mono-pd mx-6 flex items-center gap-2 whitespace-nowrap text-[11px] uppercase tracking-[0.16em]">
      <span className="text-[#f0b45a]">▸</span>
      <span className="text-[#7c87a0]">{label}</span>
      <span className={`tabular-nums ${tone}`}>{value}</span>
    </span>
  );
}

export function Ticker({ stats }: { stats: IndexStats | null }) {
  const items = stats
    ? [
        { label: 'observations', value: formatNumber(stats.observations.length) },
        { label: 'unique documents', value: formatNumber(stats.documents) },
        { label: 'independent indexers', value: formatNumber(stats.indexerCount) },
        { label: 'live crawler nodes', value: formatNumber(stats.liveNodes.length), tone: 'text-[#34d399]' },
        { label: 'shards covered', value: `${stats.shardsCovered}/${SIP01.shardCount}` },
        { label: 'hosts observed', value: formatNumber(stats.hosts) },
        {
          label: 'validity (sampled)',
          value: stats.validityRate === null ? '—' : `${(stats.validityRate * 100).toFixed(1)}%`,
          tone: 'text-[#34d399]',
        },
        { label: 'self-reported pages', value: formatCompact(stats.selfReported.pagesIndexed) },
        { label: 'kind', value: String(SIP01.kind), tone: 'text-[#a855f7]' },
        { label: 'heartbeat kind', value: String(SIP01.heartbeatKind), tone: 'text-[#a855f7]' },
        { label: 'spec', value: `v${SIP01.version}` },
        { label: 'relays read', value: formatNumber(stats.relayCoverage.length) },
      ]
    : [
        { label: 'kind', value: String(SIP01.kind), tone: 'text-[#a855f7]' },
        { label: 'spec', value: `v${SIP01.version}` },
        { label: 'status', value: 'reading relays…', tone: 'text-[#fbbf24]' },
      ];

  const doubled = [...items, ...items];
  return (
    <div className="relative mt-[93px] overflow-hidden border-b border-[#1a2540] bg-[#0b1120]/60 py-2">
      <div className="ticker-track">
        {doubled.map((it, i) => (
          <Item key={i} label={it.label} value={it.value} tone={it.tone} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#050810] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#050810] to-transparent" />
    </div>
  );
}
