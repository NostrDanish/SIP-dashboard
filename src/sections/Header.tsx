import { useEffect, useState } from 'react';
import { LINKS } from '@/lib/sip01';
import { formatClock } from '@/lib/format';

function RadarMark() {
  return (
    <div className="relative h-9 w-9 overflow-hidden border border-[#1a2540] bg-[#0b1120]">
      <div className="radar-sweep absolute inset-0" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono-pd text-[13px] font-extrabold text-[#f0b45a]">S1</span>
      </div>
      <div className="absolute inset-x-0 top-1/2 h-px bg-[#1a2540]" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-[#1a2540]" />
    </div>
  );
}

const NAV = [
  { href: '#network', label: 'Network' },
  { href: '#index', label: 'Index' },
  { href: '#ecosystem', label: 'Ecosystem' },
  { href: '#protocol', label: 'Protocol' },
];

export function Header({ live, fetchedAt }: { live: boolean; fetchedAt?: number }) {
  const [clock, setClock] = useState(() => formatClock(Date.now()));

  useEffect(() => {
    const t = setInterval(() => setClock(formatClock(Date.now())), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#1a2540] bg-[#050810]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-3">
          <RadarMark />
          <div className="leading-none">
            <div className="font-mono-pd text-sm font-extrabold tracking-[0.18em] text-[#ede6d6]">
              SIP-01<span className="text-[#f0b45a]">//</span>DASHBOARD
            </div>
            <div className="font-mono-pd mt-1 text-[9px] uppercase tracking-[0.24em] text-[#7c87a0]">
              Search Index Protocol
            </div>
          </div>
        </a>

        <nav className="ml-6 hidden items-center gap-5 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="font-mono-pd text-[11px] uppercase tracking-[0.2em] text-[#7c87a0] transition-colors hover:text-[#f0b45a]"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <div className="font-mono-pd hidden items-center gap-2 text-[11px] tabular-nums text-[#7c87a0] sm:flex">
            {live ? <span className="dot-live" /> : <span className="dot-warn" />}
            <span className={live ? 'text-[#34d399]' : 'text-[#fbbf24]'}>
              {live ? 'LIVE' : 'SYNCING'}
            </span>
            <span className="hidden lg:inline">{clock}</span>
            {fetchedAt && <span className="hidden xl:inline">· read {formatClock(fetchedAt)}</span>}
          </div>
          <a
            href={LINKS.specSite}
            target="_blank"
            rel="noreferrer"
            className="font-mono-pd hidden border border-[#1a2540] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#7c87a0] transition-colors hover:border-[#f0b45a] hover:text-[#f0b45a] sm:block"
          >
            Spec site
          </a>
          <a
            href={LINKS.specRepo}
            target="_blank"
            rel="noreferrer"
            className="font-mono-pd border border-[#f0b45a]/60 bg-[#f0b45a]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#f0b45a] transition-colors hover:bg-[#f0b45a]/20"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
