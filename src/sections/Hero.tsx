import { EXAMPLE_EVENT, LINKS, SIP01, THREE_IDENTITIES } from '@/lib/sip01';
import type { IndexStats } from '@/hooks/useIndexStats';
import { formatCompact } from '@/lib/format';

function EventAnatomy() {
  const lines = [
    { k: 'kind', v: String(SIP01.kind), c: 'text-[#a855f7]' },
    { k: 'content', v: EXAMPLE_EVENT.content, c: 'text-[#7c87a0]' },
    ...EXAMPLE_EVENT.tags.map(([t, v]) => ({
      k: `["${t}"`,
      v: `"${v.length > 44 ? `${v.slice(0, 44)}…` : v}"]`,
      c: t === 'd' || t === 'u' || t === 'x' ? 'text-[#f0b45a]' : 'text-[#ede6d6]',
    })),
  ];
  return (
    <div className="panel reveal relative min-w-0 overflow-hidden" style={{ animationDelay: '0.35s' }}>
      <div className="font-mono-pd flex items-center justify-between border-b border-[#1a2540] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#7c87a0]">
        <span className="truncate">event anatomy · kind {SIP01.kind}</span>
        <span className="shrink-0 text-[#34d399]">signed</span>
      </div>
      <div className="font-mono-pd space-y-1 overflow-x-auto p-4 text-[11px] leading-relaxed">
        {lines.map((l, i) => (
          <div key={i} className="flex gap-2 whitespace-nowrap">
            <span className="shrink-0 text-[#7c87a0]">{l.k}</span>
            <span className={l.c}>{l.v}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-[#1a2540] px-4 py-3">
        <div className="font-mono-pd text-[10px] uppercase tracking-[0.2em] text-[#7c87a0]">
          Three identities, kept separate on purpose
        </div>
        <div className="mt-2 space-y-1.5">
          {THREE_IDENTITIES.map((id) => (
            <div key={id.field} className="font-mono-pd flex gap-2 text-[10.5px]">
              <span className="w-4 shrink-0 text-[#a855f7]">{id.field}</span>
              <span className="text-[#7c87a0]">{id.rule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Hero({ stats }: { stats: IndexStats | null }) {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* ambient glow field */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(240,180,90,0.22) 0%, rgba(142,48,235,0.12) 45%, transparent 70%)',
        }}
      />
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:pt-20">
        <div className="min-w-0">
          <div className="reveal font-mono-pd flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
            <span className="border border-[#f0b45a]/50 bg-[#f0b45a]/10 px-2 py-1 text-[#f0b45a]">
              kind {SIP01.kind}
            </span>
            <span className="border border-[#1a2540] px-2 py-1 text-[#7c87a0]">status · draft</span>
            <span className="border border-[#1a2540] px-2 py-1 text-[#7c87a0]">
              spec v{SIP01.version} · schema v{SIP01.schemaVersion}
            </span>
            <span className="border border-[#8e30eb]/50 bg-[#8e30eb]/10 px-2 py-1 text-[#a855f7]">
              protocol · nostr
            </span>
          </div>

          <h1
            className="reveal font-mono-pd mt-6 font-extrabold leading-[0.9] tracking-tight"
            style={{ animationDelay: '0.08s' }}
          >
            <span className="glow-amber block text-[16vw] sm:text-[11vw] lg:text-[7.5rem]">SIP-01</span>
            <span className="mt-2 block text-[6.4vw] text-[#ede6d6] sm:text-[4.2vw] lg:text-[2.6rem]">
              DECENTRALIZED SEARCH
              <br />
              INDEX PROTOCOL
              <span className="blink text-[#f0b45a]">_</span>
            </span>
          </h1>

          <p
            className="reveal mt-6 max-w-xl text-[15px] leading-relaxed text-[#9aa3b8] [overflow-wrap:anywhere]"
            style={{ animationDelay: '0.16s' }}
          >
            {SIP01.tagline} Any crawler can publish signed observations, any relay can store them,
            any search node can index them, and any engine can rank them — without depending on one
            company, one crawler, one relay, or one signing key.
          </p>

          <div className="reveal mt-8 flex flex-wrap gap-3" style={{ animationDelay: '0.24s' }}>
            <a
              href={LINKS.specRaw}
              target="_blank"
              rel="noreferrer"
              className="font-mono-pd border border-[#f0b45a] bg-[#f0b45a] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#050810] transition-colors hover:bg-transparent hover:text-[#f0b45a]"
            >
              Read the spec →
            </a>
            <button
              onClick={() => {
                window.location.hash = '/network';
              }}
              className="font-mono-pd border border-[#1a2540] px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#ede6d6] transition-colors hover:border-[#a855f7] hover:text-[#a855f7]"
            >
              Network status ↓
            </button>
          </div>

          {/* inline live strip */}
          <div
            className="reveal font-mono-pd mt-10 grid max-w-xl grid-cols-3 divide-x divide-[#1a2540] border border-[#1a2540]"
            style={{ animationDelay: '0.3s' }}
          >
            {[
              { l: 'observations', v: stats ? formatCompact(stats.observations.length) : '—' },
              { l: 'documents', v: stats ? formatCompact(stats.documents) : '—' },
              { l: 'live nodes', v: stats ? formatCompact(stats.liveNodes.length) : '—', mint: true },
            ].map((s) => (
              <div key={s.l} className="px-4 py-3">
                <div className={`text-xl font-extrabold tabular-nums ${s.mint ? 'glow-mint' : 'text-[#ede6d6]'}`}>
                  {s.v}
                </div>
                <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-[#7c87a0]">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 lg:pt-10">
          <EventAnatomy />
        </div>
      </div>
    </section>
  );
}
