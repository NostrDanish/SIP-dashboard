/**
 * The app relay list — every relay this dashboard reads the SIP-01 index
 * from. Ported from the SIP-01 repo's relay settings model
 * (src/lib/appRelays.ts + AppRelayManager):
 *
 *  - fully editable in the Settings tab (add / remove / toggle / reset)
 *  - stored in this browser's localStorage, effective immediately
 *  - NEVER published to Nostr, never tied to any account
 *  - reset restores the shipped default (the ecosystem read set)
 *
 * The stats hook re-reads whenever the list changes.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { OBSERVATION_RELAYS } from '@/lib/sip01';

const LS_KEY = 'sipdash:app-relays:v1';

export interface AppRelay {
  url: string;
  read: boolean;
}

function readStored(): AppRelay[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const relays = parsed.filter(
      (r): r is AppRelay =>
        typeof r === 'object' && r !== null &&
        typeof (r as AppRelay).url === 'string' &&
        typeof (r as AppRelay).read === 'boolean',
    );
    return relays;
  } catch {
    return null;
  }
}

function writeStored(relays: AppRelay[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(relays));
  } catch {
    /* storage unavailable — non-fatal, session-only config */
  }
}

/** Normalize a relay URL: ws/wss only, trailing slash on bare hosts. */
export function normalizeRelayUrl(input: string): string | null {
  let url = input.trim();
  if (!url) return null;
  if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
    url = `wss://${url}`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'wss:' && parsed.protocol !== 'ws:') return null;
    const path = parsed.pathname === '/' ? '/' : parsed.pathname;
    return `${parsed.protocol}//${parsed.host}${path}`;
  } catch {
    return null;
  }
}

export function renderRelayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'wss:' || parsed.protocol === 'ws:') {
      return parsed.pathname === '/' ? parsed.host : parsed.host + parsed.pathname;
    }
    return parsed.href;
  } catch {
    return url;
  }
}

/** The shipped default — the full ecosystem read set. */
export const DEFAULT_APP_RELAYS: AppRelay[] = OBSERVATION_RELAYS.map((url) => ({
  url,
  read: true,
}));

/** URLs that ship with the dashboard (shown as "built-in" in Settings). */
export const BUILTIN_RELAY_URLS = new Set(OBSERVATION_RELAYS);

interface RelayConfig {
  relays: AppRelay[];
  /** URLs with read=true — what the stats hook consumes. */
  readUrls: string[];
  isCustomized: boolean;
  addRelay: (input: string) => { ok: boolean; reason?: string };
  removeRelay: (url: string) => void;
  toggleRelay: (url: string) => void;
  resetDefaults: () => void;
}

const RelayConfigContext = createContext<RelayConfig | null>(null);

export function RelayConfigProvider({ children }: { children: ReactNode }) {
  const [relays, setRelays] = useState<AppRelay[]>(() => readStored() ?? DEFAULT_APP_RELAYS);

  const save = useCallback((next: AppRelay[]) => {
    setRelays(next);
    writeStored(next);
  }, []);

  const addRelay = useCallback(
    (input: string) => {
      const normalized = normalizeRelayUrl(input);
      if (!normalized) return { ok: false, reason: 'invalid URL — use wss://relay.example.com' };
      if (relays.some((r) => r.url === normalized)) return { ok: false, reason: 'already in the list' };
      save([...relays, { url: normalized, read: true }]);
      return { ok: true };
    },
    [relays, save],
  );

  const removeRelay = useCallback(
    (url: string) => save(relays.filter((r) => r.url !== url)),
    [relays, save],
  );

  const toggleRelay = useCallback(
    (url: string) => save(relays.map((r) => (r.url === url ? { ...r, read: !r.read } : r))),
    [relays, save],
  );

  const resetDefaults = useCallback(() => save(DEFAULT_APP_RELAYS), [save]);

  const value = useMemo<RelayConfig>(() => {
    const readUrls = relays.filter((r) => r.read).map((r) => r.url);
    const isCustomized =
      relays.length !== DEFAULT_APP_RELAYS.length ||
      relays.some((r) => !BUILTIN_RELAY_URLS.has(r.url) || !r.read);
    return { relays, readUrls, isCustomized, addRelay, removeRelay, toggleRelay, resetDefaults };
  }, [relays, addRelay, removeRelay, toggleRelay, resetDefaults]);

  return <RelayConfigContext.Provider value={value}>{children}</RelayConfigContext.Provider>;
}

export function useRelayConfig(): RelayConfig {
  const ctx = useContext(RelayConfigContext);
  if (!ctx) throw new Error('useRelayConfig must be used inside RelayConfigProvider');
  return ctx;
}
