/**
 * SIP-01 (Search Index Protocol) — browser port of the reference
 * implementation. Byte-compatible with every ecosystem implementation:
 *
 *   - 0xSearchstr / UNCAGED-ENGINE  src/lib/webIndex.ts   (publisher/reader)
 *   - Crwalstr                      src/crawler/webIndex.ts (crawler)
 *   - UNCAGED-Index-Relay           src/web-document.ts     (validator)
 *
 * Ported from github.com/NostrDanish/SIP-01 src/lib/sip01-utils.ts with a
 * minimal local event type so the dashboard stays library-agnostic.
 */

/** Minimal Nostr event shape (compatible with nostr-tools' Event). */
export interface SipEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig?: string;
}

/** Web Index Observation kind (addressable range). */
export const SIP01_KIND = 39697;

/** Current schema version (the `v` tag). */
export const SIP01_SCHEMA_VERSION = '1';

/** d-tag namespace prefix (SIP-01 §3). */
export const SIP01_D_PREFIX = 'widx:';

/* Hard caps (spec §5/§6) */
export const MAX_URL_LEN = 2048;
export const MAX_TITLE_LEN = 300;
export const MAX_DESCRIPTION_LEN = 1000;
export const MAX_IMAGE_LEN = 2048;
export const MAX_ALT_LEN = 1000;
export const MAX_SOURCE_LEN = 100;
export const MAX_TOPICS = 8;

/** Tracking parameters stripped during normalization (spec §7 step 5). */
export const TRACKING_PARAMS: readonly string[] = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'dclid', 'mc_cid', 'mc_eid', 'igshid', 'ref_src',
  'spm', 'si',
];

const TRACKING_SET = new Set(TRACKING_PARAMS);

/** Topic tag shape (spec §6). */
export const TOPIC_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;

/** Extension keyword shape (spec §9.1 rule 5). */
export const EXTENSION_VALUE_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,49}$/;

/** MIME type with optional parameters. */
export const MIME_RE =
  /^[a-zA-Z0-9][a-zA-Z0-9!#$&^_.+-]{0,126}\/[a-zA-Z0-9][a-zA-Z0-9!#$&^_.+-]{0,126}(;\s*[^\s;=]+=[^\s;]+)*$/;

/**
 * Normalize a URL per SIP-01 §7. Implementations across the ecosystem MUST
 * produce byte-identical output for the same page or `d`-tag deduplication
 * breaks. Returns null for invalid or non-http(s) URLs.
 */
export function normalizeIndexUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  // 2. Strip a leading www. (scheme/host are lowercased by the parser).
  url.hostname = url.hostname.replace(/^www\./, '');

  // 3. Default ports.
  if (
    (url.protocol === 'http:' && url.port === '80') ||
    (url.protocol === 'https:' && url.port === '443')
  ) {
    url.port = '';
  }

  // 4. Fragment never identifies content for indexing purposes.
  url.hash = '';

  // 5–6. Strip tracking params, keep everything else, sort deterministically.
  const params = [...url.searchParams.entries()]
    .filter(([key]) => !TRACKING_SET.has(key.toLowerCase()))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  url.search = '';
  for (const [key, value] of params) url.searchParams.append(key, value);

  // 7. Trailing slash on non-root paths.
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}

/** SHA-256 hex (lowercase) of a UTF-8 string. */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** URL identity (spec §3): "widx:" + first 32 hex chars of sha256(normalized). */
export async function documentId(normalizedUrl: string): Promise<string> {
  const hex = await sha256Hex(normalizedUrl);
  return `${SIP01_D_PREFIX}${hex.slice(0, 32)}`;
}

/** Content identity (spec §8): sha256(title + "\n" + description). */
export async function contentHash(title: string, description = ''): Promise<string> {
  return sha256Hex(`${title}\n${description}`);
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

export interface Sip01Observation {
  d: string;
  url: string;
  host: string;
  title: string;
  description: string;
  image?: string;
  topics: string[];
  language?: string;
  contentHash?: string;
  published?: number;
  source?: string;
  extensions: Record<string, string>;
  observedAt: number;
  indexer: string;
  event: SipEvent;
}

function tagValue(event: SipEvent, name: string): string | undefined {
  return event.tags.find((t) => t[0] === name && t[1])?.[1];
}

/**
 * Parse a kind 39697 event into a display-ready observation. Normalizes the
 * URL the same way publishers do, so aggregation groups byte-identically.
 * Returns null for events that miss the required d/u or a title.
 */
export function parseSip01Event(event: SipEvent): Sip01Observation | null {
  if (event.kind !== SIP01_KIND) return null;

  const d = tagValue(event, 'd');
  const u = tagValue(event, 'u');
  if (!d || !u) return null;
  const url = normalizeIndexUrl(u);
  if (!url) return null;

  let title = '';
  let description = '';
  let image: string | undefined;
  try {
    const parsed = JSON.parse(event.content) as Record<string, unknown>;
    title = typeof parsed.title === 'string' ? parsed.title.trim().slice(0, MAX_TITLE_LEN) : '';
    description = typeof parsed.description === 'string' ? parsed.description.trim().slice(0, MAX_DESCRIPTION_LEN) : '';
    if (typeof parsed.image === 'string' && /^https:\/\//i.test(parsed.image)) {
      image = parsed.image.slice(0, MAX_IMAGE_LEN);
    }
  } catch {
    return null;
  }
  if (!title) return null;

  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }

  const publishedTag = tagValue(event, 'published');
  const published = publishedTag ? parseInt(publishedTag, 10) : NaN;

  const extensions: Record<string, string> = {};
  for (const name of ['type', 'platform', 'category', 'network', 'country', 'mime']) {
    const value = tagValue(event, name);
    if (value !== undefined) extensions[name] = value;
  }

  return {
    d,
    url,
    host,
    title,
    description,
    image,
    topics: event.tags.filter(([n]) => n === 't').map(([, v]) => v).slice(0, MAX_TOPICS),
    language: tagValue(event, 'l'),
    contentHash: tagValue(event, 'x'),
    published: Number.isFinite(published) ? published : undefined,
    source: tagValue(event, 'source'),
    extensions,
    observedAt: event.created_at,
    indexer: event.pubkey,
    event,
  };
}

/* ------------------------------------------------------------------ */
/* Validation (spec §5/§6 + relay profile §1)                          */
/* ------------------------------------------------------------------ */

export interface Sip01Validation {
  valid: boolean;
  errors: string[];
  notices: string[];
}

function tagValues(event: SipEvent, name: string): string[] {
  return event.tags.filter((t) => t[0] === name && t[1]).map((t) => t[1]);
}

/**
 * Fully validate a kind 39697 event client-side, mirroring the UNCAGED Index
 * Relay's ingestion rules (SIP-01 §18 applied by the reader). Async because
 * the `d` ↔ `u` and `x` ↔ content checks require SHA-256.
 */
export async function validateSip01Event(event: SipEvent): Promise<Sip01Validation> {
  const errors: string[] = [];
  const notices: string[] = [];

  if (event.kind !== SIP01_KIND) {
    return { valid: false, errors: [`wrong kind (expected ${SIP01_KIND}, got ${event.kind})`], notices };
  }

  // Required tags: exactly one d, u, v, alt each.
  const dTags = tagValues(event, 'd');
  if (dTags.length === 0) errors.push('missing d tag');
  if (dTags.length > 1) errors.push('multiple d tags');

  const uTags = tagValues(event, 'u');
  if (uTags.length === 0) errors.push('missing u tag');
  if (uTags.length > 1) errors.push('multiple u tags');

  const vTags = tagValues(event, 'v');
  if (vTags.length === 0) errors.push('missing v tag');
  else if (vTags.length > 1) errors.push('multiple v tags');
  else if (vTags[0] !== SIP01_SCHEMA_VERSION) {
    errors.push(`unsupported web document schema version "${vTags[0]}"`);
  }

  const altTags = event.tags.filter((t) => t[0] === 'alt');
  if (altTags.length === 0 || !altTags[0][1]?.trim()) errors.push('missing alt tag');
  else if (altTags.length > 1) errors.push('multiple alt tags');
  else if (altTags[0][1].length > MAX_ALT_LEN) errors.push(`alt tag exceeds ${MAX_ALT_LEN} characters`);

  // URL allowlist + d ↔ normalized u consistency.
  const uTag = uTags[0];
  let normalized: string | null = null;
  if (uTag !== undefined) {
    if (uTag.length > MAX_URL_LEN) errors.push(`u tag exceeds ${MAX_URL_LEN} characters`);
    normalized = normalizeIndexUrl(uTag);
    if (!normalized) {
      errors.push('u tag is not a valid http(s) URL');
    } else if (dTags.length === 1) {
      const expected = await documentId(normalized);
      if (dTags[0] !== expected) {
        errors.push('d tag does not match the normalized u tag (widx: + sha256(u)[0:32])');
      }
    }
  }

  // Content JSON.
  let title = '';
  let description: string | undefined;
  if (!event.content) {
    errors.push('content is not valid JSON with a title');
  } else {
    try {
      const parsed: unknown = JSON.parse(event.content);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        errors.push('content is not valid JSON with a title');
      } else {
        const record = parsed as Record<string, unknown>;
        if (typeof record.title !== 'string') {
          errors.push('content is not valid JSON with a title');
        } else {
          title = record.title;
          const trimmed = title.trim();
          if (trimmed.length === 0 || trimmed.length > MAX_TITLE_LEN) {
            errors.push(`title must be 1-${MAX_TITLE_LEN} characters`);
          }
        }
        if (typeof record.description === 'string') {
          description = record.description;
          if (description.length > MAX_DESCRIPTION_LEN) {
            errors.push(`description exceeds ${MAX_DESCRIPTION_LEN} characters`);
          }
        }
        if (typeof record.image === 'string') {
          try {
            if (new URL(record.image).protocol !== 'https:') {
              errors.push('image must be an https URL');
            }
          } catch {
            errors.push('image must be an https URL');
          }
        }
      }
    } catch {
      errors.push('content is not valid JSON with a title');
    }
  }

  // Optional tags, validated when present.
  const topics = event.tags.filter((t) => t[0] === 't');
  if (topics.length > MAX_TOPICS) errors.push(`more than ${MAX_TOPICS} topic tags`);
  for (const topic of topics) {
    if (!topic[1] || !TOPIC_RE.test(topic[1])) {
      errors.push('topic (t) tags must be lowercase alphanumeric words');
      break;
    }
  }

  const lang = tagValue(event, 'l');
  if (lang !== undefined && !/^[a-z]{2}$/.test(lang)) {
    errors.push('l tag is not a valid ISO 639-1 language code');
  }

  const x = tagValue(event, 'x');
  if (x !== undefined) {
    if (!/^[0-9a-f]{64}$/.test(x)) {
      errors.push('x tag must be a lowercase hex sha256 digest');
    } else if (title) {
      const expected = await contentHash(title, description ?? '');
      if (x !== expected) errors.push('x tag does not match sha256(title + \\n + description)');
    }
  }

  const published = tagValue(event, 'published');
  if (published !== undefined && !/^\d{1,16}$/.test(published)) {
    errors.push('published tag must be a unix timestamp in seconds');
  }

  const source = tagValue(event, 'source');
  if (source !== undefined && source.length > MAX_SOURCE_LEN) {
    errors.push(`source tag exceeds ${MAX_SOURCE_LEN} characters`);
  }

  // Registered extension tags (spec §9.2).
  for (const name of ['type', 'platform', 'category', 'network']) {
    const value = tagValue(event, name);
    if (value !== undefined && !EXTENSION_VALUE_RE.test(value)) {
      errors.push(`${name} tag is not a valid keyword`);
    }
  }

  const country = tagValue(event, 'country');
  if (country !== undefined && !/^[a-zA-Z]{2}$/.test(country)) {
    errors.push('country tag must be an ISO 3166-1 alpha-2 code');
  }

  const mime = tagValue(event, 'mime');
  if (mime !== undefined && !MIME_RE.test(mime)) {
    errors.push('mime tag is not a valid MIME type');
  }

  return { valid: errors.length === 0, errors, notices };
}
