/**
 * SIP-01 structured protocol data — ported from the canonical spec repo
 * (github.com/NostrDanish/SIP-01, src/lib/sip01.ts). Mirrors spec v1.2.
 */

export const SIP01 = {
  name: 'Search Index Protocol',
  short: 'SIP-01',
  kind: 39697,
  heartbeatKind: 16919,
  version: '1.2',
  schemaVersion: '1',
  dPrefix: 'widx:',
  shardCount: 256,
  tagline:
    'One shared decentralized index. Many independent indexers. Many independent search engines. No single owner.',
} as const;

export const LINKS = {
  specRepo: 'https://github.com/NostrDanish/SIP-01',
  specSite: 'https://sip.shakespeare.wtf/',
  specRaw: 'https://github.com/NostrDanish/SIP-01/blob/main/public/spec/SIP-01.md',
  guide:
    'https://github.com/NostrDanish/SIP-01/blob/main/docs/IMPLEMENTATION-GUIDE.md',
  dashboardRepo: 'https://github.com/NostrDanish/SIP-dashboard',
} as const;

/* ------------------------------------------------------------------ */
/* Relay read set                                                      */
/* ------------------------------------------------------------------ */

/** NIP-50-capable relays used by the ecosystem's engines. */
export const SEARCH_RELAYS = [
  'wss://relay.nostr.band/',
  'wss://relay.ditto.pub/',
  'wss://search.nos.today/',
  'wss://relay.noswhere.com/',
];

/**
 * Relays the ecosystem's crawlers publish kind 39697 observations to — the
 * union of the Crawlstr and indexstr relay pools. The Tor-only onion relay is
 * omitted (a clearnet browser can't reach it).
 */
export const CRAWLER_RELAYS = [
  'wss://relay-na1.metanomalist.com/',
  'wss://jskitty.cat/nostr',
  'wss://relay.primal.net/',
  'wss://relay.damus.io/',
  'wss://nostr.hifish.org/',
];

/** Full ecosystem read set: crawler publish pools ∪ NIP-50 search relays ∪ dreamith. */
export const OBSERVATION_RELAYS: string[] = [
  ...new Set([...SEARCH_RELAYS, ...CRAWLER_RELAYS, 'wss://relay.dreamith.to/']),
];

/* ------------------------------------------------------------------ */
/* Ecosystem                                                           */
/* ------------------------------------------------------------------ */

export interface Repo {
  name: string;
  url: string;
  role: string;
  badge: 'Spec' | 'Relay' | 'Crawler' | 'Engine' | 'Engine +' | 'Template' | 'Dashboard';
  description: string;
  keyFiles: { path: string; note: string }[];
}

export const CORE_REPO: Repo = {
  name: 'SIP-01',
  url: 'https://github.com/NostrDanish/SIP-01',
  role: 'Canonical specification & documentation',
  badge: 'Spec',
  description:
    'The submission-ready specification (v1.2), the byte-compatibility test vectors every implementation must pass, the extension tag registry, the cross-implementation audit, and the live explorer with a client-side validator and d-tag calculator.',
  keyFiles: [
    { path: 'public/spec/SIP-01.md', note: 'The full specification (v1.2)' },
    { path: 'src/lib/sip01-utils.ts', note: 'Reference parse/validate/normalize' },
    { path: 'docs/IMPLEMENTATION-GUIDE.md', note: 'Publish / consume / relay guide' },
  ],
};

export const REPOS: Repo[] = [
  {
    name: 'UNCAGED-Index-Relay',
    url: 'https://github.com/NostrDanish/UNCAGED-Index-Relay',
    role: 'Validating index relay',
    badge: 'Relay',
    description:
      'The reference relay. Validates SIP-01 events at ingestion (d ↔ u and x ↔ content verified at the door), indexes them into dedicated OpenSearch fields, answers NIP-50 web-search operators, advertises capabilities via NIP-11, and federates with NIP-77 negentropy sync.',
    keyFiles: [
      { path: 'src/web-document.ts', note: 'SIP-01 validation + field extraction' },
      { path: 'src/opensearch.ts', note: 'Web-search operator → query mapping' },
      { path: 'docs/SIP-01.md', note: 'Relay profile — the relay-side contract' },
    ],
  },
  {
    name: 'Crwalstr',
    url: 'https://github.com/NostrDanish/Crwalstr',
    role: 'Browser web crawler',
    badge: 'Crawler',
    description:
      'A pure SIP-01 publisher. Each browser generates its own anonymous indexer keypair (never the user’s personal key), crawls pages, and publishes byte-compatible kind 39697 observations to the shared index.',
    keyFiles: [
      { path: 'src/crawler/webIndex.ts', note: 'Byte-compatible event builder' },
      { path: 'src/crawler/indexerIdentity.ts', note: 'Per-device anonymous indexer keys' },
      { path: 'NIP.md', note: 'Publisher-side schema reference' },
    ],
  },
  {
    name: 'indexstr',
    url: 'https://github.com/NostrDanish/indexstr',
    role: 'Distributed indexing network',
    badge: 'Crawler',
    description:
      'Crawlstr evolved into a network: curated URL collections, deterministic sharding (256 shards, one home shard per node pubkey), offline outbox, and node heartbeats (kind 16919) so the network can measure itself without a coordinator.',
    keyFiles: [
      { path: 'src/crawler/webIndex.ts', note: 'Byte-compatible event builder' },
      { path: 'src/crawler/heartbeat.ts', note: 'Node heartbeats — kind 16919' },
      { path: 'src/crawler/sharding.ts', note: 'Coordinator-free work splitting' },
    ],
  },
  {
    name: 'UNCAGED-ENGINE',
    url: 'https://github.com/NostrDanish/UNCAGED-ENGINE',
    role: 'Search engine template',
    badge: 'Template',
    description:
      'The reference search-engine implementation and forkable template. Ships the canonical webIndex.ts (build / parse / validate / normalize), the per-device indexer identity, and the web-index provider that groups observations by d and ranks by independent indexer count.',
    keyFiles: [
      { path: 'src/lib/webIndex.ts', note: 'Reference implementation (canonical)' },
      { path: 'src/lib/indexerIdentity.ts', note: 'Per-device indexer identity' },
      { path: 'docs/SEARCH_INDEX_PROTOCOL.md', note: 'Protocol draft (v1)' },
    ],
  },
  {
    name: '0xSearchstr',
    url: 'https://github.com/NostrDanish/0xSearchstr',
    role: 'Search engine',
    badge: 'Engine',
    description:
      'The original engine. Aggregates external providers and auto-indexes fresh results as SIP-01 observations via a server-side autosigner — “just one more independent indexer”. Reads merge the legacy kind-30078 query cache with kind 39697.',
    keyFiles: [
      { path: 'src/lib/webIndex.ts', note: 'Publisher/reader impl' },
      { path: 'NIP.md', note: 'Legacy cache schema + trusted indexers' },
      { path: 'docs/SEARCH_INDEX_PROTOCOL.md', note: 'Protocol draft (v1)' },
    ],
  },
  {
    name: '0xPresearchstr',
    url: 'https://github.com/NostrDanish/0xPresearchstr',
    role: 'Search engine — clearnet + tor/i2p',
    badge: 'Engine +',
    description:
      'The extended engine: multi-network crawling (clearnet, tor, i2p seed lists), keyword stakes, and the same SIP-01 read/write path. Proof that engines layer app-specific features on top of the shared index without touching the core schema.',
    keyFiles: [
      { path: 'backend/tor-crawler/src/index.ts', note: 'Tor network crawler' },
      { path: 'backend/nip50-relay/src/index.ts', note: 'Bundled search relay' },
      { path: 'src/lib/webIndex.ts', note: 'Publisher/reader impl' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Tag registry                                                        */
/* ------------------------------------------------------------------ */

export interface TagSpec {
  tag: string;
  location?: string;
  requirement: 'required' | 'optional';
  shape: string;
  relayIndexed: boolean;
  description: string;
  status?: 'core' | 'registered' | 'reserved';
}

export const CORE_TAGS: TagSpec[] = [
  { tag: 'd', requirement: 'required', shape: '"widx:" + 32 lowercase hex', relayIndexed: true, status: 'core', description: 'URL identity. sha256(normalized u)[0:32]. Identical across all indexers — the dedup + agreement key.' },
  { tag: 'u', requirement: 'required', shape: 'http(s) URL ≤ 2048 chars', relayIndexed: true, status: 'core', description: 'Canonical URL. Validated against the allowlist; normalized per §7 before hashing.' },
  { tag: 'v', requirement: 'required', shape: '"1"', relayIndexed: true, status: 'core', description: 'Schema version. Unknown versions are ignored by consumers / rejected at ingestion.' },
  { tag: 'alt', requirement: 'required', shape: 'non-empty, ≤ 1000 chars', relayIndexed: false, status: 'core', description: 'Human-readable summary for generic clients. Presentation-only — never parsed.' },
  { tag: 'title', location: 'content', requirement: 'required', shape: 'string, 1–300 chars trimmed', relayIndexed: false, status: 'core', description: 'Document title, in the content JSON.' },
  { tag: 'description', location: 'content', requirement: 'optional', shape: 'string ≤ 1000 chars', relayIndexed: false, status: 'core', description: 'Plain-text summary, no markup.' },
  { tag: 'image', location: 'content', requirement: 'optional', shape: 'https: URL ≤ 2048 chars', relayIndexed: false, status: 'core', description: 'Representative image. https only.' },
  { tag: 't', requirement: 'optional', shape: '0–8 × lowercase keyword', relayIndexed: true, status: 'core', description: 'Lowercase topics. How topical engines slice the index without a new kind.' },
  { tag: 'l', requirement: 'optional', shape: 'ISO 639-1, ^[a-z]{2}$', relayIndexed: true, status: 'core', description: 'Document language — the NIP-32 labeling convention in bare two-letter form.' },
  { tag: 'x', requirement: 'optional', shape: '64 lowercase hex', relayIndexed: true, status: 'core', description: 'Content identity: sha256(title + "\\n" + description). Same d + same x = indexers agree.' },
  { tag: 'published', requirement: 'optional', shape: 'unix seconds', relayIndexed: false, status: 'core', description: 'The page’s claimed publication time. (Observation time is the event’s created_at.)' },
  { tag: 'source', requirement: 'optional', shape: '≤ 100 chars', relayIndexed: false, status: 'core', description: 'Indexer software id, e.g. crawlstr/1. Informational — the pubkey is the real identity.' },
];

export const EXTENSION_TAGS: TagSpec[] = [
  { tag: 'type', requirement: 'optional', shape: 'keyword, lowercased', relayIndexed: false, status: 'registered', description: 'Logical document type: page, article, repository, video, image, file…' },
  { tag: 'platform', requirement: 'optional', shape: 'keyword, lowercased', relayIndexed: false, status: 'registered', description: 'Source platform: github, gitlab, youtube…' },
  { tag: 'category', requirement: 'optional', shape: 'keyword, lowercased', relayIndexed: false, status: 'registered', description: 'Content category; engine-defined vocabulary.' },
  { tag: 'network', requirement: 'optional', shape: 'keyword, lowercased', relayIndexed: false, status: 'registered', description: 'Network the document lives on: clearnet, tor, i2p…' },
  { tag: 'country', requirement: 'optional', shape: 'ISO 3166-1 alpha-2, uppercased', relayIndexed: false, status: 'registered', description: 'Country the document targets or originates from.' },
  { tag: 'mime', requirement: 'optional', shape: 'MIME type, lowercased', relayIndexed: false, status: 'registered', description: 'Document media type, e.g. application/pdf.' },
];

export const EXTENSION_RULES = [
  { title: 'Extensions are optional', body: 'A consumer that ignores every extension still has a fully working index entry. No extension may become load-bearing.' },
  { title: 'Never redefine core fields', body: 'Extensions must not change the meaning of existing fields. Changing core semantics requires a v bump, not a new tag.' },
  { title: 'Unknown tags are ignored', body: 'Consumers and relays MUST ignore unknown tags — extensions stay forwards-compatible.' },
  { title: 'Single-letter names are reserved', body: 'Stock NIP-01 relays only index single-letter tags. Multi-letter extensions are engine-level facets surfaced via NIP-50 operators.' },
];

/** The README example event — a real, reproducible kind 39697 observation. */
export const EXAMPLE_EVENT = {
  kind: 39697,
  content: '{"title":"Example Page","description":"A page about examples."}',
  tags: [
    ['d', 'widx:3641c5f2274c5471278ab5bf1df6d185'],
    ['u', 'https://example.com/page'],
    ['t', 'nostr'],
    ['l', 'en'],
    ['x', '2a5cbdf44513f552fb571d6c6de2ddf16c5452b235cc887980b52898fb38e7c1'],
    ['v', '1'],
    ['source', 'crawlstr/1'],
    ['alt', 'Web index observation: Example Page'],
  ],
};

export const THREE_IDENTITIES = [
  { name: 'URL identity', field: 'd', rule: '"widx:" + sha256(normalized_url)[0:32] — identical across all indexers' },
  { name: 'Canonical URL', field: 'u', rule: 'Normalized per spec §7 — www-stripping, tracker-param removal, query sorting' },
  { name: 'Content identity', field: 'x', rule: 'sha256(title + "\\n" + description) — the indexer-agreement signal' },
];
