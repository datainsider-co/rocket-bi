import './ConfigPanel.css';

/** A zone's title, with "(optional)" when the chart builds without it (v1 `DropArea` header). */
export function ZoneTitleView({ title, optional }: { title: string; optional: boolean }) {
  return (
    <div className="config-zone__title">
      <span>{title}</span>
      {optional && <span className="config-zone__optional">(optional)</span>}
    </div>
  );
}
