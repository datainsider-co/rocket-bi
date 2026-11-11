import type { KpiModel } from './kpi.utils';

/** The title and subtitle of a plain layout (v1 `TableHeader`), each on one line. */
export function KpiPlainHeader({ kpi }: { kpi: KpiModel }) {
  if (!kpi.title && !kpi.subtitle) return null;
  return (
    <div className="kpi__header">
      {kpi.title && (
        <div className="kpi__title" style={kpi.title.style} title={kpi.title.text}>
          {kpi.title.text}
        </div>
      )}
      {kpi.subtitle && (
        <div className="kpi__subtitle" style={kpi.subtitle.style} title={kpi.subtitle.text}>
          {kpi.subtitle.text}
        </div>
      )}
    </div>
  );
}
