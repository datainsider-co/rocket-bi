import type { KpiModel } from './kpi.utils';

/** A themed layout's icon; `large` for the area layout (v1 89px). */
export function KpiIcon({ icon, large = false }: { icon: KpiModel['icon']; large?: boolean }) {
  if (!icon) return null;
  return (
    <div className={`flex shrink-0 items-center justify-center ${large ? 'size-[89px]' : 'size-12'}`} style={icon.style}>
      <i className={`${icon.className} ${large ? 'text-5xl' : 'text-2xl'}`} />
    </div>
  );
}
