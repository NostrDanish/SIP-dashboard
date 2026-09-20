import type { IndexStats } from '@/hooks/useIndexStats';
import { Panel, SectionHeader, StatBlock, Skeleton } from '@/components/pd';
import { useCountUp } from '@/hooks/useCountUp';
import { formatNumber } from '@/lib/format';
import { SIP01 } from '@/lib/sip01';

function AnimatedStat({
  label,
  target,
  sub,
  tone,
  suffix,
}: {
  label: string;
  target: number;
  sub?: string;
  tone?: 'amber' | 'purple' | 'mint' | 'plain';
  suffix?: string;
}) {
  const v = useCountUp(target);
  return <StatBlock label={label} value={`${formatNumber(v)}${suffix ?? ''}`} sub={sub} tone={tone} />;
}

/** Shard coverage gauge — 256 segments, lit per live shard. */
function ShardGauge({ stats }: { stats: IndexStats }) {
  const liveShards = new Set(stats.liveNodes.map((hb) => hb.shard));
  const pct = stats.shardsCovered / SIP01.shardCount;
  return (
    <Panel label="shard coverage · kind 16919 · 1h TTL" className="h-full">
      <div className="flex items-end justify-between">
        <StatBlock
          label="live shards"
          value={`${stats.shardsCovered}`}
          sub={`of ${SIP01.shardCount} addressable shards (00–FF)`}
          tone="purple"
        />
        <div className="font-mono-pd text-right">
          <div className="text-2xl font-extrabold tabular-nums text-[#ede6d6]">
            {(pct * 100).toFixed(1)}%
          </div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-[#7c87a0]">covered</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-[repeat(32,minmax(0,1fr))] gap-[2px]">
        {Array.from({ length: SIP01.shardCount }, (_, i) => {
          const hex = i.toString(16).toUpperCase().padStart(2, '0');
          const live = liveShards.has(hex);
          const nodes = stats.liveNodes.filter((hb) => hb.shard === hex).length;
          return (
            <div
              key={hex}
              title={live ? `shard ${hex} · ${nodes} node${nodes > 1 ? 's' : ''}` : `shard ${hex} · idle`}
              className="shard-cell aspect-square"
              style={{
                backgroundColor: live ? '#a855f7' : '#111a2b',
                boxShadow: live ? '0 0 6px rgba(168,85,247,0.55)' : undefined,
              }}
            />
          );
        })}
      </div>
      <div className="font-mono-pd mt-3 flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-[#7c87a0]">
        <span>00</span>
        <span>deterministic sharding · coordinator-free work splitting</span>
        <span>FF</span>
      </div>
    </Panel>
  );
}

export function MissionControl({ stats, loading }: { stats: IndexStats | null; loading: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeader
        index="01"
        eyebrow="mission control"
        title="Index at a glance"
        right={
          stats && (
            <div className="font-mono-pd text-[10px] uppercase tracking-[0.2em] text-[#7c87a0]">
              window · latest {formatNumber(stats.observations.length)} events ·{' '}
              {stats.relayCoverage.length} relays
            </div>
          )
        }
      />

      {loading && !stats ? (
        <div className="grid gap-px border border-[#1a2540] bg-[#1a2540] sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="bg-[#0b1120] p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-9 w-32" />
              <Skeleton className="mt-3 h-3 w-40" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-px border border-[#1a2540] bg-[#1a2540] sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'observations read', target: stats.observations.length, sub: `kind ${SIP01.kind} · cross-relay deduped`, tone: 'amber' as const },
              { label: 'unique documents', target: stats.documents, sub: 'distinct d tags · URL identity', tone: 'amber' as const },
              { label: 'independent indexers', target: stats.indexerCount, sub: 'distinct signing pubkeys', tone: 'plain' as const },
              { label: 'hosts observed', target: stats.hosts, sub: 'unique normalized hosts', tone: 'plain' as const },
              { label: 'live crawler nodes', target: stats.liveNodes.length, sub: `heartbeat < 1h · ${stats.heartbeats.length} total seen`, tone: 'mint' as const },
              { label: 'pages indexed (self-rep.)', target: stats.selfReported.pagesIndexed, sub: 'summed over live node heartbeats', tone: 'mint' as const },
              { label: 'crawl queue (self-rep.)', target: stats.selfReported.queueSize, sub: 'URLs waiting across live nodes', tone: 'plain' as const },
              { label: 'published (self-rep.)', target: stats.selfReported.published, sub: 'events emitted by live nodes', tone: 'plain' as const },
            ].map((s) => (
              <div key={s.label} className="bg-[#0b1120] p-5 transition-colors hover:bg-[#111a2b]">
                <AnimatedStat {...s} />
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <ShardGauge stats={stats} />
            <Panel label="spec conformance · full validation, client-side">
              <div className="flex h-full flex-col justify-between gap-6">
                <div className="flex items-end justify-between">
                  <StatBlock
                    label="valid observations"
                    value={stats.validityRate === null ? '—' : `${(stats.validityRate * 100).toFixed(1)}%`}
                    sub={`${formatNumber(stats.validatedCount)} events re-validated in your browser (d ↔ u, x ↔ content, tag shapes)`}
                    tone="mint"
                  />
                  <div className="font-mono-pd text-right text-[10px] uppercase leading-relaxed tracking-[0.18em] text-[#7c87a0]">
                    sha256(d) ↔ normalized u
                    <br />
                    sha256(x) ↔ title+description
                  </div>
                </div>
                <div className="h-2 w-full bg-[#111a2b]">
                  <div
                    className="h-full transition-all duration-1000"
                    style={{
                      width: `${(stats.validityRate ?? 0) * 100}%`,
                      background: 'linear-gradient(90deg, #34d399, #f0b45a)',
                      boxShadow: '0 0 12px rgba(52,211,153,0.5)',
                    }}
                  />
                </div>
                <p className="text-[12px] leading-relaxed text-[#7c87a0]">
                  Every sampled event is checked against the same ingestion rules the UNCAGED Index
                  Relay applies at the door — the dashboard trusts nothing it cannot recompute.
                </p>
              </div>
            </Panel>
          </div>
        </>
      ) : null}
    </section>
  );
}
