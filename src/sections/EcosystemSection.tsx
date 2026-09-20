import { CORE_REPO, REPOS, type Repo } from '@/lib/sip01';
import { SectionHeader } from '@/components/pd';

const BADGE_COLORS: Record<Repo['badge'], string> = {
  Spec: '#f0b45a',
  Relay: '#22d3ee',
  Crawler: '#34d399',
  Engine: '#a855f7',
  'Engine +': '#a855f7',
  Template: '#fbbf24',
  Dashboard: '#f0b45a',
};

function RepoCard({ repo, wide = false }: { repo: Repo; wide?: boolean }) {
  const color = BADGE_COLORS[repo.badge];
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noreferrer"
      className={`panel group flex flex-col p-5 transition-colors hover:bg-[#111a2b] ${wide ? 'md:col-span-3 md:flex-row md:gap-8' : ''}`}
    >
      <div className={wide ? 'md:w-1/2' : ''}>
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono-pd text-[13px] font-bold tracking-wide text-[#ede6d6] group-hover:text-[#f0b45a]">
            {repo.name}
          </span>
          <span
            className="font-mono-pd shrink-0 border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]"
            style={{ color, borderColor: `${color}66`, backgroundColor: `${color}14` }}
          >
            {repo.badge}
          </span>
        </div>
        <div className="font-mono-pd mt-1 text-[10px] uppercase tracking-[0.18em] text-[#7c87a0]">{repo.role}</div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-[#9aa3b8]">{repo.description}</p>
      </div>
      <div className={`font-mono-pd mt-4 space-y-1.5 border-t border-[#1a2540] pt-3 text-[10.5px] ${wide ? 'md:mt-0 md:w-1/2 md:border-l md:border-t-0 md:pl-8 md:pt-0' : ''}`}>
        {repo.keyFiles.map((f) => (
          <div key={f.path} className="flex flex-col">
            <span className="text-[#f0b45a]/90">{f.path}</span>
            <span className="text-[#7c87a0]">{f.note}</span>
          </div>
        ))}
        <div className="pt-1 text-[10px] uppercase tracking-[0.18em] text-[#7c87a0] group-hover:text-[#f0b45a]">
          open repo →
        </div>
      </div>
    </a>
  );
}

export function EcosystemSection() {
  return (
    <section id="ecosystem" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6">
      <SectionHeader
        index="04"
        eyebrow="the ecosystem"
        title="One index, many implementations"
        right={
          <div className="font-mono-pd text-[10px] uppercase tracking-[0.2em] text-[#7c87a0]">
            {REPOS.length + 1} repos · spec · relay · crawlers · engines
          </div>
        }
      />

      <p className="-mt-2 mb-8 max-w-3xl text-[13.5px] leading-relaxed text-[#9aa3b8]">
        The protocol is the spec; the ecosystem is the proof. A validating relay, two crawler
        families, and three search engines all read and write the same shared pool — byte-compatible
        with the §13 test vectors, no coordinator, no single owner.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        <RepoCard repo={CORE_REPO} wide />
        {REPOS.map((r) => (
          <RepoCard key={r.name} repo={r} />
        ))}
      </div>

      {/* data flow strip */}
      <div className="panel font-mono-pd mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-4 text-[10px] uppercase tracking-[0.18em]">
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
