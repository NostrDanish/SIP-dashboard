/** Dashboard tabs — hash-routed so every view is linkable from a static host. */
export const TABS = [
  { id: 'overview', index: '00', label: 'Overview' },
  { id: 'network', index: '02', label: 'Network' },
  { id: 'index', index: '03', label: 'Index' },
  { id: 'ecosystem', index: '04', label: 'Ecosystem' },
  { id: 'protocol', index: '05', label: 'Protocol' },
  { id: 'settings', index: '06', label: 'Settings' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

export function tabFromHash(hash: string): TabId {
  const id = hash.replace(/^#\/?/, '') as TabId;
  return TABS.some((t) => t.id === id) ? id : 'overview';
}
