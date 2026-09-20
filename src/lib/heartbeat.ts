/**
 * Crawler network heartbeats — kind 16919 (replaceable).
 *
 * Shared by BOTH crawler families: indexstr nodes (which schedule work by
 * shard) and Crawlstr scouts (which report only a home shard). One
 * replaceable event per node; the latest write wins. The `source` tag
 * (`indexstr/1` / `crawlstr/1`) distinguishes the software.
 *
 * Heartbeats are SELF-REPORTED and unverified — useful for coverage/health
 * estimates, never as a reputation input. Reputation derives from signed
 * kind 39697 observations.
 *
 * Ported from github.com/NostrDanish/SIP-01 src/lib/heartbeat.ts (schema:
 * indexstr src/crawler/heartbeat.ts).
 */
import type { SipEvent } from './sip01-utils';

/** Replaceable event kind for crawler node heartbeats. */
export const HEARTBEAT_KIND = 16919;

/** Heartbeats older than this are considered offline (seconds). */
export const HEARTBEAT_TTL_S = 3600;

/** Total shard count in the indexstr sharding scheme (00–FF). */
export const SHARD_COUNT = 256;

export interface HeartbeatStats {
  pagesIndexed: number;
  queueSize: number;
  published: number;
}

export interface ParsedHeartbeat {
  pubkey: string;
  createdAt: number;
  v: string;
  shard: string;
  platform: string;
  network: string;
  charging: boolean;
  stats: HeartbeatStats;
  source?: string;
}

/** Structural validation for incoming heartbeats (indexstr-compatible). */
export function parseHeartbeat(event: SipEvent): ParsedHeartbeat | null {
  if (event.kind !== HEARTBEAT_KIND) return null;
  try {
    const payload = JSON.parse(event.content) as Record<string, unknown>;
    const shard = payload.shard;
    if (typeof shard !== 'string' || !/^[0-9A-Fa-f]{2}$/.test(shard)) return null;
    if (typeof payload.v !== 'string') return null;
    const stats = (payload.stats ?? {}) as Record<string, unknown>;
    return {
      pubkey: event.pubkey,
      createdAt: event.created_at,
      v: payload.v,
      shard: shard.toUpperCase(),
      platform: typeof payload.platform === 'string' ? payload.platform.slice(0, 16) : 'unknown',
      network: typeof payload.network === 'string' ? payload.network.slice(0, 24) : 'unknown',
      charging: payload.charging === true,
      stats: {
        pagesIndexed: Math.max(0, Number(stats.pagesIndexed) || 0),
        queueSize: Math.max(0, Number(stats.queueSize) || 0),
        published: Math.max(0, Number(stats.published) || 0),
      },
      source: event.tags.find(([n]) => n === 'source')?.[1],
    };
  } catch {
    return null;
  }
}

/** Latest heartbeat per node pubkey (kind 16919 is replaceable). */
export function dedupeHeartbeats(events: SipEvent[]): ParsedHeartbeat[] {
  const latest = new Map<string, ParsedHeartbeat>();
  for (const e of events) {
    const hb = parseHeartbeat(e);
    if (!hb) continue;
    const prev = latest.get(hb.pubkey);
    if (!prev || hb.createdAt > prev.createdAt) latest.set(hb.pubkey, hb);
  }
  return [...latest.values()].sort((a, b) => b.createdAt - a.createdAt);
}

/** True when the heartbeat is fresh enough to count the node as online. */
export function isNodeLive(hb: ParsedHeartbeat, now = Math.floor(Date.now() / 1000)): boolean {
  return now - hb.createdAt <= HEARTBEAT_TTL_S;
}

/** Crawler software family, from the heartbeat's `source` tag. */
export type HeartbeatFamily = 'crawlstr' | 'indexstr' | 'unknown';

/** Classify a heartbeat by its `source` tag (`crawlstr/1`, `indexstr/1`, …). */
export function heartbeatFamily(source: string | undefined): HeartbeatFamily {
  const s = (source ?? '').toLowerCase();
  if (s.startsWith('crawlstr')) return 'crawlstr';
  if (s.startsWith('indexstr')) return 'indexstr';
  return 'unknown';
}

/** Crawler software generation, from a `source` tag: 'v2' | 'v1' | null. */
export function sourceVersion(source: string | undefined): 'v2' | 'v1' | null {
  const s = (source ?? '').toLowerCase();
  if (/\/(v?2)$/.test(s)) return 'v2';
  if (/\/(v?1)$/.test(s)) return 'v1';
  return null;
}
