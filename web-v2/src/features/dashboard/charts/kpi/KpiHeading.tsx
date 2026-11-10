import type { KpiModel } from './kpi.utils';

/** The title and subtitle of a themed layout (v1 `.kpi-widget--info`): the subtitle 8px under the title. */
export function KpiHeading({ kpi }: { kpi: KpiModel }) {
  if (!kpi.title && !kpi.subtitle) return null;
  return (
    <div className="kpi__info">
      {kpi.title && <div style={kpi.title.style}>{kpi.title.text}</div>}
      {kpi.subtitle && (
        <div className="kpi__info-subtitle" style={kpi.subtitle.style}>
          {kpi.subtitle.text}
        </div>
      )}
    </div>
  );
}
