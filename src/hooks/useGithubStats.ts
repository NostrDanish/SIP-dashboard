/**
 * Live GitHub stats for the ecosystem repos — stars, forks, issues, last
 * push, language. Fetched client-side from the public GitHub API (no token;
 * 60 req/hr shared budget, so results are cached in localStorage for 30
 * minutes). Every card degrades gracefully when the API is rate-limited.
 */
import { useEffect, useState } from 'react';

const LS_KEY = 'sipdash:github-stats:v1';
const CACHE_TTL_MS = 30 * 60 * 1000;

export interface RepoStat {
  repo: string;
  stars: number;
  forks: number;
  openIssues: number;
  pushedAt: string;
  createdAt: string;
  language: string | null;
  description: string | null;
}

interface CacheShape {
  fetchedAt: number;
  stats: Record<string, RepoStat>;
}

function readCache(): CacheShape | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheShape;
    if (typeof parsed?.fetchedAt !== 'number' || typeof parsed?.stats !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(stats: Record<string, RepoStat>): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ fetchedAt: Date.now(), stats }));
  } catch {
    /* non-fatal */
  }
}

export function useGithubStats(repos: string[]) {
  const [stats, setStats] = useState<Record<string, RepoStat>>(() => readCache()?.stats ?? {});
  const [loading, setLoading] = useState(false);
  const key = repos.join(',');

  useEffect(() => {
    const cache = readCache();
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      setStats(cache.stats);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function run() {
      const names = key.split(',').filter(Boolean);
      const settled = await Promise.allSettled(
        names.map(async (name) => {
          const res = await fetch(`https://api.github.com/repos/NostrDanish/${name}`, {
            headers: { Accept: 'application/vnd.github+json' },
          });
          if (!res.ok) throw new Error(String(res.status));
          const j = await res.json();
          return {
            repo: name,
            stars: j.stargazers_count ?? 0,
            forks: j.forks_count ?? 0,
            openIssues: j.open_issues_count ?? 0,
            pushedAt: j.pushed_at ?? '',
            createdAt: j.created_at ?? '',
            language: j.language ?? null,
            description: j.description ?? null,
          } satisfies RepoStat;
        }),
      );
      if (cancelled) return;
      const next: Record<string, RepoStat> = { ...(cache?.stats ?? {}) };
      for (const [i, r] of settled.entries()) {
        if (r.status === 'fulfilled') next[names[i]] = r.value;
      }
      setStats(next);
      writeCache(next);
      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { stats, loading };
}
