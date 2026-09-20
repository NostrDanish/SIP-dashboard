import { useCallback, useEffect, useState } from 'react';
import { useIndexStats } from '@/hooks/useIndexStats';
import { useRelayConfig } from '@/hooks/useRelayConfig';
import { tabFromHash, type TabId } from '@/lib/tabs';
import { Header } from '@/sections/Header';
import { Ticker } from '@/sections/Ticker';
import { Hero } from '@/sections/Hero';
import { MissionControl } from '@/sections/MissionControl';
import { NetworkSection } from '@/sections/NetworkSection';
import { IndexSection } from '@/sections/IndexSection';
import { EcosystemSection } from '@/sections/EcosystemSection';
import { ProtocolSection } from '@/sections/ProtocolSection';
import { SettingsSection } from '@/sections/SettingsSection';
import { Footer } from '@/sections/Footer';

export default function Home() {
  const { readUrls } = useRelayConfig();
  const { stats, loading, error } = useIndexStats(readUrls);
  const [tab, setTab] = useState<TabId>(() => tabFromHash(window.location.hash));

  const goto = useCallback((t: TabId) => {
    window.location.hash = `/${t}`;
    setTab(t);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
    const onHash = () => {
      setTab(tabFromHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <div className="scanlines min-h-screen bg-[#050810]">
      <Header live={!!stats?.hasData} fetchedAt={stats?.fetchedAt} tab={tab} onTab={goto} />
      <Ticker stats={stats} />
      <main>
        {error && (
          <div className="font-mono-pd mx-auto mt-8 max-w-7xl px-4 sm:px-6">
            <div className="border border-[#f87171]/50 bg-[#f87171]/10 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-[#f87171]">
              relay read error — {error}. retries on next refresh cycle.
            </div>
          </div>
        )}
        {tab === 'overview' && (
          <>
            <Hero stats={stats} />
            <MissionControl stats={stats} loading={loading} />
          </>
        )}
        {tab === 'network' && <NetworkSection stats={stats} loading={loading} />}
        {tab === 'index' && <IndexSection stats={stats} loading={loading} />}
        {tab === 'ecosystem' && <EcosystemSection stats={stats} />}
        {tab === 'protocol' && <ProtocolSection />}
        {tab === 'settings' && <SettingsSection />}
      </main>
      <Footer />
    </div>
  );
}
