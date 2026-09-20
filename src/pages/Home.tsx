import { useIndexStats } from '@/hooks/useIndexStats';
import { Header } from '@/sections/Header';
import { Ticker } from '@/sections/Ticker';
import { Hero } from '@/sections/Hero';
import { MissionControl } from '@/sections/MissionControl';
import { NetworkSection } from '@/sections/NetworkSection';
import { IndexSection } from '@/sections/IndexSection';
import { EcosystemSection } from '@/sections/EcosystemSection';
import { ProtocolSection } from '@/sections/ProtocolSection';
import { Footer } from '@/sections/Footer';

export default function Home() {
  const { stats, loading, error } = useIndexStats();

  return (
    <div className="scanlines min-h-screen bg-[#050810]">
      <Header live={!!stats?.hasData} fetchedAt={stats?.fetchedAt} />
      <Ticker stats={stats} />
      <main>
        <Hero stats={stats} />
        {error && (
          <div className="font-mono-pd mx-auto mb-8 max-w-7xl px-4 sm:px-6">
            <div className="border border-[#f87171]/50 bg-[#f87171]/10 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-[#f87171]">
              relay read error — {error}. retries on next refresh cycle.
            </div>
          </div>
        )}
        <MissionControl stats={stats} loading={loading} />
        <NetworkSection stats={stats} loading={loading} />
        <IndexSection stats={stats} loading={loading} />
        <EcosystemSection />
        <ProtocolSection />
      </main>
      <Footer />
    </div>
  );
}
