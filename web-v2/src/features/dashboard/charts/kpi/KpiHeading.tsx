import type { KpiModel } from './kpi.utils';

/** The title and subtitle of a themed layout. */
export function KpiHeading({ kpi }: { kpi: KpiModel }) {
  if (!kpi.title && !kpi.subtitle) return null;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {kpi.title && <div style={kpi.title.style}>{kpi.title.text}</div>}
      {kpi.subtitle && <div style={kpi.subtitle.style}>{kpi.subtitle.text}</div>}
    </div>
  );
}
