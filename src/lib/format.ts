/** Display helpers for the dashboard. */

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function timeAgo(unixSeconds: number, now = Date.now()): string {
  const delta = Math.max(0, Math.floor(now / 1000) - unixSeconds);
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
}

export function shortKey(pubkey: string, chars = 8): string {
  if (pubkey.length <= chars * 2) return pubkey;
  return `${pubkey.slice(0, chars)}…${pubkey.slice(-4)}`;
}

export function relayHost(url: string): string {
  return url.replace(/^wss:\/\//, '').replace(/\/$/, '');
}

export function formatDay(isoDay: string): string {
  const d = new Date(`${isoDay}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', { hour12: false });
}
