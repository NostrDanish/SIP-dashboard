# SIP-dashboard

**The main dashboard for [SIP-01](https://github.com/NostrDanish/SIP-01) — the Decentralized Search Index Protocol on Nostr.** Live network telemetry, ecosystem explorer, and relay control room — read directly from the ecosystem relays in your browser. Publishes nothing, tracks no one, trusts nothing it cannot recompute.

One shared decentralized index. Many independent indexers. Many independent search engines. No single owner.

## Tabs

- **Overview** — protocol hero, event anatomy, mission-control stats (observations, documents, indexers, hosts, self-reported crawler totals), the 256-shard coverage gauge, and client-side spec conformance (every sampled observation re-validated: `d ↔ u`, `x ↔ content`, tag shapes)
- **Network** — live crawler nodes (kind `16919` heartbeats), per-family cards with **v1/v2 version breakdowns** (Crawlstr scouts / indexstr network), freshest-heartbeat node table, per-relay provenance bars
- **Index** — observations per UTC day, top topics / hosts / languages / networks, indexer leaderboard, freshest-observations feed
- **Ecosystem** — deep profiles for every project: SIP-01 spec, sip-01-core, Dsearch, 0xSearchstr, 0xPresearchstr, UNCAGED-ENGINE, Crawlstr v1/v2, indexstr v1/v2, UNCAGED-Index-Relay, SIP-Booster-Relay (serverless worker cohort), Crawlstr-SIP-Relay — with live GitHub stats (stars, forks, last push) and on-chain contribution counters derived from the current observation window
- **Protocol** — the frozen core tag set, extension registry + rules, quickstart, and the SIP-02 (query layer) draft note
- **Settings** — the app relay list: add / remove / toggle / reset (stored locally, never published), automatic NIP-11 capability probes per relay (SIP-01 `uncaged_index` + NIP-50 badges + latency), and **auto-discovery** of NIP-50/SIP-01 relays (NIP-66 kind 30166 announcements → NIP-11 verification, one-click add — nothing is added automatically)

## Data layer

Everything is derived from the events themselves — no hardcoded indexer registry. Any crawler that starts publishing valid kind `39697` observations (or kind `16919` heartbeats) appears automatically.

- `src/lib/sip01-utils.ts` — byte-compatible port of the reference parse / validate / normalize (spec §5–§8)
- `src/lib/heartbeat.ts` — kind `16919` heartbeat parsing (indexstr schema) + source version detection
- `src/lib/relayDiscovery.ts` — NIP-66 + NIP-11 auto-discovery (ported from 0xSearchstr)
- `src/hooks/useIndexStats.ts` — per-relay fan-out with paging + timeouts, cross-relay dedup, aggregation (refreshes every 60s)
- `src/hooks/useRelayConfig.tsx` — the editable app relay list (localStorage, ported from the SIP-01 repo's settings model)

## Stack

React + TypeScript + Vite + Tailwind CSS + [nostr-tools](https://github.com/nbd-wtf/nostr-tools) + recharts. Theme: "Protocol Dark" — SIP-01 amber `#f0b45a` + Nostr purple `#8e30eb` on deep-space black.

## Develop

```bash
npm install
npm run dev
npm run build
```

## Links

- Spec: [`public/spec/SIP-01.md`](https://github.com/NostrDanish/SIP-01/blob/main/public/spec/SIP-01.md) (v1.2)
- Documentation site: [sip.shakespeare.wtf](https://sip.shakespeare.wtf/)
- Implementation guide: [`docs/IMPLEMENTATION-GUIDE.md`](https://github.com/NostrDanish/SIP-01/blob/main/docs/IMPLEMENTATION-GUIDE.md)
- Flagship engine: [dsearch.com](https://dsearch.com)
