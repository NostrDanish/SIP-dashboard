/**
 * Search/index relay auto-discovery — find NIP-50 and SIP-01 capable relays
 * instead of relying on the hardcoded defaults alone.
 *
 * Ported from 0xSearchstr src/lib/relayDiscovery.ts (the ecosystem's
 * canonical implementation). Two-phase, fully client-side:
 *
 *   1. CANDIDATES — NIP-66 relay announcements (kind 30166, addressable,
 *      `d` = relay URL, `N` tags = supported NIPs) are queried from a
 *      bootstrap set with a `#N: ['50']` filter: relays that advertise
 *      NIP-50 search. A small seed list is always included so discovery
 *      works even when no bootstrap relay stores 30166s.
 *
 *   2. VERIFICATION — every candidate's NIP-11 document is fetched (the
 *      relay serves it over HTTPS at the same host). A relay earns its
 *      NIP-50 badge only when `supported_nips` really contains 50, and its
 *      SIP-01 badge when it advertises the `uncaged_index` block (spec §15).
 *      Announcements lie; documents don't (as much).
 *
 * Nothing is added automatically — verified candidates are presented in the
 * Settings tab with one-click add. The hardcoded pools keep the dashboard
 * fully functional with zero discovered relays.
 */
import { SimplePool } from 'nostr-tools/pool';
import { SEARCH_RELAYS } from './sip01';
import { normalizeRelayUrl } from '@/hooks/useRelayConfig';

/** Cap on NIP-66 candidates probed per sweep (each probe = one fetch). */
const MAX_CANDIDATES = 32;

/** Probe concurrency — polite to the relays. */
const PROBE_BATCH = 8;

/** Per-probe timeout. */
const PROBE_TIMEOUT_MS = 8_000;

/** The ecosystem's CORS proxy — fallback when a relay's NIP-11 isn't CORS-open. */
const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

/**
 * Known search-capable relays that are ALWAYS probed, even when no relay in
 * the bootstrap set stores NIP-66 announcements.
 */
const SEED_CANDIDATES = [
  'wss://nostr.wine/', // paid relay with a NIP-50 search API
];

/**
 * Bootstrap relays for the NIP-66 query (kind 30166). Big general-purpose
 * relays with good addressable-event coverage; the search defaults are
 * queried too (deduped).
 */
const NIP66_BOOTSTRAP = [
  'wss://relay.primal.net/',
  'wss://relay.damus.io/',
];

export interface VerifiedRelay {
  url: string;
  /** NIP-11 `supported_nips` includes 50 → speaks NIP-50 search. */
  nip50: boolean;
  /** NIP-11 `uncaged_index.sip01 === true` → a SIP-01 index relay. */
  sip01: boolean;
  /** NIP-11 fetch round-trip (ms) — a weak liveness/latency signal. */
  latencyMs: number;
  /** Which path answered: direct fetch or the CORS proxy. */
  via: 'direct' | 'proxy';
}

/** NIP-11 relay information document (the fields we read). */
interface RelayInfoDoc {
  supported_nips?: unknown;
  /** SIP-01 §15: index relays advertise their scope here. */
  uncaged_index?: { sip01?: unknown } | unknown;
}

async function fetchNip11(httpUrl: string, viaProxy: boolean): Promise<RelayInfoDoc | null> {
  const target = viaProxy ? `${CORS_PROXY}${encodeURIComponent(httpUrl)}` : httpUrl;
  const res = await fetch(target, {
    headers: { Accept: 'application/nostr+json' },
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
  });
  if (!res.ok) return null;
  return (await res.json()) as RelayInfoDoc;
}

/**
 * Probe one relay's NIP-11 document. Direct fetch first, CORS proxy as
 * fallback. Returns the verified record, or null when unreachable or when
 * the relay offers nothing we need.
 */
export async function probeRelay(url: string): Promise<VerifiedRelay | null> {
  const httpUrl = url.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://');
  const start = performance.now();
  for (const viaProxy of [false, true]) {
    try {
      const doc = await fetchNip11(httpUrl, viaProxy);
      if (!doc) continue;
      const nips = Array.isArray(doc.supported_nips) ? doc.supported_nips : [];
      const nip50 = nips.includes(50);
      const sip01 =
        typeof doc.uncaged_index === 'object' &&
        doc.uncaged_index !== null &&
        (doc.uncaged_index as { sip01?: unknown }).sip01 === true;
      return {
        url,
        nip50,
        sip01,
        latencyMs: Math.round(performance.now() - start),
        via: viaProxy ? 'proxy' : 'direct',
      };
    } catch {
      /* try the next path */
    }
  }
  return null;
}

/**
 * Probe every relay in the app list for its NIP-11 capabilities (batched).
 * Returns a map keyed by relay URL; unreachable relays get no entry.
 */
export async function probeRelayList(
  urls: string[],
  onProgress?: (url: string, result: VerifiedRelay | null) => void,
): Promise<Map<string, VerifiedRelay>> {
  const out = new Map<string, VerifiedRelay>();
  for (let i = 0; i < urls.length; i += PROBE_BATCH) {
    const batch = urls.slice(i, i + PROBE_BATCH);
    const settled = await Promise.all(batch.map((u) => probeRelay(u)));
    for (const [j, v] of settled.entries()) {
      if (v) out.set(v.url, v);
      onProgress?.(batch[j], v);
    }
  }
  return out;
}

/**
 * Phase 1 — query the bootstrap relays for kind 30166 announcements
 * advertising NIP-50 (`#N: ['50']` — relays index all single-letter tags).
 * Returns normalized clearnet relay URLs from the `d` tags.
 */
export async function fetchNip66Candidates(extraBootstrap: string[] = []): Promise<string[]> {
  const bootstrap = [...new Set([...NIP66_BOOTSTRAP, ...SEARCH_RELAYS, ...extraBootstrap])];
  const pool = new SimplePool();
  const seen = new Set<string>();
  const candidates: string[] = [];
  try {
    const perRelay = await Promise.allSettled(
      bootstrap.map((url) =>
        Promise.race([
          pool.querySync([url], { kinds: [30166], '#N': ['50'], limit: 200 }),
          new Promise<never[]>((r) => setTimeout(() => r([]), 6_000)),
        ]),
      ),
    );
    for (const res of perRelay) {
      if (res.status !== 'fulfilled') continue;
      for (const ev of res.value) {
        const d = ev.tags.find(([n]) => n === 'd')?.[1];
        if (!d) continue;
        // Skip non-clearnet transports (n tag: tor/i2p/loki).
        const network = ev.tags.find(([n]) => n === 'n')?.[1];
        if (network && network !== 'clearnet') continue;
        const url = normalizeRelayUrl(d);
        if (!url || seen.has(url)) continue;
        seen.add(url);
        candidates.push(url);
      }
    }
  } finally {
    pool.close(bootstrap);
  }
  return candidates;
}

export interface DiscoveryResult {
  /** Candidates that answered a NIP-11 probe with something we need. */
  verified: VerifiedRelay[];
  /** Total NIP-66 announcements considered. */
  candidates: number;
  /** Candidates that failed verification or offered nothing relevant. */
  rejected: number;
}

/**
 * Full sweep: NIP-66 candidates → NIP-11 verification (batched, fastest
 * first). Discovery is a hint, never a requirement.
 */
export async function runDiscovery(
  extraBootstrap: string[] = [],
  onProgress?: (done: number, total: number) => void,
): Promise<DiscoveryResult> {
  const nip66 = await fetchNip66Candidates(extraBootstrap).catch(() => [] as string[]);
  const candidates = [...new Set([...SEED_CANDIDATES, ...nip66])].slice(0, MAX_CANDIDATES);

  const verified: VerifiedRelay[] = [];
  let done = 0;
  for (let i = 0; i < candidates.length; i += PROBE_BATCH) {
    const batch = candidates.slice(i, i + PROBE_BATCH);
    const settled = await Promise.all(batch.map((url) => probeRelay(url)));
    for (const v of settled) {
      if (v && (v.nip50 || v.sip01)) verified.push(v);
    }
    done += batch.length;
    onProgress?.(done, candidates.length);
  }

  // Fastest first.
  verified.sort((a, b) => a.latencyMs - b.latencyMs);
  return { verified, candidates: candidates.length, rejected: candidates.length - verified.length };
}
