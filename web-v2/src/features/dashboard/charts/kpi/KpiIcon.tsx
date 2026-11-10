import type { KpiModel } from './kpi.utils';

/** A themed layout's icon (v1 `.kpi-widget--icon`): a 32px glyph in a 48px box; `large` for the area layout's 59px in 89px. */
export function KpiIcon({ icon, large = false }: { icon: KpiModel['icon']; large?: boolean }) {
  if (!icon) return null;
  return (
    <div className={`kpi__icon${large ? ' kpi__icon--large' : ''}`} style={icon.style}>
      <i className={icon.className} />
    </div>
  );
}
