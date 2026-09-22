import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { IndexStats } from '@/hooks/useIndexStats';
import { Panel, SectionHeader, Skeleton } from '@/components/pd';
import { formatDay, formatNumber, shortKey, timeAgo } from '@/lib/format';

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="font-mono-pd border border-[#1a2540] bg-[#0b1120] px-3 py-2 text-[11px]">
      <div className="text-[#7c87a0]">{label ? formatDay(label) : ''}</div>
      <div className="text-[#f0b45a]">{formatNumber(payload[0].value)} observations</div>
    </div>
  );
}

function ActivityChart({ stats }: { stats: IndexStats }) {
  const data = stats.perDay.slice(-30);
  return (
    <Panel label={`observations per UTC day · last ${data.length} active days`} pad={false}>
      <div className="h-64 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
            <XAxis
              dataKey="day"
              tickFormatter={formatDay}
              tick={{ fill: '#7c87a0', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: '#1a2540' }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: '#7c87a0', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(240,180,90,0.06)' }} />
            <Bar dataKey="count" radius={0}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === data.length - 1 ? '#fbbf24' : '#f0b45a'} fillOpacity={i === data.length - 1 ? 1 : 0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function RankList({
  label,
  items,
  accent = '#f0b45a',
  max = 10,
}: {
  label: string;
  items: { name: string; count: number }[];
  accent?: string;
  max?: number;
}) {
  const shown = items.slice(0, max);
  const peak = Math.max(1, ...shown.map((i) => i.count));
  return (
    <Panel label={label} pad={false}>
      {shown.length === 0 ? (
        <div className="font-mono-pd p-5 text-[10px] uppercase tracking-[0.18em] text-[#7c87a0]">
          none tagged in window
        </div>
      ) : (
        <div className="divide-y divide-[#1a2540]/50">
          {shown.map((it, i) => (
            <div key={it.name} className="relative px-4 py-2">
              <div
                className="absolute inset-y-1 left-0 opacity-[0.13]"
                style={{ width: `${(it.count / peak) * 100}%`, backgroundColor: accent }}
              />
              <div className="font-mono-pd relative flex items-center justify-between text-[11px]">
                <span className="min-w-0 truncate text-[#ede6d6]">
                  <span className="mr-2 text-[10px] text-[#7c87a0]">{String(i + 1).padStart(2, '0')}</span>
                  {it.name}
                </span>
                <span className="tabular-nums text-[#7c87a0]">{formatNumber(it.count)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function Leaderboard({ stats }: { stats: IndexStats }) {
  return (
    <Panel label="indexer leaderboard · distinct signing pubkeys" pad={false}>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-[#0b1120]">
            <tr className="border-b border-[#1a2540]">
              {['#', 'indexer', 'observations', 'documents', 'software', 'last seen'].map((h) => (
                <th
                  key={h}
                  className={`font-mono-pd px-3 py-2 text-left text-[9px] font-medium uppercase tracking-[0.18em] text-[#7c87a0] ${
                    h === 'observations' || h === 'documents' || h === 'last seen' ? 'text-right' : ''
                  } ${h === 'software' ? 'hidden sm:table-cell' : ''}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.indexers.slice(0, 25).map((ix, i) => (
              <tr key={ix.pubkey} className="border-b border-[#1a2540]/60 transition-colors last:border-0 hover:bg-[#111a2b]/60">
                <td className="font-mono-pd px-3 py-2 text-[10px] text-[#7c87a0]">{String(i + 1).padStart(2, '0')}</td>
                <td className="font-mono-pd px-3 py-2 text-[11px] text-[#ede6d6]">
                  {i === 0 && <span className="mr-1.5 text-[#f0b45a]">★</span>}
                  {shortKey(ix.pubkey)}
                </td>
                <td className="font-mono-pd px-3 py-2 text-right text-[11px] font-bold tabular-nums text-[#f0b45a]">
                  {formatNumber(ix.observations)}
                </td>
                <td className="font-mono-pd px-3 py-2 text-right text-[11px] tabular-nums text-[#ede6d6]">
                  {formatNumber(ix.documents)}
                </td>
                <td className="font-mono-pd hidden px-3 py-2 text-[10px] text-[#7c87a0] sm:table-cell">
                  {ix.sources.join(', ') || '—'}
                </td>
                <td className="font-mono-pd px-3 py-2 text-right text-[10px] tabular-nums text-[#34d399]">
                  {timeAgo(ix.lastSeen)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="font-mono-pd border-t border-[#1a2540] px-4 py-2 text-[9px] uppercase tracking-[0.18em] text-[#7c87a0]">
        group by d → count distinct pubkeys = independent indexer agreement
      </div>
    </Panel>
  );
}

function RecentFeed({ stats }: { stats: IndexStats }) {
  const recent = stats.observations.slice(0, 8);
  return (
    <Panel label="freshest observations · straight off the relays" pad={false}>
      <div className="divide-y divide-[#1a2540]/50">
        {recent.map((o) => (
          <a
            key={o.event.id}
            href={o.url}
            target="_blank"
            rel="noreferrer"
            className="block px-4 py-2.5 transition-colors hover:bg-[#111a2b]/60"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[12px] font-medium text-[#ede6d6]">{o.title}</span>
              <span className="font-mono-pd shrink-0 text-[10px] tabular-nums text-[#34d399]">
                {timeAgo(o.observedAt)}
              </span>
            </div>
            <div className="font-mono-pd mt-1 flex items-center gap-2 text-[10px] text-[#7c87a0]">
              <span className="min-w-0 truncate">{o.host}</span>
              {o.topics.slice(0, 3).map((t) => (
                <span key={t} className="shrink-0 border border-[#1a2540] px-1.5 py-px text-[9px] text-[#a855f7]">
                  {t}
                </span>
              ))}
              {o.language && (
                <span className="shrink-0 border border-[#1a2540] px-1.5 py-px text-[9px] text-[#7c87a0]">
                  {o.language}
                </span>
              )}
              <span className="ml-auto hidden shrink-0 text-[9px] sm:inline">{shortKey(o.indexer, 6)}</span>
            </div>
          </a>
        ))}
      </div>
    </Panel>
  );
}

export function IndexSection({ stats, loading }: { stats: IndexStats | null; loading: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeader index="03" eyebrow="observation layer" title="The shared index" />
      {loading && !stats ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid gap-6 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <ActivityChart stats={stats} />
            <RankList label="top topics · t tags" items={stats.topics} accent="#a855f7" max={11} />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <RankList label="top hosts" items={stats.topHosts} max={8} />
            <RankList label="languages · l tag" items={stats.languages} accent="#34d399" max={8} />
            <RankList
              label="networks · extension tag"
              items={stats.networks.length ? stats.networks : stats.docTypes.map((d) => ({ name: `type:${d.name}`, count: d.count }))}
              accent="#22d3ee"
              max={8}
            />
          </div>
          <div className="grid gap-6 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Leaderboard stats={stats} />
            <RecentFeed stats={stats} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
