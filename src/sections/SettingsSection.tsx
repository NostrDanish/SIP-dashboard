import { useEffect, useRef, useState } from 'react';
import { Panel, SectionHeader } from '@/components/pd';
import {
  BUILTIN_RELAY_URLS,
  DEFAULT_APP_RELAYS,
  renderRelayUrl,
  useRelayConfig,
} from '@/hooks/useRelayConfig';
import {
  probeRelayList,
  runDiscovery,
  type DiscoveryResult,
  type VerifiedRelay,
} from '@/lib/relayDiscovery';
import { formatNumber } from '@/lib/format';

/* ------------------------------------------------------------------ */
/* Capability badges                                                   */
/* ------------------------------------------------------------------ */

function CapabilityBadges({ info }: { info: VerifiedRelay | null | undefined }) {
  if (info === undefined) {
    return <span className="font-mono-pd text-[9px] uppercase tracking-[0.16em] text-[#7c87a0]">probing…</span>;
  }
  if (info === null) {
    return (
      <span className="font-mono-pd text-[9px] uppercase tracking-[0.16em] text-[#7c87a0]">no nip-11</span>
    );
  }
  return (
    <span className="font-mono-pd flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em]">
      {info.sip01 && (
        <span className="border border-[#f0b45a]/60 bg-[#f0b45a]/10 px-1.5 py-px text-[#f0b45a]">sip-01</span>
      )}
      {info.nip50 && (
        <span className="border border-[#a855f7]/60 bg-[#a855f7]/10 px-1.5 py-px text-[#a855f7]">nip-50</span>
      )}
      {!info.sip01 && !info.nip50 && <span className="text-[#7c87a0]">generic</span>}
      <span className="tabular-nums text-[#7c87a0]">{formatNumber(info.latencyMs)}ms</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* App relay list                                                      */
/* ------------------------------------------------------------------ */

function RelayListPanel() {
  const { relays, isCustomized, addRelay, removeRelay, toggleRelay, resetDefaults } = useRelayConfig();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [probes, setProbes] = useState<Map<string, VerifiedRelay | null>>(new Map());
  const [probing, setProbing] = useState(false);
  const probeRun = useRef(0);

  const relayKey = relays.map((r) => r.url).join(',');

  // Probe every relay's NIP-11 document whenever the list changes.
  useEffect(() => {
    const run = ++probeRun.current;
    const urls = relayKey.split(',').filter(Boolean);
    if (urls.length === 0) return;
    setProbing(true);
    probeRelayList(urls, (url, result) => {
      if (probeRun.current !== run) return;
      setProbes((prev) => new Map(prev).set(url, result));
    }).finally(() => {
      if (probeRun.current === run) setProbing(false);
    });
  }, [relayKey]);

  const enabledCount = relays.filter((r) => r.read).length;

  const handleAdd = () => {
    const res = addRelay(input);
    if (!res.ok) {
      setError(res.reason ?? 'could not add relay');
      setNotice(null);
    } else {
      setInput('');
      setError(null);
      setNotice('relay added — the dashboard re-reads on the next cycle');
    }
  };

  return (
    <Panel
      label={`app relay list · ${enabledCount}/${relays.length} enabled · stored in this browser only`}
      pad={false}
    >
      <div className="divide-y divide-[#1a2540]/60">
        {relays.length === 0 && (
          <div className="font-mono-pd p-6 text-center text-[11px] uppercase tracking-[0.18em] text-[#7c87a0]">
            no relays configured — the dashboard won't find anything. add one below or reset to defaults.
          </div>
        )}
        {relays.map((relay) => {
          const builtin = BUILTIN_RELAY_URLS.has(relay.url);
          const probe = probes.get(relay.url);
          return (
            <div key={relay.url} className="flex items-center gap-3 px-4 py-2.5">
              <button
                onClick={() => toggleRelay(relay.url)}
                title={relay.read ? 'disable reads' : 'enable reads'}
                className={`relative h-4 w-8 shrink-0 rounded-full transition-colors ${
                  relay.read ? 'bg-[#34d399]/80' : 'bg-[#1a2540]'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full bg-[#ede6d6] transition-all ${
                    relay.read ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </button>
              <div className="min-w-0 flex-1">
                <div className="font-mono-pd truncate text-[11.5px] text-[#ede6d6]" title={relay.url}>
                  {renderRelayUrl(relay.url)}
                  {!builtin && (
                    <span className="ml-2 border border-[#22d3ee]/50 bg-[#22d3ee]/10 px-1.5 py-px text-[8.5px] uppercase tracking-[0.14em] text-[#22d3ee]">
                      custom
                    </span>
                  )}
                </div>
              </div>
              <CapabilityBadges info={probes.has(relay.url) ? (probe ?? null) : undefined} />
              <button
                onClick={() => removeRelay(relay.url)}
                className="font-mono-pd shrink-0 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[#7c87a0] transition-colors hover:text-[#f87171]"
                title="remove relay"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#1a2540] p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="wss://your-relay.example.com"
            className="font-mono-pd min-w-0 flex-1 border border-[#1a2540] bg-[#050810] px-3 py-2 text-[11.5px] text-[#ede6d6] placeholder:text-[#7c87a0]/60 focus:border-[#f0b45a] focus:outline-none"
          />
          <button
            onClick={handleAdd}
            className="font-mono-pd shrink-0 border border-[#f0b45a] bg-[#f0b45a]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0b45a] transition-colors hover:bg-[#f0b45a]/20"
          >
            + add relay
          </button>
          <button
            onClick={() => {
              resetDefaults();
              setNotice(`${DEFAULT_APP_RELAYS.length} ecosystem defaults restored`);
              setError(null);
            }}
            disabled={!isCustomized}
            className="font-mono-pd shrink-0 border border-[#1a2540] px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[#7c87a0] transition-colors enabled:hover:border-[#a855f7] enabled:hover:text-[#a855f7] disabled:opacity-40"
          >
            ⟲ reset
          </button>
        </div>
        {error && (
          <div className="font-mono-pd mt-2 text-[10px] uppercase tracking-[0.16em] text-[#f87171]">✕ {error}</div>
        )}
        {notice && (
          <div className="font-mono-pd mt-2 text-[10px] uppercase tracking-[0.16em] text-[#34d399]">✓ {notice}</div>
        )}
        <div className="font-mono-pd mt-3 text-[9px] uppercase tracking-[0.18em] text-[#7c87a0]">
          {probing ? 'probing nip-11 capabilities…' : 'capability probe complete'} · local only — never
          published to nostr, never tied to any account
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Auto-discovery                                                      */
/* ------------------------------------------------------------------ */

function DiscoveryPanel() {
  const { relays, addRelay } = useRelayConfig();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const existing = new Set(relays.map((r) => r.url));

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    setAdded(new Set());
    setProgress({ done: 0, total: 0 });
    try {
      const res = await runDiscovery(
        relays.map((r) => r.url),
        (done, total) => setProgress({ done, total }),
      );
      setResult(res);
    } finally {
      setRunning(false);
    }
  };

  const handleAdd = (url: string) => {
    const res = addRelay(url);
    if (res.ok) setAdded((prev) => new Set(prev).add(url));
  };

  return (
    <Panel label="auto-discovery · nip-66 announcements → nip-11 verification" pad={false}>
      <div className="p-4">
        <p className="text-[12px] leading-relaxed text-[#9aa3b8]">
          Queries relay-monitor announcements (<span className="font-mono-pd text-[#a855f7]">kind 30166</span>)
          for relays advertising NIP-50, then verifies each candidate against its live NIP-11 document —
          <span className="font-mono-pd text-[#f0b45a]"> supported_nips</span> for search, the{' '}
          <span className="font-mono-pd text-[#f0b45a]">uncaged_index</span> block for SIP-01. Announcements
          lie; documents don't (as much). Nothing is added automatically — you pick.
        </p>
        <button
          onClick={handleRun}
          disabled={running}
          className="font-mono-pd mt-4 border border-[#a855f7] bg-[#a855f7]/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a855f7] transition-colors hover:bg-[#a855f7]/20 disabled:opacity-50"
        >
          {running
            ? `discovering… ${progress ? `${progress.done}/${progress.total}` : ''}`
            : '⟳ discover nip-50 / sip-01 relays'}
        </button>
      </div>

      {result && (
        <>
          <div className="font-mono-pd border-t border-[#1a2540] px-4 py-2 text-[9px] uppercase tracking-[0.18em] text-[#7c87a0]">
            {result.candidates} candidates → {result.verified.length} verified · {result.rejected} rejected
          </div>
          <div className="max-h-[340px] divide-y divide-[#1a2540]/60 overflow-auto border-t border-[#1a2540]/60">
            {result.verified.length === 0 && (
              <div className="font-mono-pd p-5 text-[10px] uppercase tracking-[0.18em] text-[#7c87a0]">
                no verified candidates this sweep — the built-in set keeps the dashboard fully functional
              </div>
            )}
            {result.verified.map((v) => {
              const isIn = existing.has(v.url) || added.has(v.url);
              return (
                <div key={v.url} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="font-mono-pd min-w-0 flex-1 truncate text-[11.5px] text-[#ede6d6]">
                    {renderRelayUrl(v.url)}
                  </span>
                  <CapabilityBadges info={v} />
                  <button
                    onClick={() => handleAdd(v.url)}
                    disabled={isIn}
                    className="font-mono-pd shrink-0 border px-3 py-1 text-[9px] uppercase tracking-[0.16em] transition-colors disabled:border-[#1a2540] disabled:text-[#34d399] enabled:border-[#f0b45a]/60 enabled:text-[#f0b45a] enabled:hover:bg-[#f0b45a]/10"
                  >
                    {isIn ? '✓ added' : '+ add'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */

export function SettingsSection() {
  const { readUrls } = useRelayConfig();
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <SectionHeader
        index="06"
        eyebrow="local-first"
        title="Relay settings"
        right={
          <div className="font-mono-pd text-[10px] uppercase tracking-[0.2em] text-[#7c87a0]">
            {readUrls.length} read relays active
          </div>
        }
      />

      <div className="space-y-6">
        <RelayListPanel />
        <DiscoveryPanel />

        <div className="grid gap-6 md:grid-cols-2">
          <Panel label="what the defaults cover">
            <p className="text-[12px] leading-relaxed text-[#9aa3b8]">
              The default {DEFAULT_APP_RELAYS.length}-relay list is the union of the SIP-01 validating
              index relays (incl. the SIP-Booster-Relay worker cohort), the NIP-50 search relays, and the
              crawler publish pools — everywhere the ecosystem is known to write kind 39697 today, plus a
              general fallback. Any relay can host observations, so adding your own sources only widens the
              net. Each relay's contribution shows up in the network tab's coverage panel.
            </p>
          </Panel>
          <Panel label="local only — nothing is published">
            <p className="text-[12px] leading-relaxed text-[#9aa3b8]">
              This list lives in your browser's storage and is never published to Nostr or tied to any
              account. It doesn't touch your NIP-65 relay list, and logging in (anywhere) won't overwrite
              it. Clearing browser data — or the reset button — returns you to the shipped defaults.
            </p>
          </Panel>
        </div>
      </div>
    </section>
  );
}
