import { CORE_TAGS, EXTENSION_RULES, EXTENSION_TAGS, LINKS, SIP01, type TagSpec } from '@/lib/sip01';
import { Panel, SectionHeader } from '@/components/pd';

function TagTable({ tags, label }: { tags: TagSpec[]; label: string }) {
  return (
    <Panel label={label} pad={false}>
      <div className="max-h-[400px] overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-[#0b1120]">
            <tr className="border-b border-[#1a2540]">
              {['tag', 'req', 'shape', 'indexed', 'purpose'].map((h) => (
                <th
                  key={h}
                  className={`font-mono-pd px-3 py-2 text-left text-[9px] font-medium uppercase tracking-[0.18em] text-[#7c87a0] ${
                    h === 'shape' ? 'hidden lg:table-cell' : ''} ${h === 'purpose' ? 'hidden md:table-cell' : ''}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tags.map((t) => (
              <tr key={t.tag} className="border-b border-[#1a2540]/60 last:border-0 hover:bg-[#111a2b]/60">
                <td className="font-mono-pd px-3 py-2 text-[11px] font-bold text-[#f0b45a]">
                  {t.tag}
                  {t.location && <span className="ml-1 text-[9px] font-normal text-[#7c87a0]">·{t.location}</span>}
                </td>
                <td className="font-mono-pd px-3 py-2 text-[10px]">
                  {t.requirement === 'required' ? (
                    <span className="text-[#f87171]">REQ</span>
                  ) : (
                    <span className="text-[#7c87a0]">opt</span>
                  )}
                </td>
                <td className="font-mono-pd hidden px-3 py-2 text-[10px] text-[#7c87a0] lg:table-cell">{t.shape}</td>
                <td className="font-mono-pd px-3 py-2 text-[10px]">
                  {t.relayIndexed ? <span className="text-[#34d399]">yes</span> : <span className="text-[#7c87a0]">no</span>}
                </td>
                <td className="hidden px-3 py-2 text-[11px] leading-snug text-[#9aa3b8] md:table-cell">{t.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

const QUICKSTART = `const events = await nostr.query([
  { kinds: [${SIP01.kind}], '#t': ['nostr'], limit: 50 },
]);
// group by d → count distinct pubkeys
//   = independent indexer agreement

["REQ", "search", {
  "kinds": [${SIP01.kind}],
  "search": "bitcoin privacy site:github.com lang:en",
  "limit": 50
}]`;

export function ProtocolSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeader
        index="05"
        eyebrow="the protocol"
        title="Frozen core, open edges"
        right={
          <a
            href={LINKS.specRaw}
            target="_blank"
            rel="noreferrer"
            className="font-mono-pd border border-[#1a2540] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#7c87a0] transition-colors hover:border-[#f0b45a] hover:text-[#f0b45a]"
          >
            spec v{SIP01.version} →
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <Panel label="modular by design">
            <p className="text-[12.5px] leading-relaxed text-[#9aa3b8]">
              The core schema is frozen except through a <span className="font-mono-pd text-[#f0b45a]">v</span> bump.
              Everything else — document types, platforms, networks, future content hashes — ships
              through the extension tag registry (spec §9). Experiments use an{' '}
              <span className="font-mono-pd text-[#a855f7]">x-</span> prefix; registration is a PR.
            </p>
            <div className="font-mono-pd mt-4 space-y-1 border border-[#1a2540] bg-[#050810] p-3 text-[10.5px] text-[#a855f7]">
              <div>["type", "repository"]</div>
              <div>["platform", "github"]</div>
              <div>["network", "clearnet"]</div>
              <div>["country", "DE"]</div>
              <div>["mime", "application/pdf"]</div>
            </div>
          </Panel>

          <Panel label="extension rules · spec §9">
            <ul className="space-y-3">
              {EXTENSION_RULES.map((r, i) => (
                <li key={r.title} className="flex gap-3">
                  <span className="font-mono-pd shrink-0 text-[11px] text-[#f0b45a]">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <div className="text-[12px] font-semibold text-[#ede6d6]">{r.title}</div>
                    <div className="mt-0.5 text-[11.5px] leading-relaxed text-[#7c87a0]">{r.body}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel label="quickstart · read & search">
            <pre className="font-mono-pd overflow-x-auto border border-[#1a2540] bg-[#050810] p-3 text-[10.5px] leading-relaxed text-[#9aa3b8]">
              {QUICKSTART}
            </pre>
            <div className="font-mono-pd mt-3 text-[10px] uppercase tracking-[0.18em]">
              <a href={LINKS.guide} target="_blank" rel="noreferrer" className="text-[#f0b45a] hover:underline">
                full implementation guide →
              </a>
            </div>
          </Panel>

          <Panel label="what's next · sip-02 (draft)">
            <p className="text-[12.5px] leading-relaxed text-[#9aa3b8]">
              SIP-01 indexes <em>documents</em>. <span className="font-mono-pd text-[#a855f7]">SIP-02</span> is
              the draft query layer: structured search syntax (boolean,{' '}
              <span className="font-mono-pd">site:</span>, <span className="font-mono-pd">lang:</span>,{' '}
              <span className="font-mono-pd">tag:</span>, <span className="font-mono-pd">after:</span>) parsed
              into an AST and executed locally and authoritatively — operators are never stripped and hoped
              for. The Dsearch engine is the reference implementation seed.
            </p>
          </Panel>
        </div>

        <div className="space-y-6">
          <TagTable tags={CORE_TAGS} label="core tags · frozen schema v1" />
          <TagTable tags={EXTENSION_TAGS} label="registered extension tags · spec §9.2" />
        </div>
      </div>
    </section>
  );
}
