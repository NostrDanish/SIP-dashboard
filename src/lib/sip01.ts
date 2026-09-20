/**
 * SIP-01 structured protocol data — ported from the canonical spec repo
 * (github.com/NostrDanish/SIP-01, src/lib/sip01.ts) and the ecosystem's
 * crawler relay configuration (github.com/NostrDanish/crawlstr,
 * src/crawler/relays.ts). Mirrors spec v1.2.
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

/**
 * SIP-01-aware index relays — the validating relay cohort. They index kind
 * 39697, answer NIP-50 web-search operators, and advertise the
 * `uncaged_index` capability block in their NIP-11 document (spec §15).
 * The *.workers.dev instances run on the SIP-Booster-Relay (serverless
 * Cloudflare worker) stack.
 */
export const SIP01_RELAYS = [
  'wss://relay-na1.metanomalist.com/',
  'wss://test-sip-relay.sip-01test.workers.dev/',
  'wss://sip-relay-2.sip-booster-relay.workers.dev/',
  'wss://sip-relay-3.uncaged-sip.workers.dev/',
  'wss://sip-relay-4.sip-relay-4.workers.dev/',
];

/** NIP-50-capable relays used by the ecosystem's engines. */
export const SEARCH_RELAYS = [
  'wss://relay.nostr.band/',
  'wss://relay.ditto.pub/',
  'wss://search.nos.today/',
  'wss://relay.noswhere.com/',
];

/**
 * Public write relays the ecosystem's crawlers also publish kind 39697
 * observations to, so they replicate widely. The Tor-only onion relay is
 * omitted (a clearnet browser can't reach it).
 */
export const CRAWLER_RELAYS = [
  'wss://jskitty.cat/nostr',
  'wss://relay.primal.net/',
  'wss://relay.damus.io/',
  'wss://nostr.hifish.org/',
];

/**
 * The default app relay list — every relay this dashboard reads the SIP-01
 * index from: SIP-01 index relays ∪ NIP-50 search relays ∪ crawler publish
 * relays ∪ relay.dreamith.to. Editable in the Settings tab (local-only,
 * never published); reset restores this set.
 */
export const OBSERVATION_RELAYS: string[] = [
  ...new Set([
    ...SIP01_RELAYS,
    ...SEARCH_RELAYS,
    ...CRAWLER_RELAYS,
    'wss://relay.dreamith.to/',
  ]),
];

/* ------------------------------------------------------------------ */
/* Ecosystem projects                                                  */
/* ------------------------------------------------------------------ */

export type ProjectBadge =
  | 'Spec'
  | 'Core'
  | 'Engine'
  | 'Engine +'
  | 'Crawler'
  | 'Indexer'
  | 'Relay'
  | 'Template'
  | 'Dashboard';

export interface Project {
  id: string;
  name: string;
  /** GitHub repo name under NostrDanish (null when not yet published). */
  repo: string | null;
  badge: ProjectBadge;
  version: string;
  status: 'live' | 'beta' | 'announced';
  role: string;
  description: string;
  features: string[];
  liveUrl?: string;
  /** SIP-01 `source` tag prefixes this project publishes with (for on-chain stats). */
  sourceTags: string[];
  keyFiles: { path: string; note: string }[];
}

export const PROJECTS: Project[] = [
  {
    id: 'sip-01',
    name: 'SIP-01',
    repo: 'SIP-01',
    badge: 'Spec',
    version: 'spec v1.2 · schema v1',
    status: 'live',
    role: 'Canonical specification & documentation',
    description:
      'The protocol itself: one addressable Nostr event (kind 39697) per (indexer pubkey, normalized URL) — a signed statement that an indexer observed a web document. Submission-ready spec, byte-compatibility test vectors, extension tag registry, cross-implementation audit, live explorer with client-side validator.',
    features: [
      'Three identities kept separate: d (URL), u (canonical), x (content)',
      'Frozen core schema — change only via a v bump',
      'Extension tag registry with x- experiment prefix',
      '§13 test vectors every implementation must match byte-for-byte',
      'Live explorer + d-tag calculator + validator',
    ],
    liveUrl: 'https://sip.shakespeare.wtf/',
    sourceTags: [],
    keyFiles: [
      { path: 'public/spec/SIP-01.md', note: 'The full specification (v1.2)' },
      { path: 'src/lib/sip01-utils.ts', note: 'Reference parse/validate/normalize' },
      { path: 'docs/IMPLEMENTATION-GUIDE.md', note: 'Publish / consume / relay guide' },
    ],
  },
  {
    id: 'sip-01-core',
    name: 'sip-01-core',
    repo: 'sip-01-core',
    badge: 'Core',
    version: 'v0.1.0 · spec v1.2',
    status: 'live',
    role: 'Reference implementation + reusable search-engine core',
    description:
      'The protocol as a library: byte-critical SIP-01 protocol code (45 tests pinning the §13 vectors), shared 0xsearchstr:* federation contracts, relay machinery, the full provider/query/rank engine stack, votes (NIP-25), moderation, and an optional OpenAI-compatible AI layer. Any search engine builds on it through five injection seams — the core holds no brand, no trust anchors, no credentials.',
    features: [
      'src/protocol — byte-critical, spec-pinned reference implementation',
      '15 built-in search providers + pluggable registry',
      'Query parse → evaluate → rank stack (SIP-02 seed)',
      'configureEngine() / configureRelays() host injection seams',
      'AIProvider contract with credential-precedence resolution',
    ],
    sourceTags: [],
    keyFiles: [
      { path: 'src/protocol/', note: 'SIP-01 wire format, spec-pinned' },
      { path: 'src/engine/', note: 'Providers + query/rank + votes' },
      { path: 'ARCHITECTURE.md', note: 'The architecture deep-dive' },
    ],
  },
  {
    id: 'dsearch',
    name: 'Dsearch',
    repo: 'Dsearch',
    badge: 'Engine',
    version: 'flagship · SIP-02 seed',
    status: 'live',
    role: 'The community-driven search engine',
    description:
      'The flagship engine and ecosystem hub — "powered by Nostr, owned by no one". SIP-01 community index first, then 18 parallel providers (NIP-50, SearXNG, DuckDuckGo, Brave BYOK, wiki, git, Tor…). Local authoritative query-AST execution, keyword staking, query classification privacy, optional AI answers, and auto-indexing of surfaced results back into the shared pool.',
    features: [
      'Community index scores highest — coverage-weighted merge + rank',
      'Structured queries: boolean, site:, lang:, tag:, after: — parsed to an AST and executed locally',
      'Query classification: calculators and npubs never leave the Nostr tier',
      'Keyword stakes — sign a keyword → link binding with your Nostr key',
      'Relay auto-discovery: NIP-66 announcements + NIP-11 verification',
    ],
    liveUrl: 'https://dsearch.com',
    sourceTags: ['dsearch'],
    keyFiles: [
      { path: 'docs/SEARCH-QUERIES.md', note: 'The structured query guide' },
      { path: 'NIP.md', note: 'Federation contract documentation' },
      { path: 'src/lib/dsearchProtocol.ts', note: 'The dsearch:* control plane' },
    ],
  },
  {
    id: '0xsearchstr',
    name: '0xSearchstr',
    repo: '0xSearchstr',
    badge: 'Engine',
    version: 'the original',
    status: 'live',
    role: 'Search engine — the first SIP-01 citizen',
    description:
      'The original engine. Aggregates external providers and auto-indexes fresh results as SIP-01 observations via a server-side autosigner — "just one more independent indexer". Shares one federated index with Dsearch: same kinds, same tags, different signers — a search on either warms the index for both.',
    features: [
      'Server-side autosigner — every search strengthens the index',
      'Legacy kind-30078 query cache merged with kind 39697 reads',
      'The 0xsearchstr:* federation namespaces originate here',
      'Relay auto-discovery with 24h verified cache',
    ],
    liveUrl: 'https://0xsearchstr.shakespeare.wtf',
    sourceTags: ['0xsearchstr'],
    keyFiles: [
      { path: 'src/lib/relayDiscovery.ts', note: 'NIP-66 + NIP-11 auto-discovery' },
      { path: 'src/lib/webIndex.ts', note: 'Publisher/reader impl' },
      { path: 'NIP.md', note: 'Legacy cache schema + trusted indexers' },
    ],
  },
  {
    id: '0xpresearchstr',
    name: '0xPresearchstr',
    repo: '0xPresearchstr',
    badge: 'Engine +',
    version: 'community fork',
    status: 'live',
    role: 'Search engine — clearnet + tor/i2p',
    description:
      'The extended engine: multi-network crawling (clearnet, tor, i2p seed lists), keyword stakes, and the same SIP-01 read/write path. Proof that engines layer app-specific features on top of the shared index without touching the core schema.',
    features: [
      'Tor network crawler backend with its own seed lists',
      'Bundled NIP-50 relay (backend/nip50-relay)',
      'Keyword stakes for community placement',
      'Multi-network observations via the network extension tag',
    ],
    liveUrl: 'https://presearchstr.shakespeare.wtf',
    sourceTags: ['0xpresearchstr', 'presearchstr'],
    keyFiles: [
      { path: 'backend/tor-crawler/src/index.ts', note: 'Tor network crawler' },
      { path: 'backend/nip50-relay/src/index.ts', note: 'Bundled search relay' },
      { path: 'src/lib/webIndex.ts', note: 'Publisher/reader impl' },
    ],
  },
  {
    id: 'uncaged-engine',
    name: 'UNCAGED-ENGINE',
    repo: 'UNCAGED-ENGINE',
    badge: 'Template',
    version: 'reference template',
    status: 'live',
    role: 'Forkable search-engine template',
    description:
      'The reference search-engine implementation and forkable template. Ships the canonical webIndex.ts (build / parse / validate / normalize), the per-device indexer identity, and the web-index provider that groups observations by d and ranks by independent indexer count.',
    features: [
      'Canonical webIndex.ts — the reference implementation',
      'Groups by d, ranks by independent indexer agreement',
      'Publishes observations as uncaged-engine/1',
      'Minimal — fork it and you have an engine',
    ],
    liveUrl: 'https://uncaged.shakespeare.wtf',
    sourceTags: ['uncaged-engine'],
    keyFiles: [
      { path: 'src/lib/webIndex.ts', note: 'Reference implementation (canonical)' },
      { path: 'src/lib/indexerIdentity.ts', note: 'Per-device indexer identity' },
    ],
  },
  {
    id: 'crawlstr-v1',
    name: 'Crawlstr v1',
    repo: 'crawlstr',
    badge: 'Crawler',
    version: 'v1 · source=crawlstr/1',
    status: 'live',
    role: 'Lightweight browser scout',
    description:
      'Every browser a voluntary crawl node: paste a seed URL or hit Random Scout, and it fetches pages through an SSRF-guarded path, extracts metadata, and publishes signed kind 39697 observations from a per-device anonymous keypair. Battery/WiFi/bandwidth aware, robots.txt-respecting, IndexedDB-persistent — honest about browser limits.',
    features: [
      'Random Scout — weighted seed strategies tuned for long-tail coverage',
      'RSS/Atom + sitemap discovery — cheap, high-value scouting',
      'Per-domain rate limits, eco mode, charging-only mode',
      'Kind 16919 heartbeats while running',
      'PWA — installable, works on a phone on WiFi',
    ],
    liveUrl: 'https://crawlstr.shakespeare.wtf',
    sourceTags: ['crawlstr/1'],
    keyFiles: [
      { path: 'src/crawler/webIndex.ts', note: 'Byte-compatible event builder' },
      { path: 'src/crawler/safety.ts', note: 'SSRF guard at the proxy boundary' },
      { path: 'src/data/seeds/', note: 'The Random Scout seed corpus' },
    ],
  },
  {
    id: 'crawlstr-v2',
    name: 'Crawlstr v2',
    repo: 'crawlstr-v2',
    badge: 'Crawler',
    version: 'v2 · source=crawlstr/v2',
    status: 'beta',
    role: 'Decentralized browser crawler, rebuilt',
    description:
      'The v2 rebuild, sliced from the web-crawler monorepo: the shared @sip01/protocol + @sip01/crawler-core packages underneath — hardened SSRF guard, IndexedDB crawl queue/outbox, politeness scheduler — with the Crawlstr app on top. Every observation tagged source=crawlstr/v2 so the network can tell v2 traffic apart.',
    features: [
      '@sip01/protocol — SIP-01 v1.2 wire format as a workspace package',
      '@sip01/crawler-core — shared deep crawler stack',
      'Hardened SSRF guard + politeness scheduler',
      'Distinct source tag: crawlstr/v2',
    ],
    liveUrl: 'https://crawlstr.shakespeare.wtf',
    sourceTags: ['crawlstr/v2', 'crawlstr/2'],
    keyFiles: [
      { path: 'packages/sip01-protocol/', note: 'The wire format package' },
      { path: 'packages/crawler-core/', note: 'Shared crawler core' },
      { path: 'apps/crawlstr/', note: 'The v2 web app' },
    ],
  },
  {
    id: 'indexstr-v1',
    name: 'indexstr v1',
    repo: 'indexstr',
    badge: 'Indexer',
    version: 'v1 · source=indexstr/1',
    status: 'live',
    role: 'Heavyweight distributed indexer',
    description:
      'Crawlstr evolved into a network: curated SQLite URL collections (top sites, awesome lists, feeds, music, books, movies, games), deterministic sharding across 256 slots with one home shard per node pubkey, an offline outbox, and kind 16919 heartbeats so the network measures itself without a coordinator.',
    features: [
      'Deterministic sharding — 256 slots, coordinator-free work splitting',
      'Bundled curated collections as SQLite databases',
      'Offline outbox — publishes when Nostr is reachable',
      'Kind 16919 heartbeats: pages indexed, queue depth, shard',
    ],
    liveUrl: 'https://indexstr.shakespeare.wtf',
    sourceTags: ['indexstr/1'],
    keyFiles: [
      { path: 'src/crawler/sharding.ts', note: 'Coordinator-free work splitting' },
      { path: 'src/crawler/heartbeat.ts', note: 'Node heartbeats — kind 16919' },
      { path: 'public/collections/', note: 'Curated SQLite URL collections' },
    ],
  },
  {
    id: 'indexstr-v2',
    name: 'indexstr v2',
    repo: 'indexstr-v2',
    badge: 'Indexer',
    version: 'v2 · source=indexstr/v2',
    status: 'beta',
    role: 'Distributed indexing network node, rebuilt',
    description:
      'The full deep-crawler stack in your browser on the v2 packages: SSRF-guarded fetching, IndexedDB crawl queue/outbox, politeness scheduler, curated URL collections (loadable from Blossom when the static DBs are absent), publishing observations tagged source=indexstr/v2.',
    features: [
      'Runs on @sip01/protocol + @sip01/crawler-core',
      'Collections fall back to Blossom blob storage',
      'Same 256-shard scheme, distinct v2 source tag',
      'Self-contained pnpm workspace app',
    ],
    liveUrl: 'https://indexstr.shakespeare.wtf',
    sourceTags: ['indexstr/v2', 'indexstr/2'],
    keyFiles: [
      { path: 'packages/crawler-core/', note: 'Queue, scheduler, publishing lane' },
      { path: 'apps/indexstr/', note: 'The v2 web app' },
    ],
  },
  {
    id: 'uncaged-index-relay',
    name: 'UNCAGED-Index-Relay',
    repo: 'UNCAGED-Index-Relay',
    badge: 'Relay',
    version: 'self-hosted · OpenSearch',
    status: 'live',
    role: 'Validating index relay',
    description:
      'The reference relay. Validates SIP-01 events at ingestion (d ↔ u and x ↔ content verified at the door), indexes them into dedicated OpenSearch fields, answers NIP-50 web-search operators, advertises capabilities via NIP-11, and federates with NIP-77 negentropy sync.',
    features: [
      'Ingestion-time validation — placeholder hashes rejected at the door',
      'OpenSearch-backed web-search operators',
      'NIP-11 uncaged_index capability advertisement',
      'NIP-77 negentropy federation',
    ],
    sourceTags: [],
    keyFiles: [
      { path: 'src/web-document.ts', note: 'SIP-01 validation + field extraction' },
      { path: 'src/opensearch.ts', note: 'Web-search operator → query mapping' },
      { path: 'docs/SIP-01.md', note: 'Relay profile — the relay-side contract' },
    ],
  },
  {
    id: 'sip-booster-relay',
    name: 'SIP-Booster-Relay',
    repo: null,
    badge: 'Relay',
    version: 'serverless · Cloudflare workers',
    status: 'live',
    role: 'Serverless index relay cohort',
    description:
      'The serverless relay stack: SIP-01-aware index relays running as Cloudflare workers — validating kind 39697 at the edge, no origin server to own. The live cohort is already part of the default crawler publish set; the source repository is being prepared for release.',
    features: [
      'wss://test-sip-relay.sip-01test.workers.dev',
      'wss://sip-relay-2.sip-booster-relay.workers.dev',
      'wss://sip-relay-3.uncaged-sip.workers.dev',
      'wss://sip-relay-4.sip-relay-4.workers.dev',
      'Edge validation of kind 39697, serverless scale',
    ],
    sourceTags: [],
    keyFiles: [],
  },
  {
    id: 'crawlstr-sip-relay',
    name: 'Crawlstr-SIP-Relay',
    repo: null,
    badge: 'Relay',
    version: 'android · announced',
    status: 'announced',
    role: 'Android index relay',
    description:
      'An index relay that runs on an Android device — the relay layer joining the crawlers in your pocket. Announced in the Dsearch ecosystem map; repository landing soon.',
    features: [
      'Relay-grade SIP-01 storage on a phone',
      'Pairs with Crawlstr on the same device',
      'Repository landing soon',
    ],
    sourceTags: [],
    keyFiles: [],
  },
  {
    id: 'sip-dashboard',
    name: 'SIP-dashboard',
    repo: 'SIP-dashboard',
    badge: 'Dashboard',
    version: 'this site',
    status: 'live',
    role: 'Live network telemetry (you are here)',
    description:
      'The main SIP dashboard: reads the shared index straight from the ecosystem relays in your browser — mission-control stats, shard coverage, node heartbeats, per-relay provenance, spec conformance re-validation, ecosystem explorer, and a fully editable relay list with NIP-66/NIP-11 auto-discovery. Publishes nothing, tracks no one.',
    features: [
      'Everything derived from the events — no hardcoded indexer registry',
      'Client-side SHA-256 re-validation of sampled observations',
      'Editable app relay list + NIP-66 discovery + NIP-11 probes',
      'Refreshes every 60 seconds',
    ],
    sourceTags: [],
    keyFiles: [
      { path: 'src/hooks/useIndexStats.ts', note: 'Per-relay fan-out + aggregation' },
      { path: 'src/lib/sip01-utils.ts', note: 'Byte-compatible validation port' },
    ],
  },
];

/** Lineage strip — how the engines evolved (from the Dsearch README). */
export const LINEAGE = [
  { name: '0xSearchstr', note: 'the original aggregator' },
  { name: 'UNCAGED-ENGINE', note: 'the minimal template' },
  { name: '0xPresearchstr', note: 'the community fork' },
  { name: 'Dsearch', note: 'the independent ecosystem' },
];

/** The scout / indexer split (from the Crawlstr README). */
export const NODE_CLASSES = [
  {
    name: 'Crawlstr',
    cls: 'lightweight scout',
    motto: '"I found something"',
    rows: [
      ['Role', 'Human-directed & random discovery'],
      ['Seeds', 'You paste a URL, or Random Scout picks'],
      ['Queue', 'Small, session-scoped'],
      ['Device', 'Any browser, incl. a phone on WiFi'],
    ],
  },
  {
    name: 'indexstr',
    cls: 'heavyweight indexer',
    motto: '"I operate indexing capacity"',
    rows: [
      ['Role', 'Systematic distributed crawling'],
      ['Seeds', 'Bundled curated SQLite collections'],
      ['Queue', 'Massive, sharded across 256 slots'],
      ['Device', 'Desktop/VPS-class contribution'],
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
