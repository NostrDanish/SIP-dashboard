import { useEffect, useState } from 'react';
import { LINKS } from '@/lib/sip01';
import { formatClock } from '@/lib/format';
import type { TabId } from '@/lib/tabs';
import { TABS } from '@/lib/tabs';

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

export function Header({
  live,
  fetchedAt,
  tab,
  onTab,
}: {
  live: boolean;
  fetchedAt?: number;
  tab: TabId;
  onTab: (t: TabId) => void;
}) {
  const [clock, setClock] = useState(() => formatClock(Date.now()));

  useEffect(() => {
    const t = setInterval(() => setClock(formatClock(Date.now())), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#1a2540] bg-[#050810]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <button onClick={() => onTab('overview')} className="flex shrink-0 items-center gap-3">
          <RadarMark />
          <div className="leading-none">
            <div className="font-mono-pd text-sm font-extrabold tracking-[0.18em] text-[#ede6d6]">
              SIP-01<span className="text-[#f0b45a]">//</span>DASHBOARD
            </div>
            <div className="font-mono-pd mt-1 text-[9px] uppercase tracking-[0.24em] text-[#7c87a0]">
              Search Index Protocol
            </div>
          </div>
        </button>

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
            className="font-mono-pd hidden border border-[#1a2540] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#7c87a0] transition-colors hover:border-[#f0b45a] hover:text-[#f0b45a] md:block"
          >
            Spec site
          </a>
          <a
            href={LINKS.dashboardRepo}
            target="_blank"
            rel="noreferrer"
            className="font-mono-pd border border-[#f0b45a]/60 bg-[#f0b45a]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#f0b45a] transition-colors hover:bg-[#f0b45a]/20"
          >
            GitHub
          </a>
        </div>
      </div>

      {/* tab bar */}
      <nav className="border-t border-[#1a2540]/60">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTab(t.id)}
                className={`font-mono-pd relative shrink-0 px-4 py-2.5 text-[10.5px] uppercase tracking-[0.2em] transition-colors ${
                  active ? 'text-[#f0b45a]' : 'text-[#7c87a0] hover:text-[#ede6d6]'
                }`}
              >
                <span className="mr-1.5 text-[9px] opacity-60">{t.index}</span>
                {t.label}
                {active && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 bg-[#f0b45a] shadow-[0_0_8px_rgba(240,180,90,0.7)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
