# SIP-dashboard

**Live network telemetry for [SIP-01](https://github.com/NostrDanish/SIP-01) — the Decentralized Search Index Protocol on Nostr.**

One shared decentralized index. Many independent indexers. Many independent search engines. No single owner.

This dashboard reads the shared index **directly from the ecosystem relays in your browser** — it publishes nothing, tracks no one, and trusts nothing it cannot recompute.

## What it shows

- **Mission control** — observations read (kind `39697`), unique documents (distinct `d` tags), independent indexers, hosts observed, self-reported crawler totals
- **Shard coverage** — the 256-shard indexstr address space (`00`–`FF`), lit per live node heartbeat (kind `16919`, 1h TTL)
- **Spec conformance** — every sampled observation re-validated client-side (`d ↔ u`, `x ↔ content`, tag shapes) against the UNCAGED Index Relay's ingestion rules
- **Node status** — live crawler nodes (Crawlstr scouts / indexstr network), per-software family cards, freshest heartbeats
- **Per-relay coverage** — provenance for every event: crawler publish pools ∪ NIP-50 search relays
- **The shared index** — observations per UTC day, top topics / hosts / languages / networks, indexer leaderboard, freshest observations
- **Ecosystem & protocol** — all repos, the frozen core tag set, the extension registry, quickstart

## Data layer

Everything is derived from the events themselves — no hardcoded indexer registry. Any crawler that starts publishing valid kind `39697` observations (or kind `16919` heartbeats) appears automatically.

- `src/lib/sip01-utils.ts` — byte-compatible port of the reference parse / validate / normalize (spec §5–§8)
- `src/lib/heartbeat.ts` — kind `16919` heartbeat parsing (indexstr schema)
- `src/hooks/useIndexStats.ts` — per-relay fan-out with paging + timeouts, cross-relay dedup, aggregation (refreshes every 60s)

## Stack

React + TypeScript + Vite + Tailwind CSS + [nostr-tools](https://github.com/nbd-wtf/nostr-tools) + recharts. Theme: "Protocol Dark" — SIP-01 amber `#f0b45a` + Nostr purple `#8e30eb` on deep-space black.

## Develop

```bash
npm install
npm run dev
npm run build
```

## CI

GitHub Actions workflow (lint → build → dist artifact) is ready in the repo as `.github/workflows/ci.yml`. If it's not on the default branch yet, add it locally:

```bash
git clone https://github.com/NostrDanish/SIP-dashboard.git
cd SIP-dashboard
# copy ci.yml into .github/workflows/ then:
git add .github/workflows/ci.yml && git commit -m "Add frontend CI" && git push
```

## Links

- Spec: [`public/spec/SIP-01.md`](https://github.com/NostrDanish/SIP-01/blob/main/public/spec/SIP-01.md) (v1.2)
- Documentation site: [sip.shakespeare.wtf](https://sip.shakespeare.wtf/)
- Implementation guide: [`docs/IMPLEMENTATION-GUIDE.md`](https://github.com/NostrDanish/SIP-01/blob/main/docs/IMPLEMENTATION-GUIDE.md)
