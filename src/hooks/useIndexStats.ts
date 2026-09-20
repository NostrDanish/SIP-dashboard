/**
 * Live SIP-01 index statistics — read straight from the ecosystem relays.
 *
 * Everything is derived from the events themselves — no hardcoded indexer
 * registry. Any crawler that starts publishing valid kind 39697 observations
 * (or kind 16919 heartbeats) appears on the dashboard automatically, which is
 * the point: Crawlstr, indexstr, and every future indexer share one pool.
 *
 * Reads fan out per relay over the ecosystem read set (crawler publish pools
 * ∪ NIP-50 search relays ∪ relay.dreamith.to). Kind 39697 lives on ANY
 * relay — the index relay is just a relay with extra validation/search — so
 * the dashboard reports per-relay coverage alongside the stats.
 *
 * Ported from github.com/NostrDanish/SIP-01 src/hooks/useIndexStats.ts,
 * re-based on nostr-tools SimplePool (no app framework required).
 */
import { useEffect, useRef, useState } from 'react';
import { SimplePool } from 'nostr-tools/pool';

import { OBSERVATION_RELAYS, SIP01 } from '@/lib/sip01';
import {
  parseSip01Event,
  validateSip01Event,
  type Sip01Observation,
  type SipEvent,
} from '@/lib/sip01-utils';
import {
  dedupeHeartbeats,
  heartbeatFamily,
  isNodeLive,
  HEARTBEAT_KIND,
  type HeartbeatFamily,
  type ParsedHeartbeat,
} from '@/lib/heartbeat';

/** Pages of 500 observations walked backwards from "now", per relay. */
const OBS_PAGES = 4;
const PAGE_SIZE = 500;

/** Per-relay read timeout — one slow relay must not stall the dashboard. */
const RELAY_TIMEOUT_MS = 12_000;

/** Cap on full SHA-256 validation runs (validity rate is a sampled estimate). */
const VALIDATION_SAMPLE = 600;

let pool: SimplePool | null = null;
function getPool(): SimplePool {
  if (!pool) pool = new SimplePool();
  return pool;
}

/** querySync with a hard timeout — resolves with what the relay said so far. */
async function queryRelay(
  url: string,
  filter: Record<string, unknown>,
  timeoutMs: number,
): Promise<{ events: SipEvent[]; timedOut: boolean }> {
  const p = getPool();
  let timedOut = false;
  const timeout = new Promise<SipEvent[]>((resolve) =>
    setTimeout(() => {
      timedOut = true;
      resolve([]);
    }, timeoutMs),
  );
  const query = p
    .querySync([url], filter as never)
    .then((evs) => evs as unknown as SipEvent[])
    .catch(() => [] as SipEvent[]);
  const events = await Promise.race([query, timeout]);
  return { events, timedOut };
}

async function fetchObservationWindow(
  url: string,
  deadline: number,
): Promise<{ events: SipEvent[]; timedOut: boolean }> {
  const byId = new Map<string, SipEvent>();
  let until: number | undefined;
  let timedOut = false;
  for (let page = 0; page < OBS_PAGES; page++) {
    const filter: Record<string, unknown> = { kinds: [SIP01.kind], limit: PAGE_SIZE };
    if (until !== undefined) filter.until = until;
    const remaining = deadline - Date.now();
    if (remaining <= 500) {
      timedOut = true;
      break;
    }
    const { events: batch, timedOut: pageTimeout } = await queryRelay(url, filter, remaining);
    if (pageTimeout) timedOut = true;
    if (batch.length === 0) break;
    let oldest = Infinity;
    for (const e of batch) {
      byId.set(e.id, e);
      if (e.created_at < oldest) oldest = e.created_at;
    }
    if (batch.length < PAGE_SIZE || !Number.isFinite(oldest)) break;
    until = oldest - 1;
  }
  return { events: [...byId.values()], timedOut };
}

export interface IndexerStat {
  pubkey: string;
  observations: number;
  documents: number;
  lastSeen: number;
  sources: string[];
  networks: string[];
}

/** Per-relay read result — the dashboard's provenance panel. */
export interface RelayCoverage {
  url: string;
  observations: number;
  heartbeats: number;
  /** ok = answered; partial = answered but hit the read timeout; failed = unreachable. */
  status: 'ok' | 'partial' | 'failed';
}

/** Observation-layer stats for one publisher software family (source tag). */
export interface SourceFamilyStat {
  family: 'crawlstr' | 'indexstr' | 'other';
  label: string;
  observations: number;
  indexers: number;
  documents: number;
  lastSeen: number;
  sources: string[];
}

function sourceFamily(source: string | undefined): SourceFamilyStat['family'] {
  const s = (source ?? '').toLowerCase();
  if (s.startsWith('crawlstr')) return 'crawlstr';
  if (s.startsWith('indexstr')) return 'indexstr';
  return 'other';
}

const FAMILY_LABELS: Record<SourceFamilyStat['family'], string> = {
  crawlstr: 'Crawlstr scouts',
  indexstr: 'indexstr network',
  other: 'Other publishers',
};

export interface IndexStats {
  observations: Sip01Observation[];
  documents: number;
  indexerCount: number;
  hosts: number;
  /** Share of sampled events passing full SIP-01 validation (0–1). */
  validityRate: number | null;
  validatedCount: number;
  perDay: { day: string; count: number }[];
  topics: { name: string; count: number }[];
  topHosts: { name: string; count: number }[];
  sources: { name: string; count: number }[];
  languages: { name: string; count: number }[];
  networks: { name: string; count: number }[];
  docTypes: { name: string; count: number }[];
  indexers: IndexerStat[];
  families: SourceFamilyStat[];
  relayCoverage: RelayCoverage[];
  heartbeats: ParsedHeartbeat[];
  liveNodes: ParsedHeartbeat[];
  liveByFamily: Record<HeartbeatFamily, number>;
  shardsCovered: number;
  selfReported: { pagesIndexed: number; published: number; queueSize: number };
  hasData: boolean;
  fetchedAt: number;
}

/** How often the dashboard re-reads the relays. */
const REFRESH_MS = 60_000;

export function useIndexStats() {
  const [stats, setStats] = useState<IndexStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cycle, setCycle] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    const t = setInterval(() => setCycle((c) => c + 1), REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    mounted.current = true;

    async function run() {
      setLoading(true);
      setError(null);
      const deadline = Date.now() + RELAY_TIMEOUT_MS;

      try {
        const perRelay = await Promise.all(
          OBSERVATION_RELAYS.map(async (url) => {
            try {
              const { events, timedOut } = await fetchObservationWindow(url, deadline);
              let heartbeats: SipEvent[] = [];
              const remaining = deadline - Date.now();
              let hbTimedOut = false;
              if (remaining > 500) {
                const hb = await queryRelay(url, { kinds: [HEARTBEAT_KIND], limit: 500 }, remaining);
                heartbeats = hb.events;
                hbTimedOut = hb.timedOut;
              }
              const anyTimeout = timedOut || hbTimedOut;
              const gotData = events.length + heartbeats.length > 0;
              const status: RelayCoverage['status'] = gotData
                ? anyTimeout
                  ? 'partial'
                  : 'ok'
                : anyTimeout
                  ? 'failed'
                  : 'ok';
              return { url, events, heartbeats, status };
            } catch {
              return { url, events: [] as SipEvent[], heartbeats: [] as SipEvent[], status: 'failed' as const };
            }
          }),
        );

        const relayCoverage: RelayCoverage[] = [];
        const obsEvents: SipEvent[] = [];
        const hbEvents: SipEvent[] = [];

        for (const r of perRelay) {
          relayCoverage.push({
            url: r.url,
            observations: r.events.length,
            heartbeats: r.heartbeats.length,
            status: r.status,
          });
          obsEvents.push(...r.events);
          hbEvents.push(...r.heartbeats);
        }

        const byId = new Map(obsEvents.map((e) => [e.id, e]));
        const observations = [...byId.values()]
          .map(parseSip01Event)
          .filter((o): o is Sip01Observation => o !== null)
          .sort((a, b) => b.observedAt - a.observedAt);

        const hbById = new Map(hbEvents.map((e) => [e.id, e]));
        const heartbeats = dedupeHeartbeats([...hbById.values()]);
        const now = Math.floor(Date.now() / 1000);
        const liveNodes = heartbeats.filter((hb) => isNodeLive(hb, now));
        const liveByFamily: Record<HeartbeatFamily, number> = { crawlstr: 0, indexstr: 0, unknown: 0 };
        for (const hb of liveNodes) liveByFamily[heartbeatFamily(hb.source)] += 1;

        /* ---- aggregates ---- */
        const docs = new Set(observations.map((o) => o.d));
        const hostSet = new Set(observations.map((o) => o.host));
        const indexerMap = new Map<string, IndexerStat & { docSet: Set<string>; sourceSet: Set<string>; networkSet: Set<string> }>();
        const familyMap = new Map<
          SourceFamilyStat['family'],
          { observations: number; indexers: Set<string>; docs: Set<string>; lastSeen: number; sources: Set<string> }
        >();

        const topicCount = new Map<string, number>();
        const hostCount = new Map<string, number>();
        const sourceCount = new Map<string, number>();
        const langCount = new Map<string, number>();
        const networkCount = new Map<string, number>();
        const typeCount = new Map<string, number>();
        const dayCount = new Map<string, number>();

        const bump = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);

        for (const o of observations) {
          for (const t of o.topics) bump(topicCount, t);
          bump(hostCount, o.host);
          bump(sourceCount, o.source ?? '(unspecified)');
          if (o.language) bump(langCount, o.language);
          if (o.extensions.network) bump(networkCount, o.extensions.network);
          if (o.extensions.type) bump(typeCount, o.extensions.type);
          bump(dayCount, new Date(o.observedAt * 1000).toISOString().slice(0, 10));

          const prev = indexerMap.get(o.indexer);
          if (prev) {
            prev.observations += 1;
            prev.docSet.add(o.d);
            prev.lastSeen = Math.max(prev.lastSeen, o.observedAt);
            if (o.source) prev.sourceSet.add(o.source);
            if (o.extensions.network) prev.networkSet.add(o.extensions.network);
          } else {
            indexerMap.set(o.indexer, {
              pubkey: o.indexer,
              observations: 1,
              documents: 0,
              lastSeen: o.observedAt,
              docSet: new Set([o.d]),
              sourceSet: new Set(o.source ? [o.source] : []),
              networkSet: new Set(o.extensions.network ? [o.extensions.network] : []),
              sources: [],
              networks: [],
            });
          }

          const fam = sourceFamily(o.source);
          const f = familyMap.get(fam) ?? {
            observations: 0,
            indexers: new Set<string>(),
            docs: new Set<string>(),
            lastSeen: 0,
            sources: new Set<string>(),
          };
          f.observations += 1;
          f.indexers.add(o.indexer);
          f.docs.add(o.d);
          f.lastSeen = Math.max(f.lastSeen, o.observedAt);
          if (o.source) f.sources.add(o.source);
          familyMap.set(fam, f);
        }

        const indexers: IndexerStat[] = [...indexerMap.values()]
          .map((i) => ({
            pubkey: i.pubkey,
            observations: i.observations,
            documents: i.docSet.size,
            lastSeen: i.lastSeen,
            sources: [...i.sourceSet],
            networks: [...i.networkSet],
          }))
          .sort((a, b) => b.observations - a.observations);

        const families: SourceFamilyStat[] = (['indexstr', 'crawlstr', 'other'] as const)
          .filter((fam) => familyMap.has(fam))
          .map((fam) => {
            const f = familyMap.get(fam)!;
            return {
              family: fam,
              label: FAMILY_LABELS[fam],
              observations: f.observations,
              indexers: f.indexers.size,
              documents: f.docs.size,
              lastSeen: f.lastSeen,
              sources: [...f.sources],
            };
          });

        const top = (map: Map<string, number>, n: number) =>
          [...map.entries()]
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, n);

        const perDay = [...dayCount.entries()]
          .map(([day, count]) => ({ day, count }))
          .sort((a, b) => (a.day < b.day ? -1 : 1));

        /* ---- validity: full SIP-01 validation over a sample ---- */
        let validityRate: number | null = null;
        let validatedCount = 0;
        const sample = observations.slice(0, VALIDATION_SAMPLE);
        if (sample.length > 0) {
          let valid = 0;
          for (const o of sample) {
            const v = await validateSip01Event(o.event);
            if (v.valid) valid += 1;
            validatedCount += 1;
            if (validatedCount % 150 === 0) {
              await new Promise((r) => setTimeout(r, 0)); // keep the page responsive
            }
          }
          validityRate = valid / sample.length;
        }

        const shardsCovered = new Set(liveNodes.map((hb) => hb.shard)).size;
        const selfReported = liveNodes.reduce(
          (acc, hb) => ({
            pagesIndexed: acc.pagesIndexed + hb.stats.pagesIndexed,
            published: acc.published + hb.stats.published,
            queueSize: acc.queueSize + hb.stats.queueSize,
          }),
          { pagesIndexed: 0, published: 0, queueSize: 0 },
        );

        if (!mounted.current) return;
        setStats({
          observations,
          documents: docs.size,
          indexerCount: indexerMap.size,
          hosts: hostSet.size,
          validityRate,
          validatedCount,
          perDay,
          topics: top(topicCount, 12),
          topHosts: top(hostCount, 12),
          sources: top(sourceCount, 8),
          languages: top(langCount, 8),
          networks: top(networkCount, 8),
          docTypes: top(typeCount, 8),
          indexers,
          families,
          relayCoverage,
          heartbeats,
          liveNodes,
          liveByFamily,
          shardsCovered,
          selfReported,
          hasData: observations.length + heartbeats.length > 0,
          fetchedAt: Date.now(),
        });
      } catch (e) {
        if (!mounted.current) return;
        setError(e instanceof Error ? e.message : 'Failed to read relays');
      } finally {
        /* Free the sockets between cycles — reconnecting is cheap and the
           relays see a polite reader instead of 11 idle connections. */
        try {
          pool?.close(OBSERVATION_RELAYS);
          pool = null;
        } catch {
          /* ignore */
        }
        if (mounted.current) setLoading(false);
      }
    }

    run();
    return () => {
      mounted.current = false;
    };
  }, [cycle]);

  return { stats, loading, error };
}
