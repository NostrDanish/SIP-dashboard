import type { IndexStats } from '@/hooks/useIndexStats';
import { Panel, SectionHeader, StatusPill, Skeleton } from '@/components/pd';
import { formatNumber, relayHost, shortKey, timeAgo } from '@/lib/format';
import { heartbeatFamily, sourceVersion, HEARTBEAT_KIND, type ParsedHeartbeat } from '@/lib/heartbeat';
import { SIP01 } from '@/lib/sip01';

const FAMILY_META = {
  indexstr: { color: '#a855f7', desc: 'Distributed indexing network — sharded crawling + heartbeats' },
  crawlstr: { color: '#f0b45a', desc: 'Browser scouts — per-device anonymous indexer keys' },
  other: { color: '#7c87a0', desc: 'Engines & any other SIP-01 publisher — the pool is open' },
} as const;

function FamilyCards({ stats }: { stats: IndexStats }) {
  // Per-version observation counts, derived live from the window.
  const versionCounts = (family: string): Map<number, number> => {
    const counts = new Map<number, number>();
    for (const o of stats.observations) {
      const src = (o.source ?? '').toLowerCase();
      if (!src.startsWith(family)) continue;
      const v = sourceVersion(o.source);
      if (v !== null) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return counts;
  };

  const families = (['indexstr', 'crawlstr', 'other'] as const).map((fam) => {
    const obs = stats.families.find((f) => f.family === fam);
    const live = stats.liveByFamily[fam === 'other' ? 'unknown' : fam];
    const versions = fam === 'other' ? new Map<number, number>() : versionCounts(fam);
    return { fam, obs, live, versions };
  });

  return (
    <div className="grid gap-px border border-[#1a2540] bg-[#1a2540] md:grid-cols-3">
      {families.map(({ fam, obs, live, versions }) => {
        const meta = FAMILY_META[fam];
        return (
          <div key={fam} className="bg-[#0b1120] p-5">
            <div className="flex items-center justify-between">
              <div className="font-mono-pd text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: meta.color }}>
                {fam === 'other' ? 'Other publishers' : fam}
              </div>
              <span className="font-mono-pd flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[#34d399]">
                <span className={live > 0 ? 'dot-live' : 'dot-dead'} />
                {live} live
              </span>
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-[#7c87a0]">{meta.desc}</p>
            <div className="font-mono-pd mt-4 grid grid-cols-3 gap-2 border-t border-[#1a2540] pt-3">
              {[
                { l: 'obs', v: obs?.observations ?? 0 },
                { l: 'indexers', v: obs?.indexers ?? 0 },
                { l: 'docs', v: obs?.documents ?? 0 },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-lg font-extrabold tabular-nums text-[#ede6d6]">{formatNumber(s.v)}</div>
                  <div className="text-[8.5px] uppercase tracking-[0.18em] text-[#7c87a0]">{s.l}</div>
                </div>
              ))}
            </div>
            {fam !== 'other' && versions.size > 0 && (
              <div className="font-mono-pd mt-3 flex flex-wrap gap-2 text-[9px] uppercase tracking-[0.16em]">
                {[...versions.entries()]
                  .sort((a, b) => a[0] - b[0])
                  .map(([v, count]) => {
                    const latest = v === Math.max(...versions.keys());
                    return (
                      <span
                        key={v}
                        className={`border px-2 py-0.5 ${
                          latest && count > 0
                            ? 'border-[#f0b45a]/60 bg-[#f0b45a]/10 text-[#f0b45a]'
                            : 'border-[#1a2540] text-[#7c87a0]'
                        }`}
                      >
                        v{v} · {formatNumber(count)} obs
                      </span>
                    );
                  })}
              </div>
            )}
            <div className="font-mono-pd mt-3 text-[10px] text-[#7c87a0]">
              {obs?.sources.length ? `source: ${obs.sources.join(', ')}` : 'no observations in window'}
              {obs && obs.lastSeen > 0 && <span className="float-right">{timeAgo(obs.lastSeen)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NodeRow({ hb, rank }: { hb: ParsedHeartbeat; rank: number }) {
  const fam = heartbeatFamily(hb.source);
  const famColor = FAMILY_META[fam === 'unknown' ? 'other' : fam].color;
  return (
    <tr className="border-b border-[#1a2540]/60 transition-colors last:border-0 hover:bg-[#111a2b]/60">
      <td className="font-mono-pd px-3 py-2 text-[10px] text-[#7c87a0]">{String(rank).padStart(2, '0')}</td>
      <td className="font-mono-pd px-3 py-2 text-[11px] text-[#ede6d6]">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#34d399] shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        {shortKey(hb.pubkey)}
      </td>
      <td className="font-mono-pd px-3 py-2 text-[10px] uppercase tracking-[0.14em]" style={{ color: famColor }}>
        {hb.source ?? fam}
      </td>
      <td className="font-mono-pd px-3 py-2 text-[11px] font-bold text-[#a855f7]">{hb.shard}</td>
      <td className="font-mono-pd hidden px-3 py-2 text-[10px] text-[#7c87a0] md:table-cell">{hb.platform}</td>
      <td className="font-mono-pd hidden px-3 py-2 text-[10px] text-[#7c87a0] lg:table-cell">{hb.network}</td>
      <td className="font-mono-pd px-3 py-2 text-right text-[11px] tabular-nums text-[#ede6d6]">
        {formatNumber(hb.stats.pagesIndexed)}
      </td>
      <td className="font-mono-pd hidden px-3 py-2 text-right text-[11px] tabular-nums text-[#7c87a0] sm:table-cell">
        {formatNumber(hb.stats.queueSize)}
      </td>
      <td className="font-mono-pd px-3 py-2 text-right text-[10px] tabular-nums text-[#34d399]">
        {timeAgo(hb.createdAt)}
      </td>
    </tr>
  );
}

function NodeTable({ stats }: { stats: IndexStats }) {
  const nodes = stats.liveNodes;
  return (
    <Panel label={`live nodes · kind ${HEARTBEAT_KIND} heartbeats · freshest first`} pad={false}>
      {nodes.length === 0 ? (
        <div className="font-mono-pd p-6 text-center text-[11px] uppercase tracking-[0.18em] text-[#7c87a0]">
          no live heartbeats in the last hour — {stats.heartbeats.length} stale node
          {stats.heartbeats.length === 1 ? '' : 's'} seen previously
        </div>
      ) : (
        <div className="max-h-[380px] overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-[#0b1120]">
              <tr className="border-b border-[#1a2540]">
                {['#', 'node', 'software', 'shard', 'platform', 'network', 'pages', 'queue', 'seen'].map((h, i) => (
                  <th
                    key={h}
                    className={`font-mono-pd px-3 py-2 text-left text-[9px] font-medium uppercase tracking-[0.18em] text-[#7c87a0] ${
                      i >= 6 ? 'text-right' : ''
                    } ${h === 'platform' ? 'hidden md:table-cell' : ''} ${h === 'network' ? 'hidden lg:table-cell' : ''} ${
                      h === 'queue' ? 'hidden text-right sm:table-cell' : ''
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.map((hb, i) => (
                <NodeRow key={hb.pubkey} hb={hb} rank={i + 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="font-mono-pd border-t border-[#1a2540] px-4 py-2 text-[9px] uppercase tracking-[0.18em] text-[#7c87a0]">
        heartbeats are self-reported — reputation derives from signed kind {SIP01.kind} observations
      </div>
    </Panel>
  );
}

function RelayCoverage({ stats }: { stats: IndexStats }) {
  const maxObs = Math.max(1, ...stats.relayCoverage.map((r) => r.observations));
  return (
    <Panel label="per-relay coverage · where the index actually lives" pad={false}>
      <div className="divide-y divide-[#1a2540]/60">
        {stats.relayCoverage.map((r) => (
          <div key={r.url} className="flex items-center gap-3 px-4 py-2.5">
            <StatusPill status={r.status} />
            <span className="font-mono-pd min-w-0 flex-1 truncate text-[11px] text-[#ede6d6]">
              {relayHost(r.url)}
            </span>
            <div className="hidden h-1.5 w-32 bg-[#111a2b] sm:block">
              <div
                className="h-full bg-[#f0b45a] transition-all duration-700"
                style={{ width: `${(r.observations / maxObs) * 100}%`, boxShadow: '0 0 6px rgba(240,180,90,0.4)' }}
              />
            </div>
            <span className="font-mono-pd w-16 text-right text-[11px] tabular-nums text-[#ede6d6]">
              {formatNumber(r.observations)}
            </span>
            <span className="font-mono-pd hidden w-14 text-right text-[10px] tabular-nums text-[#7c87a0] md:inline">
              {r.heartbeats} hb
            </span>
          </div>
        ))}
      </div>
      <div className="font-mono-pd border-t border-[#1a2540] px-4 py-2 text-[9px] uppercase tracking-[0.18em] text-[#7c87a0]">
        crawler publish pools ∪ NIP-50 search relays — kind {SIP01.kind} lives on ANY relay
      </div>
    </Panel>
  );
}

export function NetworkSection({ stats, loading }: { stats: IndexStats | null; loading: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeader
        index="02"
        eyebrow="crawler network"
        title="Node status"
        right={
          stats && (
            <div className="font-mono-pd flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
              <span className="dot-live" />
              <span className="text-[#34d399]">{stats.liveNodes.length} online</span>
              <span className="text-[#7c87a0]">/ {stats.heartbeats.length} known</span>
            </div>
          )
        }
      />
      {loading && !stats ? (
        <div className="space-y-6">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <FamilyCards stats={stats} />
          <NodeTable stats={stats} />
          <RelayCoverage stats={stats} />
        </div>
      ) : null}
    </section>
  );
}
