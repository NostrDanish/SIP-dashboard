import { useMemo, useState } from 'react';
import type { IndexStats } from '@/hooks/useIndexStats';
import { useGithubStats } from '@/hooks/useGithubStats';
import { LINEAGE, NODE_CLASSES, PROJECTS, type Project, type ProjectBadge } from '@/lib/sip01';
import { Panel, SectionHeader } from '@/components/pd';
import { formatCompact, formatNumber, timeAgo } from '@/lib/format';

const BADGE_COLORS: Record<ProjectBadge, string> = {
  Spec: '#f0b45a',
  Core: '#fbbf24',
  Engine: '#a855f7',
  'Engine +': '#a855f7',
  Crawler: '#34d399',
  Indexer: '#22d3ee',
  Relay: '#22d3ee',
  Template: '#fbbf24',
  Dashboard: '#f0b45a',
};

const STATUS_META = {
  live: { dot: 'dot-live', label: 'live', cls: 'text-[#34d399]' },
  beta: { dot: 'dot-warn', label: 'beta', cls: 'text-[#fbbf24]' },
  announced: { dot: 'dot-dead', label: 'announced', cls: 'text-[#f87171]' },
} as const;

/* ------------------------------------------------------------------ */
/* On-chain contribution per project                                   */
/* ------------------------------------------------------------------ */

interface OnChain {
  observations: number;
  indexers: number;
  documents: number;
}

function computeOnChain(stats: IndexStats | null): Map<string, OnChain> {
  const map = new Map<string, OnChain>();
  if (!stats) return map;
  for (const p of PROJECTS) {
    if (p.sourceTags.length === 0) continue;
    const mine = stats.observations.filter((o) =>
      p.sourceTags.some((t) => (o.source ?? '').toLowerCase() === t.toLowerCase()),
    );
    if (mine.length === 0) continue;
    const indexers = new Set(mine.map((o) => o.indexer));
    const docs = new Set(mine.map((o) => o.d));
    map.set(p.id, { observations: mine.length, indexers: indexers.size, documents: docs.size });
  }
  return map;
}

/* ------------------------------------------------------------------ */
/* Project card                                                        */
/* ------------------------------------------------------------------ */

function ProjectCard({
  project,
  onChain,
  gh,
}: {
  project: Project;
  onChain?: OnChain;
  gh?: { stars: number; forks: number; openIssues: number; pushedAt: string };
}) {
  const [open, setOpen] = useState(false);
  const color = BADGE_COLORS[project.badge];
  const status = STATUS_META[project.status];
  const repoUrl = project.repo ? `https://github.com/NostrDanish/${project.repo}` : null;

  return (
    <div className="panel flex flex-col transition-colors hover:bg-[#111a2b]/70">
      <button onClick={() => setOpen(!open)} className="flex-1 p-5 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono-pd text-[14px] font-bold tracking-wide text-[#ede6d6]">
                {project.name}
              </span>
              <span
                className="font-mono-pd shrink-0 border px-1.5 py-px text-[8.5px] uppercase tracking-[0.16em]"
                style={{ color, borderColor: `${color}66`, backgroundColor: `${color}14` }}
              >
                {project.badge}
              </span>
              <span className={`font-mono-pd flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] ${status.cls}`}>
                <span className={status.dot} />
                {status.label}
              </span>
            </div>
            <div className="font-mono-pd mt-1 text-[10px] uppercase tracking-[0.16em] text-[#7c87a0]">
              {project.role} · {project.version}
            </div>
          </div>
          <span className="font-mono-pd mt-1 shrink-0 text-[12px] text-[#7c87a0]">{open ? '−' : '+'}</span>
        </div>

        <p className="mt-3 text-[12.5px] leading-relaxed text-[#9aa3b8]">{project.description}</p>

        {/* stat strip */}
        <div className="font-mono-pd mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#1a2540] pt-3 text-[10px] uppercase tracking-[0.14em]">
          {onChain && (
            <>
              <span className="text-[#f0b45a]">
                {formatNumber(onChain.observations)} obs
              </span>
              <span className="text-[#ede6d6]">{formatNumber(onChain.indexers)} indexers</span>
              <span className="text-[#ede6d6]">{formatNumber(onChain.documents)} docs</span>
            </>
          )}
          {gh && (
            <>
              <span className="text-[#7c87a0]">★ {formatCompact(gh.stars)}</span>
              <span className="text-[#7c87a0]">⑂ {formatCompact(gh.forks)}</span>
              <span className="text-[#7c87a0]">
                push {gh.pushedAt ? timeAgo(Math.floor(new Date(gh.pushedAt).getTime() / 1000)) : '—'}
              </span>
            </>
          )}
          {!onChain && project.sourceTags.length > 0 && (
            <span className="text-[#7c87a0]">no observations in current window</span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-[#1a2540] px-5 py-4">
          <div className="font-mono-pd mb-2 text-[9px] uppercase tracking-[0.2em] text-[#7c87a0]">
            key facts
          </div>
          <ul className="space-y-1.5">
            {project.features.map((f) => (
              <li key={f} className="flex gap-2 text-[12px] leading-relaxed text-[#9aa3b8]">
                <span className="font-mono-pd shrink-0 text-[#f0b45a]">▸</span>
                {f}
              </li>
            ))}
          </ul>
          {project.keyFiles.length > 0 && (
            <div className="font-mono-pd mt-4 space-y-1.5 border-t border-[#1a2540] pt-3 text-[10.5px]">
              {project.keyFiles.map((f) => (
                <div key={f.path} className="flex flex-col">
                  <span className="text-[#f0b45a]/90">{f.path}</span>
                  <span className="text-[#7c87a0]">{f.note}</span>
                </div>
              ))}
            </div>
          )}
          <div className="font-mono-pd mt-4 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.18em]">
            {repoUrl && (
              <a href={repoUrl} target="_blank" rel="noreferrer" className="text-[#f0b45a] hover:underline">
                open repo →
              </a>
            )}
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-[#a855f7] hover:underline">
                live app →
              </a>
            )}
            {!repoUrl && <span className="text-[#7c87a0]">repository landing soon</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function EcosystemSection({ stats }: { stats: IndexStats | null }) {
  const repoNames = useMemo(() => PROJECTS.map((p) => p.repo).filter((r): r is string => r !== null), []);
  const { stats: gh } = useGithubStats(repoNames);
  const onChain = useMemo(() => computeOnChain(stats), [stats]);

  const groups: { label: string; badges: ProjectBadge[] }[] = [
    { label: 'protocol & core', badges: ['Spec', 'Core'] },
    { label: 'search engines', badges: ['Engine', 'Engine +', 'Template'] },
    { label: 'crawlers & indexers', badges: ['Crawler', 'Indexer'] },
    { label: 'relays', badges: ['Relay'] },
    { label: 'telemetry', badges: ['Dashboard'] },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeader
        index="04"
        eyebrow="the ecosystem"
        title="One index, many implementations"
        right={
          <div className="font-mono-pd text-[10px] uppercase tracking-[0.2em] text-[#7c87a0]">
            {PROJECTS.length} projects · spec · core · engines · crawlers · relays
          </div>
        }
      />

      <p className="-mt-2 mb-8 max-w-3xl text-[13.5px] leading-relaxed text-[#9aa3b8]">
        The protocol is the spec; the ecosystem is the proof. Every layer is open, separable, and
        runnable by anyone — byte-compatible with the §13 test vectors, no coordinator, no single
        owner. On-chain counters are derived live from the current observation window.
      </p>

      {/* lineage strip */}
      <div className="panel font-mono-pd mb-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-4 text-[10px] uppercase tracking-[0.16em]">
        {LINEAGE.map((l, i) => (
          <span key={l.name} className="flex items-center gap-3">
            {i > 0 && <span className="text-[#7c87a0]">──▸</span>}
            <span className={i === LINEAGE.length - 1 ? 'text-[#f0b45a]' : 'text-[#9aa3b8]'}>{l.name}</span>
            <span className="hidden text-[#7c87a0] md:inline">({l.note})</span>
          </span>
        ))}
      </div>

      {groups.map((g) => {
        const projects = PROJECTS.filter((p) => g.badges.includes(p.badge));
        if (projects.length === 0) return null;
        return (
          <div key={g.label} className="mb-10">
            <div className="font-mono-pd mb-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-[#7c87a0]">
              <span className="text-[#f0b45a]">▸</span> {g.label}
              <span className="h-px flex-1 bg-[#1a2540]" />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} onChain={onChain.get(p.id)} gh={p.repo ? gh[p.repo] : undefined} />
              ))}
            </div>
          </div>
        );
      })}

      {/* the scout / indexer split */}
      <div className="mb-10">
        <div className="font-mono-pd mb-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-[#7c87a0]">
          <span className="text-[#f0b45a]">▸</span> two classes of node
          <span className="h-px flex-1 bg-[#1a2540]" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {NODE_CLASSES.map((n) => (
            <Panel key={n.name} label={`${n.name} · ${n.cls}`}>
              <div className="font-mono-pd text-[12px] text-[#a855f7]">{n.motto}</div>
              <div className="mt-3 space-y-2">
                {n.rows.map(([k, v]) => (
                  <div key={k} className="flex gap-3 text-[11.5px]">
                    <span className="font-mono-pd w-16 shrink-0 text-[9px] uppercase leading-5 tracking-[0.16em] text-[#7c87a0]">
                      {k}
                    </span>
                    <span className="text-[#9aa3b8]">{v}</span>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>
        <div className="font-mono-pd mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-[#7c87a0]">
          crawlstr finds · indexstr maintains · nostr distributes · searchstr searches
        </div>
      </div>

      {/* data flow strip */}
      <div className="panel font-mono-pd flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-4 text-[10px] uppercase tracking-[0.18em]">
        <span className="text-[#34d399]">crawlers observe</span>
        <span className="text-[#7c87a0]">── kind 39697 ──▸</span>
        <span className="text-[#22d3ee]">relays store &amp; replicate</span>
        <span className="text-[#7c87a0]">── NIP-50 / NIP-77 ──▸</span>
        <span className="text-[#a855f7]">engines rank &amp; serve</span>
        <span className="text-[#7c87a0]">── results ──▸</span>
        <span className="text-[#f0b45a]">people search</span>
      </div>
    </section>
  );
}
