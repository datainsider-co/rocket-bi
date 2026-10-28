/** A zone's title, with "(optional)" when the chart builds without it (v1 `DropArea` header). */
export function ZoneTitleView({ title, optional }: { title: string; optional: boolean }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="font-medium">{title}</span>
      {optional && <span className="text-xs text-black/45">(optional)</span>}
    </div>
  );
}
