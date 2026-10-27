import { ColumnKind, columnKind } from './columnType.utils';

/** Glyphs of v1's `ic-data-date.svg`, `ic-data-number.svg` and `ic-data-string.svg`, drawn on a filled circle. */
const GLYPHS: Record<ColumnKind, string> = {
  [ColumnKind.Date]:
    'M11.5 5h-1V4h-1v1h-1V4h-1v1h-1V4h-1v1h-1a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-6a.5.5 0 0 0-.5-.5zm-.5 6H5V7h6v4z',
  [ColumnKind.Number]: 'M10.237 12v-.978H9.201V4H7v.957h1.1v6.065H7V12z',
  [ColumnKind.Text]:
    'M6.588 12.03a.706.706 0 0 1-.088-1.407l.088-.005.706-.001V5.411H5.412v.177c0 .36-.27.657-.618.7l-.088.006a.706.706 0 0 1-.7-.617L4 5.588v-.882c0-.36.27-.657.617-.7L4.706 4h6.588c.36 0 .657.27.7.617l.006.089v.882a.706.706 0 0 1-1.406.089l-.006-.089v-.176L8.705 5.41v5.206h.707a.706.706 0 0 1 .088 1.407l-.088.005H6.588z'
};

/** 16px icon for a column type. */
export function ColumnTypeIcon({ type }: { type: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <circle cx="8" cy="8" r="8" fill="var(--relationship-accent)" />
      <path d={GLYPHS[columnKind(type)]} fill="#fff" />
    </svg>
  );
}
