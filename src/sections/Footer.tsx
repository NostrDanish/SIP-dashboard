import { LINKS, SIP01 } from '@/lib/sip01';

export function Footer() {
  return (
    <footer className="border-t border-[#1a2540] bg-[#0b1120]/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="font-mono-pd text-sm font-extrabold tracking-[0.18em] text-[#ede6d6]">
            SIP-01<span className="text-[#f0b45a]">//</span>DASHBOARD
          </div>
          <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-[#7c87a0]">
            Live network telemetry for the Search Index Protocol — read directly from the ecosystem
            relays in your browser. This dashboard publishes nothing and tracks no one.
          </p>
        </div>
        <div className="font-mono-pd text-[11px] uppercase tracking-[0.18em]">
          <div className="mb-3 text-[10px] text-[#7c87a0]">Protocol</div>
          <ul className="space-y-2">
            <li><a className="text-[#9aa3b8] transition-colors hover:text-[#f0b45a]" href={LINKS.specRepo} target="_blank" rel="noreferrer">SIP-01 spec repo</a></li>
            <li><a className="text-[#9aa3b8] transition-colors hover:text-[#f0b45a]" href={LINKS.specSite} target="_blank" rel="noreferrer">Documentation site</a></li>
            <li><a className="text-[#9aa3b8] transition-colors hover:text-[#f0b45a]" href={LINKS.guide} target="_blank" rel="noreferrer">Implementation guide</a></li>
            <li><a className="text-[#9aa3b8] transition-colors hover:text-[#f0b45a]" href={`${LINKS.specSite}explorer`} target="_blank" rel="noreferrer">Live explorer & validator</a></li>
          </ul>
        </div>
        <div className="font-mono-pd text-[11px] uppercase tracking-[0.18em]">
          <div className="mb-3 text-[10px] text-[#7c87a0]">Wire format</div>
          <ul className="space-y-2 text-[#9aa3b8]">
            <li>observation · kind <span className="text-[#f0b45a]">{SIP01.kind}</span> (addressable)</li>
            <li>heartbeat · kind <span className="text-[#a855f7]">{SIP01.heartbeatKind}</span> (replaceable)</li>
            <li>d prefix · <span className="text-[#f0b45a]">{SIP01.dPrefix}</span></li>
            <li>spec v{SIP01.version} · schema v{SIP01.schemaVersion} · NIP candidate</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#1a2540]">
        <div className="font-mono-pd mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-[9.5px] uppercase tracking-[0.2em] text-[#7c87a0] sm:px-6">
          <span>spec text: public domain (CC0-style) · NIP candidate</span>
          <span>
            no single owner <span className="text-[#f0b45a]">▸</span> many indexers{' '}
            <span className="text-[#f0b45a]">▸</span> many engines
          </span>
        </div>
      </div>
    </footer>
  );
}
